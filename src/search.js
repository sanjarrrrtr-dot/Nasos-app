// search.js
// Объединяет две системы скоринга:
//   1) Собственная простая система (score/tier: RELIABLE/MEDIUM/LOW) —
//      используется для приоритета стран (KZ/RU/EU/CN) и для отсева
//      явно известных плохих хостов (KNOWN_LOW_QUALITY).
//   2) Балльная система из searchFilters.js (_score/_tier/_label/_reasons) —
//      более точная, отлавливает мусор (Wikipedia, госсайты, маркетплейсы,
//      агрегаторы, запчасти), который своя система не видит.
//
// Результат считается мусором и убирается, если ЛЮБАЯ из двух систем
// считает его мусором:
//   - своя система: хост из KNOWN_LOW_QUALITY (явный чёрный список)
//   - searchFilters.js: _tier === Tier.HIDE

import { scoreResult, Tier, guessRegionFromDomain } from './searchFilters.js';

// Ключ Serper больше НЕ хранится во фронтенде — запросы идут через
// Supabase Edge Function "serper-search", которая держит ключ на сервере
// (Supabase Dashboard → Edge Functions → Secrets → SERPER_KEY).
const SEARCH_PROXY_URL = 'https://wmnsmqzxjmyaxblltngh.supabase.co/functions/v1/serper-search';
const SUPABASE_ANON_KEY = 'sb_publishable_Qznq_X8F17UR2fNrVIzFmA_MasgDTyQ'; // публичный ключ, это ок

export const COUNTRY_META = {
  KZ: { flag: '🇰🇿', label: 'Казахстан', gl: 'kz', hl: 'ru' },
  RU: { flag: '🇷🇺', label: 'Россия', gl: 'ru', hl: 'ru' },
  EU: { flag: '🇪🇺', label: 'Европа', gl: 'de', hl: 'en' },
  CN: { flag: '🇨🇳', label: 'Китай', gl: 'cn', hl: 'zh-cn' },
};

const BAD_WORDS = ['посредник', 'перекупщик', 'reseller', 'broker', '中间商'];

// TIER система — определяем надёжность по домену/хостингу
const RELIABLE_DOMAINS = {
  KZ: ['.kz'],
  RU: ['.ru'],
  EU: ['.eu', '.de', '.fr', '.nl', '.be', '.at', '.ch', '.se', '.no', '.dk', '.pl', '.cz', '.sk', '.hu', '.ro', '.bg', '.hr', '.si', '.lt', '.lv', '.ee', '.pt', '.es', '.it', '.gr', '.ie', '.uk', '.fi', '.is'],
  CN: ['.cn'],
};

const KNOWN_RELIABLE_HOSTS = [
  'grundfos.com', 'ebara.com', 'xylem.com', 'sulzer.com', 'weir.com',
  'flowserve.com', 'itt.com', 'goulds.com', 'goulds-pumps.com',
  'alibaba.com', 'globalpiyasa.com',
];

const KNOWN_LOW_QUALITY = [
  'e-katalog', 'tolchek', 'lunda', 'satu', 'comfort-klimat', 'sistema-2000',
  'avelinprom', 'hydroalliance', 'nasosclub', 'nt-rt', 'teplosnab',
];

/**
 * Своя простая система скоринга.
 * @returns {{score:number, tier:'RELIABLE'|'MEDIUM'|'LOW', isJunk:boolean}}
 *   isJunk === true только если хост явно в чёрном списке KNOWN_LOW_QUALITY —
 *   это единственный сигнал "мусор" в собственной системе. Обычное
 *   несовпадение домена со страной даёт tier LOW, но НЕ isJunk (мы не хотим
 *   резать такие результаты только из-за этого).
 */
