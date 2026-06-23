import { useState, useRef, useEffect } from "react";

const GOLD = "#D8A33D";
const BG_CARD = "#161B22";
const BORDER = "#30363D";

export default function PulseBoltaHai({ stockData }) {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState("");
  const [autoSpoken, setAutoSpoken] = useState(false);
  const utteranceRef = useRef(null);

  useEffect(() => {
    if (stockData?.symbol) {
      setSummary("");
      setError("");
      setAutoSpoken(false);
      stopSpeech();
    }
  }, [stockData?.symbol]);

  useEffect(() => {
    if (summary && !autoSpoken) {
      setAutoSpoken(true);
      speakText(summary);
    }
  }, [summary]);

  const stopSpeech = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  const speakText = (text) => {
    if (!window.speechSynthesis) {
      setError("Aapka browser voice support nahi karta.");
      return;
    }
    stopSpeech();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "hi-IN";
    utterance.rate = 0.92;
    utterance.pitch = 1.05;
    utterance.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const hindiVoice =
      voices.find((v) => v.lang === "hi-IN") ||
      voices.find((v) => v.lang.startsWith("hi")) ||
      voices.find((v) => v.name.toLowerCase().includes("india")) ||
      null;
    if (hindiVoice) utterance.voice = hindiVoice;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const generateSummary = async () => {
    if (!stockData?.symbol) {
      setError("Pehle koi stock search karo.");
      return;
    }
    setLoading(true);
    setError("");
    stopSpeech();
    setAutoSpoken(false);
    try {
      const response = await fetch("/api/ai-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stockData }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Summary nahi aayi");
      setSummary(data.summary);
    } catch (err) {
      console.error(err);
      setError("Summary generate karne mein dikkat aayi. Dobara try karo.");
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceToggle = () => {
    if (speaking) {
      stopSpeech();
    } else if (summary) {
      speakText(summary);
    }
  };

  return (
    <div style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "20px", marginBottom: "20px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(90deg, ${GOLD}, transparent)` }} />
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
        <span style={{ fontSize: "22px" }}>🤖</span>
        <div>
          <h3 style={{ margin: 0, color: GOLD, fontSize: "16px", fontWeight: 700 }}>Pulse AI Analysis</h3>
          <p style={{ margin: 0, color: "#8B949E", fontSize: "12px" }}>Hinglish mein samjhao</p>
        </div>
      </div>
      <button
        onClick={generateSummary}
        disabled={loading || !stockData?.symbol}
        style={{ width: "100%", padding: "12px 20px", background: loading ? "#30363D" : `linear-gradient(135deg, ${GOLD}, #B8860B)`, color: loading ? "#8B949E" : "#0D1117", border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: 700, cursor: loading || !stockData?.symbol ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", letterSpacing: "0.5px" }}
      >
        {loading ? (
          <><span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⏳</span>AI soch raha hai...</>
        ) : (
          <>🔊 Pulse Bolta Hai</>
        )}
      </button>
      {summary && (
        <div style={{ marginTop: "16px", padding: "14px", background: "#0D1117", borderRadius: "8px", border: `1px solid ${speaking ? GOLD : "#30363D"}`, transition: "border-color 0.3s", position: "relative" }}>
          {speaking && (
            <div style={{ position: "absolute", top: "10px", right: "10px", display: "flex", gap: "3px", alignItems: "flex-end" }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ width: "3px", background: GOLD, borderRadius: "2px", animation: `soundBar${i} 0.6s ease-in-out infinite alternate`, height: `${8 + i * 4}px` }} />
              ))}
            </div>
          )}
          <p style={{ margin: 0, color: "#E6EDF3", fontSize: "14px", lineHeight: "1.7", paddingRight: speaking ? "30px" : "0" }}>{summary}</p>
          <p style={{ margin: "10px 0 0", color: "#6E7681", fontSize: "11px", fontStyle: "italic" }}>
            ⚠️ Sirf technical analysis hai — investment advice nahi. SEBI registered advisor se salah lein.
          </p>
        </div>
      )}
      {summary && (
        <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
          <button onClick={handleVoiceToggle} style={{ flex: 1, padding: "8px", background: speaking ? "#21262D" : "#1C2128", color: speaking ? GOLD : "#8B949E", border: `1px solid ${speaking ? GOLD : "#30363D"}`, borderRadius: "6px", fontSize: "13px", cursor: "pointer", fontWeight: 600 }}>
            {speaking ? "⏹ Rokho" : "🔁 Phir Sunao"}
          </button>
          <button onClick={() => { setSummary(""); stopSpeech(); }} style={{ padding: "8px 14px", background: "#21262D", color: "#8B949E", border: "1px solid #30363D", borderRadius: "6px", fontSize: "13px", cursor: "pointer" }}>✕</button>
        </div>
      )}
      {error && (
        <div style={{ marginTop: "12px", padding: "10px", background: "#1A0F0F", border: "1px solid #6E1B1B", borderRadius: "6px", color: "#FF6B6B", fontSize: "13px" }}>⚠️ {error}</div>
      )}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes soundBar1 { from { height: 4px; } to { height: 14px; } }
        @keyframes soundBar2 { from { height: 8px; } to { height: 20px; } }
        @keyframes soundBar3 { from { height: 4px; } to { height: 12px; } }
      `}</style>
    </div>
  );
}
