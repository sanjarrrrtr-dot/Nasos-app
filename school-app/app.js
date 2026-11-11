// Мини школьный кабинет: ученики, расписание с заменами, оценки, посещаемость, кабинет родителя.
// Данные хранятся в localStorage браузера (без сервера).

const STORAGE_KEY = 'school-app-v1';
const CONFIG = window.SCHOOL_CONFIG || {};
const CLASSES = CONFIG.classes || ['5А', '5Б', '6А', '6Б', '7А', '7Б', '8А', '8Б', '9А', '9Б', '10А', '11А'];
const ATT_STATES = { present: 'Был', late: 'Опоздал', absent: 'Не был' };
const WEEKDAY_NAMES = { 1: 'Понедельник', 2: 'Вторник', 3: 'Среда', 4: 'Четверг', 5: 'Пятница' };

// ---------- Хранилище ----------
function emptyState() {
  return { students: [], grades: [], attendance: {}, schedule: [], replacements: [], messages: [] };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...emptyState(), ...JSON.parse(raw) };
  } catch (e) {
    console.warn('Не удалось прочитать данные', e);
  }
  return emptyState();
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Не удалось сохранить данные', e);
  }
}

// ---------- Telegram Mini App ----------
// В Telegram window.Telegram.WebApp доступен; вне Telegram приложение работает как обычная страница.
const TG = window.Telegram && window.Telegram.WebApp;

function applyTelegramTheme() {
  if (!TG) return;
  TG.ready();
  TG.expand();
  const p = TG.themeParams || {};
  const root = document.documentElement.style;
  const set = (name, value) => value && root.setProperty(name, value);
  set('--bg', p.secondary_bg_color);
  set('--card', p.bg_color);
  set('--text', p.text_color);
  set('--muted', p.hint_color);
  set('--accent', p.button_color);
  set('--border', p.section_separator_color);
  document.body.style.color = p.text_color || '';
}

let state = load();
let idCounter = Date.now();
const newId = () => String(idCounter++);

// ---------- Утилиты ----------
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const todayISO = () => new Date().toISOString().slice(0, 10);
const fmtDate = (iso) => {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
};
// 1..5 для будних дней, 0 для выходных
const weekdayOf = (iso) => {
  const w = new Date(iso + 'T00:00').getDay();
  return w >= 1 && w <= 5 ? w : 0;
};

function fillSelect(sel, options, { placeholder } = {}) {
  const prev = sel.value;
  sel.innerHTML = '';
  if (placeholder) {
    const o = document.createElement('option');
    o.value = '';
    o.textContent = placeholder;
    sel.appendChild(o);
  }
  options.forEach(({ value, label }) => {
    const o = document.createElement('option');
    o.value = value;
    o.textContent = label;
    sel.appendChild(o);
  });
  if ([...sel.options].some((o) => o.value === prev)) sel.value = prev;
}

const classOptions = () => CLASSES.map((c) => ({ value: c, label: c }));
const studentLabel = (s) => `${s.name} (${s.class})`;

function studentsOf(cls) {
  return state.students
    .filter((s) => !cls || s.class === cls)
    .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
}

// ---------- Вкладки ----------
document.querySelectorAll('.tab').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('active', b === btn));
    document.querySelectorAll('.panel').forEach((p) =>
      p.classList.toggle('active', p.id === `tab-${btn.dataset.tab}`));
    renderAll();
  });
});

// ---------- Ученики ----------
function renderStudentSelects() {
  fillSelect($('student-class'), classOptions());
  fillSelect($('grades-class-filter'), [{ value: '', label: 'Все классы' }, ...classOptions()]);
  fillSelect($('att-class-filter'), [{ value: '', label: 'Все классы' }, ...classOptions()]);
  fillSelect($('sch-class-view'), classOptions());
  fillSelect($('lesson-class'), classOptions());
  fillSelect($('rep-class'), [{ value: '', label: 'Все классы' }, ...classOptions()]);
  fillSelect($('msg-class'), classOptions());
  fillSelect($('grade-student'),
    studentsOf('').map((s) => ({ value: s.id, label: studentLabel(s) })),
    { placeholder: 'Выберите ученика' });
  fillSelect($('parent-student'),
    studentsOf('').map((s) => ({ value: s.id, label: studentLabel(s) })));
}

