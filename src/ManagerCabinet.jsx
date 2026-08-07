import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchManagers, createManager, updateManager,
  fetchClientGoals, createClientGoal, updateClientGoal, deleteClientGoal, archiveClosedGoals,
  createPomodoroSession, completePomodoroSession, fetchTodayPomodoros, createSupplier,
} from './crm.js';
import { COUNTRY_META, searchAllCountries } from './search.js';
import { crmStyles as cs, STAGE_META, STAGE_ORDER } from './crmStyles.js';
import { styles } from './styles.js';

const UNITS = ['шт', 'компл', 'кг', 'тонны', 'литры', 'м'];
const money = (n) => Math.round(Number(n) || 0).toLocaleString('ru-RU');

export default function ManagerCabinet() {
  const [managers, setManagers] = useState([]);
  const [managerId, setManagerId] = useState(() => localStorage.getItem('crmManagerId') || '');
  const [loadingManagers, setLoadingManagers] = useState(true);
  const [showNewManager, setShowNewManager] = useState(false);

  const loadManagers = useCallback(async () => {
    try {
      const data = await fetchManagers();
      setManagers(data);
    } finally {
      setLoadingManagers(false);
    }
  }, []);

  useEffect(() => { loadManagers(); }, [loadManagers]);
  useEffect(() => {
    if (managerId) localStorage.setItem('crmManagerId', managerId);
  }, [managerId]);

  const currentManager = managers.find((m) => m.id === managerId);

  if (loadingManagers) {
    return <div style={styles.emptyState}>Загрузка…</div>;
  }

  if (!managerId || !currentManager) {
    return (
      <div style={cs.onboardWrap}>
        <div style={cs.onboardTitle}>Кто вы?</div>
        <div style={cs.onboardSub}>Выберите себя из списка или зарегистрируйтесь как новый менеджер</div>
        <div style={cs.managerGrid}>
          {managers.map((m) => (
            <div key={m.id} style={cs.managerPick} onClick={() => setManagerId(m.id)}>
              <span>{m.name}</span>
              <span style={{ color: '#9CA9B5', fontWeight: 400, fontSize: 12 }}>{m.department || '—'}</span>
            </div>
          ))}
        </div>
        <button style={styles.primaryBtn} onClick={() => setShowNewManager(true)}>+ Новый менеджер</button>

        {showNewManager && (
          <NewManagerModal
            onClose={() => setShowNewManager(false)}
            onCreated={async (id) => {
              setShowNewManager(false);
              await loadManagers();
              setManagerId(id);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <Dashboard
      manager={currentManager}
      onSwitch={() => setManagerId('')}
      onManagerUpdated={loadManagers}
    />
  );
}

/* ---------- Регистрация нового менеджера ---------- */

function NewManagerModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', phone: '', department: '', monthlyGoal: '', dailyGoal: '' });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const [created] = await createManager({
        name: form.name.trim(),
        phone: form.phone.trim(),
        department: form.department.trim(),
        monthlyGoal: parseFloat(form.monthlyGoal) || 0,
        dailyGoal: parseFloat(form.dailyGoal) || 0,
      });
      onCreated(created.id);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <strong>Новый менеджер</strong>
          <button style={styles.modalClose} onClick={onClose}>×</button>
        </div>
        <form style={styles.form} onSubmit={submit}>
          <Field label="Имя" required>
            <input style={styles.input} value={form.name} onChange={set('name')} required />
          </Field>
          <div style={styles.row2}>
            <Field label="Телефон">
              <input style={styles.input} value={form.phone} onChange={set('phone')} />
            </Field>
            <Field label="Отдел">
              <input style={styles.input} value={form.department} onChange={set('department')} placeholder="Насосное оборудование" />
            </Field>
          </div>
          <div style={styles.row2}>
            <Field label="Цель за месяц, тг">
              <input type="number" style={styles.input} value={form.monthlyGoal} onChange={set('monthlyGoal')} />
            </Field>
            <Field label="Цель за день, тг">
              <input type="number" style={styles.input} value={form.dailyGoal} onChange={set('dailyGoal')} />
            </Field>
          </div>
          <button style={styles.primaryBtn} disabled={saving}>{saving ? 'Создаём…' : 'Создать и войти'}</button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <label style={styles.field}>
      <span style={styles.fieldLabel}>{label} {required && <span style={styles.req}>*</span>}</span>
      {children}
    </label>
  );
}

/* ---------- Дэшборд ---------- */

function Dashboard({ manager, onSwitch, onManagerUpdated }) {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showEditTargets, setShowEditTargets] = useState(false);
  const [searchGoal, setSearchGoal] = useState(null); // клиент-цель, для которой открыт поиск поставщика

  const load = useCallback(async () => {
    const data = await fetchClientGoals(manager.id);
    setGoals(data);
    setLoading(false);
  }, [manager.id]);

  useEffect(() => { load(); }, [load]);

  const now = new Date();
  const isToday = (iso) => iso && new Date(iso).toDateString() === now.toDateString();
  const isThisMonth = (iso) => iso && new Date(iso).getMonth() === now.getMonth() && new Date(iso).getFullYear() === now.getFullYear();

  const paidGoals = goals.filter((g) => g.status === 'paid');
  const dayAchieved = paidGoals.filter((g) => isToday(g.payment_date || g.updated_at)).reduce((s, g) => s + Number(g.total_price || g.target_price || 0), 0);
  const monthAchieved = paidGoals.filter((g) => isThisMonth(g.payment_date || g.updated_at)).reduce((s, g) => s + Number(g.total_price || g.target_price || 0), 0);

  const dailyGoal = Number(manager.daily_goal) || 0;
  const monthlyGoal = Number(manager.monthly_goal) || 0;
  const dayPct = dailyGoal ? Math.min(100, Math.round((dayAchieved / dailyGoal) * 100)) : 0;
  const monthPct = monthlyGoal ? Math.min(100, Math.round((monthAchieved / monthlyGoal) * 100)) : 0;

  async function handleReset() {
    if (!confirm('Обнулить прогресс месяца? Оплаченные и отказанные сделки уйдут в архив, сделки "в работе" останутся.')) return;
    await archiveClosedGoals(manager.id, now.getMonth() + 1);
    load();
  }

  return (
    <div style={styles.page}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={styles.eyebrow}>Кабинет менеджера</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{manager.name} <span style={{ color: '#9CA9B5', fontWeight: 500 }}>· {manager.department || 'без отдела'}</span></div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={styles.ghostBtnSm} onClick={() => setShowEditTargets(true)}>Цели</button>
          <button style={styles.ghostBtnSm} onClick={handleReset}>Обнулить месяц</button>
          <button style={styles.ghostBtnSm} onClick={onSwitch}>Сменить менеджера</button>
        </div>
      </div>

      <div style={cs.gaugesRow}>
        <GaugeCard label="Цель за день" achieved={dayAchieved} goal={dailyGoal} pct={dayPct} />
        <GaugeCard label="Цель за месяц" achieved={monthAchieved} goal={monthlyGoal} pct={monthPct} />
      </div>

      <div style={cs.sectionHead}>
        <span style={cs.sectionTitle}>СДЕЛКИ · КЛИЕНТ-ЦЕЛИ</span>
        <span style={cs.sectionLine} />
        <button style={styles.primaryBtnSm} onClick={() => setShowAddGoal(true)}>+ Добавить клиента-цель</button>
      </div>

      {loading ? (
        <div style={styles.emptyState}>Загрузка сделок…</div>
      ) : (
        <div style={cs.board}>
          {STAGE_ORDER.map((stage) => (
            <StageColumn
              key={stage}
              stage={stage}
              goals={goals.filter((g) => g.status === stage)}
              onChange={async (id, patch) => { await updateClientGoal(id, patch); load(); }}
              onDelete={async (id) => { await deleteClientGoal(id); load(); }}
              onFindSupplier={(g) => setSearchGoal(g)}
            />
          ))}
        </div>
      )}

      <div style={cs.sectionHead}>
        <span style={cs.sectionTitle}>ФОКУС</span>
        <span style={cs.sectionLine} />
      </div>
      <div style={cs.rightGrid}>
        <PomodoroWidget managerId={manager.id} />
        <TodayStats goals={goals} isToday={isToday} />
      </div>

      {showAddGoal && (
        <AddGoalModal
          managerId={manager.id}
          onClose={() => setShowAddGoal(false)}
          onCreated={() => { setShowAddGoal(false); load(); }}
        />
      )}
      {showEditTargets && (
        <EditTargetsModal
          manager={manager}
          onClose={() => setShowEditTargets(false)}
          onSaved={() => { setShowEditTargets(false); onManagerUpdated(); }}
        />
      )}
      {searchGoal && (
        <SupplierSearchModal
          goal={searchGoal}
          onClose={() => setSearchGoal(null)}
          onAttached={() => { setSearchGoal(null); load(); }}
        />
      )}
    </div>
  );
}

