import { createClient } from '@supabase/supabase-js';

// Uses Supabase service role key so it can read all user rows (not just the logged-in user's)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Allow Vercel Cron (GET) and manual testing (GET/POST both work)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Optional security: protect this route so randoms can't trigger it
  const authHeader = req.headers['authorization'];
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);

    const todayStr = now.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // ⚠️ ADJUST table/column names below to match your actual Supabase schema
    const { data: users, error } = await supabase
      .from('profiles')
      .select('email, trial_end, is_subscribed')
      .eq('is_subscribed', false)
      .in('trial_end', [todayStr, tomorrowStr]);

    if (error) throw error;

    if (!users || users.length === 0) {
      return res.status(200).json({ success: true, message: 'No trial reminders to send today', count: 0 });
    }

    const results = [];

    for (const user of users) {
      const isLastDay = user.trial_end === todayStr;
      const subject = isLastDay
        ? `⏰ Aaj Aakhri Din Hai — PulseTrade Trial Khatam Ho Raha Hai!`
        : `🔱 Kal Trial Khatam — Abhi Renew Karo, Miss Na Karo`;

      const html = `
        <div style="background:#0D1117;color:#E8E6E0;padding:32px;font-family:sans-serif;max-width:480px;margin:0 auto;border-radius:12px">
          <h2 style="color:#D8A33D">🔱 PulseTrade</h2>
          <h3 style="color:#E8E6E0">${isLastDay ? '⏰ Aaj Aakhri Din Hai!' : '⚠️ Kal Trial Khatam Ho Jayega'}</h3>
          <p style="color:#8B92A0;line-height:1.6">
            Namaste! Aapka 5-din ka free trial ${isLastDay ? 'aaj' : 'kal'} khatam ho raha hai.
            Numerology + Technical signals, PulseScreener, AI Trade Coach — sab kuch continue rakhne ke liye
            abhi renew kar lo, sirf ₹599/month mein.
          </p>
          <a href="https://pulsetrade.in/pricing" style="display:block;margin-top:24px;padding:14px;background:#D8A33D;color:#0D1117;text-align:center;border-radius:8px;font-weight:700;text-decoration:none">
            Abhi Renew Karo →
          </a>
          <p style="margin-top:16px;font-size:11px;color:#8B92A0">
            Yeh sirf technical/numerology trend hai — investment advice nahi. SEBI registered advisor se salah lein.
          </p>
        </div>
      `;

      try {
        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'PulseTrade <noreply@pulsetrade.in>',
            to: user.email,
            subject,
            html,
          }),
        });

        const emailData = await emailRes.json();
        results.push({ email: user.email, sent: emailRes.ok, error: emailRes.ok ? null : emailData.message });
      } catch (err) {
        results.push({ email: user.email, sent: false, error: err.message });
      }
    }

    const sentCount = results.filter(r => r.sent).length;
    return res.status(200).json({ success: true, totalUsers: users.length, sentCount, results });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
