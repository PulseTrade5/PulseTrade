import { useState } from 'react';
import { load } from '@cashfreepayments/cashfree-js';

const TRIAL_PACKS = [
  { id: 'trial_5d', label: '5 Din', days: 5, amount: 99, popular: false },
  { id: 'trial_10d', label: '10 Din', days: 10, amount: 179, popular: false },
  { id: 'trial_15d', label: '15 Din', days: 15, amount: 249, popular: true },
];

export default function TrialPackButton({ userEmail, userId }) {
  const [selectedPack, setSelectedPack] = useState(TRIAL_PACKS[2]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePayment = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/cashfree-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planName: `Trial Pack ${selectedPack.label}`,
          amount: selectedPack.amount,
          userEmail,
          userId,
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

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>
      <h2 style={{ color: '#D8A33D', textAlign: 'center', marginBottom: 6, fontSize: 20 }}>
        Choose Your Trial Pack
      </h2>
      <p style={{ color: '#8B949E', textAlign: 'center', marginBottom: 20, fontSize: 12.5 }}>
        Poora access, chhote se package mein — try karo aur khud dekho!
      </p>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {TRIAL_PACKS.map((pack) => {
          const isSelected = selectedPack.id === pack.id;
          return (
            <div
              key={pack.id}
              onClick={() => setSelectedPack(pack)}
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
              {pack.popular && (
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
              <div style={{ color: '#E6EDF3', fontWeight: 600, fontSize: 14 }}>{pack.label}</div>
              <div style={{ color: '#D8A33D', fontWeight: 700, fontSize: 22, margin: '6px 0' }}>
                ₹{pack.amount}
              </div>
            </div>
          );
        })}
      </div>
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
        {loading ? 'Processing...' : `Trial Lo — ₹${selectedPack.amount}`}
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
