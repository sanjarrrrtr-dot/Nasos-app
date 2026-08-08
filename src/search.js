// search.js
// Объединяет три системы фильтрации:
//   1) Собственная простая система (score/tier: RELIABLE/MEDIUM/LOW) —
//      используется для приоритета стран (KZ/RU/CN/EU) и для отсева
//      явно известных плохих хостов (KNOWN_LOW_QUALITY).
//   2) Балльная система из searchFilters.js (_score/_tier/_label/_reasons) —
//      более точная, отлавливает мусор (Wikipedia, госсайты, маркетплейсы,
//      агрегаторы, запчасти), который своя система не видит.
//   3) LLM-классификация через Claude API (classify-suppliers Edge Function) —
//      понимает СМЫСЛ сайта: завод / дилер / дистрибьютор / крупный поставщик /
//      посредник / частное лицо. Это то, чего эвристики 1 и 2 не могут дать.
//
// Результат считается мусором и убирается, если ЛЮБАЯ из систем считает
// его мусором:
//   - своя система: хост из KNOWN_LOW_QUALITY (явный чёрный список)
//   - searchFilters.js: _tier === Tier.HIDE
//   - LLM: _llmType === 'посредник' или 'частное_лицо'

import { scoreResult, Tier } from './searchFilters.js';

// Ключи не хранятся во фронтенде — запросы идут через Supabase Edge Functions,
// которые держат ключи на сервере (Supabase Dashboard → Edge Functions → Secrets).
const SEARCH_PROXY_URL = 'https://wmnsmqzxjmyaxblltngh.supabase.co/functions/v1/serper-search';
const CLASSIFY_PROXY_URL = 'https://wmnsmqzxjmyaxblltngh.supabase.co/functions/v1/classify-suppliers';
const SUPABASE_ANON_KEY = 'sb_publishable_Qznq_X8F17UR2fNrVIzFmA_MasgDTyQ'; // публичный ключ, это ок

