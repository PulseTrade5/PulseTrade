import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import { analyzeStock } from './technicalAnalysis';
import SubscribeButton from './SubscribeButton';
import PulseBoltaHai from '../PulseBoltaHai';
import MoodTracker from './MoodTracker';
import SupportChat from './SupportChat';
import GlobalMarkets from './GlobalMarkets';
import FearGreedMeter from './FearGreedMeter';
import PulseScreener from './PulseScreener.jsx';
import NumerologyPanel from './NumerologyPanel';
import NumerologyInsightCard from './components/NumerologyInsightCard';

const LIGHT = {
  bg: "#F4F6FA", surface: "#FFFFFF", surfaceBorder: "#E2E8F0", surfaceHover: "#F8FAFC",
  gold: "#F59E0B", goldLight: "#FFFBEB", goldDim: "#D97706",
  blue: "#1E3A5F", blueLight: "#EFF6FF",
  green: "#059669", greenLight: "#ECFDF5",
  red: "#DC2626", redLight: "#FEF2F2",
  text: "#0F172A", textSecondary: "#334155", muted: "#64748B", mutedLight: "#94A3B8",
  headerBg: "#1E3A5F", sebi: "#1E3A5F", sebiBg: "#EFF6FF", sebiBorder: "#BFDBFE",
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

// ✅ SESSION PERSISTENCE HELPERS
// Saves/restores dashboard state across Chrome tab reloads (mobile Chrome on phones
// like OnePlus/Xiaomi aggressively kills background tabs to save RAM — localStorage
// survives that, unlike React state or sessionStorage on some devices).
// Keys are scoped per-user so switching accounts on a shared device doesn't leak data.
function getStoragePrefix(userId) {
  return `pulsetrade_dash_${userId || 'guest'}_`;
}

function saveToSession(key, value, userId) {
  try {
    if (value === undefined) return;
    localStorage.setItem(getStoragePrefix(userId) + key, JSON.stringify(value));
  } catch (e) {
    // localStorage can fail in private/incognito mode or when full — fail silently
  }
}

function loadFromSession(key, fallback, userId) {
  try {
    const raw = localStorage.getItem(getStoragePrefix(userId) + key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

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

function WaveBar({ dark }) {
  const goldColor = dark ? '#D8A33D' : '#C8920A';
  const greenColor = dark ? '#3FAE7C' : '#059669';
  const bgColor = dark ? '#161B22' : '#FFFFFF';
  return (
    <div style={{ backgroundColor: bgColor, overflow: 'hidden', height: 32, lineHeight: 0 }}>
      <style>{`@keyframes wave-move { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }`}</style>
      <svg viewBox="0 0 2880 32" preserveAspectRatio="none" style={{ display: 'block', width: '200%', height: 32, animation: 'wave-move 4s linear infinite' }}>
        <path d="M0,16 C180,32 360,0 540,16 C720,32 900,0 1080,16 C1260,32 1440,0 1440,16 C1620,32 1800,0 1980,16 C2160,32 2340,0 2520,16 C2700,32 2880,0 2880,16 L2880,32 L0,32 Z" fill={goldColor} opacity="0.15"/>
        <path d="M0,20 C180,4 360,28 540,20 C720,4 900,28 1080,20 C1260,4 1440,28 1440,20 C1620,4 1800,28 1980,20 C2160,4 2340,28 2520,20 C2700,4 2880,28 2880,20 L2880,32 L0,32 Z" fill={greenColor} opacity="0.1"/>
      </svg>
    </div>
  );
}

function LiveDot({ C }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <style>{`@keyframes live-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.3)} }`}</style>
      <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#059669', animation: 'live-pulse 1.5s ease-in-out infinite', boxShadow: '0 0 6px #059669' }} />
      <span style={{ fontSize: 10, fontWeight: 700, color: '#059669' }}>Live</span>
    </div>
  );
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
      background: gradientBg, borderRadius: 20, padding: '24px 20px', marginBottom: 16,
      border: `1.5px solid ${borderColor}`, boxShadow: `0 8px 32px ${accentColor}33`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', letterSpacing: '-0.5px' }}>{stockName}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{stockInfo?.longName || stockName}</div>
        </div>
        <div style={{ fontSize: 12, fontWeight: 800, padding: '6px 14px', borderRadius: 20, backgroundColor: accentColor, color: '#FFF' }}>
          {isBullish ? '🟢 BULLISH' : '🔴 BEARISH'}
        </div>
      </div>
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
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 700, letterSpacing: 1 }}>⚡ PULSE SCORE</span>
          <span style={{ fontSize: 16, fontWeight: 900, color: accentColor }}>{score}/100</span>
        </div>
        <div style={{ height: 10, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${score}%`,
            background: isBullish ? 'linear-gradient(90deg, #059669, #34D399)' : 'linear-gradient(90deg, #DC2626, #FCA5A5)',
            borderRadius: 99, transition: 'width 1.2s ease',
          }} />
        </div>
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginTop: 16, padding: '8px 12px', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 10 }}>
        {isBullish ? score >= 70 ? '🔥 Strong Bullish — Momentum bahut strong hai!' : '⚡ Moderate Bullish — Cautiously optimistic raho'
          : score >= 70 ? '❄️ Strong Bearish — Selling pressure strong hai!' : '⚡ Moderate Bearish — Dhyan se dekho'}
      </div>
    </div>
  );
}

function AITradeCoach({ stockData, C, isDark }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCoach, setShowCoach] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [chartMode, setChartMode] = useState('text');
  const [chartImage, setChartImage] = useState(null);
  const [chartAnalysis, setChartAnalysis] = useState('');
  const [chartLoading, setChartLoading] = useState(false);

  const handleChartUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result.split(',')[1];
      setChartImage(base64);
      setChartAnalysis('');
    };
    reader.readAsDataURL(file);
  };

  const analyzeChart = async () => {
    if (!chartImage) return;
    setChartLoading(true);
    setChartAnalysis('');
    try {
      const response = await fetch('/api/ai-vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData: chartImage })
      });
      const data = await response.json();
      setChartAnalysis(data.analysis || 'Analysis nahi ho saki');
    } catch {
      setChartAnalysis('Network error — dobara try karo!');
    }
    setChartLoading(false);
  };

  const speakAnswer = (text) => {
    if (!text) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/\*\*/g, '').replace(/\*/g, '');
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = 'hi-IN';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  const askCoach = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer('');
    try {
      const context = stockData ? `Stock: ${stockData.symbol}, Trend: ${stockData.trend}, RSI: ${stockData.rsi}, ADX: ${stockData.adx}, Pulse Score: ${stockData.trend === 'Bullish' ? stockData.longScore : stockData.shortScore}/100, Price: ₹${stockData.currentPrice}` : '';
      const response = await fetch('/api/ai-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, context })
      });
      const data = await response.json();
      setAnswer(data.answer || 'Kuch gadbad ho gayi — dobara try karo!');
    } catch {
      setAnswer('Network error — dobara try karo!');
    }
    setLoading(false);
  };

  if (!showCoach) return (
    <button onClick={() => setShowCoach(true)} style={{
      width: '100%', padding: '12px', marginBottom: 16,
      background: isDark ? 'linear-gradient(135deg, #1a1400, #161B22)' : 'linear-gradient(135deg, #FEF3C7, #FFFFFF)',
      border: `1.5px solid ${C.gold}`, borderRadius: 14,
      fontSize: 14, fontWeight: 700, color: C.gold,
      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    }}>
      🤖 AI Trade Coach Se Pucho
    </button>
  );

  return (
    <div style={{
      backgroundColor: C.surface, border: `1.5px solid ${C.gold}`,
      borderRadius: 16, padding: 18, marginBottom: 16,
      boxShadow: `0 4px 20px ${C.gold}22`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: C.gold, fontWeight: 800 }}>🤖 AI TRADE COACH</div>
        <button onClick={() => setShowCoach(false)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 16 }}>✕</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {[['text', '💬 Sawaal Pucho'], ['chart', '📸 Chart Analyze']].map(([m, l]) => (
          <button key={m} onClick={() => setChartMode(m)} style={{
            flex: 1, padding: '8px', borderRadius: 10, border: 'none',
            backgroundColor: chartMode === m ? C.gold : C.bg,
            color: chartMode === m ? '#FFF' : C.muted,
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
            border: `1.5px solid ${chartMode === m ? C.gold : C.surfaceBorder}`,
          }}>{l}</button>
        ))}
      </div>

      {chartMode === 'chart' && (
        <div>
          <label style={{
            display: 'block', width: '100%', padding: '20px',
            border: `2px dashed ${C.gold}`, borderRadius: 12,
            textAlign: 'center', cursor: 'pointer', marginBottom: 12,
            backgroundColor: C.bg,
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📸</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.gold }}>Chart Screenshot Upload Karo</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>TradingView ya koi bhi chart</div>
            <input type="file" accept="image/*" onChange={handleChartUpload} style={{ display: 'none' }} />
          </label>
          {chartImage && (
            <>
              <img src={`data:image/jpeg;base64,${chartImage}`} style={{ width: '100%', borderRadius: 10, marginBottom: 10 }} alt="chart" />
              <button onClick={analyzeChart} disabled={chartLoading} style={{
                width: '100%', padding: '12px', borderRadius: 10, border: 'none',
                backgroundColor: chartLoading ? C.surfaceBorder : C.gold,
                color: chartLoading ? C.muted : '#FFF',
                fontWeight: 700, fontSize: 14, cursor: chartLoading ? 'not-allowed' : 'pointer',
              }}>
                {chartLoading ? '⏳ AI Analyze kar raha hai...' : '🔍 Chart Analyze Karo'}
              </button>
            </>
          )}
          {chartAnalysis && (
            <div style={{
              marginTop: 12, padding: '12px 14px', borderRadius: 12,
              backgroundColor: isDark ? 'rgba(216,163,61,0.08)' : '#FFFBEB',
              border: `1px solid ${C.gold}44`,
              fontSize: 13, color: C.text, lineHeight: 1.7,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: C.gold, fontWeight: 700 }}>🤖 AI Analysis:</span>
                <button onClick={() => speakAnswer(chartAnalysis)} style={{
                  padding: '4px 10px', borderRadius: 20, border: 'none',
                  backgroundColor: C.gold, color: '#FFF', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                }}>🔊 Suno</button>
              </div>
              <div>{chartAnalysis.replace(/\*\*/g, '').replace(/\*/g, '').replace(/##/g, '').replace(/^\s+/gm, '')}</div>
            </div>
          )}
        </div>
      )}

      {chartMode === 'text' && (
        <div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {['Aaj entry loon?', 'Stop loss kahan?', 'Risk kitna?', 'Trend kitna strong?'].map(q => (
              <button key={q} onClick={() => setQuestion(q)} style={{
                fontSize: 11, padding: '5px 12px', borderRadius: 20,
                border: `1px solid ${C.surfaceBorder}`,
                backgroundColor: question === q ? C.goldLight : 'transparent',
                color: question === q ? C.goldDim : C.muted,
                cursor: 'pointer', fontWeight: 600,
              }}>{q}</button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && askCoach()}
              placeholder="Kuch bhi pucho — Hinglish mein!"
              style={{
                flex: 1, padding: '10px 14px', fontSize: 13,
                backgroundColor: C.bg, border: `1.5px solid ${C.surfaceBorder}`,
                borderRadius: 10, color: C.text, outline: 'none',
              }}
            />
            <button onClick={askCoach} disabled={loading} style={{
              padding: '10px 16px', borderRadius: 10, border: 'none',
              backgroundColor: C.gold, color: '#FFF',
              fontWeight: 700, fontSize: 13, cursor: 'pointer',
              opacity: loading ? 0.7 : 1,
            }}>
              {loading ? '⏳' : '➤'}
            </button>
          </div>

          {answer && (
            <div style={{
              padding: '12px 14px', borderRadius: 12,
              backgroundColor: isDark ? 'rgba(216,163,61,0.08)' : '#FFFBEB',
              border: `1px solid ${C.gold}44`,
              fontSize: 13, color: C.text, lineHeight: 1.7,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ color: C.gold, fontWeight: 700 }}>🤖 Coach:</span>
                <button onClick={() => speaking ? stopSpeaking() : speakAnswer(answer)} style={{
                  padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  backgroundColor: speaking ? '#DC2626' : C.gold,
                  color: '#FFF', fontSize: 11, fontWeight: 700,
                }}>
                  {speaking ? '⏹️ Roko' : '🔊 Suno'}
                </button>
              </div>
              <div>{answer.replace(/\*\*/g, '').replace(/\*/g, '')}</div>
            </div>
          )}
        </div>
      )}

      <div style={{ fontSize: 10, color: C.muted, marginTop: 10, textAlign: 'center' }}>
        ⚠️ Sirf educational — investment advice nahi
      </div>
    </div>
  );
}

function PulseOracle({ userDob, isDark, C }) {
  const [oracle, setOracle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [shown, setShown] = useState(false);

  const getOracle = async () => {
    if (!userDob) { alert('Pehle profile mein DOB add karo!'); return; }
    setLoading(true);
    try {
      const today = new Date();
      const dayName = ['Raviwar','Somwar','Mangalwar','Budhwar','Guruwar','Shukrawar','Shaniwar'][today.getDay()];
      const digits = userDob.replace(/-/g, '').split('').map(Number);
      let lp = digits.reduce((a,b) => a+b, 0);
      while (lp > 9 && lp !== 11 && lp !== 22) lp = String(lp).split('').map(Number).reduce((a,b)=>a+b,0);

      const response = await fetch('/api/ai-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: `Aaj ${dayName} hai. Mera Life Path Number ${lp} hai. Aaj ${today.toLocaleDateString('en-IN')} ko mera trading din kaisa rahega? 3-4 lines mein Hinglish mein bata: 1) Din kaisa hai (Excellent/Good/Average/Avoid) 2) Best trading time 3) Lucky sector 4) Ek warning. Fun aur motivating rakho!`,
          context: `Life Path: ${lp}, Day: ${dayName}, Date: ${today.toLocaleDateString('en-IN')}`
        })
      });
      const data = await response.json();
      setOracle(data.answer || 'Oracle ne jawab nahi diya!');
      setShown(true);
    } catch {
      setOracle('Network error — dobara try karo!');
    }
    setLoading(false);
  };

  const speakOracle = () => {
    if (!oracle) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(oracle.replace(/\*\*/g, '').replace(/\*/g, ''));
    utterance.lang = 'hi-IN';
    utterance.rate = 0.9;
    setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div style={{
      background: isDark
        ? 'linear-gradient(135deg, #0D0A1A, #1A0D2E)'
        : 'linear-gradient(135deg, #F5F0FF, #FFFFFF)',
      border: '1.5px solid #7C3AED',
      borderRadius: 16, padding: 18, marginBottom: 16,
      boxShadow: '0 4px 20px rgba(124,58,237,0.15)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 2, color: '#7C3AED', fontWeight: 800 }}>🔮 PULSE ORACLE</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{dateStr}</div>
        </div>
        {oracle && (
          <button onClick={speakOracle} style={{
            padding: '5px 12px', borderRadius: 20, border: 'none',
            backgroundColor: speaking ? '#DC2626' : '#7C3AED',
            color: '#FFF', fontSize: 11, fontWeight: 700, cursor: 'pointer',
          }}>
            {speaking ? '⏹️ Roko' : '🔊 Suno'}
          </button>
        )}
      </div>

      {!shown ? (
        <button onClick={getOracle} disabled={loading} style={{
          width: '100%', padding: '14px', borderRadius: 12, border: 'none',
          background: loading ? C.surfaceBorder : 'linear-gradient(135deg, #7C3AED, #A78BFA)',
          color: loading ? C.muted : '#FFF',
          fontSize: 14, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: loading ? 'none' : '0 4px 20px rgba(124,58,237,0.3)',
        }}>
          {loading ? '🔮 Oracle dekh raha hai...' : '🔮 Aaj Ka Prediction Dekho'}
        </button>
      ) : (
        <div>
          <div style={{
            padding: '14px', borderRadius: 12,
            backgroundColor: isDark ? 'rgba(124,58,237,0.1)' : 'rgba(124,58,237,0.06)',
            border: '1px solid rgba(124,58,237,0.2)',
            fontSize: 13, color: C.text, lineHeight: 1.8,
          }}>
            {oracle.replace(/\*\*/g, '').replace(/\*/g, '').replace(/##/g, '')}
          </div>
          <button onClick={() => { setShown(false); setOracle(null); }} style={{
            width: '100%', marginTop: 10, padding: '8px',
            backgroundColor: 'transparent', border: `1px solid rgba(124,58,237,0.3)`,
            borderRadius: 8, color: '#7C3AED', fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}>🔄 Dobara Dekho</button>
        </div>
      )}

      <div style={{ fontSize: 10, color: C.muted, marginTop: 10, textAlign: 'center' }}>
        ✨ Sirf entertainment — investment advice nahi
      </div>
    </div>
  );
}

function ReferralCard({ user, C }) {
  const [refCode, setRefCode] = useState(null);
  const [copied, setCopied] = useState(false);
  const [refCount, setRefCount] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    supabase.from('profiles').select('referral_code, referral_count').eq('id', user.id).single()
      .then(({ data }) => {
        if (data?.referral_code) { setRefCode(data.referral_code); setRefCount(data.referral_count || 0); }
      });
  }, [user?.id]);

  const refLink = refCode ? `pulsetrade.in?ref=${refCode}` : null;
  const handleCopy = () => {
    if (!refLink) return;
    navigator.clipboard.writeText(`https://${refLink}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ backgroundColor: C.surface, border: `1px solid ${C.surfaceBorder}`, borderRadius: 16, padding: 18, marginBottom: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
      <div style={{ fontSize: 10, letterSpacing: 2, color: C.muted, marginBottom: 14, fontWeight: 700 }}>🔗 MERA REFERRAL LINK</div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 12, lineHeight: 1.6 }}>
        Dost ko invite karo → <span style={{ color: C.gold, fontWeight: 700 }}>tujhe +100 pts</span>, unhe <span style={{ color: C.green, fontWeight: 700 }}>+50 pts</span>! 🎁
      </div>
      {refLink ? (
        <>
          <div style={{ backgroundColor: C.bg, border: `1.5px solid ${C.surfaceBorder}`, borderRadius: 10, padding: '10px 14px', marginBottom: 10, fontSize: 13, fontWeight: 700, color: C.text, fontFamily: 'monospace', wordBreak: 'break-all' }}>{refLink}</div>
          <button onClick={handleCopy} style={{ width: '100%', padding: '11px', borderRadius: 10, border: 'none', backgroundColor: copied ? C.green : C.gold, color: '#FFF', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'background 0.3s' }}>
            {copied ? '✅ Link Copy Ho Gaya!' : '📋 Link Copy Karo'}
          </button>
          <div style={{ textAlign: 'center', fontSize: 12, color: C.muted, marginTop: 10 }}>
            🎯 <span style={{ color: C.gold, fontWeight: 700 }}>{refCount}</span> dost join kiya abhi tak!
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', fontSize: 12, color: C.muted, padding: '10px 0' }}>⏳ Referral code load ho raha hai...</div>
      )}
    </div>
  );
}

