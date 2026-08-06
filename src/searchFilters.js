// searchFilters.js
// Версия 3: БАЛЛЬНАЯ СИСТЕМА вместо бинарной классификации.
//
// Проблема версии 2: если у сайта не было ровно нужного слова-маркера
// ("официальный дилер" и т.п.), он падал в категорию "скрыть" целиком,
// хотя реально мог быть нормальным поставщиком (пример: fristam.nt-rt.ru).
//
// В этой версии каждый результат получает СУММУ баллов за разные признаки
// (домен, ключевые слова, структура страницы, наличие цены и т.д.), а не
// один флаг "да/нет". Итог — три группы:
//   RELIABLE ("надёжный")     — явно завод/дилер/дистрибьютор, показываем в топе
//   MAYBE    ("возможно норм") — недостаточно признаков, но и не похоже на мусор —
//                                 показываем, но с пометкой "не подтверждено"
//   HIDE     ("скрыть")        — явный мусор/маркетплейс/агрегатор/запчасть
//
// Список заводов (FACTORY_DOMAINS) — единственное, что ведём вручную.

// =====================================================================
// 1. ЗАВОДЫ-ПРОИЗВОДИТЕЛИ (вручную, их немного)
// =====================================================================
export const FACTORY_DOMAINS = [
  'grundfos.com', 'api.grundfos.com',
  'fristam.com', 'fristam.de',
  'wilo.com',
  'ksb.com',
  'sulzer.com',
];

// =====================================================================
// 2. ЖЁСТКИЕ ПРАВИЛА — эти признаки безусловно = мусор, без баллов
//    (тут ошибиться дорого, поэтому не полагаемся на сумму очков)
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

function isHardJunk(hostname, url, text) {
  if (CONTENT_PLATFORM_PATTERNS.some((re) => re.test(hostname))) return true;
  if (LEGAL_GOV_URL_PATTERNS.some((re) => re.test(url))) return true;
  if (LEGAL_GOV_TEXT_PATTERNS.some((re) => re.test(text))) return true;
  return false;
}

// =====================================================================
// 3. ПРИЗНАКИ ДЛЯ БАЛЛОВ (плюсы и минусы)
// =====================================================================

// -- Маркетплейсы --
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
];
function marketplaceSignalCount(url, text) {
  let count = 0;
  if (MARKETPLACE_URL_PATTERNS.some((re) => re.test(url))) count += 1;
  count += MARKETPLACE_TEXT_PATTERNS.filter((re) => re.test(text)).length;
  return count;
}

// -- Агрегаторы цен --
const AGGREGATOR_URL_PATTERNS = [/katalog|catalog-price|pricelist-compare/i];
const AGGREGATOR_TEXT_PATTERNS = [
  /цена от .+ до .+/i,
  /сравнить цены|compare prices/i,
  /каталог описаний и цен/i,
];
function looksLikeAggregator(url, text) {
  return AGGREGATOR_URL_PATTERNS.some((re) => re.test(url)) ||
         AGGREGATOR_TEXT_PATTERNS.some((re) => re.test(text));
}

// -- Дилер/дистрибьютор (текстовые маркеры) --
const DEALER_TEXT_PATTERNS = [
  /официальн(ый|ого) дилер/i,
  /authorized (dealer|distributor)/i,
  /работает? (с представительством|напрямую с производителем)/i,
  /официальн(ый|ый) партн[её]р/i,
  /дистрибьютор/i,
];
function dealerSignalCount(text) {
  return DEALER_TEXT_PATTERNS.filter((re) => re.test(text)).length;
}

// -- Документ / мануал --
function isDocumentOrManual(url, text) {
  if (/\.pdf($|\?)/i.test(url)) return true;
  return /literature|manual|инструкция по монтажу|maintenance manual|brochure/i.test(text);
}

// -- Запчасть, а не целый насос --
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

// -- Есть ли цена в тексте (слабый плюс — обычно у реальных продавцов) --
const PRICE_PATTERNS = [
  /\d[\d\s]{2,}\s?(₽|руб|тг|тенге|¥|元|\$|€)/i,
  /(₽|руб|тг|тенге|¥|元|\$|€)\s?\d[\d\s]{2,}/i,
];
function hasPrice(text) {
  return PRICE_PATTERNS.some((re) => re.test(text));
}

