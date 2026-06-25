import { useState } from 'react';

const DARK_C = {
  bg: '#0D1117', surface: '#161B22', border: '#30363D',
  text: '#E8E6E0', muted: '#8B92A0', gold: '#D8A33D',
  green: '#3FAE7C', red: '#F87171', greenBg: '#0D2B1F',
};
const LIGHT_C = {
  bg: '#F4F6FA', surface: '#FFFFFF', border: '#E2E8F0',
  text: '#0F172A', muted: '#64748B', gold: '#C8920A',
  green: '#059669', red: '#DC2626', greenBg: '#ECFDF5',
};

const COURSES = [
  {
    id: 1,
    icon: '🕯️',
    title: 'Candlestick Patterns',
    desc: '15+ patterns — Beginner to Pro',
    price: 299,
    available: true,
    pages: '20+ Pages',
    topics: ['Hammer, Engulfing, Morning Star', 'Shooting Star, Evening Star', 'Doji, Spinning Top', '7 Golden Rules', 'Quiz included'],
    color: '#C8920A',
  },
  {
    id: 2,
    icon: '📊',
    title: 'RSI Mastery',
    desc: 'Overbought, Oversold — Signals',
    price: 299,
    available: false,
    pages: '15+ Pages',
    topics: ['RSI kya hai?', 'Overbought aur Oversold', 'RSI Divergence', 'Entry/Exit rules', 'Real examples'],
    color: '#3FAE7C',
  },
  {
    id: 3,
    icon: '📈',
    title: 'MACD Trading',
    desc: 'Crossover, Divergence — Strategy',
    price: 299,
    available: false,
    pages: '15+ Pages',
    topics: ['MACD kya hai?', 'Signal line crossover', 'Bullish/Bearish divergence', 'Strategy with examples', 'Common mistakes'],
    color: '#3B82F6',
  },
  {
    id: 4,
    icon: '🎯',
    title: 'Supertrend Strategy',
    desc: 'Trend follow karo — Easy!',
    price: 299,
    available: false,
    pages: '12+ Pages',
    topics: ['Supertrend setup', 'Buy/Sell signals', 'Stop loss placement', 'Combining with RSI', 'Backtesting results'],
    color: '#F59E0B',
  },
  {
    id: 5,
    icon: '🧠',
    title: 'Trading Psychology',
    desc: 'FOMO, Fear, Greed — Control karo',
    price: 399,
    available: false,
    pages: '18+ Pages',
    topics: ['FOMO kya hai?', 'Fear aur Greed control', 'Discipline kaise rakhen', 'Loss recovery mindset', 'Daily routine traders ka'],
    color: '#7C3AED',
  },
  {
    id: 6,
    icon: '💰',
    title: 'Position Sizing',
    desc: 'Risk management — Capital bachao',
    price: 199,
    available: false,
    pages: '10+ Pages',
    topics: ['Risk per trade', 'Position size formula', 'Stop loss calculation', 'Portfolio management', 'Real examples'],
    color: '#EC4899',
  },
];

