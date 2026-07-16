import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { planName, planId, amount, userEmail, userId, orderId, returnUrl, couponCode } = req.body;

  let finalAmount = amount;
  let appliedCoupon = null;

  // Re-validate coupon server-side (never trust client-sent discounted amount)
  if (couponCode) {
    try {
      const { data: coupon } = await supabase
        .from('coupon_codes')
        .select('*')
        .eq('code', couponCode)
        .eq('active', true)
        .single();

      const planIsTrial = planId === 'trial' || planId === 'plan_trial';

      if (coupon && !planIsTrial && coupon.applicable_plans.includes(planId)) {
        let alreadyUsed = false;
        if (userId) {
          const { data: existing } = await supabase
            .from('coupon_redemptions')
            .select('id')
            .eq('code', couponCode)
            .eq('user_id', userId)
            .maybeSingle();
          alreadyUsed = !!existing;
        }

        if (!alreadyUsed) {
          const discountAmount = Math.round(amount * (coupon.discount_percent / 100));
          finalAmount = amount - discountAmount;
          appliedCoupon = couponCode;
        }
      }
    } catch (err) {
      console.error('Coupon re-validation failed, proceeding without discount:', err);
    }
  }

  const payload = {
    order_amount: finalAmount,
    order_currency: "INR",
    order_id: orderId || `PT_${Date.now()}`,
    customer_details: {
      customer_id: userId || `guest_${Date.now()}`,
      customer_email: userEmail || "test@pulsetrade.in",
      customer_phone: "9999999999",
    },
    order_meta: {
      return_url: returnUrl || `https://pulsetrade.in/payment-status?order_id={order_id}`,
    },
    order_note: appliedCoupon
      ? `PulseTrade ${planName || 'Monthly'} Plan | coupon:${appliedCoupon}`
      : `PulseTrade ${planName || 'Monthly'} Plan`,
  };

  try {
    const response = await fetch("https://api.cashfree.com/pg/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-version": "2023-08-01",
        "x-client-id": process.env.CASHFREE_APP_ID,
        "x-client-secret": process.env.CASHFREE_SECRET_KEY,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log("Cashfree response:", JSON.stringify(data));

    if (!response.ok) {
      return res.status(500).json({ error: data.message || "Cashfree error", details: data });
    }

    // Record pending redemption so verify-payment.js can finalize it (extra days + mark used)
    if (appliedCoupon && userId) {
      await supabase.from('coupon_redemptions').insert({
        code: appliedCoupon,
        user_id: userId,
        plan: planId,
        original_amount: amount,
        discount_amount: amount - finalAmount,
        final_amount: finalAmount,
        order_id: data.order_id,
      });
    }

    return res.status(200).json({
      payment_session_id: data.payment_session_id,
      order_id: data.order_id,
    });
  } catch (err) {
    console.error("Cashfree error:", err);
    return res.status(500).json({ error: err.message });
  }
}

