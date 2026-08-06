// searchFilters.js
// Модуль постобработки результатов поиска поставщиков насосов.
// Версия 2: классификация источника через ЭВРИСТИКИ (паттерны), а не жёсткие
// списки доменов. Работает на новых, ранее не встречавшихся сайтах без
// ручного добавления каждого домена в код.
//
// Исключение: список заводов-производителей (FACTORY_DOMAINS) остаётся
// ручным — производителей насосов реально немного, и их проще перечислить,
// чем угадывать по признакам "это официальный сайт бренда X".

// =====================================================================
// 1. ЗАВОДЫ-ПРОИЗВОДИТЕЛИ — единственный список, который ведём вручную
// =====================================================================
export const FACTORY_DOMAINS = [
  'grundfos.com', 'api.grundfos.com',
  'fristam.com', 'fristam.de',
  'wilo.com',
  'ksb.com',
  'sulzer.com',
];

// =====================================================================
// 2. ЭВРИСТИКИ: МУСОР (не имеет отношения к насосам/поставщикам вообще)
// =====================================================================

const CONTENT_PLATFORM_PATTERNS = [
  /wikipedia\.org$/i,
  /sciencedirect\.com$/i,
  /facebook\.com$/i,
  /youtube\.com$/i,
  /trustpilot\.com$/i,
  /instagram\.com$/i,
  /linkedin\.com$/i,
  /(^|\.)x\.com$/i,
  /twitter\.com$/i,
  /scribd\.com$/i,
];

const LEGAL_GOV_URL_PATTERNS = [
  /\.gov(\.|$)/i,
  /\/zakon|\/law|\/nakaz|\/postanova|\/postanovlenie/i,
];
const LEGAL_GOV_TEXT_PATTERNS = [
  /наказ(?:ую|ываю)?/i,
  /постанов(а|ление|ляю)/i,
  /класифікатор/i,
  /митн(ий|ого|ої)/i,
  /законодавств/i,
];

function looksLikeContentPlatform(hostname) {
  return CONTENT_PLATFORM_PATTERNS.some((re) => re.test(hostname));
}

function looksLikeLegalOrGov(url, text) {
  const urlHit = LEGAL_GOV_URL_PATTERNS.some((re) => re.test(url));
  const textHit = LEGAL_GOV_TEXT_PATTERNS.some((re) => re.test(text));
  return urlHit || textHit;
}

// =====================================================================
// 3. ЭВРИСТИКИ: МАРКЕТПЛЕЙСЫ / ПОСРЕДНИКИ
// =====================================================================
const MARKETPLACE_URL_PATTERNS = [
  /\/product-detail\//i,
  /\/item\/\d+/i,
  /\/goods\.php/i,
  /\/p\/\d{6,}/i,
];

const MARKETPLACE_TEXT_PATTERNS = [
  /minimum order/i,
  /моq|min\.\s*order/i,
  /оптом от/i,
  /поставщик(?:ов|и)?:\s*\d+/i,
  /witness suppliers|verified supplier/i,
  /add to cart|в корзину/i,
];

// Известные крупные международные торговые платформы — их конечное число (десятки),
// и это инфраструктура для тысяч разных продавцов сразу, а не сами поставщики.
const KNOWN_MARKETPLACE_PLATFORMS = [
  /alibaba\.com$/i,
  /1688\.com$/i,
  /taobao\.com$/i,
  /ebay\.com$/i,
  /aliexpress\.com$/i,
  /made-in-china\.com$/i,
  /amazon\.[a-z.]+$/i,
];

function isKnownMarketplacePlatform(hostname) {
  return KNOWN_MARKETPLACE_PLATFORMS.some((re) => re.test(hostname));
}

function looksLikeMarketplace(url, text) {
  if (MARKETPLACE_URL_PATTERNS.some((re) => re.test(url))) return true;
  const hits = MARKETPLACE_TEXT_PATTERNS.filter((re) => re.test(text)).length;
  return hits >= 2; // требуем минимум 2 совпадения, чтобы не ловить ложные срабатывания
}