function GaugeCard({ label, achieved, goal, pct }) {
  return (
    <div style={cs.gaugeCard}>
      <div style={cs.gaugeTop}>
        <span style={cs.gaugeLabel}>{label}</span>
        <span style={cs.gaugePct}>{goal ? `${pct}%` : 'цель не задана'}</span>
      </div>
      <div style={cs.gaugeBody}>
        <Gauge pct={pct} />
        <div>
          <div style={cs.gaugeVal}>{money(achieved)} ₸</div>
          <div style={cs.gaugeOf}>из {money(goal)} ₸</div>
          {goal > 0 && <div style={cs.gaugeLeft}>осталось {money(Math.max(0, goal - achieved))} ₸</div>}
        </div>
      </div>
    </div>
  );
}

function Gauge({ pct }) {
  const cx = 60, cy = 62, r = 48;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const point = (p) => {
    const angle = 180 - (p / 100) * 180;
    return [cx + r * Math.cos(toRad(angle)), cy - r * Math.sin(toRad(angle))];
  };
  const [sx, sy] = point(0);
  const [ex, ey] = point(pct);
  const [fx, fy] = point(100);
  const large = pct > 50 ? 1 : 0;
  const track = `M ${sx} ${sy} A ${r} ${r} 0 0 1 ${fx} ${fy}`;
  const fill = `M ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey}`;
  const na = 180 - (pct / 100) * 180;
  const nLen = r - 10;
  const nx = cx + nLen * Math.cos(toRad(na)), ny = cy - nLen * Math.sin(toRad(na));

  return (
    <svg width="120" height="72" viewBox="0 0 120 72" style={{ flexShrink: 0 }}>
      <path d={track} fill="none" stroke="#E3E9F0" strokeWidth="9" strokeLinecap="round" />
      <path d={fill} fill="none" stroke="#D98A12" strokeWidth="9" strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#1B2733" strokeWidth="2" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="4" fill="#1B2733" />
    </svg>
  );
}

