import { useState, useEffect, useRef } from "react";

const GOLD = "#D8A33D";
const BG_CARD = "#161B22";
const BORDER = "#30363D";
const PANDA_URL = "/file_00000000e4dc7208a1fbd212fdf49fb3.png";

export default function PulseBoltaHai({ stockData }) {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState("");
  const [autoSpoken, setAutoSpoken] = useState(false);
  const utteranceRef = useRef(null);

  useEffect(() => {
    if (stockData?.symbol) { setSummary(""); setError(""); setAutoSpoken(false); stopSpeech(); }
  }, [stockData?.symbol]);

  useEffect(() => {
    if (summary && !autoSpoken) { setAutoSpoken(true); speakText(summary); }
  }, [summary]);

  const stopSpeech = () => { if (window.speechSynthesis) window.speechSynthesis.cancel(); setSpeaking(false); };

  const speakText = (text) => {
    if (!window.speechSynthesis) { setError("Browser voice support nahi karta."); return; }
    stopSpeech();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "hi-IN"; utterance.rate = 0.92; utterance.pitch = 1.05; utterance.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const hindiVoice = voices.find(v => v.lang === "hi-IN") || voices.find(v => v.lang.startsWith("hi")) || null;
    if (hindiVoice) utterance.voice = hindiVoice;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const generateSummary = async () => {
    if (!stockData?.symbol) { setError("Pehle koi stock search karo."); return; }
    setLoading(true); setError(""); stopSpeech(); setAutoSpoken(false);
    try {
      const response = await fetch("/api/ai-summary", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stockData }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Summary nahi aayi");
      setSummary(data.summary);
    } catch (err) { setError("Dobara try karo."); }
    finally { setLoading(false); }
  };

  const handleVoiceToggle = () => { if (speaking) { stopSpeech(); } else if (summary) { speakText(summary); } };

  return (
    <div style={{ background: BG_CARD, border: `1px solid ${speaking ? GOLD : BORDER}`, borderRadius: 16, padding: 20, marginBottom: 20, position: "relative", boxShadow: speaking ? `0 0 24px ${GOLD}44` : "none", transition: "all 0.3s" }}>
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
        style={{ width: "100%", padding: "12px 20px", background: loading ? "#30363D" : `linear-gradient(135deg, ${GOLD}, #B8860B)`, color: loading ? "#8B949E" : "#0D1117", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: loading || !stockData?.symbol ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        {loading ? <>⏳ AI soch raha hai...</> : <>🔊 Pulse Bolta Hai</>}
      </button>

      {summary && (
        <div style={{ marginTop: 16, padding: 14, background: "#0D1117", borderRadius: 8, border: `1px solid ${speaking ? GOLD : "#30363D"}`, transition: "border-color 0.3s" }}>
          <p style={{ margin: 0, color: "#E6EDF3", fontSize: 14, lineHeight: 1.7 }}>{summary}</p>
          <p style={{ margin: "10px 0 0", color: "#6E7681", fontSize: 11, fontStyle: "italic" }}>⚠️ Sirf technical analysis hai — investment advice nahi. SEBI registered advisor se salah lein.</p>
        </div>
      )}

      {summary && (
        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <button onClick={handleVoiceToggle} style={{ flex: 1, padding: 8, background: speaking ? "#21262D" : "#1C2128", color: speaking ? GOLD : "#8B949E", border: `1px solid ${speaking ? GOLD : "#30363D"}`, borderRadius: 6, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
            {speaking ? "⏹ Rokho" : "🔁 Phir Sunao"}
          </button>
          <button onClick={() => { setSummary(""); stopSpeech(); }} style={{ padding: "8px 14px", background: "#21262D", color: "#8B949E", border: "1px solid #30363D", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>✕</button>
        </div>
      )}

      {error && <div style={{ marginTop: 12, padding: 10, background: "#1A0F0F", border: "1px solid #6E1B1B", borderRadius: 6, color: "#FF6B6B", fontSize: 13 }}>⚠️ {error}</div>}
    </div>
  );
}
