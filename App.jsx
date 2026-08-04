import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fetchRequests, updateRequest, createRequest } from './supabase.js';
import { COUNTRY_META, searchAllCountries } from './search.js';
import { styles } from './styles.js';

const MANAGERS = [
  { id: '5096937369', name: 'Бекзат' },
  { id: '7922348304', name: 'STS PROM' },
];

const UNITS = ['шт', 'компл', 'кг', 'тонны', 'литры', 'м'];

export default function App() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [activeManager, setActiveManager] = useState(() => localStorage.getItem('activeManager') || MANAGERS[0].id);
  const [openId, setOpenId] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const pollRef = useRef(null);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchRequests();
      setRequests(data);
      setErrorMsg(null);
    } catch (e) {
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    pollRef.current = setInterval(refresh, 5000);
    return () => clearInterval(pollRef.current);
  }, [refresh]);

  useEffect(() => {
    localStorage.setItem('activeManager', activeManager);
  }, [activeManager]);

  async function handleClaim(req) {
    if (req.claimed_by && req.claimed_by !== activeManager) return;
    await updateRequest(req.id, { claimed_by: activeManager, status: 'claimed' });
    refresh();
  }

  async function handleSetPrice(req, price) {
    await updateRequest(req.id, { price_quoted: price });
    refresh();
  }

  async function handleClose(req) {
    await updateRequest(req.id, { status: 'closed' });
    refresh();
  }

  const stats = {
    total: requests.length,
    new: requests.filter((r) => r.status === 'new').length,
    mine: requests.filter((r) => r.claimed_by === activeManager && r.status !== 'closed').length,
    closed: requests.filter((r) => r.status === 'closed').length,
  };

  return (
    <div style={styles.shell}>
      <TopBar
        activeManager={activeManager}
        setActiveManager={setActiveManager}
        onNewRequest={() => setShowNewForm(true)}
      />

      <div style={styles.body}>
        <div style={styles.page}>
          <div style={styles.statsRow}>
            <StatCard label="Всего заявок" value={stats.total} />
            <StatCard label="Новые" value={stats.new} accent="#c98a3a" />
            <StatCard label="Мои в работе" value={stats.mine} accent="#3f6f9e" />
            <StatCard label="Закрыто" value={stats.closed} accent="#3f7f5c" />
          </div>

          {errorMsg && (
            <div style={styles.errorBanner}>
              ⚠️ Не удалось связаться с базой данных: {errorMsg}
            </div>
          )}

          {loading ? (
            <div style={styles.emptyState}>Загрузка заявок…</div>
          ) : requests.length === 0 ? (
            <div style={styles.emptyState}>
              Заявок пока нет. Они появятся здесь автоматически, как только клиент отправит заявку с сайта,
              или вы можете создать заявку вручную кнопкой выше.
            </div>
          ) : (
            <div style={styles.reqList}>
              {requests.map((r) => (
                <RequestCard
                  key={r.id}
                  req={r}
                  activeManager={activeManager}
                  isOpen={openId === r.id}
                  onToggle={() => setOpenId(openId === r.id ? null : r.id)}
                  onClaim={() => handleClaim(r)}
                  onSetPrice={(p) => handleSetPrice(r, p)}
                  onClose={() => handleClose(r)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {showNewForm && (
        <NewRequestModal
          onClose={() => setShowNewForm(false)}
          onCreated={() => {
            setShowNewForm(false);
            refresh();
          }}
        />
      )}

      <Footer />
    </div>
  );
}

function TopBar({ activeManager, setActiveManager, onNewRequest }) {
  return (
    <header style={styles.topbar}>
      <div style={styles.brandBlock}>
        <div style={styles.brandMark}>Н</div>
        <div>
          <div style={styles.brandName}>NASOSPROM</div>
          <div style={styles.brandSub}>Кабинет менеджера</div>
        </div>
      </div>
      <div style={styles.topbarRight}>
        <button style={styles.primaryBtnSm} onClick={onNewRequest}>
          + Новая заявка
        </button>
        <select style={styles.managerSelect} value={activeManager} onChange={(e) => setActiveManager(e.target.value)}>
          {MANAGERS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer style={styles.footer}>
      <span>NASOSPROM · КАБИНЕТ МЕНЕДЖЕРА</span>
      <span>ДАННЫЕ: SUPABASE · ПОИСК: SERPER.DEV</span>
    </footer>
  );
}

function StatCard({ label, value, accent = '#3a4048' }) {
  return (
    <div style={styles.statCard}>
      <div style={{ ...styles.statValue, color: accent }}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

/* ---------- Модалка ручного создания заявки ---------- */

function NewRequestModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    model: '', quantity: 1, unit: 'шт', deadline: '', region: '', clientName: '', phone: '',
  });
  const [stage, setStage] = useState('idle'); // idle | searching | error
  const [progress, setProgress] = useState({});
  const [error, setError] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const canSubmit = form.model.trim() && form.phone.trim() && stage !== 'searching';

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setStage('searching');
    setError(null);
    try {
      const { items, totalFound, regionStatus } = await searchAllCountries(form.model.trim(), (c, s) =>
        setProgress((p) => ({ ...p, [c]: s }))
      );
      await createRequest({
        status: 'new',
        claimed_by: null,
        price_quoted: null,
        model: form.model.trim(),
        quantity: form.quantity || 1,
        unit: form.unit,
        deadline: form.deadline.trim() || 'Не указан',
        region: form.region.trim() || 'Не указан',
        client_name: form.clientName.trim() || 'Не указано',
        phone: form.phone.trim(),
        source: 'Вручную (менеджер)',
        region_status: regionStatus,
        items,
        total_found: totalFound,
      });
      onCreated();
    } catch (err) {
      setError(String(err.message || err));
      setStage('idle');
    }
  }

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <span style={styles.eyebrow}>НОВАЯ ЗАЯВКА ВРУЧНУЮ</span>
          <button style={styles.modalClose} onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <Field label="Модель насоса" required>
            <input style={styles.input} value={form.model} onChange={set('model')} disabled={stage === 'searching'} placeholder="Марка / артикул" />
          </Field>
          <div style={styles.row2}>
            <Field label="Количество" required>
              <input type="number" min="1" style={styles.input} value={form.quantity} onChange={set('quantity')} disabled={stage === 'searching'} />
            </Field>
            <Field label="Единица">
              <select style={styles.input} value={form.unit} onChange={set('unit')} disabled={stage === 'searching'}>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </Field>
          </div>
          <div style={styles.row2}>
            <Field label="Срок поставки">
              <input style={styles.input} value={form.deadline} onChange={set('deadline')} disabled={stage === 'searching'} placeholder="например: до 15 сентября" />
            </Field>
            <Field label="Регион доставки">
              <input style={styles.input} value={form.region} onChange={set('region')} disabled={stage === 'searching'} placeholder="город" />
            </Field>
          </div>
          <div style={styles.row2}>
            <Field label="Клиент / компания">
              <input style={styles.input} value={form.clientName} onChange={set('clientName')} disabled={stage === 'searching'} />
            </Field>
            <Field label="Телефон" required>
              <input style={styles.input} value={form.phone} onChange={set('phone')} disabled={stage === 'searching'} placeholder="+7 ..." />
            </Field>
          </div>

          {error && <div style={styles.errorBanner}>{error}</div>}

          <button type="submit" style={{ ...styles.primaryBtn, opacity: canSubmit ? 1 : 0.5 }} disabled={!canSubmit}>
            {stage === 'searching' ? 'Идёт поиск…' : 'Найти и сохранить заявку'}
          </button>

          {stage === 'searching' && (
            <div style={styles.progressGrid}>
              {['KZ', 'RU', 'EU', 'CN'].map((c) => <ProgressPill key={c} country={c} status={progress[c]} />)}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

function ProgressPill({ country, status }) {
  const meta = COUNTRY_META[country];
  let label = 'ожидание', color = '#8a94a3';
  if (status === 'loading') { label = 'поиск…'; color = '#c98a3a'; }
  if (status === 'ok') { label = 'найдено'; color = '#3f7f5c'; }
  if (status === 'empty') { label = 'пусто'; color = '#8a94a3'; }
  if (status === 'error') { label = 'ошибка'; color = '#b5433a'; }
  return (
    <div style={{ ...styles.progressPill, borderColor: color }}>
      <span>{meta.flag} {meta.label}</span>
      <span style={{ color, fontWeight: 600 }}>{label}</span>
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

/* ---------- Карточка заявки ---------- */

function RequestCard({ req, activeManager, isOpen, onToggle, onClaim, onSetPrice, onClose }) {
  const [priceInput, setPriceInput] = useState(req.price_quoted || '');
  const claimedByMe = req.claimed_by === activeManager;
  const claimedByOther = req.claimed_by && req.claimed_by !== activeManager;
  const managerName = (id) => MANAGERS.find((m) => m.id === id)?.name || id;

  const statusMeta = {
    new: { label: 'НОВАЯ', color: '#c98a3a' },
    claimed: { label: 'В РАБОТЕ', color: '#3f6f9e' },
    closed: { label: 'ЗАКРЫТА', color: '#6b7280' },
  }[req.status] || { label: req.status, color: '#6b7280' };

  const items = Array.isArray(req.items) ? req.items : [];
  const regionStatus = req.region_status || {};

  return (
    <div style={{ ...styles.reqCard, opacity: req.status === 'closed' ? 0.6 : 1 }}>
      <div style={styles.reqCardTop} onClick={onToggle}>
        <div style={styles.reqCardTopLeft}>
          <span style={{ ...styles.statusTag, borderColor: statusMeta.color, color: statusMeta.color }}>
            {statusMeta.label}
          </span>
          <div>
            <div style={styles.reqModel}>{req.model}</div>
            <div style={styles.reqMeta}>
              {req.quantity} {req.unit} · {req.region} · {req.client_name}
            </div>
          </div>
        </div>
        <div style={styles.reqCardTopRight}>
          <span style={styles.reqFound}>{req.total_found ?? items.length} найдено</span>
          <span style={styles.chevron}>{isOpen ? '▲' : '▼'}</span>
        </div>
      </div>

      {isOpen && (
        <div style={styles.reqCardBody}>
          <div style={styles.detailGrid}>
            <DetailRow label="Телефон" value={req.phone} />
            <DetailRow label="Срок поставки" value={req.deadline} />
            <DetailRow label="Подана" value={new Date(req.created_at).toLocaleString('ru-RU')} />
            <DetailRow label="Ведёт" value={req.claimed_by ? managerName(req.claimed_by) : '— никто пока не взял —'} />
          </div>

          <div style={styles.regionRow}>
            {Object.entries(regionStatus).map(([c, s]) => (
              <RegionBadge key={c} country={c} status={s.status} message={s.message} />
            ))}
          </div>

          {claimedByOther ? (
            <div style={styles.claimedNotice}>⚠️ Эту заявку уже ведёт {managerName(req.claimed_by)}.</div>
          ) : (
            <div style={styles.actionsRow}>
              {!req.claimed_by && (
                <button style={styles.primaryBtnSm} onClick={onClaim}>Взять в работу</button>
              )}
              {claimedByMe && req.status !== 'closed' && (
                <>
                  <div style={styles.priceInputWrap}>
                    <input style={styles.input} placeholder="Ваша цена клиенту" value={priceInput} onChange={(e) => setPriceInput(e.target.value)} />
                    <button style={styles.ghostBtnSm} onClick={() => onSetPrice(priceInput)}>Сохранить цену</button>
                  </div>
                  <button style={styles.dangerBtnSm} onClick={onClose}>Закрыть заявку</button>
                </>
              )}
            </div>
          )}

          {req.price_quoted && (
            <div style={styles.priceTag}>Озвученная цена: <strong>{req.price_quoted}</strong></div>
          )}

          <div style={styles.itemsList}>
            {items.length === 0 ? (
              <div style={styles.emptyItems}>Ничего не найдено ни в одной из стран.</div>
            ) : (
              items.map((p, i) => <ProductRow key={i} p={p} index={i} />)
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div style={styles.detailRow}>
      <span style={styles.detailLabel}>{label}</span>
      <span style={styles.detailValue}>{value}</span>
    </div>
  );
}

function RegionBadge({ country, status, message }) {
  const meta = COUNTRY_META[country];
  const cfg = {
    ok: { label: 'есть результаты', color: '#3f7f5c' },
    empty: { label: 'ничего не найдено', color: '#8a94a3' },
    error: { label: message ? `ошибка: ${message}` : 'ошибка', color: '#b5433a' },
  }[status] || { label: status, color: '#8a94a3' };
  return (
    <div style={{ ...styles.regionBadge, borderColor: cfg.color }} title={cfg.label}>
      <span>{meta?.flag}</span>
      <span style={{ color: cfg.color }}>{cfg.label}</span>
    </div>
  );
}

function ProductRow({ p, index }) {
  const meta = COUNTRY_META[p._country];
  return (
    <div style={styles.productRow}>
      <div style={styles.productIndex}>{index + 1}</div>
      <div style={styles.productBody}>
        <div style={styles.productTitle}>{meta?.flag} {p.title || 'Товар'}</div>
        {p.snippet && <div style={styles.productSnippet}>{p.snippet}</div>}
        {p.link && <a href={p.link} target="_blank" rel="noreferrer" style={styles.productLink}>{p.link}</a>}
      </div>
    </div>
  );
}
