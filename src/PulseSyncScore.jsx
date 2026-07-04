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

  if (score === null) return null;

  const glowColor = score >= 70 ? (C.green || '#3FAE7C') : score >= 45 ? C.gold : (C.red || '#F87171');
  const syncLabel = score >= 70 ? 'High Sync' : score >= 45 ? 'Moderate Sync' : 'Low Sync';

  return (
    <div style={{
      background: isDark
        ? 'linear-gradient(160deg, #161B22, #0D1117)'
        : 'linear-gradient(160deg, #FFFFFF, #F4F6FA)',
      border: `1.5px solid ${glowColor}55`,
      borderRadius: 20, padding: '26px 20px', marginBottom: 16, textAlign: 'center',
      boxShadow: `0 0 40px ${glowColor}14`,
      position: 'relative', overflow: 'hidden',
    }}>
      <style>{`
        @keyframes pss-breathe { 0%,100% { transform: scale(0.94); opacity: 0.55; } 50% { transform: scale(1.06); opacity: 1; } }
        @keyframes pss-beat { to { stroke-dashoffset: -400; } }
      `}</style>

      <div style={{ fontSize: 10, letterSpacing: 2, color: C.muted, fontWeight: 700, marginBottom: 18 }}>
        🔱 AAJ KA PULSE SYNC SCORE
      </div>

      <div style={{ position: 'relative', width: 150, height: 150, margin: '0 auto 16px' }}>
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: `radial-gradient(circle, ${glowColor}55, transparent 70%)`,
          animation: 'pss-breathe 2.6s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', inset: 8, borderRadius: '50%',
          border: `3px solid ${glowColor}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div>
            <div style={{ fontSize: 42, fontWeight: 900, color: glowColor, lineHeight: 1, textShadow: `0 0 18px ${glowColor}88` }}>
              {score}<span style={{ fontSize: 18 }}>%</span>
            </div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 3, fontWeight: 700 }}>{syncLabel}</div>
          </div>
        </div>
      </div>

      <div style={{ height: 32, marginBottom: 16 }}>
        <svg viewBox="0 0 300 32" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
          <path
            d="M0,16 L60,16 L75,3 L90,29 L105,16 L300,16"
            fill="none" stroke={glowColor} strokeWidth="2"
            strokeDasharray="400" strokeDashoffset="400"
            style={{ animation: 'pss-beat 2.6s linear infinite', filter: `drop-shadow(0 0 3px ${glowColor})` }}
          />
        </svg>
      </div>

      <div style={{
        backgroundColor: `${glowColor}14`, border: `1px solid ${glowColor}33`,
        borderRadius: 14, padding: '12px 16px', fontSize: 13, color: C.text, lineHeight: 1.6, marginBottom: 16,
      }}>
        💡 {insight}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-around', paddingTop: 14, borderTop: `1px solid ${C.surfaceBorder}` }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: glowColor }}>{factors.mood}</div>
          <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>Market Mood</div>
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: glowColor }}>{factors.lucky ?? '—'}</div>
          <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>Lucky Number</div>
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: glowColor }}>{factors.matched ? '⭐' : '—'}</div>
          <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>Numerology</div>
        </div>
      </div>

      {!userDob && (
        <div style={{ fontSize: 11, color: C.muted, marginTop: 12 }}>
          🪐 Profile mein DOB add karo — personal score ke liye
        </div>
      )}
    </div>
  );
}
