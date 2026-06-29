// src/BottomNav.jsx
const DARK = {
  bg: '#0D1117',
  surface: '#161B22',
  gold: '#D8A33D',
  text: '#E8E6E0',
  muted: '#8B92A0',
  border: '#30363D',
};

const LIGHT = {
  bg: '#F4F6FA',
  surface: '#FFFFFF',
  gold: '#C8920A',
  text: '#0F172A',
  muted: '#64748B',
  border: '#E2E8F0',
};

export default function BottomNav({ activeTab, onTabChange, isDark }) {
  const C = isDark ? DARK : LIGHT;

  const tabs = [
    { id: 'check',       icon: '📊', label: 'Check' },
    { id: 'watchlist',   icon: '⭐', label: 'Watchlist' },
    { id: 'screener',    icon: '🚀', label: 'Screener' },
    { id: 'challenge',   icon: '🎯', label: 'Challenge' },
    { id: 'numerology',  icon: '🔢', label: 'Numero' },
    { id: 'academy',     icon: '🎓', label: 'Academy' },
    { id: 'ipo',         icon: '🏦', label: 'IPO' },
    { id: 'settings',    icon: '⚙️', label: 'Settings' },
  ];

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: 480,
      backgroundColor: C.surface,
      borderTop: `1.5px solid ${C.border}`,
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      padding: '6px 0 10px',
      zIndex: 1000,
      boxShadow: '0 -4px 20px rgba(0,0,0,0.12)',
    }}>
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: 12,
              transition: 'all 0.2s ease',
              minWidth: 0,
              flex: 1,
            }}
          >
            <div style={{
              fontSize: 20,
              filter: isActive ? 'none' : 'grayscale(60%)',
              transform: isActive ? 'scale(1.15)' : 'scale(1)',
              transition: 'all 0.2s ease',
            }}>
              {tab.icon}
            </div>
            <div style={{
              fontSize: 9,
              fontWeight: isActive ? 700 : 500,
              color: isActive ? C.gold : C.muted,
              transition: 'color 0.2s ease',
              whiteSpace: 'nowrap',
            }}>
              {tab.label}
            </div>
            {isActive && (
              <div style={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                backgroundColor: C.gold,
                marginTop: 1,
              }} />
            )}
          </button>
        );
      })}
    </div>
  );
}
