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

  async function handleSetMargin(req, costPrice, margin) {
    const cp = parseFloat(costPrice) || 0;
    const m = parseFloat(margin) || 0;
    const subtotal = cp + m;
    const withVat = subtotal * 1.16;
    await updateRequest(req.id, {
      cost_price: cp,
      margin: m,
      price_quoted: withVat ? String(Math.round(withVat)) : null,
    });
    refresh();
  }

  async function handleClose(req, reason) {
    await updateRequest(req.id, { status: 'closed', close_reason: reason });
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
            <StatCard label="Новые" value={stats.new} accent="#e08a2b" />
            <StatCard label="Мои в работе" value={stats.mine} accent="#2f6fed" />
            <StatCard label="Закрыто" value={stats.closed} accent="#1e9e6b" />
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
                  onSetMargin={(cp, m) => handleSetMargin(r, cp, m)}
                  onClose={(reason) => handleClose(r, reason)}
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

function StatCard({ label, value, accent = '#101a2b' }) {
  return (
    <div style={styles.statCard}>
      <div style={{ ...styles.statValue, color: accent }}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

/* ---------- Модалка ручного создания заявки ---------- */

function NewRequestModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ model: '' });
  const [stage, setStage] = useState('idle'); // idle | searching | error
  const [progress, setProgress] = useState({});
  const [error, setError] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const canSubmit = form.model.trim() && stage !== 'searching';

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setStage('searching');
    setError(null);
    try {
      const { items, totalFound, allItems, totalFoundAll, regionStatus } = await searchAllCountries(
        form.model.trim(),
        (c, s) => setProgress((p) => ({ ...p, [c]: s }))
      );
      await createRequest({
        status: 'new',
        claimed_by: null,
        price_quoted: null,
        model: form.model.trim(),
        quantity: 1,
        unit: 'шт',
        deadline: 'Не указан',
        region: 'Не указан',
        client_name: 'Не указано',
        phone: 'Не указан',
        source: 'Вручную (менеджер)',
        region_status: regionStatus,
        items,
        total_found: totalFound,
        all_items: allItems,
        total_found_all: totalFoundAll,
      });
      onCreated();
    } catch (err) {
      setError(String(err?.message || err));
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
            <input style={styles.input} value={form.model} onChange={set('model')} disabled={stage === 'searching'} placeholder="Марка / артикул" autoFocus />
          </Field>

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
  let label = 'ожидание', color = '#8a97ab';
  if (status === 'loading') { label = 'поиск…'; color = '#e08a2b'; }
  if (status === 'ok') { label = 'найдено'; color = '#1e9e6b'; }
  if (status === 'empty') { label = 'пусто'; color = '#8a97ab'; }
  if (status === 'error') { label = 'ошибка'; color = '#e3564c'; }
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

const CLOSE_REASONS = [
  { value: 'success', label: '✅ Закрыть сделку (успешно)' },
  { value: 'cheaper', label: '💸 Нашли дешевле' },
  { value: 'no_response', label: '🔇 Нет обратной связи' },
  { value: 'cancelled', label: '🚫 Отменили закуп' },
  { value: 'competitor', label: '🏳️ Купили у конкурента' },
  { value: 'tender', label: '📋 Тендерщики' },
  { value: 'no_need', label: '➖ Нет потребности' },
  { value: 'failed', label: '❌ Сделка провалена' },
];

function RequestCard({ req, activeManager, isOpen, onToggle, onClaim, onSetPrice, onSetMargin, onClose }) {
  const [priceInput, setPriceInput] = useState(req.price_quoted || '');
  const [costPrice, setCostPrice] = useState(req.cost_price || '');
  const [margin, setMargin] = useState(req.margin || '');
  const [closeReason, setCloseReason] = useState('');
  const [showAll, setShowAll] = useState(false);
  const claimedByMe = req.claimed_by === activeManager;
  const claimedByOther = req.claimed_by && req.claimed_by !== activeManager;
  const managerName = (id) => MANAGERS.find((m) => m.id === id)?.name || id;

  const statusMeta = {
    new: { label: 'НОВАЯ', color: '#e08a2b' },
    claimed: { label: 'В РАБОТЕ', color: '#2f6fed' },
    closed: { label: 'ЗАКРЫТА', color: '#8a97ab' },
  }[req.status] || { label: req.status, color: '#8a97ab' };

  const items = Array.isArray(req.items) ? req.items : []; // проверенные
  const allItems = Array.isArray(req.all_items) ? req.all_items : []; // весь пул
  const verifiedKeys = new Set(items.map((p) => (p.link || p.title || '').toLowerCase()));
  const extraItems = allItems.filter((p) => !verifiedKeys.has((p.link || p.title || '').toLowerCase()));
  const totalFoundAll = req.total_found_all ?? allItems.length;
  const regionStatus = req.region_status || {};

  // расчёт калькулятора маржи в реальном времени
  const cp = parseFloat(costPrice) || 0;
  const m = parseFloat(margin) || 0;
  const subtotal = cp + m;
  const vat = subtotal * 0.16;
  const totalWithVat = subtotal + vat;
  const managerEarnings = totalWithVat * 0.2;

  const closeReasonLabel = CLOSE_REASONS.find((r) => r.value === req.close_reason)?.label;

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
          <span style={styles.reqFound}>
            {req.total_found ?? items.length} проверено
            {totalFoundAll > (req.total_found ?? items.length) && ` · ${totalFoundAll} всего`}
          </span>
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

          {req.status === 'closed' && closeReasonLabel && (
            <div style={styles.closedReasonTag}>{closeReasonLabel}</div>
          )}

          {claimedByOther ? (
            <div style={styles.claimedNotice}>⚠️ Эту заявку уже ведёт {managerName(req.claimed_by)}.</div>
          ) : (
            claimedByMe && req.status !== 'closed' && (
              <div style={styles.marginCalc}>
                <div style={styles.marginCalcTitle}>Калькулятор маржи</div>
                <div style={styles.row2}>
                  <Field label="Закупочная цена у поставщика">
                    <input
                      type="number"
                      style={styles.input}
                      placeholder="например: 1000000"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                    />
                  </Field>
                  <Field label="Ваша маржа (вкл. доставку)">
                    <input
                      type="number"
                      style={styles.input}
                      placeholder="например: 500000"
                      value={margin}
                      onChange={(e) => setMargin(e.target.value)}
                    />
                  </Field>
                </div>

                {(cp > 0 || m > 0) && (
                  <div style={styles.calcBreakdown}>
                    <div style={styles.calcRow}><span>Закупка + маржа</span><span>{subtotal.toLocaleString('ru-RU')} тг</span></div>
                    <div style={styles.calcRow}><span>НДС 16%</span><span>{Math.round(vat).toLocaleString('ru-RU')} тг</span></div>
                    <div style={styles.calcRowTotal}><span>Итого клиенту</span><span>{Math.round(totalWithVat).toLocaleString('ru-RU')} тг</span></div>
                    <div style={styles.calcRowEarn}><span>Ваш заработок (20%)</span><span>{Math.round(managerEarnings).toLocaleString('ru-RU')} тг</span></div>
                  </div>
                )}

                <button style={styles.primaryBtnSm} onClick={() => onSetMargin(costPrice, margin)}>
                  Сохранить расчёт
                </button>

                {req.price_quoted && (
                  <div style={styles.priceTag}>Цена клиенту: <strong>{Number(req.price_quoted).toLocaleString('ru-RU')} тг</strong></div>
                )}

                <div style={styles.closeRow}>
                  <select style={styles.input} value={closeReason} onChange={(e) => setCloseReason(e.target.value)}>
                    <option value="">— выбрать причину закрытия —</option>
                    {CLOSE_REASONS.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                  <button
                    style={{ ...styles.dangerBtnSm, opacity: closeReason ? 1 : 0.5 }}
                    disabled={!closeReason}
                    onClick={() => onClose(closeReason)}
                  >
                    Закрыть заявку
                  </button>
                </div>
              </div>
            )
          )}

          {!claimedByOther && !req.claimed_by && (
            <button style={styles.primaryBtnSm} onClick={onClaim}>Взять в работу</button>
          )}

          <div style={styles.resultsSection}>
            <div style={styles.resultsSectionTitle}>
              <span>✅ Проверенные поставщики</span>
              <span style={styles.resultsCountBadgeVerified}>{items.length}</span>
            </div>
            <div style={styles.itemsList}>
              {items.length === 0 ? (
                <div style={styles.emptyItems}>Ничего проверенного не найдено — посмотрите остальные результаты ниже.</div>
              ) : (
                items.map((p, i) => <ProductRow key={i} p={p} index={i} verified />)
              )}
            </div>
          </div>

          {extraItems.length > 0 && (
            <div style={styles.resultsSection}>
              <div style={styles.resultsSectionHeader} onClick={() => setShowAll((s) => !s)}>
                <div style={styles.resultsSectionTitle}>
                  <span>Остальные найденные</span>
                  <span style={styles.resultsCountBadgeAll}>{extraItems.length}</span>
                </div>
                <button style={styles.resultsToggleBtn} onClick={(e) => { e.stopPropagation(); setShowAll((s) => !s); }}>
                  {showAll ? 'Скрыть ▲' : 'Показать ▼'}
                </button>
              </div>
              {showAll && (
                <div style={styles.itemsList}>
                  {extraItems.map((p, i) => <ProductRow key={i} p={p} index={i} verified={false} />)}
                </div>
              )}
            </div>
          )}
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
    ok: { label: 'есть результаты', color: '#1e9e6b' },
    empty: { label: 'ничего не найдено', color: '#8a97ab' },
    error: { label: message ? `ошибка: ${message}` : 'ошибка', color: '#e3564c' },
  }[status] || { label: status, color: '#8a97ab' };
  return (
    <div style={{ ...styles.regionBadge, borderColor: cfg.color }} title={cfg.label}>
      <span>{meta?.flag}</span>
      <span style={{ color: cfg.color }}>{cfg.label}</span>
    </div>
  );
}

const DOMAIN_TO_COUNTRY = {
  kz: 'KZ', ru: 'RU', by: 'RU', de: 'EU', eu: 'EU', it: 'EU', fr: 'EU', pl: 'EU', es: 'EU',
  cn: 'CN', 'com.cn': 'CN',
};

function detectDomainCountry(link) {
  try {
    const host = new URL(link).hostname.toLowerCase();
    const parts = host.split('.');
    const tld2 = parts.slice(-2).join('.');
    const tld1 = parts[parts.length - 1];
    return DOMAIN_TO_COUNTRY[tld2] || DOMAIN_TO_COUNTRY[tld1] || null;
  } catch {
    return null;
  }
}

function ProductRow({ p, index, verified }) {
  const meta = COUNTRY_META[p._country];
  const domainCountry = p.link ? detectDomainCountry(p.link) : null;
  const mismatch = domainCountry && domainCountry !== p._country;
  const rowStyle = verified ? { ...styles.productRow, ...styles.productRowVerified } : styles.productRow;

  return (
    <div style={rowStyle}>
      <div style={styles.productIndex}>{index + 1}</div>
      <div style={styles.productBody}>
        <div style={styles.productTitle}>
          {meta?.flag} {p.title || 'Товар'}
          {verified && <span style={styles.verifiedCheck}>проверено</span>}
        </div>
        {p.snippet && <div style={styles.productSnippet}>{p.snippet}</div>}
        {p.link && <a href={p.link} target="_blank" rel="noreferrer" style={styles.productLink}>{p.link}</a>}
        {!verified && mismatch && (
          <div style={styles.domainWarning}>
            ⚠️ Домен сайта похож на другой регион ({domainCountry}) — проверьте, действительно ли поставщик из {meta?.label}
          </div>
        )}
      </div>
    </div>
  );
}
