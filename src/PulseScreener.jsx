import { useState } from 'react';
import { analyzeStock } from './technicalAnalysis';

const NIFTY20 = [
  'RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK',
  'SBIN', 'TATAMOTORS', 'ITC', 'WIPRO', 'AXISBANK',
  'KOTAKBANK', 'LT', 'SUNPHARMA', 'BAJFINANCE', 'MARUTI',
  'ULTRACEMCO', 'TITAN', 'NESTLEIND', 'POWERGRID', 'ONGC',
];

const DARK_C = {
  bg: '#0D1117', surface: '#161B22', border: '#30363D',
  text: '#E8E6E0', muted: '#8B92A0', gold: '#D8A33D',
  green: '#3FAE7C', red: '#F87171', greenBg: '#0D2B1F', redBg: '#2D1515',
};
const LIGHT_C = {
  bg: '#F4F6FA', surface: '#FFFFFF', border: '#E2E8F0',
  text: '#0F172A', muted: '#64748B', gold: '#C8920A',
  green: '#059669', red: '#DC2626', greenBg: '#ECFDF5', redBg: '#FEF2F2',
};

const ASTRO = {
  0: { day: "Raviwar", planet: "☀️ Surya", vibe: "Leadership energy — large cap stocks dekho", sectors: "Energy, Govt PSU", color: "#F59E0B", caution: false },
  1: { day: "Somwar", planet: "🌙 Chandra", vibe: "Calm market expected — FMCG aur Pharma best", sectors: "FMCG, Pharma, Healthcare", color: "#94A3B8", caution: false },
  2: { day: "Mangalwar", planet: "🔴 Mangal", vibe: "High energy — Defense aur Infra strong", sectors: "Defense, Infrastructure, Steel", color: "#EF4444", caution: false },
  3: { day: "Budhwar", planet: "💚 Budh", vibe: "IT aur Communication best din hai aaj", sectors: "IT, Telecom, Media", color: "#10B981", caution: false },
  4: { day: "Guruwar", planet: "🟡 Guru", vibe: "Jupiter ka ashirwad — Banking aur Finance", sectors: "Banking, Finance, Gold", color: "#F59E0B", caution: false },
  5: { day: "Shukrawar", planet: "✨ Shukra", vibe: "Luxury aur Auto stocks shine karenge", sectors: "Auto, Luxury, Consumer", color: "#EC4899", caution: false },
  6: { day: "Shaniwar", planet: "⚫ Shani", vibe: "Shani ki nazar — cautious raho aaj", sectors: "Avoid risky trades", color: "#6B7280", caution: true },
};

const FESTIVALS = {
  "2025-10-18": { name: "Dhanteras", msg: "🪔 Dhanteras Mubarak! Gold aur Silver stocks pe nazar rakho!", special: true },
  "2025-10-20": { name: "Diwali Muhurat", msg: "🎆 Muhurat Trading! Aaj ka pehla trade shubh hoga!", special: true },
  "2026-03-14": { name: "Holi", msg: "🎨 Holi hai! Market thoda volatile ho sakta hai!", special: false },
  "2026-01-14": { name: "Makar Sankranti", msg: "🪁 Makar Sankranti! Naye quarter ki shuruat — fresh positions lo!", special: false },
};

function getAstroData() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const dateStr = today.toISOString().split('T')[0];
  const festival = FESTIVALS[dateStr] || null;
  return { ...ASTRO[dayOfWeek], festival };
}

