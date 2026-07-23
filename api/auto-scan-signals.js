import { createClient } from '@supabase/supabase-js';
import { analyzeStock } from '../src/technicalAnalysis.js';

const supabase = createClient(
  'https://okxbdzepfzysbnxmmysx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9reGJkemVwZnp5c2JueG1teXN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNDQxMjQsImV4cCI6MjA5NzYyMDEyNH0.I5uOJhT-7aquna2fLrCLDtpsRHGMXOygWaVQn5AkIaI'
);

const NIFTY_50 = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'ICICIBANK', 'INFY', 'ITC', 'SBIN', 'BHARTIARTL',
  'LT', 'KOTAKBANK', 'AXISBANK', 'HINDUNILVR', 'BAJFINANCE', 'MARUTI', 'ASIANPAINT',
  'SUNPHARMA', 'TITAN', 'ULTRACEMCO', 'NESTLEIND', 'WIPRO', 'ADANIENT', 'ADANIPORTS',
  'ONGC', 'NTPC', 'POWERGRID', 'TATAMOTORS', 'TATASTEEL', 'JSWSTEEL', 'HCLTECH',
  'TECHM', 'BAJAJFINSV', 'DIVISLAB', 'DRREDDY', 'CIPLA', 'GRASIM', 'BRITANNIA',
  'EICHERMOT', 'HEROMOTOCO', 'BAJAJ-AUTO', 'HINDALCO', 'COALINDIA', 'SBILIFE',
  'HDFCLIFE', 'INDUSINDBK', 'BPCL', 'APOLLOHOSP', 'UPL', 'SHREECEM', 'M&M',
  'TATACONSUM', 'VEDL',
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

export default async function handler(req, res) {
  const authHeader = req.headers['authorization'];
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const today = new Date().toISOString().split('T')[0];
  const results = { scanned: 0, signalsFound: 0, skippedDuplicate: 0, errors: [] };

  for (const symbol of NIFTY_50) {
    try {
      results.scanned++;
      const candles = await fetchCandles(symbol);
      if (!candles || candles.length < 50) continue;

      const analysis = analyzeStock(candles);
      if (analysis.error || !analysis.signal) continue;

      const { data: existing } = await supabase
        .from('signal_tracking')
        .select('id')
        .eq('stock_symbol', symbol)
        .eq('signal_date', today)
        .maybeSingle();

      if (existing) {
        results.skippedDuplicate++;
        continue;
      }

      await supabase.from('signal_tracking').insert({
        stock_symbol: symbol,
        signal: analysis.signal,
        entry_price: analysis.entry,
        stop_loss: analysis.stopLoss,
        target1: analysis.targets?.[0],
        target2: analysis.targets?.[1],
        target3: analysis.targets?.[2],
        signal_date: today,
        status: 'open',
      });
      results.signalsFound++;
    } catch (e) {
      results.errors.push(`${symbol}: ${e.message}`);
    }
  }

  return res.status(200).json({ success: true, date: today, ...results });
}
