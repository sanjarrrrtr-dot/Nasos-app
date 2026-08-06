const SERPER_KEY = '37e15324b8adf3b2e1e2536ac9e0459ac3cc7d2d';

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

function scoreReliability(url, country) {
  let score = 0;
  const hostname = new URL(url).hostname.toLowerCase();
  
  // Проверяем известные надёжные бренды
  if (KNOWN_RELIABLE_HOSTS.some(h => hostname.includes(h))) {
    score += 100; // очень надёжные
    return { score, tier: 'RELIABLE' };
  }
  
  // Проверяем известный мусор
  if (KNOWN_LOW_QUALITY.some(kw => hostname.includes(kw))) {
    score = 10;
    return { score, tier: 'LOW' };
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
  
  return { score, tier };
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
    // Добавляем scoring каждому результату
    const itemsWithScore = items.map(item => ({
      ...item,
      _country: country,
      ...scoreReliability(item.link, country),
    }));
    return { country, status: items.length ? 'ok' : 'empty', items: itemsWithScore };
  } catch (err) {
    return { country, status: 'error', message: String(err.message || err), items: [] };
  }
}

export function dedupeAndFilter(allItems) {
  const seen = new Set();
  const priority = { KZ: 1, CN: 2, RU: 3, EU: 4 };
  
  // Фильтруем мусор и дедуплицируем
  const filtered = allItems
    .filter((p) => {
      const text = ((p.title || '') + ' ' + (p.snippet || '')).toLowerCase();
      return !BAD_WORDS.some((w) => text.includes(w));
    })
    .filter((p) => {
      const key = (p.link || p.title || '').toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  
  // Сортируем по приоритету страны + надёжности
  return filtered.sort((a, b) => {
    const tierOrder = { RELIABLE: 0, MEDIUM: 1, LOW: 2 };
    const tierDiff = (tierOrder[a.tier] || 2) - (tierOrder[b.tier] || 2);
    if (tierDiff !== 0) return tierDiff;
    return (priority[a._country] || 5) - (priority[b._country] || 5);
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
    for (const item of r.items) allItems.push(item);
  }
  
  // Фильтруем и сортируем
  const filtered = dedupeAndFilter(allItems);
  
  // Разделяем по tier
  const reliableItems = filtered.filter(p => p.tier === 'RELIABLE').slice(0, 40);
  const allOtherItems = filtered.filter(p => p.tier !== 'RELIABLE').slice(0, 40);
  
  return {
    items: reliableItems,
    allItems: allOtherItems,
    totalFound: reliableItems.length,
    totalFoundAll: allOtherItems.length,
    regionStatus,
  };
}
