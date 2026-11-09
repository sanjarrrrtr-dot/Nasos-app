// Система движения сайта: плавная прокрутка (Lenis) + анимации при прокрутке (GSAP ScrollTrigger).
// Всё отключается, если в системе включено «уменьшить движение»: контент тогда просто виден.
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { playIntro, initPortal, initFlow } from "./motion2.js";

gsap.registerPlugin(ScrollTrigger);

/* Разбивает текст элемента на слова в «масках» — для эффекта появления строк снизу. */
function splitWords(el) {
  if (el.dataset.split) return [];
  el.dataset.split = "1";
  const words = [];
  const walk = (node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.nodeValue.split(/( +)/).forEach((part) => {
          if (!part) return;
          if (/^ +$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
          const w = document.createElement("span"); w.className = "mw";
          const i = document.createElement("span"); i.className = "mwi"; i.textContent = part;
          w.appendChild(i); frag.appendChild(w); words.push(i);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== "BR") walk(n);
    });
  };
  walk(el);
  return words;
}

export function initMotion({ $, $$ }) {
  const mm = gsap.matchMedia();

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    document.documentElement.classList.add("has-motion");

    /* ---------- Плавная прокрутка ---------- */
    const lenis = new Lenis({ duration: 1.1, anchors: { offset: -72 }, autoRaf: false });
    lenis.on("scroll", ScrollTrigger.update);
    const raf = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    /* ---------- Полоса прогресса чтения и шапка, которая прячется при прокрутке вниз ---------- */
    const bar = $(".progress");
    const top = $(".top");
    ScrollTrigger.create({
      start: 0, end: "max",
      onUpdate: (self) => {
        if (bar) bar.style.transform = `scaleX(${self.progress})`;
        const y = self.scroll();
        top.classList.toggle("is-hidden", self.direction === 1 && y > 600 && !$("#nav").classList.contains("is-open"));
      }
    });

    /* ---------- Первый экран: заголовок «вырастает» по словам ---------- */
    const heroWords = splitWords($(".hero__title"));
    const intro = gsap.timeline({ paused: true, defaults: { ease: "power4.out" } });
    intro
      .from(".hero .kicker", { y: 14, opacity: 0, duration: .6 })
      .from(heroWords, { yPercent: 110, duration: 1.1, stagger: .07 }, "<.1")
      .from(".hero__lead", { y: 24, opacity: 0, duration: .9 }, "<.45")
      .from(".hero__cta > *, .hero__note", { y: 18, opacity: 0, duration: .7, stagger: .08 }, "<.15")
      .from(".hero__facts > div", { y: 18, opacity: 0, duration: .7, stagger: .08 }, "<.1")
      .from(".board", { y: 60, rotate: 1.5, opacity: 0, duration: 1.3, ease: "expo.out" }, .25);
    intro.progress(0);
    playIntro(() => intro.play());

    /* Фирменный «портал» и световые линии в тёмных разделах */
    initPortal();
    initFlow(".sec--ink");

    // при уходе с первого экрана схема чуть уезжает и уменьшается — ощущение глубины
    gsap.to(".board", { yPercent: -10, scale: .96, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".hero__text", { yPercent: -8, opacity: .35, ease: "none", scrollTrigger: { trigger: ".hero", start: "40% top", end: "bottom top", scrub: true } });

    /* ---------- Бегущая строка: скорость и направление зависят от прокрутки ---------- */
    const track = $(".marquee__track");
    if (track) {
      const loop = gsap.to(track, { xPercent: -50, duration: 28, ease: "none", repeat: -1 });
      ScrollTrigger.create({
        onUpdate: (self) => {
          const v = self.getVelocity() / 300;
          gsap.to(loop, { timeScale: gsap.utils.clamp(-4, 4, self.direction * (1 + Math.abs(v))), duration: .3, overwrite: true });
        }
      });
    }

    /* ---------- Заголовки разделов: слова поднимаются из-под маски ---------- */
    $$(".sec .h2, .band__t").forEach((h) => {
      const w = splitWords(h);
      gsap.from(w, { yPercent: 110, duration: 1, ease: "power4.out", stagger: .05, scrollTrigger: { trigger: h, start: "top 88%" } });
    });
    $$(".sec .sub").forEach((p) => gsap.from(p, { y: 24, opacity: 0, duration: .9, ease: "power3.out", scrollTrigger: { trigger: p, start: "top 90%" } }));

    /* ---------- Группы элементов появляются «волной» ---------- */
    const groups = [".pains", ".practices", ".tasks", ".docs", ".prices", ".faq", ".lab__list", ".calc__form", ".contact__list"];
    groups.forEach((g) => $$(g).forEach((box) => {
      const items = [...box.children].filter((c) => !c.hidden);
      gsap.from(items, { y: 40, opacity: 0, duration: .9, ease: "power3.out", stagger: .07, scrollTrigger: { trigger: box, start: "top 85%" } });
    }));

    /* Документы-примеры едут с разной скоростью — лёгкий параллакс */
    $$(".docs .doc").forEach((d, i) => gsap.to(d, { y: [-10, -60, -25][i % 3], ease: "none", scrollTrigger: { trigger: ".docs", start: "top bottom", end: "bottom top", scrub: true } }));

    /* Видео «выезжает» и раскрывается на всю ширину рамки */
    gsap.fromTo(".film__frame", { scale: .88, clipPath: "inset(6% 6% 6% 6% round 12px)" }, {
      scale: 1, clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none",
      scrollTrigger: { trigger: "#film", start: "top 85%", end: "center 55%", scrub: true }
    });

    /* Калькулятор: блок результата подъезжает */
    gsap.from(".calc__out", { y: 50, opacity: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: ".calc", start: "top 75%" } });

    /* Полоса-призыв: фон «заливается» слева направо */
    gsap.fromTo(".band", { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 1.2, ease: "expo.inOut", scrollTrigger: { trigger: ".band", start: "top 85%" } });

    /* Форма и опрос */
    gsap.from(".form, .quiz", { y: 60, opacity: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: ".form, .quiz", start: "top 85%" } });

    /* ---------- «Как мы работаем»: на компьютере раздел закрепляется, этапы загораются по очереди ---------- */
    const steps = $$(".steps li");
    const desk = window.matchMedia("(min-width: 961px)").matches;
    if (desk && steps.length) {
      gsap.set(steps, { opacity: .18 });
      const tl = gsap.timeline({
        scrollTrigger: { trigger: "#method", start: "top top", end: "+=" + steps.length * 260, pin: true, scrub: .6, anticipatePin: 1 }
      });
      steps.forEach((li, i) => {
        tl.to(li, { opacity: 1, duration: 1, ease: "none" }, i)
          .to(li, { backgroundSize: "100% 1px, 100% 1px", duration: 1, ease: "none" }, i)
          .from(li.querySelector(".steps__n"), { yPercent: 60, opacity: 0, duration: .6 }, i);
      });
    } else {
      gsap.from(steps, { y: 40, opacity: 0, duration: .8, ease: "power3.out", stagger: .08, scrollTrigger: { trigger: ".steps", start: "top 85%" } });
    }

    /* Пересчитать позиции, когда меняется высота (вкладки, раскрытые списки, шрифты) */
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("nexa:layout", refresh);
    document.fonts && document.fonts.ready.then(refresh);
    document.addEventListener("toggle", refresh, true);

    return () => {
      gsap.ticker.remove(raf); lenis.destroy();
      window.removeEventListener("nexa:layout", refresh);
      document.documentElement.classList.remove("has-motion");
    };
  });
}
