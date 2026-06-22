import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Login from './Login';
import SubscribeButton from './SubscribeButton';
import StockDashboard from './StockDashboard';

function App() {
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

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

  if (loadingSession) {
    return <div style={{ textAlign: 'center', marginTop: 60, fontFamily: 'sans-serif' }}>Loading...</div>;
  }

  if (!session) {
    return <Login />;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'sans-serif' }}>
      <h1>PulseTrade 🐂</h1>
      <p>NSE/BSE Technical Analysis Platform</p>
      <p style={{ fontSize: 13, color: '#888' }}>
        {session.user.email} ·{' '}
        <button onClick={handleLogout} style={{ border: 'none', background: 'none', color: '#8B4513', cursor: 'pointer', textDecoration: 'underline', fontSize: 13 }}>
          Logout
        </button>
      </p>
      <StockDashboard />
      <div style={{ marginTop: 30 }}>
        <SubscribeButton userEmail={session.user.email} userName="" />
      </div>
    </div>
  );
}

export default App;
