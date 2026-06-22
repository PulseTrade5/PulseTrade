export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { symbol } = req.query;

  if (!symbol) {
    return res.status(400).json({ error: 'symbol is required, e.g. RELIANCE.NS' });
  }

  async function fetchCandles(range, interval) {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36' },
    });
    const data = await response.json();
    if (!response.ok || data.chart?.error) return null;
    const result = data.chart?.result?.[0];
    if (!result) return null;
    const timestamps = result.timestamp || [];
    const quote = result.indicators?.quote?.[0] || {};
    return timestamps.map((ts, i) => ({
      time: ts,
      open: quote.open?.[i],
      high: quote.high?.[i],
      low: quote.low?.[i],
      close: quote.close?.[i],
      volume: quote.volume?.[i],
    })).filter(c => c.close != null);
  }

  try {
    const [dailyCandles, weeklyCandles, monthlyCandles] = await Promise.all([
      fetchCandles('1y', '1d'),
      fetchCandles('2y', '1wk'),
      fetchCandles('5y', '1mo'),
    ]);

    if (!dailyCandles || dailyCandles.length < 50) {
      return res.status(500).json({ error: 'Failed to fetch data from Yahoo Finance' });
    }

    return res.status(200).json({
      symbol,
      candles: dailyCandles,
      weeklyCandles: weeklyCandles || [],
      monthlyCandles: monthlyCandles || [],
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error', details: String(err) });
  }
}
