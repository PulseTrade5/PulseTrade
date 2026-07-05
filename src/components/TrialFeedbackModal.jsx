import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const REASONS = [
  'Price zyada lagi (₹599)',
  'Trust nahi hua results pe',
  'Renew karna bhool gaya',
  'Value clear nahi thi',
  'Payment mein problem aayi',
  'Kuch aur',
];

export default function TrialFeedbackModal({ user }) {
  const [profile, setProfile] = useState(null);
  const [selectedReason, setSelectedReason] = useState(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    supabase
      .from('profiles')
      .select('id, email, trial_start_date, is_subscribed, feedback_given')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) return;
        setProfile(data);

        if (!data.is_subscribed && !data.feedback_given && data.trial_start_date) {
          const trialEnd = new Date(data.trial_start_date);
          trialEnd.setDate(trialEnd.getDate() + 5);
          if (new Date() > trialEnd) {
            setVisible(true);
          }
        }
      });
  }, [user]);

  if (!visible || !profile) return null;

  const handleSubmit = async () => {
    if (!selectedReason) return;
    setSubmitting(true);

    try {
      await supabase.from('trial_feedback').insert({
        user_id: profile.id,
        email: profile.email,
        reason: selectedReason,
        message: message || null,
      });

      await supabase
        .from('profiles')
        .update({ feedback_given: true })
        .eq('id', profile.id);

      setSubmitted(true);
      setTimeout(() => setVisible(false), 1800);
    } catch (err) {
      console.error('Feedback submit error:', err);
      setSubmitting(false);
    }
  };

  const handleSkip = async () => {
    await supabase.from('profiles').update({ feedback_given: true }).eq('id', profile.id);
    setVisible(false);
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        {submitted ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 32 }}>🔱</div>
            <p style={{ color: '#E8E6E0', marginTop: 12 }}>Dhanyavaad! Aapka feedback mil gaya.</p>
          </div>
        ) : (
          <>
            <h3 style={styles.title}>🔱 Ek Chhota Sawaal</h3>
            <p style={styles.subtitle}>
              Aapne trial use kiya, thanks! Bas ye bata do — renew kyun nahi kiya?
            </p>

            <div style={styles.reasonList}>
              {REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => setSelectedReason(reason)}
                  style={{
                    ...styles.reasonBtn,
                    ...(selectedReason === reason ? styles.reasonBtnActive : {}),
                  }}
                >
                  {reason}
                </button>
              ))}
            </div>

            <textarea
              placeholder="Kuch aur bhi batana ho to yahan likho (optional)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={styles.textarea}
              rows={3}
            />

            <div style={styles.buttonRow}>
              <button onClick={handleSkip} style={styles.skipBtn}>
                Skip
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedReason || submitting}
                style={{
                  ...styles.submitBtn,
                  opacity: !selectedReason || submitting ? 0.5 : 1,
                }}
              >
                {submitting ? 'Bhej rahe hain...' : 'Bhejo'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 16,
  },
  card: {
    background: '#0D1117',
    borderRadius: 16,
    padding: 24,
    maxWidth: 420,
    width: '100%',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  },
  title: {
    color: '#D8A33D',
    fontSize: 18,
    marginBottom: 8,
  },
  subtitle: {
    color: '#8B92A0',
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 1.5,
  },
  reasonList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginBottom: 12,
  },
  reasonBtn: {
    textAlign: 'left',
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid #2A2F3A',
    background: '#161B22',
    color: '#E8E6E0',
    fontSize: 14,
    cursor: 'pointer',
  },
  reasonBtnActive: {
    border: '1px solid #D8A33D',
    background: '#2A2210',
  },
  textarea: {
    width: '100%',
    background: '#161B22',
    border: '1px solid #2A2F3A',
    borderRadius: 8,
    color: '#E8E6E0',
    padding: 10,
    fontSize: 13,
    marginBottom: 16,
    resize: 'none',
  },
  buttonRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
  },
  skipBtn: {
    flex: 1,
    padding: '10px 0',
    borderRadius: 8,
    border: '1px solid #2A2F3A',
    background: 'transparent',
    color: '#8B92A0',
    fontSize: 14,
    cursor: 'pointer',
  },
  submitBtn: {
    flex: 1,
    padding: '10px 0',
    borderRadius: 8,
    border: 'none',
    background: '#D8A33D',
    color: '#0D1117',
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
  },
};

