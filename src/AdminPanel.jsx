import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import AdminFund from './AdminFund';
import AdminSignals from './AdminSignals';

const ADMIN_EMAIL = 'prabhat3300@gmail.com';

const COLORS = {
  bg: "#F4F6FA", surface: "#FFFFFF", surfaceBorder: "#E2E8F0",
  gold: "#C8920A", goldLight: "#FEF3C7", goldDim: "#D97706",
  green: "#059669", greenLight: "#ECFDF5",
  red: "#DC2626", redLight: "#FEF2F2",
  purple: "#7C3AED", purpleLight: "#EDE9FE",
  blue: "#2563EB", blueLight: "#EFF6FF",
  text: "#0F172A", textSecondary: "#334155", muted: "#64748B",
};

function getDaysLeft(trialStart) {
  const diff = (new Date() - new Date(trialStart)) / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.ceil(5 - diff));
}

function getStatus(profile) {
  if (profile.is_blocked) return 'blocked';
  if (profile.is_subscribed) {
    if (profile.subscription_end_date && new Date(profile.subscription_end_date) < new Date()) return 'expired';

    // Agar free trial claim kiya hai aur subscription duration ~5-6 din ki hai, to ye trial hai, paid nahi
    const isFreeTrialSub =
      profile.free_trial_claimed &&
      profile.trial_start_date &&
      profile.subscription_end_date &&
      (new Date(profile.subscription_end_date) - new Date(profile.trial_start_date)) <= 6 * 24 * 60 * 60 * 1000;

    return isFreeTrialSub ? 'trial' : 'paid';
  }
  return getDaysLeft(profile.trial_start_date) > 0 ? 'trial' : 'expired';
}

