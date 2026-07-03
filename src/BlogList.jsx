import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

const COLORS = {
  bg: '#F4F6FA', surface: '#FFFFFF', border: '#E2E8F0',
  gold: '#C8920A', goldLight: '#FEF3C7',
  text: '#0F172A', muted: '#64748B',
};

export default function BlogList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Blog | PulseTrade - Numerology + Trading Insights';
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = 'PulseTrade blog: numerology aur trading ke baare mein articles, tips, aur guides. Chaldean numerology se lucky number nikalna seekho.';

    supabase
      .from('blog_posts')
      .select('title, slug, excerpt, category, created_at')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setPosts(data || []);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ backgroundColor: COLORS.bg, minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif', color: COLORS.text }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 0 60px' }}>

        <div style={{ backgroundColor: COLORS.surface, borderBottom: `1px solid ${COLORS.border}`, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.text }}>Pulse<span style={{ color: COLORS.gold }}>Trade</span></div>
          </a>
          <a href="/" style={{ fontSize: 12, padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${COLORS.border}`, color: COLORS.muted, textDecoration: 'none', fontWeight: 600 }}>← Dashboard</a>
        </div>

        <div style={{ padding: '32px 20px 12px' }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0 }}>Blog</h1>
          <p style={{ fontSize: 14, color: COLORS.muted, marginTop: 6 }}>Numerology aur trading ke baare mein insights, tips, aur guides.</p>
        </div>

        <div style={{ padding: '12px 20px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: COLORS.muted, padding: '40px 0' }}>⏳ Loading...</div>
          ) : posts.length === 0 ? (
            <div style={{ textAlign: 'center', color: COLORS.muted, padding: '40px 0' }}>Abhi koi post nahi hai. Jaldi aa raha hai!</div>
          ) : posts.map(post => (
            <a key={post.slug} href={`/blog/${post.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 20, marginBottom: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.gold, backgroundColor: COLORS.goldLight, padding: '3px 10px', borderRadius: 20 }}>{post.category}</span>
                <h2 style={{ fontSize: 18, fontWeight: 800, margin: '10px 0 6px' }}>{post.title}</h2>
                {post.excerpt && <p style={{ fontSize: 13, color: COLORS.muted, margin: 0, lineHeight: 1.6 }}>{post.excerpt}</p>}
                <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 10 }}>{new Date(post.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