// -- Есть ли артикул/каталожный номер (плюс — конкретика, не общие слова) --
function hasProductCode(text) {
  return /\b\d{5,}\b/.test(text);
}

// =====================================================================
// 4. РЕГИОН ПО ДОМЕНУ (для проверки несовпадения с флагом)
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
const FLAG_TO_REGION = { '🇷🇺': 'RU', '🇰🇿': 'KZ', '🇨🇳': 'CN', '🇪🇺': 'EU' };

export function checkRegionMismatch(result) {
  const hostname = getHostname(result.url);
  const realRegion = guessRegionFromDomain(hostname);
  const claimedRegion = FLAG_TO_REGION[result.flag];
  if (!realRegion || !claimedRegion) return { mismatch: false, realRegion };
  return { mismatch: realRegion !== claimedRegion, realRegion };
}

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

// =====================================================================
// 5. ГЛАВНАЯ ФУНКЦИЯ: ПОДСЧЁТ БАЛЛОВ
// =====================================================================
export const Tier = {
  RELIABLE: 'RELIABLE', // надёжный — завод / явный дилер / дистрибьютор
  MAYBE: 'MAYBE',       // возможно норм — недостаточно признаков, но не мусор
  HIDE: 'HIDE',         // скрыть — мусор / маркетплейс / агрегатор / запчасть
};

// Метка для бейджа в интерфейсе (не влияет на решение "показывать/скрыть")
export const SourceLabel = {
  FACTORY: 'Завод-производитель',
  DEALER_DISTRIBUTOR: 'Дилер/дистрибьютор',
  MARKETPLACE: 'Маркетплейс',
  AGGREGATOR: 'Агрегатор цен',
  DOCUMENT: 'Документация',
  UNKNOWN: 'Поставщик',
};

/**
 * Считает баллы и возвращает { score, tier, label, reasons, isPart, regionMismatch }
 */
export function scoreResult(result) {
  const hostname = getHostname(result.url);
  const url = result.url || '';
  const text = `${result.title || ''} ${result.snippet || ''}`;
  const reasons = [];

  // Жёсткое правило: явный мусор — сразу HIDE, без подсчёта баллов
  if (isHardJunk(hostname, url, text)) {
    return { score: -100, tier: Tier.HIDE, label: 'Мусор', reasons: ['junk-pattern'], isPart: false, regionMismatch: false };
  }

  let score = 0;
  let label = SourceLabel.UNKNOWN;

  // Завод — самый сильный положительный сигнал
  if (domainMatches(hostname, FACTORY_DOMAINS)) {
    score += 6;
    label = SourceLabel.FACTORY;
    reasons.push('+6 завод-производитель');
  }

  // Дилер/дистрибьютор — текстовые маркеры
  const dealerHits = dealerSignalCount(text);
  if (dealerHits > 0) {
    score += 3 * dealerHits;
    if (label === SourceLabel.UNKNOWN) label = SourceLabel.DEALER_DISTRIBUTOR;
    reasons.push(`+${3 * dealerHits} маркер дилера/дистрибьютора`);
  }

  // Маркетплейс — сильный минус
  if (isKnownMarketplacePlatform(hostname)) {
    score -= 5;
    label = SourceLabel.MARKETPLACE;
    reasons.push('-5 известная площадка-маркетплейс');
  } else {
    const mpSignals = marketplaceSignalCount(url, text);
    if (mpSignals >= 2) {
      score -= 4;
      label = SourceLabel.MARKETPLACE;
      reasons.push('-4 признаки маркетплейса в тексте/URL');
    } else if (mpSignals === 1) {
      score -= 1; // слабый сигнал — не решающий сам по себе
      reasons.push('-1 слабый признак маркетплейса');
    }
  }

  // Агрегатор цен
  if (looksLikeAggregator(url, text)) {
    score -= 3;
    label = SourceLabel.AGGREGATOR;
    reasons.push('-3 похоже на агрегатор цен');
  }

  // Документ/мануал — не поставщик, но и не мусор
  const isDoc = isDocumentOrManual(url, text);
  if (isDoc) {
    score -= 3;
    label = SourceLabel.DOCUMENT;
    reasons.push('-3 документ/мануал, не карточка поставщика');
  }

  // Запчасть, а не целый насос — сильный минус, почти всегда исключает
  const isPart = isPartNotPump(text);
  if (isPart) {
    score -= 5;
    reasons.push('-5 похоже на запчасть, не целый насос');
  }

  // Регион: домен совпадает с флагом страны — небольшой плюс за достоверность
  const regionCheck = checkRegionMismatch(result);
  if (regionCheck.realRegion && !regionCheck.mismatch) {
    score += 1;
    reasons.push('+1 регион домена совпадает с флагом');
  } else if (regionCheck.mismatch) {
    score -= 1;
    reasons.push('-1 регион домена НЕ совпадает с флагом');
  }

  // Слабые положительные сигналы конкретности — реальная карточка товара,
  // а не общая страница
  if (hasPrice(text)) {
    score += 1;
    reasons.push('+1 есть цена в тексте');
  }
  if (hasProductCode(text)) {
    score += 1;
    reasons.push('+1 есть артикул/каталожный номер');
  }

  // Итоговый порог: где проходит граница между "надёжный / возможно норм / скрыть"
  let tier;
  if (score <= -3) tier = Tier.HIDE;
  else if (score >= 4) tier = Tier.RELIABLE;
  else tier = Tier.MAYBE;

  return { score, tier, label, reasons, isPart, regionMismatch: regionCheck.mismatch };
}

