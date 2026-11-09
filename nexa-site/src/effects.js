// Три аккуратных эффекта (ТЗ: «строгий enterprise-дизайн, аккуратные анимации»):
// 1) цифры «докручиваются» при появлении на экране;
// 2) плавный переход между RU и ҚАЗ без белой вспышки.
// Наведение на карточки — в effects.css. При «уменьшить движение» всё отключено.

const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const NUM = /\d{1,3}(?:[\s ]\d{3})+|\d+/;
const group = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

export function initEffects({ $$ }) {
  /* ---------- 1. Счётчики: первое число в элементе считается от нуля ---------- */
  const targets = $$(".hero__facts dd, .price__sum");
  const items = [];
  targets.forEach((el) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let t;
    while ((t = walker.nextNode())) {
      const m = t.nodeValue.match(NUM);
      if (!m) continue;
      const value = Number(m[0].replace(/[\s ]/g, ""));
      if (!value) break;
      const before = t.nodeValue.slice(0, m.index), after = t.nodeValue.slice(m.index + m[0].length);
      const span = document.createElement("span");
      span.className = "cnt";
      span.textContent = m[0];
      span.style.minWidth = `${m[0].length * 0.6}ch`;
      t.nodeValue = before;
      t.parentNode.insertBefore(span, t.nextSibling);
      span.after(document.createTextNode(after));
      items.push({ span, value, text: m[0] });
      break;
    }
  });
  if (!reduce() && "IntersectionObserver" in window) {
    const run = ({ span, value, text }) => {
      const dur = value > 100 ? 1100 : 700, t0 = performance.now();
      const tick = (now) => {
        const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 4);
        span.textContent = k < 1 ? group(value * e) : text;
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver((en) => en.forEach((x) => {
      if (!x.isIntersecting) return;
      io.unobserve(x.target);
      items.filter((i) => i.box === x.target).forEach(run);
    }), { threshold: 0.35 });
    const boxes = new Set();
    items.forEach((i) => {
      i.box = i.span.closest(".prices, .hero__facts") || i.span;
      // уже видимое при загрузке не обнуляем (иначе мигнёт первый экран)
      if (i.box.getBoundingClientRect().top < innerHeight * 0.9) return;
      i.span.textContent = "0";
      boxes.add(i.box);
    });
    boxes.forEach((b) => io.observe(b));
  }

  /* ---------- 2. Переход RU ↔ ҚАЗ ---------- */
  $$(".lang, .nav__lang, a[hreflang]").forEach((a) => a.addEventListener("click", (e) => {
    if (reduce() || e.metaKey || e.ctrlKey || e.shiftKey || a.target === "_blank") return;
    e.preventDefault();
    document.documentElement.classList.add("is-leaving");
    setTimeout(() => { location.href = a.href; }, 220);
  }));
  // возврат кнопкой «назад» из кеша браузера
  window.addEventListener("pageshow", (e) => { if (e.persisted) document.documentElement.classList.remove("is-leaving"); });
}
