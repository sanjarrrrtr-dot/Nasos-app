const COLORS = {
  bgFrom: '#0f1b2d',
  bgTo: '#f2f6fb',
  pageBg: '#eef3fa',
  paper: '#ffffff',
  ink: '#101a2b',
  inkSoft: '#5b6b83',
  inkFaint: '#8a97ab',
  line: '#dde6f2',
  lineSoft: '#e8eef8',

  primary: '#2f6fed',
  primaryDark: '#1d4fb8',
  primarySoft: '#eaf1ff',
  gradPrimary: 'linear-gradient(135deg, #1d4fb8 0%, #2f6fed 55%, #4f9bff 100%)',
  gradPrimarySoft: 'linear-gradient(135deg, #eaf1ff 0%, #f5f9ff 100%)',

  success: '#1e9e6b',
  successSoft: '#e6f7ee',
  successBorder: '#a9e3c8',

  warning: '#e08a2b',
  warningSoft: '#fdf1e2',
  warningBorder: '#f3cd97',

  danger: '#e3564c',
  dangerSoft: '#fdecea',
  dangerBorder: '#f5b7b1',

  neutral: '#8a97ab',
  neutralSoft: '#eef1f6',
};

const FONT = '"Inter", "Segoe UI", system-ui, sans-serif';
const FONT_MONO = '"JetBrains Mono", "SF Mono", monospace';

