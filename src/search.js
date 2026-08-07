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

import { scoreResult, Tier } from './searchFilters.js';

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
  if (country === 'KZ') return `насос ${model} завод OR производитель OR дилер OR дистрибьютор -посредник -перекупщик Казахстан`;
  if (country === 'RU') return `насос ${model} завод OR производитель OR дилер OR дистрибьютор -посредник -перекупщик Россия`;
  if (country === 'EU') return `pump ${model} manufacturer OR dealer OR distributor -reseller -broker Europe`;
  if (country === 'CN') return `${model} 泵 制造商 OR 经销商 OR 代理商 -中间商`;
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
    // дедупликация по ссылке/заголовку
    .filter((p) => {
      const key = (p.link || p.title || '').toLowerCase();
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

export async function searchAllCountries(model, onProgress) {
  const countries = ['KZ', 'RU', 'EU', 'CN'];
  const results = [];
  for (const c of countries) {
    onProgress?.(c, 'loading');
    const r = await searchCountry(c, model);
    onProgress?.(c, r.status);
    results.push(r);
  }

  const allItems = [];
  const regionStatus = {};
  for (const r of results) {
    regionStatus[r.country] = { status: r.status, message: r.message || null };
    for (const item of r.items) allItems.push(item);
  }

  // Фильтруем (обе системы) и сортируем
  const filtered = dedupeAndFilter(allItems);

  // Разделяем по своей tier-системе, как раньше
  const reliableItems = filtered.filter((p) => p.tier === 'RELIABLE').slice(0, 40);
  const allOtherItems = filtered.filter((p) => p.tier !== 'RELIABLE').slice(0, 40);

  // Форматируем результаты в JSON формат для Supabase
  const formattedItems = formatResultsForSupabase(reliableItems);

  return {
    items: formattedItems,
    allItems: allOtherItems,
    totalFound: reliableItems.length,
    totalFoundAll: allOtherItems.length,
    regionStatus,
  };
}
