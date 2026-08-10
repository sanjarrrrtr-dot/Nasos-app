import React, { useState } from 'react';
import { searchAndClassify } from './search.js';

const COUNTRIES = [
{ code: 'KZ', flag: '🇰🇿', name: 'Казахстан' },
{ code: 'RU', flag: '🇷🇺', name: 'Россия' },
{ code: 'CN', flag: '🇨🇳', name: 'Китай' },
{ code: 'EU', flag: '🇪🇺', name: 'Европа' },
];

const S = {
page: { minHeight: '100vh', background: '#EEF3F8', color: '#1B2733', fontFamily: '"IBM Plex Sans", -apple-system, sans-serif' },
topbar: { display: 'flex', alignItems: 'center', gap: 14, padding: '18px 32px', background: '#fff', boxShadow: '0 1px 0 rgba(20,40,70,0.06)' },
mark: { width: 38, height: 38, borderRadius: 12, background: 'linear-gradient(135deg,#2E7DF2,#14B8A3)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15 },
brand: { fontWeight: 700, fontSize: 15 },
brandSub: { fontSize: 12, color: '#6B7A8A' },
hero: { maxWidth: 720, margin: '0 auto', padding: '56px 20px 20px', textAlign: 'center' },
h1: { fontSize: 30, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 10 },
heroP: { fontSize: 14.5, color: '#6B7A8A', marginBottom: 30 },
searchRow: { display: 'flex', gap: 10, maxWidth: 640, margin: '0 auto 8px' },
input: { flex: 1, fontFamily: 'inherit', fontSize: 16, padding: '16px 20px', border: '1.5px solid #E3E9F0', borderRadius: 16, background: '#fff', color: '#1B2733' },
btn: { fontFamily: 'inherit', fontSize: 15, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg,#2E7DF2,#14B8A3)', border: 'none', borderRadius: 16, padding: '0 26px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(46,125,242,0.28)', whiteSpace: 'nowrap' },
hint: { textAlign: 'center', fontSize: 12, color: '#9CA9B5', marginBottom: 36 },
wrap: { maxWidth: 720, margin: '0 auto', padding: '0 20px 80px' },
progressGrid: { display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8, marginBottom: 34 },
progressPill: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, fontSize: 11.5, padding: '12px 6px', borderRadius: 12, background: '#fff', border: '1.5px solid #E3E9F0' },
countrySection: { marginBottom: 34 },
countryHead: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 },
countryHeadName: { fontSize: 15, fontWeight: 700 },
countryHeadLine: { flex: 1, height: 1, background: '#E3E9F0' },
groupLabel: { fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#9CA9B5', margin: '14px 0 8px' },
card: { display: 'block', background: '#fff', border: '1px solid #E3E9F0', borderRadius: 16, padding: '16px 18px', marginBottom: 10, textDecoration: 'none', color: 'inherit', boxShadow: '0 2px 8px rgba(20,40,70,0.05)' },
cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 },
cardName: { fontSize: 14.5, fontWeight: 600 },
badgeFactory: { fontSize: 11, fontWeight: 700, borderRadius: 100, padding: '4px 11px', whiteSpace: 'nowrap', flexShrink: 0, background: '#E6F8EE', color: '#1F9E5C', border: '1px solid #BFE8D1' },
badgeDealer: { fontSize: 11, fontWeight: 700, borderRadius: 100, padding: '4px 11px', whiteSpace: 'nowrap', flexShrink: 0, background: '#FBF1DF', color: '#D98A12', border: '1px solid #F0D9A8' },
snippet: { fontSize: 13, color: '#6B7A8A', lineHeight: 1.5, marginBottom: 10 },
cardBottom: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center' },
cardLink: { fontSize: 12.5, color: '#2E7DF2', fontWeight: 600 },
empty: { textAlign: 'center', padding: '50px 20px', color: '#6B7A8A', fontSize: 14, background: '#fff', border: '1.5px dashed #E3E9F0', borderRadius: 18 },
errorBanner: { background: '#FBEAE8', color: '#D14A3E', borderRadius: 12, padding: '12px 16px', fontSize: 13, marginBottom: 20 },
footer: { textAlign: 'center', fontSize: 11.5, color: '#9CA9B5', padding: 20 },
};

