timport { useEffect, useState } from 'react';

const COLORS = {
  bg: "#F5F7FC", surface: "#FFFFFF", surfaceBorder: "#E5E9F5",
  gold: "#4F46E5", goldLight: "#EEF2FF", goldDim: "#4338CA",
  green: "#16A34A", greenLight: "#F0FDF4",
  red: "#EF4444",
  text: "#1E1B4B", muted: "#6B7280", mutedLight: "#9CA3AF",
  navy: "#1E1B4B", navyLight: "#EEF2FF",
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
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&display=swap');
        @keyframes lp-gradient-shift { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
      `}</style>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>

        {/* NAVBAR */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 100,
          backgroundColor: scrolled ? COLORS.surface : 'transparent',
          borderBottom: scrolled ? `1px solid ${COLORS.surfaceBorder}` : 'none',
          boxShadow: scrolled ? '0 4px 16px rgba(30,27,75,0.06)' : 'none',
          padding: '10px 20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          transition: 'all 0.3s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img
              src={LOGO_URL}
              alt="PulseTrade Logo"
              style={{ height: 42, width: 42, borderRadius: '50%', objectFit: 'cover', boxShadow: '0 4px 12px rgba(79,70,229,0.25)' }}
            />
            <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 800, letterSpacing: '-0.3px' }}>
              <span style={{ color: COLORS.text }}>Pulse</span>
              <span style={{
                background: 'linear-gradient(120deg, #4F46E5, #0EA5A4)',
                WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
              }}>Trade</span>
            </div>
          </div>
          <button onClick={onLogin} style={{
            padding: '8px 20px', fontSize: 13, fontWeight: 700,
            borderRadius: 20, border: 'none',
            background: COLORS.goldLight, color: COLORS.gold, cursor: 'pointer',
            boxShadow: '0 3px 8px rgba(79,70,229,0.12), 0 1px 0 rgba(255,255,255,0.6) inset',
          }}>
            Login →
          </button>
        </div>

        {/* USP BANNER */}
        <div style={{
          background: 'linear-gradient(135deg, #4F46E5, #8B5CF6, #0EA5A4)',
          backgroundSize: '200% 200%',
          animation: 'lp-gradient-shift 8s ease-in-out infinite',
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
          background: 'linear-gradient(160deg, #1E1B4B 0%, #312E81 100%)',
          textAlign: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: '-20%', right: '-15%',
            width: 260, height: 260, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.25), transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: '-10%', left: '-15%',
            width: 220, height: 220, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(14,165,164,0.2), transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Logo */}
          <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
            <img
              src={LOGO_URL}
              alt="PulseTrade Logo"
              style={{
                width: 130,
                height: 130,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid rgba(139,92,246,0.5)',
                boxShadow: '0 0 36px rgba(139,92,246,0.4), 0 10px 30px rgba(0,0,0,0.3)',
              }}
            />
          </div>

          <div style={{
            display: 'inline-block', fontSize: 11, fontWeight: 800,
            color: '#4ADE80', backgroundColor: 'rgba(34,197,94,0.15)',
            padding: '5px 14px', borderRadius: 20,
            border: '1px solid rgba(34,197,94,0.3)', marginBottom: 10, position: 'relative', zIndex: 1,
          }}>
            ✅ NSE • BSE Live Data
          </div>
          <br />
          <div style={{
            display: 'inline-block', fontSize: 11, fontWeight: 700,
            color: '#FBBF24', backgroundColor: 'rgba(251,191,36,0.14)',
            padding: '4px 12px', borderRadius: 20, marginBottom: 16, position: 'relative', zIndex: 1,
            border: '1px solid rgba(251,191,36,0.35)',
          }}>
            🔱 Official Launch: 14 July 2026
          </div>

          <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 26, fontWeight: 800, lineHeight: 1.25, margin: '0 0 10px', letterSpacing: '-0.3px', color: '#FFFFFF', position: 'relative', zIndex: 1 }}>
            India's #1 NSE/BSE<br />
            <span style={{
              background: 'linear-gradient(120deg, #A78BFA, #5EEAD4)',
              WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
            }}>Swing Trading Analysis Tool</span>
          </h1>

          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, margin: '0 0 8px', fontWeight: 600, position: 'relative', zIndex: 1 }}>
            10 Din se 2 Mahine —
          </p>
          <p style={{ fontSize: 14, color: '#A78BFA', lineHeight: 1.6, margin: '0 0 28px', fontWeight: 700, position: 'relative', zIndex: 1 }}>
            Sahi Trend, Sahi Time, Faisla Khud Karo! 🎯
          </p>

          <button onClick={onLogin} style={{
            display: 'block', width: '100%',
            padding: '16px', fontSize: 17, fontWeight: 800,
            borderRadius: 16, border: 'none',
            background: 'linear-gradient(160deg, #6366F1, #4F46E5 55%, #0EA5A4)',
            color: '#FFF', cursor: 'pointer',
            boxShadow: '0 6px 0 #3730A3, 0 16px 32px rgba(79,70,229,0.5)',
            marginBottom: 18, position: 'relative', zIndex: 1,
          }}>
            🎯 Trial Pack Se Shuru Karo — ₹95 Se
          </button>
          <div style={{
            display: 'inline-block', fontSize: 12, fontWeight: 800,
            color: '#4ADE80', backgroundColor: 'rgba(34,197,94,0.15)',
            padding: '6px 16px', borderRadius: 20,
            border: '1px solid rgba(34,197,94,0.3)', marginBottom: 12, position: 'relative', zIndex: 1,
          }}>
            🔒 Secure Payment via Cashfree — Instant Access
          </div><br />
          <p style={{ fontSize: 12, color: '#A78BFA', margin: 0, fontWeight: 700, position: 'relative', zIndex: 1 }}>
            🔢 Technical + Numerology — Double Confirmation Har Trade Pe
          </p>
        </div>

        {/* SWING TRADING BADGE */}
        <div style={{
          background: 'linear-gradient(160deg, #FFFFFF, #EEF2FF)',
          border: `1px solid ${COLORS.gold}33`,
          margin: '16px',
          borderRadius: 18,
          padding: '16px 20px',
          textAlign: 'center',
          boxShadow: '0 8px 20px rgba(79,70,229,0.1), 0 1px 0 rgba(255,255,255,0.8) inset',
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
                background: 'linear-gradient(160deg, #FFFFFF, #FAFBFF)',
                border: `1px solid ${COLORS.surfaceBorder}`,
                borderRadius: 16, padding: '14px 12px',
                boxShadow: '0 6px 16px rgba(30,27,75,0.06), 0 1px 0 rgba(255,255,255,0.9) inset',
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
          background: 'linear-gradient(160deg, #FFFFFF, #FAFBFF)',
          border: `1px solid ${COLORS.surfaceBorder}`,
          borderRadius: 18, padding: '20px',
          textAlign: 'center',
          boxShadow: '0 6px 18px rgba(30,27,75,0.06), 0 1px 0 rgba(255,255,255,0.9) inset',
        }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.muted, fontWeight: 700, marginBottom: 16 }}>
            📊 STATS
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            {[
              { num: '🇮🇳', label: 'Made in India' },
              { num: '50+', label: 'Stocks Daily' },
              { num: '5★', label: 'Rating' },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, color: COLORS.gold }}>{s.num}</div>
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
              background: plan.popular
                ? 'linear-gradient(135deg, #4F46E5, #8B5CF6, #0EA5A4)'
                : 'linear-gradient(160deg, #FFFFFF, #FAFBFF)',
              border: plan.popular ? 'none' : `1px solid ${COLORS.surfaceBorder}`,
              borderRadius: 16, padding: '16px',
              marginBottom: 14,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              boxShadow: plan.popular
                ? '0 6px 0 #3730A3, 0 16px 30px rgba(79,70,229,0.32)'
                : `0 4px 0 ${COLORS.surfaceBorder}, 0 10px 20px rgba(30,27,75,0.06)`,
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: plan.popular ? '#FFF' : COLORS.text }}>{plan.label}</div>
                {plan.tag && <div style={{ fontSize: 11, color: plan.popular ? 'rgba(255,255,255,0.85)' : COLORS.goldDim, fontWeight: 700, marginTop: 2 }}>{plan.tag}</div>}
                <div style={{ fontSize: 11, color: plan.popular ? 'rgba(255,255,255,0.7)' : COLORS.muted, marginTop: 2 }}>{plan.per}</div>
              </div>
              <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, color: plan.popular ? '#FFF' : COLORS.gold }}>{plan.price}</div>
            </div>
          ))}
          <button onClick={onLogin} style={{
            display: 'block', width: '100%', marginTop: 8,
            padding: '15px', fontSize: 16, fontWeight: 800,
            borderRadius: 16, border: 'none',
            background: 'linear-gradient(160deg, #1E1B4B, #312E81)',
            color: '#FFF', cursor: 'pointer',
            boxShadow: '0 6px 0 #0F0D2E, 0 14px 28px rgba(30,27,75,0.4)',
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
          border: `1px solid #C7D2FE`,
          borderRadius: 14, padding: '12px 16px',
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
            <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 800 }}>
              <span style={{ color: COLORS.text }}>Pulse</span>
              <span style={{
                background: 'linear-gradient(120deg, #4F46E5, #0EA5A4)',
                WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
              }}>Trade</span>
            </div>
          </div>
          <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 12 }}>🔱 हर हर महादेव 🔱</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
            {[['Blog', '/blog'], ['Terms', '/terms'], ['Privacy', '/privacy'], ['Refund', '/refund'], ['Contact', '/contact']].map(([l, h], i, arr) => (
              <span key={l} style={{ display: 'flex', alignItems: 'center' }}>
                <a href={h} style={{ fontSize: 12, color: COLORS.muted, textDecoration: 'none', padding: '0 8px' }}>{l}</a>
                {i < arr.length - 1 && <span style={{ color: COLORS.surfaceBorder }}>•</span>}
              </span>
            ))}
          </div>
          <div style={{ fontSize: 11, color: COLORS.mutedLight }}>© 2026 PulseTrade</div>
        </div>

      </div>
    </div>
  );
                }