export const styles = {
  shell: {
    minHeight: '100vh',
    background: COLORS.pageBg,
    color: COLORS.ink,
    fontFamily: FONT,
    display: 'flex',
    flexDirection: 'column',
  },
  topbar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 32px', background: COLORS.gradPrimary, color: '#fff',
    flexWrap: 'wrap', gap: 16, position: 'sticky', top: 0, zIndex: 10,
    boxShadow: '0 4px 24px rgba(29,79,184,0.25)',
  },
  brandBlock: { display: 'flex', alignItems: 'center', gap: 12 },
  brandMark: {
    width: 42, height: 42, borderRadius: 14, background: 'rgba(255,255,255,0.18)', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 18, backdropFilter: 'blur(4px)',
  },
  brandName: { fontWeight: 800, fontSize: 16, letterSpacing: '0.02em' },
  brandSub: { fontSize: 12.5, color: 'rgba(255,255,255,0.75)' },
  topbarRight: { display: 'flex', alignItems: 'center', gap: 12 },
  managerSelect: {
    fontFamily: FONT, fontSize: 13, padding: '10px 14px', fontWeight: 600,
    border: 'none', borderRadius: 12, background: 'rgba(255,255,255,0.95)', color: COLORS.ink,
    cursor: 'pointer',
  },
  body: { flex: 1, padding: '32px 16px 60px' },
  footer: {
    display: 'flex', justifyContent: 'space-between', padding: '16px 32px',
    fontFamily: FONT_MONO, fontSize: 11, color: COLORS.inkFaint,
    borderTop: `1px solid ${COLORS.line}`, flexWrap: 'wrap', gap: 8,
    background: COLORS.paper,
  },
  page: { maxWidth: 880, margin: '0 auto' },

  eyebrow: {
    fontFamily: FONT_MONO, fontSize: 11, letterSpacing: '0.14em',
    textTransform: 'uppercase', color: COLORS.primaryDark, fontWeight: 700,
  },

  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 },
  statCard: {
    background: COLORS.paper, border: `1px solid ${COLORS.line}`, borderRadius: 18, padding: '18px 14px',
    textAlign: 'center', boxShadow: '0 2px 10px rgba(16,26,43,0.05)',
  },
  statValue: { fontSize: 26, fontWeight: 800 },
  statLabel: { fontSize: 11.5, color: COLORS.inkSoft, marginTop: 4, fontWeight: 500 },

  errorBanner: {
    background: COLORS.dangerSoft, border: `1px solid ${COLORS.dangerBorder}`, color: COLORS.danger, borderRadius: 14,
    padding: '12px 16px', fontSize: 13.5, marginBottom: 16, fontWeight: 500,
  },

  emptyState: {
    background: COLORS.paper, border: `2px dashed ${COLORS.lineSoft}`, borderRadius: 20, padding: 36,
    textAlign: 'center', color: COLORS.inkSoft, fontSize: 14.5,
  },

  reqList: { display: 'flex', flexDirection: 'column', gap: 14 },
  reqCard: {
    background: COLORS.paper, border: `1px solid ${COLORS.line}`, borderRadius: 20,
    boxShadow: '0 2px 12px rgba(16,26,43,0.06)', overflow: 'hidden',
  },
  reqCardTop: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', cursor: 'pointer',
    gap: 12, flexWrap: 'wrap',
  },
  reqCardTopLeft: { display: 'flex', alignItems: 'center', gap: 14 },
  statusTag: {
    fontSize: 10.5, fontWeight: 700, letterSpacing: '0.04em',
    borderRadius: 999, padding: '5px 12px', flexShrink: 0,
  },
  reqModel: { fontWeight: 700, fontSize: 15.5 },
  reqMeta: { fontSize: 12.5, color: COLORS.inkSoft, marginTop: 3 },
  reqCardTopRight: { display: 'flex', alignItems: 'center', gap: 14 },
  reqFound: { fontSize: 12.5, color: COLORS.inkSoft, fontWeight: 600 },
  chevron: { fontSize: 12, color: COLORS.inkFaint },

  reqCardBody: { borderTop: `1px solid ${COLORS.lineSoft}`, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 },
  detailGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  detailRow: { display: 'flex', flexDirection: 'column', gap: 3 },
  detailLabel: { fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: COLORS.primaryDark, fontWeight: 700 },
  detailValue: { fontSize: 13.5, fontWeight: 500 },

  regionRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  regionBadge: {
    display: 'flex', gap: 6, alignItems: 'center', fontSize: 12, fontWeight: 600, borderRadius: 999,
    padding: '6px 12px', border: '1.5px solid',
  },

  claimedNotice: {
    background: COLORS.dangerSoft, border: `1px solid ${COLORS.dangerBorder}`, color: COLORS.danger, borderRadius: 14,
    padding: '12px 16px', fontSize: 13.5, fontWeight: 500,
  },
  actionsRow: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
  primaryBtn: {
    fontSize: 14, fontWeight: 700, color: '#fff', background: COLORS.gradPrimary, border: 'none',
    borderRadius: 999, padding: '15px 26px', cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(47,111,237,0.35)',
  },
  primaryBtnSm: {
    fontSize: 12.5, fontWeight: 700, color: '#fff', background: COLORS.gradPrimary, border: 'none',
    borderRadius: 999, padding: '10px 18px', cursor: 'pointer',
    boxShadow: '0 3px 10px rgba(47,111,237,0.3)',
  },
  ghostBtnSm: {
    fontSize: 12, fontWeight: 600, color: COLORS.inkSoft,
    background: COLORS.neutralSoft, border: 'none', borderRadius: 999, padding: '10px 16px', cursor: 'pointer',
  },
  dangerBtnSm: {
    fontSize: 12, fontWeight: 600, color: COLORS.danger,
    background: COLORS.dangerSoft, border: `1.5px solid ${COLORS.dangerBorder}`, borderRadius: 999, padding: '10px 16px', cursor: 'pointer',
  },
  priceInputWrap: { display: 'flex', gap: 8 },
  priceTag: {
    fontSize: 13.5, fontWeight: 700, background: COLORS.successSoft, color: COLORS.success,
    border: `1px solid ${COLORS.successBorder}`, borderRadius: 12, padding: '9px 14px', width: 'fit-content',
  },

  marginCalc: {
    background: COLORS.gradPrimarySoft, border: `1px solid ${COLORS.lineSoft}`, borderRadius: 18, padding: 16,
    display: 'flex', flexDirection: 'column', gap: 14,
  },
  marginCalcTitle: {
    fontSize: 12, letterSpacing: '0.05em', textTransform: 'uppercase',
    color: COLORS.primaryDark, fontWeight: 800,
  },
  calcBreakdown: {
    background: COLORS.paper, border: `1px dashed ${COLORS.line}`, borderRadius: 14, padding: 12,
    display: 'flex', flexDirection: 'column', gap: 7,
  },
  calcRow: {
    display: 'flex', justifyContent: 'space-between', fontSize: 13, color: COLORS.inkSoft, fontWeight: 500,
  },
  calcRowTotal: {
    display: 'flex', justifyContent: 'space-between', fontSize: 14.5, fontWeight: 800, color: COLORS.ink,
    borderTop: `1px solid ${COLORS.lineSoft}`, paddingTop: 7, marginTop: 3,
  },
  calcRowEarn: {
    display: 'flex', justifyContent: 'space-between', fontSize: 13, color: COLORS.primary, fontWeight: 700,
  },
  closeRow: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 4 },
  closedReasonTag: {
    fontSize: 12.5, background: COLORS.neutralSoft, color: COLORS.inkSoft, fontWeight: 600,
    borderRadius: 999, padding: '7px 14px', width: 'fit-content',
  },

  /* ---- секции результатов поиска (проверенные / все) ---- */
  resultsSection: { display: 'flex', flexDirection: 'column', gap: 10 },
  resultsSectionHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
  },
  resultsSectionTitle: {
    display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: COLORS.ink,
  },
  resultsCountBadgeVerified: {
    fontSize: 11.5, fontWeight: 700, borderRadius: 999, padding: '3px 10px',
    background: COLORS.successSoft, color: COLORS.success, border: `1px solid ${COLORS.successBorder}`,
  },
  resultsCountBadgeAll: {
    fontSize: 11.5, fontWeight: 700, borderRadius: 999, padding: '3px 10px',
    background: COLORS.neutralSoft, color: COLORS.inkSoft,
  },
  resultsToggleBtn: {
    fontSize: 12.5, fontWeight: 700, color: COLORS.primary, background: 'transparent',
    border: 'none', cursor: 'pointer', padding: '4px 2px',
  },

  itemsList: { display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 },
  emptyItems: { fontSize: 13, color: COLORS.inkFaint, fontStyle: 'italic' },
  productRow: {
    display: 'flex', gap: 12, background: COLORS.paper, border: `1px solid ${COLORS.lineSoft}`,
    borderRadius: 16, padding: 12,
  },
  productRowVerified: {
    borderColor: COLORS.successBorder, background: COLORS.successSoft,
  },
  productIndex: { fontSize: 12, color: COLORS.inkFaint, minWidth: 20, fontWeight: 700 },
  productBody: { flex: 1, minWidth: 0 },
  productTitle: { fontSize: 13.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 },
  verifiedCheck: {
    fontSize: 10.5, fontWeight: 700, color: COLORS.success, background: '#fff',
    borderRadius: 999, padding: '1px 8px', border: `1px solid ${COLORS.successBorder}`,
  },
  productSnippet: { fontSize: 12.5, color: COLORS.inkSoft, marginTop: 4, lineHeight: 1.45 },
  productLink: { fontSize: 12, color: COLORS.primary, wordBreak: 'break-all', display: 'block', marginTop: 4, fontWeight: 500 },
  domainWarning: {
    fontSize: 11.5, color: COLORS.warning, marginTop: 6, fontStyle: 'italic', fontWeight: 500,
  },

  /* modal */
  modalOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(16,26,43,0.55)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 100,
    backdropFilter: 'blur(2px)',
  },
  modalCard: {
    background: COLORS.paper, borderRadius: 24, maxWidth: 560, width: '100%',
    maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(16,26,43,0.3)',
  },
  modalHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '20px 24px', borderBottom: `1px solid ${COLORS.lineSoft}`,
  },
  modalClose: {
    background: COLORS.neutralSoft, border: 'none', width: 32, height: 32, borderRadius: 999,
    fontSize: 18, cursor: 'pointer', color: COLORS.inkSoft, lineHeight: 1,
  },

  form: { padding: 24, display: 'flex', flexDirection: 'column', gap: 18 },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
  field: { display: 'flex', flexDirection: 'column', gap: 7 },
  fieldLabel: {
    fontSize: 11.5, letterSpacing: '0.04em', fontWeight: 700,
    textTransform: 'uppercase', color: COLORS.primaryDark,
  },
  req: { color: COLORS.danger },
  input: {
    width: '100%', fontFamily: FONT, fontSize: 15,
    padding: '12px 14px', border: `1.5px solid ${COLORS.line}`, borderRadius: 14,
    background: '#f8fafd', color: COLORS.ink, boxSizing: 'border-box',
  },
  progressGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 },
  progressPill: {
    display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600,
    borderRadius: 999, padding: '9px 14px', background: '#f8fafd', border: '1.5px solid',
  },
};
