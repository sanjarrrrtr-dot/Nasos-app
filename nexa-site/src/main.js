import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/cormorant-garamond/700.css";
import "@fontsource/cormorant-garamond/500-italic.css";
import "@fontsource/golos-text/400.css";
import "@fontsource/golos-text/500.css";
import "@fontsource/golos-text/600.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./styles.css";

const WA = "77077799656";
const waLink = (text) => `https://wa.me/${WA}?text=${encodeURIComponent(text)}`;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/* ---------- Аналитика: события в dataLayer (GA4 / GTM подключаются ID) ---------- */
window.dataLayer = window.dataLayer || [];
function track(event, params = {}) {
  window.dataLayer.push({ event, ...params });
  if (typeof window.gtag === "function") window.gtag("event", event, params);
}

/* UTM-метки сохраняем и добавляем в текст заявки */
const utm = (() => {
  let out = {};
  try {
    const p = new URLSearchParams(location.search);
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach((k) => { if (p.get(k)) out[k] = p.get(k); });
    if (Object.keys(out).length) sessionStorage.setItem("nexa_utm", JSON.stringify(out));
    else out = JSON.parse(sessionStorage.getItem("nexa_utm") || "{}");
  } catch (e) { /* хранилище недоступно */ }
  return out;
})();
const utmLine = () => {
  const k = Object.keys(utm);
  return k.length ? "\n\nИсточник: " + k.map((x) => `${x.replace("utm_", "")}=${utm[x]}`).join(", ") : "";
};

/* Открыть WhatsApp; если окно заблокировано, показать обычную ссылку под формой */
function openWa(text, form) {
  const url = waLink(text);
  let w = null;
  try { w = window.open(url, "_blank"); if (w) w.opener = null; } catch (e) { w = null; }
  let a = $(".wa-fallback", form);
  if (!a) {
    a = document.createElement("a");
    a.className = "btn btn--primary wa-fallback";
    a.target = "_blank"; a.rel = "noopener";
    form.appendChild(a);
  }
  a.href = url;
  a.textContent = w ? "WhatsApp не открылся? Нажмите здесь" : "Открыть WhatsApp с заявкой";
}

