import { useState, useEffect } from 'react';

function reduceToSingle(num) {
  while (num > 9 && num !== 11 && num !== 22) {
    num = String(num).split('').map(Number).reduce((a, b) => a + b, 0);
  }
  return num;
}

function getLifePath(dob) {
  if (!dob) return null;
  const digits = dob.replace(/-/g, '').split('').map(Number);
  return reduceToSingle(digits.reduce((a, b) => a + b, 0));
}

function getDateNumber(date) {
  const dateStr = `${date.getDate()}${date.getMonth() + 1}${date.getFullYear()}`;
  const sum = dateStr.split('').map(Number).reduce((a, b) => a + b, 0);
  return reduceToSingle(sum);
}

const WEEKDAY = {
  0: { name: 'Raviwar', planet: '☀️ Surya', sector: 'Energy, PSU' },
  1: { name: 'Somwar', planet: '🌙 Chandra', sector: 'FMCG, Pharma' },
  2: { name: 'Mangalwar', planet: '🔴 Mangal', sector: 'Defense, Steel' },
  3: { name: 'Budhwar', planet: '💚 Budh', sector: 'IT, Telecom' },
  4: { name: 'Guruwar', planet: '🟡 Guru', sector: 'Banking, Finance' },
  5: { name: 'Shukrawar', planet: '✨ Shukra', sector: 'Auto, Luxury' },
  6: { name: 'Shaniwar', planet: '⚫ Shani', sector: 'Market closed' },
};

const EVENING_LINES = [
  'Aaj ka din review karo, kal ke liye fresh soch ke aao.',
  'Raat ko plan banane walon ko subah confusion nahi hoti.',
  'Kal ka setup abhi dekh lo, subah emotional decision nahi lena padega.',
  'Discipline raat ko banta hai, subah sirf follow karna hota hai.',
];

function pickLine(pool, seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) % 100000;
  return pool[hash % pool.length];
}

