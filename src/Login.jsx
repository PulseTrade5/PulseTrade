import { useState } from 'react';
import { supabase } from './supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) { setError('Error: ' + (error.message || JSON.stringify(error))); }
    else { setSent(true); }
  };

  if (sent) return (
    <div style={{maxWidth:360,margin:'60px auto',textAlign:'center',fontFamily:'sans-serif'}}>
      <h2>📧 Email check karo</h2>
      <p>{email} pe login link bhej diya hai.</p>
    </div>
  );

  return (
    <div style={{maxWidth:360,margin:'60px auto',padding:'0 20px',textAlign:'center',fontFamily:'sans-serif'}}>
      <h2>PulseTrade 🐂</h2>
      <p style={{color:'#666',marginBottom:20}}>Email daalo, login link bhejenge.</p>
      <form onSubmit={handleLogin} style={{display:'flex',flexDirection:'column',gap:10}}>
        <input type="email" placeholder="tumhara@email.com" value={email}
          onChange={(e)=>setEmail(e.target.value)}
          style={{padding:'12px',fontSize:15,border:'1px solid #ccc',borderRadius:8}} required />
        <button type="submit" disabled={loading}
          style={{padding:'12px',fontSize:15,fontWeight:'bold',backgroundColor:'#8B4513',color:'#fff',border:'none',borderRadius:8,cursor:'pointer'}}>
          {loading ? 'Bhej rahe hain...' : 'Login Link Bhejo'}
        </button>
      </form>
      {error && <p style={{color:'#a33',marginTop:10}}>{error}</p>}
    </div>
  );
}
