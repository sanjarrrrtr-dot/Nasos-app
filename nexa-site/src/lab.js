// Продукты NEXA AI: список слева, пример интерфейса справа (на телефоне — вкладки-чипсы сверху).
// Интерфейсы нарисованы HTML-разметкой и подписаны как примеры, это не скриншоты клиентских систем.

const PRODUCTS = [
  {
    id: "sales", name: "AI Sales Agent", tag: "WhatsApp · сайт",
    text: "Отвечает клиентам круглосуточно, задаёт квалифицирующие вопросы и передаёт готовую заявку менеджеру в CRM.",
    who: "Для компаний, где заявки приходят вечером и в выходные",
    ui: `<div class="m-chat">
      <div class="m-chat__top"><b>NEXA Sales Agent</b><span>онлайн</span></div>
      <p class="in">Здравствуйте, сколько стоит внедрить CRM?</p>
      <p class="out">Здравствуйте! Подскажу. Сколько человек в отделе продаж и откуда приходят заявки?</p>
      <p class="in">5 менеджеров, Instagram и сайт</p>
      <p class="out">Понял. Для такого отдела обычно 2–3 недели. Передаю менеджеру, он пришлёт расчёт сегодня.</p>
      <div class="m-toast">Заявка создана в CRM · отдел 5 чел. · Instagram, сайт</div>
    </div>`
  },
  {
    id: "crm", name: "CRM и воронка", tag: "amoCRM · Bitrix24",
    text: "Этапы сделок, обязательные поля, задачи и уведомления. Ни одна заявка не теряется между мессенджерами.",
    who: "Для отделов продаж от 2 человек",
    ui: `<div class="m-crm">
      <div class="m-crm__col"><h5>Новые · 3</h5><div class="m-card"><small>Сайт</small>Склад-сервис<i>позвонить до 15:00</i></div><div class="m-card"><small>WhatsApp</small>Клиника «Здоровье»<i>отправить КП</i></div></div>
      <div class="m-crm__col"><h5>Диагностика · 2</h5><div class="m-card is-hot"><small>Рекомендация</small>Строй-Инвест<i>встреча завтра</i></div></div>
      <div class="m-crm__col"><h5>Договор · 1</h5><div class="m-card is-ok"><small>Instagram</small>Кофейни Astana<i>счёт оплачен</i></div></div>
    </div>`
  },
  {
    id: "analytics", name: "AI Analytics", tag: "KPI · отклонения",
    text: "Собирает показатели из CRM и учёта и каждое утро присылает руководителю короткую сводку с отклонениями.",
    who: "Для собственников, которые хотят видеть цифры без Excel",
    ui: `<div class="m-report">
      <div class="m-report__top"><b>Сводка за неделю</b><span>пн, 08:00</span></div>
      <div class="m-kpi"><div><small>Выручка</small><b>18,4 млн ₸</b><em class="up">+12 %</em></div><div><small>Конверсия</small><b>23 %</b><em class="down">−4 п.</em></div><div><small>Ср. чек</small><b>412 тыс ₸</b><em class="up">+6 %</em></div></div>
      <p class="m-alert"><b>Отклонение:</b> у двух менеджеров конверсия ниже 15 %. Рекомендуем разобрать звонки на планёрке.</p>
    </div>`
  },
  {
    id: "assistant", name: "AI Business Assistant", tag: "регламенты · база знаний",
    text: "Сотрудник задаёт вопрос, ассистент отвечает по вашим регламентам и показывает документ-источник.",
    who: "Для компаний с регламентами и новичками в штате",
    ui: `<div class="m-chat m-chat--doc">
      <div class="m-chat__top"><b>Ассистент по регламентам</b><span>внутренний</span></div>
      <p class="in">Какую скидку я могу дать без согласования?</p>
      <p class="out">До 5 %. Скидку больше согласует руководитель отдела в CRM, поле «Скидка».</p>
      <div class="m-src">Источник: Регламент продаж, п. 4.2 · версия от 01.10</div>
    </div>`
  },
  {
    id: "hr", name: "AI HR", tag: "подбор · адаптация",
    text: "Первичный отбор откликов по профилю должности, анкеты кандидатов и план адаптации новичка.",
    who: "Для компаний, которые нанимают постоянно",
    ui: `<div class="m-list">
      <div class="m-list__top"><b>Вакансия: менеджер по продажам</b><span>48 откликов</span></div>
      <div class="m-row"><span>Айгерим С.</span><em class="ok">подходит · 86</em></div>
      <div class="m-row"><span>Данияр К.</span><em class="ok">подходит · 79</em></div>
      <div class="m-row"><span>Ольга П.</span><em class="mid">уточнить опыт · 61</em></div>
      <div class="m-row"><span>Ерлан Т.</span><em class="no">не подходит · 34</em></div>
    </div>`
  },
  {
    id: "portal", name: "Кабинет клиента", tag: "проекты · документы",
    text: "Этапы проекта, документы, счета и KPI в одном месте. Клиент видит статус без звонков менеджеру.",
    who: "Для компаний с долгими проектами",
    ui: `<div class="m-portal">
      <div class="m-portal__top"><b>Проект: систематизация</b><span>этап 3 из 6</span></div>
      <div class="m-steps"><i class="done"></i><i class="done"></i><i class="now"></i><i></i><i></i><i></i></div>
      <div class="m-row"><span>Карта проблем</span><em class="ok">принято</em></div>
      <div class="m-row"><span>Целевая модель</span><em class="ok">принято</em></div>
      <div class="m-row"><span>Регламенты отдела продаж</span><em class="mid">на согласовании</em></div>
      <div class="m-row"><span>Счёт № 3</span><em class="mid">к оплате до 20.11</em></div>
    </div>`
  }
];

export function initLab({ $, $$, esc, track }) {
  const tabs = $("#labTabs"), panel = $("#labPanel");
  if (!tabs || !panel) return;
  tabs.innerHTML = PRODUCTS.map((p, i) =>
    `<button class="lab__tab" type="button" role="tab" id="lab-t${i}" aria-controls="labPanel" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">
      <span class="lab__n">${String(i + 1).padStart(2, "0")}</span><span>${esc(p.name)}</span></button>`).join("");
  const show = (i) => {
    const p = PRODUCTS[i];
    $$(".lab__tab", tabs).forEach((t, j) => { t.setAttribute("aria-selected", String(i === j)); t.tabIndex = i === j ? 0 : -1; });
    panel.setAttribute("aria-labelledby", `lab-t${i}`);
    panel.innerHTML = `<div class="lab__screen"><div class="lab__ui">${p.ui}</div><p class="lab__note">пример интерфейса</p></div>
      <div class="lab__info"><p class="lab__tag">${esc(p.tag)}</p><h3>${esc(p.name)}</h3><p>${esc(p.text)}</p><p class="lab__who">${esc(p.who)}</p></div>`;
    panel.classList.remove("is-in"); void panel.offsetWidth; panel.classList.add("is-in");
  };
  tabs.addEventListener("click", (e) => {
    const t = e.target.closest(".lab__tab"); if (!t) return;
    const i = $$(".lab__tab", tabs).indexOf(t); show(i); track("ai_product_view", { product: PRODUCTS[i].name });
  });
  tabs.addEventListener("keydown", (e) => {
    if (!["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft"].includes(e.key)) return;
    e.preventDefault();
    const all = $$(".lab__tab", tabs), cur = all.indexOf(document.activeElement);
    const n = (cur + (e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : -1) + all.length) % all.length;
    all[n].focus(); show(n);
  });
  show(0);
}
