import { useEffect, useState } from 'react';

const COLORS = {
  bg: "#F4F6FA", surface: "#FFFFFF", surfaceBorder: "#E2E8F0",
  gold: "#C8920A", goldLight: "#FEF3C7", goldDim: "#D97706",
  green: "#059669", greenLight: "#ECFDF5",
  text: "#0F172A", muted: "#64748B", mutedLight: "#94A3B8",
};

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
          <button
            onClick={onLogin}
            style={{
              padding: '8px 20px', fontSize: 13, fontWeight: 700,
              borderRadius: 20, border: `1.5px solid ${COLORS.gold}`,
              backgroundColor: 'transparent', color: COLORS.gold,
              cursor: 'pointer',
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
          {/* Badge */}
          <div style={{
            display: 'inline-block', fontSize: 11, fontWeight: 800,
            color: COLORS.green, backgroundColor: COLORS.greenLight,
            padding: '5px 14px', borderRadius: 20,
            border: '1px solid #bbf7d0', marginBottom: 20,
          }}>
            ✅ NSE • BSE Live Data
          </div>

          {/* Main heading */}
          <h1 style={{ fontSize: 32, fontWeight: 900, lineHeight: 1.2, margin: '0 0 16px', letterSpacing: '-1px' }}>
            Bazaar ka pulse dekho,<br />
            <span style={{ color: COLORS.gold }}>faisla khud karo.</span>
          </h1>

          {/* Subheading */}
          <p style={{ fontSize: 15, color: COLORS.muted, lineHeight: 1.7, margin: '0 0 28px' }}>
            NSE/BSE stocks ka AI-powered<br />technical analysis — Hinglish mein. 🇮🇳
          </p>

          {/* CTA Button */}
          <button
            onClick={onLogin}
            style={{
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

      </div>
    </div>
  );
}
