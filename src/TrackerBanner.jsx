import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

const C = { gold: '#C8920A', green: '#34D399', red: '#F87171' };
const daysBetween = (a, b) => Math.max(0, Math.round((new Date(b) - new Date(a)) / 86400000));

// Admin panel ke upar chhota tracker banner — signal_tracking se win rate, wins, losses, open, avg R, avg din
export default function TrackerBanner({ onOpen, refreshKey }) {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      let all = [];
      let from = 0;
      const size = 1000;
      while (true) {
        const { data, error } = await supabase
          .from('signal_tracking')
          .select('status, r_multiple, signal_date, closed_date')
          .range(from, from + size - 1);
        if (error || !data) break;
        all = all.concat(data);
        if (data.length < size) break;
        from += size;
      }
      if (alive) setRows(all);
    })();
    return () => { alive = false; };
  }, [refreshKey]);

  const list = rows || [];
  const win = list.filter(s => s.status === 'win').length;
  const loss = list.filter(s => s.status === 'loss').length;
  const open = list.filter(s => s.status === 'open').length;
  const closed = win + loss;
  const winRate = closed > 0 ? ((win / closed) * 100).toFixed(1) : null;

  const rs = list
    .filter(s => (s.status === 'win' || s.status === 'loss') && s.r_multiple !== null && s.r_multiple !== undefined)
    .map(s => Number(s.r_multiple));
  const avgR = rs.length ? rs.reduce((a, b) => a + b, 0) / rs.length : null;

  const ds = list
    .filter(s => (s.status === 'win' || s.status === 'loss') && s.closed_date && s.signal_date)
    .map(s => daysBetween(s.signal_date, s.closed_date));
  const avgDays = ds.length ? ds.reduce((a, b) => a + b, 0) / ds.length : null;

  const cell = (label, value, color) => (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{ fontSize: 18, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: 700 }}>{label}</div>
    </div>
  );

  return (
    <div onClick={onOpen} style={{
      cursor: 'pointer', borderRadius: 16, padding: '14px 12px', marginBottom: 16,
      background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, padding: '0 4px' }}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: C.gold, fontWeight: 800 }}>🎯 SIGNAL TRACKER (SWING)</div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>tap = details →</div>
      </div>
      {rows === null ? (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 12, padding: '8px 0' }}>⏳ Loading...</div>
      ) : (
        <>
          <div style={{ textAlign: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 32, fontWeight: 900, color: '#FFF' }}>{winRate !== null ? `${winRate}%` : '—'}</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginLeft: 8 }}>win rate ({closed} closed)</span>
          </div>
          <div style={{ display: 'flex' }}>
            {cell('Wins', win, C.green)}
            {cell('Losses', loss, C.red)}
            {cell('Open', open, C.gold)}
            {cell('Avg R', avgR === null ? '—' : `${avgR > 0 ? '+' : ''}${avgR.toFixed(2)}`, avgR === null ? '#FFF' : avgR > 0 ? C.green : C.red)}
            {cell('Avg din', avgDays === null ? '—' : avgDays.toFixed(1), '#FFF')}
          </div>
        </>
      )}
    </div>
  );
}
