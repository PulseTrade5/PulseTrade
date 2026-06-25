import { useState } from 'react';

export default function WelcomeScreen({ onDone }) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      emoji: '🔱',
      title: 'Welcome to PulseTrade!',
      desc: 'India ka smartest trading assistant — Hinglish mein!',
      sub: 'हर हर महादेव 🔱',
    },
    {
      emoji: '📊',
      title: 'Stock Trend Nikalo!',
      desc: 'Koi bhi NSE/BSE stock search karo — RSI, MACD, Supertrend sab ek jagah!',
      sub: 'Pulse Score se trend samjho',
    },
    {
      emoji: '🧠',
      title: 'Trader Psychology',
      desc: 'Har din apna mood check karo — Calm trader = Profitable trader!',
      sub: 'FOMO se bachao, capital bachao',
    },
    {
      emoji: '🌍',
      title: 'Global Markets',
      desc: 'Gold, Oil, Dow Jones, Bitcoin — sab ek nazar mein! India pe asar bhi samjho!',
      sub: 'Global se local tak',
    },
    {
      emoji: '🚀',
      title: 'Tu Ready Hai Bhai!',
      desc: 'Shubh trading! Discipline aur patience se bade results aate hain!',
      sub: 'Trade with Pulse, Profit with Discipline',
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'linear-gradient(160deg, #0D1117 0%, #0D2B1F 50%, #1a1100 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 32, fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      {/* Progress dots */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 40 }}>
        {steps.map((_, i) => (
          <div key={i} style={{
            width: i === step ? 24 : 8, height: 8, borderRadius: 99,
            backgroundColor: i === step ? '#C8920A' : i < step ? '#3FAE7C' : 'rgba(255,255,255,0.2)',
            transition: 'all 0.3s ease',
          }} />
        ))}
      </div>

      {/* Content */}
      <div style={{ textAlign: 'center', maxWidth: 360 }}>
        <div style={{ fontSize: 80, marginBottom: 24 }}>{current.emoji}</div>

        <h1 style={{
          fontSize: 28, fontWeight: 900, color: '#FFF',
          marginBottom: 16, lineHeight: 1.2,
        }}>
          {current.title}
        </h1>

        <p style={{
          fontSize: 16, color: 'rgba(255,255,255,0.7)',
          lineHeight: 1.7, marginBottom: 12,
        }}>
          {current.desc}
        </p>

        <p style={{
          fontSize: 13, color: '#C8920A', fontWeight: 600,
        }}>
          {current.sub}
        </p>
      </div>

      {/* Buttons */}
      <div style={{ marginTop: 48, width: '100%', maxWidth: 360 }}>
        <button
          onClick={() => isLast ? onDone() : setStep(s => s + 1)}
          style={{
            width: '100%', padding: '16px',
            backgroundColor: '#C8920A', color: '#0D1117',
            border: 'none', borderRadius: 14,
            fontSize: 17, fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(200,146,10,0.4)',
          }}
        >
          {isLast ? '🚀 Start Karo!' : 'Aage Chalo →'}
        </button>

        {!isLast && (
          <button
            onClick={onDone}
            style={{
              width: '100%', marginTop: 12, padding: '12px',
              backgroundColor: 'transparent', color: 'rgba(255,255,255,0.4)',
              border: 'none', fontSize: 14, cursor: 'pointer',
            }}
          >
            Skip karo
          </button>
        )}
      </div>
    </div>
  );
}