// ✅ NUMEROLOGY HELPERS
const CHALDEAN_MAP = {
  A:1,I:1,J:1,Q:1,Y:1, B:2,K:2,R:2, C:3,G:3,L:3,S:3,
  D:4,M:4,T:4, E:5,H:5,N:5,X:5, U:6,V:6,W:6, O:7,Z:7, F:8,P:8,
};
function getChaldeanNum(name) {
  if (!name) return null;
  let sum = name.toUpperCase().replace(/[^A-Z]/g, '').split('').reduce((a, c) => a + (CHALDEAN_MAP[c] || 0), 0);
  while (sum > 9 && sum !== 11 && sum !== 22) sum = String(sum).split('').map(Number).reduce((a,b)=>a+b,0);
  return sum;
}
function getLifePathNum(dob) {
  if (!dob) return null;
  let sum = dob.replace(/-/g,'').split('').map(Number).reduce((a,b)=>a+b,0);
  while (sum > 9 && sum !== 11 && sum !== 22) sum = String(sum).split('').map(Number).reduce((a,b)=>a+b,0);
  return sum;
}
const NUM_COMPATIBLE = {
  1:[1,3,5,9], 2:[2,4,6,8], 3:[1,3,6,9], 4:[2,4,8],
  5:[1,5,6,9], 6:[3,5,6,9], 7:[2,7], 8:[2,4,8], 9:[1,3,5,9],
  11:[1,2,11], 22:[4,8,22],
};
function isNumerologyMatch(userNum, stockName) {
  if (!userNum || !stockName) return false;
  const stockNum = getChaldeanNum(stockName);
  const list = NUM_COMPATIBLE[userNum] || [];
  return list.includes(stockNum) || stockNum === userNum;
}

