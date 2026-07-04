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

function getLifePath(dob) {
  if (!dob) return null;
  const digits = dob.replace(/-/g, '').split('').map(Number);
  let sum = digits.reduce((a, b) => a + b, 0);
  while (sum > 9 && sum !== 11 && sum !== 22) {
    sum = String(sum).split('').map(Number).reduce((a, b) => a + b, 0);
  }
  return sum;
}

function getChaldean(name) {
  if (!name) return null;
  const map = { a:1,i:1,j:1,q:1,y:1, b:2,k:2,r:2, c:3,g:3,l:3,s:3, d:4,m:4,t:4, e:5,h:5,n:5,x:5, u:6,v:6,w:6, o:7,z:7, f:8,p:8 };
  let sum = name.toLowerCase().replace(/[^a-z]/g, '').split('').reduce((a, c) => a + (map[c] || 0), 0);
  while (sum > 9) sum = String(sum).split('').map(Number).reduce((a, b) => a + b, 0);
  return sum;
}

const NUM_TRAITS = {
  1: { trait: 'The Leader', desc: 'Tu naturally bold trades leta hai — trend follow kar!', lucky: ['RELIANCE', 'TATAMOTORS', 'LT'], color: '#F59E0B' },
  2: { trait: 'The Diplomat', desc: 'Patient trader hai tu — swing trades teri strength!', lucky: ['HDFCBANK', 'ICICIBANK', 'KOTAKBANK'], color: '#94A3B8' },
  3: { trait: 'The Creative', desc: 'Intuition strong hai — IT aur Media sectors dekh!', lucky: ['TCS', 'INFY', 'WIPRO'], color: '#10B981' },
  4: { trait: 'The Builder', desc: 'Methodical trader — Infra aur PSU teri category!', lucky: ['LT', 'POWERGRID', 'ONGC'], color: '#6B7280' },
  5: { trait: 'The Explorer', desc: 'High risk taker — volatile stocks mein tera maza!', lucky: ['TATAMOTORS', 'BAJFINANCE', 'TITAN'], color: '#EF4444' },
  6: { trait: 'The Nurturer', desc: 'FMCG aur Pharma tera safe zone hai!', lucky: ['ITC', 'NESTLEIND', 'SUNPHARMA'], color: '#EC4899' },
  7: { trait: 'The Analyst', desc: 'Deep research karta hai — fundamentally strong stocks!', lucky: ['TCS', 'INFY', 'KOTAKBANK'], color: '#7C3AED' },
  8: { trait: 'The Powerhouse', desc: 'Big capital, big moves — blue chip tera style!', lucky: ['RELIANCE', 'HDFCBANK', 'SBIN'], color: '#D8A33D' },
  9: { trait: 'The Visionary', desc: 'Long term sochta hai — diversified portfolio best!', lucky: ['RELIANCE', 'TCS', 'MARUTI'], color: '#3FAE7C' },
  11: { trait: 'The Intuitive', desc: 'Master number — market sense bahut strong!', lucky: ['TCS', 'INFY', 'TITAN'], color: '#A78BFA' },
  22: { trait: 'The Master Builder', desc: 'Master number — systematic trading karke bada ban!', lucky: ['LT', 'RELIANCE', 'POWERGRID'], color: '#F59E0B' },
};

function getAstroData() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  return { ...ASTRO[dayOfWeek] };
}

// ✅ RANKING SCORE — combines technical score + ADX strength + RSI sweet-spot + numerology match
// Ye function decide karta hai ki 20 mein se konse 10 stocks "Top Recommended" honge
function getRankScore(r) {
  let score = r.trend === 'Bullish' ? r.longScore : r.shortScore;
  if (r.adx >= 25) score += 10; // strong trend bonus
  if (r.rsi >= 40 && r.rsi <= 65) score += 5; // healthy RSI zone, na overbought na oversold
  if (r.isLucky) score += 15; // numerology match bonus
  if (r.trend === 'Bearish') score -= 8; // bearish setups thoda niche rank honge by default
  return score;
}

