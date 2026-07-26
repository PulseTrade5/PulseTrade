import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

const COLORS = {
  surface: "#FFFFFF", surfaceBorder: "#E2E8F0",
  gold: "#C8920A", goldLight: "#FEF3C7",
  green: "#059669", greenLight: "#ECFDF5",
  red: "#DC2626", redLight: "#FEF2F2",
  text: "#0F172A", muted: "#64748B", bg: "#F4F6FA",
};

function fmtINR(n) {
  if (n === null || n === undefined || isNaN(n)) return "₹0";
  return "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export default function PnLChart({ userEmail, refreshKey }) {
  const email = userEmail || "prabhat3300@gmail.com";
  const [view, setView] = useState('daily'); // 'daily' | 'monthly'
  const [sells, setSells] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); // tapped bar's data
  const [showAllTrades, setShowAllTrades] = useState(false);

  const fetchSells = () => {
    setLoading(true);
    supabase
      .from('test_fund_transactions')
      .select('created_at, pnl, symbol, amount')
      .eq('user_email', email)
      .eq('type', 'sell')
      .not('pnl', 'is', null)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setSells(data || []);
        setLoading(false);
      });
  };

  useEffect(() => { fetchSells(); }, [email, refreshKey]);

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

  // Win rate stats — sabhi closed (sell) trades pe
  const wins = sells.filter(s => Number(s.pnl) > 0).length;
  const losses = sells.filter(s => Number(s.pnl) < 0).length;
  const flat = sells.filter(s => Number(s.pnl) === 0).length;
  const totalClosed = sells.length;
  const winRate = (wins + losses) > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) : null;

  const cardStyle = { backgroundColor: COLORS.surface, border: `1px solid ${COLORS.surfaceBorder}`, borderRadius: 16, padding: 18, marginBottom: 16 };

  const visibleTrades = showAllTrades ? sells : sells.slice(0, 5);

  return (
    <>
      {/* Win Rate Summary */}
      {totalClosed > 0 && (
        <div style={cardStyle}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.muted, fontWeight: 700, marginBottom: 14 }}>🎯 WIN RATE</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 32, fontWeight: 900, color: winRate === null ? COLORS.muted : winRate >= 50 ? COLORS.green : COLORS.red }}>
              {winRate !== null ? `${winRate}%` : '—'}
            </span>
            <span style={{ fontSize: 12, color: COLORS.muted }}>({wins + losses} closed trade{(wins + losses) !== 1 ? 's' : ''})</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, backgroundColor: COLORS.greenLight, borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.green }}>{wins}</div>
              <div style={{ fontSize: 10, color: COLORS.green, fontWeight: 700 }}>Wins</div>
            </div>
            <div style={{ flex: 1, backgroundColor: COLORS.redLight, borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.red }}>{losses}</div>
              <div style={{ fontSize: 10, color: COLORS.red, fontWeight: 700 }}>Losses</div>
            </div>
            {flat > 0 && (
              <div style={{ flex: 1, backgroundColor: COLORS.bg, borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.muted }}>{flat}</div>
                <div style={{ fontSize: 10, color: COLORS.muted, fontWeight: 700 }}>Flat</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chart */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.muted, fontWeight: 700 }}>📈 REALIZED P&L</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={fetchSells} style={{ fontSize: 11, fontWeight: 700, color: COLORS.gold, background: 'none', border: 'none', cursor: 'pointer' }}>🔄</button>
            <div style={{ display: 'flex', gap: 4, backgroundColor: COLORS.bg, borderRadius: 10, padding: 3 }}>
            <button onClick={() => { setView('daily'); setSelected(null); }} style={{ padding: '5px 12px', fontSize: 11, fontWeight: 700, borderRadius: 8, border: 'none', cursor: 'pointer', backgroundColor: view === 'daily' ? COLORS.gold : 'transparent', color: view === 'daily' ? '#FFF' : COLORS.muted }}>Daily</button>
            <button onClick={() => { setView('monthly'); setSelected(null); }} style={{ padding: '5px 12px', fontSize: 11, fontWeight: 700, borderRadius: 8, border: 'none', cursor: 'pointer', backgroundColor: view === 'monthly' ? COLORS.gold : 'transparent', color: view === 'monthly' ? '#FFF' : COLORS.muted }}>Monthly</button>
            </div>
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
          <>
            <div style={{
              minHeight: 34, marginBottom: 10, padding: '8px 12px', borderRadius: 10,
              backgroundColor: selected ? COLORS.bg : 'transparent',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontSize: 12,
            }}>
              {selected ? (
                <>
                  <span style={{ color: COLORS.muted, fontWeight: 600 }}>
                    {view === 'daily'
                      ? new Date(selected.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : selected.label}
                  </span>
                  <span style={{ fontWeight: 800, color: selected.pnl >= 0 ? COLORS.green : COLORS.red }}>
                    {selected.pnl >= 0 ? '+' : ''}{fmtINR(selected.pnl)}
                  </span>
                </>
              ) : (
                <span style={{ color: COLORS.muted, fontStyle: 'italic' }}>Kisi bhi bar pe tap karo detail dekhne ke liye</span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', height: 140, gap: view === 'daily' ? 2 : 8, overflowX: 'auto' }}>
              {data.map((d) => {
                const heightPct = Math.abs(d.pnl) / maxAbs * 100;
                const isPositive = d.pnl >= 0;
                const isSelected = selected && selected.date === d.date;
                return (
                  <div
                    key={d.date}
                    onClick={() => setSelected(d)}
                    style={{
                      flex: view === 'daily' ? '1 0 auto' : '1',
                      minWidth: view === 'daily' ? 10 : 24,
                      height: '100%',
                      display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                      cursor: 'pointer',
                      padding: '0 1px',
                    }}
                  >
                    <div style={{
                      width: '100%', maxWidth: view === 'daily' ? 8 : 28,
                      height: `${Math.max(3, heightPct)}%`,
                      backgroundColor: d.pnl === 0 ? COLORS.surfaceBorder : (isPositive ? COLORS.green : COLORS.red),
                      borderRadius: 3,
                      outline: isSelected ? `2px solid ${COLORS.gold}` : 'none',
                      outlineOffset: 1,
                    }} />
                  </div>
                );
              })}
            </div>
          </>
        )}

        {!loading && sells.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10, color: COLORS.muted }}>
            <span>{view === 'daily' ? dailyData[0].date : monthlyData[0].label}</span>
            <span>{view === 'daily' ? dailyData[dailyData.length - 1].date : monthlyData[monthlyData.length - 1].label}</span>
          </div>
        )}
      </div>

      {/* Trade History List */}
      {sells.length > 0 && (
        <div style={cardStyle}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.muted, fontWeight: 700, marginBottom: 14 }}>
            📋 TRADE HISTORY ({sells.length})
          </div>
          {visibleTrades.map((s, i) => {
            const pnl = Number(s.pnl);
            const isWin = pnl > 0;
            const isLoss = pnl < 0;
            return (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < visibleTrades.length - 1 ? `1px solid ${COLORS.surfaceBorder}` : 'none' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.text }}>{s.symbol || '—'}</div>
                  <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>
                    {new Date(s.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    {s.amount ? ` • Sold for ${fmtINR(s.amount)}` : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: isWin ? COLORS.green : isLoss ? COLORS.red : COLORS.muted }}>
                    {pnl >= 0 ? '+' : ''}{fmtINR(pnl)}
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '1px 8px', borderRadius: 20,
                    color: isWin ? COLORS.green : isLoss ? COLORS.red : COLORS.muted,
                    backgroundColor: isWin ? COLORS.greenLight : isLoss ? COLORS.redLight : COLORS.bg,
                  }}>
                    {isWin ? '✅ Win' : isLoss ? '❌ Loss' : '— Flat'}
                  </span>
                </div>
              </div>
            );
          })}
          {sells.length > 5 && (
            <button onClick={() => setShowAllTrades(v => !v)} style={{
              width: '100%', marginTop: 12, padding: '9px', fontSize: 12, fontWeight: 700,
              borderRadius: 10, border: `1.5px solid ${COLORS.surfaceBorder}`, backgroundColor: 'transparent',
              color: COLORS.gold, cursor: 'pointer',
            }}>
              {showAllTrades ? '▲ Kam Dikhao' : `▼ Sab ${sells.length} Dikhao`}
            </button>
          )}
        </div>
      )}
    </>
  );
}
