import { useEffect, useState } from 'react';

// Chaldean-style single-digit reduction (matches StockDashboard's own numerology helpers)
function reduceToSingle(num) {
  while (num > 9 && num !== 11 && num !== 22) {
    num = String(num).split('').map(Number).reduce((a, b) => a + b, 0);
  }
  return num;
}

function getLifePathNum(dob) {
  if (!dob) return null;
  const sum = dob.replace(/-/g, '').split('').map(Number).reduce((a, b) => a + b, 0);
  return reduceToSingle(sum);
}

function getTodayNumber() {
  const today = new Date();
  const dateStr = `${today.getFullYear()}${today.getMonth() + 1}${today.getDate()}`;
  const sum = dateStr.split('').map(Number).reduce((a, b) => a + b, 0);
  return reduceToSingle(sum);
}

// Simple deterministic daily "market energy" seed so the score feels alive
// day-to-day but doesn't require an extra API call or flicker on refresh.
function seededVariance(seedStr, range) {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash * 31 + seedStr.charCodeAt(i)) % 100000;
  }
  return hash % range;
}

const INSIGHTS_HIGH = [
  'Aaj momentum tumhare favor mein hai — thoda confident raho, par stop-loss zaroor lagao.',
  'Aaj ka din trading ke liye achha lag raha hai — apna plan follow karo, greedy mat bano.',
  'Numerology aur market mood dono align ho rahe hain — disciplined entries lo.',
];
const INSIGHTS_MID = [
  'Aaj mixed signals hain — chhoti positions lo, bade risk avoid karo.',
  'Thoda cautious raho aaj — confirmation ke bina entry mat lo.',
  'Aaj din average hai — apni watchlist review karo, jaldi decision mat lo.',
];
const INSIGHTS_LOW = [
  'Aaj risk zyada dikh raha hai — trading kam karo, capital protect karo.',
  'Numerology aaj tumhare favor mein nahi hai — patience rakho, kal dekho.',
  'Aaj overtrading se bacho — chart dekhna kaafi hai, entry lena zaroori nahi.',
];

