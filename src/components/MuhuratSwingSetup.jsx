import { useState, useEffect } from 'react';
import { analyzeStock } from './technicalAnalysis';

const NIFTY20 = [
  'RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK',
  'SBIN', 'TATAMOTORS', 'ITC', 'WIPRO', 'AXISBANK',
  'KOTAKBANK', 'LT', 'SUNPHARMA', 'BAJFINANCE', 'MARUTI',
  'ULTRACEMCO', 'TITAN', 'NESTLEIND', 'POWERGRID', 'ONGC',
];

const WEEKDAY_INFO = {
  1: { name: 'Somwar', planet: '🌙 Chandra', sector: 'FMCG, Pharma' },
  2: { name: 'Mangalwar', planet: '🔴 Mangal', sector: 'Defense, Steel' },
  3: { name: 'Budhwar', planet: '💚 Budh', sector: 'IT, Telecom' },
  4: { name: 'Guruwar', planet: '🟡 Guru', sector: 'Banking, Finance' },
  5: { name: 'Shukrawar', planet: '✨ Shukra', sector: 'Auto, Luxury' },
};
const WEEKDAY_ORDER = [1, 2, 3, 4, 5];

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
const CHALDEAN_MAP = {
  a:1,i:1,j:1,q:1,y:1, b:2,k:2,r:2, c:3,g:3,l:3,s:3,
  d:4,m:4,t:4, e:5,h:5,n:5,x:5, u:6,v:6,w:6, o:7,z:7, f:8,p:8,
};
function getChaldean(name) {
  if (!name) return null;
  let sum = name.toLowerCase().replace(/[^a-z]/g, '').split('').reduce((a, c) => a + (CHALDEAN_MAP[c] || 0), 0);
  return reduceToSingle(sum);
}
const NUM_COMPATIBLE = {
  1:[1,3,5,9], 2:[2,4,6,8], 3:[1,3,6,9], 4:[2,4,8],
  5:[1,5,6,9], 6:[3,5,6,9], 7:[2,7], 8:[2,4,8], 9:[1,3,5,9],
  11:[1,2,11], 22:[4,8,22],
};
function isNumMatch(userNum, stockNum) {
  if (!userNum || !stockNum) return false;
  const list = NUM_COMPATIBLE[userNum] || [];
  return list.includes(stockNum) || stockNum === userNum;
}

function getRankScore(r) {
  let score = r.trend === 'Bullish' ? r.longScore : r.shortScore;
  if (r.adx >= 25) score += 10;
  if (r.rsi >= 40 && r.rsi <= 65) score += 5;
  if (r.isLucky) score += 15;
  if (r.trend === 'Bearish') score -= 8;
  return score;
}

