import { createClient } from '@supabase/supabase-js';
import { analyzeStock } from '../src/technicalAnalysis.js';

const supabase = createClient(
  'https://okxbdzepfzysbnxmmysx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9reGJkemVwZnp5c2JueG1teXN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNDQxMjQsImV4cCI6MjA5NzYyMDEyNH0.I5uOJhT-7aquna2fLrCLDtpsRHGMXOygWaVQn5AkIaI'
);

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

async function fetchCandles(symbol) {
  const sym = symbol + '.NS';
  const res = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=1y&interval=1d`,
    { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }
  );
  const data = await res.json();
  const result = data.chart?.result?.[0];
  if (!result) return null;
  const timestamps = result.timestamp || [];
  const quote = result.indicators?.quote?.[0] || {};
  return timestamps
    .map((ts, i) => ({
      time: ts, open: quote.open?.[i], high: quote.high?.[i],
      low: quote.low?.[i], close: quote.close?.[i], volume: quote.volume?.[i],
    }))
    .filter(c => c.close != null);
}

// Nifty 50 index ka apna trend check karo — LONG signals sirf market uptrend
// mein allow honge, SHORT signals sirf market downtrend mein. Isse individual
// stock ke signals overall market direction ke against nahi jaate.
async function getMarketTrend() {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEI?range=3mo&interval=1d`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }
    );
    const data = await res.json();
    const result = data.chart?.result?.[0];
    if (!result) return null;
    const quote = result.indicators?.quote?.[0] || {};
    const closes = (quote.close || []).filter(c => c != null);
    if (closes.length < 21) return null;
    const last = closes[closes.length - 1];
    const past = closes[closes.length - 21]; // ~20 trading days pehle, same lookback jaisa stock trend mein
    return last > past ? 'Bullish' : 'Bearish';
  } catch {
    return null; // fetch fail ho to filter skip ho jayega (marketAligned = true)
  }
}

async function getCurrentPrice(symbol) {
  try {
    const sym = symbol.includes('.') ? symbol : symbol + '.NS';
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=5d&interval=1d`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }
    );
    const data = await res.json();
    const result = data.chart?.result?.[0];
    const meta = result?.meta || {};
    if (meta.regularMarketPrice) return meta.regularMarketPrice;
    const quote = result?.indicators?.quote?.[0] || {};
    const closes = (quote.close || []).filter(c => c != null);
    return closes.length ? closes[closes.length - 1] : null;
  } catch {
    return null;
  }
}

// Purane open signals ka result check karo — target hit hua ya SL laga
async function checkOpenSignals() {
  const stats = { checked: 0, closed: 0, errors: [] };
  const { data: openSignals } = await supabase
    .from('signal_tracking')
    .select('*')
    .eq('status', 'open');

  if (!openSignals || openSignals.length === 0) return stats;

  // Ek stock ka price ek hi baar fetch karo, chahe usme kitne bhi open signals ho
  const uniqueSymbols = [...new Set(openSignals.map(s => s.stock_symbol))];
  const priceMap = {};
  for (const sym of uniqueSymbols) {
    priceMap[sym] = await getCurrentPrice(sym);
  }

  for (const s of openSignals) {
    stats.checked++;
    const price = priceMap[s.stock_symbol];
    if (price === null || price === undefined) continue;

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
      try {
        await supabase
          .from('signal_tracking')
          .update({ status: newStatus, closed_price: price, closed_date: new Date().toISOString().split('T')[0] })
          .eq('id', s.id);
        stats.closed++;
      } catch (e) {
        stats.errors.push(`${s.stock_symbol} update failed: ${e.message}`);
      }
    }
  }
  return stats;
}

// NIFTY 200 scan karke naye signals banao — batch mein chalate hain taaki
// 200 stocks ka scan function ke time-limit ke andar complete ho jaye
async function scanNewSignals(today) {
  const stats = { scanned: 0, signalsFound: 0, skippedDuplicate: 0, errors: [] };

  // Poore market ka trend ek hi baar nikal lo — har stock check karne se pehle
  const marketTrend = await getMarketTrend();

  const batchSize = 10;
  for (let i = 0; i < NIFTY_50.length; i += batchSize) {
    const batch = NIFTY_50.slice(i, i + batchSize);
    await Promise.all(batch.map(async (symbol) => {
      try {
        stats.scanned++;
        const candles = await fetchCandles(symbol);
        if (!candles || candles.length < 50) return;

        const analysis = analyzeStock(candles, marketTrend);
        // Admin tracking ke liye sirf strongSignal use hota hai (extra-strict,
        // market direction ke saath aligned) — customer-facing dashboard/screener
        // normal analysis.signal use karte hain (marketTrend wahan pass nahi hota).
        if (analysis.error || !analysis.strongSignal) return;

        // Agar is stock ka pehle se koi OPEN trade chal raha hai, to naya signal mat banao —
        // jab tak wo close (win/loss) na ho jaye, dobara "same trade" nahi lena
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

        await supabase.from('signal_tracking').insert({
          stock_symbol: symbol,
          signal: analysis.strongSignal,
          entry_price: analysis.entry,
          stop_loss: analysis.stopLoss,
          target1: analysis.targets?.[0],
          target2: analysis.targets?.[1],
          target3: analysis.targets?.[2],
          signal_date: today,
          status: 'open',
        });
        stats.signalsFound++;
      } catch (e) {
        stats.errors.push(`${symbol}: ${e.message}`);
      }
    }));
  }
  return stats;
}

// 200 stocks scan karne mein default 10s se zyada time lagega, isliye function
// ko zyada time deta hai (Vercel Hobby plan pe max 60s tak allowed hai)
export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
  // Simple secret check — Vercel Cron ke alawa koi aur trigger na kar sake
  const authHeader = req.headers['authorization'];
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const today = new Date().toISOString().split('T')[0];

  // Pehle purane open signals ka result check karo (win/loss update)
  const checkResults = await checkOpenSignals();

  // Phir NIFTY 50 scan karke aaj ke naye signals banao
  const scanResults = await scanNewSignals(today);

  return res.status(200).json({
    success: true,
    date: today,
    resultsChecked: checkResults,
    newSignalsScan: scanResults,
  });
}

