import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { loadBlogPosts, loadFeatured, refreshBlogCache } from "./data/blogPosts";

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
        background: accent + "22", border: `1px solid ${accent}55`,
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
        style={{ fontSize: 12, color: "#25D366", fontWeight: 500, background: "none", border: "1px solid #25D36655", padding: "6px 14px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "background 0.15s" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#25D36611")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
      >
        WhatsApp
      </button>
      <button
        onClick={() => shareLinkedIn(url)}
        style={{ fontSize: 12, color: "#0077b5", fontWeight: 500, background: "none", border: "1px solid #0077b555", padding: "6px 14px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "background 0.15s" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#0077b511")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
      >
        LinkedIn
      </button>
      <button
        onClick={() => copyLink(url, setCopied)}
        style={{ fontSize: 12, color: copied ? "#4a7c6f" : "#888", fontWeight: 500, background: "none", border: `1px solid ${copied ? "#4a7c6f55" : "#e0dbd3"}`, padding: "6px 14px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" }}
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
        boxShadow: hovered ? "0 12px 32px rgba(28,26,22,0.1)" : "none",
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
        <h4 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 14, color: "#1c1a16", lineHeight: 1.35, fontStyle: "italic" }}>
          {post.title}
        </h4>
        <div style={{ fontSize: 11, color: "#aaa", marginTop: 10 }}>
          {post.date} · {post.readTime} read
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
export function BlogPostPage({ slug, onNavigate, onBackToBlog }) {
  const scrollProgress = useScrollProgress();

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

  // Search both posts list and the featured article for the requested slug
  const allArticles = featured ? [featured, ...posts] : posts;
  const article = allArticles.find((p) => p.slug === slug);

  // Related: same category, excluding current
  const related = posts
    .filter((p) => p.slug !== slug && p.category === article?.category)
    .slice(0, 3);

  const relatedFinal = related.length > 0
    ? related
    : posts.filter((p) => p.slug !== slug).slice(0, 3);

  // Update URL bar
  useEffect(() => {
    if (article) {
      window.history.pushState({}, "", `/blog/${slug}`);
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

        .rh-btn { background: #2385cd; color: #fff; border: none; padding: 12px 28px; font-size: 13px; font-weight: 500; font-family: 'DM Sans', sans-serif; cursor: pointer; letter-spacing: 0.3px; transition: background 0.15s; }
        .rh-btn:hover { background: #1a6aaa; }
        .rh-btn-gold { background: #c8a96e; color: #1c1a16; border: none; padding: 12px 28px; font-size: 13px; font-weight: 500; font-family: 'DM Sans', sans-serif; cursor: pointer; letter-spacing: 0.3px; transition: background 0.15s; }
        .rh-btn-gold:hover { background: #b8924f; }

        .rh-post-grid    { display: grid; grid-template-columns: 1fr 300px; gap: 56px; align-items: start; }
        .rh-related-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: #ece8e0; }

        @media (max-width: 768px) {
          .rh-post-grid    { grid-template-columns: 1fr; gap: 32px; }
          .rh-hero-pad     { padding: 156px 18px 0 !important; }
          .rh-body-pad     { padding: 32px 18px !important; }
          .rh-hero-title   { font-size: 22px !important; }
          .rh-related-grid { grid-template-columns: 1fr; }
          .rh-sidebar-post { order: -1; }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .rh-post-grid    { grid-template-columns: 1fr; gap: 36px; }
          .rh-hero-pad     { padding: 148px 28px 0 !important; }
          .rh-body-pad     { padding: 36px 28px !important; }
          .rh-related-grid { grid-template-columns: repeat(2, 1fr); }
          .rh-sidebar-post { order: -1; }
        }
      `}</style>

      {/* ── SCROLL PROGRESS BAR ── */}
      <div style={{ position: "fixed", top: 0, left: 0, zIndex: 9999, height: 3, background: accent, width: `${scrollProgress}%`, transition: "width 0.1s linear", boxShadow: `0 0 8px ${accent}88` }} />

      {/* ── BACK NAV ── */}
      <div style={{
        background: "#1c1a16",
        borderBottom: "1px solid #2a2823",
        position: "sticky",
        top: 88,
        zIndex: 100,
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px", height: 48, display: "flex", alignItems: "center" }}>
          <button
            onClick={onBackToBlog}
            style={{ background: "none", border: "none", color: "#888", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 6, padding: 0, transition: "color 0.15s" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#faf9f6")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#888")}
          >
            ← Back to Insights
          </button>
          <span style={{ marginLeft: "auto", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#555" }}>
            Randle & Hopkick
          </span>
        </div>
      </div>

      {/* ── HERO ── */}
      <section style={{ background: "#1c1a16" }}>
        <motion.div
          className="rh-hero-pad"
          style={{ maxWidth: 1200, margin: "0 auto", padding: "136px 32px 0" }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <span style={{ fontSize: 10, letterSpacing: 2.5, textTransform: "uppercase", color: accent, fontWeight: 500 }}>{article.category}</span>
            <span style={{ fontSize: 10, color: "#444" }}>·</span>
            <span style={{ fontSize: 10, color: "#555", letterSpacing: 0.5 }}>{article.readTime} read</span>
          </div>

          <h1
            className="rh-hero-title"
            style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, color: "#faf9f6", lineHeight: 1.2, letterSpacing: "-0.5px", fontStyle: "italic", maxWidth: 760 }}
          >
            {article.title}
          </h1>

          <p style={{ fontSize: 15, color: "#888", lineHeight: 1.7, marginTop: 16, maxWidth: 640 }}>
            {article.excerpt}
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 24, paddingBottom: 28 }}>
            <InitialsAvatar name={article.author} accent={accent} size={38} />
            <div>
              <div style={{ fontSize: 13, color: "#ccc", fontWeight: 500 }}>{article.author}</div>
              <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>
                {article.date}{article.authorBio && <> · {article.authorBio}</>}
              </div>
            </div>
          </div>
        </motion.div>

        <div style={{ overflow: "hidden", maxHeight: 420 }}>
          <motion.img
            src={article.image} alt={article.title}
            style={{ width: "100%", height: 420, objectFit: "cover", display: "block" }}
            initial={{ scale: 1.06, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
        </div>
      </section>

      {/* ── BODY ── */}
      <main className="rh-body-pad" style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 32px" }}>
        <div className="rh-post-grid">

          {/* ── ARTICLE CONTENT ── */}
          <article>
            <div style={{ marginBottom: 36, paddingBottom: 24, borderBottom: "1px solid #ece8e0" }}>
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
                      style={{ fontSize: 16, color: "#3a3630", lineHeight: 1.85, marginBottom: 24 }}
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
                      style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: "#1c1a16", fontStyle: "italic", lineHeight: 1.3, marginTop: 40, marginBottom: 16, paddingLeft: 16, borderLeft: `3px solid ${accent}` }}
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
                      style={{ margin: "32px 0", padding: "24px 28px", background: "#f4f1ec", borderLeft: `4px solid ${accent}`, fontFamily: "'DM Serif Display', serif", fontSize: 19, color: "#2a2620", fontStyle: "italic", lineHeight: 1.55 }}
                    >
                      "{block.text}"
                    </motion.blockquote>
                  );
                }
                return null;
              })}
            </div>

            <div style={{ marginTop: 48, paddingTop: 28, borderTop: "1px solid #ece8e0" }}>
              <div style={{ fontSize: 14, color: "#888", marginBottom: 14 }}>Found this useful? Share it.</div>
              <ShareBar title={article.title} accent={accent} />
            </div>

            {/* CTA block */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              style={{ marginTop: 48, background: "linear-gradient(135deg, #0f2535 0%, #2385cd 100%)", padding: "32px 28px", position: "relative", overflow: "hidden" }}
            >
              <div style={{ position: "absolute", right: -40, top: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} />
              <div style={{ fontSize: 10, letterSpacing: 2.5, textTransform: "uppercase", color: "#c8a96e", marginBottom: 12 }}>Ready to hire?</div>
              <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: "#faf9f6", fontStyle: "italic", lineHeight: 1.3, maxWidth: 460, marginBottom: 20 }}>
                Trusted professionals for your home and business — placed within days.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button className="rh-btn-gold">Hire Staff Today</button>
                <button style={{ background: "transparent", color: "#faf9f6", border: "1px solid rgba(255,255,255,0.3)", padding: "12px 24px", fontSize: 13, fontFamily: "'DM Sans', sans-serif", cursor: "pointer" }}>
                  Browse Services
                </button>
              </div>
            </motion.div>
          </article>

          {/* ── SIDEBAR ── */}
          <aside className="rh-sidebar-post">
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

              <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} style={{ background: "#1c1a16", padding: 22 }}>
                <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#2385cd", fontWeight: 500, marginBottom: 10 }}>Who We Are</div>
                <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: 15, color: "#faf9f6", fontStyle: "italic", lineHeight: 1.4 }}>
                  Redefining service delivery and professionalism across Nigeria.
                </p>
                <p style={{ fontSize: 12, color: "#777", lineHeight: 1.7, marginTop: 10 }}>
                  Randle & Hopkick is a domestic outsourcing firm providing exceptional services across homes and corporate bodies.
                </p>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.07 }} style={{ border: "1px solid #ece8e0", padding: 22, background: "#fff" }}>
                <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#aaa", fontWeight: 500, marginBottom: 14 }}>Article Details</div>
                {[
                  { label: "Category",  value: article.category           },
                  { label: "Published", value: article.date               },
                  { label: "Read time", value: article.readTime + " read" },
                  { label: "Author",    value: article.author             },
                ].map((d) => (
                  <div key={d.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid #f5f2ee" }}>
                    <span style={{ fontSize: 11, color: "#bbb" }}>{d.label}</span>
                    <span style={{ fontSize: 11, color: "#555", fontWeight: 500, textAlign: "right" }}>{d.value}</span>
                  </div>
                ))}
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.14 }} style={{ background: "#f0f6fc", border: "1px solid #c8dff2", padding: 22 }}>
                <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#2385cd", fontWeight: 500, marginBottom: 12 }}>Our Services</div>
                {["Domestic Staffing", "Corporate Staffing", "Staff Training", "Artisan Outsourcing"].map((s) => (
                  <div key={s} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                    <span style={{ color: "#2385cd", fontSize: 11 }}>→</span>
                    <span style={{ fontSize: 12, color: "#1c1a16", fontWeight: 500 }}>{s}</span>
                  </div>
                ))}
                <button className="rh-btn" style={{ width: "100%", marginTop: 14 }}>Hire Staff Today</button>
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
            style={{ marginTop: 64 }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: "#1c1a16", fontStyle: "italic" }}>
                More from Our Insights
              </h2>
              <button
                onClick={onBackToBlog}
                style={{ background: "none", border: "1px solid #e0dbd3", color: "#888", fontSize: 12, padding: "6px 16px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#1c1a16"; e.currentTarget.style.color = "#1c1a16"; }}
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