// =====================================================================
// 6. ДЕДУПЛИКАЦИЯ (по артикулу — ищем в title+snippet+URL)
// =====================================================================
function extractProductCode(p) {
  const text = `${p.title || ''} ${p.snippet || ''} ${p.link || p.url || ''}`;
  const match = text.match(/\b\d{5,}\b/);
  return match ? match[0] : null;
}

export function dedupeResults(results) {
  const seen = new Map();
  for (const r of results) {
    const code = extractProductCode(r);
    const key = code || (r.title || '').trim().toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, r);
      continue;
    }
    const existing = seen.get(key);
    // Оставляем результат с более высоким баллом
    if ((r._score ?? 0) > (existing._score ?? 0)) {
      seen.set(key, r);
    }
  }
  return Array.from(seen.values());
}

// =====================================================================
// 7. ГЛАВНАЯ ФУНКЦИЯ: применить всё сразу
// =====================================================================
/**
 * @param {Array} rawResults - [{url|link, title, snippet, flag}, ...]
 * @param {Object} options
 * @param {boolean} options.showMaybe - показывать группу "возможно норм" (по умолчанию true)
 * @param {boolean} options.showHidden - показывать даже группу "скрыть" (по умолчанию false, для отладки)
 */
export function filterAndRankResults(rawResults, options = {}) {
  const { showMaybe = true, showHidden = false } = options;

  let results = rawResults.map((r) => {
    const adapted = { url: r.url || r.link, title: r.title, snippet: r.snippet, flag: r.flag };
    const scored = scoreResult(adapted);
    return { ...r, _score: scored.score, _tier: scored.tier, _label: scored.label, _reasons: scored.reasons };
  });

  if (!showHidden) {
    results = results.filter((r) => r._tier !== Tier.HIDE);
  }
  if (!showMaybe) {
    results = results.filter((r) => r._tier !== Tier.MAYBE);
  }

  results = dedupeResults(results);

  // Сортировка: сначала RELIABLE (по убыванию балла), потом MAYBE (по убыванию балла)
  const tierRank = { [Tier.RELIABLE]: 0, [Tier.MAYBE]: 1, [Tier.HIDE]: 2 };
  results.sort((a, b) => {
    const tierDiff = tierRank[a._tier] - tierRank[b._tier];
    if (tierDiff !== 0) return tierDiff;
    return b._score - a._score;
  });

  return results;
}
