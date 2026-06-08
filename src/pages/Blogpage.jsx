import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { loadBlogPosts, loadFeatured, refreshBlogCache } from "./data/blogPosts";
import HireStaffButton from "../components/buttons/HireStaffButton";
import {
  FileText, File, Flame, ArrowRight, AlertTriangle,
  ChevronUp, Search, WifiOff, Inbox, X, ExternalLink,
} from "lucide-react";

const categories = [
  "All", "Hiring Tips", "Workforce Insights",
  "Caregiver Spotlight", "Domestic Staffing", "Company News",
];

const services = [
  { label: "Domestic Staffing",   desc: "Nannies, cleaners, cooks & more."        },
  { label: "Corporate Staffing",  desc: "Skilled professionals for your business." },
  { label: "Staff Training",      desc: "We train staff to meet modern standards." },
  { label: "Artisan Outsourcing", desc: "Expert artisans for specialized roles."   },
];

const POSTS_PER_PAGE = 6;

function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let rafId;
    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const el = document.documentElement;
        const scrolled = el.scrollTop || document.body.scrollTop;
        const total = el.scrollHeight - el.clientHeight;
        setProgress(total > 0 ? Math.min(100, (scrolled / total) * 100) : 0);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(rafId); };
  }, []);
  return progress;
}

function shareWhatsApp(title, slug) {
  const url = slug ? `${window.location.origin}/blog/${slug}` : window.location.href;
  window.open(`https://wa.me/?text=${encodeURIComponent(title + "\n" + url)}`, "_blank");
}
function shareLinkedIn(slug) {
  const url = slug ? `${window.location.origin}/blog/${slug}` : window.location.href;
  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, "_blank");
}

function RobustImage({ src, alt, className, style, PlaceholderIcon = FileText }) {
  const [status, setStatus] = useState(src ? "loading" : "error");
  const prevSrc = useRef(src);
  useEffect(() => {
    if (src !== prevSrc.current) { prevSrc.current = src; setStatus(src ? "loading" : "error"); }
  }, [src]);
  if (!src || status === "error") {
    return (
      <div className={className} style={{ ...style, background: "linear-gradient(135deg, #eaf4fc 0%, #b8d9f0 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#2385cd" }}>
        <PlaceholderIcon size={28} strokeWidth={1.5} />
      </div>
    );
  }
  return (
    <img src={src} alt={alt} className={className}
      style={{ ...style, opacity: status === "loaded" ? 1 : 0, transition: "opacity 0.3s ease" }}
      onLoad={() => setStatus("loaded")} onError={() => setStatus("error")}
    />
  );
}