/* ---------- Шапка и меню ---------- */
const top = $(".top");
const burger = $("#burger");
const nav = $("#nav");
const onScroll = () => top.classList.toggle("is-stuck", window.scrollY > 8);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();
function closeNav() { nav.classList.remove("is-open"); burger.setAttribute("aria-expanded", "false"); burger.setAttribute("aria-label", "Открыть меню"); }
burger.addEventListener("click", () => {
  const open = nav.classList.toggle("is-open");
  burger.setAttribute("aria-expanded", String(open));
  burger.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
});
nav.addEventListener("click", (e) => { if (e.target.closest("a")) closeNav(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeNav(); });
$("#year").textContent = new Date().getFullYear();

/* ---------- Практики ---------- */
const PRACTICES = [
  { id: "system", cat: "manage", label: "Систематизация", name: "NEXA System", res: "Оргструктура, роли и процессы, при которых компания работает без ручного управления собственника.",
    list: ["Диагностика системы управления", "Оргструктура и матрица RACI", "ЦКП должностей и отделов", "Бизнес-процессы и регламенты", "KPI и мотивация", "Регулярный менеджмент", "Контроль качества", "Делегирование и масштабирование"] },
  { id: "sales", cat: "growth", label: "Продажи", name: "NEXA Sales", res: "Отдел продаж, который выполняет план и не зависит от одного сильного менеджера.",
    list: ["Аудит воронки и клиентской базы", "Структура отдела: РОП, менеджеры, SDR", "Скрипты и работа с возражениями", "CRM, SLA и отчёты по конверсии", "Найм, обучение и аттестация", "Внешний РОП"] },
  { id: "marketing", cat: "growth", label: "Маркетинг", name: "NEXA Marketing", res: "Поток заявок в рамках бюджета и понятная окупаемость каждого канала.",
    list: ["Стратегия, сегменты, позиционирование", "Google, Meta, TikTok, YouTube Ads", "SEO и видимость в AI-поиске", "SMM и контент", "Брендинг и дизайн", "Видеопродакшен", "Аналитика: GA4, ROMI, CAC"] },
  { id: "tech", cat: "tech", label: "IT и AI", name: "NEXA AI & Tech", res: "Сайты, CRM, ERP, интеграции и AI-агенты поверх уже описанных процессов.",
    list: ["Сайты, порталы, кабинеты клиента", "amoCRM, Bitrix24, HubSpot", "ERP: продажи, склад, финансы", "AI-агенты и боты в WhatsApp, Telegram", "Интеграции: API, n8n, Make", "База знаний на AI", "BI-дашборды, поддержка по SLA"] },
  { id: "people", cat: "manage", label: "Персонал", name: "NEXA People", res: "Укомплектованная команда, которая быстро входит в работу и остаётся.",
    list: ["HR-аудит", "Подбор персонала и руководителей", "Адаптация и обучение", "Оценка, грейды, кадровый резерв", "Внешний HR-отдел"] },
  { id: "finance", cat: "manage", label: "Финансы", name: "NEXA Finance", res: "Управленческий учёт: вы видите прибыль, деньги и долги по каждому направлению.",
    list: ["Финансовая диагностика", "P&L, движение денег, баланс", "Бюджеты и план-факт", "Юнит-экономика и ценообразование", "Внешний финансовый директор"] },
  { id: "strategy", cat: "manage", label: "Стратегия", name: "NEXA Strategy", res: "Стратегия роста, бизнес-модели и запуск новых направлений.",
    list: ["Бизнес-планы и финансовые модели", "Исследования рынка", "Инвестиционные презентации", "Франчайзинг", "Выход в другие страны", "Управление изменениями"] },
  { id: "academy", cat: "growth", label: "Обучение", name: "NEXA Academy", res: "Обученные собственники, руководители и команды.",
    list: ["Программы для собственников и директоров", "Обучение РОПов и маркетологов", "Тренинги и практикумы", "Стратегические сессии", "Наставничество и аттестации"] }
];
const plist = $("#practicesList");
plist.innerHTML = PRACTICES.map((p, i) => `
  <article class="pr rv" data-cat="${p.cat}">
    <button class="pr__head" type="button" aria-expanded="false" aria-controls="pr-${p.id}">
      <span class="pr__name"><small>${esc(p.label)}</small>${esc(p.name)}</span>
      <span class="pr__res">${esc(p.res)}</span>
      <span class="pr__plus" aria-hidden="true"></span>
    </button>
    <div class="pr__body" id="pr-${p.id}" hidden>
      <ul class="pr__list">${p.list.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
      <a class="pr__go" href="${waLink(`Здравствуйте! Интересует направление ${p.name}.`)}" target="_blank" rel="noopener" data-track="wa_practice">Обсудить ${esc(p.name)} в WhatsApp</a>
    </div>
  </article>`).join("");
plist.addEventListener("click", (e) => {
  const head = e.target.closest(".pr__head");
  if (!head) return;
  const pr = head.parentElement;
  const open = !pr.classList.contains("is-open");
  pr.classList.toggle("is-open", open);
  head.setAttribute("aria-expanded", String(open));
  $(".pr__body", pr).hidden = !open;
});
$$(".seg__b").forEach((b) => b.addEventListener("click", () => {
  $$(".seg__b").forEach((x) => { const on = x === b; x.classList.toggle("is-on", on); x.setAttribute("aria-selected", String(on)); });
  $$(".pr", plist).forEach((pr) => { pr.hidden = b.dataset.f !== "all" && pr.dataset.cat !== b.dataset.f; });
  track("practice_filter", { filter: b.dataset.f });
}));

/* ---------- Отрасли ---------- */
const INDUSTRIES = [
  { name: "Торговля и дистрибуция", lead: "Продажи держатся на нескольких менеджерах, а остатки и дебиторка живут в Excel.",
    pains: ["Нет единой воронки и контроля менеджеров", "Дебиторская задолженность растёт", "Склад и продажи не связаны в учёте"],
    start: ["Аудит воронки и CRM", "Регламент работы с дебиторкой", "Связка CRM и 1С"] },
  { name: "Производство", lead: "Цех работает, но себестоимость и сроки заказов видны только постфактум.",
    pains: ["Себестоимость считается приблизительно", "Срывы сроков между снабжением и цехом", "Мастера перегружены ручным контролем"],
    start: ["Карта процессов от заказа до отгрузки", "ЦКП и KPI участков", "Управленческий учёт и план-факт"] },
  { name: "Услуги и медицина", lead: "Качество зависит от конкретного специалиста, а администраторы теряют обращения.",
    pains: ["Заявки теряются между мессенджерами", "Нет стандартов обслуживания", "Сложно открыть второй филиал"],
    start: ["Стандарты и чек-листы администраторов", "CRM и AI-ассистент для записи", "Модель филиала для тиражирования"] },
  { name: "Строительство и девелопмент", lead: "Проекты идут параллельно, а бюджет и сроки собираются вручную перед каждым совещанием.",
    pains: ["Нет единой картины по объектам", "Перерасход бюджета видно поздно", "Ответственность размыта между подрядчиками"],
    start: ["Проектный офис и регламент совещаний", "Бюджет и план-факт по объектам", "Матрица ответственности RACI"] },
  { name: "Общепит и франшизы", lead: "Каждая точка работает по-своему, и масштабирование упирается в контроль.",
    pains: ["Стандарты не соблюдаются на точках", "Высокая текучесть персонала", "Франчайзи не понимают, как работать"],
    start: ["Операционные стандарты и чек-листы", "Обучение и аттестация персонала", "Пакет франшизы и регламенты"] }
];
const tabs = $("#indTabs");
const panel = $("#indPanel");
tabs.innerHTML = INDUSTRIES.map((x, i) => `<button class="ind__tab" type="button" role="tab" id="ind-t${i}" aria-selected="${i === 0}" aria-controls="indPanel" tabindex="${i === 0 ? 0 : -1}">${esc(x.name)}</button>`).join("");
function showInd(i) {
  const x = INDUSTRIES[i];
  $$(".ind__tab", tabs).forEach((t, j) => { t.setAttribute("aria-selected", String(i === j)); t.tabIndex = i === j ? 0 : -1; });
  panel.setAttribute("aria-labelledby", `ind-t${i}`);
  panel.innerHTML = `<p class="ind__lead">${esc(x.lead)}</p>
    <div><h3>Типичные проблемы</h3><ul>${x.pains.map((p) => `<li>${esc(p)}</li>`).join("")}</ul></div>
    <div class="ind__start"><h3>С чего начинаем</h3><ul>${x.start.map((p) => `<li>${esc(p)}</li>`).join("")}</ul></div>`;
  typograph(panel);
}
tabs.addEventListener("click", (e) => {
  const t = e.target.closest(".ind__tab");
  if (!t) return;
  const i = $$(".ind__tab", tabs).indexOf(t);
  showInd(i);
  track("industry_select", { industry: INDUSTRIES[i].name });
});
tabs.addEventListener("keydown", (e) => {
  if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(e.key)) return;
  e.preventDefault();
  const all = $$(".ind__tab", tabs);
  const cur = all.indexOf(document.activeElement);
  const next = (cur + (e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1) + all.length) % all.length;
  all[next].focus(); showInd(next);
});

