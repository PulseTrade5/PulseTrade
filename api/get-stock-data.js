export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { symbol, range = '1y', interval = '1d' } = req.query;

  if (!symbol) {
    return res.status(400).json({ error: 'symbol is required' });
  }

  try {
    const [chartRes, quoteRes] = await Promise.all([
      fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      }),
      fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      }),
    ]);

    const chartData = await chartRes.json();
    const quoteData = await quoteRes.json();

    if (!chartRes.ok || chartData.chart?.error) {
      return res.status(500).json({ error: 'Failed to fetch data', details: chartData.chart?.error });
    }

    const result = chartData.chart?.result?.[0];
    if (!result) return res.status(404).json({ error: 'No data found' });

    const timestamps = result.timestamp || [];
    const quote = result.indicators?.quote?.[0] || {};
    const meta = result.meta || {};

    const candles = timestamps.map((ts, i) => ({
      time: ts,
      open: quote.open?.[i],
      high: quote.high?.[i],
      low: quote.low?.[i],
      close: quote.close?.[i],
      volume: quote.volume?.[i],
    })).filter(c => c.close != null);

    // Stock info
    const qResult = quoteData.chart?.result?.[0];
    const qMeta = qResult?.meta || {};

    // Fallback: agar meta mein live price na mile, toh last candle ka close price use karo
    const lastCandleClose = candles.length ? candles[candles.length - 1].close : null;

    const stockInfo = {
      regularMarketPrice: qMeta.regularMarketPrice ?? meta.regularMarketPrice ?? lastCandleClose ?? null,
      previousClose: qMeta.chartPreviousClose ?? qMeta.previousClose ?? null,
      marketCap: qMeta.marketCap || null,
      regularMarketVolume: qMeta.regularMarketVolume || null,
      averageDailyVolume3Month: qMeta.averageDailyVolume3Month || null,
      trailingPE: qMeta.trailingPE || null,
      currency: qMeta.currency || 'INR',
      exchangeName: qMeta.exchangeName || null,
      longName: qMeta.longName || qMeta.shortName || null,
    };

    return res.status(200).json({ symbol, candles, stockInfo });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error', details: String(err) });
  }
}
