import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import StockDashboard from './StockDashboard';
import LoginPage from './LoginPage';
import AdminPanel from './AdminPanel';

const LIGHT = {
  bg: '#F4F6FA', surface: '#FFFFFF', gold: '#C8920A',
  goldLight: '#FEF3C7', goldDim: '#D97706',
  text: '#0F172A', muted: '#64748B', green: '#059669',
  greenLight: '#ECFDF5', red: '#DC2626', border: '#E2E8F0',
};

const DARK = {
  bg: '#0D1117', surface: '#161B22', gold: '#D8A33D',
  text: '#E8E6E0', muted: '#8B92A0', green: '#3FAE7C',
  red: '#D1453B', border: '#30363D',
};

function TermsPage() {
  return (
    <div style={{ backgroundColor: DARK.bg, color: DARK.text, minHeight: '100vh', padding: '40px 20px', maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ color: DARK.gold, marginBottom: 24 }}>Terms & Conditions</h1>
      <p style={{ marginBottom: 16, lineHeight: 1.7 }}>Last updated: June 2026</p>
      <h2 style={{ color: DARK.gold, marginBottom: 12 }}>1. Acceptance</h2>
      <p style={{ marginBottom: 16, lineHeight: 1.7 }}>By using PulseTrade (pulsetrade.in), you agree to these terms.</p>
      <h2 style={{ color: DARK.gold, marginBottom: 12 }}>2. Service Description</h2>
      <p style={{ marginBottom: 16, lineHeight: 1.7 }}>PulseTrade provides technical analysis tools for NSE/BSE listed securities. All information is for educational purposes only.</p>
      <h2 style={{ color: DARK.gold, marginBottom: 12 }}>3. Disclaimer</h2>
      <p style={{ marginBottom: 16, lineHeight: 1.7 }}>PulseTrade is NOT a SEBI registered investment advisor. Users must consult a SEBI registered advisor before making any investment decisions.</p>
      <h2 style={{ color: DARK.gold, marginBottom: 12 }}>4. Subscription</h2>
      <p style={{ marginBottom: 16, lineHeight: 1.7 }}>Subscriptions are billed in advance. Plans available for 1, 2, and 3 months via Cashfree Payments.</p>
      <h2 style={{ color: DARK.gold, marginBottom: 12 }}>5. Limitation of Liability</h2>
      <p style={{ marginBottom: 16, lineHeight: 1.7 }}>PulseTrade shall not be liable for any financial losses. Trading involves substantial risk of loss.</p>
      <a href="/" style={{ color: DARK.gold }}>← Back to Home</a>
    </div>
  );
}

function RefundPage() {
  return (
    <div style={{ backgroundColor: DARK.bg, color: DARK.text, minHeight: '100vh', padding: '40px 20px', maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ color: DARK.gold, marginBottom: 24 }}>Refunds & Cancellations</h1>
      <p style={{ marginBottom: 16, lineHeight: 1.7 }}>Last updated: June 2026</p>
      <h2 style={{ color: DARK.gold, marginBottom: 12 }}>General Policy</h2>
      <p style={{ marginBottom: 16, lineHeight: 1.7 }}>PulseTrade is a digital subscription service. <strong>No refunds</strong> once subscription is activated.</p>
      <h2 style={{ color: DARK.gold, marginBottom: 12 }}>Exception — Technical Failure</h2>
      <p style={{ marginBottom: 16, lineHeight: 1.7 }}>Refund only if payment deducted but subscription not activated. Contact within <strong>48 hours</strong> with Order ID.</p>
      <h2 style={{ color: DARK.gold, marginBottom: 12 }}>How to Contact</h2>
      <p style={{ marginBottom: 16, lineHeight: 1.7 }}>Email: <span style={{ color: DARK.gold }}>support@pulsetrade.in</span></p>
      <h2 style={{ color: DARK.gold, marginBottom: 12 }}>Cancellations</h2>
      <p style={{ marginBottom: 16, lineHeight: 1.7 }}>Subscription remains active till end of paid period. No partial refunds.</p>
      <a href="/" style={{ color: DARK.gold }}>← Back to Home</a>
    </div>
  );
}

