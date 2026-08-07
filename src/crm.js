// crm.js
// Supabase REST-клиент для CRM-части: менеджеры, клиент-цели (сделки), Помодоро.
// Тот же подход, что и в supabase.js — обычный fetch, без лишней зависимости.

const SUPABASE_URL = 'https://wmnsmqzxjmyaxblltngh.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Qznq_X8F17UR2fNrVIzFmA_MasgDTyQ';
const REST_URL = `${SUPABASE_URL}/rest/v1`;

const baseHeaders = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

async function req(path, options = {}) {
  const res = await fetch(`${REST_URL}${path}`, {
    ...options,
    headers: { ...baseHeaders, ...(options.headers || {}) },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Supabase ${options.method || 'GET'} ${path} → ${res.status}: ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

/* ---------- Менеджеры ---------- */

export function fetchManagers() {
  return req('/managers?select=*&is_active=eq.true&order=created_at.asc');
}

export function createManager({ name, phone, department, monthlyGoal, dailyGoal }) {
  return req('/managers', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      name,
      phone: phone || null,
      department: department || null,
      email: `${(phone || Date.now()).toString().replace(/\D/g, '')}@nasosprom.local`,
      password_hash: 'no-password',
      monthly_goal: monthlyGoal || 0,
      daily_goal: dailyGoal || 0,
    }),
  });
}

export function updateManager(id, patch) {
  return req(`/managers?id=eq.${id}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(patch),
  });
}

/* ---------- Клиент-цели (сделки) ---------- */

export function fetchClientGoals(managerId) {
  return req(`/client_goals?select=*&manager_id=eq.${managerId}&is_archived=eq.false&order=created_at.desc`);
}

export function createClientGoal(payload) {
  return req('/client_goals', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(payload),
  });
}

export function updateClientGoal(id, patch) {
  return req(`/client_goals?id=eq.${id}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(patch),
  });
}

export function deleteClientGoal(id) {
  return req(`/client_goals?id=eq.${id}`, { method: 'DELETE' });
}

// Обнуление месяца: архивируем все сделки менеджера (оставляя историю),
// незакрытые ("в работе") сделки НЕ трогаем — они продолжают жить.
export function archiveClosedGoals(managerId, monthNumber) {
  return req(`/client_goals?manager_id=eq.${managerId}&status=in.(paid,declined)`, {
    method: 'PATCH',
    body: JSON.stringify({ is_archived: true, month_archived: monthNumber }),
  });
}

/* ---------- Помодоро ---------- */

export function createPomodoroSession(managerId, durationMinutes = 25) {
  const now = new Date();
  return req('/pomodoro_sessions', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      manager_id: managerId,
      work_date: now.toISOString().slice(0, 10),
      start_time: now.toISOString(),
      duration_minutes: durationMinutes,
      is_completed: false,
    }),
  });
}

export function completePomodoroSession(id) {
  return req(`/pomodoro_sessions?id=eq.${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ end_time: new Date().toISOString(), is_completed: true }),
  });
}

export function fetchTodayPomodoros(managerId) {
  const today = new Date().toISOString().slice(0, 10);
  return req(`/pomodoro_sessions?select=*&manager_id=eq.${managerId}&work_date=eq.${today}&order=start_time.asc`);
}

/* ---------- Поставщики ---------- */

export function createSupplier({ name, country, contactName, contactPhone, website }) {
  return req('/suppliers', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      name, country,
      contact_name: contactName || null,
      contact_phone: contactPhone || null,
      website: website || null,
    }),
  });
}
