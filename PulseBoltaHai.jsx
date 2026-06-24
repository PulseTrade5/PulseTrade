import { useState, useEffect, useRef } from "react";

const GOLD = "#D8A33D";
const BG_CARD = "#161B22";
const BORDER = "#30363D";
const PANDA_URL = "https://raw.githubusercontent.com/PulseTrade5/PulseTrade/main/file_00000000e4dc7208a1fbd212fdf49fb3.png";

// ✅ PULSE ASTRO DATA
const ASTRO = {
  0: { day: "Raviwar", planet: "☀️ Surya", vibe: "Leadership energy — large cap stocks dekho", sectors: "Energy, Govt PSU", color: "#F59E0B", caution: false },
  1: { day: "Somwar", planet: "🌙 Chandra", vibe: "Calm market expected — FMCG aur Pharma best", sectors: "FMCG, Pharma, Healthcare", color: "#94A3B8", caution: false },
  2: { day: "Mangalwar", planet: "🔴 Mangal", vibe: "High energy — Defense aur Infra strong", sectors: "Defense, Infrastructure, Steel", color: "#EF4444", caution: false },
  3: { day: "Budhwar", planet: "💚 Budh", vibe: "IT aur Communication best din hai aaj", sectors: "IT, Telecom, Media", color: "#10B981", caution: false },
  4: { day: "Guruwar", planet: "🟡 Guru", vibe: "Jupiter ka ashirwad — Banking aur Finance", sectors: "Banking, Finance, Gold", color: "#F59E0B", caution: false },
  5: { day: "Shukrawar", planet: "✨ Shukra", vibe: "Luxury aur Auto stocks shine karenge", sectors: "Auto, Luxury, Consumer", color: "#EC4899", caution: false },
  6: { day: "Shaniwar", planet: "⚫ Shani", vibe: "Shani ki nazar — cautious raho aaj", sectors: "Avoid risky trades", color: "#6B7280", caution: true },
};

const FESTIVALS = {
  "2025-10-18": { name: "Dhanteras", msg: "🪔 Dhanteras Mubarak! Gold aur Silver stocks pe nazar rakho!", special: true },
  "2025-10-20": { name: "Diwali Muhurat", msg: "🎆 Muhurat Trading! Aaj ka pehla trade shubh hoga!", special: true },
  "2025-10-23": { name: "Bhai Dooj", msg: "🌸 Bhai Dooj! Market positive energy mein hai!", special: false },
  "2026-03-14": { name: "Holi", msg: "🎨 Holi hai! Market thoda volatile ho sakta hai!", special: false },
  "2026-01-14": { name: "Makar Sankranti", msg: "🪁 Makar Sankranti! Naye quarter ki shuruat — fresh positions lo!", special: false },
};

function getAstroData() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const dateStr = today.toISOString().split('T')[0];
  const festival = FESTIVALS[dateStr] || null;
  return { ...ASTRO[dayOfWeek], festival, date: today };
}

// ✅ IMPROVED VOICE SELECTION
function getBestVoice() {
  const voices = window.speechSynthesis.getVoices();
  
  // Priority order — best voices pehle
  const preferred = [
    v => v.lang === 'hi-IN' && v.name.includes('Google'),
    v => v.lang === 'hi-IN' && v.name.includes('Female'),
    v => v.lang === 'hi-IN',
    v => v.lang.startsWith('hi'),
    v => v.lang === 'en-IN' && v.name.includes('Google'),
    v => v.lang === 'en-IN',
    v => v.name.includes('Google') && v.lang.startsWith('en'),
    v => v.default,
  ];

  for (const check of preferred) {
    const found = voices.find(check);
    if (found) return found;
  }
  return null;
}