export default function Academy({ isDark }) {
  const C = isDark ? DARK_C : LIGHT_C;
  const [selectedCourse, setSelectedCourse] = useState(null);

  const cardStyle = {
    backgroundColor: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 16, padding: 16, marginBottom: 10,
    boxShadow: isDark ? '0 2px 16px rgba(0,0,0,0.4)' : '0 1px 6px rgba(0,0,0,0.05)',
  };

  if (selectedCourse) {
    const course = COURSES.find(c => c.id === selectedCourse);
    return (
      <div style={{ backgroundColor: C.bg, minHeight: '100vh', padding: '16px 16px 100px', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <button onClick={() => setSelectedCourse(null)} style={{
            background: 'none', border: 'none', color: C.gold,
            fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>← Wapas Jao</button>

          <div style={{
            background: isDark
              ? `linear-gradient(135deg, #0D1117, ${course.color}22)`
              : `linear-gradient(135deg, #FFFFFF, ${course.color}11)`,
            border: `1.5px solid ${course.color}`,
            borderRadius: 20, padding: 24, marginBottom: 16,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>{course.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.text, marginBottom: 4 }}>{course.title}</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>{course.desc}</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {[course.pages, 'Lifetime Access', 'Hinglish mein', 'Quiz included'].map(tag => (
                <span key={tag} style={{
                  fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
                  backgroundColor: `${course.color}22`, color: course.color,
                  border: `1px solid ${course.color}44`,
                }}>{tag}</span>
              ))}
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: course.color, fontWeight: 800, marginBottom: 12 }}>📚 IS COURSE MEIN KYA SIKHOGE?</div>
            {course.topics.map((topic, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < course.topics.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                <span style={{ color: C.green, fontWeight: 700, fontSize: 14 }}>✅</span>
                <span style={{ fontSize: 13, color: C.text }}>{topic}</span>
              </div>
            ))}
          </div>

          <div style={{
            backgroundColor: C.surface, border: `1.5px solid ${course.color}`,
            borderRadius: 16, padding: 20, marginBottom: 16,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Course Price</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: course.color }}>₹{course.price}</div>
                <div style={{ fontSize: 11, color: C.muted }}>One time — Lifetime access</div>
              </div>
              {course.available ? (
                <div style={{ backgroundColor: C.green, color: '#FFF', fontSize: 11, fontWeight: 800, padding: '8px 14px', borderRadius: 10, textAlign: 'center' }}>
                  ✅ Available<br/>NOW!
                </div>
              ) : (
                <div style={{ backgroundColor: C.border, color: C.muted, fontSize: 11, fontWeight: 800, padding: '8px 14px', borderRadius: 10, textAlign: 'center' }}>
                  🔜 Coming<br/>Soon!
                </div>
              )}
            </div>

            {course.available ? (
              <button style={{
                width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                background: `linear-gradient(135deg, ${course.color}, ${course.color}cc)`,
                color: '#FFF', fontWeight: 800, fontSize: 15, cursor: 'pointer',
              }}>
                📥 Abhi Kharido — ₹{course.price}
              </button>
            ) : (
              <button style={{
                width: '100%', padding: '14px', borderRadius: 12, border: `1.5px solid ${C.border}`,
                backgroundColor: 'transparent', color: C.muted,
                fontWeight: 700, fontSize: 14, cursor: 'not-allowed',
              }}>
                🔜 Coming Soon — Notify Karo
              </button>
            )}
          </div>

          <div style={{ fontSize: 11, color: C.muted, textAlign: 'center' }}>
            📧 Support: support@pulsetrade.in
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: C.bg, minHeight: '100vh', padding: '16px 16px 100px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>

        {/* HEADER */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: '#7C3AED', fontWeight: 800, marginBottom: 4 }}>🎓 PULSETRADE ACADEMY</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: C.text }}>
            Trading <span style={{ color: '#7C3AED' }}>Sikho</span>
          </div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>Hinglish mein — Practical — Affordable!</div>
        </div>

        {/* BUNDLE CARD */}
        <div style={{
          background: isDark
            ? 'linear-gradient(135deg, #0D0A1A, #1A0D2E)'
            : 'linear-gradient(135deg, #F5F0FF, #FFFFFF)',
          border: '1.5px solid #7C3AED',
          borderRadius: 16, padding: 16, marginBottom: 16,
          boxShadow: '0 4px 20px rgba(124,58,237,0.15)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: 2, color: '#7C3AED', fontWeight: 800, marginBottom: 4 }}>💎 BUNDLE DEAL</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: C.text }}>Sab Courses</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>6 courses • Save ₹500+</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: C.muted, textDecoration: 'line-through' }}>₹1,994</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#7C3AED' }}>₹1,499</div>
            </div>
          </div>
        </div>

        {/* COURSES LIST */}
        <div style={{ fontSize: 10, letterSpacing: 2, color: C.gold, fontWeight: 800, marginBottom: 12 }}>📚 ALL COURSES</div>

        {COURSES.map(course => (
          <div key={course.id} onClick={() => setSelectedCourse(course.id)} style={{
            backgroundColor: C.surface,
            border: `1.5px solid ${course.available ? course.color : C.border}`,
            borderRadius: 16, padding: 16, marginBottom: 10,
            cursor: 'pointer',
            boxShadow: course.available ? `0 4px 16px ${course.color}22` : 'none',
            opacity: course.available ? 1 : 0.8,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 36, flexShrink: 0 }}>{course.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{course.title}</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: course.color }}>₹{course.price}</div>
                </div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{course.desc}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
                    backgroundColor: course.available ? C.greenBg : `${C.border}`,
                    color: course.available ? C.green : C.muted,
                  }}>
                    {course.available ? '✅ Available' : '🔜 Coming Soon'}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
                    backgroundColor: `${course.color}15`, color: course.color,
                  }}>
                    {course.pages}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: C.muted }}>
          📧 support@pulsetrade.in | pulsetrade.in
        </div>
      </div>
    </div>
  );
}