/* ---------- Пакеты: сразу в WhatsApp ---------- */
$$("[data-package]").forEach((a) => {
  a.href = waLink(`Здравствуйте! Интересует формат ${a.dataset.package}. Расскажите, пожалуйста, об условиях и сроках.`);
  a.dataset.track = "wa_package";
});

/* ---------- Валидация форм ---------- */
const clip = (v, n) => String(v || "").trim().slice(0, n);
const cleanPhone = (v) => (v || "").replace(/[^\d+]/g, "");
const validPhone = (v) => { const d = v.replace(/\D/g, ""); return d.length >= 10 && d.length <= 15; };
function validate(form) {
  const errs = [];
  const { name, phone, consent, website } = form.elements;
  [name, phone].forEach((i) => i.classList.remove("is-bad"));
  if (website && website.value) return ["spam"];
  if (clip(name.value, 80).length < 2) { errs.push("укажите имя"); name.classList.add("is-bad"); }
  if (!validPhone(cleanPhone(phone.value))) { errs.push("проверьте номер телефона"); phone.classList.add("is-bad"); }
  if (!consent.checked) errs.push("отметьте согласие на обработку данных");
  return errs;
}
let lastSend = 0;
const tooSoon = () => { const n = Date.now(); if (n - lastSend < 5000) return true; lastSend = n; return false; };
const errText = (errs) => errs.length ? errs[0][0].toUpperCase() + errs.join(", ").slice(1) + "." : "";

