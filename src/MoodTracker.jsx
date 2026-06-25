import { useState } from 'react';

const MOODS = [
  {
    id: 'confident', emoji: '😎', label: 'Confident',
    color: '#059669', darkBg: '#0D2B1F',
    title: 'Confidence — Double Edged Sword!',
    advice: 'Confidence achhi cheez hai bhai — but overconfidence dangerous hai! Aaj position size normal rakhna, double mat karna. Plan follow karo — system pe trust karo!',
    tip: '⚠️ Aaj extra trade lene ka mann kare toh ruko — 10 minute baad sochna!',
  },
  {
    id: 'calm', emoji: '😌', label: 'Calm',
    color: '#3FAE7C', darkBg: '#0D2B1F',
    title: 'Perfect Trading State! 🎯',
    advice: 'Yeh best trading state hai bhai! Calm mind = clear decisions. Aaj apna plan follow karo, system pe trust karo — results aayenge!',
    tip: '✅ Aaj planned trades lo — conditions match hon toh execute karo!',
  },
  {
    id: 'anxious', emoji: '😰', label: 'Anxious',
    color: '#F59E0B', darkBg: '#2D2008',
    title: 'Ruko Bhai — Breathe Lo!',
    advice: 'Anxious state mein trading bahut risky hai! Aaj screen band karo, thoda walk karo, paani piyo. Best trade aaj = NO trade! Capital protect karo.',
    tip: '🛑 Aaj sirf watchlist dekho — koi naya position mat lo!',
  },
  {
    id: 'fomo', emoji: '🤑', label: 'FOMO',
    color: '#EF4444', darkBg: '#2D1515',
    title: 'FOMO = Sabse Bada Dushman!',
    advice: 'FOMO mein sabse zyada loss hota hai bhai! "Yeh stock miss ho jayega" — yeh feeling tujhe barbad kar sakti hai. Aaj koi naya trade mat lo!',
    tip: '🚫 Aaj koi bhi "hot tip" pe mat jaana — 100% ignore karo!',
  },
];

export default function MoodTracker({ isDark }) {
  const [selectedMood, setSelectedMood] = useState(null);
  const [showResult, setShowResult] = useState(false);

  const C = {
    surface: isDark ? '#161B22' : '#FFFFFF',
    border: isDark ? '#30363D' : '#E2E8F0',
    text: isDark ? '#E8E6E0' : '#0F172A',
    muted: isDark ? '#8B92A0' : '#64748B',
    bg: isDark ? '#0D1117' : '#F4F6FA',
  };

  const mood = MOODS.find(m => m.id === selectedMood);

  return (
    <div style={{
      backgroundColor: C.surface,
      border: `1.5px solid #C8920A`,
      borderRadius: 16, padding: 20, marginBottom: 16,
      boxShadow: isDark ? '0 2px 16px rgba(0,0,0,0.4)' : '0 4px 20px rgba(200,146,10,0.1)',
    }}>
      <div style={{ fontSize: 10, letterSpacing: 2, color: '#C8920A', fontWeight: 800, marginBottom: 4 }}>
        🧠 TRADER MOOD CHECK
      </div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>
        Aaj ka mood kya hai? Sach batao! 😄
      </div>

      {!showResult ? (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {MOODS.map(m => (
            <button key={m.id} onClick={() => { setSelectedMood(m.id); setShowResult(true); }}
              style={{
                flex: 1, minWidth: 120, padding: '16px 8px',
                borderRadius: 14, border: `1.5px solid ${C.border}`,
                backgroundColor: C.bg, cursor: 'pointer',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 6,
                transition: 'all 0.2s',
              }}>
              <div style={{ fontSize: 32 }}>{m.emoji}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{m.label}</div>
            </button>
          ))}
        </div>
      ) : (
        <div>
          <div style={{
            background: isDark
              ? `linear-gradient(135deg, #0D1117, ${mood.darkBg})`
              : `linear-gradient(135deg, #FFFFFF, ${mood.color}15)`,
            border: `2px solid ${mood.color}`,
            borderRadius: 14, padding: 18, marginBottom: 14,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 44 }}>{mood.emoji}</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: mood.color }}>
                  {mood.title}
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                  Mood: {mood.label}
                </div>
              </div>
            </div>

            <div style={{
              fontSize: 14, color: isDark ? '#C9D1D9' : '#334155',
              lineHeight: 1.7, marginBottom: 12,
              padding: '12px 14px',
              backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
              borderRadius: 10,
              borderLeft: `3px solid ${mood.color}`,
            }}>
              {mood.advice}
            </div>

            <div style={{
              fontSize: 13, fontWeight: 700,
              color: mood.color,
              backgroundColor: isDark ? mood.darkBg : `${mood.color}15`,
              padding: '10px 14px', borderRadius: 10,
            }}>
              {mood.tip}
            </div>
          </div>

          <button onClick={() => { setSelectedMood(null); setShowResult(false); }}
            style={{
              width: '100%', padding: '11px', borderRadius: 10,
              border: `1.5px solid ${C.border}`,
              backgroundColor: 'transparent', color: C.muted,
              cursor: 'pointer', fontSize: 13, fontWeight: 700,
            }}>
            🔄 Mood Badal Gaya? Dobara Check Karo
          </button>
        </div>
      )}

      <div style={{ fontSize: 10, color: C.muted, marginTop: 12, textAlign: 'center' }}>
        🧠 Psychological trading awareness — financial advice nahi
      </div>
    </div>
  );
}
