import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import { analyzeStock } from './technicalAnalysis';
import SubscribeButton from './SubscribeButton';
import PulseBoltaHai from '../PulseBoltaHai';

const COLORS = {
  bg: "#F4F6FA",
  surface: "#FFFFFF",
  surfaceBorder: "#E2E8F0",
  surfaceHover: "#F8FAFC",
  gold: "#C8920A",
  goldLight: "#FEF3C7",
  goldDim: "#D97706",
  green: "#059669",
  greenLight: "#ECFDF5",
  red: "#DC2626",
  redLight: "#FEF2F2",
  text: "#0F172A",
  textSecondary: "#334155",
  muted: "#64748B",
  mutedLight: "#94A3B8",
  headerBg: "#FFFFFF",
  sebi: "#1E3A5F",
  sebiBg: "#EFF6FF",
  sebiBorder: "#BFDBFE",
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

/* ── 52W Progress Bar ── */
function Week52Bar({ current, low, high }) {
  const pct = Math.min(100, Math.max(0, ((current - low) / (high - low)) * 100));
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: COLORS.muted, marginBottom: 4, fontWeight: 600 }}>
        <span>52W Low {fmtINR(low)}</span>
        <span>52W High {fmtINR(high)}</span>
      </div>
      <div style={{ position: 'relative', height: 8, backgroundColor: '#E2E8F0', borderRadius: 99 }}>
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${COLORS.red}, ${COLORS.gold}, ${COLORS.green})`, borderRadius: 99 }} />
        <div style={{ position: 'absolute', top: -3, left: `${pct}%`, transform: 'translateX(-50%)', width: 14, height: 14, backgroundColor: COLORS.gold, border: '2.5px solid white', borderRadius: '50%', boxShadow: '0 1px 4px rgba(0,0,0,0.18)' }} />
      </div>
      <div style={{ textAlign: 'center', fontSize: 11, color: COLORS.goldDim, fontWeight: 700, marginTop: 5 }}>{pct.toFixed(0)}% of 52W range</div>
    </div>
  );
}

/* ── Indicator Progress Bar ── */
function IndicatorBar({ label, value, max, color }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: COLORS.muted, marginBottom: 4, fontWeight: 600 }}>
        <span>{label}</span><span style={{ color, fontWeight: 700 }}>{value}</span>
      </div>
      <div style={{ height: 6, backgroundColor: '#E2E8F0', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, backgroundColor: color, borderRadius: 99, transition: 'width 1s ease' }} />
      </div>
    </div>
  );
}

/* ── Trial Offer helpers ── */
function getMsUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}

function fmtCountdown(ms) {
  if (ms <= 0) return "00:00:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map(n => String(n).padStart(2, "0")).join(":");
}

/* ── Trial Offer Card ── */
function TrialOfferCard({ onActivated }) {
  const [msLeft, setMsLeft] = useState(getMsUntilMidnight());
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error | exists
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const t = setInterval(() => setMsLeft(getMsUntilMidnight()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleActivate = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      setStatus("error");
      setErrorMsg("Sahi email daalo.");
      return;
    }
    setStatus("loading");
    setErrorMsg("");
    try {
      const { error } = await supabase
        .from("trial_signups")
        .insert([{ email: trimmed }]);

      if (error) {
        if (error.code === "23505") {
          setStatus("exists");
        } else {
          setStatus("error");
          setErrorMsg("Kuch gadbad hui, dobara try karo.");
        }
        return;
      }

      // Trial saved — now send a magic link so the user can log in right away
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: trimmed,
      });
      if (otpError) {
        console.error("Magic link send failed:", otpError);
      }

      setStatus("success");
      if (onActivated) onActivated(trimmed);
    } catch (err) {
      setStatus("error");
      setErrorMsg("Kuch gadbad hui, dobara try karo.");
    }
  };

  return (
    <div style={{
      backgroundColor: COLORS.surface,
      border: `2px solid ${COLORS.gold}`,
      borderRadius: 16,
      padding: 18,
      marginBottom: 20,
      boxShadow: "0 4px 20px rgba(200,146,10,0.18)",
      textAlign: "center",
    }}>
      <div style={{
        display: "inline-block",
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: 1,
        color: "#FFF",
        backgroundColor: COLORS.red,
        padding: "4px 12px",
        borderRadius: 20,
        marginBottom: 10,
      }}>
        🔥 LIMITED TIME OFFER
      </div>

      <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.text, marginBottom: 4 }}>
        5-Day Free Trial
      </div>
      <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 12 }}>
        Aaj signup karo, pura access 5 din ke liye free
      </div>

      <div style={{
        fontSize: 13, fontWeight: 700, color: COLORS.goldDim,
        backgroundColor: COLORS.goldLight, display: "inline-block",
        padding: "6px 16px", borderRadius: 10, marginBottom: 14,
        fontFamily: "monospace", letterSpacing: 1,
      }}>
        ⏳ Offer ends in {fmtCountdown(msLeft)}
      </div>

      {status === "success" ? (
        <div style={{
          fontSize: 13, fontWeight: 700, color: COLORS.green,
          backgroundColor: COLORS.greenLight, padding: "12px", borderRadius: 10,
        }}>
          ✅ Trial activate ho gaya! Login link aapke email pe bhej diya hai — check karo.
        </div>
      ) : status === "exists" ? (
        <div style={{
          fontSize: 13, fontWeight: 700, color: COLORS.goldDim,
          backgroundColor: COLORS.goldLight, padding: "12px", borderRadius: 10,
        }}>
          Yeh email pehle hi trial le chuka hai.
        </div>
      ) : (
        <>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Apna email daalo"
            style={{
              width: "100%", padding: "11px 14px", fontSize: 14,
              backgroundColor: COLORS.bg, border: `1.5px solid ${COLORS.surfaceBorder}`,
              borderRadius: 10, color: COLORS.text, outline: "none",
              boxSizing: "border-box", fontFamily: "Inter, sans-serif",
              marginBottom: 10,
            }}
          />
          <button
            onClick={handleActivate}
            disabled={status === "loading"}
            style={{
              width: "100%", padding: "12px",
              fontSize: 14, fontWeight: 700, borderRadius: 12, border: "none",
              backgroundColor: status === "loading" ? "#CBD5E1" : COLORS.gold,
              color: "#FFF", cursor: status === "loading" ? "not-allowed" : "pointer",
              boxShadow: status === "loading" ? "none" : "0 2px 12px rgba(200,146,10,0.3)",
            }}
          >
            {status === "loading" ? "⏳ Activate ho raha hai..." : "🚀 Start 5-Day Free Trial"}
          </button>
          {status === "error" && (
            <p style={{ fontSize: 12, color: COLORS.red, marginTop: 8, fontWeight: 600 }}>{errorMsg}</p>
          )}
        </>
      )}
    </div>
  );
}

/* ── Trend Meter ── */
function TrendMeter({ longScore, shortScore, trend }) {
  const score = trend === 'Bullish' ? longScore : shortScore;
  const color = trend === 'Bullish' ? COLORS.green : COLORS.red;
  const colorLight = trend === 'Bullish' ? COLORS.greenLight : COLORS.redLight;
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
      backgroundColor: COLORS.surface,
      border: `1.5px solid ${showGlow ? color : COLORS.surfaceBorder}`,
      borderRadius: 16, padding: 20, marginBottom: 16, textAlign: 'center',
      boxShadow: showGlow ? `0 4px 24px ${color}22` : '0 1px 4px rgba(0,0,0,0.06)',
      transition: 'box-shadow 0.5s, border-color 0.5s',
    }}>
      <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.muted, marginBottom: 8, fontWeight: 700 }}>🎯 TREND METER</div>
      <svg width="200" height="110" viewBox="0 0 200 110" style={{ overflow: 'visible' }}>
        <defs>
          <filter id="glow"><feGaussianBlur stdDeviation="3" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        <path d={bgPath} fill="none" stroke="#E2E8F0" strokeWidth="14" strokeLinecap="round"/>
        <path d={`M ${ax(180)} ${ay(180)} A ${radius} ${radius} 0 0 1 ${ax(120)} ${ay(120)}`} fill="none" stroke="#DC2626" strokeWidth="14" strokeLinecap="round" opacity="0.18"/>
        <path d={`M ${ax(120)} ${ay(120)} A ${radius} ${radius} 0 0 1 ${ax(60)} ${ay(60)}`} fill="none" stroke="#C8920A" strokeWidth="14" strokeLinecap="round" opacity="0.18"/>
        <path d={`M ${ax(60)} ${ay(60)} A ${radius} ${radius} 0 0 1 ${ax(0)} ${ay(0)}`} fill="none" stroke="#059669" strokeWidth="14" strokeLinecap="round" opacity="0.18"/>
        {fillPath && <path d={fillPath} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" filter={showGlow ? "url(#glow)" : "none"}/>}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={COLORS.textSecondary} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx={cx} cy={cy} r="6" fill={color} filter={showGlow ? "url(#glow)" : "none"}/>
        <text x="18" y="108" fill="#DC2626" fontSize="9" fontWeight="700">BEARISH</text>
        <text x="152" y="108" fill="#059669" fontSize="9" fontWeight="700">BULLISH</text>
        <text x="82" y="18" fill="#C8920A" fontSize="9" fontWeight="700">NEUTRAL</text>
      </svg>
      <div style={{ fontSize: 32, fontWeight: 800, color, marginTop: -6 }}>
        {animScore}<span style={{ fontSize: 14, color: COLORS.muted }}>/100</span>
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
        symbol: sym,
        companyName: data.stockInfo?.longName || sym,
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
  const trendColor = result?.trend === 'Bullish' ? COLORS.green : result?.trend === 'Bearish' ? COLORS.red : COLORS.gold;

  const inputStyle = {
    width: '100%', padding: '11px 14px', fontSize: 14,
    backgroundColor: COLORS.bg, border: `1.5px solid ${COLORS.surfaceBorder}`,
    borderRadius: 10, color: COLORS.text, outline: 'none',
    boxSizing: 'border-box', fontFamily: 'Inter, sans-serif',
  };
  const rowStyle = {
    display: 'flex', justifyContent: 'space-between',
    fontSize: 13, padding: '7px 0', borderBottom: `1px solid ${COLORS.surfaceBorder}`,
  };
  const cardStyle = {
    backgroundColor: COLORS.surface, border: `1px solid ${COLORS.surfaceBorder}`,
    borderRadius: 16, padding: 18, marginBottom: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
  };

  return (
    <div style={{ backgroundColor: COLORS.bg, color: COLORS.text, minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 0 48px' }}>

        {/* ── STICKY HEADER ── */}
        <div style={{
          backgroundColor: COLORS.headerBg, borderBottom: `1px solid ${COLORS.surfaceBorder}`,
          padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
        }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
              Pulse<span style={{ color: COLORS.gold }}>Trade</span>
            </h1>
            <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 1 }}>🔱 हर हर महादेव 🔱</div>
          </div>
          <button onClick={handleLogout} style={{
            fontSize: 12, padding: '6px 14px', borderRadius: 20,
            border: `1.5px solid ${COLORS.surfaceBorder}`,
            backgroundColor: 'transparent', color: COLORS.muted, cursor: 'pointer', fontWeight: 600,
          }}>🚪 Logout</button>
        </div>

        {/* ── SEBI BANNER ── */}
        <div style={{
          backgroundColor: COLORS.sebiBg, borderBottom: `2px solid ${COLORS.sebiBorder}`,
          padding: '12px 20px', display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>🛡️</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.sebi, marginBottom: 3, letterSpacing: 0.2 }}>
              SEBI DISCLAIMER — ZAROORI PADHE
            </div>
            <div style={{ fontSize: 11.5, color: COLORS.sebi, lineHeight: 1.6, opacity: 0.85 }}>
              Yeh platform sirf <strong>technical trend analysis</strong> provide karta hai — yeh <strong>investment advice nahi hai</strong>. All outputs are algorithmic technical-analysis estimates for educational and informational purposes only. They are not investment recommendations. SEBI-registered advisor se salah zaroor lein.
            </div>
          </div>
        </div>

        <div style={{ padding: '20px 20px 0' }}>
          <p style={{ fontSize: 13, color: COLORS.muted, margin: '0 0 16px' }}>Bazaar ka pulse dekho, faisla khud karo.</p>

          {/* ── TABS ── */}
          <div style={{
            display: 'flex', gap: 4, marginBottom: 20,
            backgroundColor: COLORS.surface, padding: 4,
            borderRadius: 14, border: `1px solid ${COLORS.surfaceBorder}`,
          }}>
            {[['check','🔍 Check'],['watchlist','⭐ Watchlist'],['track','📋 Record']].map(([key,label]) => (
              <button key={key} onClick={() => setTab(key)} style={{
                flex: 1, padding: '8px 4px', fontSize: 12, fontWeight: 700,
                borderRadius: 10, border: 'none',
                backgroundColor: tab===key ? COLORS.gold : 'transparent',
                color: tab===key ? '#FFF' : COLORS.muted,
                cursor: 'pointer', transition: 'background 0.2s',
              }}>{label}</button>
            ))}
          </div>

          {/* ── TRIAL OFFER ── */}
          <TrialOfferCard onActivated={(email) => console.log("Trial activated:", email)} />

          {/* ── SUBSCRIBE ── */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <SubscribeButton userEmail={user?.email} userId={user?.id} />
          </div>

          {tab === 'check' && (
            <>
              {/* SEARCH CARD */}
              <div style={cardStyle}>
                <label style={{ fontSize: 10, letterSpacing: 2, color: COLORS.muted, display: 'block', marginBottom: 8, fontWeight: 700 }}>STOCK SYMBOL YA NAAM</label>
                <input value={symbolInput} onChange={e => setSymbolInput(e.target.value)} onKeyDown={e => e.key==='Enter' && handleSearch()} placeholder="e.g. RELIANCE, TCS" style={inputStyle} />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                  {POPULAR.map(s => (
                    <button key={s} disabled={loading} onClick={() => handleSearch(s)} style={{
                      fontSize: 11, padding: '5px 12px', borderRadius: 20,
                      border: `1.5px solid ${symbolInput===s ? COLORS.gold : COLORS.surfaceBorder}`,
                      backgroundColor: symbolInput===s ? COLORS.goldLight : 'transparent',
                      color: symbolInput===s ? COLORS.goldDim : COLORS.muted,
                      cursor: 'pointer', fontWeight: 600,
                    }}>{s}</button>
                  ))}
                </div>

                {/* Position Sizing */}
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <label style={{ fontSize: 10, letterSpacing: 2, color: COLORS.muted, fontWeight: 700 }}>POSITION SIZING</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {[['risk','Risk ₹'],['manual','Qty']].map(([m,l]) => (
                        <button key={m} onClick={() => setSizingMode(m)} style={{
                          fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20,
                          border: `1.5px solid ${sizingMode===m ? COLORS.gold : COLORS.surfaceBorder}`,
                          backgroundColor: sizingMode===m ? COLORS.goldLight : 'transparent',
                          color: sizingMode===m ? COLORS.goldDim : COLORS.muted, cursor: 'pointer',
                        }}>{l}</button>
                      ))}
                    </div>
                  </div>
                  {sizingMode === 'risk' ? (
                    <>
                      <input type="number" value={riskAmount} onChange={e => setRiskAmount(e.target.value)} placeholder="Risk amount e.g. 1000" style={inputStyle} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                        <span style={{ fontSize: 12, color: COLORS.muted }}>Calculated Qty</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.gold }}>{qty} shares</span>
                      </div>
                    </>
                  ) : (
                    <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="Qty e.g. 10" style={inputStyle} />
                  )}
                </div>

                <button onClick={() => handleSearch()} disabled={loading} style={{
                  width: '100%', marginTop: 14, padding: '12px',
                  fontSize: 14, fontWeight: 700, borderRadius: 12, border: 'none',
                  backgroundColor: loading ? '#CBD5E1' : COLORS.gold,
                  color: loading ? COLORS.muted : '#FFF',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : '0 2px 12px rgba(200,146,10,0.3)',
                  transition: 'background 0.2s, box-shadow 0.2s',
                }}>
                  {loading ? '⏳ Check ho raha hai...' : '🔍 Trend Nikalo'}
                </button>
                {error && <p style={{ fontSize: 12, color: COLORS.red, marginTop: 8, fontWeight: 600 }}>{error}</p>}
              </div>

              {result && (
                <>
                  {/* STOCK INFO CARD — with price badge + 52W bar */}
                  {stockInfo && (
                    <div style={cardStyle}>
                      <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.muted, marginBottom: 10, fontWeight: 700 }}>📊 STOCK INFO</div>

                      {/* Company name + price + change badge */}
                      {stockInfo.longName && (
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.text, marginBottom: 6 }}>{stockInfo.longName}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 26, fontWeight: 800, color: COLORS.text, letterSpacing: '-0.5px' }}>
                              {fmtINR(stockInfo.regularMarketPrice || result.lastClose)}
                            </span>
                            {stockInfo.regularMarketChange !== undefined && (
                              <span style={{
                                fontSize: 12, fontWeight: 700,
                                color: stockInfo.regularMarketChange >= 0 ? COLORS.green : COLORS.red,
                                backgroundColor: stockInfo.regularMarketChange >= 0 ? COLORS.greenLight : COLORS.redLight,
                                padding: '3px 10px', borderRadius: 20,
                              }}>
                                {stockInfo.regularMarketChange >= 0 ? '▲' : '▼'}{' '}
                                {fmtINR(Math.abs(stockInfo.regularMarketChange))}{' '}
                                ({Math.abs(stockInfo.regularMarketChangePercent || 0).toFixed(2)}%)
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {[
                        ['Market Cap', fmtCr(stockInfo.marketCap)],
                        ['P/E Ratio', stockInfo.trailingPE ? stockInfo.trailingPE.toFixed(2) : '—'],
                        ['Aaj ka Volume', fmtVol(stockInfo.regularMarketVolume)],
                        ['Avg Volume (3M)', fmtVol(stockInfo.averageDailyVolume3Month)],
                        ['Exchange', stockInfo.exchangeName || '—'],
                      ].map(([label, value]) => (
                        <div key={label} style={rowStyle}>
                          <span style={{ color: COLORS.muted }}>{label}</span>
                          <span style={{ fontWeight: 600, color: COLORS.text }}>{value}</span>
                        </div>
                      ))}

                      {/* 52W bar */}
                      {result.week52High && result.week52Low && (
                        <Week52Bar current={result.lastClose} low={result.week52Low} high={result.week52High} />
                      )}
                    </div>
                  )}

                  <TrendMeter longScore={result.longScore} shortScore={result.shortScore} trend={result.trend} />

                  {/* INDICATOR BARS */}
                  <div style={cardStyle}>
                    <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.muted, marginBottom: 14, fontWeight: 700 }}>📈 INDICATOR STRENGTH</div>
                    <IndicatorBar label={`RSI — ${result.rsi > 70 ? 'Overbought' : result.rsi < 30 ? 'Oversold' : 'Neutral zone'}`} value={result.rsi} max={100} color={result.rsi > 70 ? COLORS.red : result.rsi < 30 ? COLORS.green : COLORS.gold} />
                    <IndicatorBar label={`ADX — ${result.trendStrength}`} value={result.adx} max={60} color={result.adx >= 25 ? COLORS.green : COLORS.muted} />
                    <IndicatorBar label="Long Score" value={result.longScore} max={100} color={COLORS.green} />
                    <IndicatorBar label="Short Score" value={result.shortScore} max={100} color={COLORS.red} />
                  </div>

                  {pulseData && <PulseBoltaHai stockData={pulseData} />}

                  {/* ANALYSIS CARD */}
                  <div style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${COLORS.surfaceBorder}` }}>
                      <span style={{ fontSize: 20, fontWeight: 800, color: COLORS.text }}>{stockName}</span>
                      <span style={{
                        fontSize: 13, fontWeight: 700, padding: '4px 12px', borderRadius: 20,
                        backgroundColor: trendColor === COLORS.green ? COLORS.greenLight : trendColor === COLORS.red ? COLORS.redLight : COLORS.goldLight,
                        color: trendColor,
                      }}>{result.trend}</span>
                    </div>
                    {[
                      ['Momentum (MACD)', result.momentum, result.momentum==='Bullish' ? COLORS.green : COLORS.red],
                      ['RSI', result.rsi, result.rsi > 70 ? COLORS.red : result.rsi < 30 ? COLORS.green : null],
                      ['ADX (Strength)', `${result.adx} (${result.trendStrength})`, null],
                      ['Supertrend', result.supertrend, result.supertrend==='Bullish' ? COLORS.green : COLORS.red],
                      ['Long Score', `${result.longScore} / 100`, COLORS.green],
                      ['Short Score', `${result.shortScore} / 100`, COLORS.red],
                    ].map(([label, value, color]) => (
                      <div key={label} style={rowStyle}>
                        <span style={{ color: COLORS.muted }}>{label}</span>
                        <span style={{ fontWeight: 700, color: color || COLORS.textSecondary }}>{value}</span>
                      </div>
                    ))}
                    <button onClick={() => {
                      const exists = watchlist.some(w => w.symbol === stockName);
                      setWatchlist(prev => exists ? prev.filter(w => w.symbol !== stockName) : [{ symbol: stockName, lastTrend: result.trend, lastPrice: result.lastClose, lastChecked: new Date().toISOString() }, ...prev].slice(0, 30));
                    }} style={{
                      width: '100%', marginTop: 14, padding: '9px',
                      fontSize: 13, fontWeight: 700, borderRadius: 10,
                      border: `1.5px solid ${COLORS.gold}`,
                      backgroundColor: 'transparent', color: COLORS.gold, cursor: 'pointer',
                    }}>
                      {watchlist.some(w => w.symbol === stockName) ? '⭐ Watchlist se hatao' : '☆ Watchlist mein add karo'}
                    </button>
                  </div>

                  {/* SIGNAL CARD */}
                  {result.signal ? (
                    <div style={{
                      backgroundColor: COLORS.surface,
                      border: `2px solid ${result.signal==='LONG' ? COLORS.green : COLORS.red}`,
                      borderRadius: 16, padding: 18, marginBottom: 16,
                      boxShadow: `0 4px 20px ${result.signal==='LONG' ? COLORS.green : COLORS.red}18`,
                    }}>
                      <div style={{
                        fontSize: 15, fontWeight: 800,
                        color: result.signal==='LONG' ? COLORS.green : COLORS.red,
                        backgroundColor: result.signal==='LONG' ? COLORS.greenLight : COLORS.redLight,
                        padding: '8px 14px', borderRadius: 10, marginBottom: 14,
                      }}>
                        {result.signal==='LONG' ? '📈 Bullish Setup' : '📉 Bearish Setup'}
                      </div>
                      {[
                        ['Entry', fmtINR(result.entry)],
                        ['Stop Loss', fmtINR(result.stopLoss)],
                        ['Target 1 (3%)', fmtINR(result.targets?.[0])],
                        ['Target 2 (6%)', fmtINR(result.targets?.[1])],
                        ['Target 3 (10%)', fmtINR(result.targets?.[2])],
                        ['Suggested Hold', result.suggestedHold],
                      ].map(([label, value]) => (
                        <div key={label} style={rowStyle}>
                          <span style={{ color: COLORS.muted }}>{label}</span>
                          <span style={{ fontWeight: 700, color: COLORS.text }}>{value}</span>
                        </div>
                      ))}
                      <button onClick={handleSendAlert} disabled={alertSending || alertSent} style={{
                        width: '100%', marginTop: 14, padding: '12px',
                        fontSize: 13, fontWeight: 700, borderRadius: 10, border: 'none',
                        backgroundColor: alertSent ? COLORS.green : COLORS.gold,
                        color: '#FFF', cursor: alertSent ? 'default' : 'pointer',
                        boxShadow: alertSent ? 'none' : '0 2px 10px rgba(200,146,10,0.25)',
                      }}>
                        {alertSent ? '✅ Alert Bhej Diya!' : alertSending ? '📨 Bhej rahe hain...' : '📧 Email Alert Bhejo'}
                      </button>
                    </div>
                  ) : (
                    <div style={{
                      backgroundColor: COLORS.surface, border: `1px dashed ${COLORS.surfaceBorder}`,
                      borderRadius: 16, padding: 18, marginBottom: 16,
                      fontSize: 13, color: COLORS.muted, textAlign: 'center',
                    }}>
                      ⏳ Abhi koi clear confluence signal nahi hai. Wait karo.
                    </div>
                  )}

                  {/* POSITION SIZING */}
                  <div style={cardStyle}>
                    <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.muted, marginBottom: 14, fontWeight: 700 }}>POSITION SIZING CALCULATOR</div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                      {['BUY','SELL'].map(d => (
                        <button key={d} onClick={() => setDirection(d)} style={{
                          flex: 1, padding: '9px', fontSize: 13, fontWeight: 700, borderRadius: 10, border: 'none',
                          backgroundColor: direction===d ? (d==='BUY' ? COLORS.green : COLORS.red) : COLORS.bg,
                          color: direction===d ? '#FFF' : COLORS.muted, cursor: 'pointer',
                        }}>{d}</button>
                      ))}
                    </div>
                    {[
                      ['Entry Price', fmtINR(ep)],
                      ['Stop Loss Price', fmtINR(stopLossPrice)],
                      ['Quantity', `${qty} shares`],
                      ['Max Loss', fmtINR(lossAmount)],
                      ['Risk:Reward (10%)', `1 : ${riskReward}`],
                    ].map(([label, value]) => (
                      <div key={label} style={rowStyle}>
                        <span style={{ color: COLORS.muted }}>{label}</span>
                        <span style={{ fontWeight: 700, color: COLORS.textSecondary }}>{value}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                      {tierResults.map(t => (
                        <div key={t.percent} style={{
                          flex: 1, backgroundColor: COLORS.goldLight, borderRadius: 12,
                          padding: '12px 8px', textAlign: 'center',
                          border: `1px solid ${COLORS.surfaceBorder}`,
                        }}>
                          <div style={{ fontSize: 10, color: COLORS.goldDim, fontWeight: 700 }}>T{TIERS.indexOf(t.percent)+1} ({t.percent}%)</div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.gold, marginTop: 2 }}>{fmtINR(t.price)}</div>
                          <div style={{ fontSize: 11, color: COLORS.green, fontWeight: 600 }}>+{fmtINR(t.profit)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* ── WATCHLIST TAB ── */}
          {tab === 'watchlist' && (
            <div style={cardStyle}>
              <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.muted, marginBottom: 16, fontWeight: 700 }}>WATCHLIST</div>
              {watchlist.length === 0 ? (
                <p style={{ color: COLORS.muted, fontSize: 13, textAlign: 'center', padding: '16px 0' }}>Abhi khaali hai. Check tab se add karo.</p>
              ) : watchlist.map(w => (
                <div key={w.symbol} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${COLORS.surfaceBorder}` }}>
                  <div>
                    <div style={{ fontWeight: 700, color: COLORS.text }}>{w.symbol}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <span style={{ fontSize: 12, color: COLORS.muted }}>{fmtINR(w.lastPrice)}</span>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '1px 8px', borderRadius: 12,
                        color: w.lastTrend === 'Bullish' ? COLORS.green : COLORS.red,
                        backgroundColor: w.lastTrend === 'Bullish' ? COLORS.greenLight : COLORS.redLight,
                      }}>{w.lastTrend}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { setTab('check'); handleSearch(w.symbol); }} style={{ fontSize: 12, padding: '7px 14px', borderRadius: 8, border: 'none', backgroundColor: COLORS.gold, color: '#FFF', cursor: 'pointer', fontWeight: 700 }}>Check</button>
                    <button onClick={() => setWatchlist(prev => prev.filter(x => x.symbol !== w.symbol))} style={{ fontSize: 12, padding: '7px 12px', borderRadius: 8, border: `1.5px solid ${COLORS.surfaceBorder}`, backgroundColor: 'transparent', color: COLORS.red, cursor: 'pointer', fontWeight: 700 }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── TRACK RECORD TAB ── */}
          {tab === 'track' && (
            <div style={cardStyle}>
              <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.muted, marginBottom: 12, fontWeight: 700 }}>TRACK RECORD</div>

              {/* Win/Loss summary tiles */}
              {history.length > 0 && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  {[
                    ['Wins', history.filter(h=>h.outcome==='win').length, COLORS.green, COLORS.greenLight],
                    ['Losses', history.filter(h=>h.outcome==='loss').length, COLORS.red, COLORS.redLight],
                    ['Pending', history.filter(h=>h.outcome==='pending').length, COLORS.gold, COLORS.goldLight],
                  ].map(([l, v, c, bg]) => (
                    <div key={l} style={{ flex: 1, backgroundColor: bg, borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: c }}>{v}</div>
                      <div style={{ fontSize: 11, color: c, fontWeight: 700 }}>{l}</div>
                    </div>
                  ))}
                </div>
              )}

              {history.length === 0 ? (
                <p style={{ color: COLORS.muted, fontSize: 13, textAlign: 'center', padding: '16px 0' }}>Abhi koi history nahi hai.</p>
              ) : history.map(h => (
                <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${COLORS.surfaceBorder}` }}>
                  <div>
                    <div style={{ fontWeight: 700, color: COLORS.text }}>{h.symbol}</div>
                    <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>{fmtINR(h.price)} • {h.trend}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['win','loss','pending'].map(o => (
                      <button key={o} onClick={() => setHistory(prev => prev.map(x => x.id===h.id ? {...x, outcome: o} : x))} style={{
                        fontSize: 11, padding: '5px 10px', borderRadius: 8, border: 'none',
                        backgroundColor: h.outcome===o ? (o==='win' ? COLORS.green : o==='loss' ? COLORS.red : COLORS.gold) : COLORS.bg,
                        color: h.outcome===o ? '#FFF' : COLORS.muted,
                        cursor: 'pointer', fontWeight: 700,
                      }}>
                        {o==='win' ? '✓' : o==='loss' ? '✗' : '⏳'}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── FOOTER ── */}
          <div style={{ textAlign: 'center', marginTop: 32, paddingTop: 16, borderTop: `1px solid ${COLORS.surfaceBorder}`, display: 'flex', justifyContent: 'center', gap: 24, fontSize: 12 }}>
            <a href="/terms" style={{ color: COLORS.muted, textDecoration: 'none', fontWeight: 600 }}>Terms</a>
            <a href="/refund" style={{ color: COLORS.muted, textDecoration: 'none', fontWeight: 600 }}>Refund Policy</a>
            <a href="/contact" style={{ color: COLORS.muted, textDecoration: 'none', fontWeight: 600 }}>Contact</a>
          </div>
        </div>
      </div>
    </div>
  );
}