/* ---------- Канбан ---------- */

function StageColumn({ stage, goals, onChange, onDelete, onFindSupplier }) {
  const meta = STAGE_META[stage];
  return (
    <div style={cs.col}>
      <div style={cs.colHead}>
        <span>{meta.label}</span>
        <span style={cs.colCount}>{goals.length}</span>
      </div>
      {goals.map((g) => (
        <GoalCard key={g.id} goal={g} onChange={onChange} onDelete={onDelete} onFindSupplier={onFindSupplier} />
      ))}
    </div>
  );
}

const DECLINE_REASONS = ['Дорого', 'Нет бюджета', 'Уже есть поставщик', 'Ждёт другой товар', 'Другое'];

function GoalCard({ goal, onChange, onDelete, onFindSupplier }) {
  const [reasonPick, setReasonPick] = useState(goal.rejection_reason || '');

  async function handleStageChange(e) {
    const next = e.target.value;
    if (next === 'declined') {
      const reason = reasonPick || prompt('Причина отказа:') || 'Другое';
      onChange(goal.id, { status: next, rejection_reason: reason });
    } else if (next === 'paid') {
      onChange(goal.id, { status: next, payment_date: new Date().toISOString() });
    } else {
      onChange(goal.id, { status: next });
    }
  }

  const amount = goal.total_price || goal.target_price;

  return (
    <div style={cs.card}>
      <div style={cs.cardName}>{goal.client_name}</div>
      <div style={cs.cardSum}>{amount ? `${money(amount)} ₸` : 'сумма не указана'}</div>
      <div style={cs.cardMeta}>
        {goal.product_model || 'модель не указана'}
        {goal.supplier_name ? ` · поставщик: ${goal.supplier_name} (${goal.supplier_country || '—'})` : ''}
        {goal.status === 'declined' && goal.rejection_reason ? ` · причина: ${goal.rejection_reason}` : ''}
      </div>
      <div style={cs.cardActions}>
        <select style={cs.stageSelect} value={goal.status} onChange={handleStageChange}>
          {STAGE_ORDER.map((s) => <option key={s} value={s}>{STAGE_META[s].label}</option>)}
        </select>
        <button style={styles.ghostBtnSm} onClick={() => onFindSupplier(goal)}>🔍 Поставщик</button>
        <button style={cs.smallDangerBtn} onClick={() => { if (confirm('Удалить сделку?')) onDelete(goal.id); }}>✕</button>
      </div>
    </div>
  );
}

