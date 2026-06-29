import { useState } from "react";

const SAMPLE_IPOS = [
  {
    id: 1,
    company: "Ola Electric",
    logo: "🚗",
    status: "open",
    openDate: "29 Jun 2026",
    closeDate: "1 Jul 2026",
    priceMin: 72,
    priceMax: 76,
    gmp: 45,
    gmpPercent: 59,
    subscription: 2.4,
    lotSize: 195,
    minInvestment: 14820,
    numerologyScore: 8,
    numerologyMsg: "Number 8 = Prosperity! Strong listing expected!",
    category: "EV & Clean Energy",
    rating: "⭐⭐⭐⭐",
  },
  {
    id: 2,
    company: "Swiggy",
    logo: "🍔",
    status: "upcoming",
    openDate: "5 Jul 2026",
    closeDate: "7 Jul 2026",
    priceMin: 371,
    priceMax: 390,
    gmp: 28,
    gmpPercent: 7,
    subscription: 0,
    lotSize: 38,
    minInvestment: 14820,
    numerologyScore: 6,
    numerologyMsg: "Number 6 = Balance & Harmony. Moderate listing expected.",
    category: "Food Delivery",
    rating: "⭐⭐⭐",
  },
  {
    id: 3,
    company: "NTPC Green",
    logo: "⚡",
    status: "upcoming",
    openDate: "10 Jul 2026",
    closeDate: "12 Jul 2026",
    priceMin: 108,
    priceMax: 114,
    gmp: 62,
    gmpPercent: 54,
    subscription: 0,
    lotSize: 130,
    minInvestment: 14820,
    numerologyScore: 9,
    numerologyMsg: "Number 9 = Completion & Success! High listing gain expected!",
    category: "Renewable Energy",
    rating: "⭐⭐⭐⭐⭐",
  },
  {
    id: 4,
    company: "Bajaj Housing",
    logo: "🏠",
    status: "listed",
    openDate: "9 Jun 2026",
    closeDate: "11 Jun 2026",
    priceMin: 66,
    priceMax: 70,
    gmp: 0,
    gmpPercent: 0,
    subscription: 64.2,
    listingPrice: 150,
    listingGain: 114,
    listingGainPercent: 114,
    lotSize: 214,
    minInvestment: 14980,
    numerologyScore: 4,
    numerologyMsg: "Number 4 = Stability. Strong fundamentals.",
    category: "Housing Finance",
    rating: "⭐⭐⭐⭐",
  },
];

const NUM_COLORS = {
  1: "#ef4444", 2: "#f97316", 3: "#eab308",
  4: "#22c55e", 5: "#06b6d4", 6: "#8b5cf6",
  7: "#ec4899", 8: "#f59e0b", 9: "#10b981",
};

