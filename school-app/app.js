// Мини школьный журнал: ученики, оценки, посещаемость.
// Данные хранятся в localStorage браузера (без сервера).

const STORAGE_KEY = 'school-app-v1';
const CLASSES = ['5А', '5Б', '6А', '6Б', '7А', '7Б', '8А', '8Б', '9А', '9Б', '10А', '11А'];
const ATT_STATES = { present: 'Был', late: 'Опоздал', absent: 'Не был' };

// ---------- Хранилище ----------
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Не удалось прочитать данные', e);
  }
  return { students: [], grades: [], attendance: {} };
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

function classOptions() {
  return CLASSES.map((c) => ({ value: c, label: c }));
}

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

// ---------- Оценки ----------
function renderGradeSelectStudents() {
  const prev = $('grade-student').value;
  fillSelect($('grade-student'),
    studentsOf('').map((s) => ({ value: s.id, label: `${s.name} (${s.class})` })),
    { placeholder: 'Выберите ученика' });
  if (prev) $('grade-student').value = prev;
}

function renderGrades() {
  const cls = $('grades-class-filter').value;
  const list = studentsOf(cls);
  const box = $('grades-table');

  if (!list.length) {
    box.innerHTML = '<div class="empty">Нет учеников для отображения.</div>';
    return;
  }

  // Все предметы, которые встречаются у выбранных учеников
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
  // повторный клик по той же кнопке снимает отметку
  if (state.attendance[date][sid] === st) delete state.attendance[date][sid];
  else state.attendance[date][sid] = st;
  save();
  renderAttendance();
});

// ---------- Общее ----------
function renderAll() {
  renderStudentSelects();
  renderGradeSelectStudents();
  renderStudents();
  renderGrades();
  renderAttendance();
}

$('grade-date').value = todayISO();
applyTelegramTheme();
renderAll();
