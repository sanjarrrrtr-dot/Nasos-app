// Telegram‑бот «Кабинет школы» (демо). Long polling через Bot API, без внешних зависимостей.
// Логика вынесена в handleUpdate(): он возвращает список вызовов Bot API, поэтому его легко тестировать.
// Тексты диалога — в script.md; здесь они продублированы в SCRIPT.

import { fileURLToPath } from 'node:url';

export const SCRIPT = {
  welcome: 'Здравствуйте! Это бот школы (демо). Выберите ученика, чтобы посмотреть расписание, замены, оценки и сообщения.',
  chooseChild: 'Выберите ученика:',
  noStudents: 'Пока нет учеников. Обратитесь в администрацию школы.',
  menu: (name) => `${name}. Что показать?`,
  scheduleTitle: (date, weekday) => `Расписание · ${date} · ${weekday}`,
  noLessons: 'Сегодня занятий нет.',
  weekend: 'Сегодня выходной, занятий нет.',
  repTitle: 'Замены на сегодня',
  noReplacements: 'Замен на сегодня нет.',
  gradesTitle: 'Оценки',
  noGrades: 'Оценок пока нет.',
  messagesTitle: 'Сообщения от школы',
  noMessages: 'Сообщений от школы пока нет.',
  unknown: 'Я понимаю только кнопки. Нажмите /start, чтобы открыть меню.',
  help: 'Команды: /start — выбрать ученика и открыть меню, /menu — то же самое.',
  appButton: 'Открыть кабинет',
};

const WEEKDAYS = { 1: 'Понедельник', 2: 'Вторник', 3: 'Среда', 4: 'Четверг', 5: 'Пятница' };

// Демо‑данные (вымышленные). Даты замен считаются от «сегодня», поэтому демо всегда актуально.
export function makeDemo(today) {
  return {
    students: [
      { id: 's1', name: 'Иванов Иван', class: '7А' },
      { id: 's2', name: 'Петрова Анна', class: '7А' },
      { id: 's3', name: 'Сейтжанов Арман', class: '7Б' },
    ],
    schedule: [
      { class: '7А', weekday: 1, time: '08:30', subject: 'Математика', teacher: 'Ахметова Д.К.', room: '101' },
      { class: '7А', weekday: 1, time: '09:30', subject: 'Казахский язык', teacher: 'Нурланова А.Б.', room: '204' },
      { class: '7А', weekday: 1, time: '10:30', subject: 'Физика', teacher: 'Касымов Т.С.', room: '312' },
      { class: '7А', weekday: 2, time: '08:30', subject: 'История', teacher: 'Жуманов Е.А.', room: '118' },
      { class: '7А', weekday: 2, time: '09:30', subject: 'Английский язык', teacher: 'Смит Л.', room: '207' },
      { class: '7Б', weekday: 1, time: '08:30', subject: 'Математика', teacher: 'Ахметова Д.К.', room: '101' },
      { class: '7Б', weekday: 1, time: '09:30', subject: 'Химия', teacher: 'Бекова З.М.', room: '305' },
    ],
    replacements: [
      { date: today, class: '7А', time: '09:30', text: 'Казахский язык переносится на 13:00' },
    ],
    grades: [
      { studentId: 's1', subject: 'Математика', value: 5, date: today },
      { studentId: 's1', subject: 'Физика', value: 4, date: today },
      { studentId: 's2', subject: 'Математика', value: 4, date: today },
    ],
    messages: [
      { class: '7А', text: 'Завтра родительское собрание в 18:00, кабинет 101.', date: today },
    ],
  };
}

export function todayAlmaty() {
  // YYYY-MM-DD по времени Алматы
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Almaty' }).format(new Date());
}

// 1..5 для будних дней, 0 для выходных. Работаем в UTC, чтобы не зависеть от часового пояса сервера.
export function weekdayOf(iso) {
  const w = new Date(iso + 'T00:00:00Z').getUTCDay();
  return w >= 1 && w <= 5 ? w : 0;
}

const fmt = (iso) => {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
};

// ---------- Построение ответов ----------
function studentsKeyboard(data) {
  return {
    inline_keyboard: data.students.map((s) => [{ text: `${s.name} (${s.class})`, callback_data: `c:${s.id}` }]),
  };
}

function menuKeyboard(opts) {
  const rows = [
    [{ text: 'Расписание', callback_data: 'm:sch' }, { text: 'Замены', callback_data: 'm:rep' }],
    [{ text: 'Оценки', callback_data: 'm:grd' }, { text: 'Сообщения', callback_data: 'm:msg' }],
    [{ text: 'Сменить ученика', callback_data: 'm:child' }],
  ];
  if (opts.miniAppUrl) rows.push([{ text: SCRIPT.appButton, web_app: { url: opts.miniAppUrl } }]);
  return { inline_keyboard: rows };
}

const send = (chat_id, text, reply_markup) => ({
  method: 'sendMessage',
  params: reply_markup ? { chat_id, text, reply_markup } : { chat_id, text },
});

function askChild(chat_id, data) {
  if (!data.students.length) return [send(chat_id, SCRIPT.noStudents)];
  return [send(chat_id, `${SCRIPT.welcome}\n\n${SCRIPT.chooseChild}`, studentsKeyboard(data))];
}

