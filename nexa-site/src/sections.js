// Нумерация разделов «02 / 13». Считаются только видимые разделы с заголовком h2,
// поэтому скрытые блоки (кейсы, основатель) нумерацию не ломают.
export function initSections() {
  const secs = [...document.querySelectorAll("main > section.sec:not([hidden])")].filter((s) => s.querySelector(".h2"));
  const total = String(secs.length + 1).padStart(2, "0"); // +1: первый экран — раздел 01
  secs.forEach((s, i) => {
    const h = s.querySelector(".h2");
    const n = document.createElement("p");
    n.className = "sec-n";
    n.setAttribute("aria-hidden", "true");
    n.innerHTML = `<b>${String(i + 2).padStart(2, "0")}</b>/ ${total}`;
    h.before(n);
  });
}
