import { useState, useMemo } from 'react';

// Chaldean-style single-digit reduction
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

function getDateNumber(day, month, year) {
  const digits = `${day}${month}${year}`.split('').map(Number);
  return reduceToSingle(digits.reduce((a, b) => a + b, 0));
}

// Weekday planetary energy (0 = Sunday ... 6 = Saturday)
const WEEKDAY = {
  0: { name: 'Raviwar', planet: '☀️ Surya', sector: 'Energy, PSU', base: 62 },
  1: { name: 'Somwar', planet: '🌙 Chandra', sector: 'FMCG, Pharma', base: 58 },
  2: { name: 'Mangalwar', planet: '🔴 Mangal', sector: 'Defense, Steel', base: 68 },
  3: { name: 'Budhwar', planet: '💚 Budh', sector: 'IT, Telecom', base: 65 },
  4: { name: 'Guruwar', planet: '🟡 Guru', sector: 'Banking, Finance', base: 70 },
  5: { name: 'Shukrawar', planet: '✨ Shukra', sector: 'Auto, Luxury', base: 66 },
  6: { name: 'Shaniwar', planet: '⚫ Shani', sector: 'Market closed', base: 30 },
};

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function MuhuratCalendar({ isDark, userDob, userName }) {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState(today.getDate());

  const lifePath = getLifePath(userDob);

  const days = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const arr = [];
    for (let i = 0; i < firstDay; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const weekday = new Date(viewYear, viewMonth, d).getDay();
      const dateNum = getDateNumber(d, viewMonth + 1, viewYear);
      const weekdayInfo = WEEKDAY[weekday];
      const isPersonalMatch = lifePath ? (dateNum === lifePath) : false;
      let score = weekdayInfo.base + (dateNum * 2);
      if (isPersonalMatch) score += 20;
      score = Math.min(98, score);
      arr.push({ day: d, weekday, dateNum, score, isPersonalMatch, weekdayInfo });
    }
    return arr;
  }, [viewMonth, viewYear, lifePath]);

  const selected = days.find(d => d && d.day === selectedDay);

  const changeMonth = (delta) => {
    let m = viewMonth + delta, y = viewYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setViewMonth(m); setViewYear(y);
    setSelectedDay(1);
  };

  const tierOf = (score) => score >= 85 ? 'fire' : score >= 70 ? 'star' : score >= 50 ? 'ok' : 'low';
  const tierIcon = { fire: '🔥', star: '🌟', ok: '·', low: '' };

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&display=swap');
        @keyframes mc-gradient-shift { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
      `}</style>

      {/* HEADER CARD */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, #4F46E5 0%, #8B5CF6 55%, #0EA5A4 100%)',
        backgroundSize: '200% 200%',
        animation: 'mc-gradient-shift 8s ease-in-out infinite',
        borderRadius: 24, padding: '22px 20px', marginBottom: 20,
        boxShadow: '0 8px 0 #3730A3, 0 18px 32px rgba(79,70,229,0.28), 0 2px 0 rgba(255,255,255,0.25) inset',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.16), transparent)',
          pointerEvents: 'none',
        }} />
        <div style={{ fontSize: 9.5, letterSpacing: 2.5, color: 'rgba(255,255,255,0.85)', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', position: 'relative', zIndex: 1 }}>
          🔱 Muhurat Calendar
        </div>
        <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 800, color: '#FFF', marginBottom: 6, position: 'relative', zIndex: 1 }}>
          Tera Lucky Trading Din Dekho
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, position: 'relative', zIndex: 1 }}>
          {lifePath
            ? `Life Path ${lifePath} ke hisaab se, tere personal high-energy din highlight kiye gaye hain.`
            : 'Profile mein DOB add karo — tere personal lucky din dekhne ke liye.'}
        </div>
      </div>

      {/* MONTH NAV */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <button onClick={() => changeMonth(-1)} style={{
          width: 36, height: 36, borderRadius: 12, border: 'none',
          background: isDark ? '#1A1830' : '#FFFFFF',
          boxShadow: isDark ? '0 4px 10px rgba(0,0,0,0.3)' : '0 4px 10px rgba(30,27,75,0.08)',
          color: '#4F46E5', fontSize: 16, fontWeight: 800, cursor: 'pointer',
        }}>‹</button>
        <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 16, fontWeight: 800, color: isDark ? '#F1F0FF' : '#1E1B4B' }}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </div>
        <button onClick={() => changeMonth(1)} style={{
          width: 36, height: 36, borderRadius: 12, border: 'none',
          background: isDark ? '#1A1830' : '#FFFFFF',
          boxShadow: isDark ? '0 4px 10px rgba(0,0,0,0.3)' : '0 4px 10px rgba(30,27,75,0.08)',
          color: '#4F46E5', fontSize: 16, fontWeight: 800, cursor: 'pointer',
        }}>›</button>
      </div>

      {/* CALENDAR GRID */}
      <div style={{
        background: isDark ? '#1A1830' : '#FFFFFF',
        borderRadius: 20, padding: 14, marginBottom: 16,
        boxShadow: isDark ? '0 10px 24px rgba(0,0,0,0.3)' : '0 8px 20px rgba(30,27,75,0.06)',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 6 }}>
          {['S','M','T','W','T','F','S'].map((d, i) => (
            <div key={i} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: isDark ? '#9C9AC4' : '#9CA3AF' }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
          {days.map((d, i) => {
            if (!d) return <div key={i} />;
            const tier = tierOf(d.score);
            const isToday = d.day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
            const isSelected = d.day === selectedDay;
            return (
              <button key={i} onClick={() => setSelectedDay(d.day)} style={{
                aspectRatio: '1', borderRadius: 10, border: isToday ? '1.5px solid #4F46E5' : 'none',
                background: isSelected
                  ? 'linear-gradient(135deg, #4F46E5, #0EA5A4)'
                  : d.isPersonalMatch
                    ? (isDark ? 'rgba(139,92,246,0.2)' : '#EEF2FF')
                    : 'transparent',
                color: isSelected ? '#FFF' : (isDark ? '#F1F0FF' : '#1E1B4B'),
                fontSize: 12, fontWeight: isSelected || d.isPersonalMatch ? 800 : 600,
                cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                position: 'relative', padding: 0,
              }}>
                {d.day}
                <span style={{ fontSize: 8, marginTop: 1, opacity: 0.9 }}>{tierIcon[tier]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SELECTED DAY DETAIL */}
      {selected && (
        <div style={{
          background: isDark ? '#1A1830' : '#FFFFFF',
          borderRadius: 20, padding: 18,
          boxShadow: isDark ? '0 6px 0 #2E2A52, 0 14px 26px rgba(0,0,0,0.3)' : '0 6px 0 #E5E9F5, 0 12px 22px rgba(30,27,75,0.06)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 16, fontWeight: 800, color: isDark ? '#F1F0FF' : '#1E1B4B' }}>
                {selected.day} {MONTH_NAMES[viewMonth]} — {selected.weekdayInfo.name}
              </div>
              <div style={{ fontSize: 11.5, color: isDark ? '#9C9AC4' : '#6B7280', marginTop: 2 }}>
                {selected.weekdayInfo.planet} · Date Number #{selected.dateNum}
              </div>
            </div>
            <div style={{
              fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 800,
              color: selected.score >= 70 ? '#16A34A' : selected.score >= 50 ? '#4F46E5' : '#EF4444',
            }}>{selected.score}</div>
          </div>

          {selected.isPersonalMatch && (
            <div style={{
              background: isDark ? 'rgba(139,92,246,0.15)' : '#EEF2FF',
              borderRadius: 12, padding: '10px 14px', marginBottom: 10,
              fontSize: 12.5, color: isDark ? '#C4B5FD' : '#4F46E5', fontWeight: 700,
            }}>
              ⭐ Ye tera personal lucky din hai — tere Life Path {lifePath} se match karta hai!
            </div>
          )}

          <div style={{ fontSize: 12.5, color: isDark ? '#D4D2F0' : '#3F3D6B', lineHeight: 1.7 }}>
            💡 Favorable sectors: <strong>{selected.weekdayInfo.sector}</strong>
          </div>
        </div>
      )}

      <div style={{
        marginTop: 16, fontSize: 11, color: isDark ? '#9C9AC4' : '#6B7280',
        textAlign: 'center', lineHeight: 1.6,
      }}>
        ✨ Sirf entertainment/numerology ke liye — investment advice nahi hai!
      </div>
    </div>
  );
}
