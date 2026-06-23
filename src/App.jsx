import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import StockDashboard from './StockDashboard';

function TermsPage() {
  return (
    <div style={{ backgroundColor: '#0D1117', color: '#E8E6E0', minHeight: '100vh', padding: '40px 20px', maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ color: '#D8A33D', marginBottom: 24 }}>Terms & Conditions</h1>
      <p style={{ marginBottom: 16, lineHeight: 1.7 }}>Last updated: June 2026</p>
      <h2 style={{ color: '#D8A33D', marginBottom: 12 }}>1. Acceptance</h2>
      <p style={{ marginBottom: 16, lineHeight: 1.7 }}>By using PulseTrade (pulsetrade.in), you agree to these terms. If you do not agree, please do not use this service.</p>
      <h2 style={{ color: '#D8A33D', marginBottom: 12 }}>2. Service Description</h2>
      <p style={{ marginBottom: 16, lineHeight: 1.7 }}>PulseTrade provides technical analysis tools and stock trend indicators for NSE/BSE listed securities. All information is for educational purposes only and does not constitute investment advice.</p>
      <h2 style={{ color: '#D8A33D', marginBottom: 12 }}>3. Disclaimer</h2>
      <p style={{ marginBottom: 16, lineHeight: 1.7 }}>PulseTrade is NOT a SEBI registered investment advisor. All analysis is based on technical indicators only. Users must consult a SEBI registered advisor before making any investment decisions.</p>
      <h2 style={{ color: '#D8A33D', marginBottom: 12 }}>4. Subscription</h2>
      <p style={{ marginBottom: 16, lineHeight: 1.7 }}>Subscriptions are billed in advance. Plans are available for 1, 2, and 3 months. Payments are processed securely via Cashfree Payments.</p>
      <h2 style={{ color: '#D8A33D', marginBottom: 12 }}>5. Limitation of Liability</h2>
      <p style={{ marginBottom: 16, lineHeight: 1.7 }}>PulseTrade shall not be liable for any financial losses arising from use of this platform. Trading in equity and derivatives involves substantial risk of loss.</p>
      <a href="/" style={{ color: '#D8A33D' }}>← Back to Home</a>
    </div>
  );
}

function RefundPage() {
  return (
    <div style={{ backgroundColor: '#0D1117', color: '#E8E6E0', minHeight: '100vh', padding: '40px 20px', maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ color: '#D8A33D', marginBottom: 24 }}>Refunds & Cancellations</h1>
      <p style={{ marginBottom: 16, lineHeight: 1.7 }}>Last updated: June 2026</p>
      <h2 style={{ color: '#D8A33D', marginBottom: 12 }}>General Policy</h2>
      <p style={{ marginBottom: 16, lineHeight: 1.7 }}>PulseTrade is a digital subscription service. <strong>No refunds</strong> are provided once a subscription is activated and service access is granted.</p>
      <h2 style={{ color: '#D8A33D', marginBottom: 12 }}>Exception — Technical Failure</h2>
      <p style={{ marginBottom: 16, lineHeight: 1.7 }}>Refund will be processed <strong>only if</strong> payment was deducted but subscription was not activated due to a technical error. Contact us within <strong>48 hours</strong> of payment with your Order ID.</p>
      <h2 style={{ color: '#D8A33D', marginBottom: 12 }}>How to Contact</h2>
      <p style={{ marginBottom: 16, lineHeight: 1.7 }}>Email: <span style={{ color: '#D8A33D' }}>support@pulsetrade.in</span><br/>Include your registered email and Cashfree Order ID. We respond within 24 hours.</p>
      <h2 style={{ color: '#D8A33D', marginBottom: 12 }}>Cancellations</h2>
      <p style={{ marginBottom: 16, lineHeight: 1.7 }}>You may stop using the service anytime. Subscription remains active till end of paid period. No partial refunds for unused days.</p>
      <a href="/" style={{ color: '#D8A33D' }}>← Back to Home</a>
    </div>
  );
}

