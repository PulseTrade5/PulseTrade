import React, { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Flame, Loader2 } from "lucide-react";

export default function FIITracker() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/fii-dii?days=5")
      .then((res) => res.json())
      .then((json) => {
        if (!json.ok) throw new Error(json.error || "Failed to load");
        setRows(json.data || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl bg-[#121821] border border-white/5 p-6 flex items-center justify-center gap-2 text-zinc-400 text-sm">
        <Loader2 size={16} className="animate-spin" />
        Loading FII/DII data...
      </div>
    );
  }

  if (error || rows.length === 0) {
    return (
      <div className="rounded-2xl bg-[#121821] border border-white/5 p-4 text-sm text-zinc-400">
        FII/DII data not available yet. It updates daily after market close.
      </div>
    );
  }

  const latest = rows[0];
  const trend = [...rows].reverse();
  const maxAbs = Math.max(
    ...trend.flatMap((d) => [Math.abs(d.fii_net), Math.abs(d.dii_net)])
  );

  const fiiStreak = computeStreak(rows, "fii_net");

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs tracking-widest text-emerald-400/70 uppercase">
          PulseTrade · Premium
        </p>
        <h2 className="text-lg font-semibold mt-1">FII / DII Activity</h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          {formatDate(latest.trade_date)} · Provisional, NSE
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-[#121821] border border-white/5 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">FII Net</span>
            {latest.fii_net >= 0 ? (
              <TrendingUp size={14} className="text-emerald-400" />
            ) : (
              <TrendingDown size={14} className="text-rose-400" />
            )}
          </div>
          <p
            className={`text-2xl font-bold mt-1 ${
              latest.fii_net >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {latest.fii_net >= 0 ? "+" : ""}
            ₹{Math.abs(latest.fii_net).toFixed(0)} Cr
          </p>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            {latest.fii_net >= 0 ? "Buying" : "Selling"}
          </p>
        </div>
        <div className="rounded-2xl bg-[#121821] border border-white/5 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">DII Net</span>
            {latest.dii_net >= 0 ? (
              <TrendingUp size={14} className="text-emerald-400" />
            ) : (
              <TrendingDown size={14} className="text-rose-400" />
            )}
          </div>
          <p
            className={`text-2xl font-bold mt-1 ${
              latest.dii_net >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {latest.dii_net >= 0 ? "+" : ""}
            ₹{Math.abs(latest.dii_net).toFixed(0)} Cr
          </p>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            {latest.dii_net >= 0 ? "Buying" : "Selling"}
          </p>
        </div>
      </div>

      {fiiStreak.count >= 2 && (
        <div
          className={`rounded-2xl border p-3 flex items-center gap-2 ${
            fiiStreak.direction === "buy"
              ? "bg-gradient-to-r from-emerald-500/15 to-emerald-500/0 border-emerald-400/20"
              : "bg-gradient-to-r from-rose-500/15 to-rose-500/0 border-rose-400/20"
          }`}
        >
          <Flame
            size={16}
            className={fiiStreak.direction === "buy" ? "text-emerald-400" : "text-rose-400"}
          />
          <p
            className={`text-sm ${
              fiiStreak.direction === "buy" ? "text-emerald-300" : "text-rose-300"
            }`}
          >
            FII {fiiStreak.direction === "buy" ? "Bullish" : "Bearish"} — {fiiStreak.count}{" "}
            straight day{fiiStreak.count > 1 ? "s" : ""} of{" "}
            {fiiStreak.direction === "buy" ? "buying" : "selling"}
          </p>
        </div>
      )}

      <div className="rounded-2xl bg-[#121821] border border-white/5 p-4">
        <p className="text-xs text-zinc-400 mb-3">
          {trend.length}-Day Trend (₹ Cr)
        </p>
        <div className="flex items-end gap-3 h-28">
          {trend.map((d) => (
            <div key={d.trade_date} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col justify-center h-full gap-0.5">
                <div
                  className="w-2.5 mx-auto rounded-t bg-emerald-400/80"
                  style={{
                    height: `${(Math.abs(d.fii_net) / maxAbs) * 45}px`,
                    opacity: d.fii_net < 0 ? 0.3 : 1,
                  }}
                />
                <div
                  className="w-2.5 mx-auto rounded-b bg-sky-400/70"
                  style={{
                    height: `${(Math.abs(d.dii_net) / maxAbs) * 45}px`,
                    opacity: d.dii_net < 0 ? 0.3 : 1,
                  }}
                />
              </div>
              <span className="text-[10px] text-zinc-500">
                {formatShortDate(d.trade_date)}
              </span>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-3 text-[11px]">
          <span className="flex items-center gap-1 text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> FII
          </span>
          <span className="flex items-center gap-1 text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-sky-400" /> DII
          </span>
        </div>
      </div>
    </div>
  );
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatShortDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { weekday: "short" });
}

function computeStreak(rows, field) {
  if (rows.length === 0) return { count: 0, direction: null };
  const direction = rows[0][field] >= 0 ? "buy" : "sell";
  let count = 0;
  for (const row of rows) {
    const rowDir = row[field] >= 0 ? "buy" : "sell";
    if (rowDir === direction) count++;
    else break;
  }
  return { count, direction };
}
