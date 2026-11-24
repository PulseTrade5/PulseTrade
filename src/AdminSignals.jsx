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

const PAGE_SIZE = 50;
const NEW_RULES_START = '2026-11-24'; // is date se bane signals naye rules ke hain
const REASON_LABEL = { sl: '🛑 SL', trail_sl: '🔒 Trail SL', t3: '🎯 T3', time_exit: '⏱️ Time exit' };

const fmt = (v) => (v === null || v === undefined || v === '' ? '' : Number(v).toFixed(2));
const sum = (arr) => arr.reduce((a, b) => a + b, 0);
const avg = (arr) => (arr.length ? sum(arr) / arr.length : null);
const rText = (r) => (r === null || r === undefined ? '—' : `${r > 0 ? '+' : ''}${Number(r).toFixed(2)}R`);

export default function AdminSignals() {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [dataset, setDataset] = useState('all'); // 'all' | 'new' (naye rules: close_reason wale)
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [search, setSearch] = useState('');
  const [livePrices, setLivePrices] = useState({}); // id -> current price
  const [checkingGap, setCheckingGap] = useState(false);

  // Supabase ek baar mein max 1000 rows deta hai — pages mein sab laao
  const fetchSignals = async () => {
    setLoading(true);
    let all = [];
    let from = 0;
    const size = 1000;
    while (true) {
      const { data, error } = await supabase
        .from('signal_tracking')
        .select('*')
        .order('signal_date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, from + size - 1);
      if (error || !data) break;
      all = all.concat(data);
      if (data.length < size) break;
      from += size;
    }
    setSignals(all);
    setLoading(false);
  };

  useEffect(() => { fetchSignals(); }, []);
  useEffect(() => { setVisible(PAGE_SIZE); }, [filter, dataset, search]);

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

  // Aaj ka live price laake dekho ki entry se kitna gap hai aur abhi kitne R pe hai.
  // Win/loss ka result ab sirf auto-scan (cron) update karta hai — yahan se manual close nahi hota.
  const handleCheckGap = async () => {
    setCheckingGap(true);
    const openSignals = signals.filter(s => s.status === 'open');
    const uniqueSymbols = [...new Set(openSignals.map(s => s.stock_symbol))];
    const priceMap = {};
    for (const sym of uniqueSymbols) {
      priceMap[sym] = await getCurrentPrice(sym);
    }
    const updated = {};
    openSignals.forEach(s => { updated[s.id] = priceMap[s.stock_symbol]; });
    setLivePrices(updated);
    setCheckingGap(false);
  };

  const isNewRules = (s) => (s.signal_date || '') >= NEW_RULES_START;
  const newCount = signals.filter(isNewRules).length;
  const rows = dataset === 'new' ? signals.filter(isNewRules) : signals;

  const stats = {
    total: rows.length,
    win: rows.filter(s => s.status === 'win').length,
    loss: rows.filter(s => s.status === 'loss').length,
    open: rows.filter(s => s.status === 'open').length,
  };
  const closed = stats.win + stats.loss;
  const winRate = closed > 0 ? ((stats.win / closed) * 100).toFixed(1) : null;

  // R-multiple stats (sirf closed trades jinka r_multiple bhara hai)
  const rVals = rows
    .filter(s => (s.status === 'win' || s.status === 'loss') && s.r_multiple !== null && s.r_multiple !== undefined)
    .map(s => Number(s.r_multiple));
  const winsR = rVals.filter(r => r > 0);
  const lossR = rVals.filter(r => r <= 0);
  const totalR = sum(rVals);
  const avgR = avg(rVals);
  const avgWinR = avg(winsR);
  const avgLossR = avg(lossR);
  const grossLoss = Math.abs(sum(lossR));
  const profitFactor = grossLoss > 0 ? sum(winsR) / grossLoss : null;

  // Exit reason breakdown
  const reasonStats = Object.entries(
    rows.reduce((acc, s) => {
      if (!s.close_reason) return acc;
      if (!acc[s.close_reason]) acc[s.close_reason] = { n: 0, rs: [] };
      acc[s.close_reason].n++;
      if (s.r_multiple !== null && s.r_multiple !== undefined) acc[s.close_reason].rs.push(Number(s.r_multiple));
      return acc;
    }, {})
  ).map(([reason, v]) => ({ reason, n: v.n, avgR: avg(v.rs) }));

  const q = search.trim().toUpperCase();
  const filtered = rows.filter(s =>
    (filter === 'all' || s.status === filter) &&
    (!q || (s.stock_symbol || '').toUpperCase().includes(q))
  );
  const shown = filtered.slice(0, visible);

  // Ek stock ka ek din mein ek hi signal ginna hai — baar baar search se duplicate na ho
  const dedupedByDay = Object.values(
    rows.reduce((acc, s) => {
      const key = `${s.stock_symbol}_${s.signal_date}`;
      if (!acc[key] || (acc[key].status === 'open' && s.status !== 'open')) acc[key] = s;
      return acc;
    }, {})
  );

  const bySymbol = dedupedByDay.reduce((acc, s) => {
    if (!acc[s.stock_symbol]) acc[s.stock_symbol] = { symbol: s.stock_symbol, total: 0, win: 0, loss: 0, open: 0, rs: [] };
    const a = acc[s.stock_symbol];
    a.total++;
    if (s.status === 'win') a.win++;
    else if (s.status === 'loss') a.loss++;
    else a.open++;
    if ((s.status === 'win' || s.status === 'loss') && s.r_multiple !== null && s.r_multiple !== undefined) a.rs.push(Number(s.r_multiple));
    return acc;
  }, {});
  const topStocks = Object.values(bySymbol)
    .sort((a, b) => (b.win + b.loss) - (a.win + a.loss) || b.total - a.total)
    .slice(0, 10);

  const cardStyle = { backgroundColor: COLORS.surface, border: `1px solid ${COLORS.surfaceBorder}`, borderRadius: 16, padding: 18, marginBottom: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.05)' };
  const rColor = (r) => (r === null || r === undefined ? COLORS.muted : r > 0 ? COLORS.green : COLORS.red);

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Dataset toggle */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {[['all', 'Sab trades'], ['new', `Naye rules (${newCount})`]].map(([key, label]) => (
          <button key={key} onClick={() => setDataset(key)} style={{
            flex: 1, padding: '8px 4px', fontSize: 12, fontWeight: 700, borderRadius: 10,
            border: `1.5px solid ${dataset === key ? COLORS.gold : COLORS.surfaceBorder}`,
            backgroundColor: dataset === key ? COLORS.goldLight : COLORS.surface,
            color: dataset === key ? COLORS.goldDim : COLORS.muted, cursor: 'pointer',
          }}>{label}</button>
        ))}
      </div>
      {dataset === 'new' && (
        <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 12 }}>
          Naye rules = 24 Nov 2026 ke baad bane signals: 1.5R/2.5R/4R targets, T1 pe 50% book + trail SL, 7 din time-exit, cost minus. Purane trades isme nahi hain.
        </div>
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
        <div style={{ fontSize: 13, fontWeight: 800, marginTop: 10, color: avgR === null ? 'rgba(255,255,255,0.5)' : avgR > 0 ? '#34D399' : '#F87171' }}>
          Avg {rText(avgR)} per trade • Total {rText(rVals.length ? totalR : null)}
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

      {/* Edge stats */}
      <div style={cardStyle}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.muted, fontWeight: 700, marginBottom: 12 }}>
          📈 ASLI EDGE (R-multiple)
        </div>
        {rVals.length === 0 ? (
          <div style={{ fontSize: 12, color: COLORS.muted }}>Abhi koi closed trade nahi jiska R-multiple bhara ho.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              ['Avg R / trade', rText(avgR), rColor(avgR)],
              ['Total R', rText(totalR), rColor(totalR)],
              ['Avg win', rText(avgWinR), COLORS.green],
              ['Avg loss', rText(avgLossR), COLORS.red],
              ['Profit factor', profitFactor === null ? '—' : profitFactor.toFixed(2), profitFactor !== null && profitFactor >= 1 ? COLORS.green : COLORS.red],
              ['Trades (R ke saath)', rVals.length, COLORS.text],
            ].map(([label, value, color]) => (
              <div key={label} style={{ backgroundColor: COLORS.bg, borderRadius: 12, padding: '10px 12px' }}>
                <div style={{ fontSize: 10, color: COLORS.muted, fontWeight: 700 }}>{label}</div>
                <div style={{ fontSize: 17, fontWeight: 800, color, marginTop: 2 }}>{value}</div>
              </div>
            ))}
          </div>
        )}
        {reasonStats.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.muted, fontWeight: 700, marginBottom: 8 }}>EXIT KAISE HUA</div>
            {reasonStats.map(r => (
              <div key={r.reason} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12 }}>
                <span style={{ color: COLORS.text, fontWeight: 700 }}>{REASON_LABEL[r.reason] || r.reason} <span style={{ color: COLORS.muted, fontWeight: 600 }}>× {r.n}</span></span>
                <span style={{ color: rColor(r.avgR), fontWeight: 800 }}>avg {rText(r.avgR)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top 10 Most-Active Stocks */}
      {topStocks.length > 0 && (
        <div style={cardStyle}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.muted, fontWeight: 700, marginBottom: 4 }}>
            🏆 TOP {topStocks.length} STOCKS (sabse zyada trade wale)
          </div>
          <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 14 }}>
            Din mein 1 stock ka 1 hi trade gina gaya hai — sabse zyada closed trades wale upar
          </div>
          {topStocks.map((s, i) => {
            const closedCount = s.win + s.loss;
            const rate = closedCount > 0 ? ((s.win / closedCount) * 100).toFixed(0) : null;
            const stockAvgR = avg(s.rs);
            return (
              <div key={s.symbol} style={{ padding: '10px 0', borderBottom: i < topStocks.length - 1 ? `1px solid ${COLORS.surfaceBorder}` : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.muted, width: 20 }}>#{i + 1}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.text }}>{s.symbol}</div>
                      <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>
                        {s.total} trade{s.total !== 1 ? 's' : ''} • ✅ {s.win} • ❌ {s.loss}{s.open > 0 ? ` • ⏳ ${s.open}` : ''}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: rate === null ? COLORS.muted : rate >= 50 ? COLORS.green : COLORS.red }}>
                      {rate !== null ? `${rate}%` : '—'}
                    </div>
                    {stockAvgR !== null && (
                      <div style={{ fontSize: 10, fontWeight: 700, color: rColor(stockAvgR) }}>avg {rText(stockAvgR)}</div>
                    )}
                  </div>
                </div>
                {closedCount > 0 && closedCount < 3 && (
                  <div style={{ fontSize: 10, color: COLORS.gold, marginTop: 4, marginLeft: 30 }}>
                    ⚠️ Sirf {closedCount} trade — % abhi reliable nahi hai
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <button onClick={fetchSignals} disabled={loading} style={{
        width: '100%', padding: '14px', fontSize: 14, fontWeight: 700, borderRadius: 12, border: 'none',
        backgroundColor: loading ? COLORS.surfaceBorder : COLORS.gold,
        color: loading ? COLORS.muted : '#FFF',
        cursor: loading ? 'not-allowed' : 'pointer', marginBottom: 10,
      }}>
        {loading ? '⏳ Load ho raha hai...' : '🔄 Data Refresh Karo'}
      </button>

      <button onClick={handleCheckGap} disabled={checkingGap || stats.open === 0} style={{
        width: '100%', padding: '14px', fontSize: 14, fontWeight: 700, borderRadius: 12, border: `1.5px solid ${COLORS.gold}`,
        backgroundColor: 'transparent',
        color: checkingGap || stats.open === 0 ? COLORS.muted : COLORS.gold,
        cursor: checkingGap || stats.open === 0 ? 'not-allowed' : 'pointer', marginBottom: 6,
      }}>
        {checkingGap ? '⏳ Gap check ho raha hai...' : `📊 Aaj ka Gap Dekho (${stats.open} open)`}
      </button>
      <div style={{ fontSize: 10, color: COLORS.muted, marginBottom: 16, textAlign: 'center' }}>
        Win/Loss result roz 4 PM IST pe auto-scan khud update karta hai
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto' }}>
          {[['all', 'All'], ['open', '⏳ Open'], ['win', '✅ Win'], ['loss', '❌ Loss']].map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)} style={{
              flex: 1, padding: '7px 4px', fontSize: 11, fontWeight: 700, borderRadius: 10, border: 'none',
              backgroundColor: filter === key ? COLORS.gold : COLORS.bg,
              color: filter === key ? '#FFF' : COLORS.muted, cursor: 'pointer', whiteSpace: 'nowrap',
            }}>{label}</button>
          ))}
        </div>

        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Stock search (jaise SBIN)"
          style={{
            width: '100%', boxSizing: 'border-box', padding: '10px 12px', fontSize: 13, borderRadius: 10,
            border: `1px solid ${COLORS.surfaceBorder}`, backgroundColor: COLORS.bg, color: COLORS.text, marginBottom: 12, outline: 'none',
          }}
        />

        <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.muted, fontWeight: 700, marginBottom: 12 }}>
          SIGNALS ({filtered.length})
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: COLORS.muted, padding: '20px 0' }}>⏳ Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: COLORS.muted, padding: '20px 0', fontSize: 13 }}>Koi signal nahi mila.</div>
        ) : shown.map(s => {
          const livePrice = livePrices[s.id];
          const entry = Number(s.entry_price);
          const risk = Number(s.risk_per_share) || Math.abs(entry - Number(s.stop_loss));
          const dir = s.signal === 'SHORT' ? -1 : 1;
          const gapPct = (s.status === 'open' && livePrice != null && entry)
            ? ((livePrice - entry) / entry) * 100
            : null;
          const gapSafe = gapPct !== null && Math.abs(gapPct) <= 2;
          const liveR = (s.status === 'open' && livePrice != null && risk) ? (dir * (livePrice - entry)) / risk : null;
          return (
          <div key={s.id} style={{ padding: '12px 0', borderBottom: `1px solid ${COLORS.surfaceBorder}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.text }}>
                  {s.stock_symbol} <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.muted }}>({s.signal})</span>
                </div>
                <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>
                  Entry: ₹{fmt(s.entry_price)} • SL: ₹{fmt(s.stop_loss)}
                </div>
                {(s.target1 || s.target2 || s.target3) && (
                  <div style={{ fontSize: 11, color: COLORS.green, marginTop: 2 }}>
                    🎯 Target: ₹{fmt(s.target1)}{s.target2 ? ` • ₹${fmt(s.target2)}` : ''}{s.target3 ? ` • ₹${fmt(s.target3)}` : ''}
                  </div>
                )}
                <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>
                  {new Date(s.signal_date).toLocaleDateString('en-IN')}
                  {s.closed_price && ` → Closed @ ₹${fmt(s.closed_price)}`}
                </div>
                {s.status === 'open' && s.t1_hit && (
                  <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.blue, marginTop: 3 }}>
                    🔒 T1 hit{s.t2_hit ? ' • T2 hit' : ''} — SL ab entry pe
                  </div>
                )}
                {s.status !== 'open' && (s.r_multiple !== null && s.r_multiple !== undefined) && (
                  <div style={{ fontSize: 11, fontWeight: 800, marginTop: 3, color: rColor(Number(s.r_multiple)) }}>
                    {rText(Number(s.r_multiple))}{s.close_reason ? ` • ${REASON_LABEL[s.close_reason] || s.close_reason}` : ''}
                  </div>
                )}
                {gapPct !== null && (
                  <div style={{ fontSize: 11, fontWeight: 700, marginTop: 4, color: gapSafe ? COLORS.green : COLORS.red }}>
                    📊 Aaj ka price: ₹{livePrice.toFixed(2)} • Gap: {gapPct >= 0 ? '+' : ''}{gapPct.toFixed(1)}%
                    {gapSafe ? ' ✅ Le sakte ho' : ' ⚠️ Bada gap — chhodo isse'}
                    {liveR !== null ? ` • ${rText(liveR)}` : ''}
                  </div>
                )}
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
          );
        })}

        {!loading && filtered.length > visible && (
          <button onClick={() => setVisible(v => v + PAGE_SIZE)} style={{
            width: '100%', padding: '12px', marginTop: 12, fontSize: 13, fontWeight: 700, borderRadius: 10,
            border: `1.5px solid ${COLORS.surfaceBorder}`, backgroundColor: COLORS.bg, color: COLORS.muted, cursor: 'pointer',
          }}>
            Aur dikhao ({filtered.length - visible} baaki)
          </button>
        )}
      </div>
    </div>
  );
}

