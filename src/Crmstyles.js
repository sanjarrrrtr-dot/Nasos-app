const C = {
  ink: '#1B2733',
  inkSoft: '#6B7A8A',
  inkFaint: '#9CA9B5',
  line: '#E3E9F0',
  paper: '#FFFFFF',
  bg: '#EEF3F8',
  amber: '#D98A12',
  amberBg: '#FBF1DF',
  green: '#1F9E5C',
  greenBg: '#E6F8EE',
  red: '#D14A3E',
  redBg: '#FBEAE8',
  blue: '#2E7DF2',
  blueBg: '#EAF1FE',
  grayBg: '#F1F5F9',
};

export const crmStyles = {
  tabs: { display: 'flex', gap: 8, padding: '0 32px', background: '#fff', borderBottom: `1px solid ${C.line}` },
  tab: {
    padding: '14px 4px', margin: '0 12px 0 0', fontSize: 14, fontWeight: 600, color: C.inkSoft,
    cursor: 'pointer', borderBottom: '2px solid transparent', background: 'none', border: 'none',
  },
  tabActive: { color: C.blue, borderBottom: `2px solid ${C.blue}` },

  onboardWrap: { maxWidth: 420, margin: '60px auto', textAlign: 'center' },
  onboardTitle: { fontSize: 20, fontWeight: 700, marginBottom: 8 },
  onboardSub: { fontSize: 14, color: C.inkSoft, marginBottom: 24 },
  managerGrid: { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 },
  managerPick: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 18px', background: C.paper, border: `1px solid ${C.line}`, borderRadius: 14,
    cursor: 'pointer', fontSize: 14, fontWeight: 600,
  },

  gaugesRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 },
  gaugeCard: { background: C.paper, borderRadius: 18, padding: '18px 20px', boxShadow: '0 2px 10px rgba(20,40,70,0.06)' },
  gaugeTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 },
  gaugeLabel: { fontSize: 13, fontWeight: 700, color: C.inkSoft },
  gaugePct: { fontFamily: '"JetBrains Mono", monospace', fontSize: 12, color: C.amber, fontWeight: 700 },
  gaugeBody: { display: 'flex', alignItems: 'center', gap: 16 },
  gaugeVal: { fontFamily: '"JetBrains Mono", monospace', fontSize: 19, fontWeight: 700 },
  gaugeOf: { fontFamily: '"JetBrains Mono", monospace', fontSize: 11.5, color: C.inkFaint, marginTop: 2 },
  gaugeLeft: { fontSize: 11, color: C.inkFaint, marginTop: 6 },

  sectionHead: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: 700, color: C.inkSoft },
  sectionLine: { flex: 1, height: 1, background: C.line },

  board: { display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, marginBottom: 28 },
  col: { minWidth: 220, flex: '0 0 220px' },
  colHead: {
    display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
    textTransform: 'uppercase', color: C.inkFaint, marginBottom: 8, padding: '0 2px',
  },
  colCount: { background: C.grayBg, borderRadius: 20, padding: '1px 7px', color: C.inkSoft },
  card: { background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12, padding: '12px 13px', marginBottom: 9 },
  cardName: { fontSize: 13, fontWeight: 700, marginBottom: 5 },
  cardSum: { fontFamily: '"JetBrains Mono", monospace', fontSize: 13, color: C.amber, marginBottom: 7 },
  cardMeta: { fontSize: 11, color: C.inkFaint, marginBottom: 8 },
  cardActions: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  stageSelect: { fontSize: 11.5, padding: '5px 8px', borderRadius: 8, border: `1px solid ${C.line}`, background: C.grayBg, flex: 1 },
  smallDangerBtn: { fontSize: 11, color: C.red, background: C.redBg, border: 'none', borderRadius: 8, padding: '5px 9px', cursor: 'pointer' },

  addCardBtn: {
    width: '100%', padding: '10px', border: `1.5px dashed ${C.line}`, borderRadius: 12, background: 'transparent',
    color: C.inkSoft, fontSize: 13, cursor: 'pointer', marginTop: 8,
  },

  rightGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
  pomoCard: { background: C.paper, borderRadius: 18, padding: 20, textAlign: 'center', boxShadow: '0 2px 10px rgba(20,40,70,0.06)' },
  pomoTime: { fontFamily: '"JetBrains Mono", monospace', fontSize: 34, fontWeight: 700, margin: '10px 0' },
  pomoSub: { fontSize: 12, color: C.inkFaint, marginBottom: 14 },
  pomoBtnRow: { display: 'flex', gap: 8, justifyContent: 'center' },

  statsCard: { background: C.paper, borderRadius: 18, padding: 20, boxShadow: '0 2px 10px rgba(20,40,70,0.06)' },
  statRow: { display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '7px 0', borderBottom: `1px solid ${C.line}` },
};

export const STAGE_META = {
  new: { label: 'Новая', color: '#2E7DF2' },
  processing: { label: 'В обработке', color: '#2E7DF2' },
  found: { label: 'Товар найден', color: '#14B8A3' },
  negotiation: { label: 'Переговоры', color: '#D98A12' },
  quote_sent: { label: 'КП отправлено', color: '#D98A12' },
  invoice_sent: { label: 'Счёт выставлен', color: '#D98A12' },
  paid: { label: 'Оплачено', color: '#1F9E5C' },
  declined: { label: 'Отказано', color: '#D14A3E' },
};

export const STAGE_ORDER = ['new', 'processing', 'found', 'negotiation', 'quote_sent', 'invoice_sent', 'paid', 'declined'];