function slugify(text) {
  return text.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function StatusBadge({ status }) {
  const config = {
    paid: { label: '💰 Paid', color: COLORS.green, bg: COLORS.greenLight },
    trial: { label: '🎯 Trial', color: COLORS.gold, bg: COLORS.goldLight },
    expired: { label: '❌ Expired', color: COLORS.red, bg: COLORS.redLight },
    blocked: { label: '🚫 Blocked', color: '#7F1D1D', bg: '#FEE2E2' },
  };
  const c = config[status] || config.expired;
  return <span style={{ fontSize: 11, fontWeight: 700, color: c.color, backgroundColor: c.bg, padding: '3px 10px', borderRadius: 20 }}>{c.label}</span>;
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
  const [activeTab, setActiveTab] = useState('users');
  const [referrals, setReferrals] = useState([]);
  const [supportMessages, setSupportMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [expandedUser, setExpandedUser] = useState(null);

  const [blogPosts, setBlogPosts] = useState([]);
  const [editingPost, setEditingPost] = useState(null);
  const [postForm, setPostForm] = useState({ title: '', slug: '', excerpt: '', content: '', category: 'Numerology', meta_description: '', published: false });
  const [savingPost, setSavingPost] = useState(false);

  const [feedbackList, setFeedbackList] = useState([]);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  const isAdmin = user?.email === ADMIN_EMAIL;

  const fetchProfiles = async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setProfiles(data || []);
    setLoading(false);
  };

  const fetchReferrals = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('name, email, referred_by, referral_code, referral_count, created_at')
      .order('created_at', { ascending: false });
    setReferrals(data || []);
  };

  const fetchSupportMessages = async () => {
    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .order('created_at', { ascending: false });
    setSupportMessages(data || []);
  };

  const fetchBlogPosts = async () => {
    const { data } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false });
    setBlogPosts(data || []);
  };

  const fetchFeedback = async () => {
    setLoadingFeedback(true);
    const { data } = await supabase.from('trial_feedback').select('*').order('created_at', { ascending: false });
    setFeedbackList(data || []);
    setLoadingFeedback(false);
  };

  useEffect(() => {
    if (isAdmin) {
      fetchProfiles();
      fetchReferrals();
      fetchSupportMessages();
      fetchBlogPosts();
      fetchFeedback();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div style={{ backgroundColor: COLORS.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', flexDirection: 'column', gap: 12, padding: 20 }}>
        <div style={{ textAlign: 'center', color: COLORS.red, fontSize: 16, fontWeight: 700 }}>🚫 Access Denied</div>
        <div style={{ textAlign: 'center', color: COLORS.muted, fontSize: 13 }}>
          Detected login email: <strong>{user?.email || 'NONE (not logged in)'}</strong>
        </div>
        <div style={{ textAlign: 'center', color: COLORS.muted, fontSize: 13 }}>
          Required admin email: <strong>{ADMIN_EMAIL}</strong>
        </div>
      </div>
    );
  }

  const filtered = profiles.filter(p => {
    const matchSearch = p.email?.toLowerCase().includes(search.toLowerCase()) || p.name?.toLowerCase().includes(search.toLowerCase());
    const status = getStatus(p);
    return matchSearch && (filter === 'all' || status === filter);
  });

  const stats = {
    total: profiles.length,
    paid: profiles.filter(p => getStatus(p) === 'paid').length,
    trial: profiles.filter(p => getStatus(p) === 'trial').length,
    expired: profiles.filter(p => getStatus(p) === 'expired').length,
    blocked: profiles.filter(p => getStatus(p) === 'blocked').length,
  };

  const referralStats = {
    totalReferrals: referrals.filter(r => r.referred_by).length,
    topReferrer: [...referrals].sort((a, b) => (b.referral_count || 0) - (a.referral_count || 0))[0],
  };

  const uniqueUsers = [...new Map(supportMessages.map(m => [m.user_id, m])).values()];

  const userMessages = selectedUser
    ? supportMessages.filter(m => m.user_id === selectedUser.user_id).sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    : [];

  const feedbackReasonCounts = feedbackList.reduce((acc, f) => {
    const reason = f.reason || 'Unknown';
    acc[reason] = (acc[reason] || 0) + 1;
    return acc;
  }, {});
  const sortedReasonCounts = Object.entries(feedbackReasonCounts).sort((a, b) => b[1] - a[1]);

  const handleReply = async () => {
    if (!replyText.trim() || !selectedUser) return;
    setReplying(true);
    await supabase.from('support_messages').insert([{
      user_id: selectedUser.user_id,
      user_email: selectedUser.user_email,
      message: replyText.trim(),
      sender: 'admin',
    }]);
    setReplyText('');
    await fetchSupportMessages();
    setReplying(false);
  };

  const handleSubscribe = async () => {
    if (!editUser) return;
    setSaving(true);
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + editMonths);
    await supabase.from('profiles').update({ is_subscribed: true, subscription_end_date: endDate.toISOString(), is_blocked: false }).eq('id', editUser.id);
    setSuccessMsg(`✅ ${editUser.email} ko ${editMonths} month subscription diya!`);
    setEditUser(null);
    fetchProfiles();
    setSaving(false);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleExtendTrial = async (profile) => {
    await supabase.from('profiles').update({ trial_start_date: new Date().toISOString(), is_blocked: false }).eq('id', profile.id);
    setSuccessMsg(`✅ ${profile.email} ka trial 5 din extend kiya!`);
    fetchProfiles();
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleBlock = async (profile) => {
    if (!window.confirm(`${profile.email} ko block karna chahte ho?`)) return;
    const pastDate = new Date('2020-01-01').toISOString();
    await supabase.from('profiles').update({ is_subscribed: false, trial_start_date: pastDate, subscription_end_date: pastDate, is_blocked: true }).eq('id', profile.id);
    setSuccessMsg(`🚫 ${profile.email} blocked!`);
    fetchProfiles();
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleUnblock = async (profile) => {
    if (!window.confirm(`${profile.email} ko unblock karna chahte ho? Isko fresh 5-din trial mil jayega.`)) return;
    await supabase.from('profiles').update({ is_blocked: false, trial_start_date: new Date().toISOString() }).eq('id', profile.id);
    setSuccessMsg(`✅ ${profile.email} unblock ho gaya — fresh trial mil gaya!`);
    fetchProfiles();
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const openNewPost = () => {
    setPostForm({ title: '', slug: '', excerpt: '', content: '', category: 'Numerology', meta_description: '', published: false });
    setEditingPost({});
  };

  const openEditPost = (post) => {
    setPostForm({
      title: post.title || '', slug: post.slug || '', excerpt: post.excerpt || '',
      content: post.content || '', category: post.category || 'Numerology',
      meta_description: post.meta_description || '', published: post.published || false,
    });
    setEditingPost(post);
  };

  const handleSavePost = async () => {
    if (!postForm.title.trim() || !postForm.content.trim()) {
      alert('Title aur Content dono zaroori hain');
      return;
    }
    setSavingPost(true);
    const slug = postForm.slug.trim() || slugify(postForm.title);
    const payload = { ...postForm, slug, updated_at: new Date().toISOString() };

    let error;
    if (editingPost?.id) {
      ({ error } = await supabase.from('blog_posts').update(payload).eq('id', editingPost.id));
    } else {
      ({ error } = await supabase.from('blog_posts').insert([payload]));
    }

    if (error) {
      setSuccessMsg(`❌ Save fail hua: ${error.message}`);
    } else {
      setSuccessMsg(`✅ Post ${editingPost?.id ? 'update' : 'create'} ho gaya!`);
      setEditingPost(null);
      fetchBlogPosts();
    }
    setSavingPost(false);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleTogglePublish = async (post) => {
    const { error } = await supabase.from('blog_posts').update({ published: !post.published }).eq('id', post.id);
    if (!error) {
      setSuccessMsg(post.published ? `📝 Draft mein daal diya` : `🚀 Post publish ho gaya!`);
      fetchBlogPosts();
    }
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleDeletePost = async (post) => {
    if (!window.confirm(`"${post.title}" delete karna chahte ho?`)) return;
    const { error } = await supabase.from('blog_posts').delete().eq('id', post.id);
    if (!error) {
      setSuccessMsg(`🗑️ Post delete ho gaya`);
      fetchBlogPosts();
    }
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const cardStyle = { backgroundColor: COLORS.surface, border: `1px solid ${COLORS.surfaceBorder}`, borderRadius: 16, padding: 18, marginBottom: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.05)' };
  const rowStyle = { display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '8px 0', borderBottom: `1px solid ${COLORS.surfaceBorder}` };
  const inputStyle = { width: '100%', padding: '10px 14px', fontSize: 13, borderRadius: 10, border: `1.5px solid ${COLORS.surfaceBorder}`, backgroundColor: COLORS.bg, color: COLORS.text, outline: 'none', boxSizing: 'border-box', marginBottom: 14, fontFamily: 'Inter, sans-serif' };
  const labelStyle = { fontSize: 11, color: COLORS.muted, fontWeight: 700, marginBottom: 6 };

  const todaySignups = profiles.filter(p => {
    const created = new Date(p.created_at);
    const today = new Date();
    return created.toDateString() === today.toDateString();
  }).length;

  return (
    <div style={{ backgroundColor: COLORS.bg, minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif', color: COLORS.text }}>
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 0 48px' }}>

        <div style={{ backgroundColor: COLORS.surface, borderBottom: `1px solid ${COLORS.surfaceBorder}`, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => window.location.href = '/'} style={{ fontSize: 12, padding: '6px 12px', borderRadius: 20, border: `1.5px solid ${COLORS.surfaceBorder}`, backgroundColor: 'transparent', color: COLORS.muted, cursor: 'pointer', fontWeight: 600 }}>← Dashboard</button>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>Pulse<span style={{ color: COLORS.gold }}>Trade</span> <span style={{ fontSize: 12, color: COLORS.muted }}>Admin</span></div>
              <div style={{ fontSize: 10, color: COLORS.muted }}>🔱 हर हर महादेव 🔱</div>
            </div>
          </div>
          <button onClick={onLogout} style={{ fontSize: 12, padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${COLORS.surfaceBorder}`, backgroundColor: 'transparent', color: COLORS.muted, cursor: 'pointer', fontWeight: 600 }}>🚪 Logout</button>
        </div>

        <div style={{ display: 'flex', gap: 4, padding: 4, backgroundColor: COLORS.surface, borderBottom: `1px solid ${COLORS.surfaceBorder}`, overflowX: 'auto' }}>
          {[['users', '👥 Users'], ['referrals', '🔗 Referrals'], ['support', '💬 Support'], ['feedback', '📋 Feedback'], ['blog', '📝 Blog'], ['fund', '💵 Fund'], ['signals', '🎯 Signals']].map(([key, label]) => (
            <button key={key} onClick={() => { setActiveTab(key); setSelectedUser(null); }} style={{
              flex: 1, padding: '8px 4px', fontSize: 12, fontWeight: 700,
              borderRadius: 10, border: 'none', whiteSpace: 'nowrap',
              backgroundColor: activeTab === key ? COLORS.gold : 'transparent',
              color: activeTab === key ? '#FFF' : COLORS.muted,
              cursor: 'pointer',
            }}>{label}</button>
          ))}
        </div>

        <div style={{ padding: '20px 20px 0' }}>
          {successMsg && <div style={{ backgroundColor: COLORS.greenLight, border: '1.5px solid #bbf7d0', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 13, fontWeight: 700, color: COLORS.green }}>{successMsg}</div>}

          {activeTab === 'users' && (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12, overflowX: 'auto' }}>
                {[['Total', stats.total, COLORS.text, COLORS.bg], ['Paid', stats.paid, COLORS.green, COLORS.greenLight], ['Trial', stats.trial, COLORS.gold, COLORS.goldLight], ['Expired', stats.expired, COLORS.red, COLORS.redLight], ['Blocked', stats.blocked, '#7F1D1D', '#FEE2E2']].map(([label, value, color, bg]) => (
                  <div key={label} style={{ flex: 1, minWidth: 70, backgroundColor: bg, border: `1px solid ${COLORS.surfaceBorder}`, borderRadius: 14, padding: '12px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
                    <div style={{ fontSize: 11, color, fontWeight: 700 }}>{label}</div>
                  </div>
                ))}
              </div>

              <div style={{ backgroundColor: COLORS.blueLight, border: `1px solid #BFDBFE`, borderRadius: 14, padding: '12px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 11, color: COLORS.blue, fontWeight: 700 }}>📅 AAJ KE NAYE SIGNUPS</div>
                  <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                </div>
                <div style={{ fontSize: 32, fontWeight: 900, color: COLORS.blue }}>{todaySignups}</div>
              </div>

              <div style={cardStyle}>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Naam ya Email se search karo..." style={{ width: '100%', padding: '10px 14px', fontSize: 13, backgroundColor: COLORS.bg, border: `1.5px solid ${COLORS.surfaceBorder}`, borderRadius: 10, color: COLORS.text, outline: 'none', boxSizing: 'border-box', marginBottom: 12, fontFamily: 'Inter, sans-serif' }} />
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
                  {[['all','All'],['paid','💰 Paid'],['trial','🎯 Trial'],['expired','❌ Expired'],['blocked','🚫 Blocked']].map(([key, label]) => (
                    <button key={key} onClick={() => setFilter(key)} style={{ flex: 1, minWidth: 70, padding: '7px 4px', fontSize: 11, fontWeight: 700, borderRadius: 10, border: 'none', backgroundColor: filter===key ? COLORS.gold : COLORS.bg, color: filter===key ? '#FFF' : COLORS.muted, cursor: 'pointer', whiteSpace: 'nowrap' }}>{label}</button>
                  ))}
                </div>
              </div>

              <div style={cardStyle}>
                <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.muted, fontWeight: 700, marginBottom: 14 }}>USERS ({filtered.length})</div>
                {loading ? (
                  <div style={{ textAlign: 'center', color: COLORS.muted, padding: '20px 0' }}>⏳ Loading...</div>
                ) : filtered.length === 0 ? (
                  <div style={{ textAlign: 'center', color: COLORS.muted, padding: '20px 0' }}>Koi user nahi mila.</div>
                ) : filtered.map(p => {
                  const status = getStatus(p);
                  const daysLeft = getDaysLeft(p.trial_start_date);
                  const isExpanded = expandedUser === p.id;
                  return (
                    <div key={p.id} style={{ padding: '14px 0', borderBottom: `1px solid ${COLORS.surfaceBorder}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div style={{ flex: 1, marginRight: 8 }}>
                          {p.name && <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.text }}>{p.name}</div>}
                          <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2, wordBreak: 'break-all' }}>{p.email}</div>
                          <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 3 }}>
                            Signup: {new Date(p.created_at).toLocaleDateString('en-IN')}
                            {status === 'trial' && ` • ${daysLeft} din baaki`}
                            {status === 'paid' && p.subscription_end_date && ` • Expires: ${new Date(p.subscription_end_date).toLocaleDateString('en-IN')}`}
                            {p.referred_by && <span style={{ color: COLORS.purple }}> • Ref: {p.referred_by}</span>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                          <StatusBadge status={status} />
                          <button onClick={() => setExpandedUser(isExpanded ? null : p.id)} style={{ fontSize: 10, color: COLORS.blue, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
                            {isExpanded ? '▲ Hide' : '▼ Details'}
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div style={{ backgroundColor: COLORS.bg, borderRadius: 12, padding: 12, marginBottom: 10, border: `1px solid ${COLORS.surfaceBorder}` }}>
                          <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.muted, fontWeight: 700, marginBottom: 8 }}>📊 USER DETAILS</div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${COLORS.surfaceBorder}` }}>
                            <span style={{ fontSize: 11, color: COLORS.muted }}>🕐 Last Login</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.text }}>
                              {p.last_login ? new Date(p.last_login).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Never'}
                            </span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${COLORS.surfaceBorder}` }}>
                            <span style={{ fontSize: 11, color: COLORS.muted }}>🔢 Login Count</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.gold }}>{p.login_count || 0} baar</span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${COLORS.surfaceBorder}` }}>
                            <span style={{ fontSize: 11, color: COLORS.muted }}>📱 Device</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.text }}>{p.last_device || 'Unknown'}</span>
                          </div>

                          <div style={{ padding: '5px 0' }}>
                            <span style={{ fontSize: 11, color: COLORS.muted }}>🌐 Location</span>
                            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.text, marginTop: 3, wordBreak: 'break-all' }}>{p.last_location || 'Unknown'}</div>
                          </div>
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => { setEditUser(p); setEditMonths(1); }} style={{ flex: 1, fontSize: 11, padding: '7px 6px', borderRadius: 8, border: 'none', backgroundColor: COLORS.gold, color: '#FFF', cursor: 'pointer', fontWeight: 700 }}>💰 Subscribe</button>
                        <button onClick={() => handleExtendTrial(p)} style={{ flex: 1, fontSize: 11, padding: '7px 6px', borderRadius: 8, border: `1.5px solid ${COLORS.surfaceBorder}`, backgroundColor: 'transparent', color: COLORS.gold, cursor: 'pointer', fontWeight: 700 }}>+5 Din Trial</button>
                        {status === 'blocked' ? (
                          <button onClick={() => handleUnblock(p)} style={{ fontSize: 11, padding: '7px 10px', borderRadius: 8, border: 'none', backgroundColor: COLORS.green, color: '#FFF', cursor: 'pointer', fontWeight: 700, whiteSpace: 'nowrap' }}>✅ Unblock</button>
                        ) : (
                          <button onClick={() => handleBlock(p)} style={{ fontSize: 11, padding: '7px 10px', borderRadius: 8, border: `1.5px solid ${COLORS.surfaceBorder}`, backgroundColor: 'transparent', color: COLORS.red, cursor: 'pointer', fontWeight: 700 }}>🚫</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {activeTab === 'referrals' && (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <div style={{ flex: 1, backgroundColor: COLORS.purpleLight, border: `1px solid #DDD6FE`, borderRadius: 14, padding: '12px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.purple }}>{referralStats.totalReferrals}</div>
                  <div style={{ fontSize: 11, color: COLORS.purple, fontWeight: 700 }}>Total Referrals</div>
                </div>
                <div style={{ flex: 1, backgroundColor: COLORS.goldLight, border: `1px solid #FDE68A`, borderRadius: 14, padding: '12px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.gold }}>
                    {referralStats.topReferrer?.name || referralStats.topReferrer?.email?.split('@')[0] || '—'}
                  </div>
                  <div style={{ fontSize: 11, color: COLORS.gold, fontWeight: 700 }}>Top Referrer</div>
                </div>
              </div>
              <div style={cardStyle}>
                <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.muted, fontWeight: 700, marginBottom: 14 }}>🔗 KIS KE LINK SE AAYA</div>
                {referrals.filter(r => r.referred_by).length === 0 ? (
                  <p style={{ color: COLORS.muted, textAlign: 'center', padding: '20px 0', fontSize: 13 }}>Abhi koi referral nahi aaya.</p>
                ) : referrals.filter(r => r.referred_by).map((r, i) => (
                  <div key={i} style={rowStyle}>
                    <div>
                      <div style={{ fontWeight: 700, color: COLORS.text, fontSize: 13 }}>{r.name || r.email}</div>
                      <div style={{ fontSize: 11, color: COLORS.muted }}>{r.email}</div>
                      <div style={{ fontSize: 11, color: COLORS.muted }}>{new Date(r.created_at).toLocaleDateString('en-IN')}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, color: COLORS.purple, fontWeight: 700, backgroundColor: COLORS.purpleLight, padding: '3px 10px', borderRadius: 20 }}>via {r.referred_by}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={cardStyle}>
                <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.muted, fontWeight: 700, marginBottom: 14 }}>🏆 TOP REFERRERS</div>
                {referrals.filter(r => (r.referral_count || 0) > 0).sort((a, b) => (b.referral_count || 0) - (a.referral_count || 0)).length === 0 ? (
                  <p style={{ color: COLORS.muted, textAlign: 'center', padding: '20px 0', fontSize: 13 }}>Abhi koi referral nahi.</p>
                ) : referrals.filter(r => (r.referral_count || 0) > 0).sort((a, b) => (b.referral_count || 0) - (a.referral_count || 0)).map((r, i) => (
                  <div key={i} style={rowStyle}>
                    <div>
                      <div style={{ fontWeight: 700, color: COLORS.text }}>{r.name || r.email}</div>
                      <div style={{ fontSize: 11, color: COLORS.muted }}>Code: {r.referral_code}</div>
                    </div>
                    <div style={{ fontWeight: 800, color: COLORS.purple, fontSize: 18 }}>{r.referral_count} 🔗</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'support' && (
            <>
              {!selectedUser ? (
                <div style={cardStyle}>
                  <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.muted, fontWeight: 700, marginBottom: 14 }}>💬 CUSTOMER MESSAGES ({uniqueUsers.length})</div>
                  {uniqueUsers.length === 0 ? (
                    <p style={{ color: COLORS.muted, textAlign: 'center', padding: '20px 0', fontSize: 13 }}>Abhi koi message nahi.</p>
                  ) : uniqueUsers.map((m, i) => (
                    <div key={i} onClick={() => setSelectedUser(m)} style={{ padding: '14px 0', borderBottom: `1px solid ${COLORS.surfaceBorder}`, cursor: 'pointer' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>{m.user_email}</div>
                          <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 3 }}>{m.message?.substring(0, 50)}...</div>
                          <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>{new Date(m.created_at).toLocaleDateString('en-IN')}</div>
                        </div>
                        <span style={{ fontSize: 18 }}>→</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <button onClick={() => setSelectedUser(null)} style={{ fontSize: 13, fontWeight: 700, color: COLORS.gold, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 12 }}>← Wapas</button>
                  <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.muted, marginBottom: 12 }}>{selectedUser.user_email}</div>
                  <div style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.surfaceBorder}`, borderRadius: 16, padding: 16, marginBottom: 12, maxHeight: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {userMessages.map((m) => (
                      <div key={m.id} style={{ display: 'flex', justifyContent: m.sender === 'user' ? 'flex-start' : 'flex-end' }}>
                        <div style={{ maxWidth: '78%', padding: '10px 14px', borderRadius: 16, backgroundColor: m.sender === 'user' ? COLORS.bg : COLORS.gold, color: m.sender === 'user' ? COLORS.text : '#FFF', fontSize: 13 }}>
                          {m.sender === 'admin' && <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.7, marginBottom: 3 }}>🛡️ Admin</div>}
                          {m.message}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input value={replyText} onChange={e => setReplyText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleReply()} placeholder="Reply likho..." style={{ flex: 1, padding: '11px 14px', fontSize: 14, borderRadius: 24, border: `1.5px solid ${COLORS.surfaceBorder}`, backgroundColor: COLORS.bg, color: COLORS.text, outline: 'none' }} />
                    <button onClick={handleReply} disabled={replying || !replyText.trim()} style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', backgroundColor: replying || !replyText.trim() ? COLORS.surfaceBorder : COLORS.gold, color: '#FFF', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>➤</button>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'feedback' && (
            <>
              <div style={cardStyle}>
                <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.muted, fontWeight: 700, marginBottom: 14 }}>📊 REASON BREAKDOWN ({feedbackList.length} total)</div>
                {sortedReasonCounts.length === 0 ? (
                  <p style={{ color: COLORS.muted, textAlign: 'center', padding: '20px 0', fontSize: 13 }}>Abhi koi feedback nahi aaya.</p>
                ) : sortedReasonCounts.map(([reason, count]) => {
                  const pct = feedbackList.length ? Math.round((count / feedbackList.length) * 100) : 0;
                  return (
                    <div key={reason} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                        <span style={{ color: COLORS.text, fontWeight: 600 }}>{reason}</span>
                        <span style={{ color: COLORS.gold, fontWeight: 700 }}>{count} ({pct}%)</span>
                      </div>
                      <div style={{ height: 8, backgroundColor: COLORS.bg, borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, backgroundColor: COLORS.gold, borderRadius: 99 }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={cardStyle}>
                <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.muted, fontWeight: 700, marginBottom: 14 }}>📋 SAB RESPONSES</div>
                {loadingFeedback ? (
                  <div style={{ textAlign: 'center', color: COLORS.muted, padding: '20px 0' }}>⏳ Loading...</div>
                ) : feedbackList.length === 0 ? (
                  <p style={{ color: COLORS.muted, textAlign: 'center', padding: '20px 0', fontSize: 13 }}>Abhi koi feedback nahi aaya.</p>
                ) : feedbackList.map((f) => (
                  <div key={f.id} style={{ padding: '14px 0', borderBottom: `1px solid ${COLORS.surfaceBorder}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.text, wordBreak: 'break-all' }}>{f.email}</div>
                      <div style={{ fontSize: 10, color: COLORS.muted, whiteSpace: 'nowrap', marginLeft: 8 }}>{new Date(f.created_at).toLocaleDateString('en-IN')}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.gold, backgroundColor: COLORS.goldLight, padding: '3px 10px', borderRadius: 20 }}>{f.reason}</span>
                    {f.message && (
                      <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 8, backgroundColor: COLORS.bg, borderRadius: 10, padding: '8px 12px', lineHeight: 1.5 }}>
                        "{f.message}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'blog' && (
            <>
              <button onClick={openNewPost} style={{ width: '100%', padding: '14px', fontSize: 14, fontWeight: 700, borderRadius: 12, border: 'none', backgroundColor: COLORS.gold, color: '#FFF', cursor: 'pointer', marginBottom: 16 }}>
                ✏️ Naya Post Likho
              </button>
              <div style={cardStyle}>
                <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.muted, fontWeight: 700, marginBottom: 14 }}>📝 BLOG POSTS ({blogPosts.length})</div>
                {blogPosts.length === 0 ? (
                  <p style={{ color: COLORS.muted, textAlign: 'center', padding: '20px 0', fontSize: 13 }}>Abhi koi post nahi hai.</p>
                ) : blogPosts.map(post => (
                  <div key={post.id} style={{ padding: '14px 0', borderBottom: `1px solid ${COLORS.surfaceBorder}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ flex: 1, marginRight: 8 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.text }}>{post.title}</div>
                        <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 3 }}>
                          {post.category} • {new Date(post.created_at).toLocaleDateString('en-IN')}
                        </div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: post.published ? COLORS.green : COLORS.gold, backgroundColor: post.published ? COLORS.greenLight : COLORS.goldLight, padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                        {post.published ? '🟢 Live' : '📝 Draft'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEditPost(post)} style={{ flex: 1, fontSize: 11, padding: '7px 6px', borderRadius: 8, border: `1.5px solid ${COLORS.surfaceBorder}`, backgroundColor: 'transparent', color: COLORS.blue, cursor: 'pointer', fontWeight: 700 }}>✏️ Edit</button>
                      <button onClick={() => handleTogglePublish(post)} style={{ flex: 1, fontSize: 11, padding: '7px 6px', borderRadius: 8, border: 'none', backgroundColor: post.published ? COLORS.goldLight : COLORS.green, color: post.published ? COLORS.goldDim : '#FFF', cursor: 'pointer', fontWeight: 700 }}>
                        {post.published ? '📝 Unpublish' : '🚀 Publish'}
                      </button>
                      <button onClick={() => handleDeletePost(post)} style={{ fontSize: 11, padding: '7px 10px', borderRadius: 8, border: `1.5px solid ${COLORS.surfaceBorder}`, backgroundColor: 'transparent', color: COLORS.red, cursor: 'pointer', fontWeight: 700 }}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'fund' && <AdminFund userEmail={user?.email} />}

          {activeTab === 'signals' && <AdminSignals />}
        </div>
      </div>

      {editUser && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}>
          <div style={{ backgroundColor: COLORS.surface, borderRadius: 20, padding: 24, width: '100%', maxWidth: 360, boxShadow: '0 8px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>💰 Subscription Do</div>
            {editUser.name && <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 2 }}>{editUser.name}</div>}
            <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 16, wordBreak: 'break-all' }}>{editUser.email}</div>
            <div style={{ fontSize: 11, color: COLORS.muted, fontWeight: 700, marginBottom: 8 }}>MONTHS CHOOSE KARO</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {[1, 2, 3].map(m => (
                <button key={m} onClick={() => setEditMonths(m)} style={{ flex: 1, padding: '12px 8px', fontSize: 13, fontWeight: 700, borderRadius: 10, border: 'none', backgroundColor: editMonths===m ? COLORS.gold : COLORS.bg, color: editMonths===m ? '#FFF' : COLORS.muted, cursor: 'pointer' }}>{m} Month</button>
              ))}
            </div>
            <button onClick={handleSubscribe} disabled={saving} style={{ width: '100%', padding: '13px', fontSize: 14, fontWeight: 700, borderRadius: 12, border: 'none', backgroundColor: COLORS.gold, color: '#FFF', cursor: 'pointer', marginBottom: 10 }}>
              {saving ? '⏳ Save ho raha hai...' : '✅ Confirm Karo'}
            </button>
            <button onClick={() => setEditUser(null)} style={{ width: '100%', padding: '10px', fontSize: 13, fontWeight: 600, borderRadius: 12, border: `1.5px solid ${COLORS.surfaceBorder}`, backgroundColor: 'transparent', color: COLORS.muted, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {editingPost !== null && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 200, padding: 20, overflowY: 'auto' }}>
          <div style={{ backgroundColor: COLORS.surface, borderRadius: 20, padding: 24, width: '100%', maxWidth: 480, marginTop: 20, marginBottom: 20, boxShadow: '0 8px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>{editingPost?.id ? '✏️ Post Edit Karo' : '✏️ Naya Post'}</div>

            <div style={labelStyle}>TITLE</div>
            <input value={postForm.title} onChange={e => setPostForm(f => ({ ...f, title: e.target.value }))} placeholder="Post ka title..." style={inputStyle} />

            <div style={labelStyle}>SLUG (URL) — khali chodo, auto ban jayega</div>
            <input value={postForm.slug} onChange={e => setPostForm(f => ({ ...f, slug: e.target.value }))} placeholder="lucky-number-kaise-nikale" style={{ ...inputStyle, fontFamily: 'monospace' }} />

            <div style={labelStyle}>CATEGORY</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              {['Numerology', 'Trading Tips', 'Market Analysis'].map(cat => (
                <button key={cat} onClick={() => setPostForm(f => ({ ...f, category: cat }))} style={{ flex: 1, padding: '8px 4px', fontSize: 11, fontWeight: 700, borderRadius: 8, border: 'none', backgroundColor: postForm.category === cat ? COLORS.gold : COLORS.bg, color: postForm.category === cat ? '#FFF' : COLORS.muted, cursor: 'pointer' }}>{cat}</button>
              ))}
            </div>

            <div style={labelStyle}>EXCERPT (short summary, listing page ke liye)</div>
            <textarea value={postForm.excerpt} onChange={e => setPostForm(f => ({ ...f, excerpt: e.target.value }))} placeholder="1-2 line ka summary..." rows={2} style={{ ...inputStyle, resize: 'vertical' }} />

            <div style={labelStyle}>CONTENT (poora post)</div>
            <textarea value={postForm.content} onChange={e => setPostForm(f => ({ ...f, content: e.target.value }))} placeholder="Poora blog post likho..." rows={10} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />

            <div style={labelStyle}>META DESCRIPTION (Google search ke liye, ~150 chars)</div>
            <textarea value={postForm.meta_description} onChange={e => setPostForm(f => ({ ...f, meta_description: e.target.value }))} placeholder="Google search results mein ye line dikhegi..." rows={2} style={{ ...inputStyle, resize: 'vertical', marginBottom: 20 }} />

            <button onClick={handleSavePost} disabled={savingPost} style={{ width: '100%', padding: '13px', fontSize: 14, fontWeight: 700, borderRadius: 12, border: 'none', backgroundColor: COLORS.gold, color: '#FFF', cursor: 'pointer', marginBottom: 10 }}>
              {savingPost ? '⏳ Save ho raha hai...' : '💾 Save Karo'}
            </button>
            <button onClick={() => setEditingPost(null)} style={{ width: '100%', padding: '10px', fontSize: 13, fontWeight: 600, borderRadius: 12, border: `1.5px solid ${COLORS.surfaceBorder}`, backgroundColor: 'transparent', color: COLORS.muted, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