function NumerologyBanner({ userDob, userName, C }) {
  const lifePath = getLifePath(userDob);
  const nameNum = getChaldean(userName);
  const num = lifePath || nameNum;
  if (!num) return null;
  const data = NUM_TRAITS[num] || NUM_TRAITS[1];

  return (
    <div style={{
      background: `linear-gradient(135deg, ${data.color}22 0%, ${C.surface} 100%)`,
      border: `1.5px solid ${data.color}`,
      borderRadius: 16, padding: 16, marginBottom: 16,
      boxShadow: `0 4px 20px ${data.color}22`,
    }}>
      <div style={{ fontSize: 10, letterSpacing: 2, color: data.color, fontWeight: 800, marginBottom: 10 }}>
        🔢 TERA NUMEROLOGY TRADER TYPE
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
          background: `linear-gradient(135deg, ${data.color}, ${data.color}88)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, fontWeight: 900, color: '#0D1117',
        }}>{num}</div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{data.trait}</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Life Path Number {num}</div>
        </div>
      </div>
      <div style={{
        fontSize: 12, color: C.text, lineHeight: 1.6, marginBottom: 12,
        padding: '8px 12px', backgroundColor: `${data.color}11`,
        borderRadius: 8, borderLeft: `3px solid ${data.color}`,
      }}>
        {data.desc}
      </div>
      <div style={{ fontSize: 10, letterSpacing: 1, color: data.color, fontWeight: 700, marginBottom: 6 }}>
        🍀 TERE LUCKY STOCKS:
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {data.lucky.map(s => (
          <span key={s} style={{
            fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
            backgroundColor: `${data.color}22`, color: data.color,
            border: `1px solid ${data.color}44`,
          }}>{s}</span>
        ))}
      </div>
    </div>
  );
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
        <div style={{ fontSize: 10, letterSpacing: 2, color: astro.color, fontWeight: 800 }}>🪐 PULSE ASTRO</div>
        <button onClick={() => setShowAstro(false)} style={{ background: 'none', border: 'none', color: '#6E7681', cursor: 'pointer', fontSize: 14 }}>✕</button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{ fontSize: 32 }}>{astro.planet.split(' ')[0]}</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#E8E6E0' }}>Aaj {astro.day} hai</div>
          <div style={{ fontSize: 12, color: astro.color, fontWeight: 600, marginTop: 2 }}>{astro.vibe}</div>
        </div>
      </div>
      <div style={{
        backgroundColor: astro.caution ? '#2D151522' : '#0D2B1F',
        borderRadius: 8, padding: '8px 12px',
        fontSize: 12, color: astro.caution ? '#F87171' : '#3FAE7C', fontWeight: 600,
      }}>
        {astro.caution ? '⚠️ Aaj cautious raho — SL tight rakho!' : `💡 Focus sectors: ${astro.sectors}`}
      </div>
    </div>
  );
}

export default function PulseScreener({ isDark, userDob, userName }) {
  const C = isDark ? DARK_C : LIGHT_C;
  const [results, setResults] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [filter, setFilter] = useState('top10');
  const [customInput, setCustomInput] = useState('');
  const [customLoading, setCustomLoading] = useState(false);
  const [customResult, setCustomResult] = useState(null);
  const [customError, setCustomError] = useState('');
  const [scanDone, setScanDone] = useState(false);

  const lifePath = getLifePath(userDob);
  const luckyStocks = lifePath ? (NUM_TRAITS[lifePath]?.lucky || []) : [];

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
        isLucky: luckyStocks.includes(symbol),
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
      setResults([...allResults].sort((a, b) => getRankScore(b) - getRankScore(a)));
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

  // ✅ TOP 10 RECOMMENDED — 20 stocks mein se best rank score wale 10
  const topPickSymbols = new Set(
    [...results].sort((a, b) => getRankScore(b) - getRankScore(a)).slice(0, 10).map(r => r.symbol)
  );

  const filteredResults = results.filter(r => {
    if (filter === 'top10') return topPickSymbols.has(r.symbol);
    if (filter === 'bullish') return r.trend === 'Bullish';
    if (filter === 'bearish') return r.trend === 'Bearish';
    if (filter === 'strong') return r.adx >= 25;
    if (filter === 'lucky') return r.isLucky;
    return true;
  }).sort((a, b) => getRankScore(b) - getRankScore(a));

  const luckyResult = scanDone ? filteredResults.find(r => r.isLucky && r.trend === 'Bullish') : null;

  const cardStyle = {
    backgroundColor: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 16, padding: 18, marginBottom: 12,
    boxShadow: isDark ? '0 2px 16px rgba(0,0,0,0.4)' : '0 1px 6px rgba(0,0,0,0.05)',
  };

  return (
    <div style={{ backgroundColor: C.bg, minHeight: '100vh', padding: '16px 16px 100px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: C.text }}>
            🔍 Pulse<span style={{ color: C.gold }}>Screener</span>
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Top stocks dhundo — ek tap mein!</div>
        </div>

        <NumerologyBanner userDob={userDob} userName={userName} C={C} />

        <AstroCard />

        <div style={cardStyle}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: C.gold, fontWeight: 800, marginBottom: 12 }}>🔎 CUSTOM STOCK SEARCH</div>
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
          {customError && <div style={{ fontSize: 12, color: C.red, marginTop: 8, fontWeight: 600 }}>{customError}</div>}
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
                  backgroundColor: customResult.trend === 'Bullish' ? C.green : C.red, color: '#FFF',
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
              {customResult.isLucky && (
                <div style={{ marginTop: 10, fontSize: 12, fontWeight: 700, color: '#D8A33D', textAlign: 'center', padding: '6px', backgroundColor: '#D8A33D22', borderRadius: 8 }}>
                  🍀 Yeh tera Lucky Stock hai!
                </div>
              )}
            </div>
          )}
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: C.gold, fontWeight: 800, marginBottom: 12 }}>🚀 AUTO SCREENER — NIFTY TOP 20</div>

          {scanDone && (
            <div style={{
              marginBottom: 14, padding: '10px 14px', borderRadius: 10,
              backgroundColor: `${C.gold}14`, border: `1px solid ${C.gold}44`,
              fontSize: 12, color: C.text, lineHeight: 1.6,
            }}>
              🏆 <strong style={{ color: C.gold }}>20 stocks scan ho gaye</strong> — inme se best <strong style={{ color: C.gold }}>Top 10</strong> automatically rank kiye gaye hain (Technical Score + Trend Strength + Numerology combine karke). "🏆 Top 10" filter se dekho.
            </div>
          )}

          <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
            {[['top10', '🏆 Top 10'], ['all', '📊 Sab 20'], ['bullish', '🟢 Bullish'], ['bearish', '🔴 Bearish'], ['strong', '💪 Strong'], ['lucky', '🍀 Lucky']].map(([key, label]) => (
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
                  height: '100%', borderRadius: 99, backgroundColor: C.gold,
                  width: `${(progress / totalCount) * 100}%`,
                  transition: 'width 0.5s ease',
                }} />
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 6, textAlign: 'center' }}>
                {progress} stocks check ho gaye — {totalCount - progress} baaki hain...
              </div>
            </div>
          )}

          {luckyResult && (
            <div style={{
              marginBottom: 14, padding: 14, borderRadius: 12,
              background: 'linear-gradient(135deg, #D8A33D22, #D8A33D11)',
              border: '1.5px solid #D8A33D',
            }}>
              <div style={{ fontSize: 10, letterSpacing: 2, color: '#D8A33D', fontWeight: 800, marginBottom: 8 }}>🍀 TERA LUCKY STOCK AAJ</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: C.text }}>{luckyResult.symbol}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>Numerology match + Bullish trend!</div>
                </div>
                <div style={{
                  fontSize: 14, fontWeight: 800, color: '#D8A33D',
                  backgroundColor: '#D8A33D22', padding: '6px 14px', borderRadius: 20,
                }}>
                  ⚡ {luckyResult.longScore}/100
                </div>
              </div>
            </div>
          )}

          {filteredResults.length > 0 && (
            <>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 10, fontWeight: 600 }}>
                {scanDone ? '✅ Scan complete — ' : '🔄 Scanning — '}
                <span style={{ color: C.green, fontWeight: 700 }}>{filteredResults.filter(r => r.trend === 'Bullish').length} Bullish</span>
                {' • '}
                <span style={{ color: C.red, fontWeight: 700 }}>{filteredResults.filter(r => r.trend === 'Bearish').length} Bearish</span>
              </div>

              {filteredResults.map((stock, i) => {
                const isTopPick = topPickSymbols.has(stock.symbol);
                return (
                  <div key={stock.symbol} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 10px',
                    marginBottom: 4,
                    borderBottom: i < filteredResults.length - 1 ? `1px solid ${C.border}` : 'none',
                    backgroundColor: stock.isLucky ? '#D8A33D08' : isTopPick ? `${C.gold}08` : 'transparent',
                    borderRadius: 8,
                    border: isTopPick ? `1px solid ${C.gold}33` : 'none',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 8,
                        backgroundColor: stock.isLucky ? '#D8A33D22' : stock.trend === 'Bullish' ? C.greenBg : C.redBg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 800,
                        color: stock.isLucky ? '#D8A33D' : stock.trend === 'Bullish' ? C.green : C.red,
                      }}>{stock.isLucky ? '🍀' : i + 1}</div>
                      <div>
                        <div style={{ fontWeight: 800, color: C.text, fontSize: 14, display: 'flex', alignItems: 'center', gap: 4 }}>
                          {stock.symbol}
                          {isTopPick && <span style={{ fontSize: 10, color: C.gold, fontWeight: 700 }}>🏆</span>}
                          {stock.isLucky && <span style={{ fontSize: 10, color: '#D8A33D', fontWeight: 700 }}>Lucky ⭐</span>}
                        </div>
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
                );
              })}
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
