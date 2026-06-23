export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { symbol, trend, rsi, macd, adx, supertrend, longScore, shortScore, entry, stopLoss, targets } = req.body;

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
          content: `Tu ek expert Indian stock market analyst hai jo Hinglish mein bolta hai - bilkul jaise traders baat karte hain. 2-3 sentences mein ${symbol} ka analysis do.

Data:
- Trend: ${trend}
- RSI: ${rsi}
- MACD: ${macd}
- ADX: ${adx} 
- Supertrend: ${supertrend}
- Long Score: ${longScore}/100
- Short Score: ${shortScore}/100
- Entry: ${entry}
- Stop Loss: ${stopLoss}
- Targets: ${targets?.join(', ')}

Casual Hinglish mein bolo jaise ek trader dost ko samjha raha ho. Short rakho, max 3 sentences. Numbers include karo.`
        }]
      }),
    });

    const data = await response.json();
    const summary = data.content[0].text;
    res.status(200).json({ summary });
  } catch (error) {
    res.status(500).json({ error: 'AI summary failed' });
  }
}