const lead = $("#leadForm");
lead.addEventListener("submit", (e) => {
  e.preventDefault();
  const errs = validate(lead);
  if (errs[0] === "spam") return;
  $("#formError").textContent = errText(errs);
  if (errs.length || tooSoon()) return;
  const f = lead.elements;
  const text = "Здравствуйте! Заявка с сайта NEXA GROUP.\n\n" +
    `Имя: ${clip(f.name.value, 80)}\n` +
    (clip(f.company.value, 120) ? `Компания: ${clip(f.company.value, 120)}\n` : "") +
    `Телефон: ${cleanPhone(f.phone.value)}\n` +
    (f.interest.value ? `Интересует: ${f.interest.value}\n` : "") +
    (clip(f.comment.value, 600) ? `Задача: ${clip(f.comment.value, 600)}` : "") + utmLine();
  track("generate_lead", { form: "contact", interest: f.interest.value || "не выбрано" });
  openWa(text, lead);
});

/* ---------- Экспресс-диагностика ---------- */
const QUESTIONS = [
  { key: "size", q: "Сколько человек работает в компании?", hint: "Выберите один вариант", opts: ["1–10", "11–30", "31–100", "Больше 100"] },
  { key: "task", q: "Какая задача главная сейчас?", hint: "Выберите один вариант", opts: ["Увеличить продажи", "Навести порядок в управлении", "Внедрить CRM, ERP или AI", "Нужна комплексная перестройка"] },
  { key: "regs", q: "Есть ли регламенты и KPI?", hint: "Выберите один вариант", opts: ["Нет", "Частично", "Есть, но не работают", "Есть и работают"] },
  { key: "improve", q: "Что хотите улучшить?", hint: "Можно выбрать несколько", multi: true, opts: ["Маркетинг", "Продажи", "Персонал", "Управление", "Финансы", "Всё сразу"] },
  { key: "when", q: "Когда хотите начать?", hint: "Выберите один вариант", opts: ["В этом месяце", "В ближайшие 1–3 месяца", "Пока изучаю варианты"] }
];
const answers = {};
let step = 0;
const qBody = $("#quizBody"), qBar = $("#quizBar"), qCount = $("#quizCount"), qNext = $("#quizNext"), qBack = $("#quizBack");
let started = false;

