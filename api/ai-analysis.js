export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { symbol } = req.body;
    if (!symbol) return res.status(400).json({ error: 'Symbol required' });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `Stock: "${symbol}" listed on Indian stock market (NSE/BSE). Search web for current price, recent price action, trend direction, RSI, moving averages, support/resistance. Also check for upcoming corporate events in next 10 days and recent news (last 2-3 days). Also check NIFTY 50 short-term trend. Respond ONLY with raw JSON: {"symbol": string, "currentPrice": number, "trendDirection": "Bullish"|"Bearish"|"Neutral", "confidence": "Low"|"Medium"|"High", "dailyTrend": "Bullish"|"Bearish"|"Sideways", "weeklyTrend": "Bullish"|"Bearish"|"Sideways", "holdDuration": string, "stopLossPercent": number, "rsi": number, "volume": "Low"|"Normal"|"High", "vs20MA": "Above"|"Below", "vs50MA": "Above"|"Below", "candlestickPattern": string, "resistance1": number, "resistance2": number, "support1": number, "support2": number, "week52High": number, "week52Low": number, "upcomingEvent": string|null, "recentNews": string|null, "niftyTrend": "Bullish"|"Bearish"|"Sideways", "summary": string}. Summary must be 3-4 sentences in simple Hinglish about technical trend only, not financial advice.`
        }],
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      }),
    });

    const data = await response.json();
    const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n');
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return res.status(500).json({ error: 'Parse failed' });
    
    const parsed = JSON.parse(match[0]);
    return res.status(200).json(parsed);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
