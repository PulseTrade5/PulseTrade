import { useState } from 'react';
import { analyzeStock } from './technicalAnalysis';
import SubscribeButton from './SubscribeButton';

const COLORS = {
  bg: "#0D1117", surface: "#161B22", surfaceBorder: "#262C36",
  gold: "#D8A33D", goldDim: "#9C7A33",
  green: "#3FAE7C", red: "#D1453B", text: "#E8E6E0", muted: "#8B92A0",
};

const POPULAR = ["RELIANCE", "TCS", "INFY", "HDFCBANK", "TATAMOTORS", "SBIN", "ICICIBANK", "ITC"];
const TIERS = [3, 6, 10];

function fmtINR(n) {
  if (n === null || n === undefined || isNaN(n)) return "—";
  return "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function fmtCr(n) {
  if (!n) return "—";
  const cr = n / 1e7;
  if (cr >= 1e5) return `₹${(cr/1e5).toFixed(2)} L Cr`;
  if (cr >= 1e3) return `₹${(cr/1e3).toFixed(2)}K Cr`;
  return `₹${cr.toFixed(0)} Cr`;
}

function fmtVol(n) {
  if (!n) return "—";
  if (n >= 1e7) return `${(n/1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `${(n/1e5).toFixed(2)} L`;
  return n.toLocaleString('en-IN');
}

export default function StockDashboard({ user }) {
  const [symbolInput, setSymbolInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [stockInfo, setStockInfo] = useState(null);
  const [stockName, setStockName] = useState('');
  const [tab, setTab] = useState('check');
  const [watchlist, setWatchlist] = useState([]);
  const [history, setHistory] = useState([]);
  const [sizingMode, setSizingMode] = useState('risk');
  const [quantity, setQuantity] = useState(10);
  const [riskAmount, setRiskAmount] = useState(1000);
  const [slPercent, setSlPercent] = useState(3);
  const [entryPrice, setEntryPrice] = useState(0);
  const [direction, setDirection] = useState('BUY');

  const handleSearch = async (symOverride) => {
    const sym = (symOverride || symbolInput).trim().toUpperCase();
    if (!sym) return;
    setLoading(true);
    setError('');
    setResult(null);
    setStockInfo(null);
    setSymbolInput(sym);
    let symbol = sym;
    if (!symbol.includes('.')) symbol = symbol + '.NS';
    try {
      const res = await fetch(`/api/get-stock-data?symbol=${encodeURIComponent(symbol)}&range=1y`);
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Data fetch failed.'); setLoading(false); return; }
      if (!data.candles || data.candles.length < 50) { setError('Itna data nahi mila.'); setLoading(false); return; }
      const analysis = analyzeStock(data.candles);
      if (analysis.error) { setError(analysis.error); setLoading(false); return; }
      setResult(analysis);
      setStockInfo(data.stockInfo || null);
      setStockName(sym);
      setEntryPrice(analysis.lastClose);
      setDirection(analysis.trend === 'Bullish' ? 'BUY' : 'SELL');
      if (analysis.atr) setSlPercent(Math.min(6, Math.max(1.5, (analysis.atr / analysis.lastClose * 100).toFixed(1))));
      setHistory(prev => [{ id: Date.now(), symbol: sym, trend: analysis.trend, price: analysis.lastClose, date: new Date().toISOString(), outcome: 'pending' }, ...prev].slice(0, 100));
    } catch (err) {
      setError('Kuch gadbad ho gayi, dobara try karo.');
    } finally {
      setLoading(false);
    }
  };

  const ep = Number(entryPrice) || 0;
  const sl = Math.max(0, Number(slPercent) || 0);
  const stopLossPrice = direction === 'BUY' ? ep * (1 - sl/100) : ep * (1 + sl/100);
  const riskPerShare = Math.abs(ep - stopLossPrice);
  const calculatedQty = riskPerShare > 0 ? Math.floor(Math.max(0, Number(riskAmount)||0) / riskPerShare) : 0;
  const qty = sizingMode === 'risk' ? calculatedQty : Math.max(0, Number(quantity)||0);
  const lossAmount = Math.abs(ep - stopLossPrice) * qty;
  const tierResults = TIERS.map(t => { const price = direction === 'BUY' ? ep*(1+t/100) : ep*(1-t/100); return { percent: t, price, profit: Math.abs(price-ep)*qty }; });
  const riskReward = lossAmount > 0 ? (tierResults[2].profit / lossAmount).toFixed(1) : 0;
  const trendColor = result?.trend === 'Bullish' ? COLORS.green : result?.trend === 'Bearish' ? COLORS.red : COLORS.gold;

  return (
    <div style={{ backgroundColor: COLORS.bg, color: COLORS.text, minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '32px 20px 48px' }}>

        <div style={{ textAlign: 'center', marginBottom: 4 }}>
          <div style={{ color: COLORS.gold, fontWeight: 700, fontSize: 14 }}>🔱 हर हर महादेव 🔱</div>
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 700, margin: '0 0 4px' }}>Pulse<span style={{ color: COLORS.gold }}>Trade</span></h1>
        <p style={{ fontSize: 13, color: COLORS.muted, margin: '0 0 20px' }}>Bazaar ka pulse dekho, faisla khud karo.</p>

        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {[['check','🔍 Check'],['watchlist','⭐ Watchlist'],['track','📋 Record']].map(([key,label]) => (
            <button key={key} onClick={() => setTab(key)} style={{ flex: 1, padding: '8px 4px', fontSize: 11, fontWeight: 600, borderRadius: 12, border: tab===key ? 'none' : `1px solid ${COLORS.surfaceBorder}`, backgroundColor: tab===key ? COLORS.gold : COLORS.surface, color: tab===key ? '#1A1306' : COLORS.muted, cursor: 'pointer' }}>{label}</button>
          ))}
        </div>

        <div style={{ backgroundColor: 'rgba(216,163,61,0.08)', border: `1px solid ${COLORS.goldDim}`, borderRadius: 8, padding: '10px 12px', marginBottom: 16, fontSize: 12, color: COLORS.muted }}>
          ⚠️ Yeh sirf technical trend par based estimate hai — investment advice nahi hai. SEBI registered advisor se salah lein.
        </div>

        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <SubscribeButton userEmail={user?.email} userId={user?.id} />
        </div>

        {tab === 'check' && (
          <>
            <div style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.surfaceBorder}`, borderRadius: 16, padding: 16, marginBottom: 24 }}>
              <label style={{ fontSize: 11, letterSpacing: 2, color: COLORS.muted, display: 'block', marginBottom: 8 }}>STOCK SYMBOL YA NAAM</label>
              <input value={symbolInput} onChange={e => setSymbolInput(e.target.value)} onKeyDown={e => e.key==='Enter' && handleSearch()} placeholder="e.g. RELIANCE, TCS"
                style={{ width: '100%', padding: '10px 12px', fontSize: 14, backgroundColor: COLORS.bg, border: `1px solid ${COLORS.surfaceBorder}`, borderRadius: 10, color: COLORS.text, outline: 'none', boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                {POPULAR.map(s => (
                  <button key={s} disabled={loading} onClick={() => handleSearch(s)}
                    style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, border: `1px solid ${COLORS.surfaceBorder}`, backgroundColor: symbolInput===s ? COLORS.gold : 'transparent', color: symbolInput===s ? '#1A1306' : COLORS.muted, cursor: 'pointer' }}>{s}</button>
                ))}
              </div>
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ fontSize: 11, letterSpacing: 2, color: COLORS.muted }}>POSITION SIZING</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[['risk','Risk ₹'],['manual','Qty']].map(([m,l]) => (
                      <button key={m} onClick={() => setSizingMode(m)} style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, border: sizingMode===m ? 'none' : `1px solid ${COLORS.surfaceBorder}`, backgroundColor: sizingMode===m ? COLORS.gold : 'transparent', color: sizingMode===m ? '#1A1306' : COLORS.muted, cursor: 'pointer' }}>{l}</button>
                    ))}
                  </div>
                </div>
                {sizingMode === 'risk' ? (
                  <>
                    <input type="number" value={riskAmount} onChange={e => setRiskAmount(e.target.value)} placeholder="Risk amount e.g. 1000"
                      style={{ width: '100%', padding: '10px 12px', fontSize: 14, backgroundColor: COLORS.bg, border: `1px solid ${COLORS.surfaceBorder}`, borderRadius: 10, color: COLORS.text, outline: 'none', boxSizing: 'border-box' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                      <span style={{ fontSize: 12, color: COLORS.muted }}>Calculated Qty</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.gold }}>{qty} shares</span>
                    </div>
                  </>
                ) : (
                  <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="Qty e.g. 10"
                    style={{ width: '100%', padding: '10px 12px', fontSize: 14, backgroundColor: COLORS.bg, border: `1px solid ${COLORS.surfaceBorder}`, borderRadius: 10, color: COLORS.text, outline: 'none', boxSizing: 'border-box' }} />
                )}
              </div>
              <button onClick={() => handleSearch()} disabled={loading}
                style={{ width: '100%', marginTop: 12, padding: '10px', fontSize: 14, fontWeight: 600, borderRadius: 10, border: 'none', backgroundColor: loading ? COLORS.goldDim : COLORS.gold, color: '#1A1306', cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? '⏳ Check ho raha hai...' : '🔍 Trend Nikalo'}
              </button>
              {error && <p style={{ fontSize: 12, color: COLORS.red, marginTop: 8 }}>{error}</p>}
            </div>

            {result && (
              <>
                {stockInfo && (
                  <div style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.surfaceBorder}`, borderRadius: 16, padding: 16, marginBottom: 16 }}>
                    <div style={{ fontSize: 11, letterSpacing: 2, color: COLORS.muted, marginBottom: 12 }}>📊 STOCK INFO</div>
                    {stockInfo.longName && <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: COLORS.text }}>{stockInfo.longName}</div>}
                    {[
                      ['Market Cap', fmtCr(stockInfo.marketCap)],
                      ['P/E Ratio', stockInfo.trailingPE ? stockInfo.trailingPE.toFixed(2) : '—'],
                      ['Aaj ka Volume', fmtVol(stockInfo.regularMarketVolume)],
                      ['Avg Volume (3M)', fmtVol(stockInfo.averageDailyVolume3Month)],
                      ['Exchange', stockInfo.exchangeName || '—'],
                    ].map(([label, value]) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0', borderBottom: `1px solid ${COLORS.surfaceBorder}` }}>
                        <span style={{ color: COLORS.muted }}>{label}</span>
                        <span style={{ fontWeight: 600, color: COLORS.text }}>{value}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.surfaceBorder}`, borderRadius: 16, padding: 16, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${COLORS.surfaceBorder}` }}>
                    <span style={{ fontSize: 20, fontWeight: 700 }}>{stockName}</span>
                    <span style={{ fontSize: 18, fontWeight: 700, color: COLORS.gold }}>{fmtINR(result.lastClose)}</span>
                  </div>
                  {[
                    ['Trend', result.trend, trendColor],
                    ['Momentum (MACD)', result.momentum, result.momentum==='Bullish' ? COLORS.green : COLORS.red],
                    ['RSI', result.rsi, result.rsi > 70 ? COLORS.red : result.rsi < 30 ? COLORS.green : null],
                    ['ADX (Strength)', `${result.adx} (${result.trendStrength})`, null],
                    ['Supertrend', result.supertrend, result.supertrend==='Bullish' ? COLORS.green : COLORS.red],
                    ['Long Score', `${result.longScore} / 100`, COLORS.green],
                    ['Short Score', `${result.shortScore} / 100`, COLORS.red],
                    ['52W High / Low', `${fmtINR(result.week52High)} / ${fmtINR(result.week52Low)}`, null],
                    ['Distance from 52W High', `${result.distFromHighPct}%`, null],
                  ].map(([label, value, color]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0', borderBottom: `1px solid ${COLORS.surfaceBorder}` }}>
                      <span style={{ color: COLORS.muted }}>{label}</span>
                      <span style={{ fontWeight: 600, color: color || COLORS.text }}>{value}</span>
                    </div>
                  ))}
                  <button onClick={() => {
                    const exists = watchlist.some(w => w.symbol === stockName);
                    setWatchlist(prev => exists ? prev.filter(w => w.symbol !== stockName) : [{ symbol: stockName, lastTrend: result.trend, lastPrice: result.lastClose, lastChecked: new Date().toISOString() }, ...prev].slice(0, 30));
                  }} style={{ width: '100%', marginTop: 12, padding: '8px', fontSize: 13, fontWeight: 600, borderRadius: 10, border: `1px solid ${COLORS.goldDim}`, backgroundColor: 'transparent', color: COLORS.gold, cursor: 'pointer' }}>
                    {watchlist.some(w => w.symbol === stockName) ? '⭐ Watchlist se hatao' : '☆ Watchlist mein add karo'}
                  </button>
                </div>

                {result.signal ? (
                  <div style={{ backgroundColor: COLORS.surface, border: `2px solid ${result.signal==='LONG' ? COLORS.green : COLORS.red}`, borderRadius: 16, padding: 16, marginBottom: 16 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: result.signal==='LONG' ? COLORS.green : COLORS.red, marginBottom: 12 }}>
                      {result.signal==='LONG' ? '📈 Bullish Setup' : '📉 Bearish Setup'}
                    </div>
                    {[
                      ['Entry', fmtINR(result.entry)],
                      ['Stop Loss', fmtINR(result.stopLoss)],
                      ['Target 1 (3%)', fmtINR(result.targets?.[0])],
                      ['Target 2 (6%)', fmtINR(result.targets?.[1])],
                      ['Target 3 (10%)', fmtINR(result.targets?.[2])],
                      ['Suggested Hold', result.suggestedHold],
                    ].map(([label, value]) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0', borderBottom: `1px solid ${COLORS.surfaceBorder}` }}>
                        <span style={{ color: COLORS.muted }}>{label}</span>
                        <span style={{ fontWeight: 600 }}>{value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, marginBottom: 16, fontSize: 13, color: COLORS.muted }}>
                    ⏳ Abhi koi clear confluence signal nahi hai. Wait karo.
                  </div>
                )}

                <div style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.surfaceBorder}`, borderRadius: 16, padding: 16, marginBottom: 16 }}>
                  <div style={{ fontSize: 11, letterSpacing: 2, color: COLORS.muted, marginBottom: 12 }}>POSITION SIZING CALCULATOR</div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    {['BUY','SELL'].map(d => (
                      <button key={d} onClick={() => setDirection(d)} style={{ flex: 1, padding: '8px', fontSize: 13, fontWeight: 600, borderRadius: 10, border: 'none', backgroundColor: direction===d ? (d==='BUY' ? COLORS.green : COLORS.red) : COLORS.bg, color: direction===d ? '#fff' : COLORS.muted, cursor: 'pointer' }}>{d}</button>
                    ))}
                  </div>
                  {[
                    ['Entry Price', fmtINR(ep)],
                    ['Stop Loss Price', fmtINR(stopLossPrice)],
                    ['Quantity', `${qty} shares`],
                    ['Max Loss', fmtINR(lossAmount)],
                    ['Risk:Reward (10%)', `1 : ${riskReward}`],
                  ].map(([label, value]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0', borderBottom: `1px solid ${COLORS.surfaceBorder}` }}>
                      <span style={{ color: COLORS.muted }}>{label}</span>
                      <span style={{ fontWeight: 600 }}>{value}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                    {tierResults.map(t => (
                      <div key={t.percent} style={{ flex: 1, backgroundColor: COLORS.bg, borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: COLORS.muted }}>T{TIERS.indexOf(t.percent)+1} ({t.percent}%)</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.gold }}>{fmtINR(t.price)}</div>
                        <div style={{ fontSize: 11, color: COLORS.green }}>+{fmtINR(t.profit)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {tab === 'watchlist' && (
          <div style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.surfaceBorder}`, borderRadius: 16, padding: 16 }}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: COLORS.muted, marginBottom: 16 }}>WATCHLIST</div>
            {watchlist.length === 0 ? (
              <p style={{ color: COLORS.muted, fontSize: 13 }}>Abhi khaali hai. Check tab se add karo.</p>
            ) : watchlist.map(w => (
              <div key={w.symbol} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${COLORS.surfaceBorder}` }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{w.symbol}</div>
                  <div style={{ fontSize: 12, color: COLORS.muted }}>{fmtINR(w.lastPrice)} • {w.lastTrend}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => { setTab('check'); handleSearch(w.symbol); }} style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, border: 'none', backgroundColor: COLORS.gold, color: '#1A1306', cursor: 'pointer', fontWeight: 600 }}>Check</button>
                  <button onClick={() => setWatchlist(prev => prev.filter(x => x.symbol !== w.symbol))} style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, border: `1px solid ${COLORS.surfaceBorder}`, backgroundColor: 'transparent', color: COLORS.red, cursor: 'pointer' }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'track' && (
          <div style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.surfaceBorder}`, borderRadius: 16, padding: 16 }}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: COLORS.muted, marginBottom: 8 }}>TRACK RECORD</div>
            {history.length === 0 ? (
              <p style={{ color: COLORS.muted, fontSize: 13 }}>Abhi koi history nahi hai.</p>
            ) : history.map(h => (
              <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${COLORS.surfaceBorder}` }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{h.symbol}</div>
                  <div style={{ fontSize: 12, color: COLORS.muted }}>{fmtINR(h.price)} • {h.trend}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['win','loss','pending'].map(o => (
                    <button key={o} onClick={() => setHistory(prev => prev.map(x => x.id===h.id ? {...x, outcome: o} : x))}
                      style={{ fontSize: 11, padding: '4px 8px', borderRadius: 8, border: 'none', backgroundColor: h.outcome===o ? (o==='win' ? COLORS.green : o==='loss' ? COLORS.red : COLORS.goldDim) : COLORS.bg, color: '#fff', cursor: 'pointer' }}>
                      {o==='win' ? '✓' : o==='loss' ? '✗' : '⏳'}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
