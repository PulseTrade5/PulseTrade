import { useState } from 'react';
import { load } from '@cashfreepayments/cashfree-js';

export default function SubscribeButton({ userEmail, userId }) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cashfree-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planName: 'Monthly',
          amount: 299,
          userEmail,
          userId,
        }),
      });

      const { payment_session_id, error } = await res.json();
      if (error) throw new Error(error);

      const cashfree = await load({ mode: 'sandbox' });
      cashfree.checkout({
        paymentSessionId: payment_session_id,
        redirectTarget: '_self',
      });

    } catch (err) {
      console.error(err);
      alert('Payment shuru nahi ho saka. Dobara try karo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      style={{
        backgroundColor: '#D8A33D',
        color: '#0D1117',
        fontWeight: 'bold',
        padding: '12px 28px',
        borderRadius: '8px',
        border: 'none',
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.7 : 1,
        fontSize: '16px',
      }}
    >
      {loading ? 'Processing...' : 'Subscribe — ₹299/month'}
    </button>
  );
}