export default function MuhuratSwingSetup({ isDark, userDob, isSubscribed, C }) {
  const [now, setNow] = useState(new Date());
  const [scanning, setScanning] = useState(false);
  const [weekPlan, setWeekPlan] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const hour = now.getHours();
  const isSundayWindow = now.getDay() === 0 && hour >= 18 && hour < 21;

  const lifePath = getLifePath(userDob);

  const scanStock = async (symbol) => {
    try {
      const res = await fetch(`/api/get-stock-data?symbol=${symbol}.NS&range=1y`);
      const data = await res.json();
      if (!res.ok || !data.candles || data.candles.length < 50) return null;
      const analysis = analyzeStock(data.candles);
      if (analysis.error) return null;
      const stockNum = getChaldean(symbol);
      return {
        symbol,
        trend: analysis.trend,
        longScore: analysis.longScore,
        shortScore: analysis.shortScore,
        rsi: analysis.rsi,
        adx: analysis.adx,
        price: data.stockInfo?.regularMarketPrice || analysis.lastClose,
        stockNum,
        isLucky: isNumMatch(lifePath, stockNum),
      };
    } catch { return null; }
  };

  const runWeeklyScan = async () => {
    setScanning(true);
    const batchSize = 5;
    const all = [];
    for (let i = 0; i < NIFTY20.length; i += batchSize) {
      const batch = NIFTY20.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(scanStock));
      all.push(...batchResults.filter(Boolean));
    }
    const top5 = [...all].sort((a, b) => getRankScore(b) - getRankScore(a)).slice(0, 5);
    const plan = WEEKDAY_ORDER.map((wd, i) => ({
      weekday: wd,
      stock: top5[i] || null,
    }));
    setWeekPlan(plan);
    setScanning(false);
  };

  useEffect(() => {
    if (isSundayWindow && !weekPlan && !scanning) {
      runWeeklyScan();
    }
  }, [isSundayWindow]);

  if (!isSundayWindow) return null;

  const visiblePlan = isSubscribed ? weekPlan : (weekPlan ? [weekPlan[0]] : null);

  const copyForWhatsApp = () => {
    if (!visiblePlan) return;
    let text = `🔱 *PulseTrade — Muhurat Swing Setup*\n\n`;
    visiblePlan.forEach(p => {
      if (!p.stock) return;
      const wd = WEEKDAY_INFO[p.weekday];
      text += `${wd.name}: *${p.stock.symbol}* — ₹${Number(p.stock.price).toLocaleString('en-IN', { maximumFractionDigits: 0 })}${p.stock.isLucky ? ' ⭐' : ''}\n`;
    });
    text += `\n🔍 pulsetrade.in\n🔱 हर हर महादेव 🔱`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      background: isDark
        ? 'linear-gradient(135deg, #1E1B4B 0%, #4F46E5 55%, #7C3AED 100%)'
        : 'linear-gradient(135deg, #312E81 0%, #6366F1 55%, #7C3AED 100%)',
      borderRadius: 24, padding: '24px 20px', marginBottom: 20,
      boxShadow: '0 8px 0 rgba(0,0,0,0.15), 0 18px 32px rgba(79,70,229,0.28), 0 2px 0 rgba(255,255,255,0.25) inset',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.16), transparent)',
        pointerEvents: 'none',
      }} />

      <div style={{ textAlign: 'center', marginBottom: 18, position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 9.5, letterSpacing: 2.5, color: 'rgba(255,255,255,0.85)', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>
          🔱 Muhurat Swing Setup
        </div>
        <div style={{ fontFamily: "'Sora', system-ui, sans-serif", fontSize: 20, fontWeight: 800, color: '#FFF' }}>
          Is Hafte Ka Plan
        </div>
      </div>

      {scanning ? (
        <div style={{ textAlign: 'center', padding: '20px 0', color: '#FFF', fontSize: 13, position: 'relative', zIndex: 1 }}>
          ⏳ Top 5 stocks scan ho rahe hain...
        </div>
      ) : visiblePlan ? (
        <div style={{ position: 'relative', zIndex: 1 }}>
          {visiblePlan.map((p) => {
            const wd = WEEKDAY_INFO[p.weekday];
            if (!p.stock) return null;
            return (
              <div key={p.weekday} style={{
                backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: '12px 16px',
                marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>{wd.planet} {wd.name}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#FFF', marginTop: 2 }}>
                    {p.stock.symbol} {p.stock.isLucky && <span style={{ color: '#FBBF24' }}>⭐</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>₹{Number(p.stock.price).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                  <div style={{ fontSize: 10, color: p.stock.trend === 'Bullish' ? '#4ADE80' : '#F87171', fontWeight: 700 }}>
                    {p.stock.trend === 'Bullish' ? '🟢' : '🔴'} {p.stock.trend}
                  </div>
                </div>
              </div>
            );
          })}

          {!isSubscribed && (
            <div style={{
              backgroundColor: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.4)',
              borderRadius: 14, padding: '12px 16px', marginTop: 6, textAlign: 'center',
            }}>
              <div style={{ fontSize: 12.5, color: '#FBBF24', fontWeight: 700 }}>
                🔒 Baaki 4 din ka setup dekhne ke liye Subscribe karo
              </div>
            </div>
          )}

          <button onClick={copyForWhatsApp} style={{
            width: '100%', padding: '11px', border: 'none', borderRadius: 12, marginTop: 14,
            background: copied ? '#16A34A' : 'linear-gradient(135deg, #25D366, #128C7E)',
            color: '#FFF', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <span style={{ fontSize: 16 }}>📱</span>
            {copied ? '✅ Copy Ho Gaya!' : 'WhatsApp Ke Liye Copy Karo'}
          </button>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px 0', color: 'rgba(255,255,255,0.7)', fontSize: 13, position: 'relative', zIndex: 1 }}>
          Setup taiyar nahi ho paya, thodi der baad try karo.
        </div>
      )}

      <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: 14, lineHeight: 1.6, position: 'relative', zIndex: 1 }}>
        ✨ Technical + Numerology combined — sirf educational, investment advice nahi
      </div>
    </div>
  );
}
