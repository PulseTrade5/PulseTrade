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

const LIGHT = {
  bg: "#F4F6FA", surface: "#FFFFFF", surfaceBorder: "#E2E8F0", surfaceHover: "#F8FAFC",
  gold: "#F59E0B", goldLight: "#FFFBEB", goldDim: "#D97706",
  blue: "#1E3A5F", blueLight: "#EFF6FF", blueMid: "#2D5A8E",
  green: "#059669", greenLight: "#ECFDF5",
  red: "#DC2626", redLight: "#FEF2F2",
  text: "#0F172A", textSecondary: "#334155", muted: "#64748B", mutedLight: "#94A3B8",
  headerBg: "#1E3A5F", sebi: "#1E3A5F", sebiBg: "#EFF6FF", sebiBorder: "#BFDBFE",
  primary: "#1E3A5F", primaryLight: "#EFF6FF",
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

// ✅ WAVE COMPONENT
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

// ✅ LIVE DOT
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
      background: isDark ? 'linear-gradient(135deg, #1a1400, #161B22)' : 'linear-gradient(135deg, #EFF6FF, #FFFFFF)',
      border: `1.5px solid ${isDark ? C.gold : '#1E3A5F'}`, borderRadius: 14,
      fontSize: 14, fontWeight: 700, color: isDark ? C.gold : '#1E3A5F',
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

      {/* MODE SWITCHER */}
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
                }}>🔊 Suno</butt
