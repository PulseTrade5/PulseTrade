import { useState } from 'react';
import { analyzeStock } from './technicalAnalysis';

export default function StockDashboard() {
  const [symbolInput, setSymbolInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [stockName, setStockName] = useState('');

  const handleSearch = async () => {
    if (!symbolInput.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    let symbol = symbolInput.trim().toUpperCase();
    if (!symbol.includes('.')) symbol = symbol + '.NS';

    try {
      const res = await fetch(`/api/get-stock-data?symbol=${encodeURIComponent(symbol)}&range=1y`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Data fetch failed. Symbol galat ho sakta hai.');
        setLoading(false);
        return;
      }

      if (!data.candles || data.candles.length < 205) {
        setError('Itna purana data nahi mila is stock ke liye (kam se kam 205 din chahiye).');
        setLoading(false);
        return;
      }

      const analysis = analyzeStock(data.candles);
      if (analysis.error) {
        setError(analysis.error);
        setLoading(false);
        return;
      }

      setResult(analysis);
      setStockName(symbol.replace('.NS', '').replace('.BO', ''));
    } catch (err) {
      console.error(err);
      setError('Kuch gadbad ho gayi, dobara try karo.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.sebiBox}>
        ⚠️ <strong>Disclaimer:</strong> Yeh sirf technical trend par based estimate hai — investment advice nahi hai. SEBI registered advisor se salah lein.
      </div>
      <div style={styles.searchRow}>
        <input
          type="text"
          placeholder="Stock symbol daalo (e.g. RELIANCE, TCS, INFY)"
          value={symbolInput}
          onChange={(e) => setSymbolInput(e.target.value)}
          onKeyDown={handleKeyDown}
          style={styles.input}
        />
        <button onClick={handleSearch} disabled={loading} style={styles.searchBtn}>
          {loading ? '...' : 'Check'}
        </button>
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}

      {result && (
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.stockName}>{stockName}</span>
            <span style={styles.lastClose}>₹{result.lastClose}</span>
          </div>

          <div style={styles.grid}>
            <Row label="Trend" value={result.trend} color={colorFor(result.trend)} />
            <Row label="Momentum (MACD)" value={result.momentum} color={colorFor(result.momentum)} />
            <Row label="RSI" value={result.rsi} />
            <Row label="ADX (Strength)" value={`${result.adx} (${result.trendStrength})`} />
            <Row label="Supertrend" value={result.supertrend} color={colorFor(result.supertrend)} />
            <Row label="Technical Alignment" value={`${result.technicalAlignment.bullPct}% Bull / ${result.technicalAlignment.bearPct}% Bear`} />
            <Row label="Support/Resistance" value={`${result.supportResistanceGaugePct}%`} />
            <Row label="Long Score" value={`${result.longScore} / 100`} />
            <Row label="Short Score" value={`${result.shortScore} / 100`} />
            <Row label="52-Week High / Low" value={`₹${result.week52High} / ₹${result.week52Low}`} />
            <Row label="Distance from 52W High" value={`${result.distFromHighPct}%`} />
          </div>

          {result.signal ? (
            <div style={{ ...styles.signalBox, borderColor: result.signal === 'LONG' ? '#1a9e54' : '#d9342b' }}>
              <div style={{ ...styles.signalTitle, color: result.signal === 'LONG' ? '#1a9e54' : '#d9342b' }}>
                {result.signal === 'LONG' ? '📈 Bullish Setup' : '📉 Bearish Setup'}
              </div>
              <Row label="Entry" value={`₹${result.entry}`} />
              <Row label="Stop Loss" value={`₹${result.stopLoss}`} />
              <Row label="Targets (1R/2R/3R)" value={result.targets.map((t) => `₹${t}`).join(' / ')} />
              <Row label="Suggested Hold" value={result.suggestedHold} />
              <div style={styles.disclaimer}>
                Ye sirf technical analysis hai, investment advice nahi. Apna risk khud manage karo.
              </div>
            </div>
          ) : (
            <div style={styles.noSignalBox}>
              Abhi koi clear confluence signal nahi bana hai is stock mein. Trend/momentum/volatility ek line mein nahi hain.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, color }) {
  return (
    <div style={styles.row}>
      <span style={styles.rowLabel}>{label}</span>
      <span style={{ ...styles.rowValue, color: color || '#222' }}>{value}</span>
    </div>
  );
}

function colorFor(text) {
  if (text === 'Bullish') return '#1a9e54';
  if (text === 'Bearish') return '#d9342b';
  return '#888';
}

const styles = {
  wrapper: { maxWidth: 480, margin: '20px auto', padding: '0 16px', fontFamily: 'sans-serif' },
  sebiBox: { background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#856404', textAlign: 'center' },
  searchRow: { display: 'flex', gap: 8 },
  input: { flex: 1, padding: '10px 12px', fontSize: 15, border: '1px solid #ccc', borderRadius: 8 },
  searchBtn: { padding: '10px 18px', fontSize: 15, fontWeight: 'bold', backgroundColor: '#8B4513', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' },
  errorBox: { marginTop: 12, padding: 12, backgroundColor: '#fdecea', color: '#a33', borderRadius: 8, fontSize: 14 },
  card: { marginTop: 16, padding: 16, border: '1px solid #e0e0e0', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', textAlign: 'left' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid #eee', paddingBottom: 10 },
  stockName: { fontSize: 20, fontWeight: 'bold' },
  lastClose: { fontSize: 18, fontWeight: 'bold', color: '#8B4513' },
  grid: { display: 'flex', flexDirection: 'column', gap: 6 },
  row: { display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '4px 0' },
  rowLabel: { color: '#666' },
  rowValue: { fontWeight: 600 },
  signalBox: { marginTop: 16, padding: 12, border: '2px solid', borderRadius: 10 },
  signalTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  noSignalBox: { marginTop: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 10, fontSize: 13, color: '#777' },
  disclaimer: { fontSize: 11, color: '#999', marginTop: 10, fontStyle: 'italic' },
};
