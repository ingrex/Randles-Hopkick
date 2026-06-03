import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { loadBlogPosts, loadFeatured, refreshBlogCache } from "./data/blogPosts";

/* ─── categories ─── */
const categories = [
  "All",
  "Hiring Tips",
  "Workforce Insights",
  "Caregiver Spotlight",
  "Domestic Staffing",
  "Company News",
];

const services = [
  { label: "Domestic Staffing",   desc: "Nannies, cleaners, cooks & more."         },
  { label: "Corporate Staffing",  desc: "Skilled professionals for your business." },
  { label: "Staff Training",      desc: "We train staff to meet modern standards."  },
  { label: "Artisan Outsourcing", desc: "Expert artisans for specialized roles."    },
];

/* ─── scroll progress hook ─── */
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

/* ─── share helpers ─── */
function shareWhatsApp(title, slug) {
  const url = slug
    ? `${window.location.origin}/blog/${slug}`
    : window.location.href;
  window.open(
    `https://wa.me/?text=${encodeURIComponent(title + "\n" + url)}`,
    "_blank"
  );
}
function shareLinkedIn(slug) {
  const url = slug
    ? `${window.location.origin}/blog/${slug}`
    : window.location.href;
  window.open(
    `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    "_blank"
  );
}

/* ─── avatar ─── */
function InitialsAvatar({ name, accent }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  return (
    <div
      style={{
        width: 28, height: 28, borderRadius: "50%",
        background: accent + "22", border: `1px solid ${accent}44`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 10, fontWeight: 600, color: accent, flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

/* ─── animated card wrapper ─── */
function FadeCard({ children, delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -60px 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      style={{ display: "contents" }}
    >
      {children}
    </motion.div>
  );
}

/* ─── inline hire CTA ─── */
function InlineCTA() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45 }}
      style={{
        gridColumn: "1 / -1",
        background: "linear-gradient(135deg, #0f2535 0%, #2385cd 100%)",
        padding: "28px 28px",
        display: "flex", flexDirection: "column", gap: 12,
        position: "relative", overflow: "hidden",
      }}
    >
      <div style={{
        position: "absolute", right: -30, top: -30,
        width: 140, height: 140, borderRadius: "50%",
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
      }} />
      <div style={{ fontSize: 10, letterSpacing: 2.5, textTransform: "uppercase", color: "#c8a96e", fontWeight: 500 }}>
        Ready to hire?
      </div>
      <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: "#faf9f6", fontStyle: "italic", lineHeight: 1.3, maxWidth: 440 }}>
        Trusted professionals for your home and business — placed within days.
      </p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 4 }}>
        <button className="rh-btn" style={{ width: "auto", padding: "10px 24px", background: "#c8a96e", color: "#1c1a16" }}>
          Hire Staff Today
        </button>
        <button className="rh-btn-outline">Browse Services</button>
      </div>
    </motion.div>
  );
}

/* ─── article card ─── */
function ArticleCard({ post, index, isFeaturedCard, onNavigate }) {
  const [hovered, setHovered] = useState(false);
  const handleNavigate = () => onNavigate(post.slug);

  return (
    <FadeCard delay={index * 0.07}>
      <div
        className={`rh-card ${isFeaturedCard ? "rh-card-featured" : ""}`}
        onClick={handleNavigate}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div style={{ position: "relative", overflow: "hidden", height: 160 }}>
          <img
            src={post.image}
            alt={post.title}
            style={{
              width: "100%", height: "100%", objectFit: "cover",
              transition: "transform 0.5s ease",
              transform: hovered ? "scale(1.06)" : "scale(1)",
              display: "block",
            }}
          />
          <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 6 }}>
            {post.trending && (
              <span style={{
                background: "#c8a96e", color: "#1c1a16",
                fontSize: 9, fontWeight: 700, letterSpacing: 1,
                padding: "3px 8px", textTransform: "uppercase",
              }}>🔥 Trending</span>
            )}
          </div>
          <span style={{
            position: "absolute", bottom: 10, right: 10,
            background: "rgba(28,26,22,0.75)", color: "#faf9f6",
            fontSize: 10, padding: "3px 9px", backdropFilter: "blur(4px)",
          }}>
            {post.readTime} read
          </span>
        </div>

        <div style={{ padding: "16px 18px 18px", flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: post.accent, fontWeight: 500, marginBottom: 8 }}>
            {post.category}
          </div>
          <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 15, color: "#1c1a16", lineHeight: 1.35, fontStyle: "italic", flex: 1 }}>
            {post.title}
          </h3>
          <p style={{ fontSize: 12, color: "#888", lineHeight: 1.6, marginTop: 8 }}>
            {post.excerpt}
          </p>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <InitialsAvatar name={post.author} accent={post.accent} />
              <span style={{ fontSize: 11, color: "#aaa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {post.author} · {post.date}
              </span>
            </div>
            <span
              className="rh-read-btn"
              onClick={(e) => { e.stopPropagation(); handleNavigate(); }}
            >
              Read →
            </span>
          </div>

          <div
            style={{
              display: "flex", gap: 8, marginTop: 12, paddingTop: 12,
              borderTop: "1px solid #f0ede8",
              opacity: hovered ? 1 : 0,
              transform: hovered ? "translateY(0)" : "translateY(4px)",
              transition: "opacity 0.2s, transform 0.2s",
            }}
          >
            <span style={{ fontSize: 11, color: "#bbb", marginRight: 4 }}>Share:</span>
            <button
              onClick={(e) => { e.stopPropagation(); shareWhatsApp(post.title, post.slug); }}
              style={{ fontSize: 11, color: "#25D366", fontWeight: 500, background: "none", border: "1px solid #25D36644", padding: "2px 8px", cursor: "pointer" }}
            >
              WhatsApp
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); shareLinkedIn(post.slug); }}
              style={{ fontSize: 11, color: "#0077b5", fontWeight: 500, background: "none", border: "1px solid #0077b544", padding: "2px 8px", cursor: "pointer" }}
            >
              LinkedIn
            </button>
          </div>
        </div>
      </div>
    </FadeCard>
  );
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
export function BlogPage({ onNavigate }) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery,    setSearchQuery]    = useState("");
  const [sortOrder,      setSortOrder]      = useState("newest");

  // ── Live data from backend (with static fallback) ─────────────────────────
  const [posts,    setPosts]    = useState(() => loadBlogPosts());
  const [featured, setFeatured] = useState(() => loadFeatured());

  const scrollProgress = useScrollProgress();

  useEffect(() => {
    let cancelled = false;
    refreshBlogCache()
      .then(({ posts: freshPosts, featured: freshFeatured }) => {
        if (cancelled) return;
        if (freshPosts?.length)  setPosts(freshPosts);
        if (freshFeatured)       setFeatured(freshFeatured);
      })
      .catch(() => {/* keep static fallback — already in state */});
    return () => { cancelled = true; };
  }, []);

  /* filter + search + sort */
  const filtered = posts
    .filter((p) => activeCategory === "All" || p.category === activeCategory)
    .filter((p) =>
      searchQuery.trim() === "" ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOrder === "popular") return (b.trending ? 1 : 0) - (a.trending ? 1 : 0);
      return (Number(b.id) || 0) - (Number(a.id) || 0);
    });

  /* inject inline CTA after every 4 cards */
  const cardElements = [];
  filtered.forEach((post, i) => {
    cardElements.push(
      <ArticleCard
        key={post.id}
        post={post}
        index={i}
        isFeaturedCard={i === 0 && activeCategory === "All"}
        onNavigate={onNavigate}
      />
    );
    if ((i + 1) % 4 === 0 && i !== filtered.length - 1) {
      cardElements.push(<InlineCTA key={`cta-${i}`} />);
    }
  });

  return (
    <div style={{ minHeight: "100vh", background: "#faf9f6", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,400&family=DM+Serif+Display:ital@0;1&display=swap');

        .rh-pill { padding: 6px 14px; border-radius: 20px; border: 1px solid #e0dbd3; background: #faf9f6; color: #888; font-size: 12px; cursor: pointer; transition: all 0.15s; font-family: 'DM Sans', sans-serif; white-space: nowrap; flex-shrink: 0; }
        .rh-pill:hover { border-color: #2385cd; color: #2385cd; }
        .rh-pill.active { background: #2385cd; color: #fff; border-color: #2385cd; }

        .rh-card { background: #fff; border: 1px solid #ece8e0; display: flex; flex-direction: column; transition: transform 0.22s, box-shadow 0.22s; cursor: pointer; }
        .rh-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(28,26,22,0.1); }
        .rh-card-featured { border-left: 3px solid #2385cd; }

        .rh-btn { background: #2385cd; color: #fff; border: none; padding: 12px 28px; font-size: 13px; font-weight: 500; font-family: 'DM Sans', sans-serif; cursor: pointer; letter-spacing: 0.3px; transition: background 0.15s; }
        .rh-btn:hover { background: #1a6aaa; }
        .rh-btn-outline { background: transparent; color: #faf9f6; border: 1px solid rgba(255,255,255,0.35); padding: 10px 24px; font-size: 13px; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.15s; }
        .rh-btn-outline:hover { background: rgba(255,255,255,0.1); }

        .rh-read-btn { font-size: 12px; color: #2385cd; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: gap 0.15s; white-space: nowrap; background: none; border: none; }
        .rh-read-btn:hover { gap: 8px; }

        .rh-search { padding: 8px 14px; border: 1px solid #e0dbd3; background: #fff; font-size: 12px; font-family: 'DM Sans', sans-serif; color: #1c1a16; outline: none; width: 200px; transition: border-color 0.15s; }
        .rh-search:focus { border-color: #2385cd; }
        .rh-search::placeholder { color: #bbb; }

        .rh-sort-btn { padding: 6px 14px; font-size: 11px; border: 1px solid #e0dbd3; background: #faf9f6; color: #888; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s; }
        .rh-sort-btn.active { background: #1c1a16; color: #faf9f6; border-color: #1c1a16; }

        .rh-filter-bar { scrollbar-width: none; }
        .rh-filter-bar::-webkit-scrollbar { display: none; }

        .rh-hero-grid    { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: stretch; }
        .rh-stats-grid   { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: #2e2b24; }
        .rh-main-grid    { display: grid; grid-template-columns: 1fr 300px; gap: 48px; align-items: start; }
        .rh-cards-grid   { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1px; background: #ece8e0; }

        @media (max-width: 768px) {
          .rh-hero-grid    { grid-template-columns: 1fr; gap: 24px; }
          .rh-main-grid    { grid-template-columns: 1fr; gap: 32px; }
          .rh-cards-grid   { grid-template-columns: 1fr; }
          .rh-hero-padding { padding: 104px 18px 28px !important; }
          .rh-main-padding { padding: 28px 16px !important; }
          .rh-hero-title   { font-size: 21px !important; }
          .rh-sidebar      { order: -1; }
          .rh-search       { width: 100% !important; }
          .rh-toolbar      { flex-wrap: wrap; gap: 10px !important; }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .rh-hero-grid    { grid-template-columns: 1fr; gap: 28px; }
          .rh-main-grid    { grid-template-columns: 1fr; gap: 36px; }
          .rh-hero-padding { padding: 104px 28px 36px !important; }
          .rh-main-padding { padding: 36px 28px !important; }
          .rh-sidebar      { order: -1; }
          .rh-sidebar-inner{ display: grid !important; grid-template-columns: 1fr 1fr; gap: 20px; }
        }
      `}</style>

      {/* ── SCROLL PROGRESS BAR ── */}
      <div style={{
        position: "fixed", top: 0, left: 0, zIndex: 9999,
        height: 3, background: "#2385cd",
        width: `${scrollProgress}%`,
        transition: "width 0.1s linear",
        boxShadow: "0 0 8px rgba(35,133,205,0.5)",
      }} />

      {/* ── HERO BANNER ── */}
      {featured && (
        <section style={{ background: "#1c1a16" }}>
          <div
            className="rh-hero-padding"
            style={{ maxWidth: 1200, margin: "0 auto", padding: "104px 32px 48px" }}
          >
            <motion.div
              className="rh-hero-grid"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: "easeOut" }}
            >
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ fontSize: 10, letterSpacing: 2.5, textTransform: "uppercase", color: "#2385cd", fontWeight: 500, marginBottom: 14 }}>
                  Featured Article
                </div>
                <h1
                  className="rh-hero-title"
                  style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: "#faf9f6", lineHeight: 1.25, letterSpacing: "-0.5px", fontStyle: "italic" }}
                >
                  {featured.title}
                </h1>
                <p style={{ fontSize: 13, color: "#888", lineHeight: 1.7, marginTop: 14 }}>
                  {featured.excerpt}
                </p>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginTop: 18 }}>
                  <InitialsAvatar name={featured.author} accent="#2385cd" />
                  <div>
                    <div style={{ fontSize: 12, color: "#999", fontWeight: 500 }}>
                      {featured.author} · {featured.date} · {featured.readTime} read
                    </div>
                    <div style={{ fontSize: 11, color: "#555", lineHeight: 1.5, marginTop: 3, maxWidth: 380 }}>
                      {featured.authorBio}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 22, flexWrap: "wrap" }}>
                  <button
                    className="rh-btn"
                    style={{ width: "auto", padding: "10px 28px" }}
                    onClick={() => onNavigate(featured.slug)}
                  >
                    Read Article →
                  </button>
                  <button
                    onClick={() => shareWhatsApp(featured.title, featured.slug)}
                    style={{
                      background: "none", border: "1px solid #25D36644",
                      color: "#25D366", fontSize: 12, padding: "10px 18px",
                      cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    Share on WhatsApp
                  </button>
                </div>
              </div>

              <div
                style={{ display: "flex", flexDirection: "column", gap: 1, cursor: "pointer" }}
                onClick={() => onNavigate(featured.slug)}
              >
                <div style={{ overflow: "hidden", height: 200 }}>
                  <img
                    src={featured.image}
                    alt="Featured article"
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                </div>
                <div className="rh-stats-grid">
                  {[
                    { num: "300+", label: "Staff Deployed"      },
                    { num: "100%", label: "Client Satisfaction" },
                    { num: "15+",  label: "Yrs Leadership Exp." },
                    { num: "3+",   label: "Years of Excellence" },
                  ].map((s) => (
                    <div key={s.label} style={{ background: "#1c1a16", padding: "18px 16px" }}>
                      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: "#2385cd" }}>{s.num}</div>
                      <div style={{ fontSize: 11, color: "#666", marginTop: 3 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ── FILTER BAR ── */}
      <div style={{
        borderBottom: "1px solid #ece8e0",
        background: "#faf9f6",
        position: "sticky",
        top: 88,
        zIndex: 90,
      }}>
        <div
          className="rh-filter-bar"
          style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px", height: 52, display: "flex", alignItems: "center", gap: 8, overflowX: "auto" }}
        >
          {categories.map((c) => (
            <button key={c} className={`rh-pill ${activeCategory === c ? "active" : ""}`} onClick={() => setActiveCategory(c)}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* ── MAIN ── */}
      <main className="rh-main-padding" style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 32px" }}>
        <div className="rh-main-grid">

          {/* ── ARTICLES COLUMN ── */}
          <div>
            <div className="rh-toolbar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22, gap: 16, flexWrap: "wrap" }}>
              <div>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: "#1c1a16", fontStyle: "italic" }}>
                  {activeCategory === "All" ? "Latest Insights" : activeCategory}
                </h2>
                <span style={{ fontSize: 12, color: "#aaa" }}>{filtered.length} article{filtered.length !== 1 ? "s" : ""}</span>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#bbb" }}>🔍</span>
                  <input
                    className="rh-search"
                    style={{ paddingLeft: 30 }}
                    placeholder="Search articles…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div style={{ display: "flex", gap: 0 }}>
                  <button className={`rh-sort-btn ${sortOrder === "newest" ? "active" : ""}`} style={{ borderRadius: "3px 0 0 3px" }} onClick={() => setSortOrder("newest")}>Newest</button>
                  <button className={`rh-sort-btn ${sortOrder === "popular" ? "active" : ""}`} style={{ borderRadius: "0 3px 3px 0", borderLeft: "none" }} onClick={() => setSortOrder("popular")}>Popular</button>
                </div>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#aaa", fontSize: 13 }}>
                No articles match your search.
              </div>
            ) : (
              <div className="rh-cards-grid">{cardElements}</div>
            )}

            {filtered.length > 0 && (
              <div style={{ textAlign: "center", marginTop: 40 }}>
                <button
                  style={{ padding: "12px 40px", border: "1px solid #1c1a16", background: "transparent", color: "#1c1a16", fontSize: 13, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", letterSpacing: 0.5, transition: "all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#1c1a16"; e.currentTarget.style.color = "#faf9f6"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#1c1a16"; }}
                >
                  Load more articles
                </button>
              </div>
            )}
          </div>

          {/* ── SIDEBAR ── */}
          <aside className="rh-sidebar">
            <div className="rh-sidebar-inner" style={{ display: "flex", flexDirection: "column", gap: 24 }}>

              <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} style={{ background: "#1c1a16", padding: 22 }}>
                <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#2385cd", fontWeight: 500, marginBottom: 10 }}>Who We Are</div>
                <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: 15, color: "#faf9f6", fontStyle: "italic", lineHeight: 1.4 }}>
                  Redefining service delivery and professionalism across Nigeria.
                </p>
                <p style={{ fontSize: 12, color: "#777", lineHeight: 1.7, marginTop: 10 }}>
                  Randle & Hopkick is a domestic outsourcing firm providing exceptional services across homes and corporate bodies. Trust, competence, integrity, dedication and professionalism define everything we do.
                </p>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.08 }} style={{ border: "1px solid #ece8e0", padding: 22, background: "#fff" }}>
                <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#aaa", fontWeight: 500, marginBottom: 14 }}>Our Core Values</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { label: "Integrity",       color: "#2385cd" },
                    { label: "Dedication",      color: "#c8a96e" },
                    { label: "Competence",      color: "#4a7c6f" },
                    { label: "Professionalism", color: "#1c1a16" },
                  ].map((v) => (
                    <div key={v.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: v.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: "#555", fontWeight: 500 }}>{v.label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.13 }} style={{ border: "1px solid #ece8e0", padding: 22, background: "#fff" }}>
                <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#aaa", fontWeight: 500, marginBottom: 14 }}>Browse by topic</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {categories.slice(1).map((c) => (
                    <button key={c} className={`rh-pill ${activeCategory === c ? "active" : ""}`} onClick={() => setActiveCategory(c)} style={{ fontSize: 11 }}>{c}</button>
                  ))}
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.18 }} style={{ background: "#f0f6fc", border: "1px solid #c8dff2", padding: 22, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: -20, right: -20, width: 90, height: 90, borderRadius: "50%", background: "#2385cd10", border: "1px solid #2385cd22" }} />
                <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#2385cd", fontWeight: 500, marginBottom: 12 }}>Our Services</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                  {services.map((s) => (
                    <div key={s.label} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <span style={{ color: "#2385cd", fontSize: 12, marginTop: 1 }}>→</span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 500, color: "#1c1a16" }}>{s.label}</div>
                        <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>{s.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="rh-btn" style={{ width: "100%" }}>Hire Staff Today</button>
              </motion.div>

            </div>
          </aside>

        </div>
      </main>
    </div>
  );
}

export default BlogPage;