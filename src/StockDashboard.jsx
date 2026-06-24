import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import { analyzeStock } from './technicalAnalysis';
import SubscribeButton from './SubscribeButton';
import PulseBoltaHai from '../PulseBoltaHai';

const LIGHT = {
  bg: "#F4F6FA", surface: "#FFFFFF", surfaceBorder: "#E2E8F0", surfaceHover: "#F8FAFC",
  gold: "#C8920A", goldLight: "#FEF3C7", goldDim: "#D97706",
  green: "#059669", greenLight: "#ECFDF5",
  red: "#DC2626", redLight: "#FEF2F2",
  text: "#0F172A", textSecondary: "#334155", muted: "#64748B", mutedLight: "#94A3B8",
  headerBg: "#FFFFFF", sebi: "#1E3A5F", sebiBg: "#EFF6FF", sebiBorder: "#BFDBFE",
};

const DARK = {
  bg: "#0D1117", surface: "#161B22", surfaceBorder: "#30363D", surfaceHover: "#1C2128",
  gold: "#D8A33D", goldLight: "#2D2008", goldDim: "#F0B429",
  green: "#3FAE7C", greenLight: "#0D2B1F",
  red: "#F87171", redLight: "#2D1515",
  text: "#E8E6E0", textSecondary: "#C9D1D9", muted: "#8B92A0", mutedLight: "#6E7681",
  headerBg: "#161B22", sebi: "#93C5FD", sebiBg: "#0D1F3C", sebiBorder: "#1D4ED8",
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

function Week52Bar({ current, low, high, C }) {
  const pct = Math.min(100, Math.max(0, ((current - low) / (high - low)) * 100));
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.muted, marginBottom: 4, fontWeight: 600 }}>
        <span>52W Low {fmtINR(low)}</span>
        <span>52W High {fmtINR(high)}</span>
      </div>
      <div style={{ position: 'relative', height: 8, backgroundColor: C.surfaceBorder, borderRadius: 99 }}>
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${C.red}, ${C.gold}, ${C.green})`, borderRadius: 99 }} />
        <div style={{ position: 'absolute', top: -3, left: `${pct}%`, transform: 'translateX(-50%)', width: 14, height: 14, backgroundColor: C.gold, border: '2.5px solid white', borderRadius: '50%', boxShadow: '0 1px 4px rgba(0,0,0,0.18)' }} />
      </div>
      <div style={{ textAlign: 'center', fontSize: 11, color: C.goldDim, fontWeight: 700, marginTop: 5 }}>{pct.toFixed(0)}% of 52W range</div>
    </div>
  );
}

function IndicatorBar({ label, value, max, color, C }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.muted, marginBottom: 4, fontWeight: 600 }}>
        <span>{label}</span><span style={{ color, fontWeight: 700 }}>{value}</span>
      </div>
      <div style={{ height: 6, backgroundColor: C.surfaceBorder, borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, backgroundColor: color, borderRadius: 99, transition: 'width 1s ease' }} />
      </div>
    </div>
  );
}

function TrendMeter({ longScore, shortScore, trend, C }) {
  const score = trend === 'Bullish' ? longScore : shortScore;
  const color = trend === 'Bullish' ? C.green : C.red;
  const colorLight = trend === 'Bullish' ? C.greenLight : C.redLight;
  const [animScore, setAnimScore] = useState(0);
  const [animPct, setAnimPct] = useState(0);
  const [showGlow, setShowGlow] = useState(false);
  const animRef = useRef(null);

  useEffect(() => {
    setAnimScore(0); setAnimPct(0); setShowGlow(false);
    let start = null;
    const target = Math.min(100, Math.max(0, score));
    const animate = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 1500, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setAnimScore(Math.round(e * target));
      setAnimPct(e * target);
      if (p < 1) animRef.current = requestAnimationFrame(animate);
      else setShowGlow(true);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [score, trend]);

  const radius = 70, cx = 100, cy = 90;
  const toRad = d => (d * Math.PI) / 180;
  const ax = a => cx + radius * Math.cos(toRad(a));
  const ay = a => cy + radius * Math.sin(toRad(a));
  const fillArc = (animPct / 100) * 180;
  const fillAngle = 180 - fillArc;
  const nx = cx + (radius - 12) * Math.cos(toRad(fillAngle));
  const ny = cy + (radius - 12) * Math.sin(toRad(fillAngle));
  const bgPath = `M ${ax(180)} ${ay(180)} A ${radius} ${radius} 0 0 1 ${ax(0)} ${ay(0)}`;
  const fillPath = animPct > 0
    ? `M ${ax(180)} ${ay(180)} A ${radius} ${radius} 0 ${fillArc > 90 ? 1 : 0} 1 ${ax(fillAngle)} ${ay(fillAngle)}`
    : null;

  return (
    <div style={{
      backgroundColor: C.surface, border: `1.5px solid ${showGlow ? color : C.surfaceBorder}`,
      borderRadius: 16, padding: 20, marginBottom: 16, textAlign: 'center',
      boxShadow: showGlow ? `0 4px 24px ${color}22` : '0 1px 4px rgba(0,0,0,0.06)',
      transition: 'box-shadow 0.5s, border-color 0.5s',
    }}>
      <div style={{ fontSize: 10, letterSpacing: 2, color: C.muted, marginBottom: 8, fontWeight: 700 }}>🎯 TREND METER</div>
      <svg width="200" height="110" viewBox="0 0 200 110" style={{ overflow: 'visible' }}>
        <defs>
          <filter id="glow"><feGaussianBlur stdDeviation="3" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        <path d={bgPath} fill="none" stroke={C.surfaceBorder} strokeWidth="14" strokeLinecap="round"/>
        <path d={`M ${ax(180)} ${ay(180)} A ${radius} ${radius} 0 0 1 ${ax(120)} ${ay(120)}`} fill="none" stroke="#DC2626" strokeWidth="14" strokeLinecap="round" opacity="0.18"/>
        <path d={`M ${ax(120)} ${ay(120)} A ${radius} ${radius} 0 0 1 ${ax(60)} ${ay(60)}`} fill="none" stroke="#C8920A" strokeWidth="14" strokeLinecap="round" opacity="0.18"/>
        <path d={`M ${ax(60)} ${ay(60)} A ${radius} ${radius} 0 0 1 ${ax(0)} ${ay(0)}`} fill="none" stroke="#059669" strokeWidth="14" strokeLinecap="round" opacity="0.18"/>
        {fillPath && <path d={fillPath} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" filter={showGlow ? "url(#glow)" : "none"}/>}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={C.textSecondary} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx={cx} cy={cy} r="6" fill={color} filter={showGlow ? "url(#glow)" : "none"}/>
        <text x="18" y="108" fill="#DC2626" fontSize="9" fontWeight="700">BEARISH</text>
        <text x="152" y="108" fill="#059669" fontSize="9" fontWeight="700">BULLISH</text>
        <text x="82" y="18" fill="#C8920A" fontSize="9" fontWeight="700">NEUTRAL</text>
      </svg>
      <div style={{ fontSize: 32, fontWeight: 800, color, marginTop: -6 }}>
        {animScore}<span style={{ fontSize: 14, color: C.muted }}>/100</span>
      </div>
      <div style={{
        display: 'inline-block', fontSize: 13, fontWeight: 700, color,
        backgroundColor: colorLight, padding: '4px 14px', borderRadius: 20, marginTop: 6,
        opacity: showGlow ? 1 : 0, transition: 'opacity 0.5s',
      }}>
        {score >= 70 ? '🔥 Strong ' : score >= 40 ? '⚡ Moderate ' : '❄️ Weak '}{trend}
      </div>
    </div>
  );
}

// ✅ PULSE SCORE HERO BANNER COMPONENT
function PulseHeroBanner({ result, stockName, stockInfo, C }) {
  const isBullish = result.trend === 'Bullish';
  const score = isBullish ? result.longScore : result.shortScore;
  const gradientBg = isBullish
    ? 'linear-gradient(135deg, #064E3B 0%, #065F46 50%, #0D2B1F 100%)'
    : 'linear-gradient(135deg, #7F1D1D 0%, #991B1B 50%, #2D1515 100%)';
  const accentColor = isBullish ? '#3FAE7C' : '#F87171';
  const borderColor = isBullish ? '#3FAE7C' : '#F87171';

  return (
    <div style={{
      background: gradientBg,
      borderRadius: 20, padding: '24px 20px', marginBottom: 16,
      border: `1.5px solid ${borderColor}`,
      boxShadow: `0 8px 32px ${accentColor}33`,
    }}>
      {/* Top row — name + badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', letterSpacing: '-0.5px' }}>{stockName}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
            {stockInfo?.longName || stockName}
          </div>
        </div>
        <div style={{
          fontSize: 12, fontWeight: 800, padding: '6px 14px', borderRadius: 20,
          backgroundColor: accentColor, color: '#FFF',
        }}>
          {isBullish ? '🟢 BULLISH' : '🔴 BEARISH'}
        </div>
      </div>

      {/* Price row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 34, fontWeight: 900, color: '#FFF', letterSpacing: '-1px' }}>
          {fmtINR(stockInfo?.regularMarketPrice || result.lastClose)}
        </span>
        {stockInfo?.regularMarketChange !== undefined && (
          <span style={{
            fontSize: 13, fontWeight: 700, padding: '4px 12px', borderRadius: 20,
            backgroundColor: stockInfo.regularMarketChange >= 0 ? 'rgba(63,174,124,0.25)' : 'rgba(248,113,113,0.25)',
            color: stockInfo.regularMarketChange >= 0 ? '#3FAE7C' : '#F87171',
            border: `1px solid ${stockInfo.regularMarketChange >= 0 ? '#3FAE7C' : '#F87171'}`,
          }}>
            {stockInfo.regularMarketChange >= 0 ? '▲' : '▼'} {Math.abs(stockInfo.regularMarketChangePercent || 0).toFixed(2)}%
          </span>
        )}
      </div>

      {/* Pulse Score bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 700, letterSpacing: 1 }}>
            ⚡ PULSE SCORE
          </span>
          <span style={{ fontSize: 16, fontWeight: 900, color: accentColor }}>
            {score}/100
          </span>
        </div>
        <div style={{ height: 10, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${score}%`,
            background: isBullish
              ? 'linear-gradient(90deg, #059669, #34D399)'
              : 'linear-gradient(90deg, #DC2626, #FCA5A5)',
            borderRadius: 99, transition: 'width 1.2s ease',
          }} />
        </div>
      </div>

      {/* Bottom label */}
      <div style={{
        fontSize: 13, fontWeight: 700,
        color: 'rgba(255,255,255,0.75)',
        textAlign: 'center', marginTop: 16,
        padding: '8px 12px',
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderRadius: 10,
      }}>
        {isBullish
          ? score >= 70 ? '🔥 Strong Bullish — Momentum bahut strong hai!'
          : '⚡ Moderate Bullish — Cautiously optimistic raho'
          : score >= 70 ? '❄️ Strong Bearish — Selling pressure strong hai!'
          : '⚡ Moderate Bearish — Dhyan se dekho'}
      </div>
    </div>
  );
}

