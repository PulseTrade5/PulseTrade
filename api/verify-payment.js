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

      // Check if this is a Trial Pack ("Trial Pack 5 Din" / "10 Din" / "15 Din")
      // — these are charged in DAYS, not months.
      const trialMatch = planName.match(/Trial Pack\s+(\d+)\s*Din/i);

      if (trialMatch) {
        const days = parseInt(trialMatch[1], 10);
        expires_at.setDate(expires_at.getDate() + days);
      } else {
        // Regular subscription — amount-based, 1/2/3 month plans.
        const months = data.order_amount <= 599 ? 1 : data.order_amount <= 1049 ? 2 : 3;
        expires_at.setMonth(expires_at.getMonth() + months);
      }

      const customerEmail = data.customer_details?.customer_email;

      // Log the payment record (kept as-is)
      await supabase.from('subscriptions').upsert({
        order_id: data.order_id,
        user_email: customerEmail,
        plan_name: data.order_note,
        amount: data.order_amount,
        status: 'active',
        expires_at: expires_at.toISOString(),
      }, { onConflict: 'order_id' });

      // CRITICAL FIX: App.jsx's checkAccess() reads from the `profiles` table
      // (is_subscribed, subscription_end_date) — NOT from `subscriptions`.
      // Without this update, a paid user's access was never actually being
      // granted, no matter how many times they paid successfully.
      if (customerEmail) {
        await supabase
          .from('profiles')
          .update({
            is_subscribed: true,
            subscription_end_date: expires_at.toISOString(),
          })
          .eq('email', customerEmail);
      }
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
