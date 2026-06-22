import { useState } from 'react';
import { supabase } from './supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) {
      setError('Login link bhejne mein dikkat aayi. Dobara try karo.');
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div style={styles.wrapper}>
        <h2 style={styles.title}>📧 Email check karo</h2>
        <p style={styles.text}><b>{email}</b> pe login link bhej diya hai.</p>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <h2 style={styles.title}>PulseTrade 🐂</h2>
      <p style={styles.text}>Email daalo, hum login link bhejenge — password ki zaroorat nahi.</p>
      <form onSubmit={handleLogin} style={styles.form}>
        <input type="email" placeholder="tumhara@email.com" value={email}
          onChange={(e) => setEmail(e.target.value)} style={styles.input} required />
        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? 'Bhej rahe hain...' : 'Login Link Bhejo'}
        </button>
      </form>
      {error && <p style={styles.error}>{error}</p>}
    </div>
  );
}

const styles = {
  wrapper: { maxWidth: 360, margin: '60px auto', padding: '0 20px', textAlign: 'center', fontFamily: 'sans-serif' },
  title: { fontSize: 24, marginBottom: 8 },
  text: { fontSize: 14, color: '#666', marginBottom: 20 },
  form: { display: 'flex', flexDirection: 'column',
