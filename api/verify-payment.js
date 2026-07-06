import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  const { order_id } = req.query;
  if (!order_id) return res.status(400).json({ error: 'Order ID missing' });

  try {
    const response = await fetch(`https://api.cashfree.com/pg/orders/${order_id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': process.env.CASHFREE_APP_ID,
        'x-client-secret': process.env.CASHFREE_SECRET_KEY,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: data.message || 'Verification failed' });
    }

    if (data.order_status === 'PAID') {
      const planName = data.order_note || '';
      const expires_at = new Date();

      // NEW: check if this is a Trial Pack ("Trial Pack 5 Din" / "10 Din" / "15 Din")
      // — these are charged in DAYS, not months, and must NOT fall through to the
      // months-based logic below (which would wrongly grant a full month for ₹99-249).
      const trialMatch = planName.match(/Trial Pack\s+(\d+)\s*Din/i);

      if (trialMatch) {
        const days = parseInt(trialMatch[1], 10);
        expires_at.setDate(expires_at.getDate() + days);
      } else {
        // Existing subscription logic — unchanged, still amount-based for
        // the regular 1/2/3 month plans.
        const months = data.order_amount <= 599 ? 1 : data.order_amount <= 1049 ? 2 : 3;
        expires_at.setMonth(expires_at.getMonth() + months);
      }

      await supabase.from('subscriptions').upsert({
        order_id: data.order_id,
        user_email: data.customer_details?.customer_email,
        plan_name: data.order_note,
        amount: data.order_amount,
        status: 'active',
        expires_at: expires_at.toISOString(),
      }, { onConflict: 'order_id' });
    }

    return res.status(200).json({
      order_id: data.order_id,
      status: data.order_status,
      amount: data.order_amount,
      currency: data.order_currency,
      customer_email: data.customer_details?.customer_email,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
