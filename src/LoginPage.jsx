import { useState } from 'react';
import { supabase } from './supabaseClient';

const COLORS = {
  bg: "#F5F7FC", surface: "#FFFFFF", surfaceBorder: "#E5E9F5",
  gold: "#4F46E5", goldLight: "#EEF2FF", goldDim: "#4338CA",
  green: "#16A34A", greenLight: "#F0FDF4",
  red: "#EF4444",
  text: "#1E1B4B", muted: "#6B7280", mutedLight: "#9CA3AF",
  navy: "#1E1B4B", navyLight: "#EEF2FF",
};

const LOGO_URL = "/file_00000000b7687208b27c366287ff7e00.png";

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 90 }, (_, i) => CURRENT_YEAR - 10 - i);

export default function LoginPage() {
  const [step, setStep] = useState('details'); // 'details' | 'otp'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const inputStyle = {
    width: '100%', padding: '13px 16px', fontSize: 14,
    backgroundColor: COLORS.bg, border: `1.5px solid ${COLORS.surfaceBorder}`,
    borderRadius: 12, color: COLORS.text, outline: 'none',
    boxSizing: 'border-box', fontFamily: 'Inter, sans-serif',
  };
  const labelStyle = {
    fontSize: 11, letterSpacing: 1, color: COLORS.muted,
    fontWeight: 700, display: 'block', marginBottom: 6,
  };

  const handleSendOtp = async () => {
    setError('');
    if (!email.trim()) { setError('Email daalo pehle.'); return; }
    if (!name.trim()) { setError('Naam bhi daalo.'); return; }
    setLoading(true);
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          data: {
            full_name: name.trim(),
            dob: (dobDay && dobMonth && dobYear)
              ? `${dobYear}-${String(MONTHS.indexOf(dobMonth) + 1).padStart(2, '0')}-${String(dobDay).padStart(2, '0')}`
              : null,
          },
        },
      });
      if (otpError) throw otpError;
      setInfo(`OTP bhej diya ${email} pe — check karo!`);
      setStep('otp');
    } catch (err) {
      setError(err.message || 'OTP bhejne mein problem hui, dobara try karo.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    if (!otp.trim()) { setError('OTP daalo pehle.'); return; }
    setLoading(true);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otp.trim(),
        type: 'email',
      });
      if (verifyError) throw verifyError;
      // On success, Supabase auth listener in App.jsx picks up the new session automatically.
    } catch (err) {
      setError(err.message || 'OTP galat hai ya expire ho gaya, dobara try karo.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    setOtp('');
    setError('');
    handleSendOtp();
  };

  return (
    <div style={{ backgroundColor: COLORS.bg, minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif', color: COLORS.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&display=swap');
      `}</style>
      <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

        {/* HEADER */}
        <div style={{
          padding: '20px 20px 0', display: 'flex', alignItems: 'center', gap: 10,
        }}>
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

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px 20px 48px' }}>

          <div style={{
            backgroundColor: COLORS.surface, borderRadius: 20, padding: '28px 24px',
            boxShadow: '0 6px 0 ' + COLORS.surfaceBorder + ', 0 16px 30px rgba(30,27,75,0.08)',
            border: `1px solid ${COLORS.surfaceBorder}`,
          }}>

            {step === 'details' ? (
              <>
                <div style={{ textAlign: 'center', marginBottom: 22 }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>🔱</div>
                  <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 800, margin: '0 0 4px' }}>
                    Login Ya Signup Karo
                  </h2>
                  <p style={{ fontSize: 12.5, color: COLORS.muted, margin: 0 }}>
                    Naya user ho ya purana — sirf email se OTP milega
                  </p>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>NAAM</label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Apna naam likho"
                    style={inputStyle}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>EMAIL</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                    placeholder="tumhara@email.com"
                    style={inputStyle}
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={labelStyle}>
                    JANAM TITHI 🪐 <span style={{ color: COLORS.mutedLight, fontWeight: 500, letterSpacing: 0 }}>(optional — Pulse Numerology ke liye)</span>
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select value={dobDay} onChange={e => setDobDay(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
                      <option value="">Din</option>
                      {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <select value={dobMonth} onChange={e => setDobMonth(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
                      <option value="">Mahina</option>
                      {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <select value={dobYear} onChange={e => setDobYear(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
                      <option value="">Saal</option>
                      {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>

                <button onClick={handleSendOtp} disabled={loading} style={{
                  width: '100%', padding: '15px', fontSize: 15, fontWeight: 800,
                  borderRadius: 14, border: 'none',
                  background: loading ? COLORS.surfaceBorder : 'linear-gradient(160deg, #6366F1, #4F46E5 55%, #0EA5A4)',
                  color: loading ? COLORS.muted : '#FFF', cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : '0 5px 0 #3730A3, 0 12px 24px rgba(79,70,229,0.35)',
                }}>
                  {loading ? '⏳ Bhej rahe hain...' : '📧 OTP Bhejo'}
                </button>

                <div style={{
                  fontSize: 11, color: COLORS.green, textAlign: 'center', marginTop: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                  🔒 Tumhara data 100% private hai, kisi ko share nahi hota
                </div>
              </>
            ) : (
              <>
                <div style={{ textAlign: 'center', marginBottom: 22 }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>📩</div>
                  <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 800, margin: '0 0 4px' }}>
                    OTP Daalo
                  </h2>
                  <p style={{ fontSize: 12.5, color: COLORS.muted, margin: 0 }}>
                    {email} pe bheja hai — check karo
                  </p>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={labelStyle}>6-DIGIT OTP</label>
                  <input
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
                    placeholder="000000"
                    inputMode="numeric"
                    style={{ ...inputStyle, textAlign: 'center', fontSize: 24, letterSpacing: 8, fontWeight: 700 }}
                  />
                </div>

                <button onClick={handleVerifyOtp} disabled={loading} style={{
                  width: '100%', padding: '15px', fontSize: 15, fontWeight: 800,
                  borderRadius: 14, border: 'none',
                  background: loading ? COLORS.surfaceBorder : 'linear-gradient(160deg, #6366F1, #4F46E5 55%, #0EA5A4)',
                  color: loading ? COLORS.muted : '#FFF', cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : '0 5px 0 #3730A3, 0 12px 24px rgba(79,70,229,0.35)',
                  marginBottom: 12,
                }}>
                  {loading ? '⏳ Verify ho raha hai...' : '✅ Verify Karo'}
                </button>

                <button onClick={handleResend} disabled={loading} style={{
                  width: '100%', padding: '10px', fontSize: 12.5, fontWeight: 700,
                  borderRadius: 10, border: 'none', background: 'transparent',
                  color: COLORS.gold, cursor: 'pointer',
                }}>
                  🔄 OTP Dobara Bhejo
                </button>

                <button onClick={() => { setStep('details'); setOtp(''); setError(''); }} style={{
                  width: '100%', padding: '8px', fontSize: 12, fontWeight: 600,
                  border: 'none', background: 'transparent', color: COLORS.muted, cursor: 'pointer',
                }}>
                  ← Email badalna hai
                </button>
              </>
            )}

            {info && !error && (
              <p style={{ fontSize: 12, color: COLORS.green, textAlign: 'center', marginTop: 14, fontWeight: 600 }}>
                ✅ {info}
              </p>
            )}
            {error && (
              <p style={{ fontSize: 12, color: COLORS.red, textAlign: 'center', marginTop: 14, fontWeight: 600 }}>
                ⚠️ {error}
              </p>
            )}
          </div>

          <div style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: COLORS.muted }}>
            🔱 हर हर महादेव 🔱
          </div>
        </div>
      </div>
    </div>
  );
}
