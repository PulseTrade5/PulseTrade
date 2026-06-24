import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

const COLORS = {
  bg: "#0D1117", surface: "#161B22", border: "#30363D",
  gold: "#D8A33D", goldLight: "#2D2008", goldDim: "#F0B429",
  green: "#3FAE7C", greenLight: "#0D2B1F",
  red: "#F87171", redLight: "#2D1515",
  text: "#E8E6E0", muted: "#8B92A0",
  purple: "#A78BFA", purpleLight: "#1E1B4B",
};

function getWeekNumber() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);
}

function getWeekDates() {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  return {
    start: monday.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    end: friday.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
  };
}

const BADGES_CONFIG = [
  { id: 'rookie', name: 'Rookie Trader', icon: '🌱', points: 100, desc: 'Pehle 100 points' },
  { id: 'smart', name: 'Smart Trader', icon: '📊', points: 500, desc: '500 points milestone' },
  { id: 'pro', name: 'Pro Trader', icon: '🎯', points: 1000, desc: '1000 points milestone' },
  { id: 'elite', name: 'Elite Trader', icon: '👑', points: 2000, desc: '2000 points — Legend!' },
];

export default function ChallengeBoard({ user, onBack }) {
  const [tab, setTab] = useState('challenge');
  const [voted, setVoted] = useState(null);
  const [voteLoading, setVoteLoading] = useState(false);
  const [challenge, setChallenge] = useState(null);
  const [myPoints, setMyPoints] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  const weekNo = getWeekNumber();
  const year = new Date().getFullYear();
  const weekDates = getWeekDates();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load or create weekly challenge
      let { data: ch } = await supabase
        .from('weekly_challenges')
        .select('*')
        .eq('week_number', weekNo)
        .eq('year', year)
        .single();

      if (!ch) {
        const { data: newCh } = await supabase
          .from('weekly_challenges')
          .insert({
            week_number: weekNo,
            year,
            question: 'Is hafte NIFTY50 kahan jayega?',
            result: 'pending',
            bullish_count: 0,
            bearish_count: 0,
          })
          .select()
          .single();
        ch = newCh;
      }
      setChallenge(ch);

      // Load user's prediction
      if (user?.id) {
        const { data: pred } = await supabase
          .from('predictions')
          .select('*')
          .eq('user_id', user.id)
          .eq('week_number', weekNo)
          .eq('year', year)
          .single();
        if (pred) setVoted(pred.prediction);

        // Load user points
        let { data: pts } = await supabase
          .from('pulse_points')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (!pts) {
          const { data: newPts } = await supabase
            .from('pulse_points')
            .insert({ user_id: user.id, total_points: 0, streak_days: 0, badges: [] })
            .select()
            .single();
          pts = newPts;
        }
        setMyPoints(pts);
      }

      // Load leaderboard
      const { data: lb } = await supabase
        .from('pulse_points')
        .select('user_id, total_points, streak_days, badges')
        .order('total_points', { ascending: false })
        .limit(10);

      if (lb) {
        const withNames = await Promise.all(lb.map(async (p) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('id', p.user_id)
            .single();
          return {
            ...p,
            name: profile?.name || profile?.email?.split('@')[0] || 'Trader',
            isMe: p.user_id === user?.id,
          };
        }));
        setLeaderboard(withNames);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (prediction) => {
    if (!user?.id || voted || voteLoading) return;
    setVoteLoading(true);
    try {
      // Save prediction
      await supabase.from('predictions').insert({
        user_id: user.id,
        week_number: weekNo,
        year,
        prediction,
        result: 'pending',
        points_earned: 0,
      });

      // Update vote count
      await supabase.from('weekly_challenges')
        .update({
          bullish_count: prediction === 'bullish'
            ? (challenge?.bullish_count || 0) + 1
            : (challenge?.bullish_count || 0),
          bearish_count: prediction === 'bearish'
            ? (challenge?.bearish_count || 0) + 1
            : (challenge?.bearish_count || 0),
        })
        .eq('week_number', weekNo)
        .eq('year', year);

      // Add 5 points for voting
      await supabase.from('pulse_points')
        .update({ total_points: (myPoints?.total_points || 0) + 5 })
        .eq('user_id', user.id);

      setVoted(prediction);
      setMyPoints(prev => ({ ...prev, total_points: (prev?.total_points || 0) + 5 }));
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setVoteLoading(false);
    }
  };

  const totalVotes = (challenge?.bullish_count || 0) + (challenge?.bearish_count || 0);
  const bullishPct = totalVotes > 0 ? Math.round((challenge?.bullish_count / totalVotes) * 100) : 50;
  const bearishPct = totalVotes > 0 ? Math.round((challenge?.bearish_count / totalVotes) * 100) : 50;

  const cardStyle = {
    backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}`,
    borderRadius: 16, padding: 16, marginBottom: 14,
  };

  const rowStyle = {
    display: 'flex', justifyContent: 'space-between',
    fontSize: 13, padding: '7px 0', borderBottom: `1px solid ${COLORS.border}`,
  };

  if (loading) return (
    <div style={{ backgroundColor: COLORS.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ textAlign: 'center', color: COLORS.muted }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
        <div>Load ho raha hai...</div>
      </div>
    </div>
  );

  return (
    <div style={{ backgroundColor: COLORS.bg, minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif', color: COLORS.text }}>
      <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 48 }}>

        {/* HEADER */}
        <div style={{
          backgroundColor: COLORS.surface, borderBottom: `1px solid ${COLORS.border}`,
          padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 8px rgba(0,0,0,0.2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={onBack} style={{
              background: 'none', border: `1px solid ${COLORS.border}`,
              color: COLORS.muted, borderRadius: 8, padding: '4px 10px',
              cursor: 'pointer', fontSize: 13,
            }}>← Back</button>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>
                Pulse<span style={{ color: COLORS.gold }}>Challenge</span>
              </div>
              <div style={{ fontSize: 10, color: COLORS.muted }}>🔱 हर हर महादेव 🔱</div>
            </div>
          </div>
          <div style={{
            backgroundColor: COLORS.goldLight, border: `1px solid ${COLORS.gold}`,
            borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 700, color: COLORS.gold,
          }}>
            ⚡ {myPoints?.total_points || 0} pts
          </div>
        </div>

        {/* TABS */}
        <div style={{
          display: 'flex', gap: 4, padding: 4,
          backgroundColor: COLORS.surface, borderBottom: `1px solid ${COLORS.border}`,
        }}>
          {[['challenge', '🎯 Challenge'], ['leaderboard', '🏆 Board'], ['points', '🎖️ My Points']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              flex: 1, padding: '8px 4px', fontSize: 11, fontWeight: 700,
              borderRadius: 10, border: 'none',
              backgroundColor: tab === key ? COLORS.gold : 'transparent',
              color: tab === key ? '#0D1117' : COLORS.muted,
              cursor: 'pointer',
            }}>{label}</button>
          ))}
        </div>

        <div style={{ padding: '16px 16px 0' }}>

          {/* CHALLENGE TAB */}
          {tab === 'challenge' && (
            <>
              {/* Weekly Challenge Card */}
              <div style={{
                background: 'linear-gradient(135deg, #0D1117, #1a2a1a)',
                border: `2px solid ${COLORS.gold}`,
                borderRadius: 20, padding: 20, marginBottom: 16,
                boxShadow: `0 8px 32px ${COLORS.gold}22`,
              }}>
                <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.gold, fontWeight: 800, marginBottom: 8 }}>
                  🎯 WEEKLY CHALLENGE — WEEK {weekNo}
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 900, margin: '0 0 6px', lineHeight: 1.3, color: COLORS.text }}>
                  {challenge?.question || 'Is hafte NIFTY50 kahan jayega?'}
                </h2>
                <p style={{ fontSize: 12, color: COLORS.muted, margin: '0 0 20px' }}>
                  {weekDates.start} → {weekDates.end}
                </p>

                {challenge?.result !== 'pending' ? (
                  // Result declared
                  <div style={{
                    backgroundColor: challenge.result === 'bullish' ? `${COLORS.green}22` : `${COLORS.red}22`,
                    border: `2px solid ${challenge.result === 'bullish' ? COLORS.green : COLORS.red}`,
                    borderRadius: 12, padding: 16, textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>
                      {challenge.result === 'bullish' ? '📈' : '📉'}
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 16, color: challenge.result === 'bullish' ? COLORS.green : COLORS.red }}>
                      Result: {challenge.result === 'bullish' ? 'Bullish' : 'Bearish'} Raha!
                    </div>
                    {voted === challenge.result ? (
                      <div style={{ color: COLORS.green, fontWeight: 700, marginTop: 8 }}>
                        🎉 Sahi prediction! +50 points mile!
                      </div>
                    ) : (
                      <div style={{ color: COLORS.red, fontWeight: 700, marginTop: 8 }}>
                        ❌ Is baar nahi hua — agli baar try karo!
                      </div>
                    )}
                  </div>
                ) : !voted ? (
                  // Voting open
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => handleVote('bullish')} disabled={voteLoading} style={{
                      flex: 1, padding: '14px', borderRadius: 12,
                      border: `2px solid ${COLORS.green}`,
                      backgroundColor: `${COLORS.green}22`, color: COLORS.green,
                      fontSize: 15, fontWeight: 800, cursor: 'pointer',
                    }}>
                      📈 Bullish<br />
                      <span style={{ fontSize: 11, fontWeight: 600 }}>Upar jayega</span>
                    </button>
                    <button onClick={() => handleVote('bearish')} disabled={voteLoading} style={{
                      flex: 1, padding: '14px', borderRadius: 12,
                      border: `2px solid ${COLORS.red}`,
                      backgroundColor: `${COLORS.red}22`, color: COLORS.red,
                      fontSize: 15, fontWeight: 800, cursor: 'pointer',
                    }}>
                      📉 Bearish<br />
                      <span style={{ fontSize: 11, fontWeight: 600 }}>Neeche jayega</span>
                    </button>
                  </div>
                ) : (
                  // Already voted
                  <div>
                    <div style={{
                      backgroundColor: voted === 'bullish' ? `${COLORS.green}22` : `${COLORS.red}22`,
                      border: `2px solid ${voted === 'bullish' ? COLORS.green : COLORS.red}`,
                      borderRadius: 12, padding: 14, textAlign: 'center', marginBottom: 12,
                    }}>
                      <div style={{ fontSize: 24, marginBottom: 4 }}>{voted === 'bullish' ? '📈' : '📉'}</div>
                      <div style={{ fontWeight: 800, color: voted === 'bullish' ? COLORS.green : COLORS.red }}>
                        Tumne {voted === 'bullish' ? 'Bullish' : 'Bearish'} vote kiya!
                      </div>
                      <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 4 }}>
                        Result Shukrawar ko aayega 🎯
                      </div>
                    </div>

                    {/* Vote stats */}
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: COLORS.muted, marginBottom: 6 }}>
                        <span>📈 Bullish — {bullishPct}%</span>
                        <span>📉 Bearish — {bearishPct}%</span>
                      </div>
                      <div style={{ height: 8, backgroundColor: COLORS.border, borderRadius: 99, overflow: 'hidden', display: 'flex' }}>
                        <div style={{ width: `${bullishPct}%`, backgroundColor: COLORS.green, borderRadius: '99px 0 0 99px', transition: 'width 1s ease' }} />
                        <div style={{ width: `${bearishPct}%`, backgroundColor: COLORS.red, borderRadius: '0 99px 99px 0', transition: 'width 1s ease' }} />
                      </div>
                      <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 4, textAlign: 'center' }}>
                        {totalVotes} traders ne vote kiya
                      </div>
                    </div>

                    <div style={{ backgroundColor: COLORS.goldLight, borderRadius: 10, padding: 10, textAlign: 'center', fontSize: 12, color: COLORS.gold, fontWeight: 700 }}>
                      🎯 Sahi prediction pe +50 Pulse Points milenge!
                    </div>
                  </div>
                )}
              </div>

              {/* Points earning guide */}
              <div style={cardStyle}>
                <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.muted, marginBottom: 12, fontWeight: 700 }}>⚡ POINTS KAISE MILENGE</div>
                {[
                  ['✅ Sahi prediction', '+50 pts'],
                  ['🗳️ Vote karo (win/loss)', '+5 pts'],
                  ['📊 Stock check karo', '+5 pts'],
                  ['⭐ Watchlist add karo', '+3 pts'],
                  ['🔥 7 din streak', '+25 pts'],
                  ['🎯 3 baar sahi prediction', '+100 pts bonus'],
                ].map(([action, pts]) => (
                  <div key={action} style={rowStyle}>
                    <span style={{ color: COLORS.muted }}>{action}</span>
                    <span style={{ fontWeight: 700, color: COLORS.gold }}>{pts}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* LEADERBOARD TAB */}
          {tab === 'leaderboard' && (
            <div style={cardStyle}>
              <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.muted, marginBottom: 16, fontWeight: 700 }}>🏆 TOP TRADERS</div>
              {leaderboard.length === 0 ? (
                <p style={{ color: COLORS.muted, textAlign: 'center', padding: '20px 0' }}>Abhi koi data nahi hai.</p>
              ) : leaderboard.map((u, i) => {
                const badge = i === 0 ? '👑' : i === 1 ? '🥇' : i === 2 ? '🥈' : i === 3 ? '🥉' : '⭐';
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 8px', borderBottom: `1px solid ${COLORS.border}`,
                    backgroundColor: u.isMe ? `${COLORS.gold}11` : 'transparent',
                    borderRadius: u.isMe ? 8 : 0,
                  }}>
                    <div style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{badge}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: u.isMe ? COLORS.gold : COLORS.text }}>
                        {u.name} {u.isMe ? '👈 You' : ''}
                      </div>
                      <div style={{ fontSize: 11, color: COLORS.muted }}>🔥 {u.streak_days} din streak</div>
                    </div>
                    <div style={{ fontWeight: 800, color: COLORS.gold, fontSize: 16 }}>
                      {u.total_points.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* MY POINTS TAB */}
          {tab === 'points' && (
            <>
              {/* Points summary */}
              <div style={{
                background: 'linear-gradient(135deg, #0D1117, #1a1a0d)',
                border: `2px solid ${COLORS.gold}`,
                borderRadius: 20, padding: 20, marginBottom: 16, textAlign: 'center',
                boxShadow: `0 8px 32px ${COLORS.gold}22`,
              }}>
                <div style={{ fontSize: 52, fontWeight: 900, color: COLORS.gold }}>
                  {myPoints?.total_points || 0}
                </div>
                <div style={{ fontSize: 14, color: COLORS.muted, marginBottom: 16 }}>Pulse Points</div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
                  {[
                    ['🔥', myPoints?.streak_days || 0, 'Din Streak'],
                  ].map(([icon, val, label]) => (
                    <div key={label} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 20 }}>{icon}</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.gold }}>{val}</div>
                      <div style={{ fontSize: 11, color: COLORS.muted }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Badges */}
              <div style={cardStyle}>
                <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.muted, marginBottom: 12, fontWeight: 700 }}>🎖️ BADGES</div>
                {BADGES_CONFIG.map(badge => {
                  const unlocked = (myPoints?.total_points || 0) >= badge.points;
                  return (
                    <div key={badge.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: 12, borderRadius: 12, marginBottom: 8,
                      backgroundColor: unlocked ? `${COLORS.gold}11` : `${COLORS.border}22`,
                      border: `1px solid ${unlocked ? COLORS.gold : COLORS.border}`,
                      opacity: unlocked ? 1 : 0.5,
                    }}>
                      <div style={{ fontSize: 28 }}>{badge.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: unlocked ? COLORS.gold : COLORS.muted }}>{badge.name}</div>
                        <div style={{ fontSize: 11, color: COLORS.muted }}>{badge.desc}</div>
                      </div>
                      {unlocked ? (
          
