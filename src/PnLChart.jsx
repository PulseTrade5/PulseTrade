import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

const COLORS = {
  surface: "#FFFFFF", surfaceBorder: "#E2E8F0",
  gold: "#C8920A", green: "#059669", greenLight: "#ECFDF5",
  red: "#DC2626", redLight: "#FEF2F2",
  text: "#0F172A", muted: "#64748B", bg: "#F4F6FA",
};

function fmtINR(n) {
  if (n === null || n === undefined || isNaN(n)) return "₹0";
  return "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export default function PnLChart({ userEmail }) {
  const email = userEmail || "prabhat3300@gmail.com";
  const [view, setView] = useState('daily'); // 'daily' | 'monthly'
  const [sells, setSells] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    supabase
      .from('test_fund_transactions')
      .select('created_at, pnl')
      .eq('user_email', email)
      .eq('type', 'sell')
      .not('pnl', 'is', null)
      .then(({ data }) => {
        setSells(data || []);
        setLoading(false);
      });
  }, [email]);

  // Build last 30 days buckets
  const dailyData = (() => {
    const buckets = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      buckets[key] = 0;
    }
    sells.forEach(s => {
      const key = new Date(s.created_at).toISOString().slice(0, 10);
      if (key in buckets) buckets[key] += Number(s.pnl);
    });
    return Object.entries(buckets).map(([date, pnl]) => ({ date, pnl }));
  })();

  // Build last 12 months buckets
  const monthlyData = (() => {
    const buckets = {};
    const labels = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      buckets[key] = 0;
      labels[key] = d.toLocaleDateString('en-IN', { month: 'short' });
    }
    sells.forEach(s => {
      const d = new Date(s.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (key in buckets) buckets[key] += Number(s.pnl);
    });
    return Object.entries(buckets).map(([key, pnl]) => ({ date: key, label: labels[key], pnl }));
  })();

  const data = view === 'daily' ? dailyData : monthlyData;
  const maxAbs = Math.max(1, ...data.map(d => Math.abs(d.pnl)));
  const totalPnl = data.reduce((sum, d) => sum + d.pnl, 0);

  const cardStyle = { backgroundColor: COLORS.surface, border: `1px solid ${COLORS.surfaceBorder}`, borderRadius: 16, padding: 18, marginBottom: 16 };

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.muted, fontWeight: 700 }}>📈 REALIZED P&L</div>
        <div style={{ display: 'flex', gap: 4, backgroundColor: COLORS.bg, borderRadius: 10, padding: 3 }}>
          <button onClick={() => setView('daily')} style={{ padding: '5px 12px', fontSize: 11, fontWeight: 700, borderRadius: 8, border: 'none', cursor: 'pointer', backgroundColor: view === 'daily' ? COLORS.gold : 'transparent', color: view === 'daily' ? '#FFF' : COLORS.muted }}>Daily</button>
          <button onClick={() => setView('monthly')} style={{ padding: '5px 12px', fontSize: 11, fontWeight: 700, borderRadius: 8, border: 'none', cursor: 'pointer', backgroundColor: view === 'monthly' ? COLORS.gold : 'transparent', color: view === 'monthly' ? '#FFF' : COLORS.muted }}>Monthly</button>
        </div>
      </div>

      <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 14 }}>
        {view === 'daily' ? 'Pichle 30 din' : 'Pichle 12 mahine'} • Total: <span style={{ fontWeight: 700, color: totalPnl >= 0 ? COLORS.green : COLORS.red }}>{totalPnl >= 0 ? '+' : ''}{fmtINR(totalPnl)}</span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: COLORS.muted, padding: '30px 0', fontSize: 13 }}>⏳ Loading...</div>
      ) : sells.length === 0 ? (
        <p style={{ color: COLORS.muted, textAlign: 'center', padding: '20px 0', fontSize: 13 }}>Abhi tak koi sell nahi hui, isliye P&L data nahi hai.</p>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', height: 140, gap: view === 'daily' ? 2 : 8, overflowX: 'auto' }}>
          {data.map((d, i) => {
            const heightPct = Math.abs(d.pnl) / maxAbs * 100;
            const isPositive = d.pnl >= 0;
            return (
              <div key={d.date} title={`${view === 'daily' ? d.date : d.label}: ${fmtINR(d.pnl)}`} style={{
                flex: view === 'daily' ? '1 0 auto' : '1',
                minWidth: view === 'daily' ? 6 : 20,
                height: '100%',
                display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
              }}>
                <div style={{
                  width: '100%', maxWidth: view === 'daily' ? 8 : 28,
                  height: `${Math.max(2, heightPct)}%`,
                  backgroundColor: d.pnl === 0 ? COLORS.surfaceBorder : (isPositive ? COLORS.green : COLORS.red),
                  borderRadius: 3,
                }} />
              </div>
            );
          })}
        </div>
      )}

      {!loading && sells.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10, color: COLORS.muted }}>
          <span>{view === 'daily' ? dailyData[0].date : monthlyData[0].label}</span>
          <span>{view === 'daily' ? dailyData[dailyData.length - 1].date : monthlyData[monthlyData.length - 1].label}</span>
        </div>
      )}
    </div>
  );
}