export const COUNTRY_META = {
  KZ: { flag: '🇰🇿', label: 'Казахстан', gl: 'kz', hl: 'ru' },
  RU: { flag: '🇷🇺', label: 'Россия', gl: 'ru', hl: 'ru' },
  CN: { flag: '🇨🇳', label: 'Китай', gl: 'cn', hl: 'zh-cn' },
  EU: { flag: '🇪🇺', label: 'Европа', gl: 'de', hl: 'en' },
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

// Домены, которые сразу режем на уровне запроса (маркетплейсы, объявления)
const EXCLUDE_DOMAINS_BY_COUNTRY = {
  KZ: ['avito.ru', 'olx.kz', 'satu.kz', 'kaspi.kz'],
  RU: ['avito.ru', 'ozon.ru', 'wildberries.ru'],
  CN: ['alibaba.com/product-detail'],
  EU: [],
};

/**
 * Своя простая система скоринга.
 * @returns {{score:number, tier:'RELIABLE'|'MEDIUM'|'LOW', isJunk:boolean}}
 */
function scoreReliability(url, country) {
  let score = 0;
  const hostname = new URL(url).hostname.toLowerCase();

  if (KNOWN_RELIABLE_HOSTS.some(h => hostname.includes(h))) {
    score += 100;
    return { score, tier: 'RELIABLE', isJunk: false };
  }

  if (KNOWN_LOW_QUALITY.some(kw => hostname.includes(kw))) {
    score = 10;
    return { score, tier: 'LOW', isJunk: true };
  }

  const validDomains = RELIABLE_DOMAINS[country] || [];
  const tld = '.' + hostname.split('.').pop();
  if (validDomains.includes(tld)) {
    score += 60;
  } else {
    score += 20;
  }

  if (hostname.includes('alibaba') || hostname.includes('aliexpress')) {
    score -= 10;
  }
  if (hostname.length > 40 || hostname.includes('temp') || hostname.includes('shop')) {
    score -= 5;
  }

  let tier = 'LOW';
  if (score >= 60) tier = 'RELIABLE';
  else if (score >= 30) tier = 'MEDIUM';

  return { score, tier, isJunk: false };
}

// Запрос: модель в кавычках (точное совпадение) + минус-домены вместо минус-слов
function buildQuery(country, model) {
  const q = `"${model}"`;
  const excludeDomains = (EXCLUDE_DOMAINS_BY_COUNTRY[country] || [])
    .map(d => `-site:${d}`)
    .join(' ');

  if (country === 'KZ') return `${q} насос (завод OR дилер OR дистрибьютор) Казахстан ${excludeDomains}`;
  if (country === 'RU') return `${q} насос (завод OR дилер OR дистрибьютор) Россия ${excludeDomains}`;
  if (country === 'EU') return `${q} pump (manufacturer OR dealer OR distributor) Europe ${excludeDomains}`;
  if (country === 'CN') return `${q} pump manufacturer OR supplier ${excludeDomains}`;
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
        score: own.score,
        tier: own.tier,
        _ownJunk: own.isJunk,
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

/**
 * Отправляет пачку результатов в Claude API (через Edge Function
 * classify-suppliers) и получает тип поставщика для каждого URL.
 * Режется на чанки по 20 внутри самой функции — здесь просто один вызов.
 */
async function classifyBatch(items) {
  if (!items.length) return [];
  const payload = items.map(i => ({ url: i.link, title: i.title, snippet: i.snippet }));
  try {
    const res = await fetch(CLASSIFY_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
      body: JSON.stringify({ items: payload }),
    });
    const data = await res.json();
    return data.results || [];
  } catch (err) {
    console.error('classifyBatch failed:', err);
    return []; // при сбое просто не классифицируем — старые фильтры продолжат работать
  }
}

export function dedupeAndFilter(allItems) {
  const seen = new Set();
  const priority = { KZ: 1, RU: 2, CN: 3, EU: 4 };

  const filtered = allItems
    .filter((p) => {
      const text = ((p.title || '') + ' ' + (p.snippet || '')).toLowerCase();
      return !BAD_WORDS.some((w) => text.includes(w));
    })
    // мусор по любой из трёх систем (своя / searchFilters / LLM)
    .filter((p) => !p._ownJunk && p._tier !== Tier.HIDE)
    .filter((p) => !['посредник', 'частное_лицо'].includes(p._llmType))
    .filter((p) => {
      const key = (p.link || p.title || '').toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  return filtered.sort((a, b) => {
    const tierOrder = { RELIABLE: 0, MEDIUM: 1, LOW: 2 };
    const tierDiff = (tierOrder[a.tier] || 2) - (tierOrder[b.tier] || 2);
    if (tierDiff !== 0) return tierDiff;
    return (priority[a._country] || 5) - (priority[b._country] || 5);
  });
}

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
    supplierType: item._llmType || null,
    supplierTypeConfidence: item._llmConfidence || 0,
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
  const countries = ['KZ', 'RU', 'CN', 'EU'];
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

  // Классификация через Claude API — понимает смысл сайта
  const classified = await classifyBatch(allItems);
  const typeByUrl = new Map(classified.map(c => [c.url, c]));
  allItems.forEach(item => {
    const c = typeByUrl.get(item.link);
    item._llmType = c?.type || null;
    item._llmConfidence = c?.confidence || 0;
  });

  const filtered = dedupeAndFilter(allItems);

  const reliableItems = filtered.filter((p) => p.tier === 'RELIABLE').slice(0, 40);
  const allOtherItems = filtered.filter((p) => p.tier !== 'RELIABLE').slice(0, 40);

  const formattedItems = formatResultsForSupabase(reliableItems);

  return {
    items: formattedItems,
    allItems: allOtherItems,
    totalFound: reliableItems.length,
    totalFoundAll: allOtherItems.length,
    regionStatus,
  };
}
