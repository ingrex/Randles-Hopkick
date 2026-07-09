import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { loadBlogPosts, loadFeatured, refreshBlogCache } from "./data/blogPosts";
import HireStaffButtonB from "../components/buttons/Hirestaffbuttonb";

/* ─── scroll progress ─── */
function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const scrolled = el.scrollTop || document.body.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      setProgress(total > 0 ? Math.min(100, (scrolled / total) * 100) : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return progress;
}

/* ─── avatar ─── */
function InitialsAvatar({ name, accent, size = 36 }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%",
        background: accent + "22", border: `1.5px solid ${accent}66`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.36, fontWeight: 600, color: accent, flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

/* ─── share helpers ─── */
function shareWhatsApp(title, url) {
  window.open(`https://wa.me/?text=${encodeURIComponent(title + "\n" + url)}`, "_blank");
}
function shareLinkedIn(url) {
  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, "_blank");
}
function copyLink(url, setCopied) {
  navigator.clipboard.writeText(url).then(() => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  });
}

/* ─── share bar ─── */
function ShareBar({ title, accent }) {
  const [copied, setCopied] = useState(false);
  const url = window.location.href;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <span style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "#aaa", fontWeight: 500 }}>Share:</span>
      <button
        onClick={() => shareWhatsApp(title, url)}
        style={{ fontSize: 12, color: "#25D366", fontWeight: 500, background: "none", border: "1px solid #25D36655", padding: "6px 14px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", borderRadius: 2, transition: "background 0.15s" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#25D36611")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
      >
        WhatsApp
      </button>
      <button
        onClick={() => shareLinkedIn(url)}
        style={{ fontSize: 12, color: "#0077b5", fontWeight: 500, background: "none", border: "1px solid #0077b555", padding: "6px 14px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", borderRadius: 2, transition: "background 0.15s" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#0077b511")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
      >
        LinkedIn
      </button>
      <button
        onClick={() => copyLink(url, setCopied)}
        style={{ fontSize: 12, color: copied ? "#4a7c6f" : "#888", fontWeight: 500, background: "none", border: `1px solid ${copied ? "#4a7c6f55" : "#e0dbd3"}`, padding: "6px 14px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", borderRadius: 2, transition: "all 0.15s" }}
      >
        {copied ? "✓ Copied!" : "Copy Link"}
      </button>
    </div>
  );
}

/* ─── related card ─── */
function RelatedCard({ post, onNavigate }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={() => onNavigate(post.slug)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff", border: "1px solid #ece8e0", cursor: "pointer",
        transition: "transform 0.22s, box-shadow 0.22s",
        transform: hovered ? "translateY(-4px)" : "none",
        boxShadow: hovered ? "0 12px 32px rgba(13,27,46,0.1)" : "none",
      }}
    >
      <div style={{ overflow: "hidden", height: 130 }}>
        <img
          src={post.image} alt={post.title}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.5s", transform: hovered ? "scale(1.06)" : "scale(1)" }}
        />
      </div>
      <div style={{ padding: "14px 16px" }}>
        <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: post.accent, fontWeight: 500, marginBottom: 6 }}>
          {post.category}
        </div>
        <h4 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 14, color: "#0d1b2e", lineHeight: 1.35, fontStyle: "italic", margin: 0 }}>
          {post.title}
        </h4>
        <div style={{ fontSize: 11, color: "#aaa", marginTop: 10 }}>
          {post.date} · {post.readTime} read
        </div>
      </div>
    </div>
  );
}

