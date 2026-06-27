import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://okxbdzepfzysbnxmmysx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9reGJkemVwZnp5c2JueG1teXN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNDQxMjQsImV4cCI6MjA5NzYyMDEyNH0.I5uOJhT-7aquna2fLrCLDtpsRHGMXOygWaVQn5AkIaI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
});

export async function trackLogin(userId) {
  try {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const device = isMobile ? '📱 Mobile' : '💻 Desktop';

    const ua = navigator.userAgent;
    let browser = 'Unknown';
    if (ua.includes('Edg')) browser = 'Edge';
    else if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari')) browser = 'Safari';

    let location = 'Unknown';
    try {
      const res = await fetch('https://ip-api.com/json/?fields=city,regionName,country,status');
      const data = await res.json();
      if (data.status === 'success' && data.city && data.country) {
        location = `${data.city}, ${data.regionName}, ${data.country}`;
      }
    } catch {
      location = 'Unknown';
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('login_count')
      .eq('id', userId)
      .single();

    await supabase.from('profiles').update({
      last_login: new Date().toISOString(),
      login_count: (profile?.login_count || 0) + 1,
      location: `${location} • ${browser}`,
      device: device,
    }).eq('id', userId);

  } catch (err) {
    console.log('Login track error:', err);
  }
}