function renderStudents() {
  const box = $('students-list');
  if (!state.students.length) {
    box.innerHTML = '<div class="empty">Учеников пока нет. Добавьте первого выше.</div>';
    return;
  }
  const byClass = {};
  state.students.forEach((s) => (byClass[s.class] ||= []).push(s));
  box.innerHTML = Object.keys(byClass)
    .sort((a, b) => CLASSES.indexOf(a) - CLASSES.indexOf(b))
    .map((cls) => `
      <h3>Класс ${esc(cls)} · ${byClass[cls].length}</h3>
      ${studentsOf(cls).map((s) => `
        <div class="card">
          <div>${esc(s.name)}</div>
          <button class="att-btn" data-del-student="${s.id}">Удалить</button>
        </div>`).join('')}
    `).join('');
}

$('student-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = $('student-name').value.trim().replace(/\s+/g, ' ');
  const cls = $('student-class').value;
  if (!name || !cls) return;
  if (state.students.some((s) => s.name === name && s.class === cls)) {
    alert('Такой ученик уже есть в этом классе');
    return;
  }
  state.students.push({ id: newId(), name, class: cls });
  save();
  $('student-name').value = '';
  renderAll();
});

$('students-list').addEventListener('click', (e) => {
  const id = e.target.dataset.delStudent;
  if (!id) return;
  const s = state.students.find((x) => x.id === id);
  if (!s || !confirm(`Удалить ${s.name} и все его оценки и отметки?`)) return;
  state.students = state.students.filter((x) => x.id !== id);
  state.grades = state.grades.filter((g) => g.studentId !== id);
  Object.values(state.attendance).forEach((day) => delete day[id]);
  save();
  renderAll();
});

// ---------- Расписание ----------
function renderSchedule() {
  const cls = $('sch-class-view').value || CLASSES[0];
  const lessons = state.schedule.filter((l) => l.class === cls);
  const box = $('schedule-view');
  if (!lessons.length) {
    box.innerHTML = `<div class="empty">Для класса ${esc(cls)} расписание ещё не заполнено.</div>`;
    return;
  }
  box.innerHTML = [1, 2, 3, 4, 5].map((wd) => {
    const day = lessons
      .filter((l) => l.weekday === wd)
      .sort((a, b) => a.time.localeCompare(b.time));
    if (!day.length) return '';
    return `<h3>${WEEKDAY_NAMES[wd]}</h3>` + day.map((l) => `
      <div class="card">
        <div><b>${esc(l.time)}</b> · ${esc(l.subject)}
          <div class="meta">${esc(l.teacher || '')}${l.room ? ' · каб. ' + esc(l.room) : ''}</div>
        </div>
        <button class="att-btn" data-del-lesson="${l.id}">Удалить</button>
      </div>`).join('');
  }).join('');
}

$('sch-class-view').addEventListener('change', renderSchedule);

$('schedule-view').addEventListener('click', (e) => {
  const id = e.target.dataset.delLesson;
  if (!id) return;
  state.schedule = state.schedule.filter((l) => l.id !== id);
  save();
  renderAll();
});

$('lesson-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const lesson = {
    id: newId(),
    class: $('lesson-class').value,
    weekday: Number($('lesson-weekday').value),
    time: $('lesson-time').value,
    subject: $('lesson-subject').value.trim(),
    teacher: $('lesson-teacher').value.trim(),
    room: $('lesson-room').value.trim(),
  };
  if (!lesson.class || !lesson.time || !lesson.subject) return;
  state.schedule.push(lesson);
  save();
  $('lesson-subject').value = '';
  $('lesson-teacher').value = '';
  $('lesson-room').value = '';
  renderAll();
});

// ---------- Замены ----------
function renderReplacements() {
  const box = $('replacements-list');
  if (!state.replacements.length) {
    box.innerHTML = '<div class="empty">Замен и изменений нет.</div>';
    return;
  }
  const list = [...state.replacements].sort((a, b) => b.date.localeCompare(a.date));
  box.innerHTML = list.map((r) => `
    <div class="card repl">
      <div>
        <b>${fmtDate(r.date)}</b> · ${esc(r.class || 'Все классы')}${r.time ? ' · ' + esc(r.time) : ''}
        <div class="meta">${esc(r.text)}</div>
      </div>
      <button class="att-btn" data-del-repl="${r.id}">Удалить</button>
    </div>`).join('');
}

