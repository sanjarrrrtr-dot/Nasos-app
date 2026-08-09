fontSize: 11, fontWeight: 700, borderRadius: 100, padding: ‘4px 11px’, whiteSpace: ‘nowrap’, flexShrink: 0, background: ‘#FBF1DF’, color: ‘#D98A12’, border: ‘1px solid #F0D9A8’ },
snippet: { fontSize: 13, color: ‘#6B7A8A’, lineHeight: 1.5, marginBottom: 10 },
cardBottom: { display: ‘flex’, justifyContent: ‘flex-end’, alignItems: ‘center’ },
cardLink: { fontSize: 12.5, color: ‘#2E7DF2’, fontWeight: 600 },
empty: { textAlign: ‘center’, padding: ‘50px 20px’, color: ‘#6B7A8A’, fontSize: 14, background: ‘#fff’, border: ‘1.5px dashed #E3E9F0’, borderRadius: 18 },
errorBanner: { background: ‘#FBEAE8’, color: ‘#D14A3E’, borderRadius: 12, padding: ‘12px 16px’, fontSize: 13, marginBottom: 20 },
footer: { textAlign: ‘center’, fontSize: 11.5, color: ‘#9CA9B5’, padding: 20 },
};

export default function App() {
const [model, setModel] = useState(’’);
const [status, setStatus] = useState(‘idle’); // idle | searching | done | error
const [progress, setProgress] = useState({});
const [grouped, setGrouped] = useState(null);
const [errorMsg, setErrorMsg] = useState(’’);

async function runSearch() {
if (!model.trim() || status === ‘searching’) return;
setStatus(‘searching’);
setProgress({});
setGrouped(null);
setErrorMsg(’’);
try {
const result = await searchAndClassify(model.trim(), (code, s) => {
setProgress((p) => ({ …p, [code]: s }));
});
setGrouped(result);
setStatus(‘done’);
} catch (e) {
setErrorMsg(String(e.message || e));
setStatus(‘error’);
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

```
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
      {status === 'searching' ? 'Ищем…' : 'Найти насос'}
    </button>
  </div>
  <div style={S.hint}>Только заводы, дилеры, дистрибьюторы и крупные поставщики. Посредники и частные объявления убираем.</div>

  <div style={S.wrap}>
    {status === 'searching' && (
      <div style={S.progressGrid}>
        {COUNTRIES.map((c) => {
          const s = progress[c.code];
          const map = { loading: ['поиск…', '#D98A12'], ok: ['готово', '#1F9E5C'], empty: ['пусто', '#9CA9B5'], error: ['ошибка', '#D14A3E'] };
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
          <span style={{ fontWeight: 600 }}>{progress.classify === 'ok' ? 'готово' : progress.classify === 'error' ? 'ошибка' : 'анализ…'}</span>
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
```

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
<div style={{ display: ‘flex’, gap: 14, flexWrap: ‘wrap’, marginBottom: 10, fontSize: 13 }}>
{item.price && <span style={{ fontWeight: 700, color: ‘#1F9E5C’ }}>{item.price}</span>}
{item.phone && <span style={{ color: ‘#6B7A8A’ }}>📞 {item.phone}</span>}
{item.email && <span style={{ color: ‘#6B7A8A’ }}>✉ {item.email}</span>}
</div>
)}
<div style={S.cardBottom}>
<span style={S.cardLink}>Перейти на сайт →</span>
</div>
</a>
);
}