function ContactPage() {
  return (
    <div style={{ backgroundColor: DARK.bg, color: DARK.text, minHeight: '100vh', padding: '40px 20px', maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ color: DARK.gold, marginBottom: 24 }}>Contact Us</h1>
      <div style={{ backgroundColor: DARK.surface, borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <p style={{ marginBottom: 12 }}>📧 <strong>Email:</strong> <span style={{ color: DARK.gold }}>support@pulsetrade.in</span></p>
        <p style={{ marginBottom: 12 }}>🌐 <strong>Website:</strong> <span style={{ color: DARK.gold }}>pulsetrade.in</span></p>
        <p style={{ marginBottom: 12 }}>📍 <strong>Location:</strong> India</p>
        <p style={{ marginBottom: 0 }}>⏰ <strong>Support Hours:</strong> Mon–Sat, 10 AM – 6 PM IST</p>
      </div>
      <a href="/" style={{ color: DARK.gold }}>← Back to Home</a>
    </div>
  );
}

function PaymentStatusPage() {
  const [status, setStatus] = useState('loading');
  const [data, setData] = useState(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const order_id = params.get('order_id');
    if (!order_id) { setStatus('error'); return; }
    fetch(`/api/verify-payment?order_id=${order_id}`)
      .then(r => r.json())
      .then(d => { setData(d); setStatus(d.status === 'PAID' ? 'success' : 'failed'); })
      .catch(() => setStatus('error'));
  }, []);
  return (
    <div style={{ backgroundColor: DARK.bg, color: DARK.text, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
        <div style={{ color: DARK.gold, fontWeight: 700, fontSize: 14, marginBottom: 16 }}>🔱 हर हर महादेव 🔱</div>
        {status === 'loading' && <div style={{ backgroundColor: DARK.surface, borderRadius: 16, padding: 32 }}><div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div><p style={{ color: DARK.muted }}>Payment verify ho raha hai...</p></div>}
        {status === 'success' && (
          <div style={{ backgroundColor: DARK.surface, border: `2px solid ${DARK.green}`, borderRadius: 16, padding: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h2 style={{ color: DARK.green, marginBottom: 8 }}>Payment Successful!</h2>
            <p style={{ color: DARK.muted, marginBottom: 16 }}>Tumhari subscription activate ho gayi hai.</p>
            {data && (
              <div style={{ backgroundColor: DARK.bg, borderRadius: 12, padding: 16, marginBottom: 20, textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}><span style={{ color: DARK.muted }}>Order ID</span><span style={{ fontWeight: 600, fontSize: 11 }}>{data.order_id}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}><span style={{ color: DARK.muted }}>Amount</span><span style={{ fontWeight: 600, color: DARK.gold }}>₹{data.amount}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}><span style={{ color: DARK.muted }}>Email</span><span style={{ fontWeight: 600, fontSize: 11 }}>{data.customer_email}</span></div>
              </div>
            )}
            <a href="/" style={{ display: 'block', padding: '12px', backgroundColor: DARK.gold, color: DARK.bg, borderRadius: 10, fontWeight: 700, textDecoration: 'none' }}>Dashboard Pe Jao →</a>
          </div>
        )}
        {status === 'failed' && <div style={{ backgroundColor: DARK.surface, border: `2px solid ${DARK.red}`, borderRadius: 16, padding: 32 }}><div style={{ fontSize: 48, marginBottom: 16 }}>❌</div><h2 style={{ color: DARK.red, marginBottom: 8 }}>Payment Failed</h2><a href="/" style={{ display: 'block', padding: '12px', backgroundColor: DARK.gold, color: DARK.bg, borderRadius: 10, fontWeight: 700, textDecoration: 'none' }}>Wapas Jao</a></div>}
        {status === 'error' && <div style={{ backgroundColor: DARK.surface, borderRadius: 16, padding: 32 }}><div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div><h2 style={{ marginBottom: 8 }}>Kuch Gadbad Hui</h2><a href="/" style={{ display: 'block', padding: '12px', backgroundColor: DARK.gold, color: DARK.bg, borderRadius: 10, fontWeight: 700, textDecoration: 'none' }}>Wapas Jao</a></div>}
      </div>
    </div>
  );
}

function TrialExpiredPage({ user, onLogout }) {
  return (
    <div style={{ backgroundColor: LIGHT.bg, minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif', color: LIGHT.text }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 0 48px' }}>
        <div style={{ backgroundColor: LIGHT.surface, borderBottom: `1px solid ${LIGHT.border}`, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>Pulse<span style={{ color: LIGHT.gold }}>Trade</span></div>
            <div style={{ fontSize: 10, color: LIGHT.muted }}>🔱 हर हर महादेव 🔱</div>
          </div>
          <button onClick={onLogout} style={{ fontSize: 12, padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${LIGHT.border}`, backgroundColor: 'transparent', color: LIGHT.muted, cursor: 'pointer', fontWeight: 600 }}>🚪 Logout</button>
        </div>
        <div style={{ padding: '32px 20px' }}>
          <div style={{ backgroundColor: LIGHT.surface, border: `2px solid ${LIGHT.gold}`, borderRadius: 20, padding: '32px 24px', textAlign: 'center', marginBottom: 20, boxShadow: '0 4px 24px rgba(200,146,10,0.15)' }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>⏰</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: LIGHT.text, marginBottom: 8 }}>Trial Expire Ho Gaya!</h2>
            <p style={{ fontSize: 13, color: LIGHT.muted, lineHeight: 1.7, marginBottom: 20 }}>Tera 5-din free trial khatam ho gaya.<br />Dashboard access ke liye subscribe karo.</p>
            <div style={{ fontSize: 12, color: LIGHT.muted, backgroundColor: LIGHT.bg, borderRadius: 10, padding: '8px 14px', marginBottom: 20 }}>📧 {user?.email}</div>
          </div>
          <div style={{ backgroundColor: LIGHT.surface, border: `1px solid ${LIGHT.border}`, borderRadius: 16, padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: LIGHT.muted, fontWeight: 700, marginBottom: 16 }}>💰 PLANS CHOOSE KARO</div>
            {[
              { label: '1 Month', price: '₹599', popular: false },
              { label: '2 Months', price: '₹1,049', tag: '🔥 Popular', popular: true },
              { label: '3 Months', price: '₹1,499', tag: '💰 Best Value', popular: false },
            ].map((plan) => (
              <div key={plan.label} style={{ border: `1.5px solid ${plan.popular ? LIGHT.gold : LIGHT.border}`, borderRadius: 12, padding: '14px 16px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: plan.popular ? LIGHT.goldLight : LIGHT.bg }}>
                <div>
                  <span style={{ fontWeight: 700, color: LIGHT.text, fontSize: 14 }}>{plan.label}</span>
                  {plan.tag && <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, color: LIGHT.goldDim }}>{plan.tag}</span>}
                </div>
                <span style={{ color: LIGHT.gold, fontWeight: 800, fontSize: 16 }}>{plan.price}</span>
              </div>
            ))}
            <a href="/#subscribe" style={{ display: 'block', width: '100%', marginTop: 16, padding: '14px', fontSize: 15, fontWeight: 700, borderRadius: 12, border: 'none', backgroundColor: LIGHT.gold, color: '#FFF', cursor: 'pointer', textAlign: 'center', textDecoration: 'none', boxShadow: '0 2px 14px rgba(200,146,10,0.35)' }}>
              🚀 Abhi Subscribe Karo
            </a>
          </div>
          <p style={{ textAlign: 'center', fontSize: 12, color: LIGHT.muted }}>Support: support@pulsetrade.in</p>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session?.user ? session : null);
      setLoadingSession(false);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session?.user ? session : null);
      setLoadingSession(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) { setProfile(null); return; }
    setLoadingProfile(true);
    supabase.from('profiles').select('*').eq('id', session.user.id).single()
      .then(({ data, error }) => {
        if (error || !data) {
          supabase.from('profiles').insert({
            id: session.user.id,
            email: session.user.email,
            trial_start_date: new Date().toISOString(),
          }).then(() => {
            setProfile({ trial_start_date: new Date().toISOString(), is_subscribed: false, subscription_end_date: null });
          });
        } else {
          setProfile(data);
        }
        setLoadingProfile(false);
      });
  }, [session]);

  const handleLogout = async () => { await supabase.auth.signOut(); };

  const checkAccess = () => {
    if (!profile) return 'loading';
    if (profile.is_subscribed) {
      if (profile.subscription_end_date && new Date(profile.subscription_end_date) < new Date()) return 'expired';
      return 'active';
    }
    const trialStart = new Date(profile.trial_start_date);
    const diffDays = (new Date() - trialStart) / (1000 * 60 * 60 * 24);
    if (diffDays <= 5) return 'trial';
    return 'expired';
  };

  const path = window.location.pathname;
  if (path === '/terms') return <TermsPage />;
  if (path === '/refund') return <RefundPage />;
  if (path === '/contact') return <ContactPage />;
  if (path === '/payment-status') return <PaymentStatusPage />;

  if (loadingSession || loadingProfile) {
    return (
      <div style={{ backgroundColor: '#F4F6FA', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#0F172A' }}>Pulse<span style={{ color: '#C8920A' }}>Trade</span></div>
        <div style={{ fontSize: 11, color: '#64748B', marginTop: 6 }}>🔱 हर हर महादेव 🔱</div>
        <div style={{ marginTop: 20, fontSize: 13, color: '#94A3B8' }}>⏳ Loading...</div>
      </div>
    );
  }

  if (!session) return <LoginPage />;

  // ── ADMIN ROUTE ──
  if (path === '/admin') return <AdminPanel user={session.user} onLogout={handleLogout} />;

  const access = checkAccess();
  if (access === 'loading') return (
    <div style={{ backgroundColor: '#F4F6FA', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ fontSize: 13, color: '#94A3B8' }}>⏳ Loading...</div>
    </div>
  );

  if (access === 'expired') return <TrialExpiredPage user={session.user} onLogout={handleLogout} />;

  return <StockDashboard user={session.user} />;
}

export default App;
