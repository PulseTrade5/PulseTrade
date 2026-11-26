import { createClient } from '@supabase/supabase-js';
import { analyzeStock, getMarketTrend } from '../src/technicalAnalysis.js';

// Service-role key sirf server (Vercel env) mein rehti hai — RLS bypass karti hai, code/GitHub mein kabhi nahi.
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://okxbdzepfzysbnxmmysx.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = SUPABASE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })
  : null;

// ---- Config ----
const MAX_HOLD_DAYS = 7;     // itne trading din mein exit na mile to time-exit
const PARTIAL_AT_T1 = 0.5;   // T1 pe 50% book, baaki 50% T3 tak (SL entry pe trail)
const COST_PCT = 0.001;      // brokerage+STT+slippage ka andaaza (0.1% round trip) — apne hisaab se badlo
const MAX_OPEN_TOTAL = 6;     // ek saath itne se zyada open swing signals nahi
const MAX_PER_SECTOR = 2;     // ek sector (jaise Financials) ke max itne open signals

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

// Sector map — ek sector ke saare stocks ek saath girte hain, isliye max MAX_PER_SECTOR open signals
const SECTORS = {
  Financials: ['HDFCBANK', 'ICICIBANK', 'KOTAKBANK', 'AXISBANK', 'SBIN', 'INDUSINDBK', 'BANKBARODA', 'PNB', 'CANBK', 'IDFCFIRSTB', 'FEDERALBNK', 'BANDHANBNK', 'RBLBANK', 'YESBANK', 'CUB', 'BAJFINANCE', 'BAJAJFINSV', 'CHOLAFIN', 'MUTHOOTFIN', 'MANAPPURAM', 'LICHSGFIN', 'PFC', 'RECLTD', 'SBICARD', 'SUNDARMFIN', 'ABCAPITAL', 'IBULHSGFIN', 'CANFINHOME', 'PEL', 'HDFCAMC', 'MFSL', 'L&TFH', 'TATAINVEST', 'SBILIFE', 'HDFCLIFE', 'ICICIGI', 'ICICIPRULI'],
  IT: ['TCS', 'INFY', 'WIPRO', 'HCLTECH', 'TECHM', 'LTIM', 'LTTS', 'MPHASIS', 'PERSISTENT', 'OFSS', 'BSOFT', 'TATAELXSI', 'NAUKRI', 'INDIAMART'],
  Auto: ['MARUTI', 'TATAMOTORS', 'EICHERMOT', 'HEROMOTOCO', 'BAJAJ-AUTO', 'M&M', 'TVSMOTOR', 'ASHOKLEY', 'BALKRISIND', 'ESCORTS', 'MOTHERSON', 'BOSCHLTD', 'BHARATFORG', 'MRF', 'EXIDEIND', 'SONACOMS', 'SCHAEFFLER', 'SUNDRMFAST', 'ZFCVINDIA', 'SUPRAJIT', 'TIINDIA'],
  Pharma: ['SUNPHARMA', 'DIVISLAB', 'DRREDDY', 'CIPLA', 'APOLLOHOSP', 'LUPIN', 'TORNTPHARM', 'ZYDUSLIFE', 'ALKEM', 'AUROPHARMA', 'BIOCON', 'GLAND', 'GLENMARK', 'GRANULES', 'IPCALAB', 'LAURUSLABS', 'SYNGENE', 'AJANTPHARM', 'MAXHEALTH', 'LALPATHLAB'],
  FMCG: ['HINDUNILVR', 'ITC', 'NESTLEIND', 'BRITANNIA', 'TATACONSUM', 'DABUR', 'GODREJCP', 'MARICO', 'COLPAL', 'PGHH', 'UBL', 'UNITDSPR', 'VBL', 'EMAMILTD', 'RADICO', 'PATANJALI'],
  Energy: ['RELIANCE', 'ONGC', 'BPCL', 'IOC', 'HINDPETRO', 'GAIL', 'PETRONET', 'IGL', 'MGL', 'GUJGASLTD', 'GSPL', 'OIL', 'COALINDIA'],
  Power: ['NTPC', 'POWERGRID', 'TATAPOWER', 'ADANIGREEN', 'ADANIPOWER', 'ADANIENSOL', 'JSWENERGY', 'NHPC', 'TORNTPOWER', 'SUZLON'],
  Metals: ['TATASTEEL', 'JSWSTEEL', 'HINDALCO', 'VEDL', 'JINDALSTEL', 'SAIL', 'NMDC', 'NATIONALUM', 'HINDCOPPER', 'JSL', 'APLAPOLLO', 'RATNAMANI'],
  CementInfra: ['ULTRACEMCO', 'GRASIM', 'AMBUJACEM', 'SHREECEM', 'ACC', 'DALBHARAT', 'JKCEMENT', 'RAMCOCEM', 'LT', 'ADANIPORTS', 'ADANIENT', 'GMRINFRA', 'CONCOR'],
  Realty: ['DLF', 'GODREJPROP', 'LODHA', 'OBEROIRLTY', 'PHOENIXLTD', 'PRESTIGE'],
  Consumer: ['TITAN', 'ASIANPAINT', 'BERGEPAINT', 'KANSAINER', 'PIDILITIND', 'HAVELLS', 'VOLTAS', 'WHIRLPOOL', 'CROMPTON', 'POLYCAB', 'KEI', 'DIXON', 'VGUARD', 'PAGEIND', 'BATAINDIA', 'TRENT', 'ABFRL', 'JUBLFOOD', 'INDHOTEL', 'IRCTC', 'INDIGO', 'ZOMATO', 'TTKPRESTIG', 'SUPREMEIND', 'ASTRAL'],
  Industrials: ['SIEMENS', 'ABB', 'BHEL', 'BEL', 'HAL', 'CUMMINSIND', 'HONAUT', 'HFCL'],
  Chemicals: ['UPL', 'PIIND', 'SRF', 'AARTIIND', 'ATUL', 'DEEPAKNTR', 'NAVINFLUOR', 'VINATIORGA', 'TATACHEM', 'GNFC', 'SUMICHEM', 'RAIN'],
  TelecomMedia: ['BHARTIARTL', 'IDEA', 'INDUSTOWER', 'TATACOMM', 'SUNTV', 'ZEEL'],
};
const SECTOR_OF = {};
for (const [sec, syms] of Object.entries(SECTORS)) syms.forEach(sym => { SECTOR_OF[sym] = sec; });
const sectorOf = (sym) => SECTOR_OF[sym] || null; // map mein nahi = koi sector limit nahi

