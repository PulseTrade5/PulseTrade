import { useState, useEffect } from 'react';

const DARK = {
  bg: "#100E1F", surface: "#1A1830", border: "#2E2A52",
  gold: "#8B5CF6", goldLight: "#241F42", goldDim: "#A78BFA",
  green: "#4ADE80", greenLight: "#0F2A1E",
  red: "#F87171", redLight: "#2D1515",
  text: "#F1F0FF", muted: "#9C9AC4",
  purple: "#8B5CF6", purpleLight: "#241F42",
};

const LIGHT = {
  bg: "#F5F7FC", surface: "#FFFFFF", border: "#E5E9F5",
  gold: "#4F46E5", goldLight: "#EEF2FF", goldDim: "#4338CA",
  green: "#16A34A", greenLight: "#F0FDF4",
  red: "#EF4444", redLight: "#FEF2F2",
  text: "#1E1B4B", muted: "#6B7280",
  purple: "#4F46E5", purpleLight: "#EEF2FF",
};

const MONTHS = [
  ['01', 'Jan'], ['02', 'Feb'], ['03', 'Mar'], ['04', 'Apr'],
  ['05', 'May'], ['06', 'Jun'], ['07', 'Jul'], ['08', 'Aug'],
  ['09', 'Sep'], ['10', 'Oct'], ['11', 'Nov'], ['12', 'Dec'],
];
const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1939 }, (_, i) => String(CURRENT_YEAR - i));

// Chaldean Numerology Table
const CHALDEAN = {
  A:1,I:1,J:1,Q:1,Y:1,
  B:2,K:2,R:2,
  C:3,G:3,L:3,S:3,
  D:4,M:4,T:4,
  E:5,H:5,N:5,X:5,
  U:6,V:6,W:6,
  O:7,Z:7,
  F:8,P:8,
};

function chaldeanSum(name) {
  const clean = name.toUpperCase().replace(/[^A-Z]/g, '');
  let sum = 0;
  for (const ch of clean) sum += CHALDEAN[ch] || 0;
  while (sum > 9 && sum !== 11 && sum !== 22) {
    sum = String(sum).split('').reduce((a, b) => a + Number(b), 0);
  }
  return sum;
}

function lifePathNumber(dob) {
  const digits = dob.replace(/-/g, '').split('').map(Number);
  let sum = digits.reduce((a, b) => a + b, 0);
  while (sum > 9 && sum !== 11 && sum !== 22) {
    sum = String(sum).split('').map(Number).reduce((a, b) => a + b, 0);
  }
  return sum;
}

