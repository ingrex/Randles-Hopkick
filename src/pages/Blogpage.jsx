import { useState } from "react";

// ─────────────────────────────────────────────
//  BRAND CONFIG
// ─────────────────────────────────────────────
const BRAND = "#2385cd";
const BRAND_DARK = "#1a6aa8";
const BRAND_LIGHT = "#e8f4fd";

// ─────────────────────────────────────────────
//  SAMPLE DATA  (swap with API / admin feed)
// ─────────────────────────────────────────────
export const BLOG_POSTS = [
  {
    id: "1",
    slug: "future-of-ai-2025",
    title: "The Future of AI in 2025 and Beyond",
    excerpt:
      "Artificial intelligence is reshaping every industry. We explore the trends, breakthroughs, and what they mean for your business.",
    category: "Technology",
    author: "Sarah Mensah",
    authorAvatar: "SM",
    date: "May 20, 2026",
    readTime: "6 min read",
    image: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=80",
    featured: true,
    tags: ["AI", "Technology", "Future"],
  },
  {
    id: "2",
    slug: "sustainable-business-growth",
    title: "Sustainable Business Growth in Emerging Markets",
    excerpt:
      "How leading companies are balancing profit with purpose in Africa's fast-growing economies.",
    category: "Business",
    author: "Emeka Okafor",
    authorAvatar: "EO",
    date: "May 15, 2026",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=800&q=80",
    featured: false,
    tags: ["Business", "Africa", "Growth"],
  },
  {
    id: "3",
    slug: "design-systems-that-scale",
    title: "Design Systems That Actually Scale",
    excerpt:
      "A practical guide to building component libraries your whole team will love to use.",
    category: "Design",
    author: "Amara Diallo",
    authorAvatar: "AD",
    date: "May 10, 2026",
    readTime: "8 min read",
    image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80",
    featured: false,
    tags: ["Design", "Systems", "UX"],
  },
  {
    id: "4",
    slug: "cloud-infrastructure-guide",
    title: "The Complete Cloud Infrastructure Guide",
    excerpt:
      "Everything you need to know to architect resilient, cost-efficient cloud solutions.",
    category: "Engineering",
    author: "Kwame Asante",
    authorAvatar: "KA",
    date: "May 5, 2026",
    readTime: "10 min read",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80",
    featured: false,
    tags: ["Cloud", "DevOps", "Infrastructure"],
  },
  {
    id: "5",
    slug: "product-led-growth",
    title: "Product-Led Growth: Lessons from Top SaaS Companies",
    excerpt:
      "Why the best products sell themselves — and how to build one that does.",
    category: "Product",
    author: "Fatima Abdullahi",
    authorAvatar: "FA",
    date: "April 28, 2026",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
    featured: false,
    tags: ["Product", "SaaS", "Growth"],
  },
  {
    id: "6",
    slug: "remote-team-culture",
    title: "Building a Remote Team Culture That Sticks",
    excerpt:
      "Practical frameworks for keeping distributed teams engaged, aligned, and high-performing.",
    category: "Leadership",
    author: "Chioma Eze",
    authorAvatar: "CE",
    date: "April 20, 2026",
    readTime: "7 min read",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80",
    featured: false,
    tags: ["Leadership", "Remote", "Culture"],
  },
];

// ─────────────────────────────────────────────
//  SHARE UTILITIES  (social + copy link)
// ─────────────────────────────────────────────
const BASE_URL = "https://yourwebsite.com/blog"; // ← update to your domain

function getShareLinks(post) {
  const url = encodeURIComponent(`${BASE_URL}/${post.slug}`);
  const title = encodeURIComponent(post.title);
  return {
    twitter: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    whatsapp: `https://wa.me/?text=${title}%20${url}`,
    direct: `${BASE_URL}/${post.slug}`,
  };
}

