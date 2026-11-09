// Аналитика: Google Analytics 4 и Яндекс Метрика подключаются, только если в index.html
// заполнены ID в window.NEXA_CONFIG. Пока ID пустые, на сайт ничего не загружается.
export function initAnalytics() {
  const cfg = window.NEXA_CONFIG || {};
  const add = (src) => { const s = document.createElement("script"); s.async = true; s.src = src; document.head.appendChild(s); };

  if (cfg.ga4 && /^G-[A-Z0-9]+$/.test(cfg.ga4)) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", cfg.ga4);
    add(`https://www.googletagmanager.com/gtag/js?id=${cfg.ga4}`);
  }

  if (cfg.ym && /^\d+$/.test(String(cfg.ym))) {
    const id = Number(cfg.ym);
    window.ym = window.ym || function () { (window.ym.a = window.ym.a || []).push(arguments); };
    window.ym.l = Date.now();
    add("https://mc.yandex.ru/metrika/tag.js");
    window.ym(id, "init", { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: false });
    window.NEXA_YM = id;
  }
}

/* Цели: каждое событие сайта уходит в GA4 (событие) и в Метрику (цель с тем же названием). */
export function sendGoal(event, params) {
  if (typeof window.gtag === "function") window.gtag("event", event, params);
  if (typeof window.ym === "function" && window.NEXA_YM) window.ym(window.NEXA_YM, "reachGoal", event, params);
}
