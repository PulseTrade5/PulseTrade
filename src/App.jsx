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
    return <div style={{ backgroundColor: '#0D1117', color: '#E8E6E0', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>Loading...</div>;
  }

  if (!session) {
    return <Login />;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div style={{ backgroundColor: '#0D1117', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 20px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: '#8B92A0' }}>{session.user.email}</span>
        <button onClick={handleLogout} style={{ border: 'none', background: 'none', color: '#D8A33D', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Logout</button>
      </div>
      <StockDashboard />
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 20px 32px', textAlign: 'center' }}>
        <SubscribeButton userEmail={session.user.email} userName="" />
      </div>
    </div>
  );
}

export default App;
