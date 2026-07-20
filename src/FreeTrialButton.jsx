import { useState } from 'react';
import { supabase } from './supabaseClient';

const TRIAL_DAYS = 5; // yahan se din change kar sakte ho

export default function FreeTrialButton({ userId, onActivated }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const claimTrial = async () => {
    if (!userId) return;
    setLoading(true);
    setError('');
    try {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + TRIAL_DAYS);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          is_subscribed: true,
          subscription_end_date: endDate.toISOString(),
          trial_start_date: new Date().toISOString(),
          free_trial_claimed: true,
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      setDone(true);
      if (onActivated) onActivated();
    } catch (err) {
      setError('Kuch gadbad hui, dobara try karo');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div style={{ textAlign: 'center', padding: '12px', color: '#3FAE7C', fontWeight: 700 }}>
        ✅ Free Trial Activate Ho Gaya!
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={claimTrial}
        disabled={loading}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: 12,
          border: 'none',
          backgroundColor: '#3FAE7C',
          color: '#FFF',
          fontWeight: 700,
          fontSize: 14,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? 'Activate ho raha hai...' : `🎁 ${TRIAL_DAYS} Din Free Trial Lo`}
      </button>
      {error && (
        <div style={{ color: '#DC2626', fontSize: 12, marginTop: 8, textAlign: 'center' }}>
          {error}
        </div>
      )}
    </div>
  );
}
