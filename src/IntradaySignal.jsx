import { useState, useEffect } from 'react';
import { analyzeIntraday } from './intradayAnalysis';

const COLORS = {
  bg: "#F4F6FA", surface: "#FFFFFF", surfaceBorder: "#E2E8F0",
  gold: "#C8920A", goldLight: "#FEF3C7",
  green: "#059669", greenLight: "#ECFDF5",
  red: "#DC2626", redLight: "#FEF2F2",
  text: "#0F172A", muted: "#64748B",
};

// Auto-scan ke liye ek diversified, liquid stock list — intraday mein zyada
// stocks scan karna slow hota hai (5-min data), isliye reasonable size rakha
const AUTO_SCAN_LIST = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'ICICIBANK', 'INFY', 'SBIN', 'BHARTIARTL',
  'AXISBANK', 'KOTAKBANK', 'ITC', 'LT', 'TATAMOTORS', 'BAJFINANCE', 'MARUTI',
  'HINDUNILVR', 'SUNPHARMA', 'TITAN', 'ADANIENT', 'TATASTEEL', 'HCLTECH',
];

function fmtINR(n) {
  if (n === null || n === undefined || isNaN(n)) return "—";
  return "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

async function scanOne(symbol) {
  try {
    let ySym = symbol.includes('.') ? symbol : symbol + '.NS';
    const res = await fetch(`/api/get-stock-data?symbol=${encodeURIComponent(ySym)}&range=5d&interval=5m`);
    const data = await res.json();
    if (!res.ok || !data.candles || data.candles.length < 30) return null;
    const analysis = analyzeIntraday(data.candles);
    if (analysis.error) return null;
    return { symbol, ...analysis };
  } catch {
    return null;
  }
}

export default function IntradaySignal() {
  const [autoResults, setAutoResults] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [scanDone, setScanDone] = useState(false);

  const [symbolInput, setSymbolInput] = useState('');
  const [customLoading, setCustomLoading] = useState(false);
  const [customError, setCustomError] = useState('');
  const [customResult, setCustomResult] = useState(null);

  const runAutoScan = async () => {
    setScanning(true);
    setScanDone(false);
    setAutoResults([]);
    setProgress(0);
    const batchSize = 5;
    const all = [];
    for (let i = 0; i < AUTO_SCAN_LIST.length; i += batchSize) {
      const batch = AUTO_SCAN_LIST.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(scanOne));
      all.push(...batchResults.filter(Boolean));
      setProgress(Math.min(i + batchSize, AUTO_SCAN_LIST.length));
      setAutoResults([...all].sort((a, b) => {
        if (!!b.signal !== !!a.signal) return (b.signal ? 1 : 0) - (a.signal ? 1 : 0);
        return 0;
      }));
    }
    setScanning(false);
    setScanDone(true);
  };

  useEffect(() => { runAutoScan(); }, []);

  const handleCustomSearch = async () => {
    const sym = symbolInput.trim().toUpperCase();
    if (!sym) return;
    setCustomLoading(true);
    setCustomError('');
    setCustomResult(null);
    const result = await scanOne(sym);
    if (result) setCustomResult(result);
    else setCustomError('Intraday data nahi mila — symbol check karo ya market hours mein try karo');
    setCustomLoading(false);
  };

  const cardStyle = { backgroundColor: COLORS.surface, border: `1px solid ${COLORS.surfaceBorder}`, borderRadius: 16, padding: 18, marginBottom: 16 };
  const inputStyle = { width: '100%', padding: '11px 14px', fontSize: 14, borderRadius: 10, border: `1.5px solid ${COLORS.surfaceBorder}`, backgroundColor: COLORS.bg, color: COLORS.text, outline: 'none', boxSizing: 'border-box' };
  const rowStyle = { display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '8px 0', borderBottom: `1px solid ${COLORS.surfaceBorder}` };

  const signalCount = autoResults.filter(r => r.signal).length;

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Auto Scan */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.gold, fontWeight: 800 }}>⚡ AUTO SCAN — INTRADAY (5-MIN)</div>
          <button onClick={runAutoScan} disabled={scanning} style={{
            fontSize: 11, fontWeight: 700, color: COLORS.gold, background: 'none',
            border: `1.5px solid ${COLORS.gold}`, borderRadius: 20, padding: '4px 12px', cursor: 'pointer',
          }}>
            {scanning ? '⏳' : '🔄 Refresh'}
          </button>
        </div>

        {scanning && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ height: 6, backgroundColor: COLORS.surfaceBorder, borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', backgroundColor: COLORS.gold, borderRadius: 99, width: `${(progress / AUTO_SCAN_LIST.length) * 100}%`, transition: 'width 0.4s ease' }} />
            </div>
            <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 6, textAlign: 'center' }}>
              {progress}/{AUTO_SCAN_LIST.length} stocks scan ho gaye...
            </div>
          </div>
        )}

        {scanDone && (
          <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 12 }}>
            {signalCount > 0 ? (
              <><span style={{ color: COLORS.green, fontWeight: 700 }}>{signalCount} stock{signalCount !== 1 ? 's' : ''}</span> mein qualified signal mila</>
            ) : (
              'Abhi koi qualified signal nahi — market choppy hai ya trend clear nahi'
            )}
          </div>
        )}

        {autoResults.map(r => (
          <div key={r.symbol} style={{
            padding: '12px 0', borderBottom: `1px solid ${COLORS.surfaceBorder}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.text }}>{r.symbol}</div>
              <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>{fmtINR(r.lastClose)} • RSI {r.rsi} • ADX {r.adx}</div>
            </div>
            <div style={{
              fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 20,
              backgroundColor: r.signal === 'LONG' ? COLORS.greenLight : r.signal === 'SHORT' ? COLORS.redLight : COLORS.bg,
              color: r.signal === 'LONG' ? COLORS.green : r.signal === 'SHORT' ? COLORS.red : COLORS.muted,
            }}>
              {r.signal === 'LONG' ? '🟢 LONG' : r.signal === 'SHORT' ? '🔴 SHORT' : '⏳ WAIT'}
            </div>
          </div>
        ))}
      </div>

      {/* Custom search */}
      <div style={cardStyle}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.gold, fontWeight: 800, marginBottom: 12 }}>🔍 CUSTOM STOCK SEARCH</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={symbolInput}
            onChange={e => setSymbolInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCustomSearch()}
            placeholder="e.g. TATASTEEL, WIPRO"
            style={{ ...inputStyle, flex: 1 }}
          />
          <button onClick={handleCustomSearch} disabled={customLoading} style={{
            padding: '0 20px', borderRadius: 10, border: 'none',
            backgroundColor: COLORS.gold, color: '#FFF', fontWeight: 700, cursor: 'pointer',
          }}>
            {customLoading ? '⏳' : '🔍'}
          </button>
        </div>
        {customError && <div style={{ fontSize: 12, color: COLORS.red, marginTop: 8, fontWeight: 600 }}>{customError}</div>}
      </div>

      {customResult && (
        <>
          <div style={{
            ...cardStyle,
            border: `2px solid ${customResult.signal === 'LONG' ? COLORS.green : customResult.signal === 'SHORT' ? COLORS.red : COLORS.surfaceBorder}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.text }}>{customResult.symbol}</div>
              <div style={{
                fontSize: 13, fontWeight: 800, padding: '5px 14px', borderRadius: 20,
                backgroundColor: customResult.signal === 'LONG' ? COLORS.greenLight : customResult.signal === 'SHORT' ? COLORS.redLight : COLORS.bg,
                color: customResult.signal === 'LONG' ? COLORS.green : customResult.signal === 'SHORT' ? COLORS.red : COLORS.muted,
              }}>
                {customResult.signal === 'LONG' ? '🟢 LONG' : customResult.signal === 'SHORT' ? '🔴 SHORT' : '⏳ WAIT'}
              </div>
            </div>

            <div style={{ fontSize: 26, fontWeight: 800, color: COLORS.text, marginBottom: 16 }}>{fmtINR(customResult.lastClose)}</div>

            {customResult.signal ? (
              <>
                {[
                  ['Entry', fmtINR(customResult.entry)],
                  ['Stop Loss', fmtINR(customResult.stopLoss)],
                  ['Target 1', fmtINR(customResult.targets?.[0])],
                  ['Target 2', fmtINR(customResult.targets?.[1])],
                  ['Target 3', fmtINR(customResult.targets?.[2])],
                ].map(([label, value]) => (
                  <div key={label} style={rowStyle}>
                    <span style={{ color: COLORS.muted }}>{label}</span>
                    <span style={{ fontWeight: 700, color: COLORS.text }}>{value}</span>
                  </div>
                ))}
                <div style={{ marginTop: 12, fontSize: 12, color: COLORS.gold, fontWeight: 700, backgroundColor: COLORS.goldLight, padding: '8px 12px', borderRadius: 8 }}>
                  {customResult.squareOffNote}
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
              ['Trend', customResult.trend],
              ['Momentum', customResult.momentum],
              ['Supertrend', customResult.supertrend],
              ['RSI', customResult.rsi],
              ['ADX', `${customResult.adx} (${customResult.trendStrength})`],
              ['Long Score', `${customResult.longScore}/100`],
              ['Short Score', `${customResult.shortScore}/100`],
              ["Today's High/Low", `${fmtINR(customResult.dayHigh)} / ${fmtINR(customResult.dayLow)}`],
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

