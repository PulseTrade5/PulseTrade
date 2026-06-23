import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dots, setDots] = useState('');

  // Animated dots jab loading ho
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.');
    }, 400);
    return () => clearInterval(interval);
  }, [loading]);

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
      setError('Error: ' + (error?.message || error?.error_description || JSON.stringify(error) || 'Unknown error'));
    } else {
      setSent(true);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#0D1117',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'sans-serif',
      padding: '20px',
    },
    card: {
      width: '100%',
      maxWidth: 380,
      textAlign: 'center',
    },
    brand: {
      color: '#D8A33D',
      fontSize: 14,
      letterSpacing: 2,
      marginBottom: 8,
    },
    title: {
      color: '#ffffff',
      fontSize: 36,
      fontWeight: 'bold',
      margin: '0 0 8px 0',
    },
    titleGold: {
      color: '#D8A33D',
    },
    subtitle: {
      color: '#8B949E',
      fontSize: 14,
      marginBottom: 32,
    },
    input: {
      width: '100%',
      padding: '14px 16px',
      fontSize: 15,
      backgroundColor: '#161B22',
      border: '1px solid #30363D',
      borderRadius: 10,
      color: '#ffffff',
      outline: 'none',
      boxSizing: 'border-box',
      marginBottom: 12,
    },
    button: {
      width: '100%',
      padding: '14px',
      fontSize: 16,
      fontWeight: 'bold',
      backgroundColor: '#D8A33D',
      color: '#0D1117',
      border: 'none',
      borderRadius: 10,
      cursor: 'pointer',
      transition: 'opacity 0.2s',
    },
    buttonDisabled: {
      opacity: 0.7,
      cursor: 'not-allowed',
    },
    loadingBox: {
      backgroundColor: '#161B22',
      border: '1px solid #D8A33D',
      borderRadius: 12,
      padding: '28px 20px',
      marginTop: 16,
    },
    spinner: {
      width: 40,
      height: 40,
      border: '3px solid #30363D',
      borderTop: '3px solid #D8A33D',
      borderRadius: '50%',
      margin: '0 auto 16px',
      animation: 'spin 0.8s linear infinite',
    },
    loadingText: {
      color: '#D8A33D',
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 6,
    },
    loadingSubtext: {
      color: '#8B949E',
      fontSize: 13,
    },
    successBox: {
      backgroundColor: '#161B22',
      border: '1px solid #238636',
      borderRadius: 12,
      padding: '32px 20px',
    },
    successIcon: {
      fontSize: 48,
      marginBottom: 12,
    },
    successTitle: {
      color: '#3FB950',
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    successText: {
      color: '#8B949E',
      fontSize: 14,
      lineHeight: 1.5,
    },
    successEmail: {
      color: '#D8A33D',
      fontWeight: 'bold',
    },
    error: {
      color: '#F85149',
      fontSize: 13,
      marginTop: 10,
      padding: '10px',
      backgroundColor: '#1C1010',
      borderRadius: 8,
      border: '1px solid #3D1C1C',
    },
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in { animation: fadeIn 0.4s ease; }
      `}</style>

      <div style={styles.card}>
        <div style={styles.brand}>🔱 हर हर महादेव 🔱</div>
        <h1 style={styles.title}>
          Pulse<span style={styles.titleGold}>Trade</span>
        </h1>
        <p style={styles.subtitle}>Bazaar ka pulse dekho, faisla khud karo.</p>

        {/* SUCCESS STATE */}
        {sent && (
          <div style={styles.successBox} className="fade-in">
            <div style={styles.successIcon}>✅</div>
            <div style={styles.successTitle}>Link bhej diya!</div>
            <p style={styles.successText}>
              <span style={styles.successEmail}>{email}</span> pe login link gaya hai. Check karo.
            </p>
          </div>
        )}

        {/* LOADING STATE */}
        {loading && !sent && (
          <div style={styles.loadingBox} className="fade-in">
            <div style={styles.spinner}></div>
            <div style={styles.loadingText}>📡 Bhej raha hoon{dots}</div>
            <div style={styles.loadingSubtext}>Thoda ruko, link aa raha hai</div>
          </div>
        )}

        {/* FORM STATE */}
        {!sent && !loading && (
          <div className="fade-in">
            <input
              type="email"
              placeholder="tumhara@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin(e)}
            />
            <button
              onClick={handleLogin}
              disabled={loading}
              style={{ ...styles.button, ...(loading ? styles.buttonDisabled : {}) }}
            >
              🔑 Login Link Bhejo
            </button>
            {error && <div style={styles.error}>{error}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