export default function StockDashboard({ user }) {
  const [dark, setDark] = useState(() => localStorage.getItem('pt_dark') === 'true');
  const C = dark ? DARK : LIGHT;

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem('pt_dark', next);
  };

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
    setLoading(true); setError(''); setResult(null); setStockInfo(null);
    setPulseData(null); setSymbolInput(sym); setAlertSent(false);
    let symbol = sym;
    if (!symbol.includes('.')) symbol = symbol + '.NS';
    try {
      const res = await fetch(`/api/get-stock-data?symbol=${encodeURIComponent(symbol)}&range=1y`);
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Data fetch failed.'); setLoading(false); return; }
      if (!data.candles || data.candles.length < 50) { setError('Itna data nahi mila.'); setLoading(false); return; }
      const analysis = analyzeStock(data.candles);
      if (analysis.error) { setError(analysis.error); setLoading(false); return; }
      setResult(analysis);
      setStockInfo(data.stockInfo || null);
      setStockName(sym);
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
        volume: data.stockInfo?.regularMarketVolume,
        avgVolume: data.stockInfo?.averageDailyVolume10Day,
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email, symbol: stockName, trend: result.trend,
          entry: result.entry?.toFixed(2), stopLoss: result.stopLoss?.toFixed(2),
          target1: result.targets?.[0]?.toFixed(2), target2: result.targets?.[1]?.toFixed(2), target3: result.targets?.[2]?.toFixed(2),
        }),
      });
      setAlertSent(true);
    } catch (err) { console.error(err); }
    finally { setAlertSending(false); }
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
  const trendColor = result?.trend === 'Bullish' ? C.green : result?.trend === 'Bearish' ? C.red : C.gold;

  const inputStyle = {
    width: '100%', padding: '11px 14px', fontSize: 14,
    backgroundColor: C.bg, border: `1.5px solid ${C.surfaceBorder}`,
    borderRadius: 10, color: C.text, outline: 'none',
    boxSizing: 'border-box', fontFamily: 'Inter, sans-serif',
  };
  const rowStyle = {
    display: 'flex', justifyContent: 'space-between',
    fontSize: 13, padding: '7px 0', borderBottom: `1px solid ${C.surfaceBorder}`,
  };
  const cardStyle = {
    backgroundColor: C.surface, border: `1px solid ${C.surfaceBorder}`,
    borderRadius: 16, padding: 18, marginBottom: 16,
    boxShadow: dark ? '0 2px 16px rgba(0,0,0,0.4)' : '0 1px 6px rgba(0,0,0,0.05)',
    transition: 'all 0.3s ease',
  };

  return (
    <div style={{ backgroundColor: C.bg, color: C.text, minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif', transition: 'all 0.3s ease' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 0 48px' }}>

        {/* HEADER */}
        <div style={{
          backgroundColor: C.headerBg, borderBottom: `1px solid ${C.surfaceBorder}`,
          padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 8px rgba(0,0,0,0.08)',
          transition: 'all 0.3s ease',
        }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
              Pulse<span style={{ color: C.gold }}>Trade</span>
            </h1>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>🔱 हर हर महादेव 🔱</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={toggleDark} style={{
              width: 52, height: 26, borderRadius: 99,
              backgroundColor: dark ? C.gold : '#CBD5E1',
              border: 'none', cursor: 'pointer',
              position: 'relative', transition: 'background 0.3s ease',
              display: 'flex', alignItems: 'center', padding: '0 3px', flexShrink: 0,
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%', backgroundColor: '#FFF',
                transform: dark ? 'translateX(26px)' : 'translateX(0px)',
                transition: 'transform 0.3s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
              }}>
                {dark ? '🌙' : '☀️'}
              </div>
            </button>
            {user?.email === 'prabhat3300@gmail.com' && (
              <a href="/admin" style={{
                fontSize: 11, padding: '5px 14px', borderRadius: 20,
                border: `1.5px solid ${C.gold}`, backgroundColor: C.goldLight,
                color: C.goldDim, cursor: 'pointer', fontWeight: 700, textDecoration: 'none',
              }}>⚙️ Admin</a>
            )}
            <button onClick={handleLogout} style={{
              fontSize: 12, padding: '6px 14px', borderRadius: 20,
              border: `1.5px solid ${C.surfaceBorder}`,
              backgroundColor: 'transparent', color: C.muted, cursor: 'pointer', fontWeight: 600,
            }}>🚪 Logout</button>
          </div>
        </div>

        {/* SEBI BANNER */}
        <div style={{
          backgroundColor: C.s