function renderQ() {
  const Q = QUESTIONS[step];
  const cur = answers[Q.key] || (Q.multi ? [] : null);
  qBody.innerHTML = `<p class="quiz__q">${Q.q}</p><p class="quiz__hint">${Q.hint}</p>
    <div class="quiz__opts" role="${Q.multi ? "group" : "radiogroup"}" aria-label="${esc(Q.q)}">
    ${Q.opts.map((o) => { const sel = Q.multi ? cur.includes(o) : cur === o; return `<button type="button" class="opt" role="${Q.multi ? "checkbox" : "radio"}" aria-checked="${sel}" data-v="${esc(o)}">${esc(o)}</button>`; }).join("")}
    </div>`;
  qBar.style.width = `${((step + 1) / (QUESTIONS.length + 1)) * 100}%`;
  qCount.textContent = `Вопрос ${step + 1} из ${QUESTIONS.length}`;
  qBack.hidden = step === 0;
  qNext.hidden = false;
  qNext.textContent = step === QUESTIONS.length - 1 ? "Показать результат" : "Дальше";
  qNext.disabled = Q.multi ? !cur.length : !cur;
}
qBody.addEventListener("click", (e) => {
  const o = e.target.closest(".opt");
  if (!o) return;
  if (!started) { started = true; track("diagnostic_start"); }
  const Q = QUESTIONS[step], v = o.dataset.v;
  if (Q.multi) {
    let arr = answers[Q.key] || [];
    if (v === "Всё сразу") arr = arr.includes(v) ? [] : [v];
    else { arr = arr.filter((x) => x !== "Всё сразу"); arr = arr.includes(v) ? arr.filter((x) => x !== v) : arr.concat(v); }
    answers[Q.key] = arr; renderQ();
  } else {
    answers[Q.key] = v; renderQ();
    setTimeout(() => { if (step < QUESTIONS.length - 1 && answers[Q.key] === v && QUESTIONS[step] === Q) { step++; renderQ(); } }, 220);
  }
});
qBack.addEventListener("click", () => { step = Math.max(0, Math.min(step, QUESTIONS.length) - 1); renderQ(); });
qNext.addEventListener("click", () => { if (step < QUESTIONS.length - 1) { step++; renderQ(); } else { step = QUESTIONS.length; renderResult(); } });

function recommend() {
  const { size, task, regs } = answers;
  const imp = answers.improve || [];
  const dirs = [];
  const add = (d) => { if (!dirs.includes(d)) dirs.push(d); };
  const map = { "Маркетинг": "Marketing", "Продажи": "Sales", "Персонал": "People", "Управление": "System", "Финансы": "Finance" };
  if (task === "Увеличить продажи") { add("Sales"); add("Marketing"); }
  if (task === "Навести порядок в управлении") add("System");
  if (task === "Внедрить CRM, ERP или AI") add("AI & Tech");
  if (task === "Нужна комплексная перестройка") { add("System"); add("Strategy"); add("AI & Tech"); }
  if (imp.includes("Всё сразу")) Object.values(map).forEach(add);
  imp.forEach((i) => map[i] && add(map[i]));
  if (regs === "Нет" || regs === "Есть, но не работают") add("System");
  const big = size === "31–100" || size === "Больше 100";
  let pkg;
  if (task === "Нужна комплексная перестройка" || imp.includes("Всё сразу")) {
    pkg = size === "Больше 100" ? { n: "Enterprise", p: "по запросу", d: "Корпоративная трансформация и проектный офис" }
      : { n: "Transformation", p: "от 3 000 000 ₸ за проект", d: "Систематизация, продажи, HR и CRM вместе" };
  } else if (task === "Навести порядок в управлении" || (big && regs !== "Есть и работают")) {
    pkg = { n: "System", p: "от 1 500 000 ₸ за проект", d: "Оргструктура, ЦКП, KPI и регламенты" };
  } else if (task === "Увеличить продажи" && regs === "Есть и работают") {
    pkg = { n: "Growth", p: "от 450 000 ₸ в месяц", d: "Маркетинг, заявки и аналитика" };
  } else {
    pkg = { n: "Audit", p: "от 250 000 ₸ за проект", d: "Диагностика, карта проблем и план изменений" };
  }
  return { dirs: dirs.slice(0, 5), pkg };
}
function renderResult() {
  const r = recommend();
  qBar.style.width = "100%";
  qCount.textContent = "Результат";
  qNext.hidden = true; qBack.hidden = false;
  qBody.innerHTML = `<p class="quiz__q">Разумно начать с&nbsp;формата ${esc(r.pkg.n)}</p>
    <div class="res__pkg"><small>Рекомендация</small><b>NEXA ${esc(r.pkg.n)}</b><p>${esc(r.pkg.d)}. ${esc(r.pkg.p)}.</p></div>
    <p class="quiz__hint">Практики, которые понадобятся:</p>
    <div class="res__dirs">${r.dirs.map((d) => `<span>${esc(d)}</span>`).join("")}</div>
    <form class="res__form" id="quizForm" novalidate>
      <input name="name" id="q-name" placeholder="Имя" autocomplete="name" maxlength="80" aria-label="Имя">
      <input name="phone" id="q-phone" type="tel" inputmode="tel" placeholder="Телефон" autocomplete="tel" maxlength="20" aria-label="Телефон">
      <input type="text" name="website" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
      <label class="consent"><input type="checkbox" name="consent" id="q-consent"> <span>Согласен(на) на&nbsp;обработку персональных данных по&nbsp;<a href="./privacy.html" target="_blank">политике</a></span></label>
      <p class="form__err" id="quizError" role="alert"></p>
      <button class="btn btn--primary" type="submit">Получить разбор в&nbsp;WhatsApp</button>
    </form>`;
  track("diagnostic_complete", { package: r.pkg.n });
  $("#quizForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.target;
    const errs = validate(form);
    if (errs[0] === "spam") return;
    $("#quizError").textContent = errText(errs);
    if (errs.length || tooSoon()) return;
    const text = "Здравствуйте! Прошёл(ла) диагностику на сайте NEXA GROUP.\n\n" +
      `Имя: ${clip(form.elements.name.value, 80)}\nТелефон: ${cleanPhone(form.elements.phone.value)}\n\n` +
      `Сотрудников: ${answers.size}\nГлавная задача: ${answers.task}\nРегламенты и KPI: ${answers.regs}\n` +
      `Улучшить: ${(answers.improve || []).join(", ")}\nСтарт: ${answers.when}\n\n` +
      `Рекомендация сайта: NEXA ${r.pkg.n} (${r.dirs.join(", ")})` + utmLine();
    track("generate_lead", { form: "diagnostic", package: r.pkg.n });
    openWa(text, form);
  });
}

