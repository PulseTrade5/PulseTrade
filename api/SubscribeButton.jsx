import { useState } from 'react';

export default function SubscribeButton({ userEmail, userName }) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const orderRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 1999 }),
      });
      const order = await orderRes.json();

      if (!orderRes.ok) {
        alert('Something went wrong, please try again.');
        setLoading(false);
        return;
      }

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'PulseTrade',
        description: 'Monthly Subscription',
        order_id: order.orderId,
        handler: async function (response) {
          const verifyRes = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          const result = await verifyRes.json();

          if (result.success) {
            alert('Payment successful! Welcome to PulseTrade Pro.');
          } else {
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: userName || '',
          email: userEmail || '',
        },
        theme: {
          color: '#8B4513',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      alert('Something went wrong, please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handlePayment} disabled={loading}>
      {loading ? 'Processing...' : 'Subscribe - ₹1,999/month'}
    </button>
  );
}