export default function App() {
const [model, setModel] = useState('');
const [status, setStatus] = useState('idle'); // idle | searching | done | error
const [progress, setProgress] = useState({});
const [grouped, setGrouped] = useState(null);
const [errorMsg, setErrorMsg] = useState('');

async function runSearch() {
if (!model.trim() || status === 'searching') return;
setStatus('searching');
setProgress({});
setGrouped(null);
setErrorMsg('');
try {
const result = await searchAndClassify(model.trim(), (code, s) => {
setProgress((p) => ({ ...p, [code]: s }));
});
setGrouped(result);
setStatus('done');
} catch (e) {
setErrorMsg(String(e.message || e));
setStatus('error');
}
}

const hasAnyResults = grouped && COUNTRIES.some((c) => grouped[c.code].factory.length || grouped[c.code].dealer.length);

return (
<div style={S.page}>
<div style={S.topbar}>
<div style={S.mark}>N</div>
<div>
<div style={S.brand}>NASOSPROM</div>
<div style={S.brandSub}>поиск поставщиков насосного оборудования</div>
</div>
</div>

  <div style={S.hero}>
    <div style={S.h1}>Найти насос</div>
    <div style={S.heroP}>Модель, марка или характеристики — покажем заводы и крупных поставщиков по Казахстану, России, Китаю и Европе</div>
  </div>

  <div style={S.searchRow}>
    <input
      style={S.input}
      value={model}
      onChange={(e) => setModel(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && runSearch()}
      placeholder="Например: Grundfos CR 15-4 или насос 100 л/с, напор 80 м"
    />
    <button style={{ ...S.btn, opacity: status === 'searching' ? 0.6 : 1 }} onClick={runSearch} disabled={status === 'searching'}>
      {status === 'searching' ? 'Ищем...' : 'Найти насос'}
    </button>
  </div>
  <div style={S.hint}>Только заводы, дилеры, дистрибьюторы и крупные поставщики. Посредники и частные объявления убираем.</div>

  <div style={S.wrap}>
    {status === 'searching' && (
      <div style={S.progressGrid}>
        {COUNTRIES.map((c) => {
          const s = progress[c.code];
          const map = { loading: ['поиск...', '#D98A12'], ok: ['готово', '#1F9E5C'], empty: ['пусто', '#9CA9B5'], error: ['ошибка', '#D14A3E'] };
          const [label, color] = map[s] || ['ожидание', '#9CA9B5'];
          return (
            <div key={c.code} style={{ ...S.progressPill, borderColor: color }}>
              <span style={{ fontSize: 18 }}>{c.flag}</span>
              <span>{c.name}</span>
              <span style={{ color, fontWeight: 600 }}>{label}</span>
            </div>
          );
        })}
        <div style={{ ...S.progressPill, borderColor: progress.classify === 'ok' ? '#1F9E5C' : progress.classify === 'error' ? '#D14A3E' : '#D98A12' }}>
          <span style={{ fontSize: 18 }}>🤖</span>
          <span>Проверка</span>
          <span style={{ fontWeight: 600 }}>{progress.classify === 'ok' ? 'готово' : progress.classify === 'error' ? 'ошибка' : 'анализ...'}</span>
        </div>
      </div>
    )}

    {status === 'error' && <div style={S.errorBanner}>⚠ Не удалось выполнить поиск: {errorMsg}</div>}

    {status === 'done' && !hasAnyResults && (
      <div style={S.empty}>Ничего не найдено ни в одной из стран. Попробуйте изменить формулировку модели.</div>
    )}

    {status === 'done' && hasAnyResults && COUNTRIES.map((c) => {
      const data = grouped[c.code];
      if (!data.factory.length && !data.dealer.length) return null;
      return (
        <div key={c.code} style={S.countrySection}>
          <div style={S.countryHead}>
            <span style={{ fontSize: 20 }}>{c.flag}</span>
            <span style={S.countryHeadName}>{c.name}</span>
            <span style={S.countryHeadLine} />
          </div>
          {data.factory.length > 0 && (
            <>
              <div style={S.groupLabel}>Заводы-производители</div>
              {data.factory.map((item, i) => <ResultCard key={i} item={item} badgeStyle={S.badgeFactory} />)}
            </>
          )}
          {data.dealer.length > 0 && (
            <>
              <div style={S.groupLabel}>Дилеры / дистрибьюторы / крупные поставщики</div>
              {data.dealer.map((item, i) => <ResultCard key={i} item={item} badgeStyle={S.badgeDealer} />)}
            </>
          )}
        </div>
      );
    })}
  </div>

  <div style={S.footer}>NASOSPROM · поиск поставщиков</div>
</div>

);
}

function ResultCard({ item, badgeStyle }) {
return (
<a href={item.url} target="_blank" rel="noreferrer" style={S.card}>
<div style={S.cardTop}>
<span style={S.cardName}>{item.title}</span>
<span style={badgeStyle}>{item.typeLabel}</span>
</div>
{item.snippet && <div style={S.snippet}>{item.snippet}</div>}
{(item.price || item.phone || item.email) && (
<div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 10, fontSize: 13 }}>
{item.price && <span style={{ fontWeight: 700, color: '#1F9E5C' }}>{item.price}</span>}
{item.phone && <span style={{ color: '#6B7A8A' }}>📞 {item.phone}</span>}
{item.email && <span style={{ color: '#6B7A8A' }}>✉ {item.email}</span>}
</div>
)}
<div style={S.cardBottom}>
<span style={S.cardLink}>Перейти на сайт →</span>
</div>
</a>
);
}