function InitialsAvatar({ name, accent }) {
  const initials = (name || "?").split(" ").slice(0, 2).map((n) => n[0] || "").join("").toUpperCase();
  return (
    <div style={{ width: 28, height: 28, borderRadius: "50%", background: (accent || "#2385cd") + "22", border: `1px solid ${(accent || "#2385cd")}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600, color: accent || "#2385cd", flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rh-card" style={{ pointerEvents: "none" }}>
      <div style={{ height: 160, background: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)", backgroundSize: "200% 100%", animation: "rh-shimmer 1.4s infinite" }} />
      <div style={{ padding: "16px 18px 18px" }}>
        {[["40%",10],["90%",14],["70%",14],["80%",10],["60%",10]].map(([w,h],i) => (
          <div key={i} style={{ height: h, width: w, background: "#f0f0f0", borderRadius: 4, marginBottom: i < 4 ? (i < 2 ? 10 : 14) : 0, animation: "rh-shimmer 1.4s infinite" }} />
        ))}
      </div>
    </div>
  );
}

function HeroSkeleton() {
  return (
    <section style={{ background: "#0d1b2e" }}>
      <div className="rh-hero-padding" style={{ maxWidth: 1200, margin: "0 auto", padding: "104px 32px 48px" }}>
        <div className="rh-hero-grid">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[["30%",10],["90%",22],["70%",22],["95%",12],["80%",12]].map(([w,h],i) => (
              <div key={i} style={{ height: h, width: w, background: "#162840", borderRadius: 4, animation: "rh-shimmer 1.4s infinite" }} />
            ))}
            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              <div style={{ height: 38, width: 140, background: "#162840", borderRadius: 4, animation: "rh-shimmer 1.4s infinite" }} />
              <div style={{ height: 38, width: 160, background: "#162840", borderRadius: 4, animation: "rh-shimmer 1.4s infinite" }} />
            </div>
          </div>
          <div style={{ height: 280, background: "#162840", borderRadius: 4, animation: "rh-shimmer 1.4s infinite" }} />
        </div>
      </div>
    </section>
  );
}

function FadeCard({ children, delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -60px 0px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 28 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay, ease: "easeOut" }} style={{ display: "contents" }}>
      {children}
    </motion.div>
  );
}

/* ── Inline CTA — Hire Staff uses HireStaffButton, Browse Services navigates to /services ── */
function InlineCTA({ user }) {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }} transition={{ duration: 0.45 }}
      style={{ gridColumn: "1 / -1", background: "linear-gradient(135deg, #0f2535 0%, #2385cd 100%)", padding: "28px 28px", display: "flex", flexDirection: "column", gap: 12, position: "relative", overflow: "hidden" }}
    >
      <div style={{ position: "absolute", right: -30, top: -30, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} />
      <div style={{ fontSize: 10, letterSpacing: 2.5, textTransform: "uppercase", color: "#c8a96e", fontWeight: 500 }}>Ready to hire?</div>
      <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: "#faf9f6", fontStyle: "italic", lineHeight: 1.3, maxWidth: 440 }}>
        Trusted professionals for your home and business — placed within days.
      </p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 4, alignItems: "center" }}>
        <HireStaffButton user={user} />
        <button
          onClick={() => navigate("/services")}
          className="rh-btn-outline"
        >
          Browse Services
        </button>
      </div>
    </motion.div>
  );
}

function ArticleCard({ post, index, isFeaturedCard, onNavigate }) {
  const [hovered, setHovered] = useState(false);
  if (!post || !post.slug) return null;
  const handleNavigate = useCallback(() => onNavigate(post.slug), [post.slug, onNavigate]);
  const accent = post.accent || "#2385cd";
  return (
    <FadeCard delay={Math.min(index * 0.07, 0.35)}>
      <div className={`rh-card ${isFeaturedCard ? "rh-card-featured" : ""}`} onClick={handleNavigate} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} role="article" aria-label={post.title}>
        <div style={{ position: "relative", overflow: "hidden", height: 160, background: "#f0f6fc" }}>
          <RobustImage src={post.image} alt={post.title || "Blog post"} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease", transform: hovered ? "scale(1.06)" : "scale(1)", display: "block" }} />
          {post.trending && (
            <div style={{ position: "absolute", top: 10, left: 10 }}>
              <span style={{ background: "#c8a96e", color: "#0d1b2e", fontSize: 9, fontWeight: 700, letterSpacing: 1, padding: "3px 8px", textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Flame size={10} strokeWidth={2} /> Trending
              </span>
            </div>
          )}
          <span style={{ position: "absolute", bottom: 10, right: 10, background: "rgba(13,27,46,0.75)", color: "#faf9f6", fontSize: 10, padding: "3px 9px", backdropFilter: "blur(4px)" }}>
            {post.readTime || "5 min"} read
          </span>
        </div>
        <div style={{ padding: "16px 18px 18px", flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: accent, fontWeight: 500, marginBottom: 8 }}>{post.category || "Article"}</div>
          <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 15, color: "#0d1b2e", lineHeight: 1.35, fontStyle: "italic", flex: 1 }}>{post.title || "Untitled"}</h3>
          {post.excerpt && (
            <p style={{ fontSize: 12, color: "#888", lineHeight: 1.6, marginTop: 8, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{post.excerpt}</p>
          )}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <InitialsAvatar name={post.author || "R&H"} accent={accent} />
              <span style={{ fontSize: 11, color: "#aaa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.author || "R&H Editorial"} · {post.date || ""}</span>
            </div>
            <span className="rh-read-btn" onClick={(e) => { e.stopPropagation(); handleNavigate(); }}>
              Read <ArrowRight size={12} strokeWidth={2} />
            </span>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12, paddingTop: 12, borderTop: "1px solid #f0ede8", opacity: hovered ? 1 : 0, transform: hovered ? "translateY(0)" : "translateY(4px)", transition: "opacity 0.2s, transform 0.2s", pointerEvents: hovered ? "auto" : "none" }}>
            <span style={{ fontSize: 11, color: "#bbb", marginRight: 4 }}>Share:</span>
            <button onClick={(e) => { e.stopPropagation(); shareWhatsApp(post.title, post.slug); }} style={{ fontSize: 11, color: "#25D366", fontWeight: 500, background: "none", border: "1px solid #25D36644", padding: "2px 8px", cursor: "pointer" }}>WhatsApp</button>
            <button onClick={(e) => { e.stopPropagation(); shareLinkedIn(post.slug); }} style={{ fontSize: 11, color: "#0077b5", fontWeight: 500, background: "none", border: "1px solid #0077b544", padding: "2px 8px", cursor: "pointer" }}>LinkedIn</button>
          </div>
        </div>
      </div>
    </FadeCard>
  );
}

function ErrorBanner({ message, onRetry }) {
  return (
    <div style={{ background: "#fff8f0", border: "1px solid #fed7aa", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#9a3412", marginBottom: 16 }}>
      <AlertTriangle size={18} style={{ flexShrink: 0, color: "#c2410c" }} />
      <span style={{ flex: 1 }}>{message}</span>
      {onRetry && (
        <button onClick={onRetry} style={{ fontSize: 12, fontWeight: 600, color: "#2385cd", background: "none", border: "1px solid #2385cd44", padding: "4px 12px", borderRadius: 6, cursor: "pointer" }}>Retry</button>
      )}
    </div>
  );
}

function BackToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (!visible) return null;
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      style={{ position: "fixed", bottom: 24, right: 24, zIndex: 200, width: 40, height: 40, borderRadius: "50%", background: "#2385cd", color: "#fff", border: "none", fontSize: 18, cursor: "pointer", boxShadow: "0 4px 16px rgba(35,133,205,0.4)", display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.15s, box-shadow 0.15s" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(35,133,205,0.5)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(35,133,205,0.4)"; }}
      title="Back to top" aria-label="Back to top"
    >
      <ChevronUp size={20} strokeWidth={2.5} />
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════════ */
export function BlogPage({ onNavigate, user }) {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery,    setSearchQuery]    = useState("");
  const [sortOrder,      setSortOrder]      = useState("newest");
  const [visibleCount,   setVisibleCount]   = useState(POSTS_PER_PAGE);
  const [posts,       setPosts]       = useState(() => loadBlogPosts());
  const [featured,    setFeatured]    = useState(() => loadFeatured());
  const [fetchState,  setFetchState]  = useState("idle");
  const [fetchError,  setFetchError]  = useState("");
  const scrollProgress = useScrollProgress();

  const fetchFresh = useCallback(async () => {
    setFetchState("loading"); setFetchError("");
    try {
      const { posts: freshPosts, featured: freshFeatured } = await refreshBlogCache();
      if (Array.isArray(freshPosts) && freshPosts.length > 0) setPosts(freshPosts);
      if (freshFeatured && freshFeatured.title) setFeatured(freshFeatured);
      setFetchState("success");
    } catch (err) {
      console.warn("[BlogPage] refreshBlogCache failed:", err?.message ?? err);
      setFetchState("error");
      setFetchError("Could not refresh articles. Showing cached content.");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setFetchState("loading"); setFetchError("");
      try {
        const { posts: freshPosts, featured: freshFeatured } = await refreshBlogCache();
        if (cancelled) return;
        if (Array.isArray(freshPosts) && freshPosts.length > 0) setPosts(freshPosts);
        if (freshFeatured && freshFeatured.title) setFeatured(freshFeatured);
        setFetchState("success");
      } catch (err) {
        if (cancelled) return;
        setFetchState("error");
        setFetchError("Could not load latest articles. Showing cached content.");
      }
    })();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setVisibleCount(POSTS_PER_PAGE); }, [activeCategory, searchQuery, sortOrder]);

  const safeSearch = searchQuery.trim().toLowerCase();
  const filtered = posts
    .filter((p) => p && p.title && p.slug)
    .filter((p) => activeCategory === "All" || p.category === activeCategory)
    .filter((p) => !safeSearch || p.title.toLowerCase().includes(safeSearch) || (p.excerpt || "").toLowerCase().includes(safeSearch) || (p.author || "").toLowerCase().includes(safeSearch) || (p.category || "").toLowerCase().includes(safeSearch))
    .sort((a, b) => {
      if (sortOrder === "popular") { const diff = (b.trending ? 1 : 0) - (a.trending ? 1 : 0); if (diff !== 0) return diff; }
      return String(b.id || "").localeCompare(String(a.id || ""));
    });

  const visiblePosts = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const cardElements = [];
  visiblePosts.forEach((post, i) => {
    cardElements.push(
      <ArticleCard key={post.id ?? post.slug ?? `post-${i}`} post={post} index={i} isFeaturedCard={i === 0 && activeCategory === "All" && !safeSearch} onNavigate={onNavigate} />
    );
    if ((i + 1) % 4 === 0 && i !== visiblePosts.length - 1) {
      cardElements.push(<InlineCTA key={`cta-${i}`} user={user} />);
    }
  });

  const isFirstLoad = fetchState === "loading" && posts.length === 0;
  const isFeaturedReady = featured && featured.title;

  return (
    <div style={{ minHeight: "100vh", background: "#faf9f6", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,400&family=DM+Serif+Display:ital@0;1&display=swap');

        @keyframes rh-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .rh-pill { padding: 6px 14px; border-radius: 20px; border: 1px solid #e0dbd3; background: #faf9f6; color: #888; font-size: 12px; cursor: pointer; transition: all 0.15s; font-family: 'DM Sans', sans-serif; white-space: nowrap; flex-shrink: 0; }
        .rh-pill:hover  { border-color: #2385cd; color: #2385cd; }
        .rh-pill.active { background: #2385cd; color: #fff; border-color: #2385cd; }

        .rh-card { background: #fff; border: 1px solid #ece8e0; display: flex; flex-direction: column; transition: transform 0.22s, box-shadow 0.22s; cursor: pointer; }
        .rh-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(13,27,46,0.1); }
        .rh-card-featured { border-left: 3px solid #2385cd; }

        .rh-btn { background: #2385cd; color: #fff; border: none; padding: 12px 28px; font-size: 13px; font-weight: 500; font-family: 'DM Sans', sans-serif; cursor: pointer; letter-spacing: 0.3px; transition: background 0.15s; }
        .rh-btn:hover { background: #1a6aaa; }

        .rh-btn-outline { background: transparent; color: #faf9f6; border: 1px solid rgba(255,255,255,0.35); padding: 10px 24px; font-size: 13px; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.15s; }
        .rh-btn-outline:hover { background: rgba(255,255,255,0.1); }

        .rh-read-btn { font-size: 12px; color: #2385cd; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: gap 0.15s; white-space: nowrap; background: none; border: none; }
        .rh-read-btn:hover { gap: 8px; }

        .rh-search { padding: 8px 14px; border: 1px solid #e0dbd3; background: #fff; font-size: 12px; font-family: 'DM Sans', sans-serif; color: #0d1b2e; outline: none; width: 200px; transition: border-color 0.15s; }
        .rh-search:focus { border-color: #2385cd; }
        .rh-search::placeholder { color: #bbb; }

        .rh-sort-btn { padding: 6px 14px; font-size: 11px; border: 1px solid #e0dbd3; background: #faf9f6; color: #888; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s; }
        .rh-sort-btn.active { background: #0d1b2e; color: #faf9f6; border-color: #0d1b2e; }

        .rh-filter-bar { scrollbar-width: none; }
        .rh-filter-bar::-webkit-scrollbar { display: none; }

        .rh-hero-grid  { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: stretch; }
        .rh-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: #162840; }
        .rh-main-grid  { display: grid; grid-template-columns: 1fr 300px; gap: 48px; align-items: start; }
        .rh-cards-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1px; background: #ece8e0; }

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
      <div style={{ position: "fixed", top: 0, left: 0, zIndex: 9999, height: 3, background: "#2385cd", width: `${scrollProgress}%`, transition: "width 0.08s linear", boxShadow: "0 0 8px rgba(35,133,205,0.5)" }} />

      {/* ── HERO BANNER ── */}
      <AnimatePresence mode="wait">
        {isFirstLoad && !isFeaturedReady ? (
          <HeroSkeleton key="hero-skeleton" />
        ) : isFeaturedReady ? (
          <motion.section key="hero-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} style={{ background: "#0d1b2e" }}>
            <div className="rh-hero-padding" style={{ maxWidth: 1200, margin: "0 auto", padding: "104px 32px 48px" }}>
              <motion.div className="rh-hero-grid" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: "easeOut" }}>
                {/* Left: text */}
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div style={{ fontSize: 10, letterSpacing: 2.5, textTransform: "uppercase", color: "#2385cd", fontWeight: 500, marginBottom: 14 }}>Featured Article</div>
                  <h1 className="rh-hero-title" style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: "#faf9f6", lineHeight: 1.25, letterSpacing: "-0.5px", fontStyle: "italic" }}>{featured.title}</h1>
                  <p style={{ fontSize: 13, color: "#888", lineHeight: 1.7, marginTop: 14 }}>{featured.excerpt}</p>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginTop: 18 }}>
                    <InitialsAvatar name={featured.author || "R&H"} accent="#2385cd" />
                    <div>
                      <div style={{ fontSize: 12, color: "#999", fontWeight: 500 }}>{featured.author} · {featured.date} · {featured.readTime} read</div>
                      {featured.authorBio && <div style={{ fontSize: 11, color: "#555", lineHeight: 1.5, marginTop: 3, maxWidth: 380 }}>{featured.authorBio}</div>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 12, marginTop: 22, flexWrap: "wrap" }}>
                    <button className="rh-btn" style={{ width: "auto", padding: "10px 28px", display: "inline-flex", alignItems: "center", gap: 6 }} onClick={() => onNavigate && onNavigate(featured.slug)}>
                      Read Article <ExternalLink size={13} strokeWidth={2} />
                    </button>
                    <button onClick={() => shareWhatsApp(featured.title, featured.slug)} style={{ background: "none", border: "1px solid #25D36644", color: "#25D366", fontSize: 12, padding: "10px 18px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                      Share on WhatsApp
                    </button>
                  </div>
                </div>
                {/* Right: image + stats */}
                <div style={{ display: "flex", flexDirection: "column", gap: 1, cursor: "pointer" }} onClick={() => onNavigate && onNavigate(featured.slug)}>
                  <div style={{ overflow: "hidden", height: 200, background: "#162840" }}>
                    <RobustImage src={featured.image} alt="Featured article" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} PlaceholderIcon={FileText} />
                  </div>
                  <div className="rh-stats-grid">
                    {[{ num: "300+", label: "Staff Deployed" }, { num: "100%", label: "Client Satisfaction" }, { num: "15+", label: "Yrs Leadership Exp." }, { num: "3+", label: "Years of Excellence" }].map((s) => (
                      <div key={s.label} style={{ background: "#0d1b2e", padding: "18px 16px" }}>
                        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: "#2385cd" }}>{s.num}</div>
                        <div style={{ fontSize: 11, color: "#666", marginTop: 3 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>

      {/* ── FILTER BAR ── */}
      <div style={{ borderBottom: "1px solid #ece8e0", background: "#faf9f6", position: "sticky", top: 88, zIndex: 90 }}>
        <div className="rh-filter-bar" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px", height: 52, display: "flex", alignItems: "center", gap: 8, overflowX: "auto" }}>
          {categories.map((c) => (
            <button key={c} className={`rh-pill ${activeCategory === c ? "active" : ""}`} onClick={() => setActiveCategory(c)} aria-pressed={activeCategory === c}>{c}</button>
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
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: "#0d1b2e", fontStyle: "italic" }}>
                  {activeCategory === "All" ? "Latest Insights" : activeCategory}
                </h2>
                <span style={{ fontSize: 12, color: "#aaa" }}>
                  {filtered.length} article{filtered.length !== 1 ? "s" : ""}
                  {fetchState === "loading" && <span style={{ marginLeft: 8, color: "#2385cd", fontSize: 11 }}>⟳ Refreshing…</span>}
                </span>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ position: "relative" }}>
                  <Search size={13} strokeWidth={2} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#bbb", pointerEvents: "none" }} />
                  <input className="rh-search" style={{ paddingLeft: 30 }} placeholder="Search articles…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} aria-label="Search blog posts" />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#bbb", display: "flex", alignItems: "center", padding: 0 }} aria-label="Clear search">
                      <X size={14} strokeWidth={2} />
                    </button>
                  )}
                </div>
                <div style={{ display: "flex", gap: 0 }}>
                  <button className={`rh-sort-btn ${sortOrder === "newest" ? "active" : ""}`} style={{ borderRadius: "3px 0 0 3px" }} onClick={() => setSortOrder("newest")}>Newest</button>
                  <button className={`rh-sort-btn ${sortOrder === "popular" ? "active" : ""}`} style={{ borderRadius: "0 3px 3px 0", borderLeft: "none" }} onClick={() => setSortOrder("popular")}>Popular</button>
                </div>
              </div>
            </div>

            {fetchState === "error" && posts.length > 0 && <ErrorBanner message={fetchError} onRetry={fetchFresh} />}

            {fetchState === "error" && posts.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <WifiOff size={28} strokeWidth={1.5} style={{ color: "#d97706" }} />
                  </div>
                </div>
                <p style={{ color: "#888", fontSize: 14, marginBottom: 16 }}>Could not load articles. Please check your connection.</p>
                <button onClick={fetchFresh} style={{ background: "#2385cd", color: "#fff", border: "none", padding: "10px 24px", borderRadius: 6, fontSize: 13, fontFamily: "'DM Sans', sans-serif", cursor: "pointer" }}>Try again</button>
              </div>
            )}

            {isFirstLoad && (
              <div className="rh-cards-grid">
                {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={`skel-${i}`} />)}
              </div>
            )}

            {!isFirstLoad && filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#aaa", fontSize: 13 }}>
                {safeSearch ? (
                  <>
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
                      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#eaf4fc", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Search size={24} strokeWidth={1.5} style={{ color: "#2385cd" }} />
                      </div>
                    </div>
                    <p>No articles match "<strong style={{ color: "#555" }}>{searchQuery}</strong>".</p>
                    <button onClick={() => setSearchQuery("")} style={{ marginTop: 10, color: "#2385cd", background: "none", border: "none", cursor: "pointer", fontSize: 13, textDecoration: "underline" }}>Clear search</button>
                  </>
                ) : (
                  <>
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
                      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#eaf4fc", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Inbox size={24} strokeWidth={1.5} style={{ color: "#2385cd" }} />
                      </div>
                    </div>
                    <p>No articles in <strong style={{ color: "#555" }}>{activeCategory}</strong> yet.</p>
                  </>
                )}
              </div>
            )}

            {!isFirstLoad && filtered.length > 0 && (
              <>
                <div className="rh-cards-grid">{cardElements}</div>
                <div style={{ textAlign: "center", marginTop: 40 }}>
                  {hasMore ? (
                    <button
                      onClick={() => setVisibleCount((c) => c + POSTS_PER_PAGE)}
                      style={{ padding: "12px 40px", border: "1px solid #0d1b2e", background: "transparent", color: "#0d1b2e", fontSize: 13, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", letterSpacing: 0.5, transition: "all 0.15s" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "#0d1b2e"; e.currentTarget.style.color = "#faf9f6"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#0d1b2e"; }}
                    >
                      Load more articles ({filtered.length - visibleCount} remaining)
                    </button>
                  ) : filtered.length > POSTS_PER_PAGE ? (
                    <p style={{ color: "#ccc", fontSize: 12 }}>You've reached the end · {filtered.length} articles</p>
                  ) : null}
                </div>
              </>
            )}
          </div>

          {/* ── SIDEBAR ── */}
          <aside className="rh-sidebar">
            <div className="rh-sidebar-inner" style={{ display: "flex", flexDirection: "column", gap: 24 }}>

              <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} style={{ background: "#0d1b2e", padding: 22 }}>
                <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#2385cd", fontWeight: 500, marginBottom: 10 }}>Who We Are</div>
                <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: 15, color: "#faf9f6", fontStyle: "italic", lineHeight: 1.4 }}>Redefining service delivery and professionalism across Nigeria.</p>
                <p style={{ fontSize: 12, color: "#777", lineHeight: 1.7, marginTop: 10 }}>Randle &amp; Hopkick is a domestic outsourcing firm providing exceptional services across homes and corporate bodies. Trust, competence, integrity, dedication and professionalism define everything we do.</p>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.08 }} style={{ border: "1px solid #ece8e0", padding: 22, background: "#fff" }}>
                <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#aaa", fontWeight: 500, marginBottom: 14 }}>Our Core Values</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[{ label: "Integrity", color: "#2385cd" }, { label: "Dedication", color: "#c8a96e" }, { label: "Competence", color: "#4a7c6f" }, { label: "Professionalism", color: "#0d1b2e" }].map((v) => (
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
                    <button key={c} className={`rh-pill ${activeCategory === c ? "active" : ""}`} onClick={() => { setActiveCategory(c); window.scrollTo({ top: 0, behavior: "smooth" }); }} style={{ fontSize: 11 }}>{c}</button>
                  ))}
                </div>
              </motion.div>

              {/* Services CTA — Hire Staff uses HireStaffButton, Browse Services navigates to /services */}
              <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.18 }} style={{ background: "#f0f6fc", border: "1px solid #c8dff2", padding: 22, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: -20, right: -20, width: 90, height: 90, borderRadius: "50%", background: "#2385cd10", border: "1px solid #2385cd22" }} />
                <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#2385cd", fontWeight: 500, marginBottom: 12 }}>Our Services</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                  {services.map((s) => (
                    <div key={s.label} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <ArrowRight size={12} strokeWidth={2} style={{ color: "#2385cd", marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 500, color: "#0d1b2e" }}>{s.label}</div>
                        <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>{s.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Hire Staff — auth-aware */}
                <HireStaffButton user={user} />
                {/* Browse Services — navigates to /services */}
                <button
                  onClick={() => navigate("/services")}
                  style={{ width: "100%", marginTop: 10, padding: "10px 0", background: "transparent", border: "1px solid #2385cd55", color: "#2385cd", fontSize: 12, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", transition: "all 0.15s", borderRadius: 2 }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#2385cd11"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                >
                  Browse Services
                </button>
              </motion.div>

              {posts.length > 0 && (
                <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.22 }} style={{ border: "1px solid #ece8e0", padding: 22, background: "#fff" }}>
                  <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#aaa", fontWeight: 500, marginBottom: 14 }}>Recent Posts</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {posts.filter((p) => p && p.slug && p.title).slice(0, 4).map((p) => (
                      <div key={p.slug} onClick={() => onNavigate && onNavigate(p.slug)} style={{ display: "flex", gap: 10, cursor: "pointer", alignItems: "flex-start" }}>
                        <div style={{ width: 48, height: 36, flexShrink: 0, borderRadius: 4, overflow: "hidden", background: "#eaf4fc" }}>
                          <RobustImage src={p.image} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} PlaceholderIcon={File} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 12, fontWeight: 500, color: "#0d1b2e", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.title}</p>
                          <p style={{ fontSize: 10, color: "#bbb", marginTop: 2 }}>{p.date || ""}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

            </div>
          </aside>
        </div>
      </main>

      <BackToTop />
    </div>
  );
}

export default BlogPage;