function renderSchedule(student, data, today) {
  const wd = weekdayOf(today);
  if (!wd) return `${SCRIPT.scheduleTitle(fmt(today), 'выходной')}\n\n${SCRIPT.weekend}`;
  const reps = data.replacements.filter((r) => r.date === today && (!r.class || r.class === student.class));
  const lessons = data.schedule
    .filter((l) => l.class === student.class && l.weekday === wd)
    .sort((a, b) => a.time.localeCompare(b.time));
  if (!lessons.length) return `${SCRIPT.scheduleTitle(fmt(today), WEEKDAYS[wd])}\n\n${SCRIPT.noLessons}`;
  const lines = lessons.map((l) => {
    const rep = reps.find((r) => r.time === l.time);
    const base = `${l.time} · ${l.subject}${l.teacher ? ' · ' + l.teacher : ''}${l.room ? ' · каб. ' + l.room : ''}`;
    return rep ? `${base}\n   ⚠️ ${rep.text}` : base;
  });
  return `${SCRIPT.scheduleTitle(fmt(today), WEEKDAYS[wd])}\n\n${lines.join('\n')}`;
}

function renderReplacements(student, data, today) {
  const reps = data.replacements.filter((r) => r.date === today && (!r.class || r.class === student.class));
  if (!reps.length) return `${SCRIPT.repTitle}\n\n${SCRIPT.noReplacements}`;
  return `${SCRIPT.repTitle}\n\n` + reps.map((r) => `${r.time ? r.time + ' · ' : ''}${r.text}`).join('\n');
}

function renderGrades(student, data) {
  const own = data.grades.filter((g) => g.studentId === student.id);
  if (!own.length) return `${SCRIPT.gradesTitle}\n\n${SCRIPT.noGrades}`;
  const bySubject = {};
  own.forEach((g) => (bySubject[g.subject] ||= []).push(g.value));
  const lines = Object.entries(bySubject).map(([subj, vals]) => {
    const avg = (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2);
    return `${subj}: ${vals.join(', ')} (ср. ${avg})`;
  });
  return `${SCRIPT.gradesTitle}\n\n${lines.join('\n')}`;
}

function renderMessages(student, data) {
  const msgs = data.messages.filter((m) => m.class === student.class);
  if (!msgs.length) return `${SCRIPT.messagesTitle}\n\n${SCRIPT.noMessages}`;
  return `${SCRIPT.messagesTitle}\n\n` + msgs.map((m) => `${fmt(m.date)}: ${m.text}`).join('\n');
}

// ---------- Обработка обновлений ----------
// sessions: Map chatId -> studentId (в памяти процесса). opts: { today, miniAppUrl }.
export function handleUpdate(update, data, sessions = new Map(), opts = {}) {
  const today = opts.today || todayAlmaty();

  if (update.message && typeof update.message.text === 'string') {
    const chat = update.message.chat.id;
    const text = update.message.text.trim();
    if (text.startsWith('/start') || text === '/menu') return askChild(chat, data);
    if (text === '/help') return [send(chat, SCRIPT.help)];
    return [send(chat, SCRIPT.unknown)];
  }

  if (update.callback_query) {
    const cq = update.callback_query;
    const chat = cq.message && cq.message.chat.id;
    const answer = { method: 'answerCallbackQuery', params: { callback_query_id: cq.id } };
    if (!chat) return [answer];
    const [kind, value] = String(cq.data || '').split(':');

    if (kind === 'c') {
      const student = data.students.find((s) => s.id === value);
      if (!student) return [answer, send(chat, SCRIPT.noStudents)];
      sessions.set(chat, student.id);
      return [answer, send(chat, SCRIPT.menu(`${student.name} (${student.class})`), menuKeyboard(opts))];
    }

    if (kind === 'm' && value === 'child') return [answer, ...askChild(chat, data)];

    if (kind === 'm') {
      const student = data.students.find((s) => s.id === sessions.get(chat));
      if (!student) return [answer, ...askChild(chat, data)];
      const renderers = {
        sch: () => renderSchedule(student, data, today),
        rep: () => renderReplacements(student, data, today),
        grd: () => renderGrades(student, data),
        msg: () => renderMessages(student, data),
      };
      const render = renderers[value];
      if (!render) return [answer, send(chat, SCRIPT.unknown)];
      return [answer, send(chat, render(), menuKeyboard(opts))];
    }

    return [answer];
  }

  return [];
}

// ---------- Запуск с Telegram ----------
async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error('Задайте переменную окружения TELEGRAM_BOT_TOKEN (токен из @BotFather).');
    process.exit(1);
  }
  const miniAppUrl = process.env.MINI_APP_URL || '';
  const api = (method, params) =>
    fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(params),
    }).then((r) => r.json());

  const sessions = new Map();
  let offset = 0;
  console.log('Бот запущен, жду сообщения…');
  for (;;) {
    try {
      const res = await api('getUpdates', {
        offset,
        timeout: 30,
        allowed_updates: ['message', 'callback_query'],
      });
      if (!res.ok) {
        console.error('Ошибка getUpdates:', res.description);
        await new Promise((r) => setTimeout(r, 3000));
        continue;
      }
      for (const update of res.result) {
        offset = update.update_id + 1;
        try {
          const calls = handleUpdate(update, makeDemo(todayAlmaty()), sessions, { miniAppUrl });
          for (const call of calls) await api(call.method, call.params);
        } catch (e) {
          console.error('Ошибка обработки обновления:', e);
        }
      }
    } catch (e) {
      console.error('Сеть недоступна, повтор через 3 с:', e.message);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
