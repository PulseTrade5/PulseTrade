import { useEffect, useState } from 'react';

const COLORS = {
  bg: "#F4F6FA", surface: "#FFFFFF", surfaceBorder: "#E2E8F0",
  gold: "#C8920A", goldLight: "#FEF3C7", goldDim: "#D97706",
  green: "#059669", greenLight: "#ECFDF5",
  red: "#DC2626",
  text: "#0F172A", muted: "#64748B", mutedLight: "#94A3B8",
};

const FEATURES = [
  { icon: '🎯', title: 'Trend Analysis', desc: 'Bullish ya Bearish — ek nazar mein pata chale.' },
  { icon: '📊', title: 'RSI • MACD • ADX', desc: 'Top indicators ek jagah, Hinglish explanation ke saath.' },
  { icon: '🔊', title: 'Pulse Bolta Hai', desc: 'AI summary sunao — padhne ki zarurat nahi!' },
  { icon: '⭐', title: 'Watchlist', desc: 'Apne favorite stocks save karo, nazar rakho.' },
  { icon: '📧', title: 'Email Alerts', desc: 'Important signals seedha inbox mein.' },
  { icon: '🤖', title: 'AI Hinglish Summary', desc: 'Complex analysis simple bhasha mein.' },
];

const PLANS = [
  { label: '1 Month', price: '₹599', per: '₹599/mo', popular: false, tag: null },
  { label: '2 Months', price: '₹1,049', per: '₹525/mo', popular: true, tag: '🔥 Most Popular' },
  { label: '3 Months', price: '₹1,499', per: '₹500/mo', popular: false, tag: '💰 Best Value' },
];

