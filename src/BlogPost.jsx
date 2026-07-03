import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

const COLORS = {
  bg: '#F4F6FA', surface: '#FFFFFF', border: '#E2E8F0',
  gold: '#C8920A', goldLight: '#FEF3C7',
  text: '#0F172A', muted: '#64748B',
};

export default function BlogPost({ slug }) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = { title: post?.title || 'PulseTrade Blog', text: post?.excerpt || '', url };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch (e) { /* user cancelled */ }
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setNotFound(true);
        } else {
          setPost(data);
          document.title = `${data.title} | PulseTrade Blog`;
          let meta = document.querySelector('meta[name="description"]');
          if (!meta) {
            meta = document.createElement('meta');
            meta.name = 'description';
            document.head.appendChild(meta);
          }
          meta.content = data.meta_description || data.excerpt || '';
        }
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div style={{ backgroundColor: COLORS.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', color: COLORS.muted }}>
        ⏳ Loading...
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ backgroundColor: COLORS.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', gap: 16 }}>
        <div style={{ fontSize: 48 }}>🔍</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.text }}>Ye post nahi mili</div>
        <a href="/blog" style={{ color: COLORS.gold, fontWeight: 600, textDecoration: 'none' }}>← Blog par wapas jao</a>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: COLORS.bg, minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif', color: COLORS.text }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 0 60px' }}>

        <div style={{ backgroundColor: COLORS.surface, borderBottom: `1px solid ${COLORS.border}`, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.text }}>Pulse<span style={{ color: COLORS.gold }}>Trade</span></div>
          </a>
          <a href="/blog" style={{ fontSize: 12, padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${COLORS.border}`, color: COLORS.muted, textDecoration: 'none', fontWeight: 600 }}>← Blog</a>
        </div>

        <div style={{ padding: '32px 20px 0' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.gold, backgroundColor: COLORS.goldLight, padding: '3px 10px', borderRadius: 20 }}>{post.category}</span>
          <h1 style={{ fontSize: 26, fontWeight: 900, margin: '14px 0 8px', lineHeight: 1.3 }}>{post.title}</h1>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: COLORS.muted }}>{new Date(post.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            <button onClick={handleShare} style={{ fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${COLORS.border}`, backgroundColor: 'transparent', color: COLORS.text, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              {copied ? '✅ Copied!' : '📤 Share'}
            </button>
          </div>

          <div style={{ fontSize: 15, lineHeight: 1.9, color: COLORS.text, whiteSpace: 'pre-wrap' }}>
            {post.content}
          </div>

          <div style={{ marginTop: 40, padding: 24, backgroundColor: COLORS.goldLight, borderRadius: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>PulseTrade ka free trial try karo</div>
            <a href="/" style={{ display: 'inline-block', padding: '12px 28px', backgroundColor: COLORS.gold, color: '#FFF', borderRadius: 10, fontWeight: 700, textDecoration: 'none', fontSize: 14 }}>Abhi Try Karo →</a>
          </div>
        </div>
      </div>
    </div>
  );
}
