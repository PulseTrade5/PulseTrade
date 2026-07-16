import { useState } from 'react';
import { load } from '@cashfreepayments/cashfree-js';

const PLANS = [
  { id: 'plan_1m', label: '1 Month', months: 1, amount: 599, popular: false },
  { id: 'plan_2m', label: '2 Months', months: 2, amount: 1049, popular: true },
  { id: 'plan_3m', label: '3 Months', months: 3, amount: 1499, popular: false },
];

export default function SubscribeButton({ userEmail, userId }) {
  const [selectedPlan, setSelectedPlan] = useState(PLANS[1]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponStatus, setCouponStatus] = useState(null); // { valid, discountedAmount, message }
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  const checkCoupon = async () => {
    if (!couponCode.trim()) return;
    setCheckingCoupon(true);
    setCouponStatus(null);
    try {
      const res = await fetch('/api/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode.trim().toUpperCase(),
          plan: selectedPlan.id,
          amount: selectedPlan.amount,
          userId,
        }),
      });
      const data = await res.json();
      if (data.valid) {
        setCouponStatus({
          valid: true,
          discountedAmount: data.discountedAmount,
          message: `${data.discountPercent}% off applied! +${data.extraDays} din extra.`,
        });
      } else {
        setCouponStatus({ valid: false, message: data.message || 'Invalid coupon' });
      }
    } catch (err) {
      setCouponStatus({ valid: false, message: 'Coupon check nahi ho saka' });
    } finally {
      setCheckingCoupon(false);
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/cashfree-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planName: selectedPlan.label,
          planId: selectedPlan.id,
          amount: selectedPlan.amount,
          userEmail,
          userId,
          couponCode: couponStatus?.valid ? couponCode.trim().toUpperCase() : null,
        }),
      });

      const { payment_session_id, error: apiError } = await res.json();
      if (apiError) throw new Error(apiError);

      const cashfree = await load({ mode: 'production' });
      cashfree.checkout({
        paymentSessionId: payment_session_id,
        redirectTarget: '_self',
      });
    } catch (err) {
      console.error(err);
      setError('Payment shuru nahi ho saka. Dobara try karo.');
    } finally {
      setLoading(false);
    }
  };

  const displayAmount = couponStatus?.valid ? couponStatus.discountedAmount : selectedPlan.amount;

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>
      <h2 style={{ color: '#D8A33D', textAlign: 'center', marginBottom: 20, fontSize: 20 }}>
        Choose Your Plan
      </h2>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {PLANS.map((plan) => {
          const isSelected = selectedPlan.id === plan.id;
          return (
            <div
              key={plan.id}
              onClick={() => {
                setSelectedPlan(plan);
                setCouponStatus(null);
              }}
              style={{
                flex: 1,
                border: isSelected ? '2px solid #D8A33D' : '2px solid #30363D',
                borderRadius: 12,
                padding: '14px 10px',
                cursor: 'pointer',
                background: isSelected ? '#1C2128' : '#0D1117',
                textAlign: 'center',
                position: 'relative',
              }}
            >
              {plan.popular && (
                <div style={{
                  position: 'absolute', top: -10, left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#D8A33D', color: '#0D1117',
                  fontSize: 10, fontWeight: 700,
                  padding: '2px 8px', borderRadius: 20,
                  whiteSpace: 'nowrap',
                }}>
                  BEST VALUE
                </div>
              )}
              <div style={{ color: '#E6EDF3', fontWeight: 600, fontSize: 14 }}>{plan.label}</div>
              <div style={{ color: '#D8A33D', fontWeight: 700, fontSize: 22, margin: '6px 0' }}>
                ₹{plan.amount}
              </div>
              <div style={{ color: '#8B949E', fontSize: 11 }}>
                ₹{Math.round(plan.amount / plan.months)}/mo
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input
          type="text"
          placeholder="Coupon code (optional)"
          value={couponCode}
          onChange={(e) => { setCouponCode(e.target.value); setCouponStatus(null); }}
          style={{
            flex: 1,
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #30363D',
            background: '#0D1117',
            color: '#E6EDF3',
            fontSize: 14,
          }}
        />
        <button
          onClick={checkCoupon}
          disabled={checkingCoupon || !couponCode.trim()}
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            border: '1px solid #D8A33D',
            background: 'transparent',
            color: '#D8A33D',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          {checkingCoupon ? '...' : 'Apply'}
        </button>
      </div>
      {couponStatus && (
        <p style={{
          color: couponStatus.valid ? '#3FB950' : '#FF6B6B',
          fontSize: 12,
          marginBottom: 16,
        }}>
          {couponStatus.valid ? '✅' : '⚠️'} {couponStatus.message}
        </p>
      )}

      <button
        onClick={handlePayment}
        disabled={loading}
        style={{
          width: '100%',
          padding: '14px',
          background: loading ? '#555' : 'linear-gradient(135deg, #D8A33D, #F0C060)',
          color: '#0D1117',
          fontWeight: 700,
          fontSize: 16,
          border: 'none',
          borderRadius: 10,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Processing...' : `Subscribe — ₹${displayAmount}`}
      </button>
      {error && (
        <p style={{ color: '#FF6B6B', textAlign: 'center', marginTop: 12, fontSize: 13 }}>
          ⚠️ {error}
        </p>
      )}
      <p style={{ color: '#8B949E', textAlign: 'center', fontSize: 11, marginTop: 14 }}>
        Secure payment via Cashfree
      </p>
    </div>
  );
}
