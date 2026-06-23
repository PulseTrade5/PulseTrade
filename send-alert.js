export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, symbol, trend, entry, stopLoss, target1, target2, target3 } = req.body;

  if (!email || !symbol) return res.status(400).json({ error: 'Missing fields' });

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'PulseTrade <noreply@pulsetrade.in>',
        to: email,
        subject: `🔱 PulseTrade Alert — ${symbol} ${trend} Signal!`,
        html: `
          <div style="background:#0D1117;color:#E8E6E0;padding:32px;font-family:sans-serif;max-width:480px;margin:0 auto;border-radius:12px">
            <h2 style="color:#D8A33D">🔱 PulseTrade Alert</h2>
            <h3 style="color:${trend === 'Bullish' ? '#3FAE7C' : '#D1453B'}">${trend === 'Bullish' ? '📈' : '📉'} ${symbol} — ${trend} Setup!</h3>
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:8px;color:#8B92A0">Entry</td><td style="padding:8px;font-weight:600">₹${entry}</td></tr>
              <tr><td style="padding:8px;color:#8B92A0">Stop Loss</td><td style="padding:8px;font-weight:600;color:#D1453B">₹${stopLoss}</td></tr>
              <tr><td style="padding:8px;color:#8B92A0">Target 1 (3%)</td><td style="padding:8px;font-weight:600;color:#3FAE7C">₹${target1}</td></tr>
              <tr><td style="padding:8px;color:#8B92A0">Target 2 (6%)</td><td style="padding:8px;font-weight:600;color:#3FAE7C">₹${target2}</td></tr>
              <tr><td style="padding:8px;color:#8B92A0">Target 3 (10%)</td><td style="padding:8px;font-weight:600;color:#3FAE7C">₹${target3}</td></tr>
            </table>
            <a href="https://pulsetrade.in" style="display:block;margin-top:24px;padding:12px;background:#D8A33D;color:#0D1117;text-align:center;border-radius:8px;font-weight:700;text-decoration:none">Dashboard Pe Jao →</a>
            <p style="margin-top:16px;font-size:11px;color:#8B92A0">Yeh sirf technical trend hai — investment advice nahi. SEBI registered advisor se salah lein.</p>
          </div>
        `,
      }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(500).json({ error: data.message });
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