/* ---------- Типограф: предлоги не остаются в конце строки ---------- */
function typograph(root) {
  const SHORT = /(^|[\s(«"])(в|во|и|с|со|к|ко|о|об|у|а|на|по|за|от|до|не|из|для|при|без|или|что|как|под|над|про|же|их|ее|её|мы|вы)\s+/gi;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => /^(SCRIPT|STYLE|TEXTAREA|OPTION|title|text)$/i.test(n.parentNode?.nodeName || "") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
  });
  const list = [];
  let n;
  while ((n = walker.nextNode())) list.push(n);
  list.forEach((t) => {
    const v = t.nodeValue;
    if (v.trim().length < 3) return;
    const out = v.replace(SHORT, "$1$2 ").replace(SHORT, "$1$2 ").replace(/ —/g, " —");
    if (out !== v) t.nodeValue = out;
  });
}

/* ---------- Мягкое появление блоков (контент виден сразу) ---------- */
function reveal() {
  if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const els = $$(".pains li, .steps li, .doc, .ai div, .price, .pr").filter((el) => el.getBoundingClientRect().top > innerHeight);
  els.forEach((el) => { el.classList.add("rv", "is-pre"); });
  const io = new IntersectionObserver((en) => en.forEach((x) => {
    if (x.isIntersecting) { x.target.classList.remove("is-pre"); io.unobserve(x.target); }
  }), { rootMargin: "0px 0px -40px 0px" });
  els.forEach((el) => io.observe(el));
}

/* ---------- Трекинг кликов по WhatsApp ---------- */
document.addEventListener("click", (e) => {
  const a = e.target.closest("[data-track]");
  if (a) track("contact_click", { channel: "whatsapp", place: a.dataset.track });
});

showInd(0);
renderQ();
typograph(document.body);
reveal();
