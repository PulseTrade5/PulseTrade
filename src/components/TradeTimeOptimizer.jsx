import { useState, useEffect } from 'react';

function reduceToSingle(num) {
  while (num > 9 && num !== 11 && num !== 22) {
    num = String(num).split('').map(Number).reduce((a, b) => a + b, 0);
  }
  return num;
}

function getLifePath(dob) {
  if (!dob) return null;
  const digits = dob.replace(/-/g, '').split('').map(Number);
  return reduceToSingle(digits.reduce((a, b) => a + b, 0));
}

// Market minute-blocks with their own numerology "hour energy" (Chaldean hour reduction)
function hourEnergy(hour, minute) {
  const sum = reduceToSingle(hour + minute);
  return sum;
}

const ENERGY_MEANING = {
  1: { label: 'Bold Entry Window', desc: 'Confident, decisive moves favorable hain is minute mein.', color: '#F59E0B' },
  2: { label: 'Cautious Window', desc: 'Patience rakho, confirmation ke bina entry mat lo.', color: '#94A3B8' },
  3: { label: 'Momentum Window', desc: 'Trend-following entries is waqt favorable lagti hain.', color: '#8B5CF6' },
  4: { label: 'Stable Window', desc: 'Long-term positional entries ke liye theek hai.', color: '#6B7280' },
  5: { label: 'Fast-Move Window', desc: 'Quick scalps ho sakte hain, par risk bhi zyada hai.', color: '#10B981' },
  6: { label: 'Balanced Window', desc: 'Risk aur reward dono balanced feel ho rahe hain.', color: '#EC4899' },
  7: { label: 'Analysis Window', desc: 'Entry se pehle ek baar aur chart check kar lo.', color: '#8B5CF6' },
  8: { label: 'High-Stakes Window', desc: 'Bade position size ke liye extra disciplined raho.', color: '#374151' },
  9: { label: 'Action Window', desc: 'Aggressive entries kaam kar sakti hain is waqt.', color: '#EF4444' },
  11: { label: 'Intuition Window', desc: 'Tera gut feeling is minute mein strong lag raha hai.', color: '#A78BFA' },
  22: { label: 'Prime Window', desc: 'Rare high-alignment minute — sabse favorable window!', color: '#4F46E5' },
};

export default function TradeTimeOptimizer({ isDark, userDob }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const lifePath = getLifePath(userDob);
  const hour = now.getHours();
  const minute = now.getMinutes();
  const energyNum = hourEnergy(hour, minute);
  const meaning = ENERGY_MEANING[energyNum] || ENERGY_MEANING[1];
  const isPersonalMatch = lifePath ? energyNum === lifePath : false;
  const marketOpen = hour >= 9 && (hour < 15 || (hour === 15 && minute <= 30));
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  // Next 3 upcoming "prime" windows (minutes reducing to 22 or 11) in the current hour
  const upcoming = [];
  for (let m = minute + 1; m < 60 && upcoming.length < 3; m++) {
    const e = hourEnergy(hour, m);
    if (e === 22 || e === 11) upcoming.push({ time: `${String(hour).padStart(2,'0')}:${String(m).padStart(2,'0')}`, num: e });
  }

  const C = {
    text: isDark ? '#F1F0FF' : '#1E1B4B',
    muted: isDark ? '#9C9AC4' : '#6B7280',
    surface: isDark ? '#1A1830' : '#FFFFFF',
    border: isDark ? '#2E2A52' : '#E5E9F5',
  };

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=JetBrains+Mono:wght@600;700&display=swap');
        @keyframes tto-gradient-shift { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        @keyframes tto-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>

      {/* LIVE HEADER CARD */}
      <div style={{
        position: 'relative', overflow: 'hidden', textAlign: 'center',
        background: `linear-gradient(135deg, ${meaning.color} 0%, #4F46E5 60%, #0EA5A4 100%)`,
        backgroundSize: '200% 200%',
        animation: 'tto-gradient-shift 6s ease-in-out infinite',
        borderRadius: 24, padding: '24px 20px', marginBottom: 20,
        boxShadow: '0 8px 0 #3730A3, 0 18px 32px rgba(79,70,229,0.28), 0 2px 0 rgba(255,255,255,0.25) inset',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.16), transparent)',
          pointerEvents: 'none',
        }} />
        <div style={{ fontSize: 9.5, letterSpacing: 2.5, color: 'rgba(255,255,255,0.85)', fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', position: 'relative', zIndex: 1 }}>
          🔱 Trade Entry Time Optimizer
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4, position: 'relative', zIndex: 1 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: marketOpen ? '#4ADE80' : '#F87171', animation: 'tto-pulse 1.5s ease-in-out infinite' }} />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: 700 }}>
            {marketOpen ? 'Market Live' : 'Market Closed'}
          </span>
        </div>

        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 40, fontWeight: 700, color: '#FFF', margin: '8px 0', position: 'relative', zIndex: 1 }}>
          {timeStr}
        </div>

        <div style={{
          display: 'inline-block', fontSize: 13, fontWeight: 800, color: '#FFF',
          backgroundColor: 'rgba(255,255,255,0.18)', padding: '6px 16px', borderRadius: 20,
          position: 'relative', zIndex: 1,
        }}>
          Energy #{energyNum} — {meaning.label}
        </div>

        <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, marginTop: 12, position: 'relative', zIndex: 1 }}>
          💡 {meaning.desc}
        </div>

        {isPersonalMatch && (
          <div style={{
            marginTop: 12, fontSize: 12, fontWeight: 800, color: '#FFF',
            backgroundColor: 'rgba(255,255,255,0.22)', padding: '8px 14px', borderRadius: 12,
            position: 'relative', zIndex: 1,
          }}>
            ⭐ Ye tera personal lucky minute hai — Life Path {lifePath} se match karta hai!
          </div>
        )}
      </div>

      {/* UPCOMING PRIME WINDOWS */}
      <div style={{
        background: C.surface, borderRadius: 20, padding: 18,
        boxShadow: isDark ? '0 6px 0 #2E2A52, 0 14px 26px rgba(0,0,0,0.3)' : '0 6px 0 #E5E9F5, 0 12px 22px rgba(30,27,75,0.06)',
      }}>
        <div style={{ fontSize: 10, letterSpacing: 1.5, color: C.muted, fontWeight: 700, marginBottom: 12, textTransform: 'uppercase' }}>
          Is Ghante Ke Prime Windows
        </div>
        {upcoming.length > 0 ? (
          upcoming.map((u, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 14px', marginBottom: 8, borderRadius: 12,
              backgroundColor: isDark ? 'rgba(79,70,229,0.12)' : '#EEF2FF',
            }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 700, color: C.text }}>{u.time}</span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#4F46E5' }}>Master #{u.num} ✨</span>
            </div>
          ))
        ) : (
          <div style={{ fontSize: 12.5, color: C.muted, textAlign: 'center', padding: '10px 0' }}>
            Is ghante mein koi aur Master-number window nahi — agle ghante try karo.
          </div>
        )}
      </div>

      <div style={{ marginTop: 16, fontSize: 11, color: C.muted, textAlign: 'center', lineHeight: 1.6 }}>
        ✨ Sirf numerology/entertainment ke liye — investment advice nahi hai. Trading risk ke saath hoti hai.
      </div>
    </div>
  );
}