$('replacements-list').addEventListener('click', (e) => {
  const id = e.target.dataset.delRepl;
  if (!id) return;
  state.replacements = state.replacements.filter((r) => r.id !== id);
  save();
  renderAll();
});

$('rep-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const text = $('rep-text').value.trim();
  if (!text) return;
  state.replacements.push({
    id: newId(),
    date: $('rep-date').value || todayISO(),
    class: $('rep-class').value,
    time: $('rep-time').value,
    text,
  });
  save();
  $('rep-text').value = '';
  renderAll();
});

// ---------- Сообщения классу ----------
function renderMessages() {
  const box = $('messages-list');
  if (!state.messages.length) {
    box.innerHTML = '<div class="empty">Сообщений пока нет.</div>';
    return;
  }
  const list = [...state.messages].sort((a, b) => b.date.localeCompare(a.date));
  box.innerHTML = list.map((m) => `
    <div class="card">
      <div>
        <b>${esc(m.class)}</b> · ${fmtDate(m.date)}
        <div class="meta">${esc(m.text)}</div>
      </div>
      <button class="att-btn" data-del-msg="${m.id}">Удалить</button>
    </div>`).join('');
}

$('messages-list').addEventListener('click', (e) => {
  const id = e.target.dataset.delMsg;
  if (!id) return;
  state.messages = state.messages.filter((m) => m.id !== id);
  save();
  renderAll();
});

$('msg-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const text = $('msg-text').value.trim();
  const cls = $('msg-class').value;
  if (!text || !cls) return;
  state.messages.push({ id: newId(), class: cls, text, date: todayISO() });
  save();
  $('msg-text').value = '';
  renderAll();
});

// ---------- Оценки ----------
function renderGrades() {
  const cls = $('grades-class-filter').value;
  const list = studentsOf(cls);
  const box = $('grades-table');

  if (!list.length) {
    box.innerHTML = '<div class="empty">Нет учеников для отображения.</div>';
    return;
  }

  const ids = new Set(list.map((s) => s.id));
  const subjects = [...new Set(
    state.grades.filter((g) => ids.has(g.studentId)).map((g) => g.subject)
  )].sort((a, b) => a.localeCompare(b, 'ru'));

  if (!subjects.length) {
    box.innerHTML = '<div class="empty">Оценок пока нет. Поставьте первую оценку выше.</div>';
    return;
  }

  const head = subjects.map((s) => `<th class="center">${esc(s)}</th>`).join('');
  const rows = list.map((s) => {
    const own = state.grades.filter((g) => g.studentId === s.id);
    const cells = subjects.map((subj) => {
      const gs = own.filter((g) => g.subject === subj).sort((a, b) => a.date.localeCompare(b.date));
      if (!gs.length) return '<td class="center">—</td>';
      const chips = gs.map((g) => `
        <span class="grade-chip g${g.value}" title="${fmtDate(g.date)}"
              data-del-grade="${g.id}" style="cursor:pointer">${g.value}</span>`).join(' ');
      const avg = (gs.reduce((a, g) => a + g.value, 0) / gs.length).toFixed(2);
      return `<td class="center">${chips}<div class="meta">ср. ${avg}</div></td>`;
    }).join('');
    const all = own.map((g) => g.value);
    const total = all.length ? (all.reduce((a, b) => a + b, 0) / all.length).toFixed(2) : '—';
    return `<tr><td>${esc(s.name)}<div class="meta">${esc(s.class)}</div></td>${cells}<td class="center"><b>${total}</b></td></tr>`;
  }).join('');

  box.innerHTML = `
    <p class="summary">Нажмите на оценку, чтобы удалить её. Дата — во всплывающей подсказке.</p>
    <div style="overflow-x:auto">
    <table>
      <thead><tr><th>Ученик</th>${head}<th class="center">Итого</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    </div>`;
}