export default function TomorrowPreview({ isDark, userDob, C }) {
  const [now, setNow] = useState(new Date());
  const [copied, setCopied] = useState(false);
  const [niftyData, setNiftyData] = useState(null);
  const [niftyLoading, setNiftyLoading] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000); // refresh every minute
    return () => clearInterval(t);
  }, []);

  const hour = now.getHours();
  const minute = now.getMinutes();
  const isEveningWindow = (hour >= 18 && hour < 20) || (hour === 20 && minute <= 30); // 6:00 PM – 8:30 PM

  useEffect(() => {
    if (!isEveningWindow || niftyData || niftyLoading) return;
    setNiftyLoading(true);
    fetch('/api/get-stock-data?symbol=%5ENSEI&range=5d')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        const candles = data?.candles;
        if (candles && candles.length >= 2) {
          const last = candles[candles.length - 1].close;
          const prev = candles[candles.length - 2].close;
          if (last != null && prev != null) {
            const change = last - prev;
            const changePercent = (change / prev) * 100;
            setNiftyData({ price: last, change, changePercent });
          }
        }
      })
      .catch(() => {})
      .finally(() => setNiftyLoading(false));
  }, [isEveningWindow]);


  if (!isEveningWindow) return null;

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const weekdayInfo = WEEKDAY[tomorrow.getDay()];
  const isMarketClosed = tomorrow.getDay() === 0 || tomorrow.getDay() === 6;

  const lifePath = getLifePath(userDob);
  const dayNum = getDateNumber(tomorrow);
  const isPersonalMatch = lifePath ? lifePath === dayNum : false;

  const tomorrowStr = tomorrow.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  const copyForWhatsApp = () => {
    let text;
    if (isMarketClosed) {
      text = `🔱 *PulseTrade — Kal Kya Hoga* — ${tomorrowStr}\n\n🏖️ Kal ${weekdayInfo.name} hai — market band rahega. Weekend pe watchlist review kar lo!\n\n🔍 pulsetrade.in\n🔱 हर हर महादेव 🔱`;
    } else {
      const niftyLine = niftyData
        ? `\n📊 Nifty 50: ${niftyData.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })} (${niftyData.change >= 0 ? '▲' : '▼'} ${Math.abs(niftyData.changePercent || 0).toFixed(2)}%)\n`
        : '\n';
      text = `🔱 *PulseTrade — Kal Kya Hoga* — ${tomorrowStr}\n${niftyLine}✨ Lucky Number: #${dayNum}\n${weekdayInfo.planet} · Favorable Sector: ${weekdayInfo.sector}${isPersonalMatch ? `\n⭐ Personal Lucky Din (Life Path ${lifePath} se match!)` : ''}\n\n🔍 pulsetrade.in\n🔱 हर हर महादेव 🔱`;
    }
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div style={{
      position: 'relative', overflow: 'hidden', textAlign: 'center',
      background: isDark
        ? 'linear-gradient(135deg, #1E1B4B 0%, #4F46E5 55%, #0EA5A4 100%)'
        : 'linear-gradient(135deg, #312E81 0%, #6366F1 55%, #14B8A6 100%)',
      borderRadius: 24, padding: '24px 20px', marginBottom: 20,
      boxShadow: '0 8px 0 rgba(0,0,0,0.15), 0 18px 32px rgba(79,70,229,0.28), 0 2px 0 rgba(255,255,255,0.25) inset',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.16), transparent)',
        pointerEvents: 'none',
      }} />

      <div style={{ fontSize: 9.5, letterSpacing: 2.5, color: 'rgba(255,255,255,0.85)', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', position: 'relative', zIndex: 1 }}>
        🌙 Kal Kya Hoga
      </div>
      <div style={{ fontFamily: "'Sora', system-ui, sans-serif", fontSize: 20, fontWeight: 800, color: '#FFF', marginBottom: 4, position: 'relative', zIndex: 1 }}>
        Kal Ka Setup Dekho
      </div>
      <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.8)', marginBottom: 16, position: 'relative', zIndex: 1 }}>
        {tomorrowStr}
      </div>

      {isMarketClosed ? (
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 14, padding: '16px',
          fontSize: 13, color: '#FFF', fontWeight: 700, position: 'relative', zIndex: 1,
        }}>
          🏖️ Kal {weekdayInfo.name} hai — market band rahega. Aaj araam se planning karo, weekend pe apna watchlist review kar lo!
        </div>
      ) : (
        <>
          {niftyData && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: '10px 16px',
              marginBottom: 14, position: 'relative', zIndex: 1,
            }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: 700 }}>NIFTY 50 (Aaj Band)</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#FFF' }}>
                {niftyData.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </span>
              <span style={{
                fontSize: 12, fontWeight: 700,
                color: niftyData.change >= 0 ? '#4ADE80' : '#F87171',
              }}>
                {niftyData.change >= 0 ? '▲' : '▼'} {Math.abs(niftyData.changePercent || 0).toFixed(2)}%
              </span>
            </div>
          )}

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 16, padding: '10px 18px',
            marginBottom: 14, position: 'relative', zIndex: 1,
          }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: '#FFF' }}>#{dayNum}</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.85)', fontWeight: 700 }}>Kal Ka Lucky Number</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{weekdayInfo.planet} · {weekdayInfo.sector}</div>
            </div>
          </div>

          {isPersonalMatch && (
            <div style={{
              fontSize: 12, fontWeight: 800, color: '#FFF',
              backgroundColor: 'rgba(255,255,255,0.22)', padding: '8px 14px', borderRadius: 12,
              marginBottom: 12, position: 'relative', zIndex: 1,
            }}>
              ⭐ Kal tera personal lucky din hai — Life Path {lifePath} se match!
            </div>
          )}

          <div style={{
            backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: '10px 14px',
            marginBottom: 14, fontSize: 12.5, color: '#FFF', position: 'relative', zIndex: 1,
          }}>
            🎯 Kal <strong>{weekdayInfo.sector}</strong> sector pe dhyan rakhna favorable rahega
          </div>

          <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.88)', lineHeight: 1.6, marginBottom: 14, position: 'relative', zIndex: 1 }}>
            💡 {pickLine(EVENING_LINES, tomorrow.toDateString() + (userDob || ''))}
          </div>
        </>
      )}

      <button onClick={copyForWhatsApp} style={{
        width: '100%', padding: '11px', border: 'none', borderRadius: 12, marginTop: 4,
        background: copied ? '#16A34A' : 'linear-gradient(135deg, #25D366, #128C7E)',
        color: '#FFF', fontSize: 13, fontWeight: 700, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        position: 'relative', zIndex: 1,
      }}>
        <span style={{ fontSize: 16 }}>📱</span>
        {copied ? '✅ Copy Ho Gaya! WhatsApp Pe Paste Karo' : 'WhatsApp Channel Ke Liye Copy Karo'}
      </button>
    </div>
  );
}

