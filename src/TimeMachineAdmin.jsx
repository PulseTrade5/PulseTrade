import { useState } from "react";
import { supabase } from "./supabaseClient";

export default function TimeMachineAdmin() {
  const [symbol, setSymbol] = useState("");
  const [entry, setEntry] = useState("");
  const [stop, setStop] = useState("");
  const [target, setTarget] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const run = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("time-machine", {
        body: {
          symbol: symbol.trim(),
          entry: Number(entry),
          stop: Number(stop),
          target: Number(target),
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data);
    } catch (e) {
      setError(e.message || "Something went wrong");
    }
    setLoading(false);
  };

  const box = {
    background: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: 12,
    padding: 16,
    color: "#0F172A",
    marginBottom: 16,
  };
  const input = {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 12px",
    marginBottom: 8,
    borderRadius: 8,
    border: "1.5px solid #E2E8F0",
    background: "#F4F6FA",
    color: "#0F172A",
    fontSize: 16,
  };

  return (
    <div style={box}>
      <h3 style={{ margin: "0 0 4px" }}>⏱ Time Machine</h3>
      <p style={{ margin: "0 0 12px", fontSize: 13, color: "#64748B" }}>
        Pichle 60 din ke 5-min bars se 10,000 replay. Sirf simulation hai.
      </p>

      <input style={input} placeholder="Symbol (e.g. RELIANCE)" value={symbol} onChange={(e) => setSymbol(e.target.value)} />
      <input style={input} placeholder="Entry" inputMode="decimal" value={entry} onChange={(e) => setEntry(e.target.value)} />
      <input style={input} placeholder="Stop loss" inputMode="decimal" value={stop} onChange={(e) => setStop(e.target.value)} />
      <input style={input} placeholder="Target" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} />

      <button
        onClick={run}
        disabled={loading || !symbol || !entry || !stop || !target}
        style={{
          width: "100%",
          padding: 12,
          borderRadius: 8,
          border: "none",
          background: loading ? "#CBD5E1" : "#C8920A",
          color: "#fff",
          fontSize: 16,
          fontWeight: 600,
        }}
      >
        {loading ? "Running..." : "Run Time Machine"}
      </button>

      {error && <p style={{ color: "#DC2626", marginTop: 12 }}>{error}</p>}

      {result && (
        <div style={{ marginTop: 16, fontSize: 15, lineHeight: 1.7 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>{result.verdict}</div>
          <div>🎯 Target pehle: <b>{result.odds.target}%</b></div>
          <div>🛑 Stop pehle: <b>{result.odds.stop}%</b></div>
          <div>⏳ Dono nahi: <b>{result.odds.neither}%</b></div>
          <div>🟢 Green close: <b>{result.odds.green}%</b></div>
          <div>Avg R: <b>{result.avgR}</b> (RR {result.rr})</div>
          <div>Break-even hit rate: <b>{result.breakEvenHitRate}%</b></div>
          <div style={{ fontSize: 12, color: "#64748B", marginTop: 8 }}>
            {result.sessions} sessions, {result.replays} replays. {result.disclaimer}
          </div>
        </div>
      )}
    </div>
  );
}