// ✅ COMBO SIGNAL COMPONENT
function ComboSignal({ result, stockName, userDob, isDark, C }) {
  const lpn = getLifePathNum(userDob);
  if (!lpn || !result) return null;
  const stockNum = getChaldeanNum(stockName);
  const isMatch = isNumerologyMatch(lpn, stockName);
  const isBullish = result.trend === 'Bullish';
  const techScore = isBullish ? result.longScore : result.shortScore;
  const comboScore = isMatch ? Math.min(100, Math.round(techScore * 1.2)) : Math.round(techScore * 0.85);
  const isDoubleConfirmed = isMatch && isBullish;
  const isWeakSignal = !isMatch || !isBullish;

  return (
    <div style={{
      background: isDoubleConfirmed
        ? isDark ? 'linear-gradient(135deg, #1a1a00, #0D2B1F)' : 'linear-gradient(135deg, #FFFBEB, #ECFDF5)'
        : isDark ? 'linear-gradient(135deg, #1a0a00, #161B22)' : 'linear-gradient(135deg, #FEF2F2, #F8FAFC)',
      border: `2px solid ${isDoubleConfirmed ? '#D8A33D' : '#374151'}`,
      borderRadius: 20, padding: 20, marginBottom: 16,
      boxShadow: isDoubleConfirmed ? '0 8px 32px rgba(216,163,61,0.2)' : 'none',
    }}>
      {/* Badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: isDoubleConfirmed
          ? 'linear-gradient(135deg, #D8A33D, #F59E0B)'
          : '#374151',
        color: isDoubleConfirmed ? '#0D1117' : '#8B92A0',
        padding: '6px 16px', borderRadius: 20,
        fontSize: 11, fontWeight: 900, letterSpacing: 1,
        marginBottom: 14,
      }}>
        {isDoubleConfirmed ? '🔥 DOUBLE CONFIRMED SIGNAL' : '⚠️ WEAK SIGNAL — CAREFUL'}
      </div>

      {/* Stock + Numbers */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: C.text }}>{stockName}</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
            Stock Number: #{stockNum} | Tera Number: #{lpn}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: isMatch ? '#D8A33D' : C.muted, fontWeight: 700 }}>
            {isMatch ? '⭐ Lucky Match!' : '❌ No Match'}
          </div>
        </div>
      </div>

      {/* Signal boxes */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <div style={{
          flex: 1, borderRadius: 12, padding: '12px 10px', textAlign: 'center',
          background: isBullish ? 'rgba(63,174,124,0.15)' : 'rgba(248,113,113,0.15)',
          border: `1px solid ${isBullish ? 'rgba(63,174,124,0.3)' : 'rgba(248,113,113,0.3)'}`,
        }}>
          <div style={{ fontSize: 20, marginBottom: 4 }}>📊</div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: isBullish ? '#3FAE7C' : '#F87171', marginBottom: 4 }}>TECHNICAL</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>{isBullish ? '🟢 Bullish' : '🔴 Bearish'}</div>
          <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>Score: {techScore}/100</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', fontSize: 20, color: isMatch ? '#D8A33D' : '#374151', fontWeight: 900 }}>
          {isMatch ? '+' : '≠'}
        </div>

        <div style={{
          flex: 1, borderRadius: 12, padding: '12px 10px', textAlign: 'center',
          background: isMatch ? 'rgba(167,139,250,0.15)' : 'rgba(55,65,81,0.3)',
          border: `1px solid ${isMatch ? 'rgba(167,139,250,0.3)' : '#374151'}`,
          opacity: isMatch ? 1 : 0.6,
        }}>
          <div style={{ fontSize: 20, marginBottom: 4 }}>🔢</div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: '#A78BFA', marginBottom: 4 }}>NUMEROLOGY</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>{isMatch ? '✅ Match' : 'No Match'}</div>
          <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>#{stockNum} ↔ #{lpn}</div>
        </div>
      </div>

      {/* Combo Score */}
      <div style={{
        background: isDoubleConfirmed ? 'rgba(216,163,61,0.1)' : 'rgba(55,65,81,0.2)',
        border: `1px solid ${isDoubleConfirmed ? 'rgba(216,163,61,0.3)' : '#374151'}`,
        borderRadius: 12, padding: '12px 16px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 12,
      }}>
        <div>
          <div style={{ fontSize: 11, color: isDoubleConfirmed ? '#D8A33D' : C.muted, fontWeight: 700 }}>⚡ COMBO PULSE SCORE</div>
          <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>Technical + Numerology combined</div>
        </div>
        <div style={{ fontSize: 24, fontWeight: 900, color: isDoubleConfirmed ? '#D8A33D' : C.muted }}>
          {comboScore}/100 {isDoubleConfirmed ? '🔥' : ''}
        </div>
      </div>

      {/* Message */}
      <div style={{
        background: isDoubleConfirmed ? 'rgba(63,174,124,0.1)' : 'rgba(248,113,113,0.1)',
        borderLeft: `3px solid ${isDoubleConfirmed ? '#3FAE7C' : '#F87171'}`,
        borderRadius: '0 10px 10px 0', padding: '10px 14px',
        fontSize: 13, color: C.text, lineHeight: 1.6, fontWeight: 600,
      }}>
        {isDoubleConfirmed
          ? `🎯 ${stockName} aaj ke liye perfect hai! Technical trend bullish hai aur numerology bhi confirm kar raha hai — high confidence trade!`
          : isMatch && !isBullish
          ? `⚠️ ${stockName} tera lucky stock hai lekin technical trend weak hai — abhi entry mat lo!`
          : `❌ ${stockName} ke dono signals match nahi karte — is trade se door raho ya SL tight rakho!`
        }
      </div>
    </div>
  );
}

