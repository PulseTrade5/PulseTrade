import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

const ADMIN_EMAIL = 'prabhat3300@gmail.com';

const COLORS = {
  bg: "#F4F6FA",
  surface: "#FFFFFF",
  surfaceBorder: "#E2E8F0",
  gold: "#C8920A",
  goldLight: "#FEF3C7",
  goldDim: "#D97706",
  green: "#059669",
  greenLight: "#ECFDF5",
  red: "#DC2626",
  redLight: "#FEF2F2",
  text: "#0F172A",
  textSecondary: "#334155",
  muted: "#64748B",
};

function getDaysLeft(trialStart) {
  const diff = (new Date() - new Date(trialStart)) / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.ceil(5 - diff));
}

function getStatus(profile) {
  if (profile.is_subscribed) {
    if (profile.subscription_end_date && new Date(profile.subscription_end_date) < new Date()) return 'expired';
    return 'paid';
  }
  const daysLeft = getDaysLeft(profile.trial_start_date);
  if (daysLeft > 0) return 'trial';
  return 'expired';
}

function StatusBadge({ status }) {
  const config = {
    paid: { label: '💰 Paid', color: COLORS.green, bg: COLORS.greenLight },
    trial: { label: '🎯 Trial', color: COLORS.gold, bg: COLORS.goldLight },
    expired: { label: '❌ Expired', color: COLORS.red, bg: COLORS.redLight },
  };
  const c = config[status] || config.expired;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: c.color, backgroundColor: c.bg, padding: '3px 10px', borderRadius: 20 }}>
      {c.label}
    </span>
  );
}

