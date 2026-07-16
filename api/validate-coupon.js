import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { code, plan, amount, userId } = req.body;

  if (!code || !plan || !amount) {
    return res.status(400).json({ valid: false, message: 'Missing fields' });
  }

  // Trial pack never gets a coupon
  if (plan === 'trial' || plan === 'plan_trial') {
    return res.status(200).json({ valid: false, message: 'Coupon Trial Pack par valid nahi hai' });
  }

  try {
    const { data: coupon, error: couponErr } = await supabase
      .from('coupon_codes')
      .select('*')
      .eq('code', code)
      .eq('active', true)
      .single();

    if (couponErr || !coupon) {
      return res.status(200).json({ valid: false, message: 'Invalid coupon code' });
    }

    if (!coupon.applicable_plans.includes(plan)) {
      return res.status(200).json({ valid: false, message: 'Ye coupon is plan par valid nahi hai' });
    }

    // Check usage cap
    const { count: usedCount } = await supabase
      .from('coupon_redemptions')
      .select('id', { count: 'exact', head: true })
      .eq('code', code);

    if (coupon.max_uses && usedCount >= coupon.max_uses) {
      return res.status(200).json({ valid: false, message: 'Coupon limit khatam ho gayi hai' });
    }

    if (userId) {
      const { data: existing } = await supabase
        .from('coupon_redemptions')
        .select('id')
        .eq('code', code)
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        return res.status(200).json({ valid: false, message: 'Ye coupon aap pehle use kar chuke hain' });
      }
    }

    const discountAmount = Math.round(amount * (coupon.discount_percent / 100));
    const discountedAmount = amount - discountAmount;

    return res.status(200).json({
      valid: true,
      discountPercent: coupon.discount_percent,
      extraDays: coupon.extra_days,
      discountAmount,
      discountedAmount,
    });
  } catch (err) {
    console.error('Coupon validation error:', err);
    return res.status(500).json({ valid: false, message: 'Coupon check nahi ho saka' });
  }
}