// =====================================================================
// 4. ЭВРИСТИКИ: АГРЕГАТОРЫ ЦЕН
// =====================================================================
const AGGREGATOR_URL_PATTERNS = [
  /katalog|catalog-price|pricelist-compare/i,
];
const AGGREGATOR_TEXT_PATTERNS = [
  /цена от .+ до .+/i,
  /сравнить цены|compare prices/i,
  /каталог описаний и цен/i,
];

function looksLikeAggregator(url, text) {
  const urlHit = AGGREGATOR_URL_PATTERNS.some((re) => re.test(url));
  const textHit = AGGREGATOR_TEXT_PATTERNS.some((re) => re.test(text));
  return urlHit || textHit;
}

// =====================================================================
// 5. ЭВРИСТИКИ: ОФИЦИАЛЬНЫЙ ДИЛЕР / ДИСТРИБЬЮТОР
// =====================================================================
const DEALER_TEXT_PATTERNS = [
  /официальн(ый|ого) дилер/i,
  /authorized (dealer|distributor)/i,
  /работает? (с представительством|напрямую с производителем)/i,
  /официальн(ый|ый) партн[её]р/i,
  /дистрибьютор/i,
];

function looksLikeDealerOrDistributor(text) {
  return DEALER_TEXT_PATTERNS.some((re) => re.test(text));
}

// =====================================================================
// 6. ЭВРИСТИКА: ЗАПЧАСТЬ, А НЕ ЦЕЛЫЙ НАСОС
// =====================================================================
const PART_NOT_PUMP_PATTERNS = [
  /\b(seal|уплотнени|сальник|прокладк|gasket)\b/i,
  /\b(bearing|подшипник)\b/i,
  /\b(rotor|ротор)\b/i,
  /\bзапчаст|spare part\b/i,
  /\b(датчик|sensor)\b/i,
  /\b(клапан|valve)\b/i,
  /\bмембран/i,
];

function isPartNotPump(text) {
  return PART_NOT_PUMP_PATTERNS.some((re) => re.test(text));
}

// =====================================================================
// 7. ДОКУМЕНТ / МАНУАЛ
// =====================================================================
function isDocumentOrManual(url, text) {
  if (/\.pdf($|\?)/i.test(url)) return true;
  return /literature|manual|инструкция по монтажу|maintenance manual|brochure/i.test(text);
}

// =====================================================================
// 8. РЕГИОН ПО ДОМЕНУ
// =====================================================================
const TLD_REGION_PATTERNS = [
  [/\.com\.ua$/i, 'UA'],
  [/\.ua$/i, 'UA'],
  [/\.ru$/i, 'RU'],
  [/\.kz$/i, 'KZ'],
  [/\.cn$/i, 'CN'],
  [/\.tj$/i, 'TJ'],
  [/\.de$/i, 'EU'],
  [/\.eu$/i, 'EU'],
];

function guessRegionFromDomain(hostname) {
  for (const [re, region] of TLD_REGION_PATTERNS) {
    if (re.test(hostname)) return region;
  }
  return null;
}

const FLAG_TO_REGION = {
  '🇷🇺': 'RU',
  '🇰🇿': 'KZ',
  '🇨🇳': 'CN',
  '🇪🇺': 'EU',
};

export function checkRegionMismatch(result) {
  const hostname = getHostname(result.url);
  const realRegion = guessRegionFromDomain(hostname);
  const claimedRegion = FLAG_TO_REGION[result.flag];
  if (!realRegion || !claimedRegion) {
    return { mismatch: false, realRegion };
  }
  return { mismatch: realRegion !== claimedRegion, realRegion };
}

