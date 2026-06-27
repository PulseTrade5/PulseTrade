import { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';

const LUCKY_SECTORS = {
  1: 'Technology & Leadership', 2: 'Banking & Finance',
  3: 'Media & Communication', 4: 'Real Estate & Construction',
  5: 'FMCG & Travel', 6: 'Pharma & Healthcare',
  7: 'Research & Chemicals', 8: 'Energy & Infrastructure',
  9: 'Metal & Mining', 11: 'IT & Innovation', 22: 'Conglomerate',
};

const LUCKY_TIMES = {
  1: '9:15 - 10:30 AM', 2: '11:00 - 12:00 PM',
  3: '10:00 - 11:15 AM', 4: '2:00 - 3:00 PM',
  5: '9:15 - 10:00 AM', 6: '1:00 - 2:15 PM',
  7: '3:00 - 3:30 PM', 8: '11:30 AM - 1:00 PM',
  9: '9:30 - 11:00 AM', 11: '10:30 - 11:30 AM', 22: '12:00 - 1:30 PM',
};

const ENERGY = {
  1: 'Strong leadership energy — confident raho!',
  2: 'Patience ka din — wait for confirmation',
  3: 'Creative momentum — new opportunities possible',
  4: 'Stability ka din — safe trades prefer karo',
  5: 'Dynamic energy — quick moves possible',
  6: 'Balanced day — harmony mein trade karo',
  7: 'Analytical din — research pe focus karo',
  8: 'Power day — strong momentum expected',
  9: 'Completion energy — close open positions',
  11: 'Intuitive day — gut feel strong hogi',
  22: 'Master builder day — long term socho',
};

function getDayNumber() {
  const today = new Date();
  const dateStr = `${today.getDate()}${today.getMonth()+1}${today.getFullYear()}`;
  let sum = dateStr.split('').map(Number).reduce((a,b) => a+b, 0);
  while (sum > 9 && sum !== 11 && sum !== 22) {
    sum = String(sum).split('').map(Number).reduce((a,b) => a+b, 0);
  }
  return sum;
}

export default function NumerologyInsightCard({ isDark, C }) {
  const [visible, setVisible] = useState(false);
  const [sharing, setSharing] = useState(false);
  const cardRef = useRef(null);
  const dayNum = getDayNumber();
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-IN', { 
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
  });

  const handleShare = async () => {
    if (!cardRef.current || sharing) return;
    setSharing(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: isDark ? '#0D0D1A' : '#FAFAFA',
        useCORS: true,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) { setSharing(false); return; }
        const file = new File([blob], 'pulsetrade-numerology.png', { type: 'image/png' });

        // Try native share sheet first (works great for WhatsApp on mobile)
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: 'PulseTrade Numerology Insight',
              text: 'Aaj ka numerology insight dekho! 🔱 पल्सट्रेड',
            });
            setSharing(false);
            return;
          } catch (err) {
            // User cancelled share sheet — don't fall back to download
            setSharing(false);
            return;
          }
        }

        // Fallback: download the image directly
        const link = document.createElement('a');
        link.download = 'pulsetrade-numerology.png';
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
        setSharing(false);
      }, 'image/png');
    } catch (err) {
      console.error('Share failed:', err);
      setSharing(false);
    }
  };

  return (
    <div>
      <div ref={cardRef} style={{
        background: isDark
          ? 'linear-gradient(135deg, #0D0D1A, #1A1A00)'
          : 'linear-gradient(135deg, #FAFAFA, #FFFBEB)',
        border: `1.5px solid ${isDark ? '#D8A33D55' : '#F59E0B55'}`,
        borderRadius: 16, padding: 18, marginBottom: 12,
        boxShadow: '0 4px 20px rgba(216,163,61,0.1)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 2, color: isDark ? '#D8A33D' : '#D97706', fontWeight: 800 }}>
              🔢 AAJ KA NUMEROLOGY INSIGHT
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{dateStr}</div>
          </div>
          <div style={{
            width: 42, height: 42, borderRadius: '50%',
            background: 'linear-gradient(135deg, #D8A33D, #F59E0B)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 900, color: '#FFF',
            boxShadow: '0 2px 10px rgba(216,163,61,0.4)',
          }}>
            {dayNum}
          </div>
        </div>

        {/* Day Number Badge */}
        <div style={{
          background: isDark ? 'rgba(216,163,61,0.1)' : '#FFFBEB',
          border: `1px solid ${isDark ? '#D8A33D44' : '#FDE68A'}`,
          borderRadius: 12, padding: '12px 14px', marginBottom: 12,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>✨ Lucky Number</span>
            <span style={{ fontSize: 18, fontWeight: 900, color: isDark ? '#D8A33D' : '#D97706' }}>#{dayNum}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>⏰ Lucky Time</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{LUCKY_TIMES[dayNum]}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>🏦 Lucky Sector</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{LUCKY_SECTORS[dayNum]}</span>
          </div>
        </div>

        {/* Energy Message */}
        <div style={{
          background: isDark ? 'rgba(255,255,255,0.04)' : '#FFF',
          borderLeft: `3px solid ${isDark ? '#D8A33D' : '#F59E0B'}`,
          borderRadius: '0 10px 10px 0', padding: '10px 14px',
          fontSize: 13, color: C.text, lineHeight: 1.6, fontWeight: 500,
          marginBottom: 10,
        }}>
          ⚡ {ENERGY[dayNum]}
        </div>

        {/* Branding (shows in shared image) */}
        <div style={{ textAlign: 'center', fontSize: 11, color: isDark ? '#D8A33D' : '#D97706', fontWeight: 700, marginBottom: 6 }}>
          🔱 PulseTrade — pulsetrade.in 🔱
        </div>

        {/* Disclaimer */}
        <div style={{ fontSize: 10, color: C.muted, textAlign: 'center' }}>
          ✨ Sirf numerology insight — investment advice nahi
        </div>
      </div>

      {/* Share Button (stays outside the captured card) */}
      <button onClick={handleShare} disabled={sharing} style={{
        width: '100%', padding: '11px',
        fontSize: 13, fontWeight: 700, borderRadius: 10, border: 'none',
        background: sharing ? '#94A3B8' : 'linear-gradient(135deg, #25D366, #128C7E)',
        color: '#FFF', cursor: sharing ? 'not-allowed' : 'pointer',
        marginBottom: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      }}>
        <span style={{ fontSize: 16 }}>📱</span>
        {sharing ? 'Taiyar ho raha hai...' : 'WhatsApp Pe Share Karo'}
      </button>
    </div>
  );
}