$('grade-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const studentId = $('grade-student').value;
  const subject = $('grade-subject').value.trim();
  const value = Number($('grade-value').value);
  const date = $('grade-date').value || todayISO();
  if (!studentId || !subject) return;
  state.grades.push({ id: newId(), studentId, subject, value, date });
  save();
  $('grade-subject').value = '';
  renderAll();
});

$('grades-table').addEventListener('click', (e) => {
  const id = e.target.dataset.delGrade;
  if (!id || !confirm('Удалить эту оценку?')) return;
  state.grades = state.grades.filter((g) => g.id !== id);
  save();
  renderAll();
});

$('grades-class-filter').addEventListener('change', renderGrades);

// ---------- Посещаемость ----------
function renderAttendance() {
  const date = $('att-date').value || todayISO();
  if (!$('att-date').value) $('att-date').value = date;
  const cls = $('att-class-filter').value;
  const list = studentsOf(cls);
  const box = $('attendance-list');

  if (!list.length) {
    box.innerHTML = '<div class="empty">Нет учеников для отображения.</div>';
    return;
  }

  const day = state.attendance[date] || {};
  const counts = { present: 0, late: 0, absent: 0, none: 0 };
  list.forEach((s) => counts[day[s.id] || 'none']++);

  box.innerHTML = `
    <p class="summary">
      ${fmtDate(date)} · Был: ${counts.present} · Опоздал: ${counts.late} · Не был: ${counts.absent}
      ${counts.none ? ` · Не отмечено: ${counts.none}` : ''}
    </p>
    ${list.map((s) => {
      const st = day[s.id];
      const btns = Object.entries(ATT_STATES).map(([key, label]) =>
        `<button class="att-btn ${st === key ? 'on-' + key : ''}"
                 data-att-student="${s.id}" data-att-state="${key}">${label}</button>`
      ).join('');
      return `<div class="card">
        <div>${esc(s.name)} <span class="meta">${esc(s.class)}</span></div>
        <div>${btns}</div>
      </div>`;
    }).join('')}`;
}

$('att-date').value = todayISO();
$('att-date').addEventListener('change', renderAttendance);
$('att-class-filter').addEventListener('change', renderAttendance);

$('attendance-list').addEventListener('click', (e) => {
  const { attStudent: sid, attState: st } = e.target.dataset;
  if (!sid || !st) return;
  const date = $('att-date').value || todayISO();
  state.attendance[date] ||= {};
  if (state.attendance[date][sid] === st) delete state.attendance[date][sid];
  else state.attendance[date][sid] = st;
  save();
  renderAttendance();
});