function scoreReliability(url, country) {
  let score = 0;
  const hostname = new URL(url).hostname.toLowerCase();

  // Проверяем известные надёжные бренды
  if (KNOWN_RELIABLE_HOSTS.some(h => hostname.includes(h))) {
    score += 100; // очень надёжные
    return { score, tier: 'RELIABLE', isJunk: false };
  }

  // Проверяем известный мусор
  if (KNOWN_LOW_QUALITY.some(kw => hostname.includes(kw))) {
    score = 10;
    return { score, tier: 'LOW', isJunk: true };
  }

  // Проверяем домен по стране
  const validDomains = RELIABLE_DOMAINS[country] || [];
  const tld = '.' + hostname.split('.').pop();
  if (validDomains.includes(tld)) {
    score += 60; // хороший домен по стране
  } else {
    score += 20; // не совпадает с доменом страны
  }

  // Штрафы за подозрительные признаки
  if (hostname.includes('alibaba') || hostname.includes('aliexpress')) {
    score -= 10; // китайские маркетплейсы — среднее качество
  }
  if (hostname.length > 40 || hostname.includes('temp') || hostname.includes('shop')) {
    score -= 5; // подозрительные хосты
  }

  // Определяем tier по score
  let tier = 'LOW';
  if (score >= 60) tier = 'RELIABLE';
  else if (score >= 30) tier = 'MEDIUM';

  return { score, tier, isJunk: false };
}

function buildQuery(country, model) {
  if (country === 'KZ') return `насос ${model} завод дилер дистрибьютор Казахстан`;
  if (country === 'RU') return `насос ${model} завод дилер дистрибьютор Россия`;
  if (country === 'EU') return `pump ${model} manufacturer dealer distributor Europe`;
  if (country === 'CN') return `${model} 泵 制造商 经销商`;
  return model;
}

function getCurrency(country) {
  const currencies = { KZ: 'тг', RU: 'руб', CN: '¥', EU: '€' };
  return currencies[country] || 'тг';
}

export async function searchCountry(country, model) {
  const meta = COUNTRY_META[country];
  try {
    const res = await fetch(SEARCH_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
      body: JSON.stringify({ q: buildQuery(country, model), gl: meta.gl, hl: meta.hl, num: 20 }),
    });
    const data = await res.json();
    if (data.message || data.error) {
      return { country, status: 'error', message: data.message || data.error, items: [] };
    }
    const items = Array.isArray(data.organic) ? data.organic : [];

    // Прогоняем каждый результат через ОБЕ системы скоринга
    const itemsWithScore = items.map((item) => {
      const own = scoreReliability(item.link, country);

      const adapted = {
        url: item.link,
        title: item.title,
        snippet: item.snippet,
        flag: meta.flag,
      };
      const filt = scoreResult(adapted);

      return {
        ...item,
        _country: country,
        // своя система (приоритет стран, как раньше)
        score: own.score,
        tier: own.tier,
        _ownJunk: own.isJunk,
        // балльная система из searchFilters.js
        _score: filt.score,
        _tier: filt.tier,
        _label: filt.label,
        _reasons: filt.reasons,
        _isPart: filt.isPart,
        _regionMismatch: filt.regionMismatch,
      };
    });

    return { country, status: items.length ? 'ok' : 'empty', items: itemsWithScore };
  } catch (err) {
    return { country, status: 'error', message: String(err.message || err), items: [] };
  }
}

function normalizeUrlKey(url) {
  try {
    const u = new URL(url);
    return (u.hostname.replace(/^www\./, '') + u.pathname.replace(/\/$/, '')).toLowerCase();
  } catch {
    return (url || '').toLowerCase();
  }
}

