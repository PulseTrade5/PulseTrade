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

function getDayNumber(date) {
  const dateStr = `${date.getDate()}${date.getMonth() + 1}${date.getFullYear()}`;
  const sum = dateStr.split('').map(Number).reduce((a, b) => a + b, 0);
  return reduceToSingle(sum);
}

const WEEKDAY = {
  0: { name: 'Raviwar', planet: '☀️ Surya', sector: 'Energy, PSU' },
  1: { name: 'Somwar', planet: '🌙 Chandra', sector: 'FMCG, Pharma' },
  2: { name: 'Mangalwar', planet: '🔴 Mangal', sector: 'Defense, Steel' },
  3: { name: 'Budhwar', planet: '💚 Budh', sector: 'IT, Telecom' },
  4: { name: 'Guruwar', planet: '🟡 Guru', sector: 'Banking, Finance' },
  5: { name: 'Shukrawar', planet: '✨ Shukra', sector: 'Auto, Luxury' },
  6: { name: 'Shaniwar', planet: '⚫ Shani', sector: 'Market closed' },
};

const MORNING_LINES = [
  'Aaj ka din poori confidence ke saath shuru karo!',
  'Discipline aur patience — aaj yehi tera sabse bada asset hai.',
  'Plan banao, plan follow karo — trend tumhara dost hai.',
  'Aaj chhoti jeet bhi jeet hai — greedy mat bano.',
];
const CLOSING_LINES = [
  'Aaj jo bhi hua, kal ek naya mauka hai — seekh ke aage badho!',
  'Market band ho gaya, lekin tera analysis kabhi nahi rukna chahiye.',
  'Aaj ka din review karo, kal behtar plan ke saath aana.',
  'Patience rakhne walon ko hi market inam deta hai — kal phir milte hain!',
];

function pickLine(pool, seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) % 100000;
  return pool[hash % pool.length];
}

export default function MarketMoment({ isDark, userDob, userName, watchlist = [], history = [], C }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000); // refresh every 30s, no need for per-second here
    return () => clearInterval(t);
  }, []);

  const hour = now.getHours();
  const minute = now.getMinutes();
  const isMorning = hour === 9 && minute >= 15 && minute < 30;
  const isClosing = hour === 15 && minute >= 30 && minute < 60;

  if (!isMorning && !isClosing) return null;

  const lifePath = getLifePath(userDob);
  const dayNum = getDayNumber(now);
  const weekdayInfo = WEEKDAY[now.getDay()];
  const isPersonalMatch = lifePath ? lifePath === dayNum : false;
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  const greetName = userName ? userName.charAt(0).toUpperCase() + userName.slice(1) : '';

  const cardStyle = {
    position: 'relative', overflow: 'hidden', textAlign: 'center',
    background: isMorning
      ? 'linear-gradient(135deg, #F59E0B 0%, #4F46E5 55%, #0EA5A4 100%)'
      : 'linear-gradient(135deg, #1E293B 0%, #4F46E5 55%, #7C3AED 100%)',
    borderRadius: 24, padding: '24px 20px', marginBottom: 20,
    boxShadow: '0 8px 0 rgba(0,0,0,0.15), 0 18px 32px rgba(79,70,229,0.28), 0 2px 0 rgba(255,255,255,0.25) inset',
  };

  if (isMorning) {
    return (
      <div style={cardStyle}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.16), transparent)',
          pointerEvents: 'none',
        }} />
        <div style={{ fontSize: 9.5, letterSpacing: 2.5, color: 'rgba(255,255,255,0.85)', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', position: 'relative', zIndex: 1 }}>
          🌅 Market Open
        </div>
        <div style={{ fontFamily: "'Sora', system-ui, sans-serif", fontSize: 21, fontWeight: 800, color: '#FFF', marginBottom: 4, position: 'relative', zIndex: 1 }}>
          {greetName ? `Suprabhat, ${greetName}!` : 'Suprabhat!'} 🔱
        </div>
        <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.8)', marginBottom: 16, position: 'relative', zIndex: 1 }}>
          {dateStr} · {weekdayInfo.name}
        </div>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 16, padding: '10px 18px',
          marginBottom: 14, position: 'relative', zIndex: 1,
        }}>
          <span style={{ fontSize: 26, fontWeight: 800, color: '#FFF' }}>#{dayNum}</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.85)', fontWeight: 700 }}>Aaj Ka Lucky Number</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{weekdayInfo.planet} · {weekdayInfo.sector}</div>
          </div>
        </div>

        {isPersonalMatch && (
          <div style={{
            fontSize: 12, fontWeight: 800, color: '#FFF',
            backgroundColor: 'rgba(255,255,255,0.22)', padding: '8px 14px', borderRadius: 12,
            marginBottom: 12, position: 'relative', zIndex: 1,
          }}>
            ⭐ Aaj tera personal lucky din hai — Life Path {lifePath} se match!
          </div>
        )}

        <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.88)', lineHeight: 1.6, position: 'relative', zIndex: 1 }}>
          💡 {pickLine(MORNING_LINES, now.toDateString() + (userDob || ''))}
        </div>
      </div>
    );
  }

  // Closing summary
  const todayStr = now.toDateString();
  const todayTrades = history.filter(h => new Date(h.date).toDateString() === todayStr);
  const wins = todayTrades.filter(h => h.outcome === 'win').length;
  const losses = todayTrades.filter(h => h.outcome === 'loss').length;
  const pending = todayTrades.filter(h => h.outcome === 'pending').length;
  const greenWatch = watchlist.filter(w => w.lastTrend === 'Bullish').length;
  const redWatch = watchlist.filter(w => w.lastTrend === 'Bearish').length;

  return (
    <div style={cardStyle}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.12), transparent)',
        pointerEvents: 'none',
      }} />
      <div style={{ fontSize: 9.5, letterSpacing: 2.5, color: 'rgba(255,255,255,0.8)', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', position: 'relative', zIndex: 1 }}>
        🌇 Market Closed
      </div>
      <div style={{ fontFamily: "'Sora', system-ui, sans-serif", fontSize: 20, fontWeight: 800, color: '#FFF', marginBottom: 4, position: 'relative', zIndex: 1 }}>
        Aaj Ka Din Kaisa Raha?
      </div>
      <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.75)', marginBottom: 18, position: 'relative', zIndex: 1 }}>
        {dateStr}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, position: 'relative', zIndex: 1 }}>
        <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 14, padding: '12px 6px' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#4ADE80' }}>{wins}</div>
          <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.75)', fontWeight: 700, marginTop: 2 }}>WINS</div>
        </div>
        <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 14, padding: '12px 6px' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#F87171' }}>{losses}</div>
          <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.75)', fontWeight: 700, marginTop: 2 }}>LOSSES</div>
        </div>
        <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 14, padding: '12px 6px' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#FBBF24' }}>{pending}</div>
          <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.75)', fontWeight: 700, marginTop: 2 }}>PENDING</div>
        </div>
      </div>

      {watchlist.length > 0 && (
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: '10px 14px',
          marginBottom: 14, fontSize: 12, color: '#FFF', position: 'relative', zIndex: 1,
        }}>
          ⭐ Watchlist: <span style={{ color: '#4ADE80', fontWeight: 700 }}>{greenWatch} Bullish</span> · <span style={{ color: '#F87171', fontWeight: 700 }}>{redWatch} Bearish</span>
        </div>
      )}

      <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, position: 'relative', zIndex: 1 }}>
        💡 {pickLine(CLOSING_LINES, now.toDateString() + (userDob || ''))}
      </div>
    </div>
  );
}

