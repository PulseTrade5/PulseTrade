export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const { imageData } = req.body;
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 400,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: imageData,
              }
            },
            {
              type: 'text',
              text: 'Tu expert Indian stock market technical analyst hai. Is chart ko dekh aur Hinglish mein 3-4 lines mein bata: 1) Trend kaisa hai? 2) Koi pattern dikh raha hai? 3) Entry/Exit ke liye kya kehna hai? Simple aur clear rakh.'
            }
          ]
        }]
      })
    });
    const data = await response.json();
    res.json({ analysis: data.content?.[0]?.text || 'Analysis nahi ho saki' });
  } catch (err) {
    res.status(500).json({ analysis: 'Server error — dobara try karo' });
  }
}
