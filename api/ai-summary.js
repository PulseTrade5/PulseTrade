export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { stockData } = req.body;
  if (!stockData) return res.status(400).json({ error: "stockData required" });

  const { symbol, companyName, currentPrice, change, changePercent, rsi, macd, macdSignal, ema20, ema50, adx, supertrend, trend, volume, avgVolume } = stockData;

  const volumeComment = volume && avgVolume ? volume > avgVolume * 1.3 ? "Volume average se kaafi zyada hai." : volume < avgVolume * 0.7 ? "Volume thoda kam hai." : "Volume normal range mein hai." : "";

  const prompt = `Tu ek expert Indian stock market analyst hai jo Hinglish mein baat karta hai.

Stock Data:
- Stock: ${companyName || symbol}
- Price: ₹${currentPrice}, Change: ${change > 0 ? "+" : ""}${change} (${changePercent}%)
- Trend: ${trend}
- RSI: ${rsi} ${rsi > 70 ? "(overbought)" : rsi < 30 ? "(oversold)" : "(neutral)"}
- MACD: ${macd} | Signal: ${macdSignal} ${macd > macdSignal ? "bullish" : "bearish"}
- EMA20: ₹${ema20} | EMA50: ₹${ema50}
- ADX: ${adx} ${adx > 25 ? "(strong trend)" : "(weak trend)"}
- Supertrend: ${supertrend}
- ${volumeComment}

4-5 sentence mein simple Hinglish summary de. BUY/SELL mat bol. End mein likho: "Yeh sirf technical analysis hai, investment advice nahi."`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await response.json();
    const summary = data.content?.[0]?.text || JSON.stringify(data);
    return res.status(200).json({ summary });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
