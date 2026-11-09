const { chromium } = require('playwright');
const [dir, mode, fps] = [process.argv[2], process.argv[3], +process.argv[4] || 30];
(async () => {
  const fs = require('fs');
  const sched = JSON.parse(fs.readFileSync(dir + '/schedule.json', 'utf8'));
  const W = mode === 'v' ? 1080 : 1280, H = mode === 'v' ? 1920 : 720;
  const out = `${dir}/frames-${mode}`; fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: W, height: H } });
  await p.goto('file://' + dir + '/film.build.html');
  await p.evaluate((m) => { document.body.className = m; return document.fonts.ready; }, mode);
  const n = Math.ceil(sched.total * fps);
  for (let i = 0; i < n; i++) {
    await p.evaluate((t) => render(t), i / fps);
    await p.screenshot({ path: `${out}/f${String(i).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 92 });
  }
  console.log(mode, n, 'frames');
  await b.close();
})();
