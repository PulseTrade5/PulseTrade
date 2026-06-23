import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import { analyzeStock } from './technicalAnalysis';
import SubscribeButton from './SubscribeButton';
import PulseBoltaHai from '../PulseBoltaHai';

const COLORS = {
  bg: "#21262D",       // ✅ Slate Dark (was #0D1117)
  surface: "#282E35",  // ✅ Cards slightly lighter than bg
  surfaceBorder: "#30363D",
  gold: "#D8A33D", goldDim: "#9C7A33",
  green: "#3FAE7C", red: "#D1453B", text: "#E8E6E0", muted: "#8B92A0",
};

const POPULAR = ["RELIANCE", "TCS", "INFY", "HDFCBANK", "TATAMOTORS", "SBIN", "ICICIBANK", "ITC"];
const TIERS = [3, 6, 10];

function fmtINR(n) {
  if (n === null || n === undefined || isNaN(n)) return "—";
  return "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function fmtCr(n) {
  if (!n) return "—";
  const cr = n / 1e7;
  if (cr >= 1e5) return `₹${(cr/1e5).toFixed(2)} L Cr`;
  if (cr >= 1e3) return `₹${(cr/1e3).toFixed(2)}K Cr`;
  return `₹${cr.toFixed(0)} Cr`;
}

