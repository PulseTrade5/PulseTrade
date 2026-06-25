import { useState } from 'react';

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

export default function FearGreedMeter({ isDark }) {
  const C = isDark ? DARK_C : LIGHT_C;
  const score = getScore();
  const zone = getZone(score);
  const [show, setShow] = useState(false);

  const angle = (score / 100) * 180 - 90;
  const rad = (angle * Math.PI) / 180;
  const cx = 140, cy = 140, r = 110;
  const nx = cx + (r - 20) * Math.cos(rad);
  const ny = cy + (r - 20) * Math.sin(rad);

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
      border: '1.5px solid ' + zone.color,
      borderRadius: 16, padding: 18, marginBottom: 16,
      boxShadow: '0 4px 20px ' + zone.color + '22',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: zone.color, fontWeight: 800 }}>
          🌡️ MARKET FEAR & GREED
        </div>
        <button onClick={() => setShow(!show)} style={{
          fontSize: 11, padding: '4px 10px', borderRadius: 20,
          border: '1px solid ' + C.border, backgroundColor: 'transparent',
          color: C.muted, cursor: 'pointer', fontWeight: 600,
        }}>
          {show ? '▲ Kam Karo' : '▼ Details'}
        </button>
      </div>

      <svg viewBox="0 0 280 160" width="100%" height="130" style={{ overflow: 'visible', display: 'block' }}>
        <path d="M 30 140 A 110 110 0 0 1 80 47" fill="none" stroke="#7F1D1D" strokeWidth="18" strokeLinecap="round"/>
        <path d="M 80 47 A 110 110 0 0 1 140 30" fill="none" stroke="#991B1B" strokeWidth="18" strokeLinecap="round"/>
        <path d="M 140 30 A 110 110 0 0 1 200 47" fill="none" stroke="#D97706" strokeWidth="18" strokeLinecap="round"/>
        <path d="M 200 47 A 110 110 0 0 1 250 140" fill="none" stroke="#065F46" strokeWidth="18" strokeLinecap="round"/>
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#FFF" strokeWidth="3" strokeLinecap="round"/>
        <circle cx={cx} cy={cy} r="8" fill={zone.color} stroke="#FFF" strokeWidth="2"/>
        <text x="18" y="155" fill="#F87171" fontSize="8" fontWeight="700">EXTREME FEAR</text>
        <text x="218" y="155" fill="#3FAE7C" fontSize="8" fontWeight="700">EXTREME GREED</text>
        <text x="112" y="20" fill="#D8A33D" fontSize="8" fontWeight="700">NEUTRAL</text>
      </svg>

      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 44, fontWeight: 900, color: zone.color, lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: 16, fontWeight: 800, color: zone.color, marginTop: 4 }}>
          {zone.emoji} {zone.label}
        </div>
      </div>

      <div style={{
        padding: '10px 14px', borderRadius: 10, marginBottom: 12,
        backgroundColor: zone.color + '15',
        border: '1px solid ' + zone.color + '33',
        fontSize: 12, color: zone.color, fontWeight: 700, textAlign: 'center',
      }}>
        {zone.tip}
      </div>

      {show && (
        <div>
          <div style={{ marginBottom: 14 }}>
            {indicators.map(function(ind) {
              return (
                <div key={ind.label} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                    <span style={{ color: C.muted }}>{ind.label}</span>
                    <span style={{ color: ind.color, fontWeight: 700 }}>{ind.value}</span>
                  </div>
                  <div style={{ height: 5, backgroundColor: C.border, borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: ind.pct + '%', backgroundColor: ind.color, borderRadius: 99 }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: C.muted, fontWeight: 700, marginBottom: 10 }}>📅 IS HAFTE KA TREND</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {history.map(function(h) {
                var hZone = h.val ? getZone(h.val) : null;
                return (
                  <div key={h.day} style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ height: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: 4 }}>
                      {h.val ? (
                        <div style={{
                          width: '80%', borderRadius: '4px 4px 0 0',
                          height: h.val + '%',
                          backgroundColor: hZone.color, opacity: 0.8,
                        }} />
                      ) : (
                        <div style={{ width: '80%', height: '30%', backgroundColor: C.border, borderRadius: '4px 4px 0 0', opacity: 0.3 }} />
                      )}
                    </div>
                    <div style={{ fontSize: 9, color: C.muted }}>{h.day}</div>
                    {h.val && <div style={{ fontSize: 10, fontWeight: 700, color: hZone.color }}>{h.val}</div>}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{
            padding: '12px 14px', borderRadius: 10,
            backgroundColor: isDark ? 'rgba(200,146,10,0.08)' : '#FFFBEB',
            border: '1px solid ' + C.gold + '44',
            fontSize: 12, color: C.gold, lineHeight: 1.7, fontStyle: 'italic',
          }}>
            "Jab sab darrein tab kharido, jab sab lalchi hon tab becho!" — Warren Buffett 🔱
          </div>
        </div>
      )}
    </div>
  );
}
