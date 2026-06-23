import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import StockDashboard from './StockDashboard';

function App() {
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingSession(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    if (!email) return;
    setSending(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: 'https://www.pulsetrade.in' }
    });
    setSending(false);
    if (!error) setSent(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loadingSession) {
    return (
      <div style={{ backgroundColor: '#0D1117', color: '#E8E6E0', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        Loading...
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ backgroundColor: '#0D1117', color: '#E8E6E0', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: 360, width: '100%', padding: '0 20px', textAlign: 'center' }}>
          <div style={{ color: '#D8A33D', fontWeight: 700, fontSize: 14, marginBottom: 8 }}>🔱 हर हर महादेव 🔱</div>
          <h1 style={{ fontSize: 32, fontWeight: 700, margin: '0 0 8px' }}>Pulse<span style={{ color: '#D8A33D' }}>Trade</span></h1>
          <p style={{ fontSize: 13, color: '#8B92A0', marginBottom: 32 }}>Bazaar ka pulse dekho, faisla khud karo.</p>

          {!sent ? (
            <>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="tumhara@email.com"
                style={{ width: '100%', padding: '12px', fontSize: 14, backgroundColor: '#161B22', border: '1px solid #262C36', borderRadius: 10, color: '#E8E6E0', outline: 'none', boxSizing: 'border-box', marginBottom: 12 }}
              />
              <button onClick={handleLogin} disabled={sending}
                style={{ width: '100%', padding: '12px', fontSize: 14, fontWeight: 600, borderRadius: 10, border: 'none', backgroundColor: sending ? '#9C7A33' : '#D8A33D', color: '#1A1306', cursor: sending ? 'not-allowed' : 'pointer' }}>
                {sending ? '⏳ Bhej rahe hain...' : '🔑 Login Link Bhejo'}
              </button>
            </>
          ) : (
            <div style={{ backgroundColor: '#161B22', border: '1px solid #3FAE7C', borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>✅</div>
              <div style={{ fontSize: 14, color: '#3FAE7C', fontWeight: 600 }}>Link bhej diya!</div>
              <div style={{ fontSize: 12, color: '#8B92A0', marginTop: 8 }}>{email} pe login link gaya hai. Check karo.</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#0D1117', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '12px 20px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: '#8B92A0' }}>{session.user.email}</span>
        <button onClick={handleLogout} style={{ border: 'none', background: 'none', color: '#D8A33D', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Logout</button>
      </div>
      <StockDashboard user={session.user} />
    </div>
  );
}

export default App;