// ─────────────────────────────────────────────
//  SHARE BUTTON COMPONENT
// ─────────────────────────────────────────────
function ShareMenu({ post }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const links = getShareLinks(post);

  function copyLink() {
    navigator.clipboard.writeText(links.direct).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: "none",
          border: `1.5px solid ${BRAND}`,
          color: BRAND,
          borderRadius: 6,
          padding: "5px 12px",
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: 5,
          transition: "all .2s",
        }}
        onMouseOver={e => { e.currentTarget.style.background = BRAND; e.currentTarget.style.color = "#fff"; }}
        onMouseOut={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = BRAND; }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
        Share
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "110%", right: 0, background: "#fff",
          border: "1px solid #e8edf2", borderRadius: 10, boxShadow: "0 8px 32px rgba(35,133,205,.13)",
          padding: "10px 0", zIndex: 100, minWidth: 180,
        }}>
          {[
            { label: "Twitter / X", href: links.twitter, color: "#000" },
            { label: "Facebook", href: links.facebook, color: "#1877f2" },
            { label: "LinkedIn", href: links.linkedin, color: "#0a66c2" },
            { label: "WhatsApp", href: links.whatsapp, color: "#25d366" },
          ].map(s => (
            <a key={s.label} href={s.href} target="_blank" rel="noreferrer"
              style={{ display: "block", padding: "8px 18px", color: "#333", textDecoration: "none", fontSize: 13, fontWeight: 500 }}
              onMouseOver={e => e.currentTarget.style.background = BRAND_LIGHT}
              onMouseOut={e => e.currentTarget.style.background = "none"}
            >
              {s.label}
            </a>
          ))}
          <hr style={{ margin: "6px 0", border: "none", borderTop: "1px solid #eee" }} />
          <button onClick={copyLink}
            style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 18px", background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, color: copied ? "#2d9e4f" : "#333" }}
            onMouseOver={e => e.currentTarget.style.background = BRAND_LIGHT}
            onMouseOut={e => e.currentTarget.style.background = "none"}
          >
            {copied ? "✓ Link Copied!" : "Copy Link"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  CATEGORY BADGE
// ─────────────────────────────────────────────
const CATEGORY_COLORS = {
  Technology: BRAND,
  Business: "#e67e22",
  Design: "#9b59b6",
  Engineering: "#27ae60",
  Product: "#e74c3c",
  Leadership: "#16a085",
};

function CategoryBadge({ category, small }) {
  const bg = CATEGORY_COLORS[category] || BRAND;
  return (
    <span style={{
      background: bg + "18", color: bg, border: `1px solid ${bg}44`,
      borderRadius: 20, padding: small ? "2px 10px" : "4px 14px",
      fontSize: small ? 11 : 12, fontWeight: 700, letterSpacing: ".4px",
    }}>
      {category}
    </span>
  );
}

// ─────────────────────────────────────────────
//  AVATAR
// ─────────────────────────────────────────────
function Avatar({ initials, size = 32 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `linear-gradient(135deg, ${BRAND}, ${BRAND_DARK})`,
      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.34, fontWeight: 700, flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  LAYOUT A — MAGAZINE HERO  (Featured post top, grid below)
// ═══════════════════════════════════════════════════════
function LayoutMagazine({ posts, onNavigate }) {
  const [featured, ...rest] = posts;
  return (
    <div style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
      {/* Hero */}
      <div style={{
        position: "relative", borderRadius: 20, overflow: "hidden",
        marginBottom: 48, cursor: "pointer", minHeight: 420,
      }} onClick={() => onNavigate(featured)}>
        <img src={featured.image} alt={featured.title}
          style={{ width: "100%", height: 420, objectFit: "cover", display: "block" }} />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(0,0,0,.82) 0%, rgba(0,0,0,.1) 60%)",
        }} />
        <div style={{ position: "absolute", bottom: 36, left: 36, right: 36 }}>
          <CategoryBadge category={featured.category} />
          <h2 style={{
            color: "#fff", fontSize: "clamp(22px,3vw,36px)", fontWeight: 700,
            margin: "14px 0 10px", lineHeight: 1.25, maxWidth: 700,
          }}>
            {featured.title}
          </h2>
          <p style={{ color: "rgba(255,255,255,.8)", fontSize: 15, margin: "0 0 16px", maxWidth: 560 }}>
            {featured.excerpt}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Avatar initials={featured.authorAvatar} size={36} />
            <span style={{ color: "#fff", fontSize: 13 }}>{featured.author} · {featured.date} · {featured.readTime}</span>
            <div onClick={e => e.stopPropagation()}>
              <ShareMenu post={featured} />
            </div>
          </div>
        </div>
        <div style={{
          position: "absolute", top: 20, left: 20, background: BRAND,
          color: "#fff", fontSize: 11, fontWeight: 800, padding: "4px 12px",
          borderRadius: 4, letterSpacing: 1, textTransform: "uppercase",
        }}>Featured</div>
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 28 }}>
        {rest.map(post => (
          <div key={post.id} style={{
            borderRadius: 14, overflow: "hidden", border: "1px solid #e8edf2",
            background: "#fff", cursor: "pointer", transition: "box-shadow .2s,transform .2s",
            boxShadow: "0 2px 10px rgba(0,0,0,.04)",
          }}
            onMouseOver={e => { e.currentTarget.style.boxShadow = `0 12px 36px rgba(35,133,205,.15)`; e.currentTarget.style.transform = "translateY(-3px)"; }}
            onMouseOut={e => { e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,.04)"; e.currentTarget.style.transform = "none"; }}
            onClick={() => onNavigate(post)}
          >
            <img src={post.image} alt={post.title} style={{ width: "100%", height: 180, objectFit: "cover" }} />
            <div style={{ padding: "18px 20px 20px" }}>
              <CategoryBadge category={post.category} small />
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: "10px 0 8px", lineHeight: 1.35, color: "#111" }}>
                {post.title}
              </h3>
              <p style={{ color: "#666", fontSize: 13.5, lineHeight: 1.6, margin: "0 0 14px" }}>
                {post.excerpt}
              </p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Avatar initials={post.authorAvatar} size={28} />
                  <span style={{ fontSize: 12, color: "#888" }}>{post.author} · {post.readTime}</span>
                </div>
                <div onClick={e => e.stopPropagation()}>
                  <ShareMenu post={post} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  LAYOUT B — EDITORIAL LIST  (Large left-image list)
// ═══════════════════════════════════════════════════════
function LayoutEditorial({ posts, onNavigate }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {posts.map((post, i) => (
        <div key={post.id}>
          <div style={{
            display: "grid", gridTemplateColumns: "240px 1fr",
            gap: 28, padding: "28px 0", cursor: "pointer", alignItems: "center",
          }}
            onClick={() => onNavigate(post)}
            onMouseOver={e => e.currentTarget.style.opacity = ".85"}
            onMouseOut={e => e.currentTarget.style.opacity = "1"}
          >
            <div style={{ borderRadius: 12, overflow: "hidden", height: 160, flexShrink: 0 }}>
              <img src={post.image} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .3s" }}
                onMouseOver={e => e.currentTarget.style.transform = "scale(1.05)"}
                onMouseOut={e => e.currentTarget.style.transform = "none"}
              />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <CategoryBadge category={post.category} small />
                <span style={{ fontSize: 12, color: "#999" }}>{post.date}</span>
                <span style={{ fontSize: 12, color: "#bbb" }}>·</span>
                <span style={{ fontSize: 12, color: "#999" }}>{post.readTime}</span>
              </div>
              <h3 style={{
                fontSize: "clamp(17px,2vw,22px)", fontWeight: 700,
                color: "#0d1b2a", margin: "0 0 8px", lineHeight: 1.3,
                fontFamily: "'Georgia', serif",
              }}>
                {post.title}
              </h3>
              <p style={{ color: "#5a6a7a", fontSize: 14, lineHeight: 1.65, margin: "0 0 14px" }}>
                {post.excerpt}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar initials={post.authorAvatar} size={30} />
                <span style={{ fontSize: 13, color: "#444", fontWeight: 600 }}>{post.author}</span>
                <div onClick={e => e.stopPropagation()}>
                  <ShareMenu post={post} />
                </div>
              </div>
            </div>
          </div>
          {i < posts.length - 1 && <hr style={{ border: "none", borderTop: "1px solid #edf0f4", margin: 0 }} />}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  LAYOUT C — MASONRY CARDS  (Pinterest-style stagger)
// ═══════════════════════════════════════════════════════
function LayoutMasonry({ posts, onNavigate }) {
  const cols = [posts.filter((_, i) => i % 3 === 0), posts.filter((_, i) => i % 3 === 1), posts.filter((_, i) => i % 3 === 2)];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, alignItems: "start" }}>
      {cols.map((col, ci) => (
        <div key={ci} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {col.map((post, i) => {
            const tall = (ci + i) % 2 === 0;
            return (
              <div key={post.id} style={{
                borderRadius: 16, overflow: "hidden", background: "#fff",
                border: "1px solid #e8edf2", cursor: "pointer",
                boxShadow: "0 2px 12px rgba(0,0,0,.05)",
                transition: "box-shadow .25s,transform .25s",
              }}
                onMouseOver={e => { e.currentTarget.style.boxShadow = `0 16px 48px rgba(35,133,205,.18)`; e.currentTarget.style.transform = "translateY(-4px)"; }}
                onMouseOut={e => { e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,.05)"; e.currentTarget.style.transform = "none"; }}
                onClick={() => onNavigate(post)}
              >
                <img src={post.image} alt={post.title}
                  style={{ width: "100%", height: tall ? 220 : 150, objectFit: "cover" }} />
                <div style={{ padding: "16px 18px 18px" }}>
                  <CategoryBadge category={post.category} small />
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: "9px 0 7px", lineHeight: 1.35, color: "#111" }}>
                    {post.title}
                  </h3>
                  {tall && <p style={{ fontSize: 13, color: "#666", lineHeight: 1.6, margin: "0 0 12px" }}>{post.excerpt}</p>}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <Avatar initials={post.authorAvatar} size={26} />
                      <span style={{ fontSize: 11.5, color: "#888" }}>{post.readTime}</span>
                    </div>
                    <div onClick={e => e.stopPropagation()}>
                      <ShareMenu post={post} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  LAYOUT D — MINIMAL TABLE  (Clean text-forward list)
// ═══════════════════════════════════════════════════════
function LayoutMinimal({ posts, onNavigate }) {
  return (
    <div style={{ fontFamily: "'Georgia', serif" }}>
      {/* Header row */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 120px 140px 100px",
        padding: "0 0 12px", borderBottom: `2px solid ${BRAND}`,
        color: BRAND, fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase",
        fontFamily: "sans-serif",
      }}>
        <span>Article</span><span>Category</span><span>Author</span><span style={{ textAlign: "right" }}>Share</span>
      </div>
      {posts.map((post, i) => (
        <div key={post.id} style={{
          display: "grid", gridTemplateColumns: "1fr 120px 140px 100px",
          padding: "22px 0", alignItems: "center",
          borderBottom: "1px solid #edf0f4", cursor: "pointer",
          transition: "background .15s",
        }}
          onMouseOver={e => e.currentTarget.style.background = BRAND_LIGHT}
          onMouseOut={e => e.currentTarget.style.background = "none"}
          onClick={() => onNavigate(post)}
        >
          <div style={{ paddingRight: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0d1b2a", margin: "0 0 5px", lineHeight: 1.3 }}>
              {post.title}
            </h3>
            <span style={{ fontSize: 12, color: "#aaa", fontFamily: "sans-serif" }}>{post.date} · {post.readTime}</span>
          </div>
          <div><CategoryBadge category={post.category} small /></div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Avatar initials={post.authorAvatar} size={26} />
            <span style={{ fontSize: 13, color: "#555", fontFamily: "sans-serif" }}>{post.author}</span>
          </div>
          <div style={{ textAlign: "right" }} onClick={e => e.stopPropagation()}>
            <ShareMenu post={post} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
//  LAYOUT SWITCHER TABS
// ─────────────────────────────────────────────
const LAYOUTS = [
  { id: "magazine", label: "Magazine" },
  { id: "editorial", label: "Editorial List" },
  { id: "masonry", label: "Masonry Grid" },
  { id: "minimal", label: "Minimal Table" },
];

// ─────────────────────────────────────────────
//  BLOG PAGE  — main export
// ─────────────────────────────────────────────
/**
 * BlogPage component.
 *
 * Props:
 *  - posts: BlogPost[]        — pass your CMS/admin data here
 *  - defaultLayout: string    — 'magazine' | 'editorial' | 'masonry' | 'minimal'
 *  - onPostClick: (post) => void  — handle navigation (e.g. router.push)
 *  - showLayoutSwitcher: bool  — show/hide the layout tabs (hide in production)
 *
 * The component is also exported as default for page-level use,
 * and BLOG_POSTS is exported for import in other pages.
 */
export function BlogPage({
  posts = BLOG_POSTS,
  defaultLayout = "magazine",
  onPostClick,
  showLayoutSwitcher = true,
}) {
  const [layout, setLayout] = useState(defaultLayout);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = ["All", ...Array.from(new Set(posts.map(p => p.category)))];

  const filtered = posts.filter(p => {
    const matchCat = activeCategory === "All" || p.category === activeCategory;
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.excerpt.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  function handleNavigate(post) {
    if (onPostClick) return onPostClick(post);
    window.location.href = `${BASE_URL}/${post.slug}`;
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 80px", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* ── Page Header */}
      <div style={{ textAlign: "center", padding: "64px 0 48px" }}>
        <div style={{
          display: "inline-block", background: BRAND_LIGHT, color: BRAND,
          fontSize: 12, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase",
          padding: "6px 18px", borderRadius: 20, marginBottom: 18,
        }}>Our Blog</div>
        <h1 style={{
          fontSize: "clamp(30px,5vw,52px)", fontWeight: 800, color: "#0d1b2a",
          margin: "0 0 14px", lineHeight: 1.15, fontFamily: "'Georgia', serif",
        }}>
          Insights, Stories &amp; Ideas
        </h1>
        <p style={{ color: "#6b7a8d", fontSize: 17, maxWidth: 520, margin: "0 auto" }}>
          Expert perspectives on technology, business, design, and leadership — updated regularly.
        </p>
      </div>

      {/* ── Filters Row */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 14, marginBottom: 36,
        padding: "16px 20px", background: "#f7f9fc", borderRadius: 12,
        border: "1px solid #e8edf2",
      }}>
        {/* Categories */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} style={{
              padding: "6px 16px", borderRadius: 20, border: "1.5px solid",
              borderColor: activeCategory === cat ? BRAND : "#dce3eb",
              background: activeCategory === cat ? BRAND : "#fff",
              color: activeCategory === cat ? "#fff" : "#555",
              fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all .15s",
            }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search articles…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            border: "1.5px solid #dce3eb", borderRadius: 8, padding: "8px 14px",
            fontSize: 13, outline: "none", minWidth: 200, background: "#fff",
            color: "#333",
          }}
          onFocus={e => e.target.style.borderColor = BRAND}
          onBlur={e => e.target.style.borderColor = "#dce3eb"}
        />
      </div>

      {/* ── Layout Switcher */}
      {showLayoutSwitcher && (
        <div style={{ display: "flex", gap: 8, marginBottom: 32, justifyContent: "flex-end" }}>
          <span style={{ fontSize: 12, color: "#aaa", alignSelf: "center", marginRight: 4 }}>Layout:</span>
          {LAYOUTS.map(l => (
            <button key={l.id} onClick={() => setLayout(l.id)} style={{
              padding: "6px 14px", borderRadius: 8, border: "1.5px solid",
              borderColor: layout === l.id ? BRAND : "#dce3eb",
              background: layout === l.id ? BRAND : "#fff",
              color: layout === l.id ? "#fff" : "#666",
              fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all .15s",
            }}>
              {l.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Results Count */}
      <p style={{ fontSize: 13, color: "#aaa", marginBottom: 24 }}>
        Showing <strong style={{ color: "#444" }}>{filtered.length}</strong> article{filtered.length !== 1 ? "s" : ""}
        {activeCategory !== "All" && ` in ${activeCategory}`}
        {search && ` for "${search}"`}
      </p>

      {/* ── Layout Render */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: "#aaa" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
          <p style={{ fontSize: 18 }}>No articles found. Try a different search.</p>
        </div>
      ) : (
        <>
          {layout === "magazine" && <LayoutMagazine posts={filtered} onNavigate={handleNavigate} />}
          {layout === "editorial" && <LayoutEditorial posts={filtered} onNavigate={handleNavigate} />}
          {layout === "masonry" && <LayoutMasonry posts={filtered} onNavigate={handleNavigate} />}
          {layout === "minimal" && <LayoutMinimal posts={filtered} onNavigate={handleNavigate} />}
        </>
      )}

      {/* ── Newsletter CTA */}
      <div style={{
        marginTop: 80, borderRadius: 20, padding: "56px 40px", textAlign: "center",
        background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_DARK} 100%)`,
        color: "#fff", position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: -60, right: -60, width: 220, height: 220,
          borderRadius: "50%", background: "rgba(255,255,255,.07)",
        }} />
        <div style={{
          position: "absolute", bottom: -40, left: -40, width: 160, height: 160,
          borderRadius: "50%", background: "rgba(255,255,255,.05)",
        }} />
        <h2 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 10px", fontFamily: "'Georgia', serif" }}>
          Never miss an article
        </h2>
        <p style={{ fontSize: 15, opacity: .85, margin: "0 0 28px" }}>
          Subscribe and get our latest posts delivered straight to your inbox.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
          <input placeholder="Enter your email" style={{
            padding: "12px 20px", borderRadius: 8, border: "none",
            fontSize: 14, minWidth: 240, outline: "none", color: "#333",
          }} />
          <button style={{
            padding: "12px 28px", borderRadius: 8, background: "#fff",
            color: BRAND, border: "none", fontWeight: 800, fontSize: 14, cursor: "pointer",
          }}>
            Subscribe
          </button>
        </div>
      </div>
    </div>
  );
}


export default BlogPage;

