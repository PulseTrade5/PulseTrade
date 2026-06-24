import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const ADMIN_EMAIL = "prabhat3300@gmail.com";

const COLORS = {
  bg: "#F4F6FA",
  surface: "#FFFFFF",
  surfaceBorder: "#E2E8F0",
  gold: "#C8920A",
  goldLight: "#FEF3C7",
  goldDim: "#D97706",
  green: "#059669",
  greenLight: "#ECFDF5",
  red: "#DC2626",
  redLight: "#FEF2F2",
  text: "#0F172A",
  muted: "#64748B",
};

export default function AdminPanel({ onBack }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [stats, setStats] = useState({ total: 0, trial: 0, paid: 0, expired: 0, revenue: 0 });

  useEffect(() => { fetchUsers(); }, []);

  const getStatus = (user) => {
    if (user.is_paid === "true" || user.is_paid === true) return "paid";
    if (!user.trial_end_date) return "expired";
    return new Date(user.trial_end_date) > new Date() ? "trial" : "expired";
  };

  const getTrialDaysLeft = (trialEndDate) => {
    if (!trialEndDate) return 0;
    const diff = new Date(trialEndDate) - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("admin_users_view").select("*");
    if (error) { console.error(error); setLoading(false); return; }

    const enriched = (data || []).map(u => ({
      ...u,
      status: getStatus(u),
      daysLeft: getTrialDaysLeft(u.trial_end_date),
    }));

    const paid = enriched.filter(u => u.status === "paid");
    const trial = enriched.filter(u => u.status === "trial");
    const expired = enriched.filter(u => u.status === "expired");

    setStats({
      total: enriched.length,
      trial: trial.length,
      paid: paid.length,
      expired: expired.length,
      revenue: paid.length * 599,
    });

    setUsers(enriched);
    setLoading(false);
  };

  const filtered = filter === "all" ? users : users.filter(u => u.status === filter);

  const statusStyle = (status) => {
    if (status === "paid") return { bg: COLORS.greenLight, color: COLORS.green, label: "✅ Paid" };
    if (status === "trial") return { bg: COLORS.goldLight, color: COLORS.goldDim, label: "⏳ Trial" };
    return { bg: COLORS.redLight, color: COLORS.red, label: "❌ Expired" };
  };

  return (
    <div style={{ backgroundColor: COLORS.bg, minHeight: "100vh", fontFamily: "Inter, sans-serif", color: COLORS.text }}>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 0 48px" }}>

        {/* Header */}
        <div style={{
          backgroundColor: COLORS.surface,
          borderBottom: `1px solid ${COLORS.surfaceBorder}`,
          padding: "14px 20px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          position: "sticky", top: 0, zIndex: 100,
          boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
        }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>
              ⚙️ Admin <span style={{ color: COLORS.gold }}>Panel</span>
            </h1>
            <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 1 }}>🔱 Sirf Tere Liye</div>
          </div>
          <button onClick={onBack} style={{
            background: `linear-gradient(135deg, ${COLORS.gold}, #f0c040)`,
            color: "#FFF", border: "none", borderRadius: 20,
            padding: "7px 16px", fontWeight: 700, cursor: "pointer", fontSize: 13,
          }}>← Dashboard</button>
        </div>

        <div style={{ padding: "20px 20px 0" }}>

          {/* Stats Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 20 }}>
            {[
              { label: "Total Users", value: stats.total, emoji: "👥", color: COLORS.text },
              { label: "Trial Active", value: stats.trial, emoji: "⏳", color: COLORS.goldDim },
              { label: "Paid Users", value: stats.paid, emoji: "✅", color: COLORS.green },
              { label: "Est. Revenue", value: `₹${stats.revenue.toLocaleString("en-IN")}`, emoji: "💰", color: COLORS.green },
            ].map(stat => (
              <div key={stat.label} style={{
                backgroundColor: COLORS.surface, borderRadius: 12, padding: 16,
                border: `1px solid ${COLORS.surfaceBorder}`,
                boxShadow: "0 2px 8px rgba(200,146,10,0.08)",
              }}>
                <div style={{ fontSize: 22 }}>{stat.emoji}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: stat.color, marginTop: 4 }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Filter Tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {[
              { key: "all", label: `All (${stats.total})` },
              { key: "trial", label: `⏳ Trial (${stats.trial})` },
              { key: "paid", label: `✅ Paid (${stats.paid})` },
              { key: "expired", label: `❌ Expired (${stats.expired})` },
            ].map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)} style={{
                padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                border: `1px solid ${COLORS.surfaceBorder}`, cursor: "pointer",
                background: filter === f.key ? `linear-gradient(135deg, ${COLORS.gold}, #f0c040)` : COLORS.surface,
                color: filter === f.key ? "#FFF" : COLORS.muted,
              }}>{f.label}</button>
            ))}
          </div>

          {/* Users List */}
          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: COLORS.goldDim, fontSize: 14 }}>
              ⏳ Users load ho rahe hain...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: COLORS.muted, fontSize: 13 }}>
              Koi user nahi mila.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filtered.map(user => {
                const s = statusStyle(user.status);
                return (
                  <div key={user.id} style={{
                    backgroundColor: COLORS.surface, borderRadius: 12, padding: "14px 16px",
                    border: `1px solid ${COLORS.surfaceBorder}`,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  }}>
                    {/* Email + Status */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontWeight: 700, color: COLORS.text, fontSize: 13, wordBreak: "break-all", flex: 1 }}>
                        {user.email}
                      </span>
                      <span style={{
                        background: s.bg, color: s.color,
                        padding: "3px 10px", borderRadius: 20,
                        fontSize: 11, fontWeight: 700, flexShrink: 0, marginLeft: 8,
                      }}>{s.label}</span>
                    </div>

                    {/* Details */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, fontSize: 11, color: COLORS.muted }}>
                      <span>📅 Joined: {new Date(user.created_at).toLocaleDateString("en-IN")}</span>
                      <span>🕐 Last: {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString("en-IN") : "Never"}</span>
                      {user.status === "trial" && (
                        <span style={{ color: COLORS.goldDim, fontWeight: 700 }}>⏳ {user.daysLeft} din baaki</span>
                      )}
                      {user.plan && <span>📦 {user.plan}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <p style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "#CBD5E1" }}>
            🔱 हर हर महादेव 🔱
          </p>
        </div>
      </div>
    </div>
  );
}
