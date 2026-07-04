import { useEffect, useState } from 'react';

const COLORS = {
  bg: "#F4F6FA", surface: "#FFFFFF", surfaceBorder: "#E2E8F0",
  gold: "#C8920A", goldLight: "#FEF3C7", goldDim: "#D97706",
  green: "#059669", greenLight: "#ECFDF5",
  red: "#DC2626",
  text: "#0F172A", muted: "#64748B", mutedLight: "#94A3B8",
  navy: "#1E3A5F", navyLight: "#EFF6FF",
};

const LOGO_URL = "/file_00000000b7687208b27c366287ff7e00.png";

const FEATURES = [
  { icon: '📈', title: 'Swing Trade Signals', desc: '10 din se 2 mahine — sahi entry, sahi exit.' },
  { icon: '📊', title: 'RSI • MACD • ADX', desc: 'Top indicators ek jagah, Hinglish mein.' },
  { icon: '🔊', title: 'Pulse Bolta Hai', desc: 'AI summary sunao — padhne ki zarurat nahi!' },
  { icon: '⭐', title: 'Watchlist', desc: 'Apne favorite stocks save karo, nazar rakho.' },
  { icon: '📧', title: 'Email Alerts', desc: 'Important signals seedha inbox mein.' },
  { icon: '🎓', title: 'Trading Academy', desc: 'Hindi PDF courses — Candlestick se RSI tak.' },
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
          padding: '10px 20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          transition: 'all 0.3s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img
              src={LOGO_URL}
              alt="PulseTrade Logo"
              style={{ height: 42, width: 42, borderRadius: '50%', objectFit: 'cover' }}
            />
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>
              Pulse<span style={{ color: COLORS.gold }}>Trade</span>
            </div>
          </div>
          <button onClick={onLogin} style={{
            padding: '8px 20px', fontSize: 13, fontWeight: 700,
            borderRadius: 20, border: `1.5px solid ${COLORS.gold}`,
            backgroundColor: 'transparent', color: COLORS.gold, cursor: 'pointer',
          }}>
            Login →
          </button>
        </div>

        {/* USP BANNER */}
        <div style={{
          background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
          padding: '12px 20px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#FFF' }}>
            🔢 India Ka Pehla Technical + Numerology Trading Tool
          </div>
        </div>

        {/* HERO */}
        <div style={{
          padding: '40px 24px 36px',
          background: 'linear-gradient(160deg, #0d1b3e 0%, #1E3A5F 100%)',
          textAlign: 'center',
        }}>
          {/* Logo */}
          <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'center' }}>
            <img
              src={LOGO_URL}
              alt="PulseTrade Logo"
              style={{
                width: 130,
                height: 130,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid rgba(200,146,10,0.5)',
                boxShadow: '0 0 30px rgba(200,146,10,0.3)',
              }}
            />
          </div>

          <div style={{
            display: 'inline-block', fontSize: 11, fontWeight: 800,
            color: '#22c55e', backgroundColor: 'rgba(34,197,94,0.15)',
            padding: '5px 14px', borderRadius: 20,
            border: '1px solid rgba(34,197,94,0.3)', marginBottom: 10,
          }}>
            ✅ NSE • BSE Live Data
          </div>
          <br />
          <div style={{
            display: 'inline-block', fontSize: 11, fontWeight: 700,
            color: 'rgba(255,255,255,0.6)', backgroundColor: 'rgba(255,255,255,0.08)',
            padding: '4px 12px', borderRadius: 20, marginBottom: 16,
          }}>
            📅 PulseTrade June 2026 se live hai
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 900, lineHeight: 1.25, margin: '0 0 10px', letterSpacing: '-0.5px', color: '#FFFFFF' }}>
            India's #1 NSE/BSE<br />
            <span style={{ color: COLORS.gold }}>Swing Trading Analysis Tool</span>
          </h1>

          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, margin: '0 0 8px', fontWeight: 600 }}>
            10 Din se 2 Mahine —
          </p>
          <p style={{ fontSize: 14, color: COLORS.gold, lineHeight: 1.6, margin: '0 0 28px', fontWeight: 700 }}>
            Sahi Trend, Sahi Time, Faisla Khud Karo! 🎯
          </p>

          <button onClick={onLogin} style={{
            display: 'block', width: '100%',
            padding: '16px', fontSize: 17, fontWeight: 800,
            borderRadius: 14, border: 'none',
            background: 'linear-gradient(135deg, #C8920A, #D97706)',
            color: '#FFF', cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(200,146,10,0.4)',
            marginBottom: 12,
          }}>
            🚀 5 Din FREE Trial Shuru Karo
          </button>
          <div style={{
            display: 'inline-block', fontSize: 12, fontWeight: 800,
            color: '#22c55e', backgroundColor: 'rgba(34,197,94,0.15)',
            padding: '6px 16px', borderRadius: 20,
            border: '1px solid rgba(34,197,94,0.3)', marginBottom: 12,
          }}>
            💳 Bina Card, Bina Paisa — Sirf Naam/Email
          </div><br />
          <p style={{ fontSize: 12, color: COLORS.gold, margin: 0, fontWeight: 700 }}>
            🔢 Technical + Numerology — Double Confirmation Har Trade Pe
          </p>
        </div>

        {/* SWING TRADING BADGE */}
        <div style={{
          background: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)',
          border: `1.5px solid ${COLORS.gold}`,
          margin: '16px',
          borderRadius: 16,
          padding: '16px 20px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.navy, marginBottom: 6 }}>
            📈 Swing Traders ke liye Banaya Gaya
          </div>
          <div style={{ fontSize: 12, color: COLORS.muted, lineHeight: 1.6 }}>
            Entry • Stop Loss • Target — sab ek jagah<br />
            <span style={{ color: COLORS.gold, fontWeight: 700 }}>Holding: 10 Din se 2 Mahine</span>
          </div>
        </div>

        {/* FEATURES */}
        <div style={{ padding: '8px 16px 16px' }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.muted, fontWeight: 700, marginBottom: 14, textAlign: 'center' }}>
            🛠️ FEATURES
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {FEATURES.map((f) => (
              <div key={f.title} style={{
                backgroundColor: COLORS.surface,
                border: `1px solid ${COLORS.surfaceBorder}`,
                borderRadius: 14, padding: '14px 12px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{f.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.text, marginBottom: 4 }}>{f.title}</div>
                <div style={{ fontSize: 11, color: COLORS.muted, lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* SOCIAL PROOF */}
        <div style={{
          margin: '0 16px 16px',
          backgroundColor: COLORS.surface,
          border: `1px solid ${COLORS.surfaceBorder}`,
          borderRadius: 16, padding: '20px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.muted, fontWeight: 700, marginBottom: 16 }}>
            📊 STATS
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            {[
              { num: '500+', label: 'Active Traders' },
              { num: '50+', label: 'Stocks Daily' },
              { num: '5★', label: 'Rating' },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ fontSize: 22, fontWeight: 900, color: COLORS.gold }}>{s.num}</div>
                <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* PLANS */}
        <div style={{ padding: '0 16px 16px' }} id="subscribe">
          <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.muted, fontWeight: 700, marginBottom: 14, textAlign: 'center' }}>
            💰 PLANS
          </div>
          {PLANS.map((plan) => (
            <div key={plan.label} style={{
              backgroundColor: plan.popular ? COLORS.goldLight : COLORS.surface,
              border: `1.5px solid ${plan.popular ? COLORS.gold : COLORS.surfaceBorder}`,
              borderRadius: 14, padding: '16px',
              marginBottom: 10,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              boxShadow: plan.popular ? '0 4px 16px rgba(200,146,10,0.15)' : 'none',
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.text }}>{plan.label}</div>
                {plan.tag && <div style={{ fontSize: 11, color: COLORS.goldDim, fontWeight: 700, marginTop: 2 }}>{plan.tag}</div>}
                <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>{plan.per}</div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: COLORS.gold }}>{plan.price}</div>
            </div>
          ))}
          <button onClick={onLogin} style={{
            display: 'block', width: '100%', marginTop: 8,
            padding: '15px', fontSize: 16, fontWeight: 800,
            borderRadius: 14, border: 'none',
            background: 'linear-gradient(135deg, #1E3A5F, #2D5A8E)',
            color: '#FFF', cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(30,58,95,0.3)',
          }}>
            🎯 Abhi Subscribe Karo
          </button>
          <p style={{ fontSize: 11, color: COLORS.muted, textAlign: 'center', marginTop: 10 }}>
            🛡️ Payment fail hua? 48 ghante mein full refund
          </p>
        </div>

        {/* DISCLAIMER */}
        <div style={{
          margin: '0 16px 16px',
          background: COLORS.navyLight,
          border: `1px solid #BFDBFE`,
          borderRadius: 12, padding: '12px 16px',
          display: 'flex', gap: 8, alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>🛡️</span>
          <p style={{ fontSize: 11, color: COLORS.navy, margin: 0, lineHeight: 1.6 }}>
            <strong>PulseTrade</strong> provides technical market analysis and educational tools only. This is not investment advice. Consult a SEBI registered advisor before investing.
          </p>
        </div>

        {/* FOOTER */}
        <div style={{
          padding: '16px 20px 32px', textAlign: 'center',
          borderTop: `1px solid ${COLORS.surfaceBorder}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4 }}>
            <img src={LOGO_URL} alt="PulseTrade" style={{ height: 28, width: 28, borderRadius: '50%', objectFit: 'cover' }} />
            <div style={{ fontSize: 20, fontWeight: 800 }}>
              Pulse<span style={{ color: COLORS.gold }}>Trade</span>
            </div>
          </div>
          <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 12 }}>🔱 हर हर महादेव 🔱</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
            {[['Blog', '/blog'], ['Terms', '/terms'], ['Privacy', '/privacy'], ['Refund', '/refund'], ['Contact', '/contact']].map(([l, h]) => (
              <span key={l} style={{ display: 'flex', alignItems: 'center' }}>
                <a href={h} style={{ fontSize: 12, color: COLORS.muted, textDecoration: 'none', padding: '0 8px' }}>{l}</a>
                <span style={{ color: COLORS.surfaceBorder }}>•</span>
              </span>
            ))}
          </div>
          <div style={{ fontSize: 11, color: COLORS.mutedLight }}>© 2026 PulseTrade</div>
        </div>

      </div>
    </div>
  );
}
