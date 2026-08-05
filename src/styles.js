const COLORS = {
  bg: '#EEF3F8',
  paper: '#FFFFFF',
  ink: '#1B2733',
  inkSoft: '#6B7A8A',
  line: '#E3E9F0',
  blue: '#2E7DF2',
  teal: '#14B8A3',
  amber: '#D98A12',
  green: '#1F9E5C',
  greenBg: '#E6F8EE',
  red: '#D14A3E',
  redBg: '#FBEAE8',
  grayBg: '#F1F5F9',
  fieldBg: '#F8FAFC',
};

const GRADIENT = `linear-gradient(135deg, ${COLORS.blue}, ${COLORS.teal})`;

export const styles = {
  shell: {
    minHeight: '100vh',
    background: COLORS.bg,
    color: COLORS.ink,
    fontFamily: '"Inter", -apple-system, "Segoe UI", system-ui, sans-serif',
    display: 'flex',
    flexDirection: 'column',
  },
  topbar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '18px 32px', background: COLORS.paper,
    boxShadow: '0 1px 0 rgba(20,40,70,0.06)',
    flexWrap: 'wrap', gap: 16, position: 'sticky', top: 0, zIndex: 10,
  },
  brandBlock: { display: 'flex', alignItems: 'center', gap: 14 },
  brandMark: {
    width: 42, height: 42, borderRadius: 14, background: GRADIENT, color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 17,
  },
  brandName: { fontWeight: 700, fontSize: 16 },
  brandSub: { fontSize: 12, color: COLORS.inkSoft, marginTop: 2 },
  topbarRight: { display: 'flex', alignItems: 'center', gap: 12 },
  managerSelect: {
    fontSize: 13, padding: '10px 16px',
    border: `1px solid ${COLORS.line}`, borderRadius: 12, background: COLORS.paper, color: COLORS.ink,
  },
  body: { flex: 1, padding: '32px 16px 60px' },
  footer: {
    display: 'flex', justifyContent: 'space-between', padding: '16px 32px',
    fontSize: 11, color: '#9CA9B5',
    borderTop: `1px solid ${COLORS.line}`, flexWrap: 'wrap', gap: 8,
  },
  page: { maxWidth: 900, margin: '0 auto' },
  eyebrow: {
    fontSize: 12, letterSpacing: '0.04em',
    textTransform: 'uppercase', color: COLORS.inkSoft, fontWeight: 600,
  },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 },
  statCard: {
    background: COLORS.paper, borderRadius: 18, padding: '20px',
    textAlign: 'center', boxShadow: '0 2px 10px rgba(20,40,70,0.06)',
  },
  statValue: { fontFamily: '"JetBrains Mono", "Courier New", monospace', fontSize: 26, fontWeight: 700 },
  statLabel: { fontSize: 12, color: COLORS.inkSoft, marginTop: 4, letterSpacing: '0.02em' },
  errorBanner: {
    background: COLORS.redBg, color: COLORS.red, borderRadius: 12,
    padding: '12px 16px', fontSize: 13, marginBottom: 16,
  },
  emptyState: {
    background: COLORS.paper, border: `1px dashed ${COLORS.line}`, borderRadius: 16, padding: 36,
    textAlign: 'center', color: COLORS.inkSoft, fontSize: 14,
  },
  reqList: { display: 'flex', flexDirection: 'column', gap: 12 },
  reqCard: {
    background: COLORS.paper, borderRadius: 16, overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(20,40,70,0.05)',
  },
  reqCardTop: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px',
    cursor: 'pointer', gap: 12, flexWrap: 'wrap',
  },
  reqCardTopLeft: { display: 'flex', alignItems: 'center', gap: 14 },
  statusTag: {
    fontSize: 11, fontWeight: 700, letterSpacing: '0.03em',
    border: '1.5px solid', borderRadius: 100, padding: '5px 12px', flexShrink: 0,
    background: COLORS.grayBg,
  },
  reqModel: { fontWeight: 600, fontSize: 15, color: COLORS.ink },
  reqMeta: { fontSize: 12.5, color: COLORS.inkSoft, marginTop: 3 },
  reqCardTopRight: { display: 'flex', alignItems: 'center', gap: 14 },
  reqFound: {
    fontFamily: '"JetBrains Mono", "Courier New", monospace', fontSize: 12.5, fontWeight: 700,
    color: COLORS.ink, background: COLORS.grayBg, borderRadius: 100, padding: '6px 13px',
  },
  chevron: { fontSize: 12, color: '#A0ACB8' },
  reqCardBody: {
    borderTop: `1px solid ${COLORS.line}`, padding: '18px 20px',
    display: 'flex', flexDirection: 'column', gap: 16,
  },
  detailGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  detailRow: { display: 'flex', flexDirection: 'column', gap: 3 },
  detailLabel: { fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.05em', color: COLORS.inkSoft },
  detailValue: { fontSize: 14, color: COLORS.ink },
  regionRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  regionBadge: {
    display: 'flex', gap: 6, alignItems: 'center', fontSize: 12, border: '1.5px solid', borderRadius: 100,
    padding: '6px 12px', background: COLORS.grayBg,
  },
  claimedNotice: {
    background: COLORS.redBg, color: COLORS.red, borderRadius: 12,
    padding: '12px 14px', fontSize: 13,
  },
  actionsRow: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
  primaryBtn: {
    fontSize: 14, fontWeight: 700,
    color: '#fff', background: GRADIENT, border: 'none', borderRadius: 14,
    padding: '15px 24px', cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(46,125,242,0.28)',
  },
  primaryBtnSm: {
    fontSize: 13, fontWeight: 600,
    color: '#fff', background: GRADIENT, border: 'none', borderRadius: 12, padding: '10px 16px', cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(46,125,242,0.22)',
  },
  ghostBtnSm: {
    fontSize: 12.5, color: COLORS.inkSoft,
    background: 'transparent', border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: '10px 16px', cursor: 'pointer',
  },
  dangerBtnSm: {
    fontSize: 12.5, color: COLORS.red,
    background: COLORS.redBg, border: 'none', borderRadius: 12, padding: '10px 16px', cursor: 'pointer',
  },
  priceInputWrap: { display: 'flex', gap: 8 },
  priceTag: {
    fontFamily: '"JetBrains Mono", "Courier New", monospace', fontSize: 13.5, background: COLORS.greenBg, color: COLORS.green,
    border: 'none', borderRadius: 12, padding: '9px 14px', width: 'fit-content', fontWeight: 600,
  },
  marginCalc: {
    background: COLORS.grayBg, borderRadius: 16, padding: 18,
    display: 'flex', flexDirection: 'column', gap: 14,
  },
  marginCalcTitle: {
    fontSize: 12, letterSpacing: '0.04em', textTransform: 'uppercase',
    color: COLORS.inkSoft, fontWeight: 700,
  },
  calcBreakdown: {
    background: COLORS.paper, border: `1px dashed ${COLORS.line}`, borderRadius: 12, padding: 14,
    display: 'flex', flexDirection: 'column', gap: 7,
  },
  calcRow: {
    display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: COLORS.inkSoft,
    fontFamily: '"JetBrains Mono", "Courier New", monospace',
  },
  calcRowTotal: {
    display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, color: COLORS.ink,
    fontFamily: '"JetBrains Mono", "Courier New", monospace', borderTop: `1px solid ${COLORS.line}`, paddingTop: 7,
  },
  calcRowEarn: {
    display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: COLORS.blue, fontWeight: 600,
    fontFamily: '"JetBrains Mono", "Courier New", monospace',
  },
  closeRow: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginTop: 4 },
  closedReasonTag: {
    fontSize: 13, background: COLORS.grayBg, color: COLORS.inkSoft,
    border: 'none', borderRadius: 12, padding: '8px 12px', width: 'fit-content',
  },
  itemsList: { display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 },
  emptyItems: { fontSize: 13, color: COLORS.inkSoft, fontStyle: 'italic' },
  productRow: { display: 'flex', gap: 12, borderTop: `1px dashed ${COLORS.line}`, paddingTop: 12 },
  productIndex: { fontFamily: '"JetBrains Mono", "Courier New", monospace', fontSize: 12, color: COLORS.inkSoft },
  productBody: { flex: 1, minWidth: 0 },
  productTitle: { fontSize: 14, fontWeight: 600, color: COLORS.ink },
  productSnippet: { fontSize: 12.5, color: COLORS.inkSoft, marginTop: 4, lineHeight: 1.5 },
  productLink: { fontSize: 12, color: COLORS.blue, wordBreak: 'break-all', display: 'block', marginTop: 5, textDecoration: 'none' },

  /* modal */
  modalOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(20,30,45,0.45)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 100,
  },
  modalCard: {
    background: COLORS.paper, borderRadius: 20, maxWidth: 560, width: '100%',
    maxHeight: '90vh', overflowY: 'auto', border: 'none',
    boxShadow: '0 20px 60px rgba(20,40,70,0.22)',
  },
  modalHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '20px 24px', borderBottom: `1px solid ${COLORS.line}`,
  },
  modalClose: {
    background: 'transparent', border: 'none', fontSize: 24, cursor: 'pointer', color: COLORS.inkSoft, lineHeight: 1,
  },
  form: { padding: 24, display: 'flex', flexDirection: 'column', gap: 18 },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 8 },
  fieldLabel: {
    fontSize: 12, letterSpacing: '0.02em',
    color: COLORS.inkSoft, fontWeight: 600,
  },
  req: { color: COLORS.red },
  input: {
    width: '100%', fontFamily: 'inherit', fontSize: 15,
    padding: '12px 14px', border: `1px solid ${COLORS.line}`, borderRadius: 12,
    background: COLORS.fieldBg, color: COLORS.ink, boxSizing: 'border-box',
  },
  progressGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 },
  progressPill: {
    display: 'flex', justifyContent: 'space-between', fontSize: 13,
    border: '1.5px solid', borderRadius: 12, padding: '10px 14px', background: COLORS.grayBg,
  },
};