export default function PulseSyncScore({ userDob, isDark, C }) {
  const [score, setScore] = useState(null);
  const [displayScore, setDisplayScore] = useState(0);
  const [insight, setInsight] = useState('');
  const [factors, setFactors] = useState({ mood: null, lucky: null, matched: false });

  useEffect(() => {
    const lifePath = getLifePathNum(userDob);
    const todayNum = getTodayNumber();
    const today = new Date();
    const seed = `${today.toDateString()}_${userDob || 'guest'}`;

    const matched = lifePath ? (lifePath === todayNum || Math.abs(lifePath - todayNum) <= 1) : false;
    const marketEnergy = 40 + seededVariance(seed, 45); // 40–84 range, feels alive but not wild
    let computed = marketEnergy + (matched ? 16 : -6);
    computed = Math.max(8, Math.min(97, computed));

    setScore(computed);
    setFactors({ mood: marketEnergy, lucky: lifePath, matched });

    const pool = computed >= 70 ? INSIGHTS_HIGH : computed >= 45 ? INSIGHTS_MID : INSIGHTS_LOW;
    setInsight(pool[seededVariance(seed + '_insight', pool.length)]);
  }, [userDob]);

  useEffect(() => {
    if (score === null) return;
    let frame;
    const duration = 900;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      setDisplayScore(Math.floor(progress * score));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  if (score === null) return null;

  const isPositive = score >= 45;
  const trendColor = score >= 70 ? '#16A34A' : score >= 45 ? '#4F46E5' : '#EF4444';
  const syncLabel = score >= 70 ? 'High Sync' : score >= 45 ? 'Moderate Sync' : 'Low Sync';
  const arcDeg = displayScore * 3.6;

  return (
    <div style={{
      position: 'relative', overflow: 'hidden', textAlign: 'center',
      background: 'linear-gradient(135deg, #4F46E5 0%, #8B5CF6 55%, #0EA5A4 100%)',
      backgroundSize: '200% 200%',
      animation: 'pss-gradient-shift 8s ease-in-out infinite',
      borderRadius: 26, padding: '26px 20px', marginBottom: 16,
      boxShadow: '0 16px 40px rgba(79,70,229,0.3), 0 2px 0 rgba(255,255,255,0.25) inset',
    }}>
      <style>{`
        @keyframes pss-gradient-shift { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        @keyframes pss-beat { to { stroke-dashoffset: -400; } }
      `}</style>

      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.16), transparent)',
        borderRadius: '26px 26px 0 0', pointerEvents: 'none',
      }} />

      <div style={{ fontSize: 10, letterSpacing: 2, color: 'rgba(255,255,255,0.85)', fontWeight: 700, marginBottom: 18, textTransform: 'uppercase', position: 'relative', zIndex: 1 }}>
        🔱 Aaj Ka Pulse Sync Score
      </div>

      <div style={{ position: 'relative', width: 132, height: 132, margin: '0 auto 18px' }}>
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: `conic-gradient(from -90deg, #FFFFFF 0deg, #FFFFFF ${arcDeg}deg, rgba(255,255,255,0.25) ${arcDeg}deg, rgba(255,255,255,0.25) 360deg)`,
          WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 8px), #000 calc(100% - 8px))',
          mask: 'radial-gradient(farthest-side, transparent calc(100% - 8px), #000 calc(100% - 8px))',
        }} />
        <div style={{
          position: 'absolute', inset: 12, borderRadius: '50%',
          background: 'linear-gradient(160deg, #FFFFFF, #F3F4FA)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 6px 16px rgba(0,0,0,0.18), 0 1px 0 rgba(255,255,255,0.8) inset, 0 -4px 8px rgba(30,27,75,0.06) inset',
        }}>
          <div>
            <div style={{
              fontFamily: "'Sora', system-ui, sans-serif", fontSize: 34, fontWeight: 800, lineHeight: 1,
              background: 'linear-gradient(120deg, #4F46E5, #0EA5A4)',
              WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
            }}>
              {displayScore}
            </div>
            <div style={{ fontSize: 9.5, color: '#6B7280', marginTop: 4, fontWeight: 700, letterSpacing: 0.5 }}>{syncLabel}</div>
          </div>
        </div>
      </div>

      <div style={{ height: 26, marginBottom: 16, position: 'relative', zIndex: 1 }}>
        <svg viewBox="0 0 300 26" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
          <path
            d="M0,13 L60,13 L75,3 L90,23 L105,13 L300,13"
            fill="none" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.8"
            strokeDasharray="400" strokeDashoffset="400"
            style={{ animation: 'pss-beat 2.6s linear infinite' }}
          />
        </svg>
      </div>

      <div style={{
        backgroundColor: 'rgba(255,255,255,0.14)',
        borderRadius: 14, padding: '13px 16px', fontSize: 12.5, color: '#FFF', lineHeight: 1.6, marginBottom: 16,
        position: 'relative', zIndex: 1,
      }}>
        💡 {insight}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-around', paddingTop: 15, borderTop: '1px solid rgba(255,255,255,0.2)', position: 'relative', zIndex: 1 }}>
        <div>
          <div style={{ fontFamily: "'Sora', system-ui, sans-serif", fontSize: 16, fontWeight: 800, color: '#FFF' }}>{factors.mood}</div>
          <div style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.7)', marginTop: 3, letterSpacing: 0.8, textTransform: 'uppercase' }}>Market Mood</div>
        </div>
        <div>
          <div style={{ fontFamily: "'Sora', system-ui, sans-serif", fontSize: 16, fontWeight: 800, color: '#FFF' }}>{factors.lucky ?? '—'}</div>
          <div style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.7)', marginTop: 3, letterSpacing: 0.8, textTransform: 'uppercase' }}>Lucky Number</div>
        </div>
        <div>
          <div style={{ fontFamily: "'Sora', system-ui, sans-serif", fontSize: 16, fontWeight: 800, color: '#FFF' }}>{factors.matched ? '⭐' : '—'}</div>
          <div style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.7)', marginTop: 3, letterSpacing: 0.8, textTransform: 'uppercase' }}>Numerology</div>
        </div>
      </div>

      {!userDob && (
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 12, position: 'relative', zIndex: 1 }}>
          🪐 Profile mein DOB add karo — personal score ke liye
        </div>
      )}
    </div>
  );
}
