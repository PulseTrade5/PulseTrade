import { useState } from 'react';

export default function MarketNewsBrief({ isDark, C }) {
  const [brief, setBrief] = useState(null);
  const [loading, setLoading] = useState(false);
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);

  const getBrief = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const today = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      const response = await fetch('/api/ai-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: `AAJ KI EXACT TAREEKH HAI: ${today} (year ${now.getFullYear()}). Kisi bhi aur saal ka mention mat karo, sirf yehi tareekh use karo. NSE/BSE Indian stock market ke liye ek chhota market brief do — 3-4 lines mein Hinglish mein. Cover karo: 1) Global cues (US markets, Asian markets, crude/gold trend) 2) Aaj Nifty/Sensex ka overall mood kaisa reh sakta hai 3) Kis sector pe dhyan rakhna chahiye. Simple, general terms mein rakho — specific numbers ya predictions mat do, sirf general sentiment/context do.`,
          context: `Exact Date: ${today}, Year: ${now.getFullYear()}, Market: NSE/BSE India`
        })
      });
      const data = await response.json();
      setBrief(data.answer || 'Brief nahi mila, dobara try karo.');
      setShown(true);
    } catch {
      setBrief('Network error — dobara try karo!');
      setShown(true);
    }
    setLoading(false);
  };

  const copyForWhatsApp = () => {
    if (!brief) return;
    const cleanBrief = brief.replace(/\*\*/g, '').replace(/\*/g, '').replace(/##/g, '');
    const formatted = `🔱 *PulseTrade Market Update* — ${today}\n\n${cleanBrief}\n\n🔍 Detailed analysis: pulsetrade.in\n🔱 हर हर महादेव 🔱`;
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div style={{
      background: isDark
        ? 'linear-gradient(135deg, #0D1F3C, #161B22)'
        : 'linear-gradient(135deg, #EFF6FF, #FFFFFF)',
      border: '1.5px solid #2563EB',
      borderRadius: 16, padding: 18, marginBottom: 16,
      boxShadow: '0 4px 20px rgba(37,99,235,0.15)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 2, color: '#2563EB', fontWeight: 800 }}>📰 AAJ KA MARKET BRIEF</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{today}</div>
        </div>
      </div>

      {!shown ? (
        <button onClick={getBrief} disabled={loading} style={{
          width: '100%', padding: '14px', borderRadius: 12, border: 'none',
          background: loading ? C.surfaceBorder : 'linear-gradient(135deg, #2563EB, #60A5FA)',
          color: loading ? C.muted : '#FFF',
          fontSize: 14, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: loading ? 'none' : '0 4px 20px rgba(37,99,235,0.3)',
        }}>
          {loading ? '📰 Brief taiyar ho raha hai...' : '📰 Aaj Ka Market Brief Dekho'}
        </button>
      ) : (
        <div>
          <div style={{
            padding: '14px', borderRadius: 12,
            backgroundColor: isDark ? 'rgba(37,99,235,0.1)' : 'rgba(37,99,235,0.06)',
            border: '1px solid rgba(37,99,235,0.2)',
            fontSize: 13, color: C.text, lineHeight: 1.8,
          }}>
            {brief.replace(/\*\*/g, '').replace(/\*/g, '').replace(/##/g, '')}
          </div>

          <button onClick={copyForWhatsApp} style={{
            width: '100%', marginTop: 10, padding: '11px',
            fontSize: 13, fontWeight: 700, borderRadius: 10, border: 'none',
            background: copied ? '#16A34A' : 'linear-gradient(135deg, #25D366, #128C7E)',
            color: '#FFF', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <span style={{ fontSize: 16 }}>📱</span>
            {copied ? '✅ Copy Ho Gaya! WhatsApp Channel Pe Paste Karo' : 'WhatsApp Channel Ke Liye Copy Karo'}
          </button>

          <button onClick={() => { setShown(false); setBrief(null); }} style={{
            width: '100%', marginTop: 8, padding: '8px',
            backgroundColor: 'transparent', border: `1px solid rgba(37,99,235,0.3)`,
            borderRadius: 8, color: '#2563EB', fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}>🔄 Refresh Karo</button>
        </div>
      )}

      <div style={{ fontSize: 10, color: C.muted, marginTop: 10, textAlign: 'center' }}>
        ⚠️ General market context — investment advice nahi
      </div>
    </div>
  );
}