export default function StockDashboard({ user, isDark, onTabChange, defaultTab }) {
  const dark = isDark ?? false;
  const C = dark ? DARK : LIGHT;

  // ✅ All of these are lazily initialized from sessionStorage so that if Chrome
  // kills/reloads this tab (common on mobile when switching apps), the dashboard
  // restores exactly where the user left off instead of resetting to the front page.
  const uid = user?.id;
  const [symbolInput, setSymbolInput] = useState(() => loadFromSession('symbolInput', '', uid));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(() => loadFromSession('result', null, uid));
  const [stockInfo, setStockInfo] = useState(() => loadFromSession('stockInfo', null, uid));
  const [stockName, setStockName] = useState(() => loadFromSession('stockName', '', uid));
  const [tab, setTab] = useState(() => loadFromSession('tab', defaultTab || 'check', uid));
  const [watchlist, setWatchlist] = useState(() => loadFromSession('watchlist', [], uid));
  const [history, setHistory] = useState(() => loadFromSession('history', [], uid));
  const [sizingMode, setSizingMode] = useState('risk');
  const [quantity, setQuantity] = useState(10);
  const [riskAmount, setRiskAmount] = useState(1000);
  const [slPercent, setSlPercent] = useState(3);
  const [entryPrice, setEntryPrice] = useState(() => loadFromSession('entryPrice', 0, uid));
  const [direction, setDirection] = useState(() => loadFromSession('direction', 'BUY', uid));
  const [alertSent, setAlertSent] = useState(false);
  const [alertSending, setAlertSending] = useState(false);
  const [pulseData, setPulseData] = useState(() => loadFromSession('pulseData', null, uid));
  const [userDob, setUserDob] = useState(null);
  const [showSupport, setShowSupport] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // ✅ Persist to sessionStorage whenever these change
  useEffect(() => { saveToSession('symbolInput', symbolInput, uid); }, [symbolInput, uid]);
  useEffect(() => { saveToSession('result', result, uid); }, [result, uid]);
  useEffect(() => { saveToSession('stockInfo', stockInfo, uid); }, [stockInfo, uid]);
  useEffect(() => { saveToSession('stockName', stockName, uid); }, [stockName, uid]);
  useEffect(() => { saveToSession('tab', tab, uid); }, [tab, uid]);
  useEffect(() => { saveToSession('watchlist', watchlist, uid); }, [watchlist, uid]);
  useEffect(() => { saveToSession('history', history, uid); }, [history, uid]);
  useEffect(() => { saveToSession('entryPrice', entryPrice, uid); }, [entryPrice, uid]);
  useEffect(() => { saveToSession('direction', direction, uid); }, [direction, uid]);
  useEffect(() => { saveToSession('pulseData', pulseData, uid); }, [pulseData, uid]);

  const startVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Tera browser voice search support nahi karta — Chrome use karo!');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;
    setIsListening(true);
    recognition.start();
    recognition.onresult = (event) => {
      const results = event.results[0];
      let transcript = '';
      for (let i = 0; i < results.length; i++) {
        transcript = results[i].transcript.toUpperCase();
        const stockMatch = transcript.match(/\b(RELIANCE|TCS|INFY|HDFCBANK|SBIN|TATAMOTORS|ICICIBANK|ITC|WIPRO|AXISBANK|KOTAKBANK|LT|SUNPHARMA|BAJFINANCE|MARUTI|ULTRACEMCO|TITAN|NESTLEIND|POWERGRID|ONGC|[A-Z]{2,10})\b/);
        if (stockMatch) { transcript = stockMatch[1]; break; }
      }
      setSymbolInput(transcript.trim());
      handleSearch(transcript.trim());
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
  };

  useEffect(() => {
    if (!user?.id) return;
    supabase.from('profiles').select('dob').eq('id', user.id).single()
      .then(({ data }) => { if (data?.dob) setUserDob(data.dob); });
  }, [user?.id]);

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
          background: dark
            ? 'linear-gradient(135deg, #161B22 0%, #1a1400 100%)'
            : 'linear-gradient(135deg, #1E3A5F 0%, #2D5A8E 100%)',
          borderBottom: `1px solid ${C.surfaceBorder}`,
          padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 8px rgba(0,0,0,0.08)',
          transition: 'all 0.3s ease',
        }}>
          <div>
            <div style={{ fontSize: 11, color: dark ? C.gold : '#F59E0B', fontWeight: 700, letterSpacing: 0.3 }}>श्री गणेशाय नमः</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: '-0.5px', color: dark ? C.text : '#fff' }}>
              Pulse<span style={{ color: C.gold }}>Trade</span>
            </h1>
            <div style={{ fontSize: 10, color: dark ? C.muted : 'rgba(255,255,255,0.6)', marginTop: 1 }}>🔱 हर हर महादेव 🔱</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <LiveDot C={C} />
            <button onClick={() => setShowSupport(true)} style={{
              fontSize: 11, padding: '5px 10px', borderRadius: 20,
              border: `1.5px solid ${dark ? C.surfaceBorder : 'rgba(255,255,255,0.3)'}`,
              backgroundColor: dark ? 'transparent' : 'rgba(255,255,255,0.1)',
              color: dark ? C.muted : '#fff', cursor: 'pointer', fontWeight: 700,
            }}>💬 Hum Se Baat Karo</button>
            {user?.email === 'prabhat3300@gmail.com' && (
              <a href="/admin" style={{
                fontSize: 11, padding: '5px 10px', borderRadius: 20,
                border: `1.5px solid ${C.gold}`, backgroundColor: C.goldLight,
                color: C.goldDim, cursor: 'pointer', fontWeight: 700, textDecoration: 'none',
              }}>⚙️ Admin</a>
            )}
          </div>
        </div>

        <WaveBar dark={dark} />

        <style>{`@keyframes shimmer-line { 0%{background-position:-200% center} 100%{background-position:200% center} }`}</style>
        <div style={{
          height: 3,
          background: 'linear-gradient(90deg, #C8920A, #3FAE7C, #C8920A)',
          backgroundSize: '200% auto',
          animation: 'shimmer-line 3s linear infinite',
        }} />

        <div style={{ padding: '20px 20px 0' }}>
          <p style={{ fontSize: 13, color: C.muted, margin: '0 0 16px' }}>Bazaar ka pulse dekho, faisla khud karo.</p>

          {/* TABS */}
          <div style={{
            display: 'flex', gap: 4, marginBottom: 20,
            backgroundColor: C.surface, padding: 4,
            borderRadius: 14, border: `1px solid ${C.surfaceBorder}`,
            overflowX: 'auto',
          }}>
            {[
              ['check','🔍 Check'],
              ['watchlist','⭐ Watch'],
              ['track','📋 Record'],
              ['screener','🚀 Screener'],
              ['numerology','🔢 Numero'],
            ].map(([key,label]) => (
              <button key={key} onClick={() => setTab(key)} style={{
                flex: 1, padding: '8px 4px', fontSize: 11, fontWeight: 700,
                borderRadius: 10, border: 'none', whiteSpace: 'nowrap',
                backgroundColor: tab===key ? (dark ? C.gold : '#1E3A5F') : 'transparent',
                color: tab===key ? '#FFF' : C.muted,
                cursor: 'pointer', transition: 'background 0.2s',
              }}>{label}</button>
            ))}
          </div>

          {/* SUBSCRIBE */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <SubscribeButton userEmail={user?.email} userId={user?.id} />
          </div>

          {tab === 'check' && (
            <>
              <NumerologyInsightCard isDark={dark} C={C} />
              <GlobalMarkets isDark={dark} />
              <FearGreedMeter isDark={dark} />
              <PulseOracle userDob={userDob} isDark={dark} C={C} />

              <div style={cardStyle}>
                <label style={{ fontSize: 10, letterSpacing: 2, color: C.muted, display: 'block', marginBottom: 8, fontWeight: 700 }}>STOCK SYMBOL YA NAAM</label>
                <div style={{ position: 'relative', display: 'flex', gap: 8 }}>
                  <input value={symbolInput} onChange={e => setSymbolInput(e.target.value)} onKeyDown={e => e.key==='Enter' && handleSearch()} placeholder="e.g. RELIANCE, TCS" style={{...inputStyle, flex: 1}} />
                  <button onClick={startVoiceSearch} style={{
                    padding: '11px 14px', borderRadius: 10, border: 'none', flexShrink: 0,
                    backgroundColor: isListening ? '#DC2626' : C.gold,
                    color: '#FFF', cursor: 'pointer', fontSize: 18,
                    boxShadow: isListening ? '0 0 12px rgba(220,38,38,0.5)' : 'none',
                    transition: 'all 0.3s',
                  }}>
                    {isListening ? '🔴' : '🎙️'}
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                  {POPULAR.map(s => (
                    <button key={s} disabled={loading} onClick={() => handleSearch(s)} style={{
                      fontSize: 11, padding: '5px 12px', borderRadius: 20,
                      border: `1.5px solid ${symbolInput===s ? (dark ? C.gold : '#1E3A5F') : C.surfaceBorder}`,
                      backgroundColor: symbolInput===s ? (dark ? C.goldLight : '#EFF6FF') : 'transparent',
                      color: symbolInput===s ? (dark ? C.goldDim : '#1E3A5F') : C.muted,
                      cursor: 'pointer', fontWeight: 600,
                    }}>{s}</button>
                  ))}
                </div>
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <label style={{ fontSize: 10, letterSpacing: 2, color: C.muted, fontWeight: 700 }}>POSITION SIZING</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {[['risk','Risk ₹'],['manual','Qty']].map(([m,l]) => (
                        <button key={m} onClick={() => setSizingMode(m)} style={{
                          fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20,
                          border: `1.5px solid ${sizingMode===m ? (dark ? C.gold : '#1E3A5F') : C.surfaceBorder}`,
                          backgroundColor: sizingMode===m ? (dark ? C.goldLight : '#EFF6FF') : 'transparent',
                          color: sizingMode===m ? (dark ? C.goldDim : '#1E3A5F') : C.muted, cursor: 'pointer',
                        }}>{l}</button>
                      ))}
                    </div>
                  </div>
                  {sizingMode === 'risk' ? (
                    <>
                      <input type="number" value={riskAmount} onChange={e => setRiskAmount(e.target.value)} placeholder="Risk amount e.g. 1000" style={inputStyle} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                        <span style={{ fontSize: 12, color: C.muted }}>Calculated Qty</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: C.gold }}>{qty} shares</span>
                      </div>
                    </>
                  ) : (
                    <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="Qty e.g. 10" style={inputStyle} />
                  )}
                </div>
                <button onClick={() => handleSearch()} disabled={loading} style={{
                  width: '100%', marginTop: 14, padding: '12px',
                  fontSize: 14, fontWeight: 700, borderRadius: 12, border: 'none',
                  backgroundColor: loading ? C.surfaceBorder : (dark ? C.gold : '#1E3A5F'),
                  color: loading ? C.muted : '#FFF',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : (dark ? '0 2px 12px rgba(200,146,10,0.3)' : '0 2px 12px rgba(30,58,95,0.3)'),
                }}>
                  {loading ? '⏳ Check ho raha hai...' : '🔍 Trend Nikalo'}
                </button>
                {error && <p style={{ fontSize: 12, color: C.red, marginTop: 8, fontWeight: 600 }}>{error}</p>}
              </div>

              {result && (
                <>
                  <PulseHeroBanner result={result} stockName={stockName} stockInfo={stockInfo} C={C} />
                  <ComboSignal result={result} stockName={stockName} userDob={userDob} isDark={dark} C={C} />
                  <MoodTracker isDark={dark} />
                  <AITradeCoach stockData={pulseData} C={C} isDark={dark} />

                  {stockInfo && (
                    <div style={cardStyle}>
                      <div style={{ fontSize: 10, letterSpacing: 2, color: C.muted, marginBottom: 10, fontWeight: 700 }}>📊 STOCK INFO</div>
                      {stockInfo.longName && (
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 6 }}>{stockInfo.longName}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 26, fontWeight: 800, color: C.text }}>{fmtINR(stockInfo.regularMarketPrice || result.lastClose)}</span>
                            {stockInfo.regularMarketChange !== undefined && (
                              <span style={{
                                fontSize: 12, fontWeight: 700,
                                color: stockInfo.regularMarketChange >= 0 ? C.green : C.red,
                                backgroundColor: stockInfo.regularMarketChange >= 0 ? C.greenLight : C.redLight,
                                padding: '3px 10px', borderRadius: 20,
                              }}>
                                {stockInfo.regularMarketChange >= 0 ? '▲' : '▼'} {fmtINR(Math.abs(stockInfo.regularMarketChange))} ({Math.abs(stockInfo.regularMarketChangePercent || 0).toFixed(2)}%)
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
                          <span style={{ color: C.muted }}>{label}</span>
                          <span style={{ fontWeight: 600, color: C.text }}>{value}</span>
                        </div>
                      ))}
                      {result.week52High && result.week52Low && (
                        <Week52Bar current={result.lastClose} low={result.week52Low} high={result.week52High} C={C} />
                      )}
                    </div>
                  )}

                  <TrendMeter longScore={result.longScore} shortScore={result.shortScore} trend={result.trend} C={C} />

                  <div style={cardStyle}>
                    <div style={{ fontSize: 10, letterSpacing: 2, color: C.muted, marginBottom: 14, fontWeight: 700 }}>📈 INDICATOR STRENGTH</div>
                    <IndicatorBar label={`RSI — ${result.rsi > 70 ? 'Overbought' : result.rsi < 30 ? 'Oversold' : 'Neutral zone'}`} value={result.rsi} max={100} color={result.rsi > 70 ? C.red : result.rsi < 30 ? C.green : C.gold} C={C} />
                    <IndicatorBar label={`ADX — ${result.trendStrength}`} value={result.adx} max={60} color={result.adx >= 25 ? C.green : C.muted} C={C} />
                    <IndicatorBar label="Long Score" value={result.longScore} max={100} color={C.green} C={C} />
                    <IndicatorBar label="Short Score" value={result.shortScore} max={100} color={C.red} C={C} />
                  </div>

                  {pulseData && <PulseBoltaHai
                    stockData={pulseData}
                    userName={user?.email?.split('@')[0]?.split('.')[0]?.replace(/[0-9]/g, '')?.replace(/^./, c => c.toUpperCase())}
                    userDob={userDob}
                  />}

                  <div style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${C.surfaceBorder}` }}>
                      <span style={{ fontSize: 20, fontWeight: 800, color: C.text }}>{stockName}</span>
                      <span style={{
                        fontSize: 13, fontWeight: 700, padding: '4px 12px', borderRadius: 20,
                        backgroundColor: trendColor === C.green ? C.greenLight : trendColor === C.red ? C.redLight : C.goldLight,
                        color: trendColor,
                      }}>{result.trend}</span>
                    </div>
                    {[
                      ['Momentum (MACD)', result.momentum, result.momentum==='Bullish' ? C.green : C.red],
                      ['RSI', result.rsi, result.rsi > 70 ? C.red : result.rsi < 30 ? C.green : null],
                      ['ADX (Strength)', `${result.adx} (${result.trendStrength})`, null],
                      ['Supertrend', result.supertrend, result.supertrend==='Bullish' ? C.green : C.red],
                      ['Long Score', `${result.longScore} / 100`, C.green],
                      ['Short Score', `${result.shortScore} / 100`, C.red],
                    ].map(([label, value, color]) => (
                      <div key={label} style={rowStyle}>
                        <span style={{ color: C.muted }}>{label}</span>
                        <span style={{ fontWeight: 700, color: color || C.textSecondary }}>{value}</span>
                      </div>
                    ))}
                    <button onClick={() => {
                      const exists = watchlist.some(w => w.symbol === stockName);
                      setWatchlist(prev => exists ? prev.filter(w => w.symbol !== stockName) : [{ symbol: stockName, lastTrend: result.trend, lastPrice: result.lastClose, lastChecked: new Date().toISOString() }, ...prev].slice(0, 30));
                    }} style={{
                      width: '100%', marginTop: 14, padding: '9px',
                      fontSize: 13, fontWeight: 700, borderRadius: 10,
                      border: `1.5px solid ${C.gold}`,
                      backgroundColor: 'transparent', color: C.gold, cursor: 'pointer',
                    }}>
                      {watchlist.some(w => w.symbol === stockName) ? '⭐ Watchlist se hatao' : '☆ Watchlist mein add karo'}
                    </button>
                    <button onClick={() => {
                      const score = result.trend === 'Bullish' ? result.longScore : result.shortScore;
                      const price = stockInfo?.regularMarketPrice || result.lastClose;
                      const change = stockInfo?.regularMarketChangePercent ? `${stockInfo.regularMarketChangePercent >= 0 ? '▲' : '▼'} ${Math.abs(stockInfo.regularMarketChangePercent).toFixed(2)}%` : '';
                      const msg = `🔱 *PulseTrade Analysis*\n\n📊 *${stockName}* — ${result.trend === 'Bullish' ? '🟢 BULLISH' : '🔴 BEARISH'}\n💰 Price: ₹${Number(price).toLocaleString('en-IN', {maximumFractionDigits: 2})} ${change}\n⚡ Pulse Score: ${score}/100\n📈 RSI: ${result.rsi} | ADX: ${result.adx}\n🎯 Trend: ${result.trendStrength}\n\n${result.trend === 'Bullish' ? '✅ Strong Bullish Trend dikh raha hai!' : '⚠️ Bearish Trend — Cautious raho!'}\n\n🔍 Khud check karo: pulsetrade.in\n🔱 हर हर महादेव 🔱`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                    }} style={{
                      width: '100%', marginTop: 8, padding: '9px',
                      fontSize: 13, fontWeight: 700, borderRadius: 10, border: 'none',
                      background: 'linear-gradient(135deg, #25D366, #128C7E)',
                      color: '#FFF', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}>
                      <span style={{fontSize: 16}}>📱</span> WhatsApp Pe Share Karo
                    </button>
                  </div>

                  {result.signal ? (
                    <div style={{
                      backgroundColor: C.surface,
                      border: `2px solid ${result.signal==='LONG' ? C.green : C.red}`,
                      borderRadius: 16, padding: 18, marginBottom: 16,
                      boxShadow: `0 4px 20px ${result.signal==='LONG' ? C.green : C.red}18`,
                    }}>
                      <div style={{
                        fontSize: 15, fontWeight: 800,
                        color: result.signal==='LONG' ? C.green : C.red,
                        backgroundColor: result.signal==='LONG' ? C.greenLight : C.redLight,
                        padding: '8px 14px', borderRadius: 10, marginBottom: 14,
                      }}>
                        {result.signal==='LONG' ? '📈 Bullish Setup' : '📉 Bearish Setup'}
                      </div>
                      {[
                        ['Entry', fmtINR(result.entry)],
                        ['Stop Loss', fmtINR(result.stopLoss)],
                        ['Safe Exit 🟢 (3%)', fmtINR(result.targets?.[0])],
                        ['Sweet Spot 🎯 (6%)', fmtINR(result.targets?.[1])],
                        ['Full Target 🚀 (10%)', fmtINR(result.targets?.[2])],
                        ['Suggested Hold', result.suggestedHold],
                      ].map(([label, value]) => (
                        <div key={label} style={rowStyle}>
                          <span style={{ color: C.muted }}>{label}</span>
                          <span style={{ fontWeight: 700, color: C.text }}>{value}</span>
                        </div>
                      ))}
                      <button onClick={handleSendAlert} disabled={alertSending || alertSent} style={{
                        width: '100%', marginTop: 14, padding: '12px',
                        fontSize: 13, fontWeight: 700, borderRadius: 10, border: 'none',
                        backgroundColor: alertSent ? C.green : C.gold,
                        color: '#FFF', cursor: alertSent ? 'default' : 'pointer',
                      }}>
                        {alertSent ? '✅ Alert Bhej Diya!' : alertSending ? '📨 Bhej rahe hain...' : '📧 Email Alert Bhejo'}
                      </button>
                    </div>
                  ) : (
                    <div style={{
                      backgroundColor: C.surface, border: `1px dashed ${C.surfaceBorder}`,
                      borderRadius: 16, padding: 18, marginBottom: 16,
                      fontSize: 13, color: C.muted, textAlign: 'center',
                    }}>
                      ⏳ Abhi koi clear confluence signal nahi hai. Wait karo.
                    </div>
                  )}

                  <div style={cardStyle}>
                    <div style={{ fontSize: 10, letterSpacing: 2, color: C.muted, marginBottom: 14, fontWeight: 700 }}>POSITION SIZING CALCULATOR</div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                      {[['BUY','📈 Bullish Scenario'],['SELL','📉 Bearish Scenario']].map(([d, label]) => (
                        <button key={d} onClick={() => setDirection(d)} style={{
                          flex: 1, padding: '9px', fontSize: 12, fontWeight: 700, borderRadius: 10, border: 'none',
                          backgroundColor: direction===d ? (d==='BUY' ? C.green : C.red) : C.bg,
                          color: direction===d ? '#FFF' : C.muted, cursor: 'pointer',
                        }}>{label}</button>
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
                        <span style={{ color: C.muted }}>{label}</span>
                        <span style={{ fontWeight: 700, color: C.textSecondary }}>{value}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                      {tierResults.map((t, i) => (
                        <div key={t.percent} style={{
                          flex: 1, backgroundColor: C.goldLight, borderRadius: 12,
                          padding: '12px 8px', textAlign: 'center',
                          border: `1px solid ${C.surfaceBorder}`,
                        }}>
                          <div style={{ fontSize: 10, color: C.goldDim, fontWeight: 700 }}>
                            {i === 0 ? 'Safe Exit 🟢' : i === 1 ? 'Sweet Spot 🎯' : 'Full Target 🚀'}
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: C.gold, marginTop: 2 }}>{fmtINR(t.price)}</div>
                          <div style={{ fontSize: 11, color: C.green, fontWeight: 600 }}>+{fmtINR(t.profit)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {tab === 'watchlist' && (
            <>
              <ReferralCard user={user} C={C} />
              <div style={cardStyle}>
                <div style={{ fontSize: 10, letterSpacing: 2, color: C.muted, marginBottom: 16, fontWeight: 700 }}>WATCHLIST</div>
                {watchlist.length === 0 ? (
                  <p style={{ color: C.muted, fontSize: 13, textAlign: 'center', padding: '16px 0' }}>Abhi khaali hai. Check tab se add karo.</p>
                ) : watchlist.map(w => (
                  <div key={w.symbol} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${C.surfaceBorder}` }}>
                    <div>
                      <div style={{ fontWeight: 700, color: C.text }}>{w.symbol}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <span style={{ fontSize: 12, color: C.muted }}>{fmtINR(w.lastPrice)}</span>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '1px 8px', borderRadius: 12,
                          color: w.lastTrend === 'Bullish' ? C.green : C.red,
                          backgroundColor: w.lastTrend === 'Bullish' ? C.greenLight : C.redLight,
                        }}>{w.lastTrend}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => { setTab('check'); handleSearch(w.symbol); }} style={{ fontSize: 12, padding: '7px 14px', borderRadius: 8, border: 'none', backgroundColor: C.gold, color: '#FFF', cursor: 'pointer', fontWeight: 700 }}>Check</button>
                      <button onClick={() => setWatchlist(prev => prev.filter(x => x.symbol !== w.symbol))} style={{ fontSize: 12, padding: '7px 12px', borderRadius: 8, border: `1.5px solid ${C.surfaceBorder}`, backgroundColor: 'transparent', color: C.red, cursor: 'pointer', fontWeight: 700 }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === 'track' && (
            <div style={cardStyle}>
              <div style={{ fontSize: 10, letterSpacing: 2, color: C.muted, marginBottom: 12, fontWeight: 700 }}>TRACK RECORD</div>
              {history.length > 0 && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  {[
                    ['Wins', history.filter(h=>h.outcome==='win').length, C.green, C.greenLight],
                    ['Losses', history.filter(h=>h.outcome==='loss').length, C.red, C.redLight],
                    ['Pending', history.filter(h=>h.outcome==='pending').length, C.gold, C.goldLight],
                  ].map(([l, v, c, bg]) => (
                    <div key={l} style={{ flex: 1, backgroundColor: bg, borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: c }}>{v}</div>
                      <div style={{ fontSize: 11, color: c, fontWeight: 700 }}>{l}</div>
                    </div>
                  ))}
                </div>
              )}
              {history.length === 0 ? (
                <p style={{ color: C.muted, fontSize: 13, textAlign: 'center', padding: '16px 0' }}>Abhi koi history nahi hai.</p>
              ) : history.map(h => (
                <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${C.surfaceBorder}` }}>
                  <div>
                    <div style={{ fontWeight: 700, color: C.text }}>{h.symbol}</div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{fmtINR(h.price)} • {h.trend}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['win','loss','pending'].map(o => (
                      <button key={o} onClick={() => setHistory(prev => prev.map(x => x.id===h.id ? {...x, outcome: o} : x))} style={{
                        fontSize: 11, padding: '5px 10px', borderRadius: 8, border: 'none',
                        backgroundColor: h.outcome===o ? (o==='win' ? C.green : o==='loss' ? C.red : C.gold) : C.bg,
                        color: h.outcome===o ? '#FFF' : C.muted,
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

          {tab === 'screener' && (
            <PulseScreener
              isDark={dark}
              userDob={userDob}
              userName={user?.email?.split('@')[0]}
            />
          )}

          {tab === 'numerology' && (
            <NumerologyPanel
              isDark={dark}
              userDob={userDob}
              userName={user?.email?.split('@')[0]}
            />
          )}

          {/* FOOTER */}
          <div style={{ marginTop: 32, borderRadius: 16, overflow: 'hidden', border: `1px solid ${C.surfaceBorder}` }}>
            <div style={{ background: dark ? 'rgba(200,146,10,0.06)' : '#EFF6FF', borderBottom: `1px solid ${dark ? 'rgba(200,146,10,0.15)' : '#BFDBFE'}`, padding: '14px 18px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>📊</span>
              <div style={{ fontSize: 11.5, color: dark ? 'rgba(255,255,255,0.5)' : '#1E3A5F', lineHeight: 1.7 }}>
                <strong style={{ color: dark ? C.gold : '#1E3A5F' }}>PulseTrade</strong> provides technical market analysis and educational tools only. This is not investment advice. Consult a SEBI registered advisor before investing.
              </div>
            </div>
            <div style={{ background: C.surface, padding: '12px 18px', display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
              {[['Terms & Conditions','/terms'],['Privacy Policy','/privacy'],['Refund Policy','/refund'],['Contact Us','/contact']].map(([label, href], i, arr) => (
                <span key={label} style={{ display: 'flex', alignItems: 'center' }}>
                  <a href={href} style={{ fontSize: 12, color: C.muted, textDecoration: 'none', fontWeight: 600, padding: '2px 10px' }}>{label}</a>
                  {i < arr.length - 1 && <span style={{ color: C.surfaceBorder }}>•</span>}
                </span>
              ))}
            </div>
            <div style={{ background: C.surface, borderTop: `1px solid ${C.surfaceBorder}`, padding: '10px 18px', textAlign: 'center', fontSize: 11, color: C.muted }}>
              © 2026 <span style={{ color: C.gold, fontWeight: 700 }}>PulseTrade</span> &nbsp;•&nbsp; 🔱 हर हर महादेव 🔱
            </div>
          </div>
        </div>
      </div>

      {showSupport && (
        <SupportChat user={user} isDark={dark} onClose={() => setShowSupport(false)} />
      )}
    </div>
  );
}