function AstroCard() {
  const [showAstro, setShowAstro] = useState(true);
  const astro = getAstroData();
  if (!showAstro) return null;

  return (
    <div style={{
      background: `linear-gradient(135deg, #0D1117 0%, ${astro.color}22 100%)`,
      border: `1.5px solid ${astro.color}`,
      borderRadius: 16, padding: 16, marginBottom: 16,
      boxShadow: `0 4px 20px ${astro.color}22`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: astro.color, fontWeight: 800 }}>
          🪐 PULSE ASTRO
        </div>
        <button onClick={() => setShowAstro(false)} style={{ background: 'none', border: 'none', color: '#6E7681', cursor: 'pointer', fontSize: 14 }}>✕</button>
      </div>

      {astro.festival && (
        <div style={{
          backgroundColor: astro.festival.special ? '#7C3AED22' : '#065F4622',
          border: `1px solid ${astro.festival.special ? '#7C3AED' : '#059669'}`,
          borderRadius: 8, padding: '8px 12px', marginBottom: 10,
          fontSize: 12, color: astro.festival.special ? '#A78BFA' : '#3FAE7C', fontWeight: 700,
        }}>
          {astro.festival.msg}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{ fontSize: 32 }}>{astro.planet.split(' ')[0]}</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#E8E6E0' }}>
            Aaj {astro.day} hai
          </div>
          <div style={{ fontSize: 12, color: astro.color, fontWeight: 600, marginTop: 2 }}>
            {astro.vibe}
          </div>
        </div>
      </div>

      <div style={{
        backgroundColor: astro.caution ? '#2D151522' : '#0D2B1F',
        borderRadius: 8, padding: '8px 12px',
        fontSize: 12,
        color: astro.caution ? '#F87171' : '#3FAE7C',
        fontWeight: 600,
      }}>
        {astro.caution ? '⚠️ Aaj cautious raho — SL tight rakho!' : `💡 Focus sectors: ${astro.sectors}`}
      </div>
    </div>
  );
}

export default function PulseScreener({ isDark }) {
  const C = isDark ? DARK_C : LIGHT_C;
  const [results, setResults] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [filter, setFilter] = useState('all');
  const [customInput, setCustomInput] = useState('');
  const [customLoading, setCustomLoading] = useState(false);
  const [customResult, setCustomResult] = useState(null);
  const [customError, setCustomError] = useState('');
  const [scanDone, setScanDone] = useState(false);

  const scanStock = async (symbol) => {
    try {
      const res = await fetch(`/api/get-stock-data?symbol=${symbol}.NS&range=1y`);
      const data = await res.json();
      if (!res.ok || !data.candles || data.candles.length < 50) return null;
      const analysis = analyzeStock(data.candles);
      if (analysis.error) return null;
      return {
        symbol,
        trend: analysis.trend,
        longScore: analysis.longScore,
        shortScore: analysis.shortScore,
        rsi: analysis.rsi,
        adx: analysis.adx,
        trendStrength: analysis.trendStrength,
        price: data.stockInfo?.regularMarketPrice || analysis.lastClose,
        change: data.stockInfo?.regularMarketChangePercent || 0,
      };
    } catch { return null; }
  };

  const runScreener = async () => {
    setScanning(true);
    setResults([]);
    setScanDone(false);
    setProgress(0);
    setTotalCount(NIFTY20.length);

    const batchSize = 5;
    const allResults = [];

    for (let i = 0; i < NIFTY20.length; i += batchSize) {
      const batch = NIFTY20.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(scanStock));
      const valid = batchResults.filter(Boolean);
      allResults.push(...valid);
      setProgress(Math.min(i + batchSize, NIFTY20.length));
      setResults([...allResults].sort((a, b) => b.longScore - a.longScore));
    }

    setScanning(false);
    setScanDone(true);
  };

  const runCustomSearch = async () => {
    const sym = customInput.trim().toUpperCase();
    if (!sym) return;
    setCustomLoading(true);
    setCustomResult(null);
    setCustomError('');
    const result = await scanStock(sym);
    if (result) setCustomResult(result);
    else setCustomError('Stock nahi mila — symbol check karo!');
    setCustomLoading(false);
  };

  const filteredResults = results.filter(r => {
    if (filter === 'bullish') return r.trend === 'Bullish';
    if (filter === 'bearish') return r.trend === 'Bearish';
    if (filter === 'strong') return r.adx >= 25;
    return true;
  });

  const cardStyle = {
    backgroundColor: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 16, padding: 18, marginBottom: 12,
    boxShadow: isDark ? '0 2px 16px rgba(0,0,0,0.4)' : '0 1px 6px rgba(0,0,0,0.05)',
  };

  return (
    <div style={{ backgroundColor: C.bg, minHeight: '100vh', padding: '16px 16px 100px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>

        {/* TITLE */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: C.text }}>
            🔍 Pulse<span style={{ color: C.gold }}>Screener</span>
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
            Top stocks dhundo — ek tap mein!
          </div>
        </div>

        {/* ASTRO CARD */}
        <AstroCard />

        {/* CUSTOM SEARCH */}
        <div style={cardStyle}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: C.gold, fontWeight: 800, marginBottom: 12 }}>
            🔎 CUSTOM STOCK SEARCH
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={customInput}
              onChange={e => setCustomInput(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && runCustomSearch()}
              placeholder="e.g. TATASTEEL, ADANIENT"
              style={{
                flex: 1, padding: '10px 14px', fontSize: 14,
                backgroundColor: C.bg, border: `1.5px solid ${C.border}`,
                borderRadius: 10, color: C.text, outline: 'none',
                fontFamily: 'Inter, sans-serif',
              }}
            />
            <button onClick={runCustomSearch} disabled={customLoading} style={{
              padding: '10px 16px', borderRadius: 10, border: 'none',
              backgroundColor: C.gold, color: '#FFF',
              fontWeight: 700, fontSize: 13, cursor: 'pointer',
              opacity: customLoading ? 0.7 : 1,
            }}>
              {customLoading ? '⏳' : '🔍'}
            </button>
          </div>

          {customError && (
            <div style={{ fontSize: 12, color: C.red, marginTop: 8, fontWeight: 600 }}>{customError}</div>
          )}

          {customResult && (
            <div style={{
              marginTop: 12, padding: 14, borderRadius: 12,
              backgroundColor: customResult.trend === 'Bullish' ? C.greenBg : C.redBg,
              border: `1.5px solid ${customResult.trend === 'Bullish' ? C.green : C.red}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{customResult.symbol}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>₹{Number(customResult.price).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                </div>
                <div style={{
                  fontSize: 12, fontWeight: 800, padding: '5px 12px', borderRadius: 20,
                  backgroundColor: customResult.trend === 'Bullish' ? C.green : C.red,
                  color: '#FFF',
                }}>
                  {customResult.trend === 'Bullish' ? '🟢 BULLISH' : '🔴 BEARISH'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  ['⚡ Score', customResult.trend === 'Bullish' ? customResult.longScore : customResult.shortScore],
                  ['📊 RSI', customResult.rsi],
                  ['💪 ADX', customResult.adx],
                ].map(([label, val]) => (
                  <div key={label} style={{ flex: 1, backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.6)', borderRadius: 8, padding: '8px 6px', textAlign: 'center' }}>
                    <div style={{ fontSize: 9, color: C.muted, fontWeight: 600 }}>{label}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: customResult.trend === 'Bullish' ? C.green : C.red, marginTop: 2 }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* AUTO SCREENER */}
        <div style={cardStyle}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: C.gold, fontWeight: 800, marginBottom: 12 }}>
            🚀 AUTO SCREENER — NIFTY TOP 20
          </div>

          <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
            {[['all', '📊 Sab'], ['bullish', '🟢 Bullish'], ['bearish', '🔴 Bearish'], ['strong', '💪 Strong']].map(([key, label]) => (
              <button key={key} onClick={() => setFilter(key)} style={{
                padding: '6px 12px', borderRadius: 20,
                backgroundColor: filter === key ? C.gold : C.bg,
                color: filter === key ? '#FFF' : C.muted,
                fontSize: 11, fontWeight: 700, cursor: 'pointer',
                border: `1.5px solid ${filter === key ? C.gold : C.border}`,
              }}>{label}</button>
            ))}
          </div>

          <button onClick={runScreener} disabled={scanning} style={{
            width: '100%', padding: '14px',
            backgroundColor: scanning ? C.border : C.gold,
            color: scanning ? C.muted : '#FFF',
            border: 'none', borderRadius: 12,
            fontSize: 15, fontWeight: 800, cursor: scanning ? 'not-allowed' : 'pointer',
            boxShadow: scanning ? 'none' : '0 4px 20px rgba(200,146,10,0.3)',
            marginBottom: 14,
          }}>
            {scanning ? `⏳ Scanning... ${progress}/${totalCount}` : '🚀 Top Stocks Nikalo!'}
          </button>

          {scanning && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ height: 6, backgroundColor: C.border, borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 99,
                  backgroundColor: C.gold,
                  width: `${(progress / totalCount) * 100}%`,
                  transition: 'width 0.5s ease',
                }} />
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 6, textAlign: 'center' }}>
                {progress} stocks check ho gaye — {totalCount - progress} baaki hain...
              </div>
            </div>
          )}

          {filteredResults.length > 0 && (
            <>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 10, fontWeight: 600 }}>
                {scanDone ? `✅ Scan complete — ` : '🔄 Scanning — '}
                <span style={{ color: C.green, fontWeight: 700 }}>{filteredResults.filter(r => r.trend === 'Bullish').length} Bullish</span>
                {' • '}
                <span style={{ color: C.red, fontWeight: 700 }}>{filteredResults.filter(r => r.trend === 'Bearish').length} Bearish</span>
              </div>

              {filteredResults.map((stock, i) => (
                <div key={stock.symbol} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: i < filteredResults.length - 1 ? `1px solid ${C.border}` : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      backgroundColor: stock.trend === 'Bullish' ? C.greenBg : C.redBg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 800,
                      color: stock.trend === 'Bullish' ? C.green : C.red,
                    }}>{i + 1}</div>
                    <div>
                      <div style={{ fontWeight: 800, color: C.text, fontSize: 14 }}>{stock.symbol}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
                        ₹{Number(stock.price).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        {' • '}
                        <span style={{ color: stock.change >= 0 ? C.green : C.red }}>
                          {stock.change >= 0 ? '▲' : '▼'} {Math.abs(stock.change).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                      backgroundColor: stock.trend === 'Bullish' ? C.greenBg : C.redBg,
                      color: stock.trend === 'Bullish' ? C.green : C.red,
                    }}>
                      {stock.trend === 'Bullish' ? '🟢' : '🔴'} {stock.trend === 'Bullish' ? stock.longScore : stock.shortScore}
                    </div>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>
                      ADX {stock.adx} • {stock.trendStrength}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {scanDone && filteredResults.length === 0 && (
            <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 13, color: C.muted }}>
              Is filter mein koi stock nahi mila!
            </div>
          )}
        </div>

        <div style={{ fontSize: 11, color: C.muted, textAlign: 'center', marginTop: 8, lineHeight: 1.6 }}>
          ⚠️ Sirf technical analysis — investment advice nahi. SEBI registered advisor se salah lein.
        </div>
      </div>
    </div>
  );
}