/* ─── reading progress pill ─── */
function ReadingProgressPill({ progress, accent }) {
  return (
    <div style={{
      position: "fixed", bottom: 28, right: 28, zIndex: 200,
      background: "#0d1b2e", borderRadius: 32,
      padding: "8px 14px 8px 10px",
      display: "flex", alignItems: "center", gap: 10,
      boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
      border: "1px solid #162840",
    }}>
      {/* mini circular progress */}
      <svg width={28} height={28} viewBox="0 0 28 28" style={{ flexShrink: 0 }}>
        <circle cx={14} cy={14} r={11} fill="none" stroke="#162840" strokeWidth={2.5} />
        <circle
          cx={14} cy={14} r={11} fill="none"
          stroke={accent} strokeWidth={2.5}
          strokeDasharray={`${2 * Math.PI * 11}`}
          strokeDashoffset={`${2 * Math.PI * 11 * (1 - progress / 100)}`}
          strokeLinecap="round"
          transform="rotate(-90 14 14)"
          style={{ transition: "stroke-dashoffset 0.2s linear" }}
        />
        <text x={14} y={14} textAnchor="middle" dominantBaseline="central" fill={accent} fontSize={7} fontWeight={700} fontFamily="DM Sans, sans-serif">
          {Math.round(progress)}%
        </text>
      </svg>
      <span style={{ fontSize: 11, color: "#888", fontFamily: "'DM Sans', sans-serif", letterSpacing: 0.3 }}>
        Reading
      </span>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
export function BlogPostPage({ slug, onNavigate, onBackToBlog, user }) {
  const scrollProgress = useScrollProgress();
  const navigate = useNavigate();
  const [showProgressPill, setShowProgressPill] = useState(false);

  useEffect(() => {
    setShowProgressPill(scrollProgress > 5 && scrollProgress < 98);
  }, [scrollProgress]);

  // ── Live data — start from cache, refresh from backend in background ───────
  const [posts,    setPosts]    = useState(() => loadBlogPosts());
  const [featured, setFeatured] = useState(() => loadFeatured());

  useEffect(() => {
    let cancelled = false;
    refreshBlogCache()
      .then(({ posts: freshPosts, featured: freshFeatured }) => {
        if (cancelled) return;
        if (freshPosts?.length)  setPosts(freshPosts);
        if (freshFeatured)       setFeatured(freshFeatured);
      })
      .catch(() => {/* keep static fallback */});
    return () => { cancelled = true; };
  }, []);

  const allArticles = featured ? [featured, ...posts] : posts;
  const article = allArticles.find((p) => p.slug === slug);

  const related = posts
    .filter((p) => p.slug !== slug && p.category === article?.category)
    .slice(0, 3);

  const relatedFinal = related.length > 0
    ? related
    : posts.filter((p) => p.slug !== slug).slice(0, 3);

  // NOTE: Removed the manual `window.history.pushState(...)` call that used to
  // live here. React Router already owns the URL for this route (App.jsx
  // matches "/blog/:slug" and BlogPostPageWrapper passes `slug` down here),
  // so a second, manual pushState was writing a duplicate/duplicate-ish entry
  // into the browser history stack on every visit. That desynced the real
  // browser history index from React Router's internal location index, which
  // is what caused "Back to Insights" / the browser back button to need
  // several clicks before it caught up. We only need the title side effect.
  useEffect(() => {
    if (article) {
      document.title = `${article.title} — Randle & Hopkick`;
    }
    return () => { document.title = "Randle & Hopkick Insights"; };
  }, [slug, article]);

  if (!article) {
    return (
      <div style={{ minHeight: "100vh", background: "#faf9f6", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 48, color: "#ece8e0" }}>404</div>
        <div style={{ fontSize: 14, color: "#888" }}>Article not found.</div>
        <button
          onClick={onBackToBlog}
          style={{ marginTop: 8, padding: "10px 28px", background: "#2385cd", color: "#fff", border: "none", fontSize: 13, fontFamily: "'DM Sans', sans-serif", cursor: "pointer" }}
        >
          ← Back to Insights
        </button>
      </div>
    );
  }

  const accent = article.accent || "#2385cd";

  return (
    <div style={{ minHeight: "100vh", background: "#faf9f6", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,400&family=DM+Serif+Display:ital@0;1&display=swap');

        .rh-btn { background: #2385cd; color: #fff; border: none; padding: 12px 28px; font-size: 13px; font-weight: 500; font-family: 'DM Sans', sans-serif; cursor: pointer; letter-spacing: 0.3px; transition: background 0.15s; border-radius: 2px; }
        .rh-btn:hover { background: #1a6aaa; }
        .rh-btn-gold { background: #c8a96e; color: #0d1b2e; border: none; padding: 12px 28px; font-size: 13px; font-weight: 500; font-family: 'DM Sans', sans-serif; cursor: pointer; letter-spacing: 0.3px; transition: background 0.15s; border-radius: 2px; }
        .rh-btn-gold:hover { background: #b8924f; }

        .rh-post-grid    { display: grid; grid-template-columns: 1fr 300px; gap: 56px; align-items: start; }
        .rh-related-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: #ece8e0; }

        @media (max-width: 768px) {
          .rh-post-grid      { grid-template-columns: 1fr; gap: 32px; }
          .rh-hero-inner     { padding: 24px 18px 28px !important; }
          .rh-hero-title     { font-size: 22px !important; }
          .rh-related-grid   { grid-template-columns: 1fr; }
          .rh-sidebar-post   { order: -1; }
          .rh-body-pad       { padding: 28px 18px !important; }
          .rh-progress-pill  { display: none; }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .rh-post-grid    { grid-template-columns: 1fr; gap: 36px; }
          .rh-hero-inner   { padding: 28px 28px 32px !important; }
          .rh-related-grid { grid-template-columns: repeat(2, 1fr); }
          .rh-sidebar-post { order: -1; }
          .rh-body-pad     { padding: 36px 28px !important; }
        }

        .rh-tag {
          display: inline-flex; align-items: center; gap: 5px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.12);
          padding: 4px 12px; border-radius: 20px;
          font-size: 10px; letter-spacing: 1.8px;
          text-transform: uppercase; font-weight: 600;
          font-family: 'DM Sans', sans-serif;
        }

        .rh-back-btn {
          background: none; border: none;
          color: #aaa; font-size: 12px; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          display: flex; align-items: center; gap: 6px;
          padding: 6px 10px 6px 0;
          transition: color 0.15s;
          letter-spacing: 0.2px;
        }
        .rh-back-btn:hover { color: #faf9f6; }
        .rh-back-btn:hover .rh-back-arrow { transform: translateX(-3px); }
        .rh-back-arrow { transition: transform 0.2s; display: inline-block; }

        .rh-divider {
          height: 1px; background: linear-gradient(90deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%);
          margin: 0;
        }
      `}</style>

      {/* ── SCROLL PROGRESS BAR (top) ── */}
      <div style={{
        position: "fixed", top: 0, left: 0, zIndex: 9999,
        height: 3, background: accent,
        width: `${scrollProgress}%`,
        transition: "width 0.1s linear",
        boxShadow: `0 0 8px ${accent}88`,
      }} />

      {/* ── READING PROGRESS PILL (floating bottom-right) ── */}
      <AnimatePresence>
        {showProgressPill && (
          <motion.div
            className="rh-progress-pill"
            initial={{ opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            style={{ position: "fixed", bottom: 28, right: 28, zIndex: 200 }}
          >
            <ReadingProgressPill progress={scrollProgress} accent={accent} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════
          HERO — fixed spacing & layout
      ══════════════════════════════ */}
      <section style={{ background: "#0d1b2e", position: "relative" }}>

        {/* Back nav — sits directly under the site's main navbar (top: 88px is the navbar height) */}
        <div style={{
          position: "sticky",
          top: 88,            /* aligns flush under the main site nav */
          zIndex: 100,
          background: "rgba(13,27,46,0.96)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px", height: 44, display: "flex", alignItems: "center" }}>
            <button className="rh-back-btn" onClick={onBackToBlog}>
              <span className="rh-back-arrow">←</span>
              Back to Insights
            </button>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
              {/* reading progress text */}
              <span style={{ fontSize: 11, color: "#444", fontFamily: "'DM Sans', sans-serif" }}>
                {scrollProgress < 5 ? "" : `${Math.round(scrollProgress)}% read`}
              </span>
              <span style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#3a3630" }}>
                Randle & Hopkick
              </span>
            </div>
          </div>
        </div>

        {/* Hero content — tightly padded, no excessive top space */}
        <motion.div
          className="rh-hero-inner"
          style={{ maxWidth: 1200, margin: "0 auto", padding: "36px 32px 32px" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        >
          {/* Category + read time badges */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
            <span className="rh-tag" style={{ color: accent, borderColor: accent + "44", background: accent + "15" }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: accent, display: "inline-block" }} />
              {article.category}
            </span>
            <span style={{ fontSize: 10, color: "#444" }}>·</span>
            <span style={{ fontSize: 11, color: "#555", letterSpacing: 0.3, fontFamily: "'DM Sans', sans-serif" }}>
              {article.readTime} read
            </span>
          </div>

          {/* Title */}
          <h1
            className="rh-hero-title"
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 32,
              color: "#faf9f6",
              lineHeight: 1.22,
              letterSpacing: "-0.4px",
              fontStyle: "italic",
              maxWidth: 720,
              margin: "0 0 14px",
            }}
          >
            {article.title}
          </h1>

          {/* Excerpt */}
          <p style={{
            fontSize: 15, color: "#777", lineHeight: 1.7,
            maxWidth: 620, margin: "0 0 24px",
            fontWeight: 300,
          }}>
            {article.excerpt}
          </p>

          {/* Author row */}
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            paddingTop: 20,
            borderTop: "1px solid rgba(255,255,255,0.07)",
          }}>
            <InitialsAvatar name={article.author} accent={accent} size={40} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: "#d0cdc8", fontWeight: 500 }}>{article.author}</div>
              <div style={{ fontSize: 11, color: "#555", marginTop: 2, lineHeight: 1.5 }}>
                {article.date}
                {article.authorBio && (
                  <>
                    <span style={{ margin: "0 6px", color: "#333" }}>·</span>
                    <span style={{ color: "#4a4742" }}>{article.authorBio}</span>
                  </>
                )}
              </div>
            </div>
            {/* Inline share — visible on desktop hero */}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => shareWhatsApp(article.title, window.location.href)}
                title="Share on WhatsApp"
                style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(37,211,102,0.12)", border: "1px solid rgba(37,211,102,0.25)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, transition: "background 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(37,211,102,0.22)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(37,211,102,0.12)")}
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.553 4.116 1.522 5.847L0 24l6.335-1.502A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.817 9.817 0 01-5.006-1.374l-.36-.214-3.726.883.899-3.625-.235-.373A9.818 9.818 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/></svg>
              </button>
              <button
                onClick={() => shareLinkedIn(window.location.href)}
                title="Share on LinkedIn"
                style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(0,119,181,0.12)", border: "1px solid rgba(0,119,181,0.25)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, transition: "background 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,119,181,0.22)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,119,181,0.12)")}
              >
                <svg viewBox="0 0 24 24" width="12" height="12" fill="#0077b5"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </button>
            </div>
          </div>
        </motion.div>

        <div className="rh-divider" />

        {/* Hero image */}
        <div style={{ overflow: "hidden", maxHeight: 400, position: "relative" }}>
          <motion.img
            src={article.image} alt={article.title}
            style={{ width: "100%", height: 400, objectFit: "cover", display: "block" }}
            initial={{ scale: 1.05, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
          {/* subtle gradient overlay on image bottom */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, background: "linear-gradient(to top, #faf9f6 0%, transparent 100%)" }} />
        </div>
      </section>

      {/* ── BODY ── */}
      <main className="rh-body-pad" style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 32px" }}>
        <div className="rh-post-grid">

          {/* ── ARTICLE CONTENT ── */}
          <article>
            <div style={{ marginBottom: 32, paddingBottom: 22, borderBottom: "1px solid #ece8e0" }}>
              <ShareBar title={article.title} accent={accent} />
            </div>

            <div style={{ maxWidth: 680 }}>
              {(article.content || []).map((block, i) => {
                if (block.type === "paragraph") {
                  return (
                    <motion.p
                      key={i}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "0px 0px -40px 0px" }}
                      transition={{ duration: 0.45, delay: 0.05 }}
                      style={{ fontSize: 16, color: "#3a3630", lineHeight: 1.88, marginBottom: 24 }}
                    >
                      {block.text}
                    </motion.p>
                  );
                }
                if (block.type === "heading") {
                  return (
                    <motion.h2
                      key={i}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "0px 0px -40px 0px" }}
                      transition={{ duration: 0.45 }}
                      style={{
                        fontFamily: "'DM Serif Display', serif",
                        fontSize: 22, color: "#0d1b2e", fontStyle: "italic",
                        lineHeight: 1.3, marginTop: 44, marginBottom: 16,
                        paddingLeft: 16, borderLeft: `3px solid ${accent}`,
                      }}
                    >
                      {block.text}
                    </motion.h2>
                  );
                }
                if (block.type === "quote") {
                  return (
                    <motion.blockquote
                      key={i}
                      initial={{ opacity: 0, x: -16 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5 }}
                      style={{
                        margin: "36px 0", padding: "24px 28px",
                        background: "#f4f1ec",
                        borderLeft: `4px solid ${accent}`,
                        fontFamily: "'DM Serif Display', serif",
                        fontSize: 19, color: "#0f2238",
                        fontStyle: "italic", lineHeight: 1.58,
                        borderRadius: "0 4px 4px 0",
                      }}
                    >
                      "{block.text}"
                    </motion.blockquote>
                  );
                }
                return null;
              })}
            </div>

            <div style={{ marginTop: 52, paddingTop: 28, borderTop: "1px solid #ece8e0" }}>
              <div style={{ fontSize: 13, color: "#999", marginBottom: 14, fontStyle: "italic" }}>Found this useful? Share it with someone who needs it.</div>
              <ShareBar title={article.title} accent={accent} />
            </div>

            {/* CTA block */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              style={{
                marginTop: 48,
                background: "linear-gradient(135deg, #0f2535 0%, #1a5fa0 60%, #2385cd 100%)",
                padding: "36px 32px", position: "relative", overflow: "hidden",
                borderRadius: 4,
              }}
            >
              <div style={{ position: "absolute", right: -40, top: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} />
              <div style={{ position: "absolute", right: 60, bottom: -60, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.03)" }} />
              <div style={{ fontSize: 10, letterSpacing: 2.5, textTransform: "uppercase", color: "#c8a96e", marginBottom: 12 }}>Ready to hire?</div>
              <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: 21, color: "#faf9f6", fontStyle: "italic", lineHeight: 1.32, maxWidth: 460, marginBottom: 22 }}>
                Trusted professionals for your home and business — placed within days.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <HireStaffButtonB variant="gold" user={user} />
                <button
                  onClick={() => navigate("/services")}
                  style={{ background: "transparent", color: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.25)", padding: "12px 24px", fontSize: 13, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", borderRadius: 2, transition: "background 0.15s, border-color 0.15s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.45)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; }}
                >
                  Browse Services
                </button>
              </div>
            </motion.div>
          </article>

          {/* ── SIDEBAR ── */}
          <aside className="rh-sidebar-post">
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              <motion.div
                initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.5 }}
                style={{ background: "#0d1b2e", padding: 22, borderRadius: 3 }}
              >
                <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#2385cd", fontWeight: 500, marginBottom: 10 }}>Who We Are</div>
                <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: 15, color: "#faf9f6", fontStyle: "italic", lineHeight: 1.4, margin: "0 0 10px" }}>
                  Redefining service delivery and professionalism across Nigeria.
                </p>
                <p style={{ fontSize: 12, color: "#666", lineHeight: 1.75, margin: 0 }}>
                  Randle & Hopkick is a domestic outsourcing firm providing exceptional services across homes and corporate bodies.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.07 }}
                style={{ border: "1px solid #ece8e0", padding: 22, background: "#fff", borderRadius: 3 }}
              >
                <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#bbb", fontWeight: 500, marginBottom: 14 }}>Article Details</div>
                {[
                  { label: "Category",  value: article.category           },
                  { label: "Published", value: article.date               },
                  { label: "Read time", value: article.readTime + " read" },
                  { label: "Author",    value: article.author             },
                ].map((d, idx, arr) => (
                  <div key={d.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: idx < arr.length - 1 ? 10 : 0, paddingBottom: idx < arr.length - 1 ? 10 : 0, borderBottom: idx < arr.length - 1 ? "1px solid #f5f2ee" : "none" }}>
                    <span style={{ fontSize: 11, color: "#bbb" }}>{d.label}</span>
                    <span style={{ fontSize: 11, color: "#555", fontWeight: 500, textAlign: "right" }}>{d.value}</span>
                  </div>
                ))}
              </motion.div>

              {/* Reading progress in sidebar */}
              <motion.div
                initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}
                style={{ border: "1px solid #ece8e0", padding: 22, background: "#fff", borderRadius: 3 }}
              >
                <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#bbb", fontWeight: 500, marginBottom: 14 }}>Reading Progress</div>
                <div style={{ background: "#f5f2ee", borderRadius: 4, height: 6, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${scrollProgress}%`, background: accent, borderRadius: 4, transition: "width 0.2s linear" }} />
                </div>
                <div style={{ fontSize: 11, color: "#aaa", marginTop: 8, textAlign: "right" }}>{Math.round(scrollProgress)}% complete</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.14 }}
                style={{ background: "#f0f6fc", border: "1px solid #c8dff2", padding: 22, borderRadius: 3 }}
              >
                <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#2385cd", fontWeight: 500, marginBottom: 12 }}>Our Services</div>
                {["Domestic Staffing", "Corporate Staffing", "Staff Training", "Artisan Outsourcing"].map((s) => (
                  <div key={s} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 9, cursor: "pointer" }}>
                    <span style={{ color: "#2385cd", fontSize: 11 }}>→</span>
                    <span style={{ fontSize: 12, color: "#0d1b2e", fontWeight: 500 }}>{s}</span>
                  </div>
                ))}
                <HireStaffButtonB variant="default" user={user} style={{ width: "100%", marginTop: 14 }} />
              </motion.div>

            </div>
          </aside>
        </div>

        {/* ── RELATED ARTICLES ── */}
        {relatedFinal.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            style={{ marginTop: 72 }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: "#0d1b2e", fontStyle: "italic", margin: 0 }}>
                More from Our Insights
              </h2>
              <button
                onClick={onBackToBlog}
                style={{ background: "none", border: "1px solid #e0dbd3", color: "#888", fontSize: 12, padding: "7px 18px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", borderRadius: 2, transition: "all 0.15s" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#0d1b2e"; e.currentTarget.style.color = "#0d1b2e"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e0dbd3"; e.currentTarget.style.color = "#888"; }}
              >
                View all →
              </button>
            </div>
            <div className="rh-related-grid">
              {relatedFinal.map((p) => (
                <RelatedCard key={p.id} post={p} onNavigate={onNavigate} />
              ))}
            </div>
          </motion.section>
        )}
      </main>
    </div>
  );
}

export default BlogPostPage;