const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' };

// IST ke hisaab se date/time (Vercel server UTC pe chalta hai)
const IST_MS = 5.5 * 60 * 60 * 1000;
const istDate = (ms) => new Date(ms + IST_MS).toISOString().split('T')[0];

// range: '1y' scan ke liye, '6mo' open signals check ke liye
// live=true (3 PM scan): aaj ki adhuri candle rakhi jaati hai aur uska volume poore din ke hisaab se scale hota hai
async function fetchCandles(symbol, range = '1y', live = false) {
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
    if (!live) {
      candles.pop();
    } else if (mins < 15 * 60 + 30) {
      // Adhure din ka volume poore din ke andaaze mein badlo (9:15 se ab tak ke minutes / 375 total)
      const elapsed = Math.min(375, Math.max(30, mins - (9 * 60 + 15)));
      const last = candles[candles.length - 1];
      if (last.volume != null) last.volume = last.volume * (375 / elapsed);
    }
  }
  return candles;
}

// Market regime: Nifty 50-DMA ke upar = Bullish, neeche = Bearish (fail ho to null = filter off)
async function fetchMarketTrend(live = false) {
  try {
    const candles = await fetchCandles('^NSEI', '1y', live);
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

// NIFTY 200 scan karke naye signals banao — batch mein.
// Pehle saare strong signals ikattha hote hain, phir score se rank karke limits ke andar hi save hote hain:
// total open <= MAX_OPEN_TOTAL aur ek sector ke <= MAX_PER_SECTOR.
async function scanNewSignals(live = false) {
  const stats = {
    scanned: 0, strongFound: 0, signalsFound: 0,
    skippedDuplicate: 0, skippedSectorLimit: 0, skippedTotalLimit: 0,
    openAfter: 0, errors: [],
  };

  const marketTrend = await fetchMarketTrend(live);
  stats.marketTrend = marketTrend;

  const candidates = [];
  const batchSize = 10;
  for (let i = 0; i < NIFTY_50.length; i += batchSize) {
    const batch = NIFTY_50.slice(i, i + batchSize);
    await Promise.all(batch.map(async (symbol) => {
      try {
        stats.scanned++;
        const candles = await fetchCandles(symbol, '1y', live);
        if (!candles || candles.length < 50) return;

        const analysis = analyzeStock(candles, marketTrend);
        if (analysis.error || !analysis.strongSignal) return;

        const dirScore = analysis.strongSignal === 'LONG' ? analysis.longScore : analysis.shortScore;
        candidates.push({
          symbol,
          analysis,
          signalDate: candles[candles.length - 1].date,
          score: (Number(dirScore) || 0) * 1000 + (Number(analysis.adx) || 0),
        });
      } catch (e) {
        stats.errors.push(`${symbol}: ${e.message}`);
      }
    }));
  }
  stats.strongFound = candidates.length;

  // Abhi kitne signals open hain aur kis sector ke
  const { data: openRows } = await supabase
    .from('signal_tracking')
    .select('stock_symbol')
    .eq('status', 'open');
  const openSymbols = new Set((openRows || []).map(r => r.stock_symbol));
  const sectorCount = {};
  for (const sym of openSymbols) {
    const sec = sectorOf(sym);
    if (sec) sectorCount[sec] = (sectorCount[sec] || 0) + 1;
  }

  // Sabse mazboot signal pehle
  candidates.sort((a, b) => b.score - a.score);

  for (const c of candidates) {
    if (openSymbols.has(c.symbol)) { stats.skippedDuplicate++; continue; }
    if (openSymbols.size >= MAX_OPEN_TOTAL) { stats.skippedTotalLimit++; continue; }
    const sec = sectorOf(c.symbol);
    if (sec && (sectorCount[sec] || 0) >= MAX_PER_SECTOR) { stats.skippedSectorLimit++; continue; }

    const a = c.analysis;
    const { error } = await supabase.from('signal_tracking').insert({
      stock_symbol: c.symbol,
      signal: a.strongSignal,
      entry_price: a.entry,
      stop_loss: a.stopLoss,
      target1: a.targets?.[0],
      target2: a.targets?.[1],
      target3: a.targets?.[2],
      risk_per_share: a.riskPerShare,
      // Signal usi candle ki date ka hai jis pe bana (aaj ki date nahi, weekend/holiday pe galat hota)
      signal_date: c.signalDate,
      status: 'open',
    });
    if (error) { stats.errors.push(`${c.symbol} insert failed: ${error.message}`); continue; }

    openSymbols.add(c.symbol);
    if (sec) sectorCount[sec] = (sectorCount[sec] || 0) + 1;
    stats.signalsFound++;
  }

  stats.openAfter = openSymbols.size;
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

  if (!supabase) {
    return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY env var missing hai (Vercel > Settings > Environment Variables)' });
  }

  const today = istDate(Date.now());

  // ?mode=scan -> 3 PM scan: sirf naye signals (adhuri candle ke saath). Win/Loss check 4 PM pe hi hota hai.
  if (req.query?.mode === 'scan') {
    const scanOnly = await scanNewSignals(true);
    return res.status(200).json({ success: true, mode: 'scan', date: today, newSignalsScan: scanOnly });
  }

  // Default (4 PM): pehle purane open signals (SL/target/time-exit), phir naye signals
  const checkResults = await checkOpenSignals();
  const scanResults = await scanNewSignals();

  return res.status(200).json({
    success: true,
    date: today,
    resultsChecked: checkResults,
    newSignalsScan: scanResults,
  });
}