function numberMeaning(n) {
  const meanings = {
    1: { name: 'Sun — Leader', color: '#F59E0B', desc: 'Aaj tum leader ho — bold decisions lo!', lucky: 'Metals, Energy', avoid: 'Banking stocks', time: '9:00–10:30' },
    2: { name: 'Moon — Diplomat', color: '#94A3B8', desc: 'Patience rakho — emotional decisions mat lo!', lucky: 'FMCG, Pharma', avoid: 'Volatile small caps', time: '10:00–11:30' },
    3: { name: 'Jupiter — Guru', color: '#818CF8', desc: 'Learning aur growth ka din — naye sectors explore karo!', lucky: 'IT, Education', avoid: 'Debt-heavy stocks', time: '11:00–12:00' },
    4: { name: 'Rahu — Builder', color: '#6B7280', desc: 'Foundation strong karo — long term investments sahi rahenge!', lucky: 'Infrastructure, Real Estate', avoid: 'Speculative trades', time: '2:00–3:00' },
    5: { name: 'Mercury — Communicator', color: '#10B981', desc: 'Quick trades aur fast moves — speed mein kaam karo!', lucky: 'Telecom, Tech', avoid: 'Slow-moving sectors', time: '9:15–10:15' },
    6: { name: 'Venus — Harmony', color: '#EC4899', desc: 'Luxury aur beauty stocks shine karenge aaj!', lucky: 'Auto, Consumer, Luxury', avoid: 'Industrial stocks', time: '1:00–2:30' },
    7: { name: 'Ketu — Mystic', color: '#8B5CF6', desc: 'Research aur analysis ka din — jaldi mat karo!', lucky: 'Pharma, Research', avoid: 'Momentum plays', time: '11:30–1:00' },
    8: { name: 'Saturn — Disciplined', color: '#374151', desc: 'Discipline aur patience — safe plays karo aaj!', lucky: 'Infrastructure, Oil & Gas', avoid: 'High-risk trades', time: '3:00–3:30' },
    9: { name: 'Mars — Warrior', color: '#EF4444', desc: 'Action ka din — aggressive moves kar sakte ho!', lucky: 'Defense, Power', avoid: 'Passive investments', time: '9:15–9:45' },
    11: { name: 'Master Number — Intuitive', color: '#A78BFA', desc: 'Tera intuition strong hai aaj — trust karo!', lucky: 'Tech, Innovation', avoid: 'Traditional sectors', time: '10:30–12:00' },
    22: { name: 'Master Builder — Visionary', color: '#F59E0B', desc: 'Bade moves ke liye perfect din — vision se kaam karo!', lucky: 'All sectors', avoid: 'Nothing — sab favorable!', time: '9:00–3:30' },
  };
  return meanings[n] || meanings[1];
}

function weeklyForecast(lpn) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayNums = [1, 2, 3, 4, 5, 6, 7];
  const compatibility = {
    1: [1, 3, 5, 9], 2: [2, 4, 6, 8], 3: [1, 3, 6, 9],
    4: [2, 4, 8], 5: [1, 5, 6, 9], 6: [3, 5, 6, 9],
    7: [2, 7], 8: [2, 4, 8], 9: [1, 3, 5, 9],
    11: [1, 2, 11], 22: [4, 8, 22],
  };
  const today = new Date().getDay();
  return days.map((day, i) => {
    const dayNum = dayNums[i];
    const lucky = (compatibility[lpn] || [1, 5, 9]).includes(dayNum);
    const isToday = i === today;
    return { day, dayNum, lucky, isToday };
  });
}

function compatibilityScore(userNum, stockName) {
  const stockNum = chaldeanSum(stockName);
  const compatible = {
    1: [1, 3, 5, 9], 2: [2, 4, 6], 3: [1, 3, 6, 9],
    4: [2, 4, 8], 5: [1, 5, 6, 9], 6: [3, 5, 6, 9],
    7: [2, 7], 8: [2, 4, 8], 9: [1, 3, 5, 9],
    11: [1, 2, 11], 22: [4, 8, 22],
  };
  const list = compatible[userNum] || [];
  const score = list.includes(stockNum) ? 'High' : stockNum === userNum ? 'Very High' : 'Low';
  return { stockNum, score };
}

