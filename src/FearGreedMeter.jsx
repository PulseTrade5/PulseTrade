import { useState, useEffect } from 'react';

const DARK_C = {
  bg: '#0D1117', surface: '#161B22', border: '#30363D',
  text: '#E8E6E0', muted: '#8B92A0', gold: '#D8A33D',
  green: '#3FAE7C', red: '#F87171',
};
const LIGHT_C = {
  bg: '#F4F6FA', surface: '#FFFFFF', border: '#E2E8F0',
  text: '#0F172A', muted: '#64748B', gold: '#C8920A',
  green: '#059669', red: '#DC2626',
};

function getScore() {
  const today = new Date();
  const seed = today.getDate() + today.getMonth() * 31;
  const base = ((seed * 1234567) % 100 + 100) % 100;
  return Math.max(5, Math.min(95, base));
}

function getZone(score) {
  if (score <= 20) return { label: 'Extreme Fear', emoji: '😱', color: '#DC2626', tip: 'Sab bech rahe hain — Yahi buying ka mauka hota hai!' };
  if (score <= 40) return { label: 'Fear', emoji: '😰', color: '#F87171', tip: 'Market dara hua hai — Cautious raho lekin opportunities dekho!' };
  if (score <= 60) return { label: 'Neutral', emoji: '😐', color: '#D97706', tip: 'Market balanced hai — Apni strategy pe chalo!' };
  if (score <= 80) return { label: 'Greed', emoji: '😊', color: '#3FAE7C', tip: 'Log laalchi ho rahe hain — Profit booking soch lo!' };
  return { label: 'Extreme Greed', emoji: '🤑', color: '#059669', tip: 'Bubble ban sakta hai — Stop loss tight rakho!' };
}

function GaugeMeter({ score, zone }) {
  const angle = (score / 100) * 180 - 90;
  const rad = (angle * Math.PI) / 180;
  const cx = 140, cy = 140, r = 110;
  const nx = cx + (r - 20) * Math.cos(rad);
  const ny = cy + (r - 20) * Math.sin(rad);

  return (
    <svg viewBox="0 0 280 160" width="100%" height="140" style={{ overflow: 'visible' }}>
      <path d="M 30 140 A 110 110 0 0 1 80 47" fill="none" stroke="#7F1D1D" strokeWidth="18" strokeLinecap="round"/>
      <path d="M 80 47 A 110 110 0 0 1 140 30" fill="none" stroke="#991B1B" strokeWidth="18" strokeLinecap="round"/>
      <path d="M 140 30 A 110 110 0 0 1 200 47" fill="none" stroke="#D97706" strokeWidth="18" strokeLinecap="round"/>
      <path d="M 200 47 A 110 110 0 0 1 250 140" fill="none" stroke="#065F46" strokeWidth="18" strokeLinecap="round"/>
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#FFF" strokeWidth="3" strokeLinecap="round"/>
      <circle cx={cx} cy={cy} r="8" fill={zone.color} stroke="#FFF" strokeWidth="2"/>
      <text x="18" y="158" fill="#F87171" fontSize="8" fontWeight="700">EXTREME</text>
      <text x="22" y="168" fill="#F87171" fontSize="8" fontWeight="700">FEAR</text>
      <text x="228" y="158" fill="#3FAE7C" fontSize="8" fontWeight="700">EXTREME</text>
      <text x="232" y="168" fill="#3FAE7C" fontSize="8" fontWeight="700">GREED</text>
      <text x="116" y="20" fill="#D8A33D" fontSize="8" fontWeight="700">NEUTRAL</text>
    </svg>
  );
}

export default function FearGreedMeter({ isDark }) {
  const C = isDark ? DARK_C : LIGHT_C;
  const [score] = useState(getScore);
  const zone = getZone(score);
  const [show, setShow] = useState(false);

  const indicators = [
    { label: 'NIFTY Momentum', value: score > 50 ? 'Bullish' : 'Bearish', pct: score, color: score > 50 ? C.green : C.red },
    { label: 'India VIX', value: score > 50 ? 'Low (Calm)' : 'High (Volatile)', pct: score > 50 ? score : 100 - score, color: score > 50 ? C.green : C.red },
    { label: 'FII Activity', value: score > 60 ? 'Buying' : score < 40 ? 'Selling' : 'Neutral', pct: score, color: score > 60 ? C.green : score < 40 ? C.red : C.gold },
    { label: 'Put/Call Ratio', value: score > 50 ? 'Bullish' : 'Bearish', pct: score, color: score > 50 ? C.green : C.red },
  ];

  const history = [
    { day: 'Mon', val: 38 },
    { day: 'Tue', val: 52 },
    { day: 'Wed', val: 61 },
    { day: 'Thu', val: score },
    { day: 'Fri', val: null },
  ];

  return (
    <div style={{
      backgroundColor: C.surface,
      border: `1.5px solid ${zone.color}`,
      borderRadius: 16, padding: 18, marginBottom: 16,
      boxShadow: `0 4px 20px ${zone.color}22`,
      transition: 'all 0.3s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: zone.color, fontWeight: 800 }}>
          🌡️ MARKET FEAR & GREED
        </div>
        <button onClick={() => setShow(!show)} style={{
          fontSize: 11, padding: '4px 10px', borderRadius: 20,
          border: `1px solid ${C.border}`, backgroundColor: 'transparent',
          color: C.muted, cursor: 'pointer', fontWeight: 600,
        }}>
          {show ? '▲ Kam Karo' : '▼ Details Dekho'}
        </button>
      </div>

      <GaugeMeter score={score} zone={zone} />

      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 44, fontWeight: 900, color: zone.color, lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: 16, fontWeight: 800, color: zone.color, marginTop: 4 }}>
          {zone.emoji} {zone.label}
        </div>
      </div>

      <div style={{
        padding: '10px 14px', borderRadius: 10, marginBottom: 12,
        backgroundColor: `${zone.color}15`,
        border: `1px solid ${zone.color}33`,
        fontSize: 12, color: zone.color, fontWeight: 700, textAlign: 'center',
      }}>
        {zone.tip}
      </div>

      {show && (
        <>
          <div style={{ marginBottom: 14 }}>
            {indicators.map(ind => (
              <div key={ind.label} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: C.muted }}>{ind.label}</span>
                  <span style={{ color: ind.color, fontWeight: 700 }}>{ind.value}</span>
                </div>
                <div style={{ height: 5, backgroundColor: C.border, borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${ind.pct}%`, backgroundColor: ind.color, borderRadius: 99, transition: 'width 1s ease' }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 14 }}>
