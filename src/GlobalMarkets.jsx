import { useState, useEffect } from 'react';

const SYMBOLS = [
  { key: 'gold', symbol: 'GC=F', label: 'Gold', emoji: '🥇', unit: '$/oz' },
  { key: 'oil', symbol: 'CL=F', label: 'Crude Oil', emoji: '🛢️', unit: '$/barrel' },
  { key: 'dow', symbol: '%5EDJI', label: 'Dow Jones', emoji: '🇺🇸', unit: 'pts' },
  { key: 'nasdaq', symbol: '%5EIXIC', label: 'NASDAQ', emoji: '💻', unit: 'pts' },
  { key: 'usdinr', symbol: 'USDINR%3DX', label: 'USD/INR', emoji: '💵', unit: '₹' },
  { key: 'bitcoin', symbol: 'BTC-USD', label: 'Bitcoin', emoji: '₿', unit: '$' },
];

const INDIA_IMPACT = {
  gold: { up: '🟡 Gold badha → Metal stocks dekho!', down: '🟡 Gold gira → Metal stocks pe pressure' },
  oil: { up: '🛢️ Oil badha → OMC stocks pe pressure, Paint stocks bhi', down: '🛢️ Oil gira → OMC stocks positive!' },
  dow: { up: '🇺🇸 Dow badha → Kal Nifty positive open ho sakta hai!', down: '🇺🇸 Dow gira → Kal Nifty pe pressure ho sakta hai!' },
  nasdaq: { up: '💻 NASDAQ badha → IT stocks positive!', down: '💻 NASDAQ gira → IT stocks pe pressure!' },
  usdinr: { up: '💵 Dollar strong → IT stocks benefit, Import costly', down: '💵 Dollar weak → IT stocks pe pressure, Import sasta' },
  bitcoin: { up: '₿ BTC badha → Risk-on sentiment!', down: '₿ BTC gira → Risk-off mood' },
};

export default function GlobalMarkets({ isDark }) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  const C = {
    surface: isDark ? '#161B22' : '#FFFFFF',
    border: isDark ? '#30363D' : '#E2E8F0',
    text: isDark ? '#E8E6E0' : '#0F172A',
    muted: isDark ? '#8B92A0' : '#64748B',
    bg: isDark ? '#0D1117' : '#F4F6FA',
    green: isDark ? '#3FAE7C' : '#059669',
    red: isDark ? '#F87171' : '#DC2626',
    greenBg: isDark ? '#0D2B1F' : '#ECFDF5',
    redBg: isDark ? '#2D1515' : '#FEF2F2',
  };

  const fetchData = async () => {
    setLoading(true);
    const results = {};
    await Promise.all(SYMBOLS.map(async ({ key, symbol }) => {
      try {
        const res = await fetch(`/api/get-stock-data?symbol=${symbol}&range=1d`);
        const json = await res.json();
        if (json.stockInfo) {
          results[key] = {
            price: json.stockInfo.regularMarketPrice,
            change: json.stockInfo.regularMarketChange,
            changePct: json.stockInfo.regularMarketChangePercent,
          };
        }
      } catch (e) {}
    }));
    setData(results);
    setLastUpdated(new Date());
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const fmt = (n, decimals = 2) => {
    if (!n && n !== 0) return '—';
    return Number(n).toLocaleString('en-IN', { maximumFractionDigits: decimals });
  };

  const impacts = Object.entries(data)
    .filter(([key, val]) => val?.changePct !== undefined && Math.abs(val.changePct) > 0.5)
    .map(([key, val]) => {
      const impact = INDIA_IMPACT[key];
      if (!impact) return null;
      return val.changePct > 0 ? impact.up : impact.down;
    })
    .filter(Boolean)
    .slice(0, 2);

  return (
    <div style={{
      backgroundColor: C.surface,
      border: `1.5px solid ${isDark ? '#30363D' : '#E2E8F0'}`,
      borderRadius: 16, padding: 16, marginBottom: 16,
      boxShadow: isDark ? '0 2px 16px rgba(0,0,0,0.4)' : '0 1px 6px rgba(0,0,0,0.05)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: collapsed ? 0 : 14 }}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: '#C8920A', fontWeight: 800 }}>
          🌍 GLOBAL MARKETS
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {lastUpdated && (
            <span style={{ fontSize: 10, color: C.muted }}>
              {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button onClick={fetchData} style={{
            fontSize: 11, padding: '4px 10px', borderRadius: 8,
            backgroundColor: '#C8920A', color: '#FFF',
            border: 'none', cursor: 'pointer', fontWeight: 700,
          }}>🔄</button>
          <button onClick={() => setCollapsed(c => !c)} style={{
            fontSize: 11, padding: '4px 10px', borderRadius: 8,
            backgroundColor: C.bg, color: C.muted,
            border: `1px solid ${C.border}`, cursor: 'pointer', fontWeight: 700,
          }}>{collapsed ? '▼' : '▲'}</button>
        </div>
      </div>

      {!collapsed && (
        <>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: C.muted, fontSize: 13 }}>
              ⏳ Global data load ho raha hai...
            </div>
          ) : (
            <>
              {/* Markets Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                {SYMBOLS.map(({ key, label, emoji, unit }) => {
                  const item = data[key];
                  const isUp = item?.changePct >= 0;
                  const color = item ? (isUp ? C.green : C.red) : C.muted;
                  const bgColor = item ? (isUp ? C.greenBg : C.redBg) : C.bg;

                  return (
                    <div key={key} style={{
                      backgroundColor: bgColor,
                      borderRadius: 12, padding: '12px 10px',
                      border: `1px solid ${item ? (isUp ? C.green : C.red) : C.border}22`,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>{emoji} {label}</span>
                        {item && (
                          <span style={{
                            fontSize: 10, fontWeight: 700, color,
                            backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.7)',
                            padding: '2px 6px', borderRadius: 6,
                          }}>
                            {isUp ? '▲' : '▼'} {Math.abs(item.changePct || 0).toFixed(2)}%
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 800, color }}>
                        {item ? fmt(item.price) : '—'}
                      </div>
                      <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{unit}</div>
                    </div>
                  );
                })}
              </div>

              {/* India Impact */}
              {impacts.length > 0 && (
                <div style={{
                  backgroundColor: isDark ? 'rgba(200,146,10,0.08)' : '#FFFBEB',
                  border: `1px solid rgba(200,146,10,0.3)`,
                  borderRadius: 10, padding: '10px 12px',
                }}>
                  <div style={{ fontSize: 10, color: '#C8920A', fontWeight: 800, marginBottom: 8, letterSpacing: 1 }}>
                    🇮🇳 INDIA PE ASAR
                  </div>
                  {impacts.map((impact, i) => (
                    <div key={i} style={{ fontSize: 12, color: C.text, marginBottom: i < impacts.length - 1 ? 6 : 0, lineHeight: 1.5 }}>
                      {impact}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
