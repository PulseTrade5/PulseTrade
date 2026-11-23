import { createClient } from '@supabase/supabase-js';
import { analyzeStock, getMarketTrend } from '../src/technicalAnalysis.js';

const supabase = createClient(
  'https://okxbdzepfzysbnxmmysx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9reGJkemVwZnp5c2JueG1teXN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNDQxMjQsImV4cCI6MjA5NzYyMDEyNH0.I5uOJhT-7aquna2fLrCLDtpsRHGMXOygWaVQn5AkIaI'
);

// ---- Config ----
const MAX_HOLD_DAYS = 7;     // itne trading din mein exit na mile to time-exit
const PARTIAL_AT_T1 = 0.5;   // T1 pe 50% book, baaki 50% T3 tak (SL entry pe trail)
const COST_PCT = 0.001;      // brokerage+STT+slippage ka andaaza (0.1% round trip) — apne hisaab se badlo

// NIFTY 200 (approx) — daily scan list, diversified large + mid cap universe
const NIFTY_50 = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'ICICIBANK', 'INFY', 'ITC', 'SBIN', 'BHARTIARTL',
  'LT', 'KOTAKBANK', 'AXISBANK', 'HINDUNILVR', 'BAJFINANCE', 'MARUTI', 'ASIANPAINT',
  'SUNPHARMA', 'TITAN', 'ULTRACEMCO', 'NESTLEIND', 'WIPRO', 'ADANIENT', 'ADANIPORTS',
  'ONGC', 'NTPC', 'POWERGRID', 'TATAMOTORS', 'TATASTEEL', 'JSWSTEEL', 'HCLTECH',
  'TECHM', 'BAJAJFINSV', 'DIVISLAB', 'DRREDDY', 'CIPLA', 'GRASIM', 'BRITANNIA',
  'EICHERMOT', 'HEROMOTOCO', 'BAJAJ-AUTO', 'HINDALCO', 'COALINDIA', 'SBILIFE',
  'HDFCLIFE', 'INDUSINDBK', 'BPCL', 'APOLLOHOSP', 'UPL', 'SHREECEM', 'M&M',
  'TATACONSUM', 'VEDL',
  // NIFTY Next 50 + additional large/mid caps for a bigger, more diverse universe
  'ADANIGREEN', 'ADANIPOWER', 'AMBUJACEM', 'DLF', 'GODREJCP', 'HAVELLS', 'ICICIGI',
  'ICICIPRULI', 'IOC', 'IRCTC', 'JINDALSTEL', 'LTIM', 'NAUKRI', 'PIDILITIND',
  'PNB', 'SIEMENS', 'TATAPOWER', 'TORNTPHARM', 'TVSMOTOR', 'VBL', 'ZOMATO',
  'ZYDUSLIFE', 'ABB', 'ADANIENSOL', 'ALKEM', 'ASHOKLEY', 'AUROPHARMA', 'BANDHANBNK',
  'BANKBARODA', 'BEL', 'BERGEPAINT', 'BIOCON', 'BOSCHLTD', 'CANBK', 'CHOLAFIN',
  'COLPAL', 'CONCOR', 'CUMMINSIND', 'DABUR', 'DIXON', 'GAIL', 'GLAND', 'GODREJPROP',
  'HAL', 'HDFCAMC', 'HINDPETRO', 'IDFCFIRSTB', 'INDHOTEL', 'INDIGO', 'IGL',
  'JSWENERGY', 'JUBLFOOD', 'LICHSGFIN', 'LODHA', 'LUPIN', 'MARICO', 'MOTHERSON',
  'MRF', 'MUTHOOTFIN', 'NHPC', 'OBEROIRLTY', 'OFSS', 'PAGEIND', 'PATANJALI',
  'PERSISTENT', 'PETRONET', 'PFC', 'PGHH', 'PIIND', 'POLYCAB', 'RECLTD', 'SAIL',
  'SBICARD', 'SRF', 'SUNTV', 'SUPREMEIND', 'SYNGENE', 'TATACHEM',
  'TATACOMM', 'TATAELXSI', 'TIINDIA', 'TORNTPOWER', 'TRENT', 'UBL', 'UNITDSPR',
  'VOLTAS', 'YESBANK', 'ZEEL', 'AARTIIND', 'ABCAPITAL', 'ABFRL', 'ACC', 'AJANTPHARM',
  'APLAPOLLO', 'ASTRAL', 'ATUL', 'BALKRISIND', 'BATAINDIA', 'BHARATFORG', 'BHEL',
  'BSOFT', 'CANFINHOME', 'CROMPTON', 'CUB', 'DALBHARAT', 'DEEPAKNTR', 'DELTACORP',
  'EMAMILTD', 'ESCORTS', 'EXIDEIND', 'FEDERALBNK', 'FSL', 'GLENMARK', 'GMRINFRA',
  'GNFC', 'GRANULES', 'GSPL', 'GUJGASLTD', 'HFCL', 'HINDCOPPER', 'HONAUT',
  'IBULHSGFIN', 'IDEA', 'IEX', 'INDIAMART', 'INDUSTOWER', 'IPCALAB', 'JKCEMENT',
  'JSL', 'KANSAINER', 'KEI', 'L&TFH', 'LALPATHLAB', 'LAURUSLABS', 'LTTS',
  'MANAPPURAM', 'MAXHEALTH', 'MFSL', 'MGL', 'MPHASIS', 'NATIONALUM', 'NAVINFLUOR',
  'NMDC', 'OIL', 'PEL', 'PHOENIXLTD', 'PRESTIGE', 'RADICO', 'RAIN', 'RAJESHEXPO',
  'RAMCOCEM', 'RATNAMANI', 'RBLBANK', 'SCHAEFFLER', 'SONACOMS', 'SUMICHEM',
  'SUNDARMFIN', 'SUNDRMFAST', 'SUPRAJIT', 'SUZLON', 'TATAINVEST', 'TRIDENT',
  'TTKPRESTIG', 'VGUARD', 'VINATIORGA', 'WHIRLPOOL', 'ZFCVINDIA',
];

