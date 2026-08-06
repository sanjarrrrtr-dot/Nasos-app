const SERPER_KEY = '37e15324b8adf3b2e1e2536ac9e0459ac3cc7d2d';

export const COUNTRY_META = {
  KZ: { flag: '🇰🇿', label: 'Казахстан', gl: 'kz', hl: 'ru' },
  RU: { flag: '🇷🇺', label: 'Россия', gl: 'ru', hl: 'ru' },
  EU: { flag: '🇪🇺', label: 'Европа', gl: 'de', hl: 'en' },
  CN: { flag: '🇨🇳', label: 'Китай', gl: 'cn', hl: 'zh-cn' },
};

const BAD_WORDS = ['посредник', 'перекупщик', 'reseller', 'broker', '中间商'];

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

function getValidDomainsForCountry(country) {
  const domainMap = {
    KZ: ['.kz'],
    RU: ['.ru'],
    EU: ['.eu', '.de', '.fr', '.nl', '.be', '.at', '.ch', '.se', '.no', '.dk', '.pl', '.cz', '.sk', '.hu', '.ro', '.bg', '.hr', '.si', '.lt', '.lv', '.ee', '.pt', '.es', '.it', '.gr', '.ie', '.uk', '.fi', '.is'],
    CN: ['.cn'],
  };
  return domainMap[country] || [];
}

function getCountryFromDomain(url) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    // извлекаем расширение домена (последний .xxx)
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      const tld = '.' + parts[parts.length - 1];
      return tld;
    }
  } catch (e) {
    // некорректный URL, пропускаем
  }
  return null;
}

function isDomainVerified(p) {
  // проверяет, соответствует ли домен страны заявленному региону
  if (!p.link || !p._country) return false;
  const validDomains = getValidDomainsForCountry(p._country);
  if (validDomains.length === 0) return true; // если страна неизвестна, считаем проверенным
  const domainTld = getCountryFromDomain(p.link);
  return validDomains.some((d) => domainTld === d);
}

function dedupeByKey(items) {
  const seen = new Set();
  const priority = { KZ: 1, CN: 2, RU: 3, EU: 4 };
  return items
    .filter((p) => {
      const key = (p.link || p.title || '').toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => (priority[a._country] || 5) - (priority[b._country] || 5));
}

// Возвращает ВСЕ результаты (без строгого домен-фильтра, только без "плохих" слов)
export function filterAll(rawItems) {
  const cleaned = rawItems.filter((p) => {
    const text = ((p.title || '') + ' ' + (p.snippet || '')).toLowerCase();
    return !BAD_WORDS.some((w) => text.includes(w));
  });
  return dedupeByKey(cleaned).map((p) => ({ ...p, _verified: isDomainVerified(p) }));
}

// Возвращает только ПРОВЕРЕННЫЕ (домен совпадает со страной поиска)
export function filterVerified(allFiltered) {
  return allFiltered.filter((p) => p._verified);
}

// Оставлено для обратной совместимости — теперь просто алиас на filterVerified(filterAll(...))
export function dedupeAndFilter(rawItems) {
  return filterVerified(filterAll(rawItems));
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
  const rawItems = [];
  const regionStatus = {};
  for (const r of results) {
    regionStatus[r.country] = { status: r.status, message: r.message || null };
    for (const item of r.items) rawItems.push({ ...item, _country: r.country });
  }

  const allFiltered = filterAll(rawItems);
  const verified = filterVerified(allFiltered);

  return {
    // "чистые" — прошли домен-фильтр по стране (главный список)
    items: verified.slice(0, 40),
    totalFound: verified.length,
    // весь пул результатов (включая непроверенные), с флагом _verified на каждом
    allItems: allFiltered.slice(0, 60),
    totalFoundAll: allFiltered.length,
    regionStatus,
  };
}
