const SERPER_KEY = '37e15324b8adf3b2e1e2536ac9e0459ac3cc7d2d';

export const COUNTRY_META = {
  KZ: { flag: '🇰🇿', label: 'Казахстан', gl: 'kz', hl: 'ru' },
  RU: { flag: '🇷🇺', label: 'Россия', gl: 'ru', hl: 'ru' },
  EU: { flag: '🇪🇺', label: 'Европа', gl: 'de', hl: 'en' },
  CN: { flag: '🇨🇳', label: 'Китай', gl: 'cn', hl: 'zh-cn' },
};

const BAD_WORDS = ['посредник', 'перекупщик', 'reseller', 'broker', '中间商'];

// Каталоги-агрегаторы и маркетплейсы — не заводы и не официальные дилеры,
// но словами из BAD_WORDS не ловятся, поэтому режем по домену отдельно.
const BLOCKED_DOMAINS = [
  'alibaba.com',
  '1688.com',
  'made-in-china.com',
  '51sole.com',
  'globalsources.com',
  'aliexpress.com',
  'dhgate.com',
  'ec21.com',
  'tradeindia.com',
  'indiamart.com',
  'exportersindia.com',
  'ebay.com',
  'amazon.com',
  'amazon.de',
  'wanted.chinadaily.com.cn',
  'china.cn',
];

function getDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
}

function isBlockedDomain(url) {
  const domain = getDomain(url);
  if (!domain) return false;
  return BLOCKED_DOMAINS.some((bad) => domain === bad || domain.endsWith('.' + bad));
}

// Пытаемся вытащить цену из сниппета (число + рядом валюта/символ).
// Возвращает число в условных единицах для сравнения (без конвертации валют) или null.
function extractPrice(text) {
  if (!text) return null;
  const match = text.match(
    /(?:[$€₽¥]|USD|EUR|RUB|CNY|KZT|₸)\s?([\d\s,.]{1,12}\d)|(\d[\d\s,.]{0,11}\d)\s?(?:[$€₽¥]|USD|EUR|RUB|CNY|KZT|₸|руб|тенге|元)/i,
  );
  if (!match) return null;
  const raw = (match[1] || match[2] || '').replace(/[\s,]/g, '');
  const num = parseFloat(raw);
  return Number.isFinite(num) ? num : null;
}

function buildQuery(country, model) {
  if (country === 'KZ') return `насос ${model} завод OR производитель OR дилер OR дистрибьютор -посредник -перекупщик Казахстан`;
  if (country === 'RU') return `насос ${model} завод OR производитель OR дилер OR дистрибьютор -посредник -перекупщик Россия`;
  if (country === 'EU') return `pump ${model} manufacturer OR dealer OR distributor -reseller -broker Europe`;
  if (country === 'CN') return `${model} 泵 制造商 OR 经销商 OR 代理商 -中间商`;
  return model;
}

export async function searchCountry(country, model) {
  const meta = COUNTRY_META[country];
  try {
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: buildQuery(country, model), gl: meta.gl, hl: meta.hl, num: 20 }),
    });
    const data = await res.json();
    if (data.message || data.error) {
      return { country, status: 'error', message: data.message || data.error, items: [] };
    }
    const items = Array.isArray(data.organic) ? data.organic : [];
    return { country, status: items.length ? 'ok' : 'empty', items };
  } catch (err) {
    return { country, status: 'error', message: String(err.message || err), items: [] };
  }
}

export function dedupeAndFilter(allItems) {
  const seen = new Set();
  const priority = { KZ: 1, RU: 2, CN: 3, EU: 4 };

  return allItems
    // словесный фильтр (посредник/reseller/中间商 и т.п.)
    .filter((p) => {
      const text = ((p.title || '') + ' ' + (p.snippet || '')).toLowerCase();
      return !BAD_WORDS.some((w) => text.includes(w));
    })
    // фильтр по доменам-каталогам (Alibaba/1688/51sole и т.п.)
    .filter((p) => !isBlockedDomain(p.link || ''))
    // дедупликация
    .filter((p) => {
      const key = (p.link || p.title || '').toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    // добавляем распознанную цену
    .map((p) => ({ ...p, _price: extractPrice(p.snippet || p.title || '') }))
    // сортировка: сначала по приоритету страны, внутри страны — по цене (дешевле сначала, без цены — в конец)
    .sort((a, b) => {
      const countryDiff = (priority[a._country] || 5) - (priority[b._country] || 5);
      if (countryDiff !== 0) return countryDiff;
      if (a._price == null && b._price == null) return 0;
      if (a._price == null) return 1;
      if (b._price == null) return -1;
      return a._price - b._price;
    });
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
    for (const item of r.items) allItems.push({ ...item, _country: r.country });
  }
  const finalItems = dedupeAndFilter(allItems);
  return { items: finalItems.slice(0, 40), totalFound: finalItems.length, regionStatus };
}
