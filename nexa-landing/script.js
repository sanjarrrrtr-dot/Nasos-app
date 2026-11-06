/* NEXA GROUP — landing interactions */
(function () {
  "use strict";

  var WA_NUMBER = "77077799656";

  /* ---------- Аналитика: события в dataLayer (GA4 / GTM подключаются ID) ---------- */
  window.dataLayer = window.dataLayer || [];
  function track(event, params) {
    var payload = Object.assign({ event: event }, params || {});
    window.dataLayer.push(payload);
    if (typeof window.gtag === "function") window.gtag("event", event, params || {});
  }

  /* UTM-метки сохраняем, чтобы передавать в заявку */
  var utm = (function () {
    var out = {};
    try {
      var p = new URLSearchParams(location.search);
      ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach(function (k) {
        if (p.get(k)) out[k] = p.get(k);
      });
      if (Object.keys(out).length) sessionStorage.setItem("nexa_utm", JSON.stringify(out));
      else out = JSON.parse(sessionStorage.getItem("nexa_utm") || "{}");
    } catch (e) { /* storage недоступен — работаем без него */ }
    return out;
  })();

  function waLink(text) {
    return "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(text);
  }
  function utmLine() {
    var keys = Object.keys(utm);
    if (!keys.length) return "";
    return "\n\nИсточник: " + keys.map(function (k) { return k.replace("utm_", "") + "=" + utm[k]; }).join(", ");
  }

  /* ---------- Header / mobile nav ---------- */
  var header = document.querySelector(".header");
  var burger = document.getElementById("burger");
  var nav = document.getElementById("nav");
  function onScroll() { header.classList.toggle("is-scrolled", window.scrollY > 10); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  function closeNav() {
    nav.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Открыть меню");
  }
  burger.addEventListener("click", function () {
    var open = nav.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
  });
  nav.addEventListener("click", function (e) { if (e.target.closest("a")) closeNav(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeNav(); });

  document.getElementById("year").textContent = new Date().getFullYear();

  /* ---------- Каталог: 8 направлений ---------- */
  var DIRECTIONS = [
    { id: "strategy", cat: "manage", ico: "◆", name: "NEXA STRATEGY", label: "Стратегия",
      result: "Стратегия роста, бизнес-модели и запуск новых направлений.",
      services: ["Бизнес-планы и финансовые модели", "Рыночные исследования", "Инвестиционные презентации", "Стратегия роста и франчайзинг", "Международная экспансия", "Управление изменениями"] },
    { id: "system", cat: "manage", ico: "▦", name: "NEXA SYSTEM", label: "Систематизация",
      result: "Управляемая система, которая работает на измеримый результат.",
      services: ["Диагностика системы управления", "Оргструктура и матрица RACI", "ЦКП должностей и отделов", "Бизнес-процессы и регламенты (SOP)", "KPI и мотивация", "Регулярный менеджмент", "Контроль качества", "Масштабирование и делегирование"] },
    { id: "marketing", cat: "growth", ico: "✦", name: "NEXA MARKETING", label: "Маркетинг",
      result: "Внешний маркетинговый отдел: квалифицированный спрос в рамках бюджета.",
      services: ["Стратегия, ICP, позиционирование, УТП", "Performance: Google, Meta, TikTok Ads", "SEO, GEO и AEO", "SMM и контент", "Личный бренд и PR", "Брендинг и дизайн", "Видеопродакшен", "Маркетинговая аналитика: GA4, ROMI, CAC"] },
    { id: "sales", cat: "growth", ico: "↗", name: "NEXA SALES", label: "Продажи",
      result: "Отдел продаж, который выполняет план прибыльных продаж.",
      services: ["Аудит воронки и стратегия продаж", "Построение отдела: РОП, менеджеры, SDR", "Скрипты и работа с возражениями", "CRM, SLA и аналитика конверсий", "Обучение и аттестации", "Внешний РОП / Sales as a Service"] },
    { id: "tech", cat: "tech", ico: "⚙", name: "NEXA AI & TECH", label: "Технологии",
      result: "Цифровая инфраструктура: сайты, CRM, ERP, AI-агенты и интеграции.",
      services: ["Сайты, порталы, личные кабинеты", "amoCRM, Bitrix24, HubSpot", "ERP: продажи, склад, финансы", "AI-агенты и боты в WhatsApp/Telegram", "Интеграции: API, n8n, Make", "База знаний (RAG)", "BI-дашборды и поддержка по SLA"] },
    { id: "people", cat: "manage", ico: "◎", name: "NEXA PEOPLE", label: "HR",
      result: "Укомплектованная результативная команда.",
      services: ["HR-аудит", "Подбор персонала и руководителей", "Адаптация и обучение, LMS", "Performance review, грейды, кадровый резерв", "HR as a Service"] },
    { id: "finance", cat: "manage", ico: "₸", name: "NEXA FINANCE", label: "Финансы",
      result: "Управленческий учёт и экономическая прозрачность.",
      services: ["Финансовая диагностика", "P&L, Cash Flow, БДР, БДДС", "Финансовое моделирование", "Unit-экономика и прайсинг", "CFO as a Service"] },
    { id: "academy", cat: "growth", ico: "◈", name: "NEXA ACADEMY", label: "Обучение",
      result: "Обученные собственники, руководители и команды.",
      services: ["Программы для собственников и CEO", "Обучение РОПов и маркетологов", "Тренинги и практикумы", "Стратегические сессии", "Наставничество и аттестации"] }
  ];
  var CAT_LABEL = { manage: "Управление", growth: "Рост", tech: "Технологии" };
  var VISIBLE = 4;

  var cardsEl = document.getElementById("cards");
  cardsEl.innerHTML = DIRECTIONS.map(function (d) {
    var items = d.services.map(function (s, i) {
      return '<li' + (i >= VISIBLE ? ' class="is-extra"' : "") + ">" + s + "</li>";
    }).join("");
    var extra = d.services.length - VISIBLE;
    return '<article class="card reveal" data-cat="' + d.cat + '" id="dir-' + d.id + '">' +
      '<div class="card__top"><span class="card__ico" aria-hidden="true">' + d.ico + '</span><span class="card__cat">' + CAT_LABEL[d.cat] + "</span></div>" +
      '<h3 class="card__name"><small>' + d.label + "</small>" + d.name.replace("&", "&amp;") + "</h3>" +
      '<p class="card__result">' + d.result + "</p>" +
      '<ul class="card__list">' + items + "</ul>" +
      '<div class="card__foot">' +
        (extra > 0 ? '<button class="card__more" type="button" aria-expanded="false">+ ещё ' + extra + "</button>" : "<span></span>") +
        '<a class="card__link" href="' + waLink("Здравствуйте! Интересует направление " + d.name + ".") + '" target="_blank" rel="noopener" data-track="whatsapp_direction" data-dir="' + d.name + '">Обсудить →</a>' +
      "</div></article>";
  }).join("");

  cardsEl.addEventListener("click", function (e) {
    var btn = e.target.closest(".card__more");
    if (!btn) return;
    var card = btn.closest(".card");
    var open = card.classList.toggle("is-open");
    btn.setAttribute("aria-expanded", String(open));
    var extra = card.querySelectorAll(".is-extra").length;
    btn.textContent = open ? "Свернуть" : "+ ещё " + extra;
  });

  document.querySelectorAll(".filter").forEach(function (f) {
    f.addEventListener("click", function () {
      var val = f.dataset.filter;
      document.querySelectorAll(".filter").forEach(function (x) {
        var on = x === f;
        x.classList.toggle("is-active", on);
        x.setAttribute("aria-selected", String(on));
      });
      cardsEl.querySelectorAll(".card").forEach(function (c) {
        c.classList.toggle("is-hidden", val !== "all" && c.dataset.cat !== val);
      });
      track("catalog_filter", { filter: val });
    });
  });

  /* ---------- Reveal on scroll ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el, i) {
      el.style.transitionDelay = (i % 4) * 60 + "ms";
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Предзаполнение формы из «Решений» и «Пакетов» ---------- */
  var leadForm = document.getElementById("leadForm");
  var interest = leadForm.elements.interest;
  var comment = leadForm.elements.comment;
  document.querySelectorAll("[data-goal], [data-package]").forEach(function (el) {
    el.addEventListener("click", function () {
      var v = el.dataset.goal ? "Задача: " + el.dataset.goal : "Пакет: " + el.dataset.package;
      comment.value = v;
      track(el.dataset.goal ? "select_solution" : "select_package", { value: el.dataset.goal || el.dataset.package });
    });
  });

  /* ---------- Валидация ---------- */
  function cleanPhone(v) { return (v || "").replace(/[^\d+]/g, ""); }
  function validPhone(v) { var d = v.replace(/\D/g, ""); return d.length >= 10 && d.length <= 15; }
  function clip(v, n) { return String(v || "").trim().slice(0, n); }

  function validate(form) {
    var errs = [];
    var name = form.elements.name, phone = form.elements.phone, consent = form.elements.consent;
    [name, phone].forEach(function (i) { i.classList.remove("is-invalid"); });
    if (clip(name.value, 80).length < 2) { errs.push("Укажите имя"); name.classList.add("is-invalid"); }
    if (!validPhone(cleanPhone(phone.value))) { errs.push("Укажите корректный телефон"); phone.classList.add("is-invalid"); }
    if (!consent.checked) errs.push("Нужно согласие на обработку данных");
    if (form.elements.website && form.elements.website.value) errs.push("spam");
    return errs;
  }

  /* Защита от повторных отправок */
  var lastSubmit = 0;
  function throttled() {
    var now = Date.now();
    if (now - lastSubmit < 5000) return true;
    lastSubmit = now;
    return false;
  }

  leadForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var errEl = document.getElementById("formError");
    var errs = validate(leadForm);
    if (errs.indexOf("spam") !== -1) return;
    if (errs.length) { errEl.textContent = errs.join(" · "); return; }
    if (throttled()) return;
    errEl.textContent = "";
    var f = leadForm.elements;
    var text = "Здравствуйте! Заявка с сайта NEXA GROUP.\n\n" +
      "Имя: " + clip(f.name.value, 80) + "\n" +
      (clip(f.company.value, 120) ? "Компания: " + clip(f.company.value, 120) + "\n" : "") +
      "Телефон: " + cleanPhone(f.phone.value) + "\n" +
      (f.interest.value ? "Интересует: " + f.interest.value + "\n" : "") +
      (clip(f.comment.value, 600) ? "Комментарий: " + clip(f.comment.value, 600) : "") +
      utmLine();
    track("generate_lead", { form: "contact", interest: f.interest.value || "—" });
    window.open(waLink(text), "_blank", "noopener");
  });

  /* ---------- Интерактивная диагностика ---------- */
  var QUESTIONS = [
    { key: "size", q: "Сколько сотрудников в компании?", hint: "Выберите один вариант",
      opts: ["1–10", "11–30", "31–100", "Более 100"] },
    { key: "task", q: "Какая основная задача сейчас?", hint: "Выберите один вариант",
      opts: ["Увеличить продажи", "Систематизировать бизнес", "Внедрить CRM / ERP / AI", "Комплексная трансформация"] },
    { key: "regs", q: "Есть ли в компании регламенты и KPI?", hint: "Выберите один вариант",
      opts: ["Нет", "Частично", "Есть, но не работают", "Есть и работают"] },
    { key: "improve", q: "Что хотите улучшить?", hint: "Можно выбрать несколько", multi: true,
      opts: ["Маркетинг", "Продажи", "Персонал", "Управление", "Финансы", "Все направления"] },
    { key: "urgency", q: "Когда планируете начать?", hint: "Выберите один вариант",
      opts: ["Срочно, в этом месяце", "В ближайшие 1–3 месяца", "Пока изучаю варианты"] }
  ];
  var answers = {};
  var step = 0;
  var body = document.getElementById("quizBody");
  var bar = document.getElementById("quizBar");
  var count = document.getElementById("quizCount");
  var btnNext = document.getElementById("quizNext");
  var btnBack = document.getElementById("quizBack");
  var quizStarted = false;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function renderQ() {
    var Q = QUESTIONS[step];
    var cur = answers[Q.key] || (Q.multi ? [] : null);
    body.innerHTML = '<p class="quiz__q">' + Q.q + '</p><p class="quiz__hint">' + Q.hint + "</p>" +
      '<div class="quiz__opts" role="' + (Q.multi ? "group" : "radiogroup") + '" aria-label="' + esc(Q.q) + '">' +
      Q.opts.map(function (o) {
        var sel = Q.multi ? cur.indexOf(o) !== -1 : cur === o;
        return '<button type="button" class="opt' + (sel ? " is-selected" : "") + '" role="' + (Q.multi ? "checkbox" : "radio") + '" aria-checked="' + sel + '" data-v="' + esc(o) + '">' + esc(o) + "</button>";
      }).join("") + "</div>";
    bar.style.width = ((step + 1) / (QUESTIONS.length + 1)) * 100 + "%";
    count.textContent = "Вопрос " + (step + 1) + " из " + QUESTIONS.length;
    btnBack.hidden = step === 0;
    btnNext.hidden = false;
    btnNext.textContent = step === QUESTIONS.length - 1 ? "Получить результат →" : "Далее →";
    btnNext.disabled = Q.multi ? !cur.length : !cur;
  }

  body.addEventListener("click", function (e) {
    var opt = e.target.closest(".opt");
    if (!opt) return;
    if (!quizStarted) { quizStarted = true; track("diagnostic_start"); }
    var Q = QUESTIONS[step], v = opt.dataset.v;
    if (Q.multi) {
      var arr = answers[Q.key] || [];
      if (v === "Все направления") arr = arr.indexOf(v) !== -1 ? [] : [v];
      else {
        arr = arr.filter(function (x) { return x !== "Все направления"; });
        arr = arr.indexOf(v) !== -1 ? arr.filter(function (x) { return x !== v; }) : arr.concat(v);
      }
      answers[Q.key] = arr;
      renderQ();
    } else {
      answers[Q.key] = v;
      renderQ();
      setTimeout(function () { if (step < QUESTIONS.length - 1) { step++; renderQ(); } }, 220);
    }
  });

  btnBack.addEventListener("click", function () {
    if (step === QUESTIONS.length) { step = QUESTIONS.length - 1; }
    else if (step > 0) step--;
    renderQ();
  });
  btnNext.addEventListener("click", function () {
    if (step < QUESTIONS.length - 1) { step++; renderQ(); }
    else { step = QUESTIONS.length; renderResult(); }
  });

  function recommend() {
    var size = answers.size, task = answers.task, regs = answers.regs, imp = answers.improve || [];
    var dirs = [];
    function add(d) { if (dirs.indexOf(d) === -1) dirs.push(d); }
    var map = { "Маркетинг": "NEXA MARKETING", "Продажи": "NEXA SALES", "Персонал": "NEXA PEOPLE", "Управление": "NEXA SYSTEM", "Финансы": "NEXA FINANCE" };
    if (task === "Увеличить продажи") { add("NEXA SALES"); add("NEXA MARKETING"); }
    if (task === "Систематизировать бизнес") add("NEXA SYSTEM");
    if (task === "Внедрить CRM / ERP / AI") add("NEXA AI & TECH");
    if (task === "Комплексная трансформация") { add("NEXA SYSTEM"); add("NEXA STRATEGY"); add("NEXA AI & TECH"); }
    if (imp.indexOf("Все направления") !== -1) Object.keys(map).forEach(function (k) { add(map[k]); });
    imp.forEach(function (i) { if (map[i]) add(map[i]); });
    if (regs === "Нет" || regs === "Есть, но не работают") add("NEXA SYSTEM");

    var pkg;
    var big = size === "31–100" || size === "Более 100";
    if (task === "Комплексная трансформация" || imp.indexOf("Все направления") !== -1) {
      pkg = size === "Более 100"
        ? { n: "NEXA ENTERPRISE", p: "Индивидуально", d: "Корпоративная трансформация и PMO" }
        : { n: "NEXA TRANSFORMATION", p: "от 3 000 000 ₸ / проект", d: "Система управления, продажи, HR, CRM/ERP" };
    } else if (task === "Систематизировать бизнес" || (big && regs !== "Есть и работают")) {
      pkg = { n: "NEXA SYSTEM", p: "от 1 500 000 ₸ / проект", d: "Оргструктура, ЦКП, KPI, регламенты" };
    } else if (task === "Увеличить продажи" && regs === "Есть и работают") {
      pkg = { n: "NEXA GROWTH", p: "от 450 000 ₸ / месяц", d: "Маркетинг, лидогенерация, аналитика" };
    } else {
      pkg = { n: "NEXA AUDIT", p: "от 250 000 ₸ / проект", d: "Диагностика, карта проблем и roadmap — лучший старт" };
    }
    return { dirs: dirs.slice(0, 5), pkg: pkg };
  }

  function renderResult() {
    var r = recommend();
    bar.style.width = "100%";
    count.textContent = "Результат диагностики";
    btnNext.hidden = true;
    btnBack.hidden = false;
    body.innerHTML =
      '<p class="result__title">Рекомендуем начать с:</p>' +
      '<div class="result__pkg"><small>Пакет</small><b>' + r.pkg.n + "</b><p>" + r.pkg.d + " · " + r.pkg.p + "</p></div>" +
      '<p class="quiz__hint">Подходящие направления:</p>' +
      '<div class="result__dirs">' + r.dirs.map(function (d) { return "<span>" + esc(d) + "</span>"; }).join("") + "</div>" +
      '<form class="result__form" id="quizForm" novalidate>' +
        '<input name="name" placeholder="Ваше имя" autocomplete="name" maxlength="80" required aria-label="Имя">' +
        '<input name="phone" type="tel" inputmode="tel" placeholder="Телефон" autocomplete="tel" maxlength="20" required aria-label="Телефон">' +
        '<input type="text" name="website" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">' +
        '<label class="consent"><input type="checkbox" name="consent" required> <span>Согласен(на) на обработку персональных данных — <a href="privacy.html" target="_blank">политика</a></span></label>' +
        '<p class="form__error" id="quizError" role="alert"></p>' +
        '<button class="btn btn--primary btn--lg" type="submit">Получить разбор в WhatsApp</button>' +
      "</form>";
    track("diagnostic_complete", { package: r.pkg.n });

    document.getElementById("quizForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var form = e.target;
      var errs = validate(form);
      var errEl = document.getElementById("quizError");
      if (errs.indexOf("spam") !== -1) return;
      if (errs.length) { errEl.textContent = errs.join(" · "); return; }
      if (throttled()) return;
      errEl.textContent = "";
      var text = "Здравствуйте! Прошёл(ла) диагностику на сайте NEXA GROUP.\n\n" +
        "Имя: " + clip(form.elements.name.value, 80) + "\n" +
        "Телефон: " + cleanPhone(form.elements.phone.value) + "\n\n" +
        "Сотрудников: " + answers.size + "\n" +
        "Задача: " + answers.task + "\n" +
        "Регламенты и KPI: " + answers.regs + "\n" +
        "Улучшить: " + (answers.improve || []).join(", ") + "\n" +
        "Старт: " + answers.urgency + "\n\n" +
        "Рекомендация: " + r.pkg.n + " (" + r.dirs.join(", ") + ")" +
        utmLine();
      track("generate_lead", { form: "diagnostic", package: r.pkg.n });
      window.open(waLink(text), "_blank", "noopener");
    });
  }

  renderQ();

  /* ---------- Трекинг кликов по WhatsApp ---------- */
  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-track]");
    if (a) track("contact_click", { channel: "whatsapp", place: a.dataset.track, direction: a.dataset.dir || undefined });
  });
  /* ---------- Пакеты: сразу в WhatsApp с готовым текстом ---------- */
  document.querySelectorAll("[data-package]").forEach(function (a) {
    a.href = waLink("Здравствуйте! Интересует пакет " + a.dataset.package + ". Расскажите, пожалуйста, об условиях и сроках.");
    a.setAttribute("data-track", "whatsapp_package");
  });

  /* ---------- Типограф: короткие слова не остаются в конце строки ---------- */
  (function typograph(root) {
    var SHORT = /(^|[\s(«"])(в|во|и|с|со|к|ко|о|об|у|а|на|по|за|от|до|не|из|для|при|без|или|что|как|по|под|над|про|же)\s+/gi;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentNode && n.parentNode.nodeName;
        return /^(SCRIPT|STYLE|PRE|CODE|TEXTAREA|OPTION)$/.test(p) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });
    var n, list = [];
    while ((n = walker.nextNode())) list.push(n);
    list.forEach(function (t) {
      var v = t.nodeValue;
      if (v.trim().length < 3) return;
      var out = v.replace(SHORT, "$1$2 ").replace(SHORT, "$1$2 ").replace(/\s+—/g, " —");
      if (out !== v) t.nodeValue = out;
    });
  })(document.body);

  /* ---------- Живой фон первого экрана ---------- */
  var hero = document.querySelector(".hero");
  var code = document.getElementById("heroCode");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (hero && code) {
    var LINES = [
      "diagnose({ company, owner, departments })  → map.problems",
      "org.structure = design(roles, RACI)          // ✓ утверждено",
      "ckp.sales = 'план прибыльных продаж выполнен'",
      "kpi.tree.push({ metric: 'конверсия', plan: 32, fact: 27 })",
      "sop.create('обработка заявки', { sla: '15 мин' })",
      "crm.pipeline = ['лид', 'квалификация', 'КП', 'договор', 'оплата']",
      "ai.agent('sales').qualify(lead).handoff(manager)",
      "erp.sync(['финансы', 'склад', 'персонал'])",
      "control.weekly({ planFact: true, deviations: 'owner' })",
      "scale.branch(model).replicate()               // тиражируемая модель",
      "finance.report(['P&L', 'Cash Flow', 'БДДС'])",
      "people.onboarding({ mentor: true, test: 'регламенты' })"
    ];
    var text = [];
    for (var i = 0; i < 46; i++) text.push(LINES[(i * 5) % LINES.length]);
    code.textContent = text.join("\n");

    var tx = 0.7, ty = 0.4, cx = tx, cy = ty, mouseAt = 0, t0 = performance.now(), raf = null, heroVisible = true;
    var scrolling = false, scrollTimer;

    hero.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      var r = hero.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width;
      ty = (e.clientY - r.top) / r.height;
      mouseAt = performance.now();
    });

    function frame(now) {
      raf = null;
      if (!heroVisible || document.hidden || scrolling) return;
      if (now - mouseAt > 2500) {
        /* без мыши свет медленно гуляет сам */
        var k = (now - t0) / 1000;
        tx = 0.55 + Math.sin(k * 0.23) * 0.3;
        ty = 0.45 + Math.cos(k * 0.31) * 0.25;
      }
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      hero.style.setProperty("--mx", (cx * 100).toFixed(2) + "%");
      hero.style.setProperty("--my", (cy * 100).toFixed(2) + "%");
      code.style.setProperty("--mx", (cx * 100).toFixed(2) + "%");
      code.style.setProperty("--my", (cy * 100).toFixed(2) + "%");
      loop();
    }
    function loop() { if (!raf && !reduce) raf = requestAnimationFrame(frame); }

    /* пауза эффектов: при быстрой прокрутке, в скрытой вкладке и вне экрана */
    window.addEventListener("scroll", function () {
      if (!scrolling) { scrolling = true; document.body.classList.add("is-scrolling"); }
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(function () { scrolling = false; document.body.classList.remove("is-scrolling"); loop(); }, 160);
    }, { passive: true });
    document.addEventListener("visibilitychange", loop);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) {
        heroVisible = en[0].isIntersecting;
        hero.classList.toggle("is-paused", !heroVisible);
        loop();
      }).observe(hero);
    }
    loop();
  }

  /* ---------- Наклон карточки с бликом на краю ---------- */
  var panel = document.getElementById("heroPanel");
  var area = document.querySelector(".hero__visual");
  if (panel && area && !reduce && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    /* область отслеживания неподвижна — двигается только карточка внутри неё */
    area.addEventListener("pointermove", function (e) {
      var r = area.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      panel.classList.add("is-tilting");
      panel.style.setProperty("--ry", (x * 10).toFixed(2) + "deg");
      panel.style.setProperty("--rx", (-y * 8).toFixed(2) + "deg");
      /* блик — на том краю, куда наклоняется карточка */
      var gx = x > 0 ? 100 : 0, gy = y > 0 ? 100 : 0;
      panel.style.setProperty("--gx", (Math.abs(x) > Math.abs(y) ? gx : 50 + x * 100) + "%");
      panel.style.setProperty("--gy", (Math.abs(y) >= Math.abs(x) ? gy : 50 + y * 100) + "%");
    });
    area.addEventListener("pointerleave", function () {
      panel.classList.remove("is-tilting");
      panel.style.setProperty("--rx", "0deg");
      panel.style.setProperty("--ry", "0deg");
    });
  }
})();
