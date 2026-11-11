// Запуск: node test.mjs — проверяет логику диалога без обращения к Telegram.
import assert from 'node:assert/strict';
import { handleUpdate, makeDemo, SCRIPT } from './bot.js';

const MONDAY = '2026-11-09';
const WEDNESDAY = '2026-11-11';
const SATURDAY = '2026-11-14';

const msg = (text, chat = 1) => ({ update_id: 1, message: { chat: { id: chat }, text } });
const cb = (data, chat = 1) => ({ update_id: 2, callback_query: { id: 'q', data, message: { chat: { id: chat } } } });
const texts = (calls) => calls.filter((c) => c.method === 'sendMessage').map((c) => c.params.text);

// /start: приветствие и список учеников
{
  const data = makeDemo(MONDAY);
  const calls = handleUpdate(msg('/start'), data, new Map(), { today: MONDAY });
  assert.equal(calls[0].method, 'sendMessage');
  assert.ok(calls[0].params.text.includes(SCRIPT.welcome));
  const kb = calls[0].params.reply_markup.inline_keyboard;
  assert.equal(kb.length, data.students.length);
  assert.equal(kb[0][0].callback_data, 'c:s1');
}

// Выбор ученика открывает меню и запоминает сессию
{
  const data = makeDemo(MONDAY);
  const sessions = new Map();
  const calls = handleUpdate(cb('c:s1'), data, sessions, { today: MONDAY });
  assert.equal(sessions.get(1), 's1');
  assert.ok(texts(calls)[0].includes('Иванов Иван (7А)'));
  assert.ok(calls.some((c) => c.method === 'answerCallbackQuery'));
}

// Расписание в понедельник: уроки по времени
{
  const data = makeDemo(MONDAY);
  const sessions = new Map([[1, 's1']]);
  const [t] = texts(handleUpdate(cb('m:sch'), data, sessions, { today: MONDAY }));
  assert.ok(t.includes('Понедельник'));
  assert.ok(t.indexOf('08:30') < t.indexOf('09:30'));
  assert.ok(t.includes('Математика'));
}

// Замена совпадает по времени урока и попадает в расписание того же дня
{
  const data = makeDemo(WEDNESDAY);
  // демо‑замена привязана к дате, которую передали: на среду в расписании 7А уроков нет
  const sessions = new Map([[1, 's1']]);
  const [sch] = texts(handleUpdate(cb('m:sch'), data, sessions, { today: WEDNESDAY }));
  assert.ok(sch.includes(SCRIPT.noLessons));
  const [rep] = texts(handleUpdate(cb('m:rep'), data, sessions, { today: WEDNESDAY }));
  assert.ok(rep.includes('Казахский язык переносится на 13:00'));
}

// Замена на понедельник (демо‑дата = понедельник) отмечена у урока 09:30
{
  const data = makeDemo(MONDAY);
  const sessions = new Map([[1, 's1']]);
  const [sch] = texts(handleUpdate(cb('m:sch'), data, sessions, { today: MONDAY }));
  assert.ok(sch.includes('09:30 · Казахский язык'));
  assert.ok(sch.includes('⚠️ Казахский язык переносится на 13:00'));
}

// Выходной
{
  const data = makeDemo(SATURDAY);
  const sessions = new Map([[1, 's1']]);
  const [sch] = texts(handleUpdate(cb('m:sch'), data, sessions, { today: SATURDAY }));
  assert.ok(sch.includes(SCRIPT.weekend));
}

// Оценки и сообщения
{
  const data = makeDemo(MONDAY);
  const sessions = new Map([[1, 's1']]);
  const [grd] = texts(handleUpdate(cb('m:grd'), data, sessions, { today: MONDAY }));
  assert.ok(grd.includes('Математика: 5 (ср. 5.00)'));
  const [msgs] = texts(handleUpdate(cb('m:msg'), data, sessions, { today: MONDAY }));
  assert.ok(msgs.includes('Завтра родительское собрание'));
}

// Ученик другого класса не видит сообщения 7А
{
  const data = makeDemo(MONDAY);
  const sessions = new Map([[1, 's3']]); // 7Б
  const [msgs] = texts(handleUpdate(cb('m:msg'), data, sessions, { today: MONDAY }));
  assert.ok(msgs.includes(SCRIPT.noMessages));
}

// Нет выбранного ученика: бот снова предлагает выбрать
{
  const data = makeDemo(MONDAY);
  const calls = handleUpdate(cb('m:sch'), data, new Map(), { today: MONDAY });
  assert.ok(texts(calls)[0].includes(SCRIPT.chooseChild));
}

// Кнопка Mini App появляется, только если задан MINI_APP_URL
{
  const data = makeDemo(MONDAY);
  const sessions = new Map();
  const without = handleUpdate(cb('c:s1'), data, sessions, { today: MONDAY });
  const rowsWithout = without.find((c) => c.method === 'sendMessage').params.reply_markup.inline_keyboard;
  assert.ok(!rowsWithout.some((r) => r.some((b) => b.web_app)));
  const withApp = handleUpdate(cb('c:s1'), data, sessions, { today: MONDAY, miniAppUrl: 'https://example.com/' });
  const rowsWith = withApp.find((c) => c.method === 'sendMessage').params.reply_markup.inline_keyboard;
  assert.ok(rowsWith.some((r) => r.some((b) => b.web_app && b.web_app.url === 'https://example.com/')));
}

// Непонятный текст
{
  const [t] = texts(handleUpdate(msg('привет'), makeDemo(MONDAY), new Map(), { today: MONDAY }));
  assert.equal(t, SCRIPT.unknown);
}

console.log('OK: все проверки пройдены');