function fmtVol(n) {
  if (!n) return "—";
  if (n >= 1e7) return `${(n/1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `${(n/1e5).toFixed(2)} L`;
  return n.toLocaleString('en-IN');
}

// ✅ IMPROVED SEBI BANNER
function SEBIBanner() {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #1a0e00, #2d1a00)',
      border: '1px solid #D8A33D',
      borderLeft: '5px solid #FFD700',
      borderRadius: 12,
      padding: '14px 16px',
      marginBottom: 20,
      boxShadow: '0 0 16px rgba(216,163,61,0.12)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 18 }}>⚖️</span>
        <span style={{ color: '#FFD700', fontWeight: 800, fontSize: 12, letterSpacing: '1.5px' }}>
          SEBI COMPLIANCE NOTICE
        </span>
      </div>
      <p style={{ color: '#f0d080', fontSize: 12, margin: '0 0 6px 0', lineHeight: 1.6 }}>
        PulseTrade sirf{' '}
        <strong style={{ color: '#FFD700' }}>technical analysis indicators</strong>{' '}
        provide karta hai. Yeh koi{' '}
        <strong style={{ color: '#FF6B6B' }}>investment advice, stock recommendation ya buy/sell signal nahi hai.</strong>
      </p>
      <p style={{ color: '#999', fontSize: 11, margin: 0, lineHeight: 1.6, borderTop: '1px solid rgba(216,163,61,0.2)', paddingTop: 6 }}>
        ⚠️ Koi bhi financial decision lene se pehle apne{' '}
        <strong style={{ color: '#FFD700' }}>SEBI registered investment advisor</strong>{' '}
        se salah zaroor lein. Past performance future returns ki guarantee nahi hai.
      </p>
    </div>
  );
}

function TrendMeter({ longScore, shortScore, trend }) {
  const score = trend === 'Bullish' ? longScore : shortScore;
  const isBullish = trend === 'Bullish';
  const color = isBullish ? '#3FAE7C' : '#D1453B';
  const [animScore, setAnimScore] = useState(0);
  const [animPct, setAnimPct] = useState(0);
  const [showGlow, setShowGlow] = useState(false);
  const animRef = useRef(null);

  useEffect(() => {
    setAnimScore(0);
    setAnimPct(0);
    setShowGlow(false);
    let start = null;
    const duration = 1500;
    const target = Math.min(100, Math.max(0, score));
    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setAnimScore(Math.round(ease * target));
      setAnimPct(ease * target);
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setShowGlow(true);
      }
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [score, trend]);

  const radius = 70;
  const cx = 100, cy = 90;
  const toRad = deg => (deg * Math.PI) / 180;
  const arcX = (angle) => cx + radius * Math.cos(toRad(angle));
  const arcY = (angle) => cy + radius * Math.sin(toRad(angle));
  const fillArc = (animPct / 100) * 180;
  const fillAngle = 180 - fillArc;
  const needleAngle = 180 - fillArc;
  const needleX = cx + (radius - 12) * Math.cos(toRad(needleAngle));
  const needleY = cy + (radius - 12) * Math.sin(toRad(needleAngle));
  const bgPath = `M ${arcX(180)} ${arcY(180)} A ${radius} ${radius} 0 0 1 ${arcX(0)} ${arcY(0)}`;
  const fillPath = animPct > 0
    ? `M ${arcX(180)} ${arcY(180)} A ${radius} ${radius} 0 ${fillArc > 90 ? 1 : 0} 1 ${arcX(fillAngle)} ${arcY(fillAngle)}`
    : null;

  return (
    <div style={{
      backgroundColor: COLORS.surface,
      border: `1px solid ${showGlow ? color : COLORS.surfaceBorder}`,
      borderRadius: 16, padding: 16, marginBottom: 16, textAlign: 'center',
      boxShadow: showGlow ? `0 0 20px ${color}33` : 'none',
      transition: 'box-shadow 0.5s, border-color 0.5s',
    }}>
      <div style={{ fontSize: 11, letterSpacing: 2, color: COLORS.muted, marginBottom: 8 }}>🎯 TREND METER</div>
      <svg width="200" height="110" viewBox="0 0 200 110" style={{ overflow: 'visible' }}>
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <path d={bgPath} fill="none" stroke="#30363D" strokeWidth="14" strokeLinecap="round"/>
        <path d={`M ${arcX(180)} ${arcY(180)} A ${radius} ${radius} 0 0 1 ${arcX(120)} ${arcY(120)}`} fill="none" stroke="#D1453B" strokeWidth="14" strokeLinecap="round" opacity="0.25"/>
        <path d={`M ${arcX(120)} ${arcY(120)} A ${radius} ${radius} 0 0 1 ${arcX(60)} ${arcY(60)}`} fill="none" stroke="#D8A33D" strokeWidth="14" strokeLinecap="round" opacity="0.25"/>
        <path d={`M ${arcX(60)} ${arcY(60)} A ${radius} ${radius} 0 0 1 ${arcX(0)} ${arcY(0)}`} fill="none" stroke="#3FAE7C" strokeWidth="14" strokeLinecap="round" opacity="0.25"/>
        {fillPath && <path d={fillPath} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" filter={showGlow ? "url(#glow)" : "none"}/>}
        <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke="#E8E6E0" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx={cx} cy={cy} r="6" fill={color} filter={showGlow ? "url(#glow)" : "none"}/>
        <text x="18" y="108" fill="#D1453B" fontSize="9" fontWeight="700">BEARISH</text>
        <text x="152" y="108" fill="#3FAE7C" fontSize="9" fontWeight="700">BULLISH</text>
        <text x="82" y="18" fill="#D8A33D" fontSize="9" fontWeight="700">NEUTRAL</text>
      </svg>
      <div style={{ fontSize: 32, fontWeight: 800, color, marginTop: -6 }}>
        {animScore}<span style={{ fontSize: 14, color: COLORS.muted }}>/100</span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color, marginTop: 4, opacity: showGlow ? 1 : 0, transition: 'opacity 0.5s' }}>
        {score >= 70 ? '🔥 Strong ' : score >= 40 ? '⚡ Moderate ' : '❄️ Weak '}{trend}
      </div>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }`}</style>
      {showGlow && (
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, margin: '8px auto 0', animation: 'pulse 1.5s ease-in-out infinite', boxShadow: `0 0 8px ${color}` }} />
      )}
    </div>
  );
}

