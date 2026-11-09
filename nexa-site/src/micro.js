// Микроанимации и детали: «перекатывающиеся» кнопки, магнит, плавные ответы FAQ,
// копирование номера, время в Астане, кнопка «наверх», подсказка у WhatsApp.
import gsap from "gsap";
import { tr } from "./i18n.js";

export function initMicro({ $, $$, track }) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- Кнопки: текст «перекатывается» вверх при наведении, у главных — стрелка ---------- */
  $$("a.btn, .film__play").forEach((b) => {
    if (b.dataset.roll || b.querySelector("svg")) return;
    const label = b.innerHTML.trim();
    b.dataset.roll = "1";
    const arrow = b.classList.contains("btn--primary") && !b.classList.contains("top__cta") ? '<span class="btn__arrow" aria-hidden="true">→</span>' : "";
    b.innerHTML = `<span class="btn__roll"><span class="btn__t">${label}</span><span class="btn__t" aria-hidden="true">${label}</span></span>${arrow}`;
  });

  /* ---------- Магнит: главные кнопки слегка тянутся к курсору (только мышь) ---------- */
  if (fine && !reduce) {
    $$(".hero__cta .btn--primary, .band .btn, .foot__cta .btn, .top__cta").forEach((b) => {
      const xTo = gsap.quickTo(b, "x", { duration: .5, ease: "power3" });
      const yTo = gsap.quickTo(b, "y", { duration: .5, ease: "power3" });
      b.addEventListener("pointermove", (e) => {
        const r = b.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * .25);
        yTo((e.clientY - r.top - r.height / 2) * .35);
      });
      b.addEventListener("pointerleave", () => { xTo(0); yTo(0); });
    });
  }

  /* ---------- FAQ: ответ раскрывается плавно, а не рывком ---------- */
  $$(".faq details").forEach((d) => {
    const s = d.querySelector("summary"), p = d.querySelector("p");
    s.addEventListener("click", (e) => {
      if (reduce) return;
      e.preventDefault();
      if (d.open) {
        gsap.to(p, { height: 0, opacity: 0, duration: .3, ease: "power2.in", onComplete: () => { d.open = false; gsap.set(p, { clearProps: "all" }); window.dispatchEvent(new Event("nexa:layout")); } });
      } else {
        d.open = true;
        gsap.from(p, { height: 0, opacity: 0, duration: .45, ease: "power3.out", clearProps: "all", onComplete: () => window.dispatchEvent(new Event("nexa:layout")) });
        track("faq_open", { q: s.textContent.trim().slice(0, 60) });
      }
    });
  });

  /* ---------- Уведомление ---------- */
  const toast = $("#toast");
  let tt;
  const say = (text) => { toast.textContent = text; toast.classList.add("is-on"); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove("is-on"), 2200); };

  /* ---------- Номер телефона копируется по нажатию ---------- */
  $$("[data-copy]").forEach((b) => b.addEventListener("click", async () => {
    const v = b.dataset.copy;
    try { await navigator.clipboard.writeText(v); say(tr("Номер скопирован")); }
    catch (e) {
      const r = document.createRange(); r.selectNodeContents(b);
      const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
      say(tr("Номер выделен — нажмите «Копировать»"));
    }
    track("phone_copy");
  }));

  /* ---------- Местное время в Астане (UTC+5) ---------- */
  const tEl = $("#astTime");
  const tick = () => {
    try { tEl.textContent = new Intl.DateTimeFormat("ru-RU", { timeZone: "Asia/Almaty", hour: "2-digit", minute: "2-digit" }).format(new Date()); }
    catch (e) { const d = new Date(Date.now() + 5 * 3600e3); tEl.textContent = d.toISOString().slice(11, 16); }
  };
  if (tEl) { tick(); setInterval(tick, 30000); }

  /* ---------- Наверх ---------- */
  $("#toTop")?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    $(".top")?.focus?.();
  });

  /* ---------- WhatsApp: один раз через 10 секунд — мягкий импульс и подсказка ---------- */
  const fab = $(".wa-fab");
  if (fab && !reduce) {
    const tip = document.createElement("span");
    tip.className = "wa-tip"; tip.textContent = tr("Есть вопрос? Напишите");
    fab.appendChild(tip);
    setTimeout(() => {
      fab.classList.add("is-wake");
      setTimeout(() => fab.classList.remove("is-wake"), 5000);
    }, 10000);
  }
}
