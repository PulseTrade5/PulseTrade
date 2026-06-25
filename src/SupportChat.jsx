import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';

export default function SupportChat({ user, isDark, onClose }) {
  const dark = isDark ?? false;
  const C = dark
    ? { bg: "#0D1117", surface: "#161B22", border: "#30363D", gold: "#D8A33D", goldLight: "#2D2008", text: "#E8E6E0", muted: "#8B92A0", userBubble: "#D8A33D", adminBubble: "#1C2128" }
    : { bg: "#F4F6FA", surface: "#FFFFFF", border: "#E2E8F0", gold: "#C8920A", goldLight: "#FEF3C7", text: "#0F172A", muted: "#64748B", userBubble: "#C8920A", adminBubble: "#F1F5F9" };

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  const loadMessages = async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    if (!error && data) setMessages(data);
    setLoading(false);
  };

  useEffect(() => {
    loadMessages();
  }, [user?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    const trimmed = newMessage.trim();
    if (!trimmed || !user?.id) return;
    setSending(true);
    const { error } = await supabase.from('support_messages').insert([{
      user_id: user.id,
      user_email: user.email,
      message: trimmed,
      sender: 'user',
    }]);
    if (!error) {
      setNewMessage('');
      await loadMessages();
    }
    setSending(false);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'flex-end',
      justifyContent: 'center', zIndex: 9999,
    }}>
      <div style={{
        backgroundColor: C.surface,
        width: '100%', maxWidth: 480,
        height: '90vh',
        borderRadius: '20px 20px 0 0',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 -4px 30px rgba(0,0,0,0.2)',
      }}>

        {/* HEADER */}
        <div style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${C.border}`,
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>🛟 Support Center</div>
            <div style={{ fontSize: 12, color: C.gold, marginTop: 3, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#22C55E', display: 'inline-block' }} />
              Hum yahan hain, baat karo bina sharm ke 🙏
            </div>
          </div>
          <button onClick={onClose} style={{
            fontSize: 20, background: 'none', border: 'none',
            color: C.muted, cursor: 'pointer', padding: 4,
          }}>✕</button>
        </div>

        {/* MESSAGES */}
        <div ref={scrollRef} style={{
          flex: 1, overflowY: 'auto',
          padding: '16px 20px',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: C.muted, fontSize: 13, padding: '20px 0' }}>⏳ Load ho raha hai...</div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>👋</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 6 }}>Namaste!</div>
              <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
                Koi bhi sawaal, problem, ya suggestion ho — neeche likh do. Hum jald se jald reply karenge. 🙏
              </div>
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} style={{
                display: 'flex',
                justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  maxWidth: '78%', padding: '10px 14px', borderRadius: 16,
                  backgroundColor: m.sender === 'user' ? C.userBubble : C.adminBubble,
                  color: m.sender === 'user' ? '#FFF' : C.text,
                  fontSize: 13.5, lineHeight: 1.5,
                  borderBottomRightRadius: m.sender === 'user' ? 4 : 16,
                  borderBottomLeftRadius: m.sender === 'user' ? 16 : 4,
                }}>
                  {m.sender === 'admin' && (
                    <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.7, marginBottom: 3 }}>🛡️ PulseTrade Team</div>
                  )}
                  {m.message}
                </div>
              </div>
            ))
          )}
        </div>

        {/* INPUT */}
        <div style={{
          padding: '12px 16px',
          borderTop: `1px solid ${C.border}`,
          display: 'flex', gap: 8,
          flexShrink: 0,
          backgroundColor: C.surface,
        }}>
          <input
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Apni problem yahan likho..."
            style={{
              flex: 1, padding: '11px 14px', fontSize: 14, borderRadius: 24,
              border: `1.5px solid ${C.border}`,
              backgroundColor: C.bg, color: C.text,
              outline: 'none', fontFamily: 'Inter, sans-serif',
            }}
          />
          <button
            onClick={handleSend}
            disabled={sending || !newMessage.trim()}
            style={{
              width: 44, height: 44, borderRadius: '50%', border: 'none',
              backgroundColor: sending || !newMessage.trim() ? C.border : C.gold,
              color: '#FFF', fontSize: 18, cursor: sending ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {sending ? '⏳' : '➤'}
          </button>
        </div>
      </div>
    </div>
  );
}