export function dedupeAndFilter(allItems) {
  const seen = new Set();
  const priority = { KZ: 1, CN: 2, RU: 3, EU: 4 };

  const filtered = allItems
    // старые стоп-слова
    .filter((p) => {
      const text = ((p.title || '') + ' ' + (p.snippet || '')).toLowerCase();
      return !BAD_WORDS.some((w) => text.includes(w));
    })
    // мусор по ЛЮБОЙ из двух систем
    .filter((p) => !p._ownJunk && p._tier !== Tier.HIDE)
    // дедупликация по нормализованному URL (домен+путь, без протокола/www/параметров) —
    // ловит одну и ту же страницу, даже если она попала в выдачу разных стран с разными хвостами ссылки
    .filter((p) => {
      const key = normalizeUrlKey(p.link) || (p.title || '').toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  // Сортируем по приоритету страны + надёжности (своя tier-система)
  return filtered.sort((a, b) => {
    const tierOrder = { RELIABLE: 0, MEDIUM: 1, LOW: 2 };
    const tierDiff = (tierOrder[a.tier] || 2) - (tierOrder[b.tier] || 2);
    if (tierDiff !== 0) return tierDiff;
    return (priority[a._country] || 5) - (priority[b._country] || 5);
  });
}

/**
 * Форматирует итоговые элементы для сохранения в Supabase.
 * Использует реально существующие поля после объединения систем:
 *   label   <- item._label   (из searchFilters.js)
 *   reasons <- item._reasons (из searchFilters.js)
 * Больше нет undefined-полей.
 */
export function formatResultsForSupabase(items) {
  return items.map((item, idx) => ({
    rank: idx + 1,
    title: item.title,
    url: item.link,
    snippet: item.snippet,
    flag: COUNTRY_META[item._country]?.flag,
    region: item._country,
    score: item.score,
    tier: item.tier,
    label: item._label,
    reasons: item._reasons,
    contact: {
      company_name: item.title.split(' ')[0],
      phone: null,
      email: null,
      website: new URL(item.link).hostname,
    },
    price: {
      value: null,
      currency: getCurrency(item._country),
      status: 'требуется уточнение',
    },
    verified: item.tier === 'RELIABLE',
  }));
}

const CLASSIFY_URL = 'https://wmnsmqzxjmyaxblltngh.supabase.co/functions/v1/classify-suppliers';
const LOG_URL = 'https://wmnsmqzxjmyaxblltngh.supabase.co/rest/v1/search_logs';
const SUPABASE_KEY_FOR_LOG = 'sb_publishable_Qznq_X8F17UR2fNrVIzFmA_MasgDTyQ';

// Сохраняем каждый реальный поиск в базу — чтобы потом можно было посмотреть,
// что искали и что нашлось, без доступа к телефону пользователя.
// "Fire and forget" — если запись не удалась, поиск на сайте всё равно не ломается.
function logSearch(query, grouped) {
  const totalResults = Object.values(grouped).reduce(
    (sum, g) => sum + g.factory.length + g.dealer.length,
    0
  );
  fetch(LOG_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_KEY_FOR_LOG,
      Authorization: `Bearer ${SUPABASE_KEY_FOR_LOG}`,
    },
    body: JSON.stringify({ query, total_results: totalResults, results: grouped }),
  }).catch(() => {}); // тихо игнорируем ошибку логирования, это не критично для пользователя
}

// Порядок стран и порядок типов внутри страны — как хочет клиент:
// сначала заводы, потом дилеры/дистрибьюторы/крупные поставщики.
const COUNTRY_ORDER = ['KZ', 'RU', 'CN', 'EU'];
const TYPE_TO_GROUP = {
  завод: 'factory',
  дилер: 'dealer',
  дистрибьютор: 'dealer',
  трейдер: 'dealer',
  крупный_поставщик: 'dealer',
};
const TYPE_LABEL = {
  завод: 'Завод',
  дилер: 'Дилер',
  дистрибьютор: 'Дистрибьютор',
  трейдер: 'Трейдер',
  крупный_поставщик: 'Крупный поставщик',
};
// Эти категории клиент просил убирать полностью — не показываем вообще.
const REJECTED_TYPES = ['посредник', 'частное_лицо'];

async function classifySuppliers(items, model) {
  if (!items.length) return [];
  const payload = items.map((it) => ({ url: it.link, title: it.title, snippet: it.snippet }));
  const res = await fetch(CLASSIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: payload, model }),
  });
  if (!res.ok) throw new Error('classify-suppliers error: ' + res.status);
  const data = await res.json();
  return data.results || [];
}

/**
 * Полный пайплайн: поиск по 4 странам → отсев явного мусора (старые фильтры) →
 * LLM-классификация (завод/дилер/дистрибьютор/крупный поставщик/посредник/частное лицо) →
 * группировка по странам (KZ→RU→CN→EU) и по типу (заводы сверху).
 */
// Резервная проверка по телефонному коду — используется, только когда домен
// не дал чёткого сигнала (.com и т.п.). Особенно важно для +7 — этот код общий
// у России и Казахстана, поэтому смотрим конкретный код города.
const RU_CITY_CODES = ['343','495','499','812','843','846','861','863','383','351','391','473','831','842','347','912'];
const KZ_CITY_CODES = ['727','717','7172','7212','7222','7232','7242','7252','7262','7272','7282','7292','7112','7182'];

function guessRegionFromPhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('86')) return 'CN';
  if (digits.startsWith('375') || digits.startsWith('380') || digits.startsWith('996') || digits.startsWith('998') || digits.startsWith('992') || digits.startsWith('993') || digits.startsWith('994') || digits.startsWith('995')) return null; // не одна из 4 целевых
  const EU_CODES = ['49','33','39','34','31','32','41','46','47','45','48','420','421','36','40','359','385','386','370','371','372','351','30','353','44','358','354'];
  for (const code of EU_CODES) {
    if (digits.startsWith(code)) return 'EU';
  }
  if (digits.startsWith('7')) {
    const rest = digits.slice(1); // после "7"
    if (RU_CITY_CODES.some((c) => rest.startsWith(c))) return 'RU';
    if (KZ_CITY_CODES.some((c) => rest.startsWith(c))) return 'KZ';
  }
  return null; // не смогли уверенно определить — не трогаем
}

export async function searchAndClassify(model, onProgress) {
  const countries = ['KZ', 'RU', 'CN', 'EU'];
  const results = [];
  for (const c of countries) {
    onProgress?.(c, 'loading');
    const r = await searchCountry(c, model);
    onProgress?.(c, r.status);
    results.push(r);
  }

  const allItems = [];
  for (const r of results) for (const item of r.items) allItems.push(item);

  // Старый отсев явного мусора (Wikipedia, госсайты, дубликаты) — оставляем,
  // это дёшево и снижает количество элементов, которые пойдут в LLM.
  const preFiltered = dedupeAndFilter(allItems).slice(0, 32); // теперь для каждого реально грузим страницу — держим в разумных пределах по времени

  onProgress?.('classify', 'loading');
  let classified = [];
  try {
    classified = await classifySuppliers(preFiltered, model);
  } catch (e) {
    onProgress?.('classify', 'error');
    throw e;
  }
  onProgress?.('classify', 'ok');

  const typeByUrl = new Map(classified.map((c) => [c.url, c]));

  const grouped = {};
  for (const code of COUNTRY_ORDER) grouped[code] = { factory: [], dealer: [] };

  for (const item of preFiltered) {
    const cls = typeByUrl.get(item.link);
    if (!cls || REJECTED_TYPES.includes(cls.type)) continue;
    // Проверку модели пропускаем строго только для дилеров/дистрибьюторов/трейдеров —
    // именно там опасно случайно показать "похожую, но не ту" модель.
    // Для официального сайта завода не режем: даже если конкретная модификация
    // не прописана дословно на странице, это всё равно тот же производитель.
    if (cls.modelMatch === false && cls.type !== 'завод') continue;
    const group = TYPE_TO_GROUP[cls.type];
    if (!group) continue;

    // Автопроверка страны: не доверяем вслепую тому, под каким страновым запросом
    // Google вернул сайт (item._country) — Google не строго фильтрует по стране,
    // поэтому в выдаче "для Казахстана" мог оказаться российский или белорусский сайт.
    // Смотрим реальный домен и решаем, что делать:
    //   - домен явно одной из 4 целевых стран, но НЕ той, что была в запросе → переносим в правильную
    //   - домен явно страны, которой нет в списке (Украина, Беларусь и т.д.) → убираем совсем
    //   - домен не даёт чёткого сигнала (.com и т.п.) → проверяем по телефонному коду
    //   - и телефон не дал сигнала → доверяем исходной стране запроса
    let hostname = '';
    try { hostname = new URL(item.link).hostname.replace(/^www\./, ''); } catch {}
    let realRegion = guessRegionFromDomain(hostname);
    if (!realRegion) realRegion = guessRegionFromPhone(cls.phone);
    let country = item._country;
    if (realRegion) {
      if (COUNTRY_ORDER.includes(realRegion)) {
        country = realRegion; // переносим в реально правильную страну
      } else {
        continue; // страна не входит в наш список (KZ/RU/CN/EU) — убираем результат целиком
      }
    }
    if (!grouped[country]) continue;

    grouped[country][group].push({
      title: item.title,
      url: item.link,
      snippet: item.snippet,
      typeLabel: TYPE_LABEL[cls.type],
      confidence: cls.confidence,
      price: cls.price || null,
      phone: cls.phone || null,
      email: cls.email || null,
    });
  }

  logSearch(model, grouped);
  return grouped;
}