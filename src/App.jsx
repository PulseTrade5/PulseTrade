import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import StockDashboard from './StockDashboard';
import LoginPage from './LoginPage';

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
      <p style={{ marginBottom: 16, lineHeight: 1.7 }}>By using PulseTrade (pulsetrade.in), you agree to these terms. If you do not agree, please do not use this service.</p>
      <h2 style={{ color: DARK.gold, marginBottom: 12 }}>2. Service Description</h2>
      <p style={{ marginBottom: 16, lineHeight: 1.7 }}>PulseTrade provides technical analysis tools and stock trend indicators for NSE/BSE listed securities. All information is for educational purposes only and does not constitute investment advice.</p>
      <h2 style={{ color: DARK.gold, marginBottom: 12 }}>3. Disclaimer</h2>
      <p style={{ marginBottom: 16, lineHeight: 1.7 }}>PulseTrade is NOT a SEBI registered investment advisor. All analysis is based on technical indicators only. Users must consult a SEBI registered advisor before making any investment decisions.</p>
      <h2 style={{ color: DARK.gold, marginBottom: 12 }}>4. Subscription</h2>
      <p style={{ marginBottom: 16, lineHeight: 1.7 }}>Subscriptions are billed in advance. Plans are available for 1, 2, and 3 months. Payments are processed securely via Cashfree Payments.</p>
      <h2 style={{ color: DARK.gold, marginBottom: 12 }}>5. Limitation of Liability</h2>
      <p style={{ marginBottom: 16, lineHeight: 1.7 }}>PulseTrade shall not be liable for any financial losses arising from use of this platform. Trading in equity and derivatives involves substantial risk of loss.</p>
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
      <p style={{ marginBottom: 16, lineHeight: 1.7 }}>PulseTrade is a digital subscription service. <strong>No refunds</strong> are provided once a subscription is activated and service access is granted.</p>
      <h2 style={{ color: DARK.gold, marginBottom: 12 }}>Exception — Technical Failure</h2>
      <p style={{ marginBottom: 16, lineHeight: 1.7 }}>Refund will be processed <strong>only if</strong> payment was deducted but subscription was not activated due to a technical error. Contact us within <strong>48 hours</strong> of payment with your Order ID.</p>
      <h2 style={{ color: DARK.gold, marginBottom: 12 }}>How to Contact</h2>
      <p style={{ marginBottom: 16, lineHeight: 1.7 }}>Email: <span style={{ color: DARK.gold }}>support@pulsetrade.in</span><br />Include your registered email and Cashfree Order ID. We respond within 24 hours.</p>
      <h2 style={{ color: DARK.gold, marginBottom: 12 }}>Cancellations</h2>
      <p style={{ marginBottom: 16, lineHeight: 1.7 }}>You may stop using the service anytime. Subscription remains active till end of paid period. No partial refunds for unused days.</p>
      <a href="/" style={{ color: DARK.gold }}>← Back to Home</a>
    </div>
  );
}

function ContactPage() {
  return (
    <div style={{ backgroundColor: DARK.bg, color: DARK.text, minHeight: '100vh', padding: '40px 20px', maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ color: DARK.gold, marginBottom: 24 }}>Contact Us</h1>
      <p style={{ marginBottom: 24, lineHeight: 1.7 }}>We are here to help! Reach out to us for any queries regarding your subscription or technical analysis.</p>
      <div style={{ backgroundColor: DARK.surface, borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <p style={{ marginBottom: 12 }}>📧 <strong>Email:</strong> <span style={{ color: DARK.gold }}>support@pulsetrade.in</span></p>
        <p style={{ marginBottom: 12 }}>🌐 <strong>Website:</strong> <span style={{ color: DARK.gold }}>pulsetrade.in</span></p>
        <p style={{ marginBottom: 12 }}>📍 <strong>Location:</strong> India</p>
        <p style={{ marginBottom: 0 }}>⏰ <strong>Support Hours:</strong> Mon–Sat, 10 AM – 6 PM IST</p>
      </div>
      <p style={{ lineHeight: 1.7, color: DARK.muted }}>For payment related issues, please email us with your Order ID and registered email address. We typically respond within 24 hours.</p>
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
        {status === 'loading' && (
          <div style={{ backgroundColor: DARK.surface, borderRadius: 16, padding: 32 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
            <p style={{ color: DARK.muted }}>Payment verify ho raha hai...</p>
          </div>
        )}
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
        {status === 'failed' && (
          <div style={{ backgroundColor: DARK.surface, border: `2px solid ${DARK.red}`, borderRadius: 16, padding: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
            <h2 style={{ color: DARK.red, marginBottom: 8 }}>Payment Failed</h2>
            <p style={{ color: DARK.muted, marginBottom: 20 }}>Dobara try karo.</p>
            <a href="/" style={{ display: 'block', padding: '12px', backgroundColor: DARK.gold, color: DARK.bg, borderRadius: 10, fontWeight: 700, textDecoration: 'none' }}>Wapas Jao</a>
          </div>
        )}
        {status === 'error' && (
          <div style={{ backgroundColor: DARK.surface, borderRadius: 16, padding: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ marginBottom: 8 }}>Kuch Gadbad Hui</h2>
            <p style={{ color: DARK.muted, marginBottom: 20 }}>Support se contact karo.</p>
            <a href="/" style={{ display: 'block', padding: '12px', backgroundColor: DARK.gold, color: DARK.bg, borderRadius: 10, fontWeight: 700, textDecoration: 'none' }}>Wapas Jao</a>
          </div>
        )}
      </div>
    </div>
  );
}

async function setTrialIfNew(user) {
  const meta = user.user_metadata || {};
  if (meta.trial_end_date || meta.is_paid) return;
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 5);
  await supabase.auth.updateUser({
    data: { trial_end_date: trialEnd.toISOString() },
  });
  try {
    await fetch('/api/send-welcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, trialEndDate: trialEnd.toISOString() }),
    });
  } catch (err) {
    console.error('Welcome email send failed:', err);
  }
}

// ✅ FIX: Routes ko App ke ANDAR move kiya — hooks violation fix
function App() {
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) await setTrialIfNew(session.user);
      setSession(session);
      setLoadingSession(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event, session?.user?.email); // debug ke liye
      if (session?.user) {
        await setTrialIfNew(session.user);
        setSession(session);
      } else {
        setSession(null);
      }
      setLoadingSession(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ✅ Routes AFTER hooks — Rules of Hooks fix
  const path = window.location.pathname;
  if (path === '/terms') return <TermsPage />;
  if (path === '/refund') return <RefundPage />;
  if (path === '/contact') return <ContactPage />;
  if (path === '/payment-status') return <PaymentStatusPage />;

  if (loadingSession) {
    return (
      <div style={{
        backgroundColor: '#F4F6FA', minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Inter, sans-serif',
      }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#0F172A' }}>
          Pulse<span style={{ color: '#C8920A' }}>Trade</span>
        </div>
        <div style={{ fontSize: 11, color: '#64748B', marginTop: 6 }}>🔱 हर हर महादेव 🔱</div>
        <div style={{ marginTop: 20, fontSize: 13, color: '#94A3B8' }}>⏳ Loading...</div>
      </div>
    );
  }

  if (!session) return <LoginPage />;
  return <StockDashboard user={session.user} />;
}

export default App;