export default function IPOTracker({ isDark = true }) {
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState(null);

  const bg = isDark ? "#0D1117" : "#F4F6FA";
  const card = isDark ? "#161B22" : "#FFFFFF";
  const text = isDark ? "#E8E6E0" : "#0F172A";
  const muted = isDark ? "#8B92A0" : "#64748B";
  const border = isDark ? "#30363D" : "#E2E8F0";
  const gold = isDark ? "#D8A33D" : "#C8920A";

  const filtered = filter === "all" ? SAMPLE_IPOS : SAMPLE_IPOS.filter(i => i.status === filter);

  const statusConfig = {
    open: { label: "🟢 OPEN", color: "#22c55e", bg: "rgba(34,197,94,0.15)" },
    upcoming: { label: "🔵 UPCOMING", color: "#3b82f6", bg: "rgba(59,130,246,0.15)" },
    listed: { label: "🏁 LISTED", color: "#8b5cf6", bg: "rgba(139,92,246,0.15)" },
  };

  return (
    <div style={{ background: bg, minHeight: "100vh", paddingBottom: 90, fontFamily: "Inter, system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{
        background: isDark
          ? "linear-gradient(135deg, #161B22, #1a1400)"
          : "linear-gradient(135deg, #1e3a5f, #2d5a8e)",
        padding: "20px 16px",
        borderBottom: `1px solid ${border}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 28 }}>🚀</span>
          <div>
            <h1 style={{ color: gold, fontSize: 22, fontWeight: 800, margin: 0 }}>IPO Tracker</h1>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, margin: 0 }}>Live • NSE/BSE • Numerology Powered</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          {[
            { label: "Open", count: SAMPLE_IPOS.filter(i => i.status === "open").length, color: "#22c55e" },
            { label: "Upcoming", count: SAMPLE_IPOS.filter(i => i.status === "upcoming").length, color: "#3b82f6" },
            { label: "Listed", count: SAMPLE_IPOS.filter(i => i.status === "listed").length, color: "#8b5cf6" },
          ].map(s => (
            <div key={s.label} style={{
              flex: 1, background: "rgba(255,255,255,0.07)",
              borderRadius: 10, padding: "8px 6px", textAlign: "center",
              border: "1px solid rgba(255,255,255,0.1)",
            }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.count}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "16px" }}>

        {/* Filter Tabs */}
        <div style={{
          display: "flex", gap: 6, marginBottom: 16,
          background: card, borderRadius: 12, padding: 4,
          border: `1px solid ${border}`,
        }}>
          {[["all", "All IPOs"], ["open", "🟢 Open"], ["upcoming", "🔵 Coming"], ["listed", "🏁 Listed"]].map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)} style={{
              flex: 1, padding: "7px 4px", fontSize: 10, fontWeight: 700,
              borderRadius: 8, border: "none", cursor: "pointer",
              backgroundColor: filter === key ? gold : "transparent",
              color: filter === key ? "#FFF" : muted,
              transition: "all 0.2s",
            }}>{label}</button>
          ))}
        </div>

        {/* IPO Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map(ipo => {
            const sc = statusConfig[ipo.status];
            const isExpanded = expanded === ipo.id;
            const numColor = NUM_COLORS[ipo.numerologyScore] || gold;

            return (
              <div key={ipo.id} style={{
                background: card,
                border: `1px solid ${ipo.status === "open" ? "rgba(34,197,94,0.3)" : border}`,
                borderRadius: 16, overflow: "hidden",
                boxShadow: ipo.status === "open" ? "0 4px 20px rgba(34,197,94,0.1)" : "none",
              }}>
                <div style={{ padding: "14px 16px" }}>

                  {/* Header Row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: isDark ? "rgba(245,158,11,0.1)" : "rgba(245,158,11,0.08)",
                        border: "1px solid rgba(245,158,11,0.2)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 22,
                      }}>{ipo.logo}</div>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: text }}>{ipo.company}</div>
                        <div style={{ fontSize: 11, color: muted }}>{ipo.category}</div>
                      </div>
                    </div>
                    <div style={{
                      fontSize: 10, fontWeight: 700, padding: "4px 10px",
                      borderRadius: 20, backgroundColor: sc.bg, color: sc.color,
                    }}>{sc.label}</div>
                  </div>

                  {/* Price & GMP */}
                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    <div style={{
                      flex: 1, background: isDark ? "rgba(255,255,255,0.04)" : "#F8FAFC",
                      borderRadius: 10, padding: "10px 12px",
                      border: `1px solid ${border}`,
                    }}>
                      <div style={{ fontSize: 10, color: muted, fontWeight: 600, marginBottom: 4 }}>💰 PRICE BAND</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: text }}>₹{ipo.priceMin} – ₹{ipo.priceMax}</div>
                    </div>

                    {ipo.status !== "listed" ? (
                      <div style={{
                        flex: 1,
                        background: ipo.gmp > 0 ? "rgba(34,197,94,0.08)" : isDark ? "rgba(255,255,255,0.04)" : "#F8FAFC",
                        borderRadius: 10, padding: "10px 12px",
                        border: `1px solid ${ipo.gmp > 0 ? "rgba(34,197,94,0.2)" : border}`,
                      }}>
                        <div style={{ fontSize: 10, color: muted, fontWeight: 600, marginBottom: 4 }}>📈 GMP</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: ipo.gmp > 0 ? "#22c55e" : muted }}>
                          {ipo.gmp > 0 ? `+₹${ipo.gmp} (${ipo.gmpPercent}%)` : "N/A"}
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        flex: 1, background: "rgba(34,197,94,0.08)",
                        borderRadius: 10, padding: "10px 12px",
                        border: "1px solid rgba(34,197,94,0.2)",
                      }}>
                        <div style={{ fontSize: 10, color: muted, fontWeight: 600, marginBottom: 4 }}>🚀 LISTING GAIN</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: "#22c55e" }}>+{ipo.listingGainPercent}%</div>
                      </div>
                    )}
                  </div>

                  {/* Dates */}
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 12 }}>
                    <span style={{ color: muted }}>📅 Open: <span style={{ color: text, fontWeight: 700 }}>{ipo.openDate}</span></span>
                    <span style={{ color: muted }}>📅 Close: <span style={{ color: text, fontWeight: 700 }}>{ipo.closeDate}</span></span>
                  </div>

                  {/* Subscription Bar */}
                  {ipo.status === "open" && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                        <span style={{ color: muted, fontWeight: 600 }}>📊 Subscription</span>
                        <span style={{ color: "#22c55e", fontWeight: 700 }}>{ipo.subscription}x</span>
                      </div>
                      <div style={{ height: 6, background: border, borderRadius: 99, overflow: "hidden" }}>
                        <div style={{
                          height: "100%", width: `${Math.min(100, ipo.subscription * 20)}%`,
                          background: "linear-gradient(90deg, #22c55e, #86efac)",
                          borderRadius: 99,
                        }} />
                      </div>
                    </div>
                  )}

                  {/* Numerology Score */}
                  <div style={{
                    background: isDark ? "rgba(255,255,255,0.04)" : "#FAFAFA",
                    border: `1px solid ${numColor}33`,
                    borderRadius: 10, padding: "10px 12px",
                    display: "flex", alignItems: "center", gap: 10,
                    marginBottom: 12,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: `linear-gradient(135deg, ${numColor}, ${numColor}88)`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 16, fontWeight: 900, color: "#FFF", flexShrink: 0,
                    }}>{ipo.numerologyScore}</div>
                    <div>
                      <div style={{ fontSize: 10, color: numColor, fontWeight: 700, marginBottom: 2 }}>🔢 NUMEROLOGY SCORE</div>
                      <div style={{ fontSize: 12, color: text, lineHeight: 1.4 }}>{ipo.numerologyMsg}</div>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setExpanded(isExpanded ? null : ipo.id)} style={{
                      flex: 1, padding: "10px", borderRadius: 10,
                      border: `1.5px solid ${border}`,
                      background: "transparent", color: muted,
                      fontSize: 12, fontWeight: 700, cursor: "pointer",
                    }}>
                      {isExpanded ? "🔼 Less" : "🔽 More Details"}
                    </button>
                    {ipo.status === "open" && (
                      <button style={{
                        flex: 1, padding: "10px", borderRadius: 10, border: "none",
                        background: "linear-gradient(135deg, #22c55e, #16a34a)",
                        color: "#FFF", fontSize: 12, fontWeight: 700, cursor: "pointer",
                      }}>📱 Apply Now</button>
                    )}
                    {ipo.status === "upcoming" && (
                      <button style={{
                        flex: 1, padding: "10px", borderRadius: 10, border: "none",
                        background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                        color: "#FFF", fontSize: 12, fontWeight: 700, cursor: "pointer",
                      }}>🔔 Remind Me</button>
                    )}
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div style={{
                      marginTop: 12, padding: "12px",
                      background: isDark ? "rgba(255,255,255,0.03)" : "#F8FAFC",
                      borderRadius: 10, border: `1px solid ${border}`,
                    }}>
                      {[
                        ["Lot Size", `${ipo.lotSize} shares`],
                        ["Min Investment", `₹${ipo.minInvestment.toLocaleString('en-IN')}`],
                        ["Rating", ipo.rating],
                        ipo.subscription > 0 ? ["Subscription", `${ipo.subscription}x`] : null,
                      ].filter(Boolean).map(([label, value]) => (
                        <div key={label} style={{
                          display: "flex", justifyContent: "space-between",
                          padding: "7px 0", borderBottom: `1px solid ${border}`,
                          fontSize: 13,
                        }}>
                          <span style={{ color: muted }}>{label}</span>
                          <span style={{ fontWeight: 700, color: text }}>{value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Disclaimer */}
        <div style={{
          marginTop: 16, padding: "12px 14px",
          background: isDark ? "rgba(245,158,11,0.05)" : "rgba(245,158,11,0.04)",
          border: "1px solid rgba(245,158,11,0.15)",
          borderRadius: 12, textAlign: "center",
        }}>
          <p style={{ color: muted, fontSize: 11, margin: 0, lineHeight: 1.6 }}>
            ⚠️ GMP aur Numerology sirf educational reference hai — investment advice nahi. SEBI registered advisor se consult karo.
          </p>
        </div>
      </div>
    </div>
  );
}
