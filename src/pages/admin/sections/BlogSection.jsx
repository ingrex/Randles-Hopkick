import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  apiGetAdminBlogPosts,
  apiCreateBlogPost,
  apiUpdateBlogPost,
  apiDeleteBlogPost,
  apiSetFeaturedBlogPost,
  apiGetFeaturedBlogPost,
} from "../../../api/auth";
import { invalidateBlogCache } from "../../data/blogPosts";
import {
  Newspaper, Plus, Pencil, Trash2, Eye, Save, AlertTriangle, RefreshCw,
  Flame, ChevronUp, ChevronDown, X,
} from "lucide-react";
import { Pill, Btn, FormField, inputCls, EmptyState } from "../shared/adminUI";

// ─────────────────────────────────────────────────────────────────────────────
// BLOG HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const BLOCK_TYPES = ["paragraph", "heading", "quote"];

const ACCENT_OPTIONS = [
  { label: "Blue (brand)",  value: "#2385cd" },
  { label: "Gold",          value: "#c8a96e" },
  { label: "Teal",          value: "#4a7c6f" },
  { label: "Dark",          value: "#1c1a16" },
];

const CATEGORY_OPTIONS = [
  "Hiring Tips",
  "Workforce Insights",
  "Caregiver Spotlight",
  "Domestic Staffing",
  "Company News",
];

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// Blank post template
function blankPost() {
  return {
    id:         null,   // null until backend assigns _id
    backendId:  null,
    slug:       "",
    title:      "",
    excerpt:    "",
    author:     "R&H Editorial",
    authorBio:  "The editorial team at Randle & Hopkick — specialists in domestic and corporate workforce solutions across Nigeria.",
    date:       new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
    readTime:   "5 min",
    accent:     "#2385cd",
    category:   "Hiring Tips",
    trending:   false,
    image:      "",
    status:     "Draft",
    content:    [{ type: "paragraph", text: "" }],
  };
}

// Blank featured template
function blankFeatured() {
  return {
    slug:       "",
    title:      "",
    excerpt:    "",
    author:     "R&H Editorial",
    authorBio:  "The editorial team at Randle & Hopkick.",
    date:       new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
    readTime:   "10 min",
    accent:     "#2385cd",
    category:   "Workforce Insights",
    image:      "",
    content:    [{ type: "paragraph", text: "" }],
  };
}

// Normalise a raw backend post into the admin-panel UI shape
function normaliseAdminPost(raw) {
  if (!raw || typeof raw !== "object") return null;
  const backendId = raw._id ?? raw.id ?? null;
  return {
    id:        backendId ?? String(Date.now()),
    backendId: backendId,
    slug:      raw.slug      ?? "",
    title:     raw.title     ?? "",
    excerpt:   raw.excerpt   ?? "",
    author:    raw.author    ?? "R&H Editorial",
    authorBio: raw.authorBio ?? "",
    date:      raw.date      ?? "",
    readTime:  raw.readTime  ?? "5 min",
    accent:    raw.accent    ?? "#2385cd",
    category:  raw.category  ?? "Hiring Tips",
    trending:  raw.trending  ?? false,
    status:    raw.status    ?? "Draft",
    image:     raw.image     ?? "",
    content:   Array.isArray(raw.content) ? raw.content : [],
  };
}