export default function NumerologyPanel({ isDark, userDob, userName }) {
  const C = isDark ? DARK : LIGHT;
  const [activeSection, setActiveSection] = useState('lucky');
  const [name, setName] = useState(userName || '');
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [lpn, setLpn] = useState(null);
  const [personalNum, setPersonalNum] = useState(null);
  const [stockName, setStockName] = useState('');
  const [stockResult, setStockResult] = useState(null);
  const [compatStock, setCompatStock] = useState('');
  const [compatResult, setCompatResult] = useState(null);
  const [calculated, setCalculated] = useState(false);

  useEffect(() => {
    if (userDob) {
      const parts = userDob.split('-');
      if (parts.length === 3) {
        setDobYear(parts[0]);
        setDobMonth(parts[1]);
        setDobDay(parts[2]);
      }
    }
    if (userName) setName(userName);
  }, [userDob, userName]);

  const dob = (dobDay && dobMonth && dobYear) ? `${dobYear}-${dobMonth}-${dobDay}` : '';

  const calculate = () => {
    if (!dob) { alert('DOB daalo pehle!'); return; }
    const lp = lifePathNumber(dob);
    setLpn(lp);
    if (name) setPersonalNum(chaldeanSum(name));
    setCalculated(true);
  };

  const analyzeStock = () => {
    if (!stockName.trim()) return;
    const num = chaldeanSum(stockName);
    setStockResult({ num, meaning: numberMeaning(num) });
  };

  const checkCompatibility = () => {
    if (!compatStock.trim() || !lpn) { alert('Pehle apna number calculate karo!'); return; }
    const result = compatibilityScore(lpn, compatStock);
    setCompatResult(result);
  };

  const cardStyle = {
    backgroundColor: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 16, padding: 18, marginBottom: 14,
  };

  const dobSelectStyle = {
    flex: 1, padding: '10px 8px', fontSize: 13, textAlign: 'center',
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFF',
    border: `1.5px solid ${C.border}`, borderRadius: 10,
    color: C.text, outline: 'none',
  };

  const sections = [
    { id: 'lucky', label: '🔢 Lucky No.' },
    { id: 'stock', label: '📊 Stock Score' },
    { id: 'time', label: '⏰ Lucky Time' },
    { id: 'week', label: '📅 Weekly' },
    { id: 'compat', label: '💫 Match' },
  ];

  const meaning = lpn ? numberMeaning(lpn) : null;

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', color: C.text }}>

      {/* HEADER */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&display=swap');
        @keyframes np-gradient-shift { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
      `}</style>
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, #4F46E5 0%, #8B5CF6 55%, #0EA5A4 100%)',
        backgroundSize: '200% 200%',
        animation: 'np-gradient-shift 8s ease-in-out infinite',
        borderRadius: 24, padding: '22px 18px', marginBottom: 24,
        boxShadow: '0 8px 0 #3730A3, 0 18px 32px rgba(79,70,229,0.28), 0 2px 0 rgba(255,255,255,0.25) inset',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.16), transparent)',
          borderRadius: '24px 24px 0 0', pointerEvents: 'none',
        }} />
        <div style={{ fontSize: 9.5, letterSpacing: 2.5, color: 'rgba(255,255,255,0.85)', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', position: 'relative', zIndex: 1 }}>
          🔢 Pulse Numerology
        </div>
        <div style={{ fontFamily: "'Sora', system-ui, sans-serif", fontSize: 20, fontWeight: 800, color: '#FFF', marginBottom: 6, position: 'relative', zIndex: 1 }}>
          Trading + Numbers = 🎯
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, position: 'relative', zIndex: 1 }}>
          Chaldean Numerology se apna lucky number, stock compatibility aur weekly forecast dekho!
        </div>

        {/* Input fields */}
        {!calculated && (
          <div style={{ marginTop: 16, position: 'relative', zIndex: 1 }}>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Apna naam likho (e.g. Prabhat)"
              style={{
                width: '100%', padding: '10px 14px', fontSize: 13,
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFF',
                border: `1.5px solid ${C.border}`, borderRadius: 10,
                color: C.text, outline: 'none', marginBottom: 10,
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              <select value={dobDay} onChange={e => setDobDay(e.target.value)} style={dobSelectStyle}>
                <option value="">Din</option>
                {DAYS.map(d => <option key={d} value={d}>{parseInt(d)}</option>)}
              </select>
              <select value={dobMonth} onChange={e => setDobMonth(e.target.value)} style={dobSelectStyle}>
                <option value="">Mahina</option>
                {MONTHS.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
              </select>
              <select value={dobYear} onChange={e => setDobYear(e.target.value)} style={dobSelectStyle}>
                <option value="">Saal</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <button onClick={calculate} style={{
              width: '100%', padding: '13px', borderRadius: 12, border: 'none',
              background: `linear-gradient(135deg, ${C.purple}, #A78BFA)`,
              color: '#FFF', fontSize: 14, fontWeight: 800, cursor: 'pointer',
              boxShadow: `0 4px 20px ${C.purple}44`,
            }}>
              🔢 Mera Number Nikalo
            </button>
          </div>
        )}

        {calculated && lpn && (
          <div style={{
            marginTop: 16, display: 'flex', alignItems: 'center', gap: 16,
            backgroundColor: isDark ? 'rgba(167,139,250,0.1)' : 'rgba(124,58,237,0.08)',
            borderRadius: 14, padding: '14px 16px',
            border: `1px solid ${C.purple}44`,
          }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: `linear-gradient(135deg, ${C.purple}, #A78BFA)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 900, color: '#FFF', flexShrink: 0,
            }}>{lpn}</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>
                Life Path: {meaning?.name}
              </div>
              {personalNum && (
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                  Naam Number: {personalNum}
                </div>
              )}
              <button onClick={() => setCalculated(false)} style={{
                marginTop: 6, fontSize: 11, color: C.purple, background: 'none',
                border: 'none', cursor: 'pointer', fontWeight: 700, padding: 0,
              }}>✏️ Change karo</button>
            </div>
          </div>
        )}
      </div>

      {/* SECTION TABS */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 16,
        backgroundColor: C.surface, padding: 4,
        borderRadius: 14, border: `1px solid ${C.border}`,
        overflowX: 'auto',
      }}>
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
            flex: 1, padding: '8px 4px', fontSize: 10, fontWeight: 700,
            borderRadius: 10, border: 'none', whiteSpace: 'nowrap',
            backgroundColor: activeSection === s.id ? C.purple : 'transparent',
            color: activeSection === s.id ? '#FFF' : C.muted,
            cursor: 'pointer', transition: 'background 0.2s',
          }}>{s.label}</button>
        ))}
      </div>

      {/* SECTION 1 — PERSONAL LUCKY NUMBER */}
      {activeSection === 'lucky' && (
        <div>
          {!calculated ? (
            <div style={{ ...cardStyle, textAlign: 'center', padding: '32px 20px' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔢</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 8 }}>
                Pehle apna naam aur DOB daalo!
              </div>
              <div style={{ fontSize: 13, color: C.muted }}>Upar wale box mein fill karo</div>
            </div>
          ) : (
            <>
              <div style={{
                ...cardStyle,
                background: isDark
                  ? `linear-gradient(135deg, ${C.purple}22, ${C.surface})`
                  : `linear-gradient(135deg, ${C.purpleLight}, #FFF)`,
                border: `1.5px solid ${C.purple}66`,
              }}>
                <div style={{ fontSize: 10, letterSpacing: 2, color: C.purple, fontWeight: 800, marginBottom: 14 }}>
                  🔢 TERA PERSONAL LUCKY NUMBER
                </div>

                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  <div style={{
                    flex: 1, backgroundColor: isDark ? 'rgba(167,139,250,0.15)' : '#EDE9FE',
                    borderRadius: 14, padding: 16, textAlign: 'center',
                    border: `1.5px solid ${C.purple}44`,
                  }}>
                    <div style={{ fontSize: 11, color: C.purple, fontWeight: 700, marginBottom: 4 }}>LIFE PATH</div>
                    <div style={{ fontSize: 40, fontWeight: 900, color: C.purple }}>{lpn}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{meaning?.name}</div>
                  </div>
                  {personalNum && (
                    <div style={{
                      flex: 1, backgroundColor: isDark ? `${C.gold}22` : C.goldLight,
                      borderRadius: 14, padding: 16, textAlign: 'center',
                      border: `1.5px solid ${C.gold}44`,
                    }}>
                      <div style={{ fontSize: 11, color: C.gold, fontWeight: 700, marginBottom: 4 }}>NAAM NUMBER</div>
                      <div style={{ fontSize: 40, fontWeight: 900, color: C.gold }}>{personalNum}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Chaldean</div>
                    </div>
                  )}
                </div>

                <div style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(124,58,237,0.06)',
                  borderRadius: 12, padding: '14px 16px',
                  border: `1px solid ${C.purple}22`,
                }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: meaning?.color, marginBottom: 8 }}>
                    🌟 {meaning?.name}
                  </div>
                  <div style={{ fontSize: 13, color: C.text, lineHeight: 1.7 }}>{meaning?.desc}</div>
                </div>
              </div>

              <div style={cardStyle}>
                <div style={{ fontSize: 10, letterSpacing: 2, color: C.muted, fontWeight: 700, marginBottom: 14 }}>
                  📊 TERI TRADING PERSONALITY
                </div>
                {[
                  ['🎯 Lucky Sectors', meaning?.lucky],
                  ['⚠️ Avoid', meaning?.avoid],
                  ['⏰ Best Time', meaning?.time],
                ].map(([label, value]) => (
                  <div key={label} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '10px 0', borderBottom: `1px solid ${C.border}`,
                    fontSize: 13,
                  }}>
                    <span style={{ color: C.muted, fontWeight: 600 }}>{label}</span>
                    <span style={{ fontWeight: 700, color: C.text, textAlign: 'right', maxWidth: '60%' }}>{value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* SECTION 2 — STOCK NUMEROLOGY SCORE */}
      {activeSection === 'stock' && (
        <div>
          <div style={cardStyle}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: C.muted, fontWeight: 700, marginBottom: 14 }}>
              📊 STOCK NUMEROLOGY SCORE
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 14, lineHeight: 1.6 }}>
              Kisi bhi stock ka naam daalo — Chaldean Numerology se uska energy number nikaalenge!
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input
                value={stockName}
                onChange={e => setStockName(e.target.value.toUpperCase())}
                placeholder="e.g. RELIANCE, TCS, INFY"
                style={{
                  flex: 1, padding: '10px 14px', fontSize: 13,
                  backgroundColor: C.bg, border: `1.5px solid ${C.border}`,
                  borderRadius: 10, color: C.text, outline: 'none',
                }}
              />
              <button onClick={analyzeStock} style={{
                padding: '10px 16px', borderRadius: 10, border: 'none',
                backgroundColor: C.purple, color: '#FFF',
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
              }}>🔢</button>
            </div>

            {/* Popular stocks */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'SBIN', 'ITC'].map(s => (
                <button key={s} onClick={() => setStockName(s)} style={{
                  fontSize: 11, padding: '5px 12px', borderRadius: 20,
                  border: `1.5px solid ${stockName === s ? C.purple : C.border}`,
                  backgroundColor: stockName === s ? isDark ? C.purpleLight : '#EDE9FE' : 'transparent',
                  color: stockName === s ? C.purple : C.muted,
                  cursor: 'pointer', fontWeight: 600,
                }}>{s}</button>
              ))}
            </div>

            {stockResult && (
              <div style={{
                background: isDark
                  ? `linear-gradient(135deg, ${C.purple}15, ${C.surface})`
                  : `linear-gradient(135deg, #EDE9FE, #FFF)`,
                borderRadius: 14, padding: 16,
                border: `1.5px solid ${C.purple}44`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%',
                    background: `linear-gradient(135deg, ${stockResult.meaning.color}, ${C.purple})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 24, fontWeight: 900, color: '#FFF', flexShrink: 0,
                  }}>{stockResult.num}</div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{stockName}</div>
                    <div style={{ fontSize: 13, color: stockResult.meaning.color, fontWeight: 700 }}>
                      {stockResult.meaning.name}
                    </div>
                  </div>
                </div>
                <div style={{
                  fontSize: 13, color: C.text, lineHeight: 1.7,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(124,58,237,0.06)',
                  borderRadius: 10, padding: '12px 14px',
                }}>
                  {stockResult.meaning.desc}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <div style={{
                    flex: 1, backgroundColor: isDark ? C.greenLight : '#ECFDF5',
                    borderRadius: 10, padding: '10px', textAlign: 'center',
                    border: `1px solid ${C.green}33`,
                  }}>
                    <div style={{ fontSize: 10, color: C.green, fontWeight: 700 }}>LUCKY SECTORS</div>
                    <div style={{ fontSize: 12, color: C.text, marginTop: 4, fontWeight: 600 }}>{stockResult.meaning.lucky}</div>
                  </div>
                  <div style={{
                    flex: 1, backgroundColor: isDark ? C.goldLight : '#FFFBEB',
                    borderRadius: 10, padding: '10px', textAlign: 'center',
                    border: `1px solid ${C.gold}33`,
                  }}>
                    <div style={{ fontSize: 10, color: C.gold, fontWeight: 700 }}>BEST TIME</div>
                    <div style={{ fontSize: 12, color: C.text, marginTop: 4, fontWeight: 600 }}>{stockResult.meaning.time}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 3 — LUCKY TIME SLOTS */}
      {activeSection === 'time' && (
        <div>
          <div style={cardStyle}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: C.muted, fontWeight: 700, marginBottom: 14 }}>
              ⏰ LUCKY TRADING TIME SLOTS
            </div>

            {!calculated ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: C.muted, fontSize: 13 }}>
                Pehle apna naam aur DOB daalo upar! 👆
              </div>
            ) : (
              <>
                <div style={{
                  background: isDark
                    ? `linear-gradient(135deg, ${C.purple}22, ${C.surface})`
                    : `linear-gradient(135deg, ${C.purpleLight}, #FFF)`,
                  borderRadius: 14, padding: 16, marginBottom: 14,
                  border: `1.5px solid ${C.purple}44`,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.purple, marginBottom: 8 }}>
                    🌟 Tera Primary Lucky Time
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: C.text }}>{meaning?.time}</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                    Life Path {lpn} — {meaning?.name}
                  </div>
                </div>

                <div style={{ fontSize: 10, letterSpacing: 2, color: C.muted, fontWeight: 700, marginBottom: 12 }}>
                  📊 MARKET SESSION GUIDE
                </div>

                {[
                  { session: 'Pre-Market', time: '9:00–9:15', desc: 'Gap analysis aur news check karo', color: C.gold },
                  { session: 'Opening Bell', time: '9:15–10:00', desc: 'High volatility — careful raho', color: C.red },
                  { session: 'Mid Morning', time: '10:00–11:30', desc: 'Best swing entry time', color: C.green },
                  { session: 'Lunch Hours', time: '12:00–1:30', desc: 'Low volume — avoid karo', color: C.muted },
                  { session: 'Afternoon', time: '1:30–2:30', desc: 'Second best entry window', color: C.purple },
                  { session: 'Closing Bell', time: '3:00–3:30', desc: 'Volatile — positional exits', color: C.red },
                ].map(slot => (
                  <div key={slot.session} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 14px', borderRadius: 12, marginBottom: 8,
                    backgroundColor: slot.time.includes(meaning?.time?.split('–')[0]) || meaning?.time === '9:00–3:30'
                      ? isDark ? `${slot.color}22` : `${slot.color}11`
                      : isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                    border: `1px solid ${slot.time.includes(meaning?.time?.split('–')[0]) || meaning?.time === '9:00–3:30' ? slot.color + '44' : C.border}`,
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{slot.session}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{slot.desc}</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: slot.color }}>{slot.time}</div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* SECTION 4 — WEEKLY FORECAST */}
      {activeSection === 'week' && (
        <div>
          <div style={cardStyle}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: C.muted, fontWeight: 700, marginBottom: 14 }}>
              📅 WEEKLY TRADING FORECAST
            </div>

            {!calculated ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: C.muted, fontSize: 13 }}>
                Pehle apna naam aur DOB daalo upar! 👆
              </div>
            ) : (
              <>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 14, lineHeight: 1.6 }}>
                  Life Path {lpn} ke hisaab se tera weekly forecast:
                </div>

                {weeklyForecast(lpn).map(day => (
                  <div key={day.day} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', borderRadius: 12, marginBottom: 8,
                    backgroundColor: day.isToday
                      ? isDark ? `${C.gold}22` : C.goldLight
                      : day.lucky
                      ? isDark ? `${C.green}11` : '#F0FDF4'
                      : isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                    border: `1px solid ${day.isToday ? C.gold + '66' : day.lucky ? C.green + '33' : C.border}`,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      backgroundColor: day.lucky ? (isDark ? C.greenLight : '#DCFCE7') : isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18,
                    }}>
                      {day.isToday ? '👑' : day.lucky ? '✅' : '⏸️'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                        {day.day} {day.isToday && <span style={{ fontSize: 10, color: C.gold, fontWeight: 700 }}>← Aaj</span>}
                      </div>
                      <div style={{ fontSize: 11, color: day.lucky ? C.green : C.muted, fontWeight: 600, marginTop: 2 }}>
                        {day.lucky ? '🟢 Lucky day — Trade karo!' : '🟡 Average day — Careful raho'}
                      </div>
                    </div>
                    <div style={{
                      fontSize: 11, fontWeight: 800,
                      color: day.lucky ? C.green : C.muted,
                      backgroundColor: day.lucky
                        ? isDark ? C.greenLight : '#DCFCE7'
                        : isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9',
                      padding: '4px 10px', borderRadius: 20,
                    }}>
                      {day.lucky ? 'LUCKY' : 'NEUTRAL'}
                    </div>
                  </div>
                ))}

                <div style={{
                  marginTop: 14, padding: '12px 16px', borderRadius: 12,
                  backgroundColor: isDark ? `${C.purple}15` : `${C.purple}08`,
                  border: `1px solid ${C.purple}33`,
                  fontSize: 12, color: C.muted, lineHeight: 1.7,
                }}>
                  ✨ Sirf entertainment ke liye — investment advice nahi hai!
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* SECTION 5 — COMPATIBILITY */}
      {activeSection === 'compat' && (
        <div>
          <div style={cardStyle}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: C.muted, fontWeight: 700, marginBottom: 14 }}>
              💫 STOCK COMPATIBILITY CHECK
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 14, lineHeight: 1.6 }}>
              Dekho kaunsa stock tumhare number ke saath compatible hai!
            </div>

            {!calculated ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: C.muted, fontSize: 13 }}>
                Pehle apna naam aur DOB daalo upar! 👆
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                  <input
                    value={compatStock}
                    onChange={e => setCompatStock(e.target.value.toUpperCase())}
                    placeholder="Stock naam e.g. RELIANCE"
                    style={{
                      flex: 1, padding: '10px 14px', fontSize: 13,
                      backgroundColor: C.bg, border: `1.5px solid ${C.border}`,
                      borderRadius: 10, color: C.text, outline: 'none',
                    }}
                  />
                  <button onClick={checkCompatibility} style={{
                    padding: '10px 16px', borderRadius: 10, border: 'none',
                    backgroundColor: C.purple, color: '#FFF',
                    fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  }}>💫</button>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                  {['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'SBIN', 'ITC'].map(s => (
                    <button key={s} onClick={() => setCompatStock(s)} style={{
                      fontSize: 11, padding: '5px 12px', borderRadius: 20,
                      border: `1.5px solid ${compatStock === s ? C.purple : C.border}`,
                      backgroundColor: compatStock === s ? isDark ? C.purpleLight : '#EDE9FE' : 'transparent',
                      color: compatStock === s ? C.purple : C.muted,
                      cursor: 'pointer', fontWeight: 600,
                    }}>{s}</button>
                  ))}
                </div>

                {compatResult && (
                  <div style={{
                    background: compatResult.score === 'Very High'
                      ? isDark ? `${C.green}22` : '#F0FDF4'
                      : compatResult.score === 'High'
                      ? isDark ? `${C.gold}22` : C.goldLight
                      : isDark ? `${C.red}22` : '#FEF2F2',
                    borderRadius: 16, padding: 20,
                    border: `2px solid ${compatResult.score === 'Very High' ? C.green : compatResult.score === 'High' ? C.gold : C.red}44`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: C.text }}>{compatStock}</div>
                        <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                          Stock Number: {compatResult.stockNum} | Tera Number: {lpn}
                        </div>
                      </div>
                      <div style={{
                        fontSize: 13, fontWeight: 800,
                        color: compatResult.score === 'Very High' ? C.green : compatResult.score === 'High' ? C.gold : C.red,
                        backgroundColor: compatResult.score === 'Very High'
                          ? isDark ? C.greenLight : '#DCFCE7'
                          : compatResult.score === 'High'
                          ? isDark ? C.goldLight : '#FEF9C3'
                          : isDark ? C.redLight : '#FEE2E2',
                        padding: '6px 14px', borderRadius: 20,
                      }}>
                        {compatResult.score === 'Very High' ? '🔥 Very High' : compatResult.score === 'High' ? '✅ High' : '⚠️ Low'}
                      </div>
                    </div>
                    <div style={{
                      fontSize: 14, fontWeight: 700, color: C.text, lineHeight: 1.7,
                      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                      borderRadius: 10, padding: '12px 14px',
                    }}>
                      {compatResult.score === 'Very High'
                        ? `🔥 ${compatStock} tera favorite stock hona chahiye! Numbers perfectly match karte hain!`
                        : compatResult.score === 'High'
                        ? `✅ ${compatStock} tera lucky stock hai — yeh trades mein favorable rahega!`
                        : `⚠️ ${compatStock} tera number ${lpn} ke saath perfect match nahi karta — extra careful raho!`}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {calculated && (
            <div style={{
              ...cardStyle,
              background: isDark ? `linear-gradient(135deg, ${C.purple}15, ${C.surface})` : `linear-gradient(135deg, ${C.purpleLight}, #FFF)`,
              border: `1.5px solid ${C.purple}44`,
            }}>
              <div style={{ fontSize: 10, letterSpacing: 2, color: C.purple, fontWeight: 800, marginBottom: 12 }}>
                💫 TERI TOP COMPATIBLE STOCKS
              </div>
              {['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'SBIN', 'TATAMOTORS', 'ITC', 'ICICIBANK'].map(s => {
                const r = compatibilityScore(lpn, s);
                return (
                  <div key={s} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 0', borderBottom: `1px solid ${C.border}`,
                  }}>
                    <div>
                      <span style={{ fontWeight: 700, color: C.text, fontSize: 14 }}>{s}</span>
                      <span style={{ fontSize: 11, color: C.muted, marginLeft: 8 }}>#{r.stockNum}</span>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                      color: r.score === 'Very High' ? C.green : r.score === 'High' ? C.gold : C.muted,
                      backgroundColor: r.score === 'Very High'
                        ? isDark ? C.greenLight : '#DCFCE7'
                        : r.score === 'High'
                        ? isDark ? C.goldLight : '#FEF9C3'
                        : isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9',
                    }}>
                      {r.score === 'Very High' ? '🔥 Best' : r.score === 'High' ? '✅ Good' : '⏸️ Avoid'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* DISCLAIMER */}
      <div style={{
        padding: '12px 16px', borderRadius: 12, marginBottom: 16,
        backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
        border: `1px solid ${C.border}`,
        fontSize: 11, color: C.muted, textAlign: 'center', lineHeight: 1.6,
      }}>
        ✨ Numerology sirf entertainment ke liye hai — investment advice nahi. SEBI registered advisor se poochho pehle!
      </div>

    </div>
  );
}
