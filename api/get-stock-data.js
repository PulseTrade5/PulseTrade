export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { securityId, days = 300 } = req.query;

  if (!securityId) {
    return res.status(400).json({ error: 'securityId is required (Dhan instrument security ID)' });
  }

  try {
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - Number(days));

    const formatDate = (d) => d.toISOString().split('T')[0];

    const response = await fetch('https://api.dhan.co/v2/charts/historical', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access-token': process.env.DHAN_ACCESS_TOKEN,
      },
      body: JSON.stringify({
        securityId: String(securityId),
        exchangeSegment: 'NSE_EQ',
        instrument: 'EQUITY',
        expiryCode: 0,
        oi: false,
        fromDate: formatDate(fromDate),
        toDate: formatDate(toDate),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: 'Failed to fetch data from Dhan', dhanResponse: data, status: response.status });
    }

    const candles = data.timestamp.map((ts, i) => ({
      time: ts,
      open: data.open[i],
      high: data.high[i],
      low: data.low[i],
      close: data.close[i],
      volume: data.volume[i],
    }));

    return res.status(200).json({ securityId, candles });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error', details: String(err) });
  }
}
