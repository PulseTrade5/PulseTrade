export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { symbol, trend, rsi, macd, adx, score } = req.body;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `Tu ek expert Indian stock market analyst hai. ${symbol} stock ka analysis kar aur Hinglish mein 3-4 lines mein simple summary de. Data: Trend=${trend}, RSI=${rsi}, MACD=${macd}, ADX=${adx}, Score=${score}/100. Retail traders ke liye simple language mein explain kar.`
        }]
      })
    });

    const data = await response.json();
    const summary = data.content[0].text;
    res.status(200).json({ summary });
  } catch (error) {
    res.status(500).json({ error: 'AI summary failed' });
  }
}