export default function PulseBoltaHai({ stockData, userName }) {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState("");
  const [autoSpoken, setAutoSpoken] = useState(false);
  const [showAstro, setShowAstro] = useState(true);
  const utteranceRef = useRef(null);
  const astro = getAstroData();

  useEffect(() => {
    if (stockData?.symbol) { setSummary(""); setError(""); setAutoSpoken(false); stopSpeech(); }
  }, [stockData?.symbol]);

  useEffect(() => {
    if (summary && !autoSpoken) { setAutoSpoken(true); speakText(summary); }
  }, [summary]);

  // Load voices
  useEffect(() => {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
  }, []);

  const stopSpeech = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  // ✅ IMPROVED SPEAK FUNCTION
  const speakText = (text) => {
    if (!window.speechSynthesis) { setError("Browser voice support nahi karta."); return; }
    stopSpeech();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "hi-IN";
    utterance.rate = 0.88;   // Thoda slow — clear samajh aaye
    utterance.pitch = 1.1;   // Thoda high — natural lagey
    utterance.volume = 1;

    // Best voice select karo
    const bestVoice = getBestVoice();
    if (bestVoice) utterance.voice = bestVoice;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // ✅ ASTRO VOICE — naam se greet
  const speakAstro = () => {
    const name = userName || 'Bhai';
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
    
    const text = `${greeting} ${name}! Aaj ${astro.day} hai — ${astro.planet} ka din! 
    ${astro.vibe}. 
    ${astro.caution ? 'Aaj cautious raho — risky trades se bachna.' : `${astro.sectors} sector mein opportunities dekho.`}
    ${astro.festival ? astro.festival.msg : ''}
    Har Har Mahadev! Shubh trading!`;
    
    speakText(text);
  };

  const generateSummary = async () => {
    if (!stockData?.symbol) { setError("Pehle koi stock search karo."); return; }
    setLoading(true); setError(""); stopSpeech(); setAutoSpoken(false);
    try {
      const response = await fetch("/api/ai-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stockData })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Summary nahi aayi");
      setSummary(data.summary);
    } catch (err) {
      setError("Dobara try karo.");
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceToggle = () => {
    if (speaking) { stopSpeech(); } else if (summary) { speakText(summary); }
  };

  return (
    <div>
      {/* ✅ PULSE ASTRO CARD */}
      {showAstro && (
        <div style={{
          background: `linear-gradient(135deg, #0D1117 0%, ${astro.color}22 100%)`,
          border: `1.5px solid ${astro.color}`,
          borderRadius: 16, padding: 16, marginBottom: 16,
          boxShadow: `0 4px 20px ${astro.color}22`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: astro.color, fontWeight: 800 }}>
              🪐 PULSE ASTRO
            </div>
            <button onClick={() => setShowAstro(false)} style={{ background: 'none', border: 'none', color: '#6E7681', cursor: 'pointer', fontSize: 14 }}>✕</button>
          </div>

          {/* Festival banner */}
          {astro.festival && (
            <div style={{
              backgroundColor: astro.festival.special ? '#7C3AED22' : '#065F4622',
              border: `1px solid ${astro.festival.special ? '#7C3AED' : '#059669'}`,
              borderRadius: 8, padding: '8px 12px', marginBottom: 10,
              fontSize: 12, color: astro.festival.special ? '#A78BFA' : '#3FAE7C', fontWeight: 700,
            }}>
              {astro.festival.msg}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ fontSize: 32 }}>{astro.planet.split(' ')[0]}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#E8E6E0' }}>
                Aaj {astro.day} hai
              </div>
              <div style={{ fontSize: 12, color: astro.color, fontWeight: 600, marginTop: 2 }}>
                {astro.vibe}
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: astro.caution ? '#2D151522' : '#0D2B1F',
            borderRadius: 8, padding: '8px 12px', marginBottom: 12,
            fontSize: 12,
            color: astro.caution ? '#F87171' : '#3FAE7C',
            fontWeight: 600,
          }}>
            {astro.caution ? '⚠️ Aaj cautious raho — SL tight rakho!' : `💡 Focus sectors: ${astro.sectors}`}
          </div>

          <button onClick={speakAstro} style={{
            width: '100%', padding: '10px', borderRadius: 8, border: 'none',
            background: `linear-gradient(135deg, ${astro.color}, ${astro.color}99)`,
            color: '#0D1117', fontWeight: 700, fontSize: 13, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            🔊 Pulse Panda Se Suno
          </button>
        </div>
      )}

      {/* PULSE BOLTA HAI CARD */}
      <div style={{
        background: BG_CARD,
        border: `1px solid ${speaking ? GOLD : BORDER}`,
        borderRadius: 16, padding: 20, marginBottom: 20,
        position: "relative",
        boxShadow: speaking ? `0 0 24px ${GOLD}44` : "none",
        transition: "all 0.3s"
      }}>
        <style>{`
          @keyframes float { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-8px)} }
          @keyframes floatFast { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-5px)} }
          @keyframes ring { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(2.2);opacity:0} }
          @keyframes ring2 { 0%{transform:scale(1);opacity:0.4} 100%{transform:scale(2.8);opacity:0} }
          @keyframes bar { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(2.2)} }
        `}</style>

        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${GOLD}, transparent)` }} />

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
            {speaking && (
              <>
                <div style={{ position: "absolute", inset: -4, borderRadius: "50%", border: `2px solid ${GOLD}`, animation: "ring 1.2s ease-out infinite" }} />
                <div style={{ position: "absolute", inset: -4, borderRadius: "50%", border: `1px solid ${GOLD}`, animation: "ring2 1.2s ease-out infinite 0.4s" }} />
              </>
            )}
            <img src={PANDA_URL} alt="Pulse Panda"
              style={{
                width: 72, height: 72, objectFit: "contain",
                animation: speaking ? "floatFast 0.5s ease-in-out infinite" : "float 3s ease-in-out infinite",
                filter: speaking ? `drop-shadow(0 0 10px ${GOLD})` : "drop-shadow(0 4px 8px rgba(0,0,0,0.4))",
                transition: "filter 0.3s",
              }} />
          </div>

          {speaking && (
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              {[10, 18, 24, 18, 12, 20, 14].map((h, i) => (
                <div key={i} style={{ width: 3, height: h, borderRadius: 4, backgroundColor: GOLD, animation: `bar 0.5s ease-in-out infinite ${i * 0.07}s`, transformOrigin: "center" }} />
              ))}
            </div>
          )}

          <div>
            <h3 style={{ margin: 0, color: GOLD, fontSize: 16, fontWeight: 700 }}>Pulse Panda 🐼</h3>
            <p style={{ margin: 0, color: "#8B949E", fontSize: 12 }}>Hinglish mein samjhao</p>
          </div>
        </div>

        <button onClick={generateSummary} disabled={loading || !stockData?.symbol}
          style={{
            width: "100%", padding: "12px 20px",
            background: loading ? "#30363D" : `linear-gradient(135deg, ${GOLD}, #B8860B)`,
            color: loading ? "#8B949E" : "#0D1117",
            border: "none", borderRadius: 8, fontSize: 15, fontWeight: 700,
            cursor: loading || !stockData?.symbol ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8
          }}>
          {loading ? <>⏳ AI soch raha hai...</> : <>🔊 Pulse Bolta Hai</>}
        </button>

        {summary && (
          <div style={{
            marginTop: 16, padding: 14, background: "#0D1117",
            borderRadius: 8, border: `1px solid ${speaking ? GOLD : "#30363D"}`,
            transition: "border-color 0.3s"
          }}>
            <p style={{ margin: 0, color: "#E6EDF3", fontSize: 14, lineHeight: 1.7 }}>{summary}</p>
            <p style={{ margin: "10px 0 0", color: "#6E7681", fontSize: 11, fontStyle: "italic" }}>
              ⚠️ Sirf technical analysis hai — investment advice nahi. SEBI registered advisor se salah lein.
            </p>

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={handleVoiceToggle} style={{
                flex: 1, padding: "9px", borderRadius: 8,
                background: speaking ? "#30363D" : `linear-gradient(135deg, ${GOLD}, #B8860B)`,
                color: speaking ? GOLD : "#0D1117",
                border: speaking ? `1px solid ${GOLD}` : "none",
                fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}>
                {speaking ? "⏹ Roko" : "▶️ Dobara Suno"}
              </button>
            </div>
          </div>
        )}

        {error && (
          <p style={{ color: "#F87171", fontSize: 12, marginTop: 10, fontWeight: 600 }}>{error}</p>
        )}
      </div>
    </div>
  );
}