const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' };

// IST ke hisaab se date/time (Vercel server UTC pe chalta hai)
const IST_MS = 5.5 * 60 * 60 * 1000;
const istDate = (ms) => new Date(ms + IST_MS).toISOString().split('T')[0];

// range: '1y' scan ke liye, '6mo' open signals check ke liye
async function fetchCandles(symbol, range = '1y') {
  const sym = symbol.startsWith('^') ? symbol : symbol + '.NS';
  const res = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=${range}&interval=1d`,
    { headers: UA }
  );
  const data = await res.json();
  const result = data.chart?.result?.[0];
  if (!result) return null;
  const timestamps = result.timestamp || [];
  const quote = result.indicators?.quote?.[0] || {};
  const candles = timestamps
    .map((ts, i) => ({
      time: ts,
      date: istDate(ts * 1000),
      open: quote.open?.[i], high: quote.high?.[i],
      low: quote.low?.[i], close: quote.close?.[i], volume: quote.volume?.[i],
    }))
    .filter(c => c.close != null && c.high != null && c.low != null);

  // Market chal raha ho (3:45pm IST se pehle) to aaj ki adhuri candle hata do —
  // adhuri candle se galat entry, volume aur exit nikalte hain.
  const nowIst = new Date(Date.now() + IST_MS);
  const mins = nowIst.getUTCHours() * 60 + nowIst.getUTCMinutes();
  const todayIst = nowIst.toISOString().split('T')[0];
  if (candles.length && candles[candles.length - 1].date === todayIst && mins < 15 * 60 + 45) {
    candles.pop();
  }
  return candles;
}

// Market regime: Nifty 50-DMA ke upar = Bullish, neeche = Bearish (fail ho to null = filter off)
async function fetchMarketTrend() {
  try {
    const candles = await fetchCandles('^NSEI', '1y');
    return getMarketTrend(candles);
  } catch {
    return null;
  }
}

const round2 = (x) => Number(x.toFixed(2));

// ---- Ek open signal ko daily candles pe chalao ----
// Rules: SL pehle check (same candle mein SL aur target dono ho to SL maana jata hai — conservative).
// T1 hit -> 50% book, SL entry pe. T3 ya trail-SL ya time-exit pe poora close.
// Exit price level pe (SL/target), gap ho to open pe.
// EVAL_START
function evaluateSignal(s, candles) {
  const dir = s.signal === 'LONG' ? 1 : -1;
  const entry = Number(s.entry_price);
  const sl = Number(s.stop_loss);
  const t1 = Number(s.target1), t2 = Number(s.target2), t3 = Number(s.target3);
  const risk = Number(s.risk_per_share) || Math.abs(entry - sl);
  if (!entry || !sl || !t1 || !risk) return null;

  const hitDown = (bar, lvl) => dir === 1 ? bar.low <= lvl : bar.high >= lvl;   // level ulta side pe touch
  const hitUp = (bar, lvl) => dir === 1 ? bar.high >= lvl : bar.low <= lvl;     // level seedhi side pe touch
  const gapFill = (bar, lvl) => {                                                // SL pe gap ho to open pe fill
    if (bar.open == null) return lvl;
    return dir === 1 ? Math.min(bar.open, lvl) : Math.max(bar.open, lvl);
  };

  let t1Hit = !!s.t1_hit, t2Hit = !!s.t2_hit;
  const startedT1 = t1Hit, startedT2 = t2Hit;
  let held = 0, exit = null;

  const bars = candles.filter(c => c.date > s.signal_date);
  for (const bar of bars) {
    held++;
    let justHitT1 = false;

    if (!t1Hit) {
      if (hitDown(bar, sl)) { exit = { price: gapFill(bar, sl), reason: 'sl', date: bar.date }; break; }
      if (hitUp(bar, t1)) { t1Hit = true; justHitT1 = true; }
    } else if (hitDown(bar, entry)) {
      exit = { price: gapFill(bar, entry), reason: 'trail_sl', date: bar.date };
      break;
    }

    if (t1Hit) {
      if (t2 && hitUp(bar, t2)) t2Hit = true;
      if (t3 && hitUp(bar, t3)) { exit = { price: t3, reason: 't3', date: bar.date }; break; }
    }

    if (held >= MAX_HOLD_DAYS) { exit = { price: bar.close, reason: 'time_exit', date: bar.date }; break; }
  }

  if (!exit) {
    if (t1Hit !== startedT1 || t2Hit !== startedT2) return { type: 'progress', t1_hit: t1Hit, t2_hit: t2Hit };
    return null;
  }

  const legR = (p) => dir * (p - entry) / risk;
  const grossR = t1Hit
    ? PARTIAL_AT_T1 * legR(t1) + (1 - PARTIAL_AT_T1) * legR(exit.price)
    : legR(exit.price);
  const r = round2(grossR - (entry * COST_PCT) / risk);

  return {
    type: 'closed',
    status: r > 0 ? 'win' : 'loss',
    closed_price: round2(exit.price),
    exit_price: round2(exit.price),
    closed_date: exit.date,
    r_multiple: r,
    risk_per_share: round2(risk),
    close_reason: exit.reason,
    t1_hit: t1Hit,
    t2_hit: t2Hit,
    t3_hit: exit.reason === 't3',
    sl_hit: exit.reason === 'sl',
    pnl_pct: round2((r * risk / entry) * 100),
  };
}
// EVAL_END

// Purane open signals ka result check karo
async function checkOpenSignals() {
  const stats = { checked: 0, closed: 0, progressed: 0, errors: [] };
  const { data: openSignals } = await supabase
    .from('signal_tracking')
    .select('*')
    .eq('status', 'open');

  if (!openSignals || openSignals.length === 0) return stats;

  const uniqueSymbols = [...new Set(openSignals.map(s => s.stock_symbol))];
  const candleMap = {};
  const batchSize = 15;
  for (let i = 0; i < uniqueSymbols.length; i += batchSize) {
    await Promise.all(uniqueSymbols.slice(i, i + batchSize).map(async (sym) => {
      try { candleMap[sym] = await fetchCandles(sym, '6mo'); } catch { candleMap[sym] = null; }
    }));
  }

  for (const s of openSignals) {
    stats.checked++;
    const candles = candleMap[s.stock_symbol];
    if (!candles || candles.length === 0) continue;

    const result = evaluateSignal(s, candles);
    if (!result) continue;

    const { type, ...payload } = result;
    const { error } = await supabase.from('signal_tracking').update(payload).eq('id', s.id);
    if (error) { stats.errors.push(`${s.stock_symbol} update failed: ${error.message}`); continue; }
    if (type === 'closed') stats.closed++; else stats.progressed++;
  }
  return stats;
}

// NIFTY 200 scan karke naye signals banao — batch mein
async function scanNewSignals() {
  const stats = { scanned: 0, signalsFound: 0, skippedDuplicate: 0, errors: [] };

  const marketTrend = await fetchMarketTrend();
  stats.marketTrend = marketTrend;

  const batchSize = 10;
  for (let i = 0; i < NIFTY_50.length; i += batchSize) {
    const batch = NIFTY_50.slice(i, i + batchSize);
    await Promise.all(batch.map(async (symbol) => {
      try {
        stats.scanned++;
        const candles = await fetchCandles(symbol, '1y');
        if (!candles || candles.length < 50) return;

        const analysis = analyzeStock(candles, marketTrend);
        if (analysis.error || !analysis.strongSignal) return;

        const { data: existingOpen } = await supabase
          .from('signal_tracking')
          .select('id')
          .eq('stock_symbol', symbol)
          .eq('status', 'open')
          .maybeSingle();

        if (existingOpen) {
          stats.skippedDuplicate++;
          return;
        }

        const { error } = await supabase.from('signal_tracking').insert({
          stock_symbol: symbol,
          signal: analysis.strongSignal,
          entry_price: analysis.entry,
          stop_loss: analysis.stopLoss,
          target1: analysis.targets?.[0],
          target2: analysis.targets?.[1],
          target3: analysis.targets?.[2],
          risk_per_share: analysis.riskPerShare,
          // Signal usi candle ki date ka hai jis pe bana (aaj ki date nahi, weekend/holiday pe galat hota)
          signal_date: candles[candles.length - 1].date,
          status: 'open',
        });
        if (error) { stats.errors.push(`${symbol} insert failed: ${error.message}`); return; }
        stats.signalsFound++;
      } catch (e) {
        stats.errors.push(`${symbol}: ${e.message}`);
      }
    }));
  }
  return stats;
}

export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
  const authHeader = req.headers['authorization'];
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const today = istDate(Date.now());

  // Pehle purane open signals (SL/target/time-exit), phir naye signals
  const checkResults = await checkOpenSignals();
  const scanResults = await scanNewSignals();

  return res.status(200).json({
    success: true,
    date: today,
    resultsChecked: checkResults,
    newSignalsScan: scanResults,
  });
}
