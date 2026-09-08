import { useState } from 'react';
import { analyzeIntraday } from './intradayAnalysis';

const COLORS = {
  bg: "#F4F6FA", surface: "#FFFFFF", surfaceBorder: "#E2E8F0",
  gold: "#C8920A", goldLight: "#FEF3C7",
  green: "#059669", greenLight: "#ECFDF5",
  red: "#DC2626", redLight: "#FEF2F2",
  text: "#0F172A", muted: "#64748B",
};

function fmtINR(n) {
  if (n === null || n === undefined || isNaN(n)) return "—";
  return "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export default function IntradaySignal() {
  const [symbolInput, setSymbolInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [symbol, setSymbol] = useState('');

  const handleSearch = async () => {
    const sym = symbolInput.trim().toUpperCase();
    if (!sym) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      let ySym = sym.includes('.') ? sym : sym + '.NS';
      const res = await fetch(`/api/get-stock-data?symbol=${encodeURIComponent(ySym)}&range=5d&interval=5m`);
      const data = await res.json();
      if (!res.ok || !data.candles || data.candles.length < 30) {
        setError('Intraday data nahi mila — symbol check karo ya market hours mein try karo');
        setLoading(false);
        return;
      }
      const analysis = analyzeIntraday(data.candles);
      if (analysis.error) {
        setError(analysis.error);
        setLoading(false);
        return;
      }
      setResult(analysis);
      setSymbol(sym);
    } catch (e) {
      setError('Kuch gadbad ho gayi, dobara try karo');
    }
    setLoading(false);
  };

  const cardStyle = { backgroundColor: COLORS.surface, border: `1px solid ${COLORS.surfaceBorder}`, borderRadius: 16, padding: 18, marginBottom: 16 };
  const inputStyle = { width: '100%', padding: '11px 14px', fontSize: 14, borderRadius: 10, border: `1.5px solid ${COLORS.surfaceBorder}`, backgroundColor: COLORS.bg, color: COLORS.text, outline: 'none', boxSizing: 'border-box' };
  const rowStyle = { display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '8px 0', borderBottom: `1px solid ${COLORS.surfaceBorder}` };

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={cardStyle}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.gold, fontWeight: 800, marginBottom: 12 }}>⚡ INTRADAY SIGNAL (5-MIN)</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={symbolInput}
            onChange={e => setSymbolInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="e.g. RELIANCE, TCS"
            style={{ ...inputStyle, flex: 1 }}
          />
          <button onClick={handleSearch} disabled={loading} style={{
            padding: '0 20px', borderRadius: 10, border: 'none',
            backgroundColor: COLORS.gold, color: '#FFF', fontWeight: 700, cursor: 'pointer',
          }}>
            {loading ? '⏳' : '🔍'}
          </button>
        </div>
        {error && <div style={{ fontSize: 12, color: COLORS.red, marginTop: 8, fontWeight: 600 }}>{error}</div>}
      </div>

      {result && (
        <>
          <div style={{
            ...cardStyle,
            border: `2px solid ${result.signal === 'LONG' ? COLORS.green : result.signal === 'SHORT' ? COLORS.red : COLORS.surfaceBorder}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.text }}>{symbol}</div>
              <div style={{
                fontSize: 13, fontWeight: 800, padding: '5px 14px', borderRadius: 20,
                backgroundColor: result.signal === 'LONG' ? COLORS.greenLight : result.signal === 'SHORT' ? COLORS.redLight : COLORS.bg,
                color: result.signal === 'LONG' ? COLORS.green : result.signal === 'SHORT' ? COLORS.red : COLORS.muted,
              }}>
                {result.signal === 'LONG' ? '🟢 LONG' : result.signal === 'SHORT' ? '🔴 SHORT' : '⏳ WAIT'}
              </div>
            </div>

            <div style={{ fontSize: 26, fontWeight: 800, color: COLORS.text, marginBottom: 16 }}>{fmtINR(result.lastClose)}</div>

            {result.signal ? (
              <>
                {[
                  ['Entry', fmtINR(result.entry)],
                  ['Stop Loss', fmtINR(result.stopLoss)],
                  ['Target 1', fmtINR(result.targets?.[0])],
                  ['Target 2', fmtINR(result.targets?.[1])],
                  ['Target 3', fmtINR(result.targets?.[2])],
                ].map(([label, value]) => (
                  <div key={label} style={rowStyle}>
                    <span style={{ color: COLORS.muted }}>{label}</span>
                    <span style={{ fontWeight: 700, color: COLORS.text }}>{value}</span>
                  </div>
                ))}
                <div style={{ marginTop: 12, fontSize: 12, color: COLORS.gold, fontWeight: 700, backgroundColor: COLORS.goldLight, padding: '8px 12px', borderRadius: 8 }}>
                  {result.squareOffNote}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 13, color: COLORS.muted, textAlign: 'center', padding: '12px 0' }}>
                Abhi koi clear qualified signal nahi hai — market choppy hai ya trend clear nahi.
              </div>
            )}
          </div>

          <div style={cardStyle}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.muted, fontWeight: 700, marginBottom: 12 }}>📊 INDICATORS</div>
            {[
              ['Trend', result.trend],
              ['Momentum', result.momentum],
              ['Supertrend', result.supertrend],
              ['RSI', result.rsi],
              ['ADX', `${result.adx} (${result.trendStrength})`],
              ['Long Score', `${result.longScore}/100`],
              ['Short Score', `${result.shortScore}/100`],
              ["Today's High/Low", `${fmtINR(result.dayHigh)} / ${fmtINR(result.dayLow)}`],
            ].map(([label, value]) => (
              <div key={label} style={rowStyle}>
                <span style={{ color: COLORS.muted }}>{label}</span>
                <span style={{ fontWeight: 700, color: COLORS.text }}>{value}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ fontSize: 11, color: COLORS.muted, textAlign: 'center', marginTop: 8, lineHeight: 1.6 }}>
        ⚠️ Intraday trading high-risk hai — sirf technical analysis, investment advice nahi.
      </div>
    </div>
  );
}
