import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

const COLORS = {
  bg: "#F4F6FA", surface: "#FFFFFF", surfaceBorder: "#E2E8F0",
  gold: "#C8920A", goldLight: "#FEF3C7", goldDim: "#D97706",
  green: "#059669", greenLight: "#ECFDF5",
  red: "#DC2626", redLight: "#FEF2F2",
  blue: "#2563EB", blueLight: "#EFF6FF",
  text: "#0F172A", muted: "#64748B",
};

export default function AdminSignals() {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [msg, setMsg] = useState('');
  const [filter, setFilter] = useState('all');

  const fetchSignals = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('signal_tracking')
      .select('*')
      .order('signal_date', { ascending: false });
    setSignals(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchSignals(); }, []);

  const getCurrentPrice = async (symbol) => {
    try {
      let sym = symbol.includes('.') ? symbol : symbol + '.NS';
      const res = await fetch(`/api/get-stock-data?symbol=${encodeURIComponent(sym)}&range=5d`);
      const data = await res.json();
      return data?.stockInfo?.regularMarketPrice || data?.candles?.[data.candles.length - 1]?.close || null;
    } catch {
      return null;
    }
  };

  const handleCheckResults = async () => {
    setChecking(true);
    setMsg('');
    const openSignals = signals.filter(s => s.status === 'open');
    let updatedCount = 0;

    for (const s of openSignals) {
      const price = await getCurrentPrice(s.stock_symbol);
      if (price === null) continue;

      let newStatus = null;
      if (s.signal === 'LONG') {
        if (s.target3 && price >= s.target3) newStatus = 'win';
        else if (s.target1 && price >= s.target1) newStatus = 'win';
        else if (s.stop_loss && price <= s.stop_loss) newStatus = 'loss';
      } else if (s.signal === 'SHORT') {
        if (s.target3 && price <= s.target3) newStatus = 'win';
        else if (s.target1 && price <= s.target1) newStatus = 'win';
        else if (s.stop_loss && price >= s.stop_loss) newStatus = 'loss';
      }

      if (newStatus) {
        await supabase
          .from('signal_tracking')
          .update({ status: newStatus, closed_price: price, closed_date: new Date().toISOString().split('T')[0] })
          .eq('id', s.id);
        updatedCount++;
      }
    }

    setMsg(updatedCount > 0 ? `✅ ${updatedCount} signal(s) ka result update ho gaya!` : 'ℹ️ Abhi koi signal target/SL pe nahi pahuncha.');
    await fetchSignals();
    setChecking(false);
    setTimeout(() => setMsg(''), 4000);
  };

  const stats = {
    total: signals.length,
    win: signals.filter(s => s.status === 'win').length,
    loss: signals.filter(s => s.status === 'loss').length,
    open: signals.filter(s => s.status === 'open').length,
  };
  const closed = stats.win + stats.loss;
  const winRate = closed > 0 ? ((stats.win / closed) * 100).toFixed(1) : null;

  const filtered = signals.filter(s => filter === 'all' || s.status === filter);

  const cardStyle = { backgroundColor: COLORS.surface, border: `1px solid ${COLORS.surfaceBorder}`, borderRadius: 16, padding: 18, marginBottom: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.05)' };

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {msg && (
        <div style={{ backgroundColor: COLORS.blueLight, border: '1.5px solid #BFDBFE', borderRadius: 12, padding: '10px 16px', marginBottom: 16, fontSize: 13, fontWeight: 700, color: COLORS.blue }}>{msg}</div>
      )}

      {/* Win Rate Hero */}
      <div style={{
        borderRadius: 20, padding: '24px 20px', marginBottom: 16, textAlign: 'center',
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
      }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: '#C8920A', fontWeight: 700, marginBottom: 10 }}>
          🎯 OVERALL WIN RATE
        </div>
        <div style={{ fontSize: 44, fontWeight: 900, color: '#FFF' }}>
          {winRate !== null ? `${winRate}%` : '—'}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
          {closed} closed trade{closed !== 1 ? 's' : ''} ({stats.win} win, {stats.loss} loss)
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          ['Total', stats.total, COLORS.text, COLORS.bg],
          ['Wins', stats.win, COLORS.green, COLORS.greenLight],
          ['Losses', stats.loss, COLORS.red, COLORS.redLight],
          ['Open', stats.open, COLORS.gold, COLORS.goldLight],
        ].map(([label, value, color, bg]) => (
          <div key={label} style={{ flex: 1, backgroundColor: bg, border: `1px solid ${COLORS.surfaceBorder}`, borderRadius: 14, padding: '12px 6px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: 10, color, fontWeight: 700 }}>{label}</div>
          </div>
        ))}
      </div>

      <button onClick={handleCheckResults} disabled={checking || stats.open === 0} style={{
        width: '100%', padding: '14px', fontSize: 14, fontWeight: 700, borderRadius: 12, border: 'none',
        backgroundColor: checking || stats.open === 0 ? COLORS.surfaceBorder : COLORS.gold,
        color: checking || stats.open === 0 ? COLORS.muted : '#FFF',
        cursor: checking || stats.open === 0 ? 'not-allowed' : 'pointer', marginBottom: 16,
      }}>
        {checking ? '⏳ Prices check ho rahi hain...' : `🔄 Results Check Karo (${stats.open} open)`}
      </button>

      <div style={cardStyle}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto' }}>
          {[['all', 'All'], ['open', '⏳ Open'], ['win', '✅ Win'], ['loss', '❌ Loss']].map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)} style={{
              flex: 1, padding: '7px 4px', fontSize: 11, fontWeight: 700, borderRadius: 10, border: 'none',
              backgroundColor: filter === key ? COLORS.gold : COLORS.bg,
              color: filter === key ? '#FFF' : COLORS.muted, cursor: 'pointer', whiteSpace: 'nowrap',
            }}>{label}</button>
          ))}
        </div>

        <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.muted, fontWeight: 700, marginBottom: 12 }}>
          SIGNALS ({filtered.length})
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: COLORS.muted, padding: '20px 0' }}>⏳ Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: COLORS.muted, padding: '20px 0', fontSize: 13 }}>Koi signal nahi mila.</div>
        ) : filtered.map(s => (
          <div key={s.id} style={{ padding: '12px 0', borderBottom: `1px solid ${COLORS.surfaceBorder}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.text }}>
                  {s.stock_symbol} <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.muted }}>({s.signal})</span>
                </div>
                <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>
                  Entry: ₹{s.entry_price} • SL: ₹{s.stop_loss}
                </div>
                <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>
                  {new Date(s.signal_date).toLocaleDateString('en-IN')}
                  {s.closed_price && ` → Closed @ ₹${s.closed_price}`}
                </div>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap',
                color: s.status === 'win' ? COLORS.green : s.status === 'loss' ? COLORS.red : COLORS.gold,
                backgroundColor: s.status === 'win' ? COLORS.greenLight : s.status === 'loss' ? COLORS.redLight : COLORS.goldLight,
              }}>
                {s.status === 'win' ? '✅ Win' : s.status === 'loss' ? '❌ Loss' : '⏳ Open'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