export default function AdminPanel({ user, onLogout }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [editUser, setEditUser] = useState(null);
  const [editMonths, setEditMonths] = useState(1);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Admin check
  if (user?.email !== ADMIN_EMAIL) {
    return (
      <div style={{ backgroundColor: COLORS.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ textAlign: 'center', color: COLORS.red, fontSize: 16, fontWeight: 700 }}>🚫 Access Denied</div>
      </div>
    );
  }

  const fetchProfiles = async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setProfiles(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchProfiles(); }, []);

  const filtered = profiles.filter(p => {
    const matchSearch = p.email?.toLowerCase().includes(search.toLowerCase());
    const status = getStatus(p);
    const matchFilter = filter === 'all' || status === filter;
    return matchSearch && matchFilter;
  });

  const stats = {
    total: profiles.length,
    paid: profiles.filter(p => getStatus(p) === 'paid').length,
    trial: profiles.filter(p => getStatus(p) === 'trial').length,
    expired: profiles.filter(p => getStatus(p) === 'expired').length,
  };

  const handleSubscribe = async () => {
    if (!editUser) return;
    setSaving(true);
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + editMonths);
    await supabase.from('profiles').update({
      is_subscribed: true,
      subscription_end_date: endDate.toISOString(),
    }).eq('id', editUser.id);
    setSuccessMsg(`✅ ${editUser.email} ko ${editMonths} month subscription diya!`);
    setEditUser(null);
    fetchProfiles();
    setSaving(false);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleExtendTrial = async (profile) => {
    const newTrialStart = new Date();
    await supabase.from('profiles').update({ trial_start_date: newTrialStart.toISOString() }).eq('id', profile.id);
    setSuccessMsg(`✅ ${profile.email} ka trial 5 din extend kiya!`);
    fetchProfiles();
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleBlock = async (profile) => {
    if (!window.confirm(`${profile.email} ko block karna chahte ho?`)) return;
    const pastDate = new Date('2020-01-01').toISOString();
    await supabase.from('profiles').update({
      is_subscribed: false,
      trial_start_date: pastDate,
      subscription_end_date: pastDate,
    }).eq('id', profile.id);
    setSuccessMsg(`🚫 ${profile.email} blocked!`);
    fetchProfiles();
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const cardStyle = {
    backgroundColor: COLORS.surface,
    border: `1px solid ${COLORS.surfaceBorder}`,
    borderRadius: 16, padding: 18, marginBottom: 16,
    boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
  };

  return (
    <div style={{ backgroundColor: COLORS.bg, minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif', color: COLORS.text }}>
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 0 48px' }}>

        {/* HEADER */}
        <div style={{ backgroundColor: COLORS.surface, borderBottom: `1px solid ${COLORS.surfaceBorder}`, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>
              Pulse<span style={{ color: COLORS.gold }}>Trade</span> <span style={{ fontSize: 13, color: COLORS.muted, fontWeight: 600 }}>Admin</span>
            </div>
            <div style={{ fontSize: 10, color: COLORS.muted }}>🔱 हर हर महादेव 🔱</div>
          </div>
          <button onClick={onLogout} style={{ fontSize: 12, padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${COLORS.surfaceBorder}`, backgroundColor: 'transparent', color: COLORS.muted, cursor: 'pointer', fontWeight: 600 }}>🚪 Logout</button>
        </div>

        <div style={{ padding: '20px 20px 0' }}>

          {/* SUCCESS MSG */}
          {successMsg && (
            <div style={{ backgroundColor: COLORS.greenLight, border: `1.5px solid #bbf7d0`, borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 13, fontWeight: 700, color: COLORS.green }}>
              {successMsg}
            </div>
          )}

          {/* STATS */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {[
              ['Total', stats.total, COLORS.text, COLORS.bg],
              ['Paid', stats.paid, COLORS.green, COLORS.greenLight],
              ['Trial', stats.trial, COLORS.gold, COLORS.goldLight],
              ['Expired', stats.expired, COLORS.red, COLORS.redLight],
            ].map(([label, value, color, bg]) => (
              <div key={label} style={{ flex: 1, backgroundColor: bg, border: `1px solid ${COLORS.surfaceBorder}`, borderRadius: 14, padding: '12px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
                <div style={{ fontSize: 11, color, fontWeight: 700 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* SEARCH + FILTER */}
          <div style={cardStyle}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="🔍 Email se search karo..."
              style={{ width: '100%', padding: '10px 14px', fontSize: 13, backgroundColor: COLORS.bg, border: `1.5px solid ${COLORS.surfaceBorder}`, borderRadius: 10, color: COLORS.text, outline: 'none', boxSizing: 'border-box', marginBottom: 12, fontFamily: 'Inter, sans-serif' }}
            />
            <div style={{ display: 'flex', gap: 6 }}>
              {[['all','All'],['paid','💰 Paid'],['trial','🎯 Trial'],['expired','❌ Expired']].map(([key, label]) => (
                <button key={key} onClick={() => setFilter(key)} style={{ flex: 1, padding: '7px 4px', fontSize: 11, fontWeight: 700, borderRadius: 10, border: 'none', backgroundColor: filter===key ? COLORS.gold : COLORS.bg, color: filter===key ? '#FFF' : COLORS.muted, cursor: 'pointer' }}>{label}</button>
              ))}
            </div>
          </div>

          {/* USERS LIST */}
          <div style={cardStyle}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.muted, fontWeight: 700, marginBottom: 14 }}>
              USERS ({filtered.length})
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', color: COLORS.muted, padding: '20px 0' }}>⏳ Loading...</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', color: COLORS.muted, padding: '20px 0' }}>Koi user nahi mila.</div>
            ) : filtered.map(p => {
              const status = getStatus(p);
              const daysLeft = getDaysLeft(p.trial_start_date);
              return (
                <div key={p.id} style={{ padding: '14px 0', borderBottom: `1px solid ${COLORS.surfaceBorder}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ flex: 1, marginRight: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, wordBreak: 'break-all' }}>{p.email}</div>
                      <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 3 }}>
                        Signup: {new Date(p.created_at).toLocaleDateString('en-IN')}
                        {status === 'trial' && ` • ${daysLeft} din baaki`}
                        {status === 'paid' && p.subscription_end_date && ` • Expires: ${new Date(p.subscription_end_date).toLocaleDateString('en-IN')}`}
                      </div>
                    </div>
                    <StatusBadge status={status} />
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => { setEditUser(p); setEditMonths(1); }} style={{ flex: 1, fontSize: 11, padding: '7px 6px', borderRadius: 8, border: 'none', backgroundColor: COLORS.gold, color: '#FFF', cursor: 'pointer', fontWeight: 700 }}>💰 Subscribe</button>
                    <button onClick={() => handleExtendTrial(p)} style={{ flex: 1, fontSize: 11, padding: '7px 6px', borderRadius: 8, border: `1.5px solid ${COLORS.surfaceBorder}`, backgroundColor: 'transparent', color: COLORS.gold, cursor: 'pointer', fontWeight: 700 }}>+5 Din Trial</button>
                    <button onClick={() => handleBlock(p)} style={{ fontSize: 11, padding: '7px 10px', borderRadius: 8, border: `1.5px solid ${COLORS.surfaceBorder}`, backgroundColor: 'transparent', color: COLORS.red, cursor: 'pointer', fontWeight: 700 }}>🚫</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SUBSCRIBE MODAL */}
      {editUser && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}>
          <div style={{ backgroundColor: COLORS.surface, borderRadius: 20, padding: 24, width: '100%', maxWidth: 360, boxShadow: '0 8px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>💰 Subscription Do</div>
            <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 16, wordBreak: 'break-all' }}>{editUser.email}</div>
            <div style={{ fontSize: 11, color: COLORS.muted, fontWeight: 700, marginBottom: 8 }}>MONTHS CHOOSE KARO</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {[1, 2, 3].map(m => (
                <button key={m} onClick={() => setEditMonths(m)} style={{ flex: 1, padding: '12px 8px', fontSize: 13, fontWeight: 700, borderRadius: 10, border: 'none', backgroundColor: editMonths===m ? COLORS.gold : COLORS.bg, color: editMonths===m ? '#FFF' : COLORS.muted, cursor: 'pointer' }}>{m} Month</button>
              ))}
            </div>
            <button onClick={handleSubscribe} disabled={saving} style={{ width: '100%', padding: '13px', fontSize: 14, fontWeight: 700, borderRadius: 12, border: 'none', backgroundColor: COLORS.gold, color: '#FFF', cursor: 'pointer', marginBottom: 10, boxShadow: '0 2px 12px rgba(200,146,10,0.3)' }}>
              {saving ? '⏳ Save ho raha hai...' : '✅ Confirm Karo'}
            </button>
            <button onClick={() => setEditUser(null)} style={{ width: '100%', padding: '10px', fontSize: 13, fontWeight: 600, borderRadius: 12, border: `1.5px solid ${COLORS.surfaceBorder}`, backgroundColor: 'transparent', color: COLORS.muted, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
                      }