export default function StockDashboard({ user }) {
  const [symbolInput, setSymbolInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [stockInfo, setStockInfo] = useState(null);
  const [stockName, setStockName] = useState('');
  const [tab, setTab] = useState('check');
  const [watchlist, setWatchlist] = useState([]);
  const [history, setHistory] = useState([]);
  const [sizingMode, setSizingMode] = useState('risk');
  const [quantity, setQuantity] = useState(10);
  const [riskAmount, setRiskAmount] = useState(1000);
  const [slPercent, setSlPercent] = useState(3);
  const [entryPrice, setEntryPrice] = useState(0);
  const [direction, setDirection] = useState('BUY');
  const [alertSent, setAlertSent] = useState(false);
  const [alertSending, setAlertSending] = useState(false);
  const [pulseData, setPulseData] = useState(null);

  const handleLogout = async () => { await supabase.auth.signOut(); };

  const handleSearch = async (symOverride) => {
    const sym = (symOverride || symbolInput).trim().toUpperCase();
    if (!sym) return;
    setLoading(true); setError(''); setResult(null); setStockInfo(null); setPulseData(null);
    setSymbolInput(sym); setAlertSent(false);
    let symbol = sym;
    if (!symbol.includes('.')) symbol = symbol + '.NS';
    try {
      const res = await fetch(`/api/get-stock-data?symbol=${encodeURIComponent(symbol)}&range=1y`);
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Data fetch failed.'); setLoading(false); return; }
      if (!data.candles || data.candles.length < 50) { setError('Itna data nahi mila.'); setLoading(false); return; }
      const analysis = analyzeStock(data.candles);
      if (analysis.error) { setError(analysis.error); setLoading(false); return; }
      setResult(analysis); setStockInfo(data.stockInfo || null); setStockName(sym);
      setEntryPrice(analysis.lastClose);
      setDirection(analysis.trend === 'Bullish' ? 'BUY' : 'SELL');
      if (analysis.atr) setSlPercent(Math.min(6, Math.max(1.5, (analysis.atr / analysis.lastClose * 100).toFixed(1))));
      setHistory(prev => [{ id: Date.now(), symbol: sym, trend: analysis.trend, price: analysis.lastClose, date: new Date().toISOString(), outcome: 'pending' }, ...prev].slice(0, 100));
      setPulseData({
        symbol: sym, companyName: data.stockInfo?.longName || sym,
        currentPrice: data.stockInfo?.regularMarketPrice || analysis.lastClose,
        change: data.stockInfo?.regularMarketChange,
        changePercent: data.stockInfo?.regularMarketChangePercent?.toFixed(2),
        rsi: analysis.rsi, macd: analysis.macd, macdSignal: analysis.macdSignal,
        ema20: analysis.ema20, ema50: analysis.ema50, adx: analysis.adx,
        supertrend: analysis.supertrend, trend: analysis.trend,
        volume: data.stockInfo?.regularMarketVolume, avgVolume: data.stockInfo?.averageDailyVolume10Day,
      });
    } catch (err) {
      setError('Kuch gadbad ho gayi, dobara try karo.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendAlert = async () => {
    if (!user?.email || !result?.signal) return;
    setAlertSending(true);
    try {
      await fetch('/api/send-alert', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, symbol: stockName, trend: result.trend, entry: result.entry?.toFixed(2), stopLoss: result.stopLoss?.toFixed(2), target1: result.targets?.[0]?.toFixed(2), target2: result.targets?.[1]?.toFixed(2), target3: result.targets?.[2]?.toFixed(2) }),
      });
      setAlertSent(true);
    } catch (err) { console.error(err); } finally { setAlertSending(false); }
  };

  const ep = Number(entryPrice) || 0;
  const sl = Math.max(0, Number(slPercent) || 0);
  const stopLossPrice = direction === 'BUY' ? ep * (1 - sl/100) : ep * (1 + sl/100);
  const riskPerShare = Math.abs(ep - stopLossPrice);
  const calculatedQty = riskPerShare > 0 ? Math.floor(Math.max(0, Number(riskAmount)||0) / riskPerShare) : 0;
  const qty = sizingMode === 'risk' ? calculatedQty : Math.max(0, Number(quantity)||0);
  const lossAmount = Math.abs(ep - stopLossPrice) * qty;
  const tierResults = TIERS.map(t => { const price = direction === 'BUY' ? ep*(1+t/100) : ep*(1-t/100); return { percent: t, price, profit: Math.abs(price-ep)*qty }; });
  const riskReward = lossAmount > 0 ? (tierResults[2].profit / lossAmount).toFixed(1) : 0;
  const trendColor = result?.trend === 'Bullish' ? COLORS.green : result?.trend === 'Bearish' ? COLORS.red : COLORS.gold;

  return (
    <div style={{ backgroundColor: COLORS.bg, color: COLORS.text, minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '32px 20px 48px' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div style={{ color: COLORS.gold, fontWeight: 700, fontSize: 14 }}>🔱 हर हर महादेव 🔱</div>
          <button onClick={handleLogout} style={{ fontSize: 11, padding: '5px 14px', borderRadius: 20, border: `1px solid ${COLORS.surfaceBorder}`, backgroundColor: 'transparent', color: COLORS.muted, cursor: 'pointer', fontWeight: 600 }}>🚪 Logout</button>
        </div>

        <h1 style={{ fontSize: 32, fontWeight: 700, margin: '0 0 4px' }}>Pulse<span style={{ color: COLORS.gold }}>Trade</span></h1>
        <p style={{ fontSize: 13, color: COLORS.muted, margin: '0 0 20px' }}>Bazaar ka pulse dekho, faisla khud karo.</p>

        {/* TABS */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {[['check','🔍 Check'],['watchlist','⭐ Watchlist'],['track','📋 Record']].map(([key,label]) => (
            <button key={key} onClick={() => setTab(key)} style={{ flex: 1, padding: '8px 4px', fontSize: 11, fontWeight: 600, borderRadius: 12, border: tab===key ? 'none' : `1px solid ${COLORS.surfaceBorder}`, backgroundColor: tab===key ? COLORS.gold : COLORS.surface, color: tab===key ? '#1A1306' : COLORS.muted, cursor: 'pointer' }}>{label}</button>
          ))}
        </div>

        {/* SEBI BANNER */}
        <SEBIBanner />

        {/* SUBSCRIBE */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <SubscribeButton userEmail={user?.email} userId={user?.id} />
        </div>

        {tab === 'check' && (
          <>
            <div style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.surfaceBorder}`, borderRadius: 16, padding: 16, marginBottom: 24 }}>
              <label style={{ fontSize: 11, letterSpacing: 2, color: COLORS.muted, display: 'block', marginBottom: 8 }}>STOCK SYMBOL YA NAAM</label>
              <input value={symbolInput} onChange={e => setSymbolInput(e.target.value)} onKeyDown={e => e.key==='Enter' && handleSearch()} placeholder="e.g. RELIANCE, TCS"
                style={{ width: '100%', padding: '10px 12px', fontSize: 14, backgroundColor: COLORS.bg, border: `1px solid ${COLORS.surfaceBorder}`, borderRadius: 10, color: COLORS.text, outline: 'none', boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                {POPULAR.map(s => (
                  <button key={s} disabled={loading} onClick={() => handleSearch(s)}
                    style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, border: `1px solid ${COLORS.surfaceBorder}`, backgroundColor: symbolInput===s ? COLORS.gold : 'transparent', color: symbolInput===s ? '#1A1306' : COLORS.muted, cursor: 'pointer' }}>{s}</button>
                ))}
              </div>
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ fontSize: 11, letterSpacing: 2, color: COLORS.muted }}>POSITION SIZING</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[['risk','Risk ₹'],['manual','Qty']].map(([m,l]) => (
                      <button key={m} onClick={() => setSizingMode(m)} style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, border: sizingMode===m ? 'none' : `1px solid ${COLORS.surfaceBorder}`, backgroundColor: sizingMode===m ? COLORS.gold : 'transparent', color: sizingMode===m ? '#1A1306' : COLORS.muted, cursor: 'pointer' }}>{l}</button>
                    ))}
                  </div>
                </div>
                {sizingMode === 'risk' ? (
                  <>
                    <input type="number" value={riskAmount} onChange={e => setRiskAmount(e.target.value)} placeholder="Risk amount e.g. 1000"
                      style={{ width: '100%', padding: '10px 12px', fontSize: 14, backgroundColor: COLORS.bg, border: `1px solid ${COLORS.surfaceBorder}`, borderRadius: 10, color: COLORS.text, outline: 'none', boxSizing: 'border-box' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                      <span style={{ fontSize: 12, color: COLORS.muted }}>Calculated Qty</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.gold }}>{qty} shares</span>
                    </div>
                  </>
                ) : (
                  <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="Qty e.g. 10"
                    style={{ width: '100%', padding: '10px 12px', fontSize: 14, backgroundColor: COLORS.bg, border: `1px solid ${COLORS.surfaceBorder}`, borderRadius: 10, color: COLORS.text, outline: 'none', boxSizing: 'border-box' }} />
                )}
              </div>
              <button onClick={() => handleSearch()} disabled={loading}
                style={{ width: '100%', marginTop: 12, padding: '10px', fontSize: 14, fontWeight: 600, borderRadius: 10, border: 'none', backgroundColor: loading ? COLORS.goldDim : COLORS.gold, color: '#1A1306', cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? '⏳ Check ho raha hai...' : '🔍 Trend Nikalo'}
              </button>
              {error && <p style={{ fontSize: 12, color: COLORS.red, marginTop: 8 }}>{error}</p>}
            </div>

            {result && (
              <>
                {stockInfo && (
                  <div style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.surfaceBorder}`, borderRadius: 16, padding: 16, marginBottom: 16 }}>
                    <div style={{ fontSize: 11, letterSpacing: 2, color: COLORS.muted, marginBottom: 12 }}>📊 STOCK INFO</div>
                    {stockInfo.longName && <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: COLORS.text }}>{stockInfo.longName}</div>}
                    {[
                      ['Market Cap', fmtCr(stockInfo.marketCap)],
                      ['P/E Ratio', stockInfo.trailingPE ? stockInfo.trailingPE.toFixed(2) : '—'],
                      ['Aaj ka Volume', fmtVol(stockInfo.regularMarketVolume)],
                      ['Avg Volume (3M)', fmtVol(stockInfo.averageDailyVolume3Month)],
                      ['Exchange', stockInfo.exchangeName || '—'],
                    ].map(([label, value]) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0', borderBottom: `1px solid ${COLORS.surfaceBorder}` }}>
                        <span style={{ color: COLORS.muted }}>{label}</span>
                        <span style={{ fontWeight: 600, color: COLORS.text }}>{value}</span>
                      </div>
                    ))}
                  </div>
                )}

                <TrendMeter longScore={result.longScore} shortScore={result.shortScore} trend={result.trend} />
                {pulseData && <PulseBoltaHai stockData={pulseData} />}

                <div style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.surfaceBorder}`, borderRadius: 16, padding: 16, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${COLORS.surfaceBorder}` }}>
                    <span style={{ fontSize: 20, fontWeight: 700 }}>{stockName}</span>
                    <span style={{ fontSize: 18, fontWeight: 700, color: COLORS.gold }}>{fmtINR(result.lastClose)}</span>
                  </div>
                  {[
                    ['Trend', result.trend, trendColor],
                    ['Momentum (MACD)'
