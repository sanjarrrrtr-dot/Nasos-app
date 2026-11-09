// Фирменные переходы по мотивам шаблона Relay, в цветах NEXA:
// 1) заставка: плитка со знаком NEXA сжимается и открывает сайт (один раз за сессию);
// 2) «портал»: при прокрутке плитка растёт на весь экран и превращается в тёмный раздел «Как мы работаем»;
// 3) текущие световые линии на фоне тёмных разделов (canvas, ставится на паузу вне экрана).
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

const MARK = `<svg viewBox="0 0 40 40" aria-hidden="true"><g fill="none" stroke="#fff" stroke-width="2.6" stroke-linejoin="round">
  <rect x="13.5" y="1.3" width="13" height="9.5" rx="1.6" fill="#fff"/><path d="M20 10.8V18M5.3 18H34.7M5.3 18V23.4M20 18V23.4M34.7 18V23.4" stroke-linecap="square"/>
  <rect x="1.3" y="23.4" width="8" height="13.3" rx="1.6"/><rect x="16" y="23.4" width="8" height="13.3" rx="1.6" fill="#101827" stroke="#101827"/>
  <rect x="30.7" y="23.4" width="8" height="13.3" rx="1.6"/></g></svg>`;

/* ---------- 1. Заставка ---------- */
export function playIntro(onDone) {
  let seen = false;
  try { seen = sessionStorage.getItem("nexa_intro") === "1"; sessionStorage.setItem("nexa_intro", "1"); } catch (e) { /* без хранилища — показываем */ }
  if (seen) { onDone(); return; }
  const o = document.createElement("div");
  o.className = "intro"; o.setAttribute("aria-hidden", "true");
  o.innerHTML = `<div class="intro__tile">${MARK}</div>`;
  document.body.appendChild(o);
  const tile = o.querySelector(".intro__tile");
  gsap.timeline({ onComplete: () => { o.remove(); } })
    .fromTo(tile, { scale: .2, opacity: 0, rotate: -8 }, { scale: 1, opacity: 1, rotate: 0, duration: .55, ease: "back.out(1.6)" })
    .to(o, { clipPath: "circle(0% at 50% 50%)", duration: .75, ease: "expo.inOut" }, "+=.25")
    .add(onDone, "-=.45");
}

/* ---------- 2. «Портал» перед разделом «Как мы работаем» ---------- */
export function initPortal() {
  const portal = document.querySelector(".portal");
  if (!portal) return;
  const tile = portal.querySelector(".portal__tile");
  const label = portal.querySelector(".portal__label");
  gsap.timeline({ scrollTrigger: { trigger: portal, start: "top top", end: "bottom bottom", scrub: .5 } })
    .fromTo(tile, { width: 120, height: 120, borderRadius: 28, backgroundColor: "#0F766E" },
      { width: () => innerWidth, height: () => innerHeight, borderRadius: 0, backgroundColor: "#101827", ease: "power2.inOut", duration: 1 })
    .fromTo(tile.querySelector("svg"), { scale: 1, opacity: 1 }, { scale: .6, opacity: 0, duration: .45 }, .45)
    .fromTo(label, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .35 }, .55)
    .to(label, { opacity: 0, y: -20, duration: .2 }, .92);
}

/* ---------- 3. Световые линии ---------- */
export function initFlow(selector) {
  document.querySelectorAll(selector).forEach((host) => {
    const c = document.createElement("canvas");
    c.className = "flow"; c.setAttribute("aria-hidden", "true");
    host.prepend(c);
    const ctx = c.getContext("2d");
    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 1.5), visible = false, raf = 0, t0 = performance.now();
    const LINES = 16;
    const size = () => { const r = host.getBoundingClientRect(); w = r.width; h = r.height; c.width = w * dpr; c.height = h * dpr; c.style.width = w + "px"; c.style.height = h + "px"; };
    const draw = (now) => {
      raf = 0; if (!visible) return;
      const t = (now - t0) / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < LINES; i++) {
        const k = i / LINES;
        const amp = h * (.08 + .06 * Math.sin(t * .2 + i));
        const base = h * (.35 + .5 * k);
        const grad = ctx.createLinearGradient(0, 0, w, 0);
        const a = .05 + .12 * Math.pow(Math.sin(Math.PI * k), 2);
        grad.addColorStop(0, "rgba(95,196,184,0)");
        grad.addColorStop(.45, `rgba(95,196,184,${a})`);
        grad.addColorStop(1, "rgba(20,184,166,0)");
        ctx.strokeStyle = grad; ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 24) {
          const y = base + Math.sin(x / w * 3.2 + t * .35 + i * .22) * amp + Math.sin(x / w * 7 - t * .5 + i) * amp * .18;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      raf = requestAnimationFrame(draw);
    };
    size();
    new ResizeObserver(size).observe(host);
    new IntersectionObserver((en) => { visible = en[0].isIntersecting && !document.hidden; if (visible && !raf) raf = requestAnimationFrame(draw); }).observe(host);
    document.addEventListener("visibilitychange", () => { visible = !document.hidden && visible; if (visible && !raf) raf = requestAnimationFrame(draw); });
  });
}
