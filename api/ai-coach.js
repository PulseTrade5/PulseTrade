export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const { question, context } = req.body;
  
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
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `Tu expert Indian stock trader hai. Hinglish mein 2-3 lines mein jawab de.\n\nStock: ${context}\n\nSawaal: ${question}`
        }]
      })
    });
    const data = await response.json();
    res.json({ answer: data.content?.[0]?.text || 'Error' });
  } catch (err) {
    res.status(500).json({ answer: 'Server error' });
  }
}