// ── Content block editor ─────────────────────────────────────────────────────
function ContentBlockEditor({ blocks, onChange }) {
  const update = (idx, field, value) => {
    const next = blocks.map((b, i) => i === idx ? { ...b, [field]: value } : b);
    onChange(next);
  };
  const add = (type = "paragraph") => onChange([...blocks, { type, text: "" }]);
  const remove = (idx) => onChange(blocks.filter((_, i) => i !== idx));
  const move = (idx, dir) => {
    const next = [...blocks];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {blocks.map((block, idx) => (
        <div key={`block-${idx}`} className="border border-gray-200 rounded-xl p-3 space-y-2 bg-gray-50">
          <div className="flex items-center gap-2 flex-wrap">
            <select
              className={inputCls + " flex-none w-36"}
              value={block.type}
              onChange={(e) => update(idx, "type", e.target.value)}
            >
              {BLOCK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <span className="text-xs text-gray-400 flex-1">Block {idx + 1}</span>
            <div className="flex gap-1">
              <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0}
                className="flex items-center justify-center px-2 py-1 rounded bg-white border border-gray-200 text-gray-500 hover:border-[#2385cd] hover:text-[#2385cd] disabled:opacity-30 transition">
                <ChevronUp size={13} />
              </button>
              <button type="button" onClick={() => move(idx, 1)} disabled={idx === blocks.length - 1}
                className="flex items-center justify-center px-2 py-1 rounded bg-white border border-gray-200 text-gray-500 hover:border-[#2385cd] hover:text-[#2385cd] disabled:opacity-30 transition">
                <ChevronDown size={13} />
              </button>
              <button type="button" onClick={() => remove(idx)}
                className="flex items-center justify-center px-2 py-1 rounded bg-red-50 border border-red-100 text-red-500 hover:bg-red-100 transition">
                <X size={13} />
              </button>
            </div>
          </div>
          <textarea
            className={inputCls + " resize-none"}
            rows={block.type === "paragraph" ? 4 : 2}
            placeholder={
              block.type === "paragraph" ? "Paragraph text…" :
              block.type === "heading"   ? "Section heading…" :
                                          "Pull quote text…"
            }
            value={block.text}
            onChange={(e) => update(idx, "text", e.target.value)}
          />
        </div>
      ))}
      <div className="flex gap-2 flex-wrap">
        {BLOCK_TYPES.map((t) => (
          <button key={t} type="button" onClick={() => add(t)}
            className="text-xs px-3 py-1.5 rounded-lg bg-[#eaf4fc] text-[#2385cd] border border-[#b8d9f0] hover:bg-[#b8d9f0] transition">
            + {t}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Full-width modal for blog post editing ────────────────────────────────────
function BlogModal({ open, title, onClose, children, footer }) {
  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm sm:p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}>
        <motion.div
          initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
          className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-3xl max-h-[94vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#eaf4fc] sticky top-0 bg-white z-10">
            <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-[#2385cd] transition p-1 -mr-1">
              <X size={18} />
            </button>
          </div>
          <div className="px-5 py-4 space-y-4">{children}</div>
          {footer && (
            <div className="px-5 py-3 border-t border-[#eaf4fc] flex justify-end gap-2 flex-wrap sticky bottom-0 bg-white">
              {footer}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BLOG POST FORM FIELDS
// Defined at module level so React never treats it as a new component type
// between renders — this is what prevents the "one letter at a time" bug
// where inputs lose focus on every keystroke.
// ─────────────────────────────────────────────────────────────────────────────
function PostFormFields({ f, onChange, onContentChange }) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Title *">
          <input
            name="title"
            className={inputCls}
            value={f.title}
            onChange={onChange}
            placeholder="Article title…"
            autoComplete="off"
          />
        </FormField>
        <FormField label="Slug (URL path)">
          <input
            name="slug"
            className={inputCls}
            value={f.slug}
            onChange={onChange}
            placeholder="auto-generated-from-title"
            autoComplete="off"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Category">
          <select name="category" className={inputCls} value={f.category} onChange={onChange}>
            {CATEGORY_OPTIONS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </FormField>
        <FormField label="Author">
          <input
            name="author"
            className={inputCls}
            value={f.author}
            onChange={onChange}
            placeholder="R&H Editorial"
            autoComplete="off"
          />
        </FormField>
      </div>

      <FormField label="Author bio (short, shown under the headline)">
        <input
          name="authorBio"
          className={inputCls}
          value={f.authorBio || ""}
          onChange={onChange}
          placeholder="Brief author description…"
          autoComplete="off"
        />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <FormField label="Publish date">
          <input
            name="date"
            className={inputCls}
            value={f.date}
            onChange={onChange}
            placeholder="22 May 2026"
            autoComplete="off"
          />
        </FormField>
        <FormField label="Read time">
          <input
            name="readTime"
            className={inputCls}
            value={f.readTime}
            onChange={onChange}
            placeholder="5 min"
            autoComplete="off"
          />
        </FormField>
        <FormField label="Accent colour">
          <select name="accent" className={inputCls} value={f.accent} onChange={onChange}>
            {ACCENT_OPTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
        </FormField>
      </div>

      <FormField label="Cover image URL">
        <input
          name="image"
          className={inputCls}
          value={f.image || ""}
          onChange={onChange}
          placeholder="https://res.cloudinary.com/… or any public image URL"
          autoComplete="off"
        />
        {f.image && (
          <div className="mt-2 rounded-lg overflow-hidden border border-gray-100" style={{ maxHeight: 120 }}>
            <img
              src={f.image}
              alt="cover preview"
              className="w-full object-cover"
              style={{ maxHeight: 120 }}
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
          </div>
        )}
      </FormField>

      <FormField label="Excerpt / summary (shown on blog listing)">
        <textarea
          name="excerpt"
          className={inputCls + " resize-none"}
          rows={3}
          value={f.excerpt}
          onChange={onChange}
          placeholder="One-paragraph summary visible on the blog listing page…"
        />
      </FormField>

      {"status" in f && (
        <div className="flex flex-wrap gap-4 items-center">
          <FormField label="Status">
            <select name="status" className={inputCls + " w-36"} value={f.status} onChange={onChange}>
              <option value="Draft">Draft</option>
              <option value="Published">Published</option>
            </select>
          </FormField>
          <div className="flex items-center gap-2 mt-5">
            <input
              type="checkbox"
              name="trending"
              id="chk-trending"
              checked={!!f.trending}
              onChange={onChange}
              className="w-4 h-4 accent-[#2385cd]"
            />
            <label htmlFor="chk-trending" className="text-sm text-gray-600 cursor-pointer flex items-center gap-1.5">
              <Flame size={13} className="text-orange-500" /> Mark as trending
            </label>
          </div>
        </div>
      )}

      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">Article content blocks</p>
        <ContentBlockEditor blocks={f.content || []} onChange={onContentChange} />
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: Blog  — all writes go to backend; cache is invalidated after each
// ─────────────────────────────────────────────────────────────────────────────
export default function BlogSection({ state, dispatch }) {
  // posts & featured are loaded fresh from the backend on mount
  const [posts,    setPosts]    = useState([]);
  const [featured, setFeatured] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [apiError, setApiError] = useState("");

  const [modal,       setModal]       = useState(null); // null | "post" | "featured" | "preview"
  const [editing,     setEditing]     = useState(null);
  const [form,        setForm]        = useState(blankPost());
  const [featForm,    setFeatForm]    = useState(blankFeatured());
  const [previewItem, setPreviewItem] = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [saveNote,    setSaveNote]    = useState("");
  const [filter,      setFilter]      = useState("All");
  const [search,      setSearch]      = useState("");

  // ── Load from backend on mount ───────────────────────────────────────────
  const loadFromBackend = async () => {
    setLoading(true);
    setApiError("");
    try {
      const [rawPosts, rawFeatured] = await Promise.allSettled([
        apiGetAdminBlogPosts(),
        apiGetFeaturedBlogPost(),
      ]);

      if (rawPosts.status === "fulfilled") {
        const list = Array.isArray(rawPosts.value)
          ? rawPosts.value
          : (rawPosts.value?.posts ?? rawPosts.value?.data ?? []);
        setPosts(list.map(normaliseAdminPost).filter(Boolean));
      } else {
        console.warn("[BlogSection] Could not load posts:", rawPosts.reason?.message);
        setApiError("Could not load posts from backend.");
      }

      if (rawFeatured.status === "fulfilled") {
        const raw = rawFeatured.value;
        const feat = raw?.featured ?? raw?.data ?? raw ?? null;
        if (feat && typeof feat === "object" && feat.title) {
          setFeatured(feat);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFromBackend(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived list ─────────────────────────────────────────────────────────
  const shown = posts
    .filter((p) => filter === "All" || p.status === filter)
    .filter((p) =>
      !search.trim() ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      p.author.toLowerCase().includes(search.toLowerCase())
    );

  // ── Post helpers ──────────────────────────────────────────────────────────
  const openNewPost = () => {
    setEditing(null);
    setForm(blankPost());
    setSaveNote("");
    setModal("post");
  };

  const openEditPost = (p) => {
    setEditing(p);
    setForm({ ...blankPost(), ...p, content: p.content?.length ? p.content : [{ type: "paragraph", text: "" }] });
    setSaveNote("");
    setModal("post");
  };

  const openPreview = (p) => { setPreviewItem(p); setModal("preview"); };

  const closeModal = () => { setModal(null); setEditing(null); setSaveNote(""); };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "title" && (!prev.slug || prev.slug === slugify(prev.title))
        ? { slug: slugify(value) }
        : {}),
    }));
  };

  // ── SAVE POST → backend ──────────────────────────────────────────────────
  const savePost = async () => {
    setSaving(true);
    setSaveNote("");
    const payload = {
      ...form,
      slug: form.slug?.trim() || slugify(form.title),
    };
    try {
      if (editing && editing.backendId) {
        // UPDATE existing post
        const updated = await apiUpdateBlogPost(editing.backendId, payload);
        const normalised = normaliseAdminPost(updated?.post ?? updated?.data ?? updated ?? payload);
        setPosts((prev) => prev.map((p) => p.backendId === editing.backendId ? normalised : p));
      } else {
        // CREATE new post
        const created = await apiCreateBlogPost(payload);
        const normalised = normaliseAdminPost(created?.post ?? created?.data ?? created ?? payload);
        setPosts((prev) => [normalised, ...prev]);
      }
      // Bust public cache so BlogPage picks up the change
      invalidateBlogCache();
      closeModal();
    } catch (err) {
      console.error("[BlogSection] savePost failed:", err.message);
      setSaveNote(`Backend error: ${err.message}. Changes not saved.`);
    } finally {
      setSaving(false);
    }
  };

  // ── DELETE POST → backend ────────────────────────────────────────────────
  const deletePost = async (p) => {
    if (!p.backendId) {
      // No backend ID — just remove from local state
      setPosts((prev) => prev.filter((x) => x.id !== p.id));
      return;
    }
    try {
      await apiDeleteBlogPost(p.backendId);
      setPosts((prev) => prev.filter((x) => x.backendId !== p.backendId));
      invalidateBlogCache();
    } catch (err) {
      console.error("[BlogSection] deletePost failed:", err.message);
    }
  };

  // ── TOGGLE STATUS (Publish / Unpublish) → backend ────────────────────────
  const toggleStatus = async (p) => {
    const newStatus = p.status === "Published" ? "Draft" : "Published";
    // Optimistic UI update
    setPosts((prev) => prev.map((x) => x.id === p.id ? { ...x, status: newStatus } : x));
    if (!p.backendId) return;
    try {
      await apiUpdateBlogPost(p.backendId, { ...p, status: newStatus });
      invalidateBlogCache();
    } catch (err) {
      console.error("[BlogSection] toggleStatus failed:", err.message);
      // Revert on failure
      setPosts((prev) => prev.map((x) => x.id === p.id ? { ...x, status: p.status } : x));
    }
  };

  // ── TOGGLE TRENDING → backend ────────────────────────────────────────────
  const toggleTrending = async (p) => {
    const newTrending = !p.trending;
    setPosts((prev) => prev.map((x) => x.id === p.id ? { ...x, trending: newTrending } : x));
    if (!p.backendId) return;
    try {
      await apiUpdateBlogPost(p.backendId, { ...p, trending: newTrending });
      invalidateBlogCache();
    } catch (err) {
      console.error("[BlogSection] toggleTrending failed:", err.message);
      setPosts((prev) => prev.map((x) => x.id === p.id ? { ...x, trending: p.trending } : x));
    }
  };

  // ── Featured helpers ─────────────────────────────────────────────────────
  const openEditFeatured = () => {
    setFeatForm(
      featured
        ? { ...blankFeatured(), ...featured, content: featured.content?.length ? featured.content : [{ type: "paragraph", text: "" }] }
        : blankFeatured()
    );
    setSaveNote("");
    setModal("featured");
  };

  const handleFeatFormChange = (e) => {
    const { name, value } = e.target;
    setFeatForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "title" && (!prev.slug || prev.slug === slugify(prev.title))
        ? { slug: slugify(value) }
        : {}),
    }));
  };

  // ── SAVE FEATURED → backend ──────────────────────────────────────────────
  const saveFeatured = async () => {
    setSaving(true);
    setSaveNote("");
    const payload = { ...featForm, slug: featForm.slug?.trim() || slugify(featForm.title) };
    try {
      await apiSetFeaturedBlogPost(payload);
      setFeatured(payload);
      invalidateBlogCache();
      closeModal();
    } catch (err) {
      console.error("[BlogSection] saveFeatured failed:", err.message);
      setSaveNote(`Backend error: ${err.message}. Changes not saved.`);
    } finally {
      setSaving(false);
    }
  };

  // ── Stats ────────────────────────────────────────────────────────────────
  const stats = {
    total:     posts.length,
    published: posts.filter((p) => p.status === "Published").length,
    draft:     posts.filter((p) => p.status === "Draft").length,
    trending:  posts.filter((p) => p.trending).length,
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div>
      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total posts",  value: stats.total,     color: "text-gray-900",   bg: "bg-white"     },
          { label: "Published",    value: stats.published, color: "text-[#2385cd]",  bg: "bg-[#eaf4fc]" },
          { label: "Drafts",       value: stats.draft,     color: "text-yellow-600", bg: "bg-yellow-50" },
          { label: "Trending",     value: stats.trending,  color: "text-orange-600", bg: "bg-orange-50" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-[#b8d9f0]/40`}>
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── API error banner ── */}
      {apiError && (
        <div className="mb-4 flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertTriangle size={13} className="shrink-0" />
          {apiError}
          <button onClick={loadFromBackend} className="ml-auto underline text-red-700 hover:text-red-900">Retry</button>
        </div>
      )}

      {/* ── Featured article banner ── */}
      <div className="mb-5 bg-[#0f1e2e] rounded-xl p-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium text-[#2385cd] mb-1 uppercase tracking-wide">Featured Article (Hero)</p>
          {featured ? (
            <>
              <p className="text-sm font-semibold text-white truncate">{featured.title || "Untitled"}</p>
              <p className="text-xs text-white/50 mt-0.5">{featured.category} · {featured.date}</p>
            </>
          ) : (
            <p className="text-sm text-white/40 italic">No featured article set yet</p>
          )}
        </div>
        <Btn variant="brand" onClick={openEditFeatured}><Pencil size={12} /> {featured ? "Edit featured" : "Set featured"}</Btn>
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          className={inputCls + " flex-1 min-w-[160px] max-w-xs"}
          placeholder="Search posts…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex gap-1">
          {["All", "Published", "Draft"].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition shrink-0 ${
                filter === f ? "bg-[#2385cd] text-white shadow-sm" : "bg-white text-gray-600 border border-gray-200 hover:border-[#2385cd] hover:text-[#2385cd]"
              }`}>{f}</button>
          ))}
        </div>
        <Btn variant="brand" onClick={loadFromBackend} disabled={loading}>
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
        </Btn>
        <Btn variant="primary" onClick={openNewPost}><Plus size={13} /> New post</Btn>
      </div>

      {/* ── Loading / empty states ── */}
      {loading && (
        <div className="space-y-3 animate-pulse">
          <div className="h-14 bg-gray-100 rounded-xl" />
          <div className="h-14 bg-gray-100 rounded-xl" />
          <div className="h-14 bg-gray-100 rounded-xl" />
        </div>
      )}
      {!loading && posts.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100">
          <EmptyState icon={Newspaper} title="No blog posts yet" subtitle="Create a new post — it will be published to the website immediately." />
        </div>
      )}
      {!loading && posts.length > 0 && shown.length === 0 && (
        <p className="text-gray-400 text-sm text-center py-10">No posts match your filter.</p>
      )}

      {/* ── Mobile cards ── */}
      {!loading && (
        <div className="block md:hidden space-y-3">
          {shown.map((p, idx) => (
            <div key={p.id ?? `blog-mob-${idx}`} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              {p.image && (
                <div className="h-28 overflow-hidden">
                  <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-gray-900 text-sm leading-snug flex-1">{p.title || "Untitled"}</p>
                  <Pill label={p.status} color={p.status === "Published" ? "green" : "yellow"} />
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                  <span className="bg-[#eaf4fc] text-[#2385cd] rounded-full px-2 py-0.5">{p.category}</span>
                  <span>{p.date}</span>
                  <span>{p.readTime} read</span>
                  {p.trending && (
                    <span className="text-orange-500 flex items-center gap-1">
                      <Flame size={11} /> Trending
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">{p.excerpt}</p>
                <div className="flex flex-wrap gap-1.5 pt-1 border-t border-gray-50">
                  <Btn variant="ghost" onClick={() => openEditPost(p)}><Pencil size={12} /> Edit</Btn>
                  <Btn variant="ghost" onClick={() => openPreview(p)}><Eye size={12} /> Preview</Btn>
                  <Btn variant="brand" onClick={() => toggleStatus(p)}>
                    {p.status === "Published" ? "Unpublish" : "Publish"}
                  </Btn>
                  <Btn variant="ghost" onClick={() => toggleTrending(p)}>
                    <Flame size={12} className={p.trending ? "text-orange-500" : "text-gray-400"} />
                    {p.trending ? "Remove" : "Set trending"}
                  </Btn>
                  <Btn variant="danger" onClick={() => deletePost(p)}><Trash2 size={12} /></Btn>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Desktop table ── */}
      {!loading && shown.length > 0 && (
        <div className="hidden md:block bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#eaf4fc]/60 border-b border-[#b8d9f0]/50">
                  {["Cover", "Title", "Category", "Author", "Date", "Status", "Trending", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[#1a6fa8]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map((p, idx) => (
                  <tr key={p.id ?? `blog-desk-${idx}`} className="border-b border-gray-50 hover:bg-[#eaf4fc]/30 transition">
                    <td className="px-4 py-3">
                      {p.image
                        ? <img src={p.image} alt="" className="w-14 h-10 object-cover rounded-lg border border-gray-100" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                        : <div className="w-14 h-10 rounded-lg bg-gray-100 flex items-center justify-center"><Newspaper size={14} className="text-gray-300" /></div>
                      }
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <p className="font-medium text-gray-900 truncate">{p.title || "Untitled"}</p>
                      <p className="text-xs text-gray-400 font-mono truncate">/blog/{p.slug || "—"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-[#eaf4fc] text-[#2385cd] rounded-full px-2 py-0.5">{p.category}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-[120px] truncate">{p.author}</td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{p.date}<br/>{p.readTime} read</td>
                    <td className="px-4 py-3"><Pill label={p.status} color={p.status === "Published" ? "green" : "yellow"} /></td>
                    <td className="px-4 py-3 text-center">
                      {p.trending
                        ? <Flame size={14} className="text-orange-500 mx-auto" />
                        : <span className="text-gray-200">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <Btn variant="ghost" onClick={() => openEditPost(p)}><Pencil size={12} /> Edit</Btn>
                        <Btn variant="ghost" onClick={() => openPreview(p)}><Eye size={12} /></Btn>
                        <Btn variant="brand" onClick={() => toggleStatus(p)}>
                          {p.status === "Published" ? "Unpublish" : "Publish"}
                        </Btn>
                        <Btn variant="ghost" onClick={() => toggleTrending(p)}>
                          <Flame size={12} className={p.trending ? "text-orange-500" : "text-gray-400"} />
                          {p.trending ? "Off" : "On"}
                        </Btn>
                        <Btn variant="danger" onClick={() => deletePost(p)}><Trash2 size={12} /></Btn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Post editor modal ── */}
      <BlogModal
        open={modal === "post"}
        title={editing ? `Edit post — ${editing.title || "Untitled"}` : "New blog post"}
        onClose={closeModal}
        footer={
          <>
            {saveNote && (
              <p className="text-xs text-red-600 mr-auto self-center flex items-center gap-1">
                <AlertTriangle size={12} /> {saveNote}
              </p>
            )}
            <Btn onClick={closeModal} disabled={saving}>Cancel</Btn>
            <Btn variant="primary" onClick={savePost} disabled={saving || !form.title?.trim()}>
              {saving ? "Saving…" : <><Save size={12} /> {editing ? "Save changes" : "Create post"}</>}
            </Btn>
          </>
        }
      >
        <PostFormFields
          f={form}
          onChange={handleFormChange}
          onContentChange={(blocks) => setForm((prev) => ({ ...prev, content: blocks }))}
        />
      </BlogModal>

      {/* ── Featured editor modal ── */}
      <BlogModal
        open={modal === "featured"}
        title="Edit featured article (blog hero)"
        onClose={closeModal}
        footer={
          <>
            {saveNote && (
              <p className="text-xs text-red-600 mr-auto self-center flex items-center gap-1">
                <AlertTriangle size={12} /> {saveNote}
              </p>
            )}
            <Btn onClick={closeModal} disabled={saving}>Cancel</Btn>
            <Btn variant="primary" onClick={saveFeatured} disabled={saving || !featForm.title?.trim()}>
              {saving ? "Saving…" : <><Save size={12} /> Save featured</>}
            </Btn>
          </>
        }
      >
        <div className="text-xs text-[#1a6fa8] bg-[#eaf4fc] border border-[#b8d9f0] rounded-lg px-3 py-2 mb-1">
          This article appears as the large hero feature on the blog listing page. Changes are saved directly to the backend.
        </div>
        <PostFormFields
          f={featForm}
          onChange={handleFeatFormChange}
          onContentChange={(blocks) => setFeatForm((prev) => ({ ...prev, content: blocks }))}
        />
      </BlogModal>

      {/* ── Preview modal ── */}
      <BlogModal
        open={modal === "preview"}
        title={`Preview — ${previewItem?.title || "Post"}`}
        onClose={closeModal}
        footer={<Btn onClick={closeModal}>Close</Btn>}
      >
        {previewItem && (
          <div className="space-y-4">
            {previewItem.image && (
              <img src={previewItem.image} alt="" className="w-full h-40 object-cover rounded-xl" onError={(e) => { e.currentTarget.style.display = "none"; }} />
            )}
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: previewItem.accent || "#2385cd" }}>{previewItem.category}</span>
              <h2 className="text-xl font-bold text-gray-900 mt-1 leading-snug" style={{ fontFamily: "serif", fontStyle: "italic" }}>{previewItem.title}</h2>
              <p className="text-xs text-gray-400 mt-1">{previewItem.author} · {previewItem.date} · {previewItem.readTime} read</p>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed border-l-4 pl-3" style={{ borderColor: previewItem.accent || "#2385cd" }}>{previewItem.excerpt}</p>
            <div className="space-y-3 text-sm">
              {(previewItem.content || []).map((block, i) => {
                if (block.type === "heading") return (
                  <h3 key={i} className="font-bold text-gray-900 text-base" style={{ borderLeft: `3px solid ${previewItem.accent || "#2385cd"}`, paddingLeft: 10 }}>{block.text}</h3>
                );
                if (block.type === "quote") return (
                  <blockquote key={i} className="italic text-gray-600 border-l-4 pl-4 py-1 bg-gray-50 rounded-r-lg" style={{ borderColor: previewItem.accent || "#2385cd" }}>"{block.text}"</blockquote>
                );
                return <p key={i} className="text-gray-700 leading-relaxed">{block.text}</p>;
              })}
            </div>
          </div>
        )}
      </BlogModal>
    </div>
  );
}