/* ---------- Добавление клиента-цели ---------- */

function AddGoalModal({ managerId, onClose, onCreated }) {
  const [form, setForm] = useState({
    clientName: '', clientPhone: '', productModel: '', quantity: 1, unit: 'шт', targetPrice: '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    if (!form.clientName.trim()) return;
    setSaving(true);
    try {
      await createClientGoal({
        manager_id: managerId,
        client_name: form.clientName.trim(),
        client_phone: form.clientPhone.trim(),
        product_model: form.productModel.trim(),
        quantity: parseInt(form.quantity, 10) || 1,
        unit: form.unit,
        target_price: parseFloat(form.targetPrice) || null,
        status: 'new',
      });
      onCreated();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <strong>Новый клиент-цель</strong>
          <button style={styles.modalClose} onClick={onClose}>×</button>
        </div>
        <form style={styles.form} onSubmit={submit}>
          <Field label="Название клиента" required>
            <input style={styles.input} value={form.clientName} onChange={set('clientName')} required />
          </Field>
          <Field label="Контакт">
            <input style={styles.input} value={form.clientPhone} onChange={set('clientPhone')} placeholder="+7 ..." />
          </Field>
          <div style={styles.row2}>
            <Field label="Модель товара">
              <input style={styles.input} value={form.productModel} onChange={set('productModel')} />
            </Field>
            <Field label="Желаемая цена, тг">
              <input type="number" style={styles.input} value={form.targetPrice} onChange={set('targetPrice')} />
            </Field>
          </div>
          <div style={styles.row2}>
            <Field label="Количество">
              <input type="number" style={styles.input} value={form.quantity} onChange={set('quantity')} />
            </Field>
            <Field label="Ед. изм.">
              <select style={styles.input} value={form.unit} onChange={set('unit')}>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </Field>
          </div>
          <button style={styles.primaryBtn} disabled={saving}>{saving ? 'Создаём…' : 'Добавить'}</button>
        </form>
      </div>
    </div>
  );
}

/* ---------- Редактирование целей ---------- */

function EditTargetsModal({ manager, onClose, onSaved }) {
  const [monthlyGoal, setMonthlyGoal] = useState(manager.monthly_goal || 0);
  const [dailyGoal, setDailyGoal] = useState(manager.daily_goal || 0);
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateManager(manager.id, { monthly_goal: parseFloat(monthlyGoal) || 0, daily_goal: parseFloat(dailyGoal) || 0 });
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <strong>Цели менеджера</strong>
          <button style={styles.modalClose} onClick={onClose}>×</button>
        </div>
        <form style={styles.form} onSubmit={submit}>
          <Field label="Цель за месяц, тг">
            <input type="number" style={styles.input} value={monthlyGoal} onChange={(e) => setMonthlyGoal(e.target.value)} />
          </Field>
          <Field label="Цель за день, тг">
            <input type="number" style={styles.input} value={dailyGoal} onChange={(e) => setDailyGoal(e.target.value)} />
          </Field>
          <button style={styles.primaryBtn} disabled={saving}>{saving ? 'Сохраняем…' : 'Сохранить'}</button>
        </form>
      </div>
    </div>
  );
}

/* ---------- Помодоро ---------- */

const POMO_MINUTES = 25;
const BREAK_MINUTES = 5;

function PomodoroWidget({ managerId }) {
  const [secondsLeft, setSecondsLeft] = useState(POMO_MINUTES * 60);
  const [running, setRunning] = useState(false);
  const [onBreak, setOnBreak] = useState(false);
  const [todayCount, setTodayCount] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchTodayPomodoros(managerId).then((rows) => setTodayCount(rows.filter((r) => r.is_completed).length));
  }, [managerId]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          handleCycleEnd();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  async function handleStart() {
    if (!onBreak) {
      const [session] = await createPomodoroSession(managerId, POMO_MINUTES);
      setSessionId(session.id);
    }
    setRunning(true);
  }

  function handlePause() {
    setRunning(false);
  }

  async function handleCycleEnd() {
    setRunning(false);
    if (!onBreak) {
      if (sessionId) await completePomodoroSession(sessionId);
      setTodayCount((c) => c + 1);
      setOnBreak(true);
      setSecondsLeft(BREAK_MINUTES * 60);
    } else {
      setOnBreak(false);
      setSecondsLeft(POMO_MINUTES * 60);
    }
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  return (
    <div style={cs.pomoCard}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#6B7A8A' }}>{onBreak ? 'ПЕРЕРЫВ' : 'ПОМОДОРО'}</div>
      <div style={cs.pomoTime}>{mm}:{ss}</div>
      <div style={cs.pomoSub}>{todayCount} сессий сегодня</div>
      <div style={cs.pomoBtnRow}>
        {running ? (
          <button style={styles.ghostBtnSm} onClick={handlePause}>Пауза</button>
        ) : (
          <button style={styles.primaryBtnSm} onClick={handleStart}>{onBreak ? 'Начать перерыв' : 'Начать сессию'}</button>
        )}
      </div>
    </div>
  );
}

/* ---------- Поиск поставщика (тот же движок, что во вкладке "Заявки") ---------- */

function SupplierSearchModal({ goal, onClose, onAttached }) {
  const [model, setModel] = useState(goal.product_model || '');
  const [stage, setStage] = useState('idle'); // idle | searching | done | error
  const [progress, setProgress] = useState({});
  const [results, setResults] = useState({ items: [], allItems: [] });
  const [attachingUrl, setAttachingUrl] = useState(null);

  async function runSearch() {
    if (!model.trim()) return;
    setStage('searching');
    setProgress({});
    try {
      const { items, allItems } = await searchAllCountries(model.trim(), (c, s) => setProgress((p) => ({ ...p, [c]: s })));
      setResults({ items, allItems });
      setStage('done');
    } catch (e) {
      setStage('error');
    }
  }

  async function attach(item) {
    setAttachingUrl(item.url || item.link);
    try {
      const contact = item.contact || {};
      const country = item.region || item._country;
      const supplierName = contact.company_name || item.title;

      await createSupplier({
        name: supplierName,
        country,
        website: contact.website || null,
      }).catch(() => null); // справочник поставщиков — best-effort, не блокируем прикрепление если упадёт

      await updateClientGoal(goal.id, {
        supplier_name: supplierName,
        supplier_country: country,
        supplier_contact: contact.website || item.url || item.link || null,
        status: goal.status === 'new' || goal.status === 'processing' ? 'found' : goal.status,
      });
      onAttached();
    } finally {
      setAttachingUrl(null);
    }
  }

  const allResults = [...results.items, ...results.allItems];

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={{ ...styles.modalCard, maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <strong>Найти поставщика · {goal.client_name}</strong>
          <button style={styles.modalClose} onClick={onClose}>×</button>
        </div>
        <div style={styles.form}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              style={{ ...styles.input, flex: 1 }}
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Модель товара, например: ЦНС 300/180"
            />
            <button style={styles.primaryBtnSm} onClick={runSearch} disabled={stage === 'searching' || !model.trim()}>
              {stage === 'searching' ? 'Ищем…' : 'Искать'}
            </button>
          </div>

          {stage === 'searching' && (
            <div style={styles.progressGrid}>
              {Object.entries(COUNTRY_META).map(([code, meta]) => {
                const s = progress[code];
                const color = s === 'ok' ? '#1F9E5C' : s === 'error' ? '#D14A3E' : s === 'loading' ? '#D98A12' : '#9CA9B5';
                const label = s === 'ok' ? 'найдено' : s === 'empty' ? 'пусто' : s === 'error' ? 'ошибка' : s === 'loading' ? 'поиск…' : 'ожидание';
                return (
                  <div key={code} style={{ ...styles.progressPill, borderColor: color }}>
                    <span>{meta.flag} {meta.label}</span>
                    <span style={{ color, fontWeight: 600 }}>{label}</span>
                  </div>
                );
              })}
            </div>
          )}

          {stage === 'error' && <div style={styles.errorBanner}>Не удалось выполнить поиск. Попробуйте ещё раз.</div>}

          {stage === 'done' && (
            <div style={styles.itemsList}>
              {allResults.length === 0 ? (
                <div style={styles.emptyItems}>Ничего не найдено ни в одной из стран.</div>
              ) : (
                allResults.map((p, i) => {
                  const url = p.url || p.link;
                  return (
                    <div key={i} style={styles.productRow}>
                      <div style={styles.productIndex}>{i + 1}</div>
                      <div style={styles.productBody}>
                        <div style={styles.productTitle}>{p.flag || COUNTRY_META[p._country]?.flag} {p.title || 'Товар'}</div>
                        {p.snippet && <div style={styles.productSnippet}>{p.snippet}</div>}
                        {url && <a href={url} target="_blank" rel="noreferrer" style={styles.productLink}>{url}</a>}
                        <button
                          style={{ ...styles.primaryBtnSm, marginTop: 8 }}
                          disabled={attachingUrl === url}
                          onClick={() => attach(p)}
                        >
                          {attachingUrl === url ? 'Сохраняем…' : '+ Прикрепить к сделке'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TodayStats({ goals, isToday }) {
  const openToday = goals.filter((g) => isToday(g.created_at)).length;
  const closedToday = goals.filter((g) => g.status === 'paid' && isToday(g.payment_date || g.updated_at)).length;
  const declinedToday = goals.filter((g) => g.status === 'declined' && isToday(g.updated_at)).length;
  const paidAmounts = goals.filter((g) => g.status === 'paid' && isToday(g.payment_date || g.updated_at)).map((g) => Number(g.total_price || g.target_price || 0));
  const avgCheck = paidAmounts.length ? paidAmounts.reduce((a, b) => a + b, 0) / paidAmounts.length : 0;

  return (
    <div style={cs.statsCard}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#6B7A8A', marginBottom: 10 }}>СЕГОДНЯ</div>
      <div style={cs.statRow}><span>Новых сделок</span><span>{openToday}</span></div>
      <div style={cs.statRow}><span>Закрыто (оплачено)</span><span>{closedToday}</span></div>
      <div style={cs.statRow}><span>Отказов</span><span>{declinedToday}</span></div>
      <div style={{ ...cs.statRow, borderBottom: 'none' }}><span>Средний чек</span><span>{avgCheck ? `${money(avgCheck)} ₸` : '—'}</span></div>
    </div>
  );
}