// =====================================================================
// 9. ГЛАВНАЯ КЛАССИФИКАЦИЯ ИСТОЧНИКА
// =====================================================================
export const SourceType = {
  FACTORY: 'FACTORY',
  DEALER_DISTRIBUTOR: 'DEALER_DISTRIBUTOR',
  RESELLER: 'RESELLER',
  MARKETPLACE: 'MARKETPLACE',
  AGGREGATOR: 'AGGREGATOR',
  DOCUMENT: 'DOCUMENT',
  JUNK: 'JUNK',
};

function getHostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch (e) {
    return '';
  }
}

function domainMatches(hostname, list) {
  return list.some((d) => hostname === d || hostname.endsWith('.' + d));
}

export function classifySource(result) {
  const hostname = getHostname(result.url);
  const url = result.url || '';
  const text = `${result.title || ''} ${result.snippet || ''}`;

  if (looksLikeContentPlatform(hostname)) return SourceType.JUNK;
  if (looksLikeLegalOrGov(url, text)) return SourceType.JUNK;

  if (isDocumentOrManual(url, text)) return SourceType.DOCUMENT;

  if (domainMatches(hostname, FACTORY_DOMAINS)) return SourceType.FACTORY;

  if (isKnownMarketplacePlatform(hostname) || looksLikeMarketplace(url, text)) {
    return SourceType.MARKETPLACE;
  }

  if (looksLikeAggregator(url, text)) return SourceType.AGGREGATOR;

  if (looksLikeDealerOrDistributor(text)) return SourceType.DEALER_DISTRIBUTOR;

  return SourceType.RESELLER;
}

// =====================================================================
// 10. ДЕДУПЛИКАЦИЯ
// =====================================================================
function extractProductCode(text) {
  const match = (text || '').match(/\b\d{5,}\b/);
  return match ? match[0] : null;
}

const SOURCE_RANK = {
  [SourceType.FACTORY]: 0,
  [SourceType.DEALER_DISTRIBUTOR]: 1,
  [SourceType.RESELLER]: 2,
  [SourceType.MARKETPLACE]: 3,
  [SourceType.AGGREGATOR]: 4,
  [SourceType.DOCUMENT]: 5,
  [SourceType.JUNK]: 6,
};

export function dedupeResults(results) {
  const seen = new Map();

  for (const r of results) {
    const code = extractProductCode(`${r.title} ${r.snippet}`);
    const key = code || (r.title || '').trim().toLowerCase();

    if (!seen.has(key)) {
      seen.set(key, r);
      continue;
    }

    const existing = seen.get(key);
    if (SOURCE_RANK[r.sourceType] < SOURCE_RANK[existing.sourceType]) {
      seen.set(key, r);
    }
  }

  return Array.from(seen.values());
}

// =====================================================================
// 11. ГЛАВНАЯ ФУНКЦИЯ
// =====================================================================
export function filterAndRankResults(rawResults, options = {}) {
  const {
    showResellers = false,
    showMarketplaces = false,
    showDocuments = false,
  } = options;

  let results = rawResults.map((r) => {
    const text = `${r.title || ''} ${r.snippet || ''}`;
    return {
      ...r,
      sourceType: classifySource(r),
      regionCheck: checkRegionMismatch(r),
      isPart: isPartNotPump(text),
    };
  });

  results = results.filter((r) => r.sourceType !== SourceType.JUNK);
  results = results.filter((r) => !r.isPart);

  if (!showResellers) {
    results = results.filter((r) => r.sourceType !== SourceType.RESELLER);
  }
  if (!showMarketplaces) {
    results = results.filter((r) => r.sourceType !== SourceType.MARKETPLACE);
  }
  if (!showDocuments) {
    results = results.filter((r) => r.sourceType !== SourceType.DOCUMENT);
  }

  results = dedupeResults(results);

  results.sort((a, b) => (SOURCE_RANK[a.sourceType] ?? 9) - (SOURCE_RANK[b.sourceType] ?? 9));

  return results;
}
