// Лёгкий клиент для Supabase REST API (без npm-пакета @supabase/supabase-js —
// чтобы не тянуть лишнюю зависимость, обычного fetch достаточно для наших задач).

const SUPABASE_URL = 'https://wmnsmqzxjmyaxblltngh.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Qznq_X8F17UR2fNrVIzFmA_MasgDTyQ';

const REST_URL = `${SUPABASE_URL}/rest/v1`;

const baseHeaders = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

export async function fetchRequests() {
  const res = await fetch(`${REST_URL}/requests?select=*&order=created_at.desc`, {
    headers: baseHeaders,
  });
  if (!res.ok) throw new Error('Не удалось загрузить заявки: ' + res.status);
  return res.json();
}

export async function updateRequest(id, patch) {
  const res = await fetch(`${REST_URL}/requests?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...baseHeaders, Prefer: 'return=representation' },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error('Не удалось обновить заявку: ' + res.status);
  return res.json();
}

export async function createRequest(payload) {
  const res = await fetch(`${REST_URL}/requests`, {
    method: 'POST',
    headers: { ...baseHeaders, Prefer: 'return=representation' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Не удалось создать заявку: ' + res.status);
  return res.json();
}
