import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiGetMasterMarketplace, hasAuthToken, apiAdminGateLogin, clearAuthToken } from "../api/auth";
import { useStore, parseMasterMarketplace, normaliseMessage } from "../store";
import {
  apiFetchAdminTestimonials,
  apiCreateTestimonial,
  apiUpdateTestimonial,
  apiDeleteTestimonial,
  apiGetContactMessages,
} from "../api/auth";
import {
  ClipboardList, Users, UserCheck, Newspaper, MessageSquare, Mail, BadgeCheck,
  X, Plus, Pencil, Trash2, Eye, Save,
  Send, Star, AlertTriangle,
  ShieldAlert, Menu, ChevronLeft, MoreHorizontal, RefreshCw, LogIn, Lock,
  Image, Phone, Mail as MailIcon, Loader2,
} from "lucide-react";
import StaffSection from "./admin/sections/StaffSection";
import RegisteredSection from "./admin/sections/RegisteredSection";
import RequestsSection from "./admin/sections/RequestsSection";
import BlogSection from "./admin/sections/BlogSection";
import {
  Pill, Avatar, Modal, Btn, FormField, inputCls, StarRating, SkillTagInput, EmptyState,
} from "./admin/shared/adminUI";

// ── Brand tokens: Primary #2385cd | Navy #0f1e2e | Light #eaf4fc | Mid #b8d9f0

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN LOGIN GATE
// ─────────────────────────────────────────────────────────────────────────────
function AdminLoginGate({ onSuccess }) {
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    setError("");
    try {
      await apiAdminGateLogin({ password });
      onSuccess();
    } catch (err) {
      setError(err.message ?? "Login failed. Check your password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1e2e] p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-[#0f1e2e] px-8 py-8 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#2385cd]/20 flex items-center justify-center">
            <Lock size={22} className="text-[#2385cd]" />
          </div>
          <div className="text-center">
            <p className="font-bold text-white text-lg leading-tight">Randle &amp; Hopkick</p>
            <p className="text-xs font-medium mt-1" style={{ color: "#2385cd" }}>Admin Panel</p>
          </div>
        </div>
        <form onSubmit={handleLogin} className="px-8 py-7 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Admin password</label>
            <input
              type="password"
              className={inputCls}
              placeholder="Enter admin password…"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              autoComplete="current-password"
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              <AlertTriangle size={13} className="shrink-0" />
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full bg-[#2385cd] hover:bg-[#1a6fa8] text-white font-semibold py-2.5 rounded-lg text-sm transition disabled:opacity-50 flex items-center justify-center gap-2">
            <LogIn size={15} />
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

const NAV = [
  { key: "requests",     label: "Requests",         Icon: ClipboardList },
  { key: "staff",        label: "Staff",            Icon: Users         },
  { key: "registered",   label: "Registered Users", Icon: UserCheck     },
  { key: "blog",         label: "Blog",             Icon: Newspaper     },
  { key: "testimonials", label: "Testimonials",     Icon: MessageSquare },
  { key: "messages",     label: "Messages",         Icon: Mail          },
  { key: "profiles",     label: "Client Profiles",  Icon: BadgeCheck    },
];

const BOTTOM_NAV = ["requests", "staff", "messages", "profiles", "registered"];


// ── Helper: normalise a raw testimonial from the backend ─────────────────────
function normaliseTestimonial(t, idx) {
  if (!t || typeof t !== "object") return null;
  return {
    id:      t._id ?? t.id ?? `testi_${idx}`,
    name:    t.name    ?? "",
    role:    t.role    ?? "",
    text:    t.text    ?? t.content ?? t.testimonial ?? "",
    image:   t.image   ?? t.photo   ?? t.photoUrl    ?? "",
    rating:  Number(t.rating ?? 5),
    visible: t.visible ?? t.show ?? true,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: Testimonials
// ─────────────────────────────────────────────────────────────────────────────
function TestimonialsSection({ state, dispatch }) {
  const blankForm = { name: "", role: "", text: "", image: "", rating: 5, visible: true };

  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState(blankForm);
  const [saving,  setSaving]  = useState(false);
  const [apiNote, setApiNote] = useState("");

  useEffect(() => {
    apiFetchAdminTestimonials()
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.testimonials ?? []);
        const existingIds = new Set(state.testimonials.map((t) => String(t.id)));
        list.forEach((t, i) => {
          const normalised = normaliseTestimonial(t, i);
          if (normalised && !existingIds.has(String(normalised.id))) {
            dispatch({ type: "ADD_TESTI", payload: normalised });
          }
        });
      })
      .catch((err) => console.warn("[Testimonials] admin fetch failed:", err.message));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openEdit = (t) => { setEditing(t); setForm({ ...blankForm, ...t }); setModal(true); setApiNote(""); };
  const openNew  = ()  => { setEditing(null); setForm(blankForm); setModal(true); setApiNote(""); };
  const close    = ()  => { setModal(false); setApiNote(""); };

  const handle = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const save = async () => {
    setSaving(true); setApiNote("");
    const payload = { ...form, rating: Number(form.rating) };
    try {
      if (editing) {
        const updated = await apiUpdateTestimonial(editing.id, payload);
        dispatch({ type: "UPDATE_TESTI", payload: { ...editing, ...payload, id: updated._id ?? updated.id ?? editing.id } });
      } else {
        const created = await apiCreateTestimonial(payload);
        dispatch({ type: "ADD_TESTI", payload: { ...payload, id: created._id ?? created.id ?? Date.now() } });
      }
      close();
    } catch {
      if (editing) dispatch({ type: "UPDATE_TESTI", payload: { ...editing, ...payload } });
      else         dispatch({ type: "ADD_TESTI",    payload: { ...payload, id: Date.now() } });
      setApiNote("Saved locally — backend sync failed.");
    } finally { setSaving(false); }
  };

  const toggleVisible = async (t) => {
    try { await apiUpdateTestimonial(t.id, { visible: !t.visible }); } catch { /* local */ }
    dispatch({ type: "UPDATE_TESTI", payload: { ...t, visible: !t.visible } });
  };

  const remove = async (t) => {
    try { await apiDeleteTestimonial(t.id); } catch { /* local */ }
    dispatch({ type: "DELETE_TESTI", id: t.id });
  };

  function TestiAvatar({ src, name, size = 40 }) {
    const [broken, setBroken] = useState(false);
    const initials = (name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
    if (src && !broken) {
      return (
        <img src={src} alt={name} onError={() => setBroken(true)}
          style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid rgba(35,133,205,0.35)" }} />
      );
    }
    return (
      <div style={{
        width: size, height: size, borderRadius: "50%",
        background: "linear-gradient(135deg, #2385cd, #0055cc)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.35, fontWeight: 700, color: "#fff", flexShrink: 0,
      }}>{initials}</div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="hidden sm:block">
          <p className="text-xs text-gray-400">Changes sync to the backend and reflect on the public site immediately.</p>
          <p className="text-xs text-[#2385cd] mt-0.5">Only <strong>visible</strong> testimonials are shown on the website.</p>
        </div>
        <Btn variant="primary" onClick={openNew}><Plus size={13} /> Add testimonial</Btn>
      </div>

      {state.testimonials.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100">
          <EmptyState icon={MessageSquare} title="No testimonials yet" subtitle="Testimonials from the backend will load here. You can also add them manually." />
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
        {state.testimonials.map((t, idx) => (
          <div key={t.id ?? t._id ?? `testi-${idx}`} className="flex gap-3 p-4 hover:bg-[#eaf4fc]/20 transition">
            <TestiAvatar src={t.image} name={t.name} size={44} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-0.5">
                <p className="font-medium text-sm text-gray-900">{t.name}</p>
                <Pill label={t.visible ? "Visible" : "Hidden"} color={t.visible ? "green" : "yellow"} />
              </div>
              <p className="text-xs text-gray-400 mb-1">{t.role}</p>
              <div className="mb-1 flex items-center gap-1.5">
                <StarRating rating={t.rating} />
                <span className="text-xs text-gray-400">{t.rating}/5</span>
              </div>
              <p className="text-sm text-gray-600 italic line-clamp-2">"{t.text}"</p>
              {t.image && (
                <p className="text-[10px] text-gray-300 truncate mt-0.5 flex items-center gap-1" title={t.image}>
                  <Image size={10} className="shrink-0" /> {t.image}
                </p>
              )}
              <div className="flex gap-2 mt-2 flex-wrap">
                <Btn variant="ghost" onClick={() => openEdit(t)}><Pencil size={13} /> Edit</Btn>
                <Btn variant="brand" onClick={() => toggleVisible(t)}>
                  <Eye size={13} /> {t.visible ? "Hide" : "Show"}
                </Btn>
                <Btn variant="danger" onClick={() => remove(t)}><Trash2 size={13} /></Btn>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modal} title={editing ? `Edit — ${editing.name}` : "Add testimonial"} onClose={close}
        footer={
          <>
            {apiNote && <p className="text-xs text-amber-600 mr-auto self-center flex items-center gap-1"><AlertTriangle size={12} /> {apiNote}</p>}
            <Btn onClick={close} disabled={saving}>Cancel</Btn>
            <Btn variant="primary" onClick={save} disabled={saving}>{saving ? "Saving…" : <><Save size={12} /> Save</>}</Btn>
          </>
        }>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Full name">
            <input name="name" className={inputCls} value={form.name} onChange={handle} placeholder="Sandra Okafor" />
          </FormField>
          <FormField label="Role / company">
            <input name="role" className={inputCls} value={form.role} onChange={handle} placeholder="CEO, Company" />
          </FormField>
        </div>

        <FormField label="Testimonial text">
          <textarea name="text" className={inputCls + " resize-none"} rows={3} value={form.text} onChange={handle}
            placeholder="From onboarding to placement, the experience was seamless…" />
        </FormField>

        <FormField label="Avatar image URL (optional)">
          <div className="flex gap-2 items-center">
            <input name="image" className={inputCls} value={form.image} onChange={handle}
              placeholder="https://example.com/photo.jpg  or  Cloudinary URL" />
            {form.image && (
              <div className="shrink-0">
                <TestiAvatar src={form.image} name={form.name || "?"} size={36} />
              </div>
            )}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            Paste any public image URL (Cloudinary, CDN, etc.). Leave blank to show initials instead.
          </p>
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Rating (1–5)">
            <div className="flex items-center gap-2">
              <input name="rating" type="number" min="1" max="5" step="0.5" className={inputCls} value={form.rating} onChange={handle} />
              <div className="flex gap-0.5 shrink-0">
                {[1,2,3,4,5].map((s) => (
                  <Star
                    key={`preview-star-${s}`}
                    size={16}
                    className={s <= Math.round(form.rating) ? "text-[#2385cd] fill-[#2385cd]" : "text-gray-200 fill-gray-200"}
                  />
                ))}
              </div>
            </div>
          </FormField>
          <FormField label="Visibility">
            <div className="flex items-center gap-2 mt-2">
              <input type="checkbox" name="visible" checked={!!form.visible} onChange={handle} className="w-4 h-4 rounded accent-[#2385cd]" />
              <span className="text-sm text-gray-600">Show on website</span>
            </div>
          </FormField>
        </div>

        {(form.name || form.text) && (
          <div>
            <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Live preview</p>
            <div className="rounded-2xl relative"
              style={{ background: "linear-gradient(135deg, #0a0f1e 0%, #0d1b2a 100%)", border: "1px solid rgba(35,133,205,0.25)", padding: "18px 16px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <TestiAvatar src={form.image} name={form.name || "?"} size={46} />
                <div>
                  <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.88rem", margin: "0 0 2px" }}>{form.name || "Client name"}</p>
                  <p style={{ color: "#2385cd", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 5px" }}>{form.role || "Role, Company"}</p>
                  <div style={{ display: "flex", gap: 2 }}>
                    {[1,2,3,4,5].map((s) => (
                      <Star
                        key={`preview-card-star-${s}`}
                        size={11}
                        style={{ color: s <= Math.round(form.rating) ? "#2385cd" : "rgba(35,133,205,0.2)" }}
                        className={s <= Math.round(form.rating) ? "fill-[#2385cd]" : ""}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ width: 26, height: 2, background: "#2385cd", borderRadius: 2, marginBottom: 10 }} />
              <p style={{ color: "#c8d8e8", fontSize: "0.85rem", fontStyle: "italic", margin: 0 }}>
                "{form.text || "Testimonial text will appear here…"}"
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// SECTION: Messages
// ─────────────────────────────────────────────────────────────────────────────
function MessagesSection({ state, dispatch }) {
  const [filter,     setFilter]     = useState("all");
  const [active,     setActive]     = useState(null);
  const [reply,      setReply]      = useState("");
  const [mobilePane, setMobilePane] = useState("list");

  const shown  = filter === "all" ? state.messages : state.messages.filter((m) => m.type === filter);
  const unread = state.messages.filter((m) => !m.read).length;

  const openMsg = (m) => {
    dispatch({ type: "MARK_MSG_READ", id: m.id });
    setActive(m);
    setReply("");
    setMobilePane("detail");
  };

  const liveActive = active ? state.messages.find((m) => m.id === active.id) ?? active : null;

  const sendReply = () => {
    if (!reply.trim() || !active) return;
    dispatch({ type: "REPLY_MSG", id: active.id, text: reply.trim() });
    setReply("");
  };

  const MessageList = (
    <div className="flex-1 min-w-0">
      <div className="flex gap-2 mb-3 flex-wrap items-center overflow-x-auto pb-1">
        {[["all", "All"], ["contact", "Contact"], ["staff", "Staff requests"]].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition shrink-0 ${
              filter === k ? "bg-[#2385cd] text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-[#2385cd] hover:text-[#2385cd]"
            }`}>{l}</button>
        ))}
        {unread > 0 && <span className="ml-auto text-xs text-red-500 font-medium shrink-0">{unread} unread</span>}
      </div>

      {state.messages.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100">
          <EmptyState icon={Mail} title="No messages yet" subtitle="Contact form submissions will appear here when received." />
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
        {shown.map((m, idx) => (
          <div key={m.id ?? `msg-${idx}`} onClick={() => openMsg(m)}
            className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-[#eaf4fc]/40 transition ${liveActive?.id === m.id ? "bg-[#eaf4fc]/60 border-l-2 border-[#2385cd]" : ""}`}>
            <Avatar name={m.from} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <p className={`text-sm truncate ${!m.read ? "font-semibold text-gray-900" : "text-gray-700"}`}>{m.subject}</p>
                <span className="text-xs text-gray-400 shrink-0">
                  {m.time ? new Date(m.time).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : ""}
                </span>
              </div>
              <p className="text-xs text-gray-400 truncate"><strong>{m.from}</strong> — {m.body}</p>
              {m.replies?.length > 0 && (
                <span className="text-xs text-[#2385cd] font-medium mt-0.5 inline-block">
                  {m.replies.length} repl{m.replies.length > 1 ? "ies" : "y"} sent
                </span>
              )}
            </div>
            {!m.read && <span className="w-2 h-2 rounded-full bg-[#2385cd] shrink-0 mt-1.5" />}
          </div>
        ))}
        {shown.length === 0 && state.messages.length > 0 && <p className="text-gray-400 text-sm p-4">No messages in this category.</p>}
      </div>
    </div>
  );

  const MessageDetail = liveActive && (
    <div className="flex flex-col bg-white rounded-xl border border-gray-100 overflow-hidden" style={{ minHeight: 400 }}>
      <div className="p-4 border-b border-[#eaf4fc] bg-[#eaf4fc]/40">
        <button className="flex items-center gap-1 text-xs text-[#2385cd] font-medium mb-3 md:hidden" onClick={() => setMobilePane("list")}>
          <ChevronLeft size={14} /> Back to messages
        </button>
        <div className="flex items-center gap-2 mb-1">
          <Avatar name={liveActive.from} size="md" />
          <div>
            <p className="font-medium text-sm text-gray-900">{liveActive.from}</p>
            <p className="text-xs text-gray-400">{liveActive.time ? new Date(liveActive.time).toLocaleString("en-GB") : ""}</p>
          </div>
        </div>
        <p className="font-semibold text-sm text-gray-900 mt-2">{liveActive.subject}</p>
        {(liveActive.phone || liveActive.email) && (
          <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-500">
            {liveActive.email && (
              <span className="flex items-center gap-1">
                <MailIcon size={11} className="shrink-0" /> {liveActive.email}
              </span>
            )}
            {liveActive.phone && (
              <span className="flex items-center gap-1">
                <Phone size={11} className="shrink-0" /> {liveActive.phone}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="flex gap-2">
          <Avatar name={liveActive.from} size="sm" />
          <div className="bg-gray-50 rounded-xl rounded-tl-none px-3 py-2 text-sm text-gray-600 leading-relaxed max-w-[85%]">{liveActive.body}</div>
        </div>
        {liveActive.replies?.map((r, i) => (
          <div key={`reply-${i}`} className="flex gap-2 justify-end">
            <div className="bg-[#2385cd] rounded-xl rounded-tr-none px-3 py-2 text-sm text-white leading-relaxed max-w-[85%]">
              <p>{r.text}</p>
              <p className="text-[10px] text-white/60 mt-1 text-right">
                {new Date(r.sentAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#0f1e2e] text-white flex items-center justify-center text-xs font-semibold shrink-0">SA</div>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-[#eaf4fc] space-y-2">
        <textarea className={inputCls + " resize-none"} rows={3} placeholder="Type a reply…"
          value={reply} onChange={(e) => setReply(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) sendReply(); }} />
        <Btn variant="primary" className="w-full justify-center" onClick={sendReply} disabled={!reply.trim()}>
          <Send size={13} /> Send reply
        </Btn>
      </div>
    </div>
  );

  return (
    <>
      <div className="block md:hidden">
        {mobilePane === "list" ? MessageList : (MessageDetail || MessageList)}
      </div>
      <div className="hidden md:flex gap-4 min-h-0">
        {MessageList}
        {liveActive && <div className="w-80 shrink-0">{MessageDetail}</div>}
      </div>
    </>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// SECTION: Client Profiles
// ─────────────────────────────────────────────────────────────────────────────
function ProfilesSection({ state }) {
  const seen    = new Set();
  const clients = state.requests
    .filter((r) => { if (seen.has(r.email)) return false; seen.add(r.email); return true; })
    .map((r) => ({
      name: r.clientName, email: r.email, phone: r.phone,
      type: r.clientType, location: r.location,
      requests: state.requests.filter((x) => x.email === r.email).length,
      regUser:  (state.registeredUsers || []).find((u) => u.email === r.email),
    }));

  const [modal,   setModal]   = useState(false);
  const [viewing, setViewing] = useState(null);

  return (
    <div>
      {clients.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100">
          <EmptyState icon={BadgeCheck} title="No client profiles yet" subtitle="Client profiles are built automatically from submitted requests." />
        </div>
      )}

      <div className="block md:hidden space-y-3">
        {clients.map((c, i) => (
          <div key={`profile-mob-${i}`} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-3 mb-2">
              <Avatar src={c.regUser?.photoUrl} name={c.name} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{c.name}</p>
                <p className="text-xs text-gray-400 truncate">{c.email}</p>
                <p className="text-xs text-gray-400">{c.phone}</p>
              </div>
              <Pill label={c.type} color="sky" />
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">{c.location} · <span className="font-medium text-[#2385cd]">{c.requests} requests</span></div>
              <Btn variant="ghost" onClick={() => { setViewing(c); setModal(true); }}><Eye size={13} /> View</Btn>
            </div>
          </div>
        ))}
      </div>

      {clients.length > 0 && (
        <div className="hidden md:block bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#eaf4fc]/60 border-b border-[#b8d9f0]/50">
                  {["Name", "Email", "Phone", "Type", "Location", "Requests", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[#1a6fa8]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clients.map((c, i) => (
                  <tr key={`profile-desk-${i}`} className="border-b border-gray-50 hover:bg-[#eaf4fc]/30 transition">
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><Avatar src={c.regUser?.photoUrl} name={c.name} /><span className="font-medium text-gray-900">{c.name}</span></div></td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{c.email}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{c.phone}</td>
                    <td className="px-4 py-3"><Pill label={c.type} color="sky" /></td>
                    <td className="px-4 py-3 text-xs text-gray-500">{c.location}</td>
                    <td className="px-4 py-3 text-center font-medium text-[#2385cd]">{c.requests}</td>
                    <td className="px-4 py-3"><Btn variant="ghost" onClick={() => { setViewing(c); setModal(true); }}><Eye size={13} /> View</Btn></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modal} title={`Profile — ${viewing?.name}`} onClose={() => setModal(false)} footer={<Btn onClick={() => setModal(false)}>Close</Btn>}>
        {viewing && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar src={viewing.regUser?.photoUrl} name={viewing.name} size="md" />
              <div>
                <p className="font-semibold text-gray-900">{viewing.name}</p>
                <p className="text-xs text-gray-400 break-all">{viewing.email}</p>
                <p className="text-xs text-gray-400">{viewing.phone}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-gray-400">Type</p><p className="font-medium">{viewing.type}</p></div>
              <div><p className="text-xs text-gray-400">Location</p><p className="font-medium">{viewing.location}</p></div>
              <div><p className="text-xs text-gray-400">Total requests</p><p className="font-medium text-[#2385cd]">{viewing.requests}</p></div>
              {viewing.regUser && <div><p className="text-xs text-gray-400">Registered</p><p className="font-medium">{new Date(viewing.regUser.registeredAt).toLocaleDateString("en-GB")}</p></div>}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}


// ── Helper: normalise a raw contact message from /contact/admin/all ───────────
function normaliseContactMessage(m, idx) {
  if (!m || typeof m !== "object") return null;
  const mapped = {
    _id:     m._id     ?? m.id,
    from:    m.name    ?? m.from    ?? m.senderName ?? "Unknown",
    subject: m.subject ?? m.title   ?? "Contact form submission",
    body:    m.message ?? m.body    ?? m.content    ?? "",
    type:    "contact",
    time:    m.createdAt ?? m.time  ?? null,
    read:    m.read    ?? false,
    replies: m.replies ?? [],
    email:   m.email   ?? m.senderEmail ?? "",
    phone:   m.phoneNumber ?? m.phone   ?? "",
  };
  return normaliseMessage(mapped, idx);
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT: AdminPanel
// ─────────────────────────────────────────────────────────────────────────────
export function AdminPanel() {
  const { state, dispatch } = useStore();

  const [authed,      setAuthed]      = useState(() => hasAuthToken());
  const [section,     setSection]     = useState("requests");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [syncing,     setSyncing]     = useState(false);
  const [syncError,   setSyncError]   = useState("");

  const debugSync = async (raw) => {
    console.group("🔍 [AdminPanel] syncData DEBUG");
    console.log("1. raw type:", typeof raw);
    console.log("2. raw is null/undefined?", raw == null);
    console.log("3. raw value:", raw);
    console.log("4. top-level keys:", Object.keys(raw ?? {}));
    console.log("5. raw.data:", raw?.data);
    console.log("6. raw.users  →", Array.isArray(raw?.users)  ? `Array(${raw.users.length})`  : raw?.users);
    console.log("7. raw.staff  →", Array.isArray(raw?.staff)  ? `Array(${raw.staff.length})`  : raw?.staff);
    console.log("8. raw.profile →", Array.isArray(raw?.profile) ? `Array(${raw.profile.length})` : raw?.profile);
    if (raw?.data) {
      console.log("--- Checking raw.data ---");
      console.log("raw.data keys:", Object.keys(raw.data ?? {}));
      console.log("raw.data.users  →", Array.isArray(raw.data?.users)  ? `Array(${raw.data.users.length})`  : raw.data?.users);
      console.log("raw.data.staff  →", Array.isArray(raw.data?.staff)  ? `Array(${raw.data.staff.length})`  : raw.data?.staff);
      console.log("raw.data.profile →", Array.isArray(raw.data?.profile) ? `Array(${raw.data.profile.length})` : raw.data?.profile);
    }
    const parsed = parseMasterMarketplace(raw);
    console.log("--- After parseMasterMarketplace ---");
    console.log("9.  parsed.requests        →", parsed.requests?.length, parsed.requests);
    console.log("10. parsed.registeredUsers →", parsed.registeredUsers?.length);
    console.log("11. parsed.staff           →", parsed.staff?.length);
    console.log("12. parsed.messages        →", parsed.messages?.length);
    console.groupEnd();
    return parsed;
  };

  const fetchAndMergeContacts = async (marketplaceData) => {
    try {
      const raw = await apiGetContactMessages();
      const list = Array.isArray(raw) ? raw
        : Array.isArray(raw?.data)     ? raw.data
        : Array.isArray(raw?.messages) ? raw.messages
        : Array.isArray(raw?.contacts) ? raw.contacts
        : [];
      console.log(`[AdminPanel] /contact/admin/all → ${list.length} messages`);
      const contactMsgs = list.map((m, i) => normaliseContactMessage(m, i)).filter(Boolean);
      const existingIds = new Set(marketplaceData.messages.map((m) => String(m.id)));
      const newContacts = contactMsgs.filter((m) => !existingIds.has(String(m.id)));
      return { ...marketplaceData, messages: [...marketplaceData.messages, ...newContacts] };
    } catch (err) {
      console.warn("[AdminPanel] Could not fetch contact messages:", err.message);
      return marketplaceData;
    }
  };

  const syncData = async () => {
    setSyncing(true); setSyncError("");
    try {
      const raw  = await apiGetMasterMarketplace();
      let   data = await debugSync(raw);
      data = await fetchAndMergeContacts(data);
      dispatch({ type: "LOAD_MARKETPLACE", payload: data });
    } catch (err) {
      console.error("[AdminPanel] ❌ syncData FAILED:", err);
      if (err.status === 401 || err.status === 403) {
        clearAuthToken();
        setAuthed(false);
        return;
      }
      setSyncError(err.message ?? "Sync failed");
    } finally { setSyncing(false); }
  };

  useEffect(() => {
    if (!authed || !hasAuthToken()) return;

    let cancelled = false;
    (async () => {
      setSyncing(true); setSyncError("");
      try {
        const raw = await apiGetMasterMarketplace();
        if (!cancelled) {
          let data = await debugSync(raw);
          data = await fetchAndMergeContacts(data);
          dispatch({ type: "LOAD_MARKETPLACE", payload: data });
        }
      } catch (err) {
        if (!cancelled) {
          console.error("[AdminPanel] ❌ useEffect sync FAILED:", err);
          if (err.status === 401 || err.status === 403) {
            clearAuthToken();
            setAuthed(false);
            return;
          }
          setSyncError(err.message ?? "Sync failed");
        }
      } finally { if (!cancelled) setSyncing(false); }
    })();
    return () => { cancelled = true; };
  }, [authed]);

  if (!authed) {
    return <AdminLoginGate onSuccess={() => setAuthed(true)} />;
  }

  const pendingCount  = state.requests.filter((r) => r.status === "Pending").length;
  const unreadCount   = state.messages.filter((m) => !m.read).length;
  const newUsersCount = (state.registeredUsers || []).filter((u) => {
    if (!u.registeredAt) return false;
    return Date.now() - new Date(u.registeredAt).getTime() < 86_400_000;
  }).length;

  const getBadge = (key) =>
    key === "requests" ? pendingCount : key === "messages" ? unreadCount : key === "registered" ? newUsersCount : 0;

  const sectionContent = {
    requests:     <RequestsSection     state={state} dispatch={dispatch} />,
    staff:        <StaffSection        state={state} dispatch={dispatch} />,
    registered:   <RegisteredSection   state={state} />,
    blog:         <BlogSection         state={state} dispatch={dispatch} />,
    testimonials: <TestimonialsSection state={state} dispatch={dispatch} />,
    messages:     <MessagesSection     state={state} dispatch={dispatch} />,
    profiles:     <ProfilesSection     state={state} />,
  };

  const titles = {
    requests: "Requests", staff: "Staff Registry", registered: "Registered Users",
    blog: "Blog Manager", testimonials: "Testimonials", messages: "Messages", profiles: "Client Profiles",
  };

  const navigate = (key) => { setSection(key); setSidebarOpen(false); };

  const handleLogout = () => {
    clearAuthToken();
    setAuthed(false);
  };

  const SidebarNav = (
    <nav className="flex-1 py-2 overflow-y-auto">
      {NAV.map(({ key, label, Icon }) => {
        const badge    = getBadge(key);
        const isActive = section === key;
        return (
          <button key={key} onClick={() => navigate(key)}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs transition text-left relative"
            style={{
              color:           isActive ? "#ffffff" : "rgba(255,255,255,0.55)",
              backgroundColor: isActive ? "rgba(35,133,205,0.18)" : "transparent",
              borderRight:     isActive ? "2px solid #2385cd" : "2px solid transparent",
            }}>
            <Icon size={14} className="shrink-0" style={{ color: isActive ? "#2385cd" : undefined }} />
            <span className="flex-1 truncate font-medium">{label}</span>
            {badge > 0 && (
              <span className="text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold shrink-0"
                style={{ backgroundColor: "#2385cd" }}>{badge}</span>
            )}
          </button>
        );
      })}
    </nav>
  );

  const SidebarFooter = (
    <div className="px-3 py-4 border-t border-white/10">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: "#2385cd" }}>SA</div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-white truncate">Super Admin</p>
          <p className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.4)" }}>randle&hopkick@gmail.com</p>
        </div>
        <button onClick={handleLogout} title="Sign out"
          className="p-1 text-white/30 hover:text-red-400 transition shrink-0">
          <X size={14} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-black/50 md:hidden"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)} />
            <motion.aside className="fixed inset-y-0 left-0 z-50 flex flex-col w-56 md:hidden"
              initial={{ x: -224 }} animate={{ x: 0 }} exit={{ x: -224 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{ backgroundColor: "#0f1e2e" }}>
              <div className="px-4 py-5 border-b border-white/10 flex items-center justify-between">
                <div>
                  <p className="font-bold text-white text-sm leading-tight">Randle&amp;Hopkick</p>
                  <p className="text-xs font-medium mt-0.5" style={{ color: "#2385cd" }}>Admin Panel</p>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="text-white/50 hover:text-white p-1"><X size={16} /></button>
              </div>
              {SidebarNav}
              {SidebarFooter}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <aside className="hidden md:flex w-48 shrink-0 flex-col" style={{ backgroundColor: "#0f1e2e" }}>
        <div className="px-4 py-5 border-b border-white/10">
          <p className="font-bold text-white text-sm leading-tight">Randle&amp;Hopkick</p>
          <p className="text-xs font-medium mt-0.5" style={{ color: "#2385cd" }}>Admin Panel</p>
        </div>
        {SidebarNav}
        {SidebarFooter}
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between shrink-0 gap-3 bg-[#0f1e2e] md:bg-white border-b border-white/10 md:border-gray-100">
          <div className="flex items-center gap-3 min-w-0">
            <button className="md:hidden p-1.5 rounded-lg hover:bg-white/10 transition shrink-0" onClick={() => setSidebarOpen(true)}>
              <Menu size={18} className="text-white" />
            </button>
            <div className="min-w-0">
              <h1 className="font-semibold text-white md:text-gray-900 text-sm sm:text-base truncate">{titles[section]}</h1>
              <p className="text-xs text-white/40 md:text-gray-400 hidden sm:block">
                {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                {state.lastSyncedAt && <span className="ml-2 text-[#2385cd]">· Synced {new Date(state.lastSyncedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>}
                {syncing   && <span className="inline-flex items-center gap-1 text-xs text-[#2385cd] animate-pulse ml-2"><Loader2 size={11} className="animate-spin" /> Syncing…</span>}
                {syncError && <span className="inline-flex items-center gap-1 text-xs text-red-400 ml-2" title={syncError}><AlertTriangle size={11} /> Sync failed</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={syncData} disabled={syncing} title="Refresh data from backend"
              className="p-1.5 rounded-lg text-white/50 md:text-gray-400 hover:bg-white/10 md:hover:bg-gray-100 transition disabled:opacity-40">
              <RefreshCw size={15} className={syncing ? "animate-spin" : ""} />
            </button>
            {pendingCount > 0 && (
              <button onClick={() => setSection("requests")}
                className="text-xs text-yellow-300 bg-yellow-500/20 border border-yellow-400/30 md:text-yellow-700 md:bg-yellow-50 md:border-yellow-200 rounded-full px-2.5 py-1 font-medium flex items-center gap-1">
                <ShieldAlert size={12} />
                <span className="hidden sm:inline">{pendingCount} pending</span>
                <span className="sm:hidden">{pendingCount}</span>
              </button>
            )}
            {newUsersCount > 0 && (
              <button onClick={() => setSection("registered")}
                className="text-xs rounded-full px-2.5 py-1 font-medium items-center gap-1 border hidden sm:flex"
                style={{ color: "#2385cd", backgroundColor: "#eaf4fc", borderColor: "#b8d9f0" }}>
                <UserCheck size={12} /> {newUsersCount} new user{newUsersCount > 1 ? "s" : ""}
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 md:pb-6">
          {syncing && state.lastSyncedAt === null && (
            <div className="space-y-3 animate-pulse">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[1,2,3,4].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}
              </div>
              <div className="h-10 bg-gray-100 rounded-xl w-2/3" />
              <div className="h-48 bg-gray-100 rounded-xl" />
            </div>
          )}
          {!(syncing && state.lastSyncedAt === null) && (
            <AnimatePresence mode="wait">
              <motion.div key={section}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}>
                {sectionContent[section]}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-30 md:hidden border-t border-white/10 flex items-stretch"
        style={{ backgroundColor: "#0f1e2e", paddingBottom: "env(safe-area-inset-bottom)" }}>
        {BOTTOM_NAV.map((key) => {
          const { label, Icon } = NAV.find((n) => n.key === key);
          const badge    = getBadge(key);
          const isActive = section === key;
          return (
            <button key={key} onClick={() => setSection(key)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition relative"
              style={{ color: isActive ? "#2385cd" : "rgba(255,255,255,0.4)" }}>
              <div className="relative">
                <Icon size={18} />
                {badge > 0 && (
                  <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 rounded-full bg-[#2385cd] text-white text-[8px] font-bold flex items-center justify-center">
                    {badge}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-medium leading-none">{label.split(" ")[0]}</span>
              {isActive && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-[#2385cd]" />}
            </button>
          );
        })}
        <button onClick={() => setSidebarOpen(true)}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition"
          style={{ color: "rgba(255,255,255,0.4)" }}>
          <MoreHorizontal size={18} />
          <span className="text-[9px] font-medium leading-none">More</span>
        </button>
      </nav>
    </div>
  );
}

export default AdminPanel;