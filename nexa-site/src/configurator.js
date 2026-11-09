// «Соберите свой проект»: выбор практик и размера компании → состав работ, ориентир срока,
// подходящий формат (цены из ТЗ) и отправка в WhatsApp. Сроки — ориентир, уточняются на диагностике.
import gsap from "gsap";

const T = {
  ru: {
    practices: [
      { id: "system", name: "Систематизация", items: ["Оргструктура и RACI", "ЦКП и KPI отделов", "Регламенты ключевых процессов"], m: [2, 3] },
      { id: "sales", name: "Отдел продаж", items: ["Структура отдела и мотивация", "Скрипты и стандарты", "Воронка и контроль плана"], m: [1.5, 2.5] },
      { id: "marketing", name: "Маркетинг", items: ["Стратегия и позиционирование", "Запуск рекламы", "Сквозная аналитика"], m: [1, 2] },
      { id: "tech", name: "CRM, ERP и AI", items: ["Настройка CRM и интеграции", "Автоматизация процессов", "AI-ассистент для заявок"], m: [1.5, 3] },
      { id: "people", name: "Персонал", items: ["Профили должностей и подбор", "Адаптация новичков", "Оценка и грейды"], m: [1.5, 2.5] },
      { id: "finance", name: "Финансы", items: ["Управленческий учёт", "P&L и движение денег", "Бюджет и план-факт"], m: [1.5, 2.5] },
      { id: "strategy", name: "Стратегия", items: ["Анализ рынка и модели", "Стратегия роста", "Финансовая модель"], m: [1, 2] },
      { id: "academy", name: "Обучение", items: ["Программа для руководителей", "Тренинги команды", "Аттестация"], m: [1, 1.5] }
    ],
    empty: "Отметьте хотя бы одно направление слева",
    title: "Ваш проект",
    works: "Что сделаем",
    stages: "Этапы",
    stagesList: ["Диагностика", "Проектирование", "Внедрение", "Контроль"],
    time: "Ориентир по сроку",
    months: (a, b) => `${a}–${b} мес.`,
    format: "Подходящий формат",
    note: "Сроки и стоимость — ориентир. Точный расчёт фиксируем после диагностики.",
    send: "Отправить проект в WhatsApp",
    sizeName: { s: "до 30 человек", m: "31–100 человек", l: "больше 100 человек" },
    pkgs: {
      audit: ["NEXA Audit", "от 250 000 ₸ за проект"],
      growth: ["NEXA Growth", "от 450 000 ₸ в месяц"],
      system: ["NEXA System", "от 1 500 000 ₸ за проект"],
      transformation: ["NEXA Transformation", "от 3 000 000 ₸ за проект"],
      enterprise: ["NEXA Enterprise", "по запросу"]
    },
    msg: (size, names, months, pkg) => `Здравствуйте! Собрал(а) проект на сайте NEXA GROUP.\n\nРазмер компании: ${size}\nНаправления: ${names}\nОриентир по сроку: ${months}\nФормат: ${pkg}\n\nХочу обсудить.`
  },
  kk: {
    practices: [
      { id: "system", name: "Жүйелеу", items: ["Ұйымдық құрылым және RACI", "Бөлімдердің ЦКП мен KPI-ы", "Негізгі процестер регламенттері"], m: [2, 3] },
      { id: "sales", name: "Сату бөлімі", items: ["Бөлім құрылымы және мотивация", "Скрипттер мен стандарттар", "Воронка және жоспарды бақылау"], m: [1.5, 2.5] },
      { id: "marketing", name: "Маркетинг", items: ["Стратегия және позициялау", "Жарнаманы іске қосу", "Толық аналитика"], m: [1, 2] },
      { id: "tech", name: "CRM, ERP және AI", items: ["CRM баптау және интеграциялар", "Процестерді автоматтандыру", "Өтінімдерге арналған AI-ассистент"], m: [1.5, 3] },
      { id: "people", name: "Персонал", items: ["Лауазым профильдері және іріктеу", "Жаңа қызметкерлерді бейімдеу", "Бағалау және грейдтер"], m: [1.5, 2.5] },
      { id: "finance", name: "Қаржы", items: ["Басқарушылық есеп", "P&L және ақша қозғалысы", "Бюджет және жоспар-факт"], m: [1.5, 2.5] },
      { id: "strategy", name: "Стратегия", items: ["Нарық пен модельдерді талдау", "Өсу стратегиясы", "Қаржылық модель"], m: [1, 2] },
      { id: "academy", name: "Оқыту", items: ["Басшыларға арналған бағдарлама", "Команда тренингтері", "Аттестаттау"], m: [1, 1.5] }
    ],
    empty: "Сол жақтан кемінде бір бағытты белгілеңіз",
    title: "Сіздің жобаңыз",
    works: "Не істейміз",
    stages: "Кезеңдер",
    stagesList: ["Диагностика", "Жобалау", "Енгізу", "Бақылау"],
    time: "Мерзім бағдары",
    months: (a, b) => `${a}–${b} ай`,
    format: "Қолайлы формат",
    note: "Мерзім мен құн — бағдар ғана. Нақты есепті диагностикадан кейін бекітеміз.",
    send: "Жобаны WhatsApp-қа жіберу",
    sizeName: { s: "30 адамға дейін", m: "31–100 адам", l: "100 адамнан көп" },
    pkgs: {
      audit: ["NEXA Audit", "жоба үшін 250 000 ₸-ден"],
      growth: ["NEXA Growth", "айына 450 000 ₸-ден"],
      system: ["NEXA System", "жоба үшін 1 500 000 ₸-ден"],
      transformation: ["NEXA Transformation", "жоба үшін 3 000 000 ₸-ден"],
      enterprise: ["NEXA Enterprise", "сұраныс бойынша"]
    },
    msg: (size, names, months, pkg) => `Сәлеметсіз бе! NEXA GROUP сайтында жоба құрастырдым.\n\nКомпания көлемі: ${size}\nБағыттар: ${names}\nМерзім бағдары: ${months}\nФормат: ${pkg}\n\nТалқылағым келеді.`
  }
};

export function initConfigurator({ $, $$, esc, waLink, track, lang = "ru", dict }) {
  const L = dict || T[lang] || T.ru;
  const grid = $("#cfgPractices"), sum = $("#cfgSum");
  if (!grid || !sum) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const picked = new Set(["system"]);
  let size = "s";

  grid.innerHTML = L.practices.map((p) =>
    `<button type="button" class="cfg__chip" role="checkbox" aria-checked="${picked.has(p.id)}" data-id="${p.id}"><span class="cfg__box" aria-hidden="true"></span>${esc(p.name)}</button>`).join("");

  function pkgFor(ids) {
    const has = (x) => ids.includes(x);
    if (size === "l" && ids.length >= 3) return "enterprise";
    if (ids.length >= 3 || (has("system") && (has("sales") || has("tech") || has("people")))) return "transformation";
    if (has("system") || has("strategy")) return "system";
    if (ids.length === 1 && has("marketing")) return "growth";
    return "audit";
  }
  function monthsFor(ids) {
    const ps = L.practices.filter((p) => ids.includes(p.id));
    const k = size === "s" ? 1 : size === "m" ? 1.3 : 1.7;
    const lo = Math.max(...ps.map((p) => p.m[0])) + .5 * (ps.length - 1);
    const hi = Math.max(...ps.map((p) => p.m[1])) + .75 * (ps.length - 1);
    const r = (x) => Math.max(1, Math.round(x * k));
    const a = r(lo), b = Math.max(a + 1, r(hi));
    return L.months(a, b);
  }

  function render() {
    const ids = L.practices.filter((p) => picked.has(p.id)).map((p) => p.id);
    if (!ids.length) { sum.innerHTML = `<p class="cfg__empty">${esc(L.empty)}</p>`; return; }
    const ps = L.practices.filter((p) => picked.has(p.id));
    const pk = L.pkgs[pkgFor(ids)];
    const months = monthsFor(ids);
    sum.innerHTML = `
      <p class="cfg__h">${esc(L.title)}</p>
      <div class="cfg__row"><span>${esc(L.time)}</span><b>${esc(months)}</b></div>
      <div class="cfg__row"><span>${esc(L.format)}</span><b>${esc(pk[0])}<small>${esc(pk[1])}</small></b></div>
      <p class="cfg__sub">${esc(L.stages)}</p>
      <ol class="cfg__stages">${L.stagesList.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
      <p class="cfg__sub">${esc(L.works)}</p>
      <ul class="cfg__works">${ps.map((p) => `<li><b>${esc(p.name)}</b>${p.items.map((i) => `<span>${esc(i)}</span>`).join("")}</li>`).join("")}</ul>
      <p class="cfg__note">${esc(L.note)}</p>
      <a class="btn btn--primary cfg__send" target="_blank" rel="noopener" data-track="wa_configurator" href="${waLink(L.msg(L.sizeName[size], ps.map((p) => p.name).join(", "), months, `${pk[0]} (${pk[1]})`))}">${esc(L.send)}</a>`;
    if (!reduce) gsap.from(sum.querySelectorAll(".cfg__row, .cfg__works li"), { y: 10, opacity: 0, duration: .35, stagger: .03, ease: "power2.out" });
    window.dispatchEvent(new Event("nexa:layout"));
  }

  grid.addEventListener("click", (e) => {
    const b = e.target.closest(".cfg__chip"); if (!b) return;
    const id = b.dataset.id;
    picked.has(id) ? picked.delete(id) : picked.add(id);
    b.setAttribute("aria-checked", String(picked.has(id)));
    track("configurator_change", { practice: id, on: picked.has(id) });
    render();
  });
  $$("#cfgSize .seg__b").forEach((b) => b.addEventListener("click", () => {
    size = b.dataset.size;
    $$("#cfgSize .seg__b").forEach((x) => { const on = x === b; x.classList.toggle("is-on", on); x.setAttribute("aria-checked", String(on)); });
    render();
  }));
  render();
}