// ---------- Кабинет родителя ----------
function renderParent() {
  const box = $('parent-view');
  const sid = $('parent-student').value;
  const s = state.students.find((x) => x.id === sid);
  if (!s) {
    box.innerHTML = '<div class="empty">Добавьте ученика, чтобы увидеть его кабинет.</div>';
    return;
  }
  const date = $('parent-date').value || todayISO();
  if (!$('parent-date').value) $('parent-date').value = date;

  // Расписание на день с учётом замен
  const wd = weekdayOf(date);
  const reps = state.replacements.filter((r) => r.date === date && (!r.class || r.class === s.class));
  let scheduleHtml;
  if (!wd) {
    scheduleHtml = '<div class="empty">Выходной день. Занятий нет.</div>';
  } else {
    const lessons = state.schedule
      .filter((l) => l.class === s.class && l.weekday === wd)
      .sort((a, b) => a.time.localeCompare(b.time));
    const rows = lessons.map((l) => {
      const rep = reps.find((r) => r.time && r.time === l.time);
      return `<div class="card ${rep ? 'repl' : ''}">
        <div><b>${esc(l.time)}</b> · ${esc(l.subject)}
          <div class="meta">${esc(l.teacher || '')}${l.room ? ' · каб. ' + esc(l.room) : ''}</div>
          ${rep ? `<div class="meta repl-text">Изменение: ${esc(rep.text)}</div>` : ''}
        </div></div>`;
    }).join('');
    const extra = reps.filter((r) => !r.time || !lessons.some((l) => l.time === r.time))
      .map((r) => `<div class="card repl"><div>${r.time ? esc(r.time) + ' · ' : ''}<span class="repl-text">${esc(r.text)}</span></div></div>`)
      .join('');
    scheduleHtml = (rows || extra) ? rows + extra : '<div class="empty">На этот день расписания нет.</div>';
  }

  // Оценки
  const own = state.grades.filter((g) => g.studentId === s.id);
  const bySubject = {};
  own.forEach((g) => (bySubject[g.subject] ||= []).push(g));
  const gradesHtml = Object.keys(bySubject).length
    ? Object.entries(bySubject).sort(([a], [b]) => a.localeCompare(b, 'ru')).map(([subj, gs]) => {
        const avg = (gs.reduce((a, g) => a + g.value, 0) / gs.length).toFixed(2);
        const chips = gs.map((g) => `<span class="grade-chip g${g.value}">${g.value}</span>`).join(' ');
        return `<div class="card"><div>${esc(subj)}</div><div>${chips} <span class="meta">ср. ${avg}</span></div></div>`;
      }).join('')
    : '<div class="empty">Оценок пока нет.</div>';

  // Посещаемость за всё время
  const counts = { present: 0, late: 0, absent: 0 };
  Object.values(state.attendance).forEach((day) => {
    const st = day[s.id];
    if (st) counts[st]++;
  });

  // Сообщения классу
  const msgs = state.messages
    .filter((m) => m.class === s.class)
    .sort((a, b) => b.date.localeCompare(a.date));
  const msgsHtml = msgs.length
    ? msgs.map((m) => `<div class="card"><div><span class="meta">${fmtDate(m.date)}</span><div>${esc(m.text)}</div></div></div>`).join('')
    : '<div class="empty">Сообщений от школы пока нет.</div>';

  box.innerHTML = `
    <div class="parent-head">${esc(s.name)} · ${esc(s.class)}</div>
    <h3>Расписание · ${fmtDate(date)}${wd ? ' · ' + WEEKDAY_NAMES[wd] : ''}</h3>
    ${scheduleHtml}
    <h3>Оценки</h3>
    ${gradesHtml}
    <h3>Посещаемость (за всё время)</h3>
    <p class="summary">Был: ${counts.present} · Опоздал: ${counts.late} · Не был: ${counts.absent}</p>
    <h3>Сообщения от школы</h3>
    ${msgsHtml}`;
}

$('parent-student').addEventListener('change', renderParent);
$('parent-date').addEventListener('change', renderParent);

// ---------- Демо‑данные ----------
function seedDemo() {
  const demo = CONFIG.demo;
  if (!demo || state.students.length) return;
  (demo.students || []).forEach((s) => state.students.push({ id: newId(), name: s.name, class: s.class }));
  (demo.schedule || []).forEach((l) => state.schedule.push({ id: newId(), ...l }));
  (demo.grades || []).forEach((g) => {
    const st = state.students.find((s) => s.name === g.name);
    if (st) state.grades.push({ id: newId(), studentId: st.id, subject: g.subject, value: g.value, date: todayISO() });
  });
  (demo.messages || []).forEach((m) => state.messages.push({ id: newId(), class: m.class, text: m.text, date: todayISO() }));
  save();
}

// ---------- Общее ----------
function applyBranding() {
  const root = document.documentElement.style;
  if (CONFIG.accent) root.setProperty('--accent', CONFIG.accent);
  if (CONFIG.accent2) root.setProperty('--accent-2', CONFIG.accent2);
  if (CONFIG.name) {
    document.title = CONFIG.name;
    $('brand-name').textContent = CONFIG.name;
  }
  if (CONFIG.subtitle) $('brand-sub').textContent = CONFIG.subtitle;
  if (CONFIG.shortMark) $('brand-mark').textContent = CONFIG.shortMark;
}

function renderAll() {
  renderStudentSelects();
  renderStudents();
  renderSchedule();
  renderReplacements();
  renderMessages();
  renderGrades();
  renderAttendance();
  renderParent();
}

$('grade-date').value = todayISO();
$('rep-date').value = todayISO();
$('parent-date').value = todayISO();
applyBranding();
applyTelegramTheme();
seedDemo();
renderAll();