function ContactPage() {
  return (
    <div style={{ backgroundColor: '#0D1117', color: '#E8E6E0', minHeight: '100vh', padding: '40px 20px', maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ color: '#D8A33D', marginBottom: 24 }}>Contact Us</h1>
      <p style={{ marginBottom: 24, lineHeight: 1.7 }}>We are here to help! Reach out to us for any queries regarding your subscription or technical analysis.</p>
      <div style={{ backgroundColor: '#161B22', borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <p style={{ marginBottom: 12 }}>📧 <strong>Email:</strong> <span style={{ color: '#D8A33D' }}>support@pulsetrade.in</span></p>
        <p style={{ marginBottom: 12 }}>🌐 <strong>Website:</strong> <span style={{ color: '#D8A33D' }}>pulsetrade.in</span></p>
        <p style={{ marginBottom: 12 }}>📍 <strong>Location:</strong> India</p>
        <p style={{ marginBottom: 0 }}>⏰ <strong>Support Hours:</strong> Mon–Sat, 10 AM – 6 PM IST</p>
      </div>
      <p style={{ lineHeight: 1.7, color: '#8B92A0' }}>For payment related issues, please email us with your Order ID and registered email address. We typically respond within 24 hours.</p>
      <a href="/" style={{ color: '#D8A33D' }}>← Back to Home</a>
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
    <div style={{ backgroundColor: '#0D1117', color: '#E8E6E0', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
        <div style={{ color: '#D8A33D', fontWeight: 700, fontSize: 14, marginBottom: 16 }}>🔱 हर हर महादेव 🔱</div>
        {status === 'loading' && <div style={{ backgroundColor: '#161B22', borderRadius: 16, padding: 32 }}><div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div><p style={{ color: '#8B92A0' }}>Payment verify ho raha hai...</p></div>}
        {status === 'success' && (
          <div style={{ backgroundColor: '#161B22', border: '2px solid #3FAE7C', borderRadius: 16, padding: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h2 style={{ color: '#3FAE7C', marginBottom: 8 }}>Payment Successful!</h2>
            <p style={{ color: '#8B92A0', marginBottom: 16 }}>Tumhari subscription activate ho gayi hai.</p>
            {data && <div style={{ backgroundColor: '#0D1117', borderRadius: 12, padding: 16, marginBottom: 20, textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}><span style={{ color: '#8B92A0' }}>Order ID</span><span style={{ fontWeight: 600, fontSize: 11 }}>{data.order_id}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}><span style={{ color: '#8B92A0' }}>Amount</span><span style={{ fontWeight: 600, color: '#D8A33D' }}>₹{data.amount}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}><span style={{ color: '#8B92A0' }}>Email</span><span style={{ fontWeight: 600, fontSize: 11 }}>{data.customer_email}</span></div>
            </div>}
            <a href="/" style={{ display: 'block', padding: '12px', backgroundColor: '#D8A33D', color: '#0D1117', borderRadius: 10, fontWeight: 700, textDecoration: 'none' }}>Dashboard Pe Jao →</a>
          </div>
        )}
        {status === 'failed' && <div style={{ backgroundColor: '#161B22', border: '2px solid #D1453B', borderRadius: 16, padding: 32 }}><div style={{ fontSize: 48, marginBottom: 16 }}>❌</div><h2 style={{ color: '#D1453B', marginBottom: 8 }}>Payment Failed</h2><p style={{ color: '#8B92A0', marginBottom: 20 }}>Dobara try karo.</p><a href="/" style={{ display: 'block', padding: '12px', backgroundColor: '#D8A33D', color: '#0D1117', borderRadius: 10, fontWeight: 700, textDecoration: 'none' }}>Wapas Jao</a></div>}
        {status === 'error' && <div style={{ backgroundColor: '#161B22', borderRadius: 16, padding: 32 }}><div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div><h2 style={{ marginBottom: 8 }}>Kuch Gadbad Hui</h2><p style={{ color: '#8B92A0', marginBottom: 20 }}>Support se contact karo.</p><a href="/" style={{ display: 'block', padding: '12px', backgroundColor: '#D8A33D', color: '#0D1117', borderRadius: 10, fontWeight: 700, textDecoration: 'none' }}>Wapas Jao</a></div>}
      </div>
    </div>
  );
}

function App() {
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const path = window.location.pathname;
  if (path === '/terms') return <TermsPage />;
  if (path === '/refund') return <RefundPage />;
  if (path === '/contact') return <ContactPage />;
  if (path === '/payment-status') return <PaymentStatusPage />;

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
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: 'https://pulsetrade.in' } });
    setSending(false);
    if (!error) setSent(true);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); };

  if (loadingSession) return <div style={{ backgroundColor: '#0D1117', color: '#E8E6E0', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;

  if (!session) {
    return (
      <div style={{ backgroundColor: '#0D1117', color: '#E8E6E0', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: 360, width: '100%', padding: '0 20px', textAlign: 'center' }}>
          <div style={{ color: '#D8A33D', fontWeight: 700, fontSize: 14, marginBottom: 8 }}>🔱 हर हर महादेव 🔱</div>
          <h1 style={{ fontSize: 32, fontWeight: 700 }}>Pulse<span style={{ color: '#D8A33D' }}>Trade</span></h1>
          <p style={{ fontSize: 13, color: '#8B92A0', marginBottom: 32 }}>Bazaar ka pulse dekho, faisla khud karo.</p>
          {!sent ? (
            <>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} placeholder="tumhara@email.com"
                style={{ width: '100%', padding: '12px', fontSize: 14, backgroundColor: '#161B22', border: '1px solid #30363D', borderRadius: 8, color: '#E8E6E0', marginBottom: 12, boxSizing: 'border-box' }} />
              <button onClick={handleLogin} disabled={sending}
                style={{ width: '100%', padding: '12px', fontSize: 14, fontWeight: 600, borderRadius: 10, border: 'none', backgroundColor: sending ? '#555' : '#D8A33D', color: '#0D1117', cursor: 'pointer' }}>
                {sending ? '📨 Bhej rahe hain...' : '🔑 Login Link Bhejo'}
              </button>
            </>
          ) : (
            <div style={{ backgroundColor: '#161B22', border: '1px solid #3FAE7C', borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>✅</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Link bhej diya!</div>
              <div style={{ fontSize: 12, color: '#8B92A0', marginTop: 8 }}>{email} pe login link gaya hai.</div>
            </div>
          )}
          <div style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid #30363D', display: 'flex', justifyContent: 'center', gap: 16, fontSize: 12 }}>
            <a href="/terms" style={{ color: '#8B92A0' }}>Terms</a>
            <a href="/refund" style={{ color: '#8B92A0' }}>Refund Policy</a>
            <a href="/contact" style={{ color: '#8B92A0' }}>Contact</a>
          </div>
        </div>
      </div>
    );
  }

  return <StockDashboard user={session.user} onLogout={handleLogout} />;
}

export default App;
