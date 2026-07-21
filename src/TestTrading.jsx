import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

const COLORS = {
  bg: "#F4F6FA", surface: "#FFFFFF", surfaceBorder: "#E2E8F0",
  gold: "#C8920A", goldLight: "#FEF3C7",
  green: "#059669", greenLight: "#ECFDF5",
  red: "#DC2626", redLight: "#FEF2F2",
  text: "#0F172A", muted: "#64748B",
};

function fmtINR(n) {
  if (n === null || n === undefined || isNaN(n)) return "—";
  return "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export default function TestTrading({ userEmail, balance, onBalanceChange }) {
  const email = userEmail || "prabhat3300@gmail.com";

  const [symbolInput, setSymbolInput] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [quote, setQuote] = useState(null); // { symbol, name, price }
  const [qty, setQty] = useState("");
  const [acting, setActing] = useState(false);
  const [msg, setMsg] = useState("");

  const [holdings, setHoldings] = useState([]);
  const [loadingHoldings, setLoadingHoldings] = useState(true);
  const [livePrices, setLivePrices] = useState({}); // symbol -> price
  const [refreshingPrices, setRefreshingPrices] = useState(false);

  const fetchHoldings = async () => {
    setLoadingHoldings(true);
    const { data } = await supabase
      .from('test_fund_holdings')
      .select('*')
      .eq('user_email', email)
      .order('created_at', { ascending: false });
    setHoldings(data || []);
    setLoadingHoldings(false);
  };

  useEffect(() => { fetchHoldings(); }, [email]);

  useEffect(() => {
    if (holdings.length > 0) refreshHoldingPrices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holdings.length]);

  const fetchQuote = async (sym) => {
    let symbol = sym.trim().toUpperCase();
    if (!symbol) return null;
    if (!symbol.includes('.')) symbol = symbol + '.NS';
    const res = await fetch(`/api/get-stock-data?symbol=${encodeURIComponent(symbol)}&range=1y`);
    const data = await res.json();
    if (!res.ok || !data.candles?.length) throw new Error(data.error || 'Data nahi mila');
    const price = data.stockInfo?.regularMarketPrice || data.candles[data.candles.length - 1]?.close;
    return { symbol: sym.trim().toUpperCase(), name: data.stockInfo?.longName || sym.trim().toUpperCase(), price };
  };

  const handleSearch = async () => {
    if (!symbolInput.trim()) return;
    setSearching(true); setSearchError(''); setQuote(null);
    try {
      const q = await fetchQuote(symbolInput);
      setQuote(q);
    } catch (e) {
      setSearchError('Stock nahi mila, symbol check karo (jaise RELIANCE, TCS)');
    }
    setSearching(false);
  };

  const refreshHoldingPrices = async () => {
    if (holdings.length === 0) return;
    setRefreshingPrices(true);
    const updated = {};
    for (const h of holdings) {
      try {
        const q = await fetchQuote(h.symbol);
        updated[h.symbol] = q.price;
      } catch (e) { /* skip on fail */ }
    }
    setLivePrices(prev => ({ ...prev, ...updated }));
    setRefreshingPrices(false);
  };

  const logTransaction = async (type, amount, balanceAfter, extra = {}) => {
    await supabase.from('test_fund_transactions').insert([{
      user_email: email, type, amount, balance_after: balanceAfter, ...extra,
    }]);
  };

  const handleBuy = async () => {
    const q = Number(qty);
    if (!quote || !q || q <= 0) return;
    const cost = q * quote.price;
    if (cost > balance) { setMsg('❌ Wallet mein itna balance nahi hai'); setTimeout(() => setMsg(''), 2500); return; }
    setActing(true);

    const existing = holdings.find(h => h.symbol === quote.symbol);
    let error;
    if (existing) {
      const newQty = Number(existing.qty) + q;
      const newAvg = ((Number(existing.qty) * Number(existing.avg_price)) + cost) / newQty;
      ({ error } = await supabase.from('test_fund_holdings')
        .update({ qty: newQty, avg_price: newAvg, updated_at: new Date().toISOString() })
        .eq('id', existing.id));
    } else {
      ({ error } = await supabase.from('test_fund_holdings').insert([{
        user_email: email, symbol: quote.symbol, company_name: quote.name, qty: q, avg_price: quote.price,
      }]));
    }

    if (!error) {
      const newBalance = balance - cost;
      await supabase.from('test_fund').update({ balance: newBalance, updated_at: new Date().toISOString() }).eq('user_email', email);
      await logTransaction('buy', cost, newBalance, { symbol: quote.symbol });
      onBalanceChange(newBalance);
      fetchHoldings();
      setMsg(`✅ ${q} ${quote.symbol} @ ${fmtINR(quote.price)} buy ho gaya`);
      setQty(''); setQuote(null); setSymbolInput('');
    } else {
      setMsg('❌ Kuch gadbad ho gayi');
    }
    setActing(false);
    setTimeout(() => setMsg(''), 3000);
  };

  const handleSell = async (holding, sellQty) => {
    const sQty = Number(sellQty);
    if (!sQty || sQty <= 0 || sQty > Number(holding.qty)) return;
    setActing(true);
    try {
      const q = await fetchQuote(holding.symbol);
      const proceeds = sQty * q.price;
      const remainingQty = Number(holding.qty) - sQty;

      if (remainingQty <= 0) {
        await supabase.from('test_fund_holdings').delete().eq('id', holding.id);
      } else {
        await supabase.from('test_fund_holdings').update({ qty: remainingQty, updated_at: new Date().toISOString() }).eq('id', holding.id);
      }

      const newBalance = balance + proceeds;
      await supabase.from('test_fund').update({ balance: newBalance, updated_at: new Date().toISOString() }).eq('user_email', email);
      const pnl = (q.price - Number(holding.avg_price)) * sQty;
      await logTransaction('sell', proceeds, newBalance, { symbol: holding.symbol });
      onBalanceChange(newBalance);
      fetchHoldings();
      setMsg(`✅ ${sQty} ${holding.symbol} @ ${fmtINR(q.price)} sell ho gaya (${pnl >= 0 ? '+' : ''}${fmtINR(pnl)})`);
    } catch (e) {
      setMsg('❌ Live price nahi mil paya, dobara try karo');
    }
    setActing(false);
    setTimeout(() => setMsg(''), 3000);
  };

  const investment = holdings.reduce((sum, h) => sum + Number(h.qty) * Number(h.avg_price), 0);
  const currentValue = holdings.reduce((sum, h) => {
    const live = livePrices[h.symbol];
    return sum + Number(h.qty) * (live !== undefined ? live : Number(h.avg_price));
  }, 0);
  const totalPnl = currentValue - investment;
  const totalPnlPct = investment > 0 ? (totalPnl / investment) * 100 : 0;
  const allPricesLoaded = holdings.length > 0 && holdings.every(h => livePrices[h.symbol] !== undefined);

  const cardStyle = { backgroundColor: COLORS.surface, border: `1px solid ${COLORS.surfaceBorder}`, borderRadius: 16, padding: 18, marginBottom: 16 };
  const inputStyle = { width: '100%', padding: '11px 14px', fontSize: 14, borderRadius: 10, border: `1.5px solid ${COLORS.surfaceBorder}`, backgroundColor: COLORS.bg, color: COLORS.text, outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {msg && (
        <div style={{ backgroundColor: COLORS.greenLight, border: '1.5px solid #bbf7d0', borderRadius: 12, padding: '10px 16px', marginBottom: 16, fontSize: 13, fontWeight: 700, color: COLORS.green }}>{msg}</div>
      )}

      {/* Portfolio Summary */}
      {holdings.length > 0 && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.muted, fontWeight: 700 }}>📊 PORTFOLIO SUMMARY</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: allPricesLoaded ? COLORS.green : COLORS.gold }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: allPricesLoaded ? COLORS.green : COLORS.gold }}>
                {refreshingPrices ? 'UPDATING...' : allPricesLoaded ? 'LIVE' : 'PARTIAL'}
              </span>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 4 }}>Profit</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 26, fontWeight: 900, color: totalPnl >= 0 ? COLORS.green : COLORS.red }}>
                {totalPnl >= 0 ? '+' : ''}{fmtINR(totalPnl)}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: totalPnl >= 0 ? COLORS.green : COLORS.red }}>
                ({totalPnl >= 0 ? '+' : ''}{totalPnlPct.toFixed(2)}%)
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 4 }}>Investment</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.text }}>{fmtINR(investment)}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 4 }}>Current Value</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.text }}>{fmtINR(currentValue)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Search & Buy */}
      <div style={cardStyle}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.muted, fontWeight: 700, marginBottom: 12 }}>🔍 STOCK SEARCH KARO</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input
            value={symbolInput}
            onChange={e => setSymbolInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="e.g. RELIANCE, TCS"
            style={{ ...inputStyle, flex: 1 }}
          />
          <button onClick={handleSearch} disabled={searching} style={{ padding: '0 18px', borderRadius: 10, border: 'none', backgroundColor: COLORS.gold, color: '#FFF', fontWeight: 700, cursor: 'pointer' }}>
            {searching ? '...' : 'Search'}
          </button>
        </div>
        {searchError && <div style={{ fontSize: 12, color: COLORS.red, marginBottom: 8 }}>{searchError}</div>}

        {quote && (
          <div style={{ backgroundColor: COLORS.bg, borderRadius: 12, padding: 14, marginTop: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.text }}>{quote.symbol}</div>
            <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 8 }}>{quote.name}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: COLORS.gold, marginBottom: 12 }}>{fmtINR(quote.price)}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="number" placeholder="Quantity" value={qty} onChange={e => setQty(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
              <button onClick={handleBuy} disabled={acting || !qty} style={{ padding: '0 20px', borderRadius: 10, border: 'none', backgroundColor: COLORS.green, color: '#FFF', fontWeight: 700, cursor: 'pointer' }}>Buy</button>
            </div>
            {qty && Number(qty) > 0 && (
              <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 6 }}>Total: {fmtINR(Number(qty) * quote.price)} • Wallet: {fmtINR(balance)}</div>
            )}
          </div>
        )}
      </div>

      {/* Holdings */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.muted, fontWeight: 700 }}>📊 HOLDINGS ({holdings.length})</div>
          {holdings.length > 0 && (
            <button onClick={refreshHoldingPrices} disabled={refreshingPrices} style={{ fontSize: 11, fontWeight: 700, color: COLORS.gold, background: 'none', border: 'none', cursor: 'pointer' }}>
              {refreshingPrices ? '⏳ ...' : '🔄 Refresh'}
            </button>
          )}
        </div>
        {loadingHoldings ? (
          <div style={{ textAlign: 'center', color: COLORS.muted, padding: '16px 0', fontSize: 13 }}>⏳ Loading...</div>
        ) : holdings.length === 0 ? (
          <p style={{ color: COLORS.muted, textAlign: 'center', padding: '16px 0', fontSize: 13 }}>Koi holding nahi hai. Upar se buy karo.</p>
        ) : holdings.map(h => {
          const live = livePrices[h.symbol];
          const pnl = live ? (live - Number(h.avg_price)) * Number(h.qty) : null;
          const pnlPct = live ? ((live - Number(h.avg_price)) / Number(h.avg_price) * 100) : null;
          return (
            <div key={h.id} style={{ padding: '12px 0', borderBottom: `1px solid ${COLORS.surfaceBorder}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.text }}>{h.symbol}</div>
                  <div style={{ fontSize: 11, color: COLORS.muted }}>{h.qty} shares @ avg {fmtINR(h.avg_price)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.text }}>{live ? fmtINR(live) : '—'}</div>
                  {pnl !== null && (
                    <div style={{ fontSize: 11, fontWeight: 700, color: pnl >= 0 ? COLORS.green : COLORS.red }}>
                      {pnl >= 0 ? '+' : ''}{fmtINR(pnl)} ({pnlPct.toFixed(1)}%)
                    </div>
                  )}
                </div>
              </div>
              <SellRow holding={h} onSell={handleSell} acting={acting} inputStyle={inputStyle} colors={COLORS} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SellRow({ holding, onSell, acting, inputStyle, colors }) {
  const [sellQty, setSellQty] = useState(holding.qty);
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <input type="number" value={sellQty} onChange={e => setSellQty(e.target.value)} style={{ ...inputStyle, flex: 1, padding: '7px 10px', fontSize: 12 }} />
      <button onClick={() => onSell(holding, sellQty)} disabled={acting} style={{ padding: '0 16px', borderRadius: 8, border: 'none', backgroundColor: colors.red, color: '#FFF', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Sell</button>
    </div>
  );
          }
