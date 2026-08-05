const COLORS = {
  bg: '#eef0ea',
  paper: '#ffffff',
  ink: '#1c2220',
  inkSoft: '#4a5450',
  line: '#c9d0c4',
  brass: '#8a6d3b',
  brassDark: '#6b5228',
  steel: '#3f6f9e',
};

export const styles = {
  shell: {
    minHeight: '100vh',
    background: COLORS.bg,
    color: COLORS.ink,
    fontFamily: '"IBM Plex Sans", "Segoe UI", system-ui, sans-serif',
    display: 'flex',
    flexDirection: 'column',
  },
  topbar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '18px 32px', borderBottom: `3px solid ${COLORS.ink}`, background: COLORS.paper,
    flexWrap: 'wrap', gap: 16, position: 'sticky', top: 0, zIndex: 10,
  },
  brandBlock: { display: 'flex', alignItems: 'center', gap: 12 },
  brandMark: {
    width: 40, height: 40, borderRadius: 4, background: COLORS.ink, color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: '"IBM Plex Mono", monospace', fontWeight: 700, fontSize: 18,
  },
  brandName: { fontFamily: '"IBM Plex Mono", monospace', fontWeight: 700, fontSize: 15, letterSpacing: '0.05em' },
  brandSub: { fontSize: 12, color: COLORS.inkSoft },
  topbarRight: { display: 'flex', alignItems: 'center', gap: 12 },
  managerSelect: {
    fontFamily: '"IBM Plex Mono", monospace', fontSize: 12.5, padding: '9px 12px',
    border: `1.5px solid ${COLORS.line}`, borderRadius: 2, background: '#fbfbf9', color: COLORS.ink,
  },
  body: { flex: 1, padding: '32px 16px 60px' },
  footer: {
    display: 'flex', justifyContent: 'space-between', padding: '14px 32px',
    fontFamily: '"IBM Plex Mono", monospace', fontSize: 10.5, color: '#9aa39a',
    borderTop: `1px solid ${COLORS.line}`, flexWrap: 'wrap', gap: 8,
  },
  page: { maxWidth: 860, margin: '0 auto' },
  eyebrow: {
    fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, letterSpacing: '0.18em',
    textTransform: 'uppercase', color: COLORS.brassDark, fontWeight: 600,
  },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 },
  statCard: {
    background: COLORS.paper, border: `1px solid ${COLORS.line}`, borderRadius: 3, padding: '14px 10px',
    textAlign: 'center',
  },
  statValue: { fontFamily: '"IBM Plex Mono", monospace', fontSize: 24, fontWeight: 700 },
  statLabel: { fontSize: 11, color: COLORS.inkSoft, textTransform: 'uppercase', letterSpacing: '0.04em' },
  errorBanner: {
    background: '#f7e9e6', border: '1px solid #e2bcb2', color: '#b5433a', borderRadius: 2,
    padding: '10px 12px', fontSize: 13, marginBottom: 16,
  },
  emptyState: {
    background: COLORS.paper, border: `1px dashed ${COLORS.line}`, borderRadius: 3, padding: 30,
    textAlign: 'center', color: COLORS.inkSoft, fontSize: 14,
  },
  reqList: { display: 'flex', flexDirection: 'column', gap: 12 },
  reqCard: { background: COLORS.paper, border: `1px solid ${COLORS.line}`, borderRadius: 3 },
  reqCardTop: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px',
    cursor: 'pointer', gap: 12, flexWrap: 'wrap',
  },
  reqCardTopLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  statusTag: {
    fontFamily: '"IBM Plex Mono", monospace', fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
    border: '1.5px solid', borderRadius: 2, padding: '3px 8px', flexShrink: 0,
  },
  reqModel: { fontWeight: 600, fontSize: 15 },
  reqMeta: { fontSize: 12.5, color: COLORS.inkSoft, marginTop: 2 },
  reqCardTopRight: { display: 'flex', alignItems: 'center', gap: 12 },
  reqFound: { fontFamily: '"IBM Plex Mono", monospace', fontSize: 12, color: COLORS.inkSoft },
  chevron: { fontSize: 11, color: COLORS.inkSoft },
  reqCardBody: { borderTop: `1px solid ${COLORS.line}`, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 },
  detailGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  detailRow: { display: 'flex', flexDirection: 'column', gap: 2 },
  detailLabel: { fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.05em', color: COLORS.inkSoft },
  detailValue: { fontSize: 13.5 },
  regionRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  regionBadge: {
    display: 'flex', gap: 6, alignItems: 'center', fontSize: 12, border: '1.5px solid', borderRadius: 2,
    padding: '5px 9px', background: '#fbfbf9',
  },
  claimedNotice: {
    background: '#f7e9e6', border: '1px solid #e2bcb2', color: '#b5433a', borderRadius: 2,
    padding: '10px 12px', fontSize: 13,
  },
  actionsRow: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
  primaryBtn: {
    fontFamily: '"IBM Plex Mono", monospace', fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase',
    fontWeight: 600, color: '#fff', background: COLORS.ink, border: 'none', borderRadius: 2,
    padding: '14px 24px', cursor: 'pointer',
  },
  primaryBtnSm: {
    fontFamily: '"IBM Plex Mono", monospace', fontSize: 12, letterSpacing: '0.05em', textTransform: 'uppercase',
    color: '#fff', background: COLORS.steel, border: 'none', borderRadius: 2, padding: '9px 14px', cursor: 'pointer',
  },
  ghostBtnSm: {
    fontFamily: '"IBM Plex Mono", monospace', fontSize: 11.5, letterSpacing: '0.04em', color: COLORS.inkSoft,
    background: 'transparent', border: `1.5px solid ${COLORS.line}`, borderRadius: 2, padding: '9px 14px', cursor: 'pointer',
  },
  dangerBtnSm: {
    fontFamily: '"IBM Plex Mono", monospace', fontSize: 11.5, letterSpacing: '0.04em', color: '#b5433a',
    background: 'transparent', border: '1.5px solid #e2bcb2', borderRadius: 2, padding: '9px 14px', cursor: 'pointer',
  },
  priceInputWrap: { display: 'flex', gap: 8 },
  priceTag: {
    fontFamily: '"IBM Plex Mono", monospace', fontSize: 13, background: '#eaf2ec', color: '#3f7f5c',
    border: '1px solid #bfd8c6', borderRadius: 2, padding: '8px 12px', width: 'fit-content',
  },
  marginCalc: {
    background: '#f7f6f2', border: `1px solid ${COLORS.line}`, borderRadius: 3, padding: 14,
    display: 'flex', flexDirection: 'column', gap: 12,
  },
  marginCalcTitle: {
    fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
    color: COLORS.brassDark, fontWeight: 700,
  },
  calcBreakdown: {
    background: COLORS.paper, border: `1px dashed ${COLORS.line}`, borderRadius: 2, padding: 12,
    display: 'flex', flexDirection: 'column', gap: 6,
  },
  calcRow: {
    display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: COLORS.inkSoft,
    fontFamily: '"IBM Plex Mono", monospace',
  },
  calcRowTotal: {
    display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700, color: COLORS.ink,
    fontFamily: '"IBM Plex Mono", monospace', borderTop: `1px solid ${COLORS.line}`, paddingTop: 6,
  },
  calcRowEarn: {
    display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: COLORS.steel, fontWeight: 600,
    fontFamily: '"IBM Plex Mono", monospace',
  },
  closeRow: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 4 },
  closedReasonTag: {
    fontFamily: '"IBM Plex Mono", monospace', fontSize: 12.5, background: '#eef0ea', color: COLORS.inkSoft,
    border: `1px solid ${COLORS.line}`, borderRadius: 2, padding: '6px 10px', width: 'fit-content',
  },
  itemsList: { display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 },
  emptyItems: { fontSize: 13, color: COLORS.inkSoft, fontStyle: 'italic' },
  productRow: { display: 'flex', gap: 10, borderTop: `1px dashed ${COLORS.line}`, paddingTop: 10 },
  productIndex: { fontFamily: '"IBM Plex Mono", monospace', fontSize: 12, color: COLORS.inkSoft },
  productBody: { flex: 1, minWidth: 0 },
  productTitle: { fontSize: 13.5, fontWeight: 600 },
  productSnippet: { fontSize: 12.5, color: COLORS.inkSoft, marginTop: 3, lineHeight: 1.4 },
  productLink: { fontSize: 12, color: COLORS.steel, wordBreak: 'break-all', display: 'block', marginTop: 4 },

  /* modal */
  modalOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(28,34,32,0.5)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 100,
  },
  modalCard: {
    background: COLORS.paper, borderRadius: 4, maxWidth: 560, width: '100%',
    maxHeight: '90vh', overflowY: 'auto', border: `1px solid ${COLORS.line}`,
  },
  modalHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '18px 20px', borderBottom: `1px solid ${COLORS.line}`,
  },
  modalClose: {
    background: 'transparent', border: 'none', fontSize: 22, cursor: 'pointer', color: COLORS.inkSoft,
  },
  form: { padding: 20, display: 'flex', flexDirection: 'column', gap: 16 },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
  field: { display: 'flex', flexDirection: 'column', gap: 7 },
  fieldLabel: {
    fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, letterSpacing: '0.06em',
    textTransform: 'uppercase', color: COLORS.brassDark,
  },
  req: { color: '#b5433a' },
  input: {
    width: '100%', fontFamily: '"IBM Plex Sans", sans-serif', fontSize: 15,
    padding: '11px 12px', border: `1.5px solid ${COLORS.line}`, borderRadius: 2,
    background: '#fbfbf9', color: COLORS.ink, boxSizing: 'border-box',
  },
  progressGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 },
  progressPill: {
    display: 'flex', justifyContent: 'space-between', fontSize: 13,
    border: '1.5px solid', borderRadius: 2, padding: '8px 12px', background: '#fbfbf9',
  },
};
