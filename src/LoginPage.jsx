import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

const COLORS = {
  bg: "#F4F6FA", surface: "#FFFFFF", surfaceBorder: "#E2E8F0",
  gold: "#C8920A", goldLight: "#FEF3C7", goldDim: "#D97706",
  green: "#059669", greenLight: "#ECFDF5", red: "#DC2626",
  text: "#0F172A", muted: "#64748B", mutedLight: "#94A3B8",
  sebi: "#1E3A5F", sebiBg: "#EFF6FF", sebiBorder: "#BFDBFE",
  purple: "#7C3AED", purpleLight: "#EDE9FE",
};

function getMsUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}

function fmtCountdown(ms) {
  if (ms <= 0) return "00:00:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map(n => String(n).padStart(2, "0")).join(":");
}

function getRashi(dob) {
  if (!dob) return null;
  const date = new Date(dob);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return { name: 'Mesh', sign: '♈', en: 'Aries' };
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return { name: 'Vrishabh', sign: '♉', en: 'Taurus' };
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return { name: 'Mithun', sign: '♊', en: 'Gemini' };
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return { name: 'Kark', sign: '♋', en: 'Cancer' };
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return { name: 'Simha', sign: '♌', en: 'Leo' };
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return { name: 'Kanya', sign: '♍', en: 'Virgo' };
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return { name: 'Tula', sign: '♎', en: 'Libra' };
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return { name: 'Vrishchik', sign: '♏', en: 'Scorpio' };
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return { name: 'Dhanu', sign: '♐', en: 'Sagittarius' };
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return { name: 'Makar', sign: '♑', en: 'Capricorn' };
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return { name: 'Kumbh', sign: '♒', en: 'Aquarius' };
  return { name: 'Meen', sign: '♓', en: 'Pisces' };
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [msLeft, setMsLeft] = useState(getMsUntilMidnight());
  const [verifySuccess, setVerifySuccess] = useState(false);
  const [refCode, setRefCode] = useState('');

  useEffect(() => {
    const t = setInterval(() => setMsLeft(getMsUntilMidnight()), 1000);
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) setRefCode(ref);
    return () => clearInterval(t);
  }, []);

  const rashi = getRashi(dob);

  const handleSendOtp = async () => {
    const trimmed = email.trim().toLowerCase();
    const nameTrimmed = name.trim();
    if (!nameTrimmed) { setError('Apna naam daalo.'); return; }
    if (!trimmed || !trimmed.includes('@')) { setError('Sahi email daalo.'); return; }
    setLoading(true); setError('');
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: { shouldCreateUser: true },
      });
      if (otpError) throw otpError;
      setStep('otp');
    } catch (err) {
      setError('Kuch gadbad hui, dobara try karo.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const trimmed = otp.trim();
    if (!trimmed || trimmed.length < 6) { setError('6 digit OTP daalo.'); return; }
    setLoading(true); setError('');
    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: trimmed,
        type: 'email',
      });
      if (verifyError) throw verifyError;
      if (data?.session) {
        setVerifySuccess(true);

        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });

        const userRefCode = name.trim().replace(/\s+/g, '').toLowerCase() + Math.floor(Math.random() * 100);

        const { error: upsertError } = await supabase.from('profiles').upsert({
          id: data.session.user.id,
          email: email.trim().toLowerCase(),
          name: name.trim(),
          dob: dob || null,
          trial_start_date: new Date().toISOString(),
          referral_code: userRefCode,
          referred_by: refCode || null,
        }, { onConflict: 'id', ignoreDuplicates: false });

        if (upsertError) {
          await supabase.from('profiles')
            .update({ name: name.trim(), dob: dob || null })
            .eq('id', data.session.user.id);
        }

        if (refCode) {
          const { data: referrer } = await supabase
            .from('profiles')
            .select('id')
            .eq('referral_code', refCode.toLowerCase())
            .single();

          if (referrer) {
            const { data: pts } = await supabase
              .from('pulse_points')
              .select('total_points, referral_count')
              .eq('user_id', referrer.id)
              .single();

            if (pts) {
              await supabase.from('pulse_points')
                .update({ total_points: (pts.total_points || 0) + 100 })
                .eq('user_id', referrer.id);
            }

            await supabase.from('profiles')
              .update({ referral_count: supabase.rpc('increment', { row_id: referrer.id }) })
              .eq('id', referrer.id);

            await supabase.from('pulse_points').upsert({
              user_id: data.session.user.id,
              total_points: 50,
              streak_days: 0,
              badges: [],
            }, { onConflict: 'user_id' });
          }
        }

        await new Promise(r => setTimeout(r, 800));
        window.location.href = '/';
      } else {
        setError('Session nahi mila. Dobara try karo.');
      }
    } catch (err) {
      setError('OTP galat hai ya expire ho gaya.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '13px 16px', fontSize: 15,
    backgroundColor: COLORS.bg, border: `1.5px solid ${COLORS.surfaceBorder}`,
    borderRadius: 12, color: COLORS.text, outline: 'none',
    boxSizing: 'border-box', fontFamily: 'Inter, sans-serif',
  };

  const cardStyle = {
    backgroundColor: COLORS.surface, border: `1px solid ${COLORS.surfaceBorder}`,
    borderRadius: 16, padding: 18, marginBottom: 14,
    boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
  };

  return (
    <div style={{ backgroundColor: COLORS.bg, minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif', color: COLORS.text }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 0 48px' }}>

        {/* HEADER */}
        <div style={{ backgroundColor: COLORS.surface, borderBottom: `1px solid ${COLORS.surfaceBorder}`, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 100 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
              Pulse<span style={{ color: COLORS.gold }}>Trade</span>
            </h1>
            <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 1 }}>🔱 हर हर महादेव 🔱</div>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.green, backgroundColor: COLORS.greenLight, padding: '5px 12px', borderRadius: 20, border: `1px solid #bbf7d0` }}>
            ✅ NSE • BSE Live
          </div>
        </div>

        {/* SEBI */}
        <div style={{ backgroundColor: COLORS.sebiBg, borderBottom: `2px solid ${COLORS.sebiBorder}`, padding: '10px 20px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>🛡️</span>
          <div style={{ fontSize: 11, color: COLORS.sebi, lineHeight: 1.6 }}>
            <strong>SEBI Disclaimer:</strong> Yeh platform sirf technical trend analysis provide karta hai — investment advice nahi hai.
          </div>
        </div>

        {/* REFERRAL BANNER */}
        {refCode && (
          <div style={{ background: 'linear-gradient(135deg, #7C3AED, #4F46E5)', padding: '12px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#FFF' }}>🎁 {refCode} ne tumhe invite kiya!</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>Join karo → Tumhe +50 Pulse Points milenge! 🎉</div>
          </div>
        )}

        {/* SOCIAL PROOF */}
        <div style={{ backgroundColor: COLORS.text, padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <div style={{ display: 'flex' }}>
            {['👨', '👩', '🧑', '👨', '👩'].map((e, i) => (
              <div key={i} style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: COLORS.goldLight, border: `2px solid ${COLORS.text}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, marginLeft: i === 0 ? 0 : -8 }}>{e}</div>
            ))}
          </div>
          <div style={{ fontSize: 12, color: '#FFF', fontWeight: 600 }}>
            <span style={{ color: COLORS.gold, fontWeight: 800 }}>500+</span> Indian traders already joined! 🚀
          </div>
        </div>

        <div style={{ padding: '20px 20px 0' }}>

          {/* HERO */}
          <div style={{ ...cardStyle, textAlign: 'center', padding: '28px 20px', background: `linear-gradient(135deg, #ffffff 0%, ${COLORS.goldLight} 100%)`, border: `1.5px solid #f0c040` }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📈</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: COLORS.text, margin: '0 0 8px' }}>
              Bazaar ka pulse dekho,<br />
              <span style={{ color: COLORS.gold }}>faisla khud karo.</span>
            </h2>
            <p style={{ fontSize: 13, color: COLORS.muted, margin: '0 0 16px', lineHeight: 1.6 }}>
              NSE/BSE stocks ka AI-powered technical analysis — Hinglish mein.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {['🎯 Trend Analysis', '📊 RSI • MACD • ADX', '🔊 Pulse Bolta Hai', '⭐ Watchlist', '📧 Email Alerts', '🪐 Pulse Astro'].map(f => (
                <span key={f} style={{ fontSize: 11, fontWeight: 700, color: COLORS.goldDim, backgroundColor: COLORS.goldLight, padding: '5px 12px', borderRadius: 20, border: `1px solid #f0c040` }}>{f}</span>
              ))}
            </div>
          </div>

          {/* TRIAL OFFER */}
          <div style={{ ...cardStyle, border: `2px solid ${COLORS.gold}`, textAlign: 'center' }}>
            <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 800, color: '#FFF', backgroundColor: COLORS.red, padding: '4px 14px', borderRadius: 20, marginBottom: 10 }}>🔥 LIMITED TIME OFFER</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.text, marginBottom: 4 }}>5-Din FREE Trial 🎉</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.goldDim, backgroundColor: COLORS.goldLight, display: 'inline-block', padding: '7px 18px', borderRadius: 10, marginBottom: 6, fontFamily: 'monospace' }}>
              ⏳ Offer ends in {fmtCountdown(msLeft)}
            </div>
            <div style={{ fontSize: 11, color: COLORS.muted }}>Phir plans: ₹599 / ₹1,049 / ₹1,499</div>
          </div>

          {/* LOGIN CARD */}
          <div style={cardStyle}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.muted, fontWeight: 700, marginBottom: 14 }}>🔑 LOGIN / SIGNUP</div>

            {step === 'email' ? (
              <div>
                {/* NAAM */}
                <label style={{ fontSize: 12, color: COLORS.muted, fontWeight: 600, display: 'block', marginBottom: 6 }}>Apna Naam Daalo 👤</label>
                <input type="text" value={name} onChange={e => { setName(e.target.value); setError(''); }} onKeyDown={e => e.key === 'Enter' && handleSendOtp()} placeholder="e.g. Rahul, Priya" style={{ ...inputStyle, marginBottom: 12 }} />

                {/* EMAIL */}
                <label style={{ fontSize: 12, color: COLORS.muted, fontWeight: 600, display: 'block', marginBottom: 6 }}>Apna Email Daalo 📧</label>
                <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} onKeyDown={e => e.key === 'Enter' && handleSendOtp()} placeholder="tumhara@email.com" style={{ ...inputStyle, marginBottom: 12 }} />

                {/* DOB */}
                <label style={{ fontSize: 12, color: COLORS.muted, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Janam Tithi 🪐 <span style={{ fontSize: 10, color: COLORS.mutedLight, fontWeight: 400 }}>(optional — Pulse Astro ke liye)</span>
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={e => setDob(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  style={{ ...inputStyle, marginBottom: 8 }}
                />

                {/* RASHI PREVIEW */}
                {rashi && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    backgroundColor: '#fdf4ff', border: '1.5px solid #e9d5ff',
                    borderRadius: 10, padding: '10px 14px', marginBottom: 12,
                  }}>
                    <span style={{ fontSize: 22 }}>{rashi.sign}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#7C3AED' }}>
                        Teri Rashi: {rashi.name} ({rashi.en})
                      </div>
                      <div style={{ fontSize: 11, color: '#9333ea' }}>
                        🪐 Personalized Pulse Astro milega!
                      </div>
                    </div>
                  </div>
                )}

                {error && <p style={{ fontSize: 12, color: COLORS.red, marginTop: 6, fontWeight: 600 }}>{error}</p>}
                <button onClick={handleSendOtp} disabled={loading} style={{ width: '100%', marginTop: 4, padding: '14px', fontSize: 15, fontWeight: 700, borderRadius: 12, border: 'none', backgroundColor: loading ? '#CBD5E1' : COLORS.gold, color: '#FFF', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 2px 14px rgba(200,146,10,0.35)' }}>
                  {loading ? '⏳ Bhej rahe hain...' : '📨 OTP Bhejo'}
                </button>
                <p style={{ fontSize: 11, color: COLORS.muted, marginTop: 10, textAlign: 'center', lineHeight: 1.6 }}>
                  New user? Naam + Email daalo — account + 5-din trial automatically shuru hoga ✨
                </p>
              </div>
            ) : (
              <div>
                <div style={{ backgroundColor: COLORS.greenLight, borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: COLORS.green, fontWeight: 600 }}>
                  ✅ OTP bheja — <strong>{email}</strong> check karo!
                </div>
                <label style={{ fontSize: 12, color: COLORS.muted, fontWeight: 600, display: 'block', marginBottom: 6 }}>6-Digit OTP Daalo</label>
                <input type="number" value={otp} onChange={e => { setOtp(e.target.value.slice(0, 6)); setError(''); }} onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()} placeholder="123456" style={{ ...inputStyle, fontSize: 28, fontWeight: 800, letterSpacing: 8, textAlign: 'center' }} />
                {error && <p style={{ fontSize: 12, color: COLORS.red, marginTop: 6, fontWeight: 600 }}>{error}</p>}
                <button onClick={handleVerifyOtp} disabled={loading || verifySuccess} style={{
                  width: '100%', marginTop: 12, padding: '14px',
                  fontSize: 15, fontWeight: 700, borderRadius: 12, border: 'none',
                  backgroundColor: verifySuccess ? COLORS.green : loading ? '#CBD5E1' : COLORS.green,
                  color: '#FFF', cursor: (loading || verifySuccess) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                }}>
                  {verifySuccess ? '🎉 Welcome! Dashboard khul raha hai...' : loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <span style={{ width: 16, height: 16, border: '2px solid #FFF', borderTop: '2px solid transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                      Verify ho raha hai...
                      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </span>
                  ) : '✅ OTP Verify Karo — Andar Jao!'}
                </button>
                <button onClick={() => { setStep('email'); setOtp(''); setError(''); }} style={{ width: '100%', marginTop: 10, padding: '10px', fontSize: 13, fontWeight: 600, borderRadius: 10, border: `1px solid ${COLORS.surfaceBorder}`, backgroundColor: 'transparent', color: COLORS.muted, cursor: 'pointer' }}>
                  ← Wapas Email Change Karo
                </button>
              </div>
            )}
          </div>

          {/* PLANS */}
          <div style={cardStyle}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.muted, fontWeight: 700, marginBottom: 14 }}>💰 PLANS — TRIAL KE BAAD</div>
            {[
              { label: '1 Month', price: '₹599', popular: false },
              { label: '2 Months', price: '₹1,049', tag: '🔥 Popular', popular: true },
              { label: '3 Months', price: '₹1,499', tag: '💰 Best Value', popular: false },
            ].map(plan => (
              <div key={plan.label} style={{ border: `1.5px solid ${plan.popular ? COLORS.gold : COLORS.surfaceBorder}`, borderRadius: 12, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: plan.popular ? COLORS.goldLight : COLORS.bg, marginBottom: 8 }}>
                <div>
                  <span style={{ fontWeight: 700, color: COLORS.text }}>{plan.label}</span>
                  {plan.tag && <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, color: COLORS.goldDim }}>{plan.tag}</span>}
                </div>
                <span style={{ color: COLORS.gold, fontWeight: 800, fontSize: 16 }}>{plan.price}</span>
              </div>
            ))}
          </div>

          {/* TRUST BADGES */}
          <div style={{ ...cardStyle, textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
              {['🔒 Secure Login', '⚡ Instant Access', '🇮🇳 Made in India', '📊 Real Data', '🪐 Pulse Astro'].map(b => (
                <div key={b} style={{ fontSize: 11, fontWeight: 600, color: COLORS.muted }}>{b}</div>
              ))}
            </div>
          </div>

          <div style={{ textAlign: 'center', paddingTop: 16, borderTop: `1px solid ${COLORS.surfaceBorder}`, display: 'flex', justifyContent: 'center', gap: 24, fontSize: 12 }}>
            <a href="/terms" style={{ color: COLORS.muted, textDecoration: 'none', fontWeight: 600 }}>Terms</a>
            <a href="/refund" style={{ color: COLORS.muted, textDecoration: 'none', fontWeight: 600 }}>Refund Policy</a>
            <a href="/contact" style={{ color: COLORS.muted, textDecoration: 'none', fontWeight: 600 }}>Contact</a>
          </div>
          <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: COLORS.mutedLight }}>🔱 हर हर महादेव 🔱</p>
        </div>
      </div>
    </div>
  );
}