export default function LandingPage({ onLogin }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{ backgroundColor: COLORS.bg, minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif', color: COLORS.text }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>

        {/* NAVBAR */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 100,
          backgroundColor: scrolled ? COLORS.surface : 'transparent',
          borderBottom: scrolled ? `1px solid ${COLORS.surfaceBorder}` : 'none',
          boxShadow: scrolled ? '0 1px 8px rgba(0,0,0,0.06)' : 'none',
          padding: '16px 20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          transition: 'all 0.3s ease',
        }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px' }}>
              Pulse<span style={{ color: COLORS.gold }}>Trade</span>
            </div>
            <div style={{ fontSize: 10, color: COLORS.muted }}>🔱 हर हर महादेव 🔱</div>
          </div>
          <button onClick={onLogin} style={{
            padding: '8px 20px', fontSize: 13, fontWeight: 700,
            borderRadius: 20, border: `1.5px solid ${COLORS.gold}`,
            backgroundColor: 'transparent', color: COLORS.gold, cursor: 'pointer',
          }}>
            Login →
          </button>
        </div>

        {/* HERO */}
        <div style={{
          padding: '48px 24px 40px',
          background: `linear-gradient(160deg, #ffffff 0%, ${COLORS.goldLight} 100%)`,
          textAlign: 'center',
          borderBottom: `1px solid #f0c040`,
        }}>
          <div style={{
            display: 'inline-block', fontSize: 11, fontWeight: 800,
            color: COLORS.green, backgroundColor: COLORS.greenLight,
            padding: '5px 14px', borderRadius: 20,
            border: '1px solid #bbf7d0', marginBottom: 20,
          }}>
            ✅ NSE • BSE Live Data
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 900, lineHeight: 1.2, margin: '0 0 16px', letterSpacing: '-1px' }}>
            Bazaar ka pulse dekho,<br />
            <span style={{ color: COLORS.gold }}>faisla khud karo.</span>
          </h1>
          <p style={{ fontSize: 15, color: COLORS.muted, lineHeight: 1.7, margin: '0 0 28px' }}>
            NSE/BSE stocks ka AI-powered<br />technical analysis — Hinglish mein. 🇮🇳
          </p>
          <button onClick={onLogin} style={{
            display: 'block', width: '100%',
            padding: '16px', fontSize: 17, fontWeight: 800,
            borderRadius: 14, border: 'none',
            backgroundColor: COLORS.gold, color: '#FFF',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(200,146,10,0.4)',
            marginBottom: 12,
          }}>
            🚀 5-Din FREE Trial Shuru Karo
          </button>
          <p style={{ fontSize: 12, color: COLORS.muted, margin: 0 }}>
            No credit card • Instant access • Cancel anytime
          </p>
        </div>

        {/* FEATURES */}
        <div style={{ padding: '32px 20px 0' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 11, letterSpacing: 2, fontWeight: 800, color: COLORS.muted, marginBottom: 8 }}>✨ FEATURES</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Sab kuch ek jagah</h2>
            <p style={{ fontSize: 13, color: COLORS.muted, marginTop: 8 }}>Jo cheezein traders ko chahiye — sab yahan hai</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FEATURES.map((f) => (
              <div key={f.title} style={{
                backgroundColor: COLORS.surface,
                border: `1px solid ${COLORS.surfaceBorder}`,
                borderRadius: 14, padding: '16px 18px',
                display: 'flex', alignItems: 'center', gap: 16,
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}>
                <div style={{
                  fontSize: 28, width: 52, height: 52, flexShrink: 0,
                  backgroundColor: COLORS.goldLight, borderRadius: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {f.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>{f.title}</div>
                  <div style={{ fontSize: 12, color: COLORS.muted, lineHeight: 1.5 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PRICING SECTION */}
        <div style={{ padding: '32px 20px 0' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 11, letterSpacing: 2, fontWeight: 800, color: COLORS.muted, marginBottom: 8 }}>💰 PRICING</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Simple Plans</h2>
            <p style={{ fontSize: 13, color: COLORS.muted, marginTop: 8 }}>5-din free trial ke baad — apna plan chuno</p>
          </div>

          {/* Free Trial Banner */}
          <div style={{
            backgroundColor: COLORS.greenLight,
            border: `2px solid ${COLORS.green}`,
            borderRadius: 14, padding: '16px 20px',
            textAlign: 'center', marginBottom: 16,
          }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>🎉</div>
            <div style={{ fontWeight: 800, fontSize: 16, color: COLORS.green, marginBottom: 4 }}>5-Din FREE Trial</div>
            <div style={{ fontSize: 12, color: COLORS.muted }}>No credit card required — seedha signup karo!</div>
          </div>

          {/* Plan Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
            {PLANS.map((plan) => (
              <div key={plan.label} style={{
                backgroundColor: plan.popular ? COLORS.text : COLORS.surface,
                border: `2px solid ${plan.popular ? COLORS.gold : COLORS.surfaceBorder}`,
                borderRadius: 16, padding: '18px 20px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                boxShadow: plan.popular ? '0 4px 20px rgba(200,146,10,0.2)' : '0 1px 4px rgba(0,0,0,0.04)',
                position: 'relative',
              }}>
                {plan.tag && (
                  <div style={{
                    position: 'absolute', top: -10, left: 16,
                    fontSize: 10, fontWeight: 800,
                    backgroundColor: COLORS.gold, color: '#FFF',
                    padding: '3px 10px', borderRadius: 20,
                  }}>
                    {plan.tag}
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: plan.popular ? '#FFF' : COLORS.text }}>{plan.label}</div>
                  <div style={{ fontSize: 12, color: plan.popular ? '#CBD5E1' : COLORS.muted, marginTop: 2 }}>{plan.per}</div>
                </div>
                <div style={{ fontSize: 24, fontWeight: 900, color: COLORS.gold }}>{plan.price}</div>
              </div>
            ))}
          </div>

          <button onClick={onLogin} style={{
            display: 'block', width: '100%',
            padding: '16px', fontSize: 16, fontWeight: 800,
            borderRadius: 14, border: 'none',
            backgroundColor: COLORS.gold, color: '#FFF',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(200,146,10,0.4)',
          }}>
            🚀 Free Trial Se Shuru Karo
          </button>
        </div>

        {/* FOOTER */}
        <div style={{ padding: '32px 20px 48px', textAlign: 'center', borderTop: `1px solid ${COLORS.surfaceBorder}`, marginTop: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, fontSize: 12, marginBottom: 16 }}>
            <a href="/terms" style={{ color: COLORS.muted, textDecoration: 'none', fontWeight: 600 }}>Terms</a>
            <a href="/refund" style={{ color: COLORS.muted, textDecoration: 'none', fontWeight: 600 }}>Refund Policy</a>
            <a href="/contact" style={{ color: COLORS.muted, textDecoration: 'none', fontWeight: 600 }}>Contact</a>
          </div>
          <div style={{ fontSize: 11, color: COLORS.mutedLight }}>
            🛡️ SEBI Disclaimer: Yeh sirf technical analysis hai — investment advice nahi.
          </div>
          <p style={{ fontSize: 12, color: COLORS.mutedLight, marginTop: 12 }}>🔱 हर हर महादेव 🔱</p>
        </div>

      </div>
    </div>
  );
}
