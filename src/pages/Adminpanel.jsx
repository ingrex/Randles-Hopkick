// src/pages/AdminPanel.jsx
// ─── Sections ─────────────────────────────────────────────────────────────────
// 1. Requests   — approve/reject, set start+end dates, assign staff
// 2. Staff      — registry with contact details, add/edit/remove
// 3. Blog       — create/edit/delete posts, toggle draft↔published
// 4. Testimonials — add/edit/delete/show/hide
// 5. Messages   — contact form + staff request form submissions, reply
// 6. Profiles   — view & edit client/staff profiles
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "../store";

// ── tiny helpers ─────────────────────────────────────────────────────────────
function Pill({ label, color = "gray" }) {
  const map = {
    gray:    "bg-gray-100    text-gray-700",
    yellow:  "bg-yellow-50   text-yellow-700",
    green:   "bg-green-50    text-green-700",
    blue:    "bg-blue-50     text-blue-700",
    red:     "bg-red-50      text-red-700",
    sky:     "bg-sky-50      text-sky-700",
    purple:  "bg-purple-50   text-purple-700",
  };
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${map[color] ?? map.gray}`}>
      {label}
    </span>
  );
}

function statusColor(s) {
  return { Pending: "yellow", Approved: "green", Active: "blue", Rejected: "red", Completed: "gray" }[s] ?? "gray";
}

function Avatar({ name, size = "sm" }) {
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const sz = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  return (
    <div className={`${sz} rounded-full bg-sky-100 text-sky-700 font-semibold flex items-center justify-center flex-shrink-0`}>
      {initials}
    </div>
  );
}

// ── Modal shell ───────────────────────────────────────────────────────────────
function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition text-lg leading-none">✕</button>
          </div>
          <div className="px-5 py-4 space-y-3">{children}</div>
          {footer && <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">{footer}</div>}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Btn({ children, onClick, variant = "default", disabled = false, className = "" }) {
  const base = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-40 cursor-pointer";
  const variants = {
    default:  "bg-gray-100 text-gray-700 hover:bg-gray-200",
    primary:  "bg-sky-500  text-white    hover:bg-sky-600",
    success:  "bg-green-500 text-white   hover:bg-green-600",
    danger:   "bg-red-500  text-white    hover:bg-red-600",
    ghost:    "bg-transparent text-gray-500 hover:bg-gray-100",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

function FormField({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-sky-400 focus:bg-white transition w-full";

// ── NAV items ─────────────────────────────────────────────────────────────────
const NAV = [
  { key: "requests",     label: "Requests",     icon: "📋" },
  { key: "staff",        label: "Staff",        icon: "👥" },
  { key: "blog",         label: "Blog",         icon: "📰" },
  { key: "testimonials", label: "Testimonials", icon: "💬" },
  { key: "messages",     label: "Messages",     icon: "✉️"  },
  { key: "profiles",     label: "Profiles",     icon: "🪪"  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: Requests
// ─────────────────────────────────────────────────────────────────────────────
function RequestsSection({ state, dispatch }) {
  const [filter,    setFilter]    = useState("All");
  const [modal,     setModal]     = useState(null);   // null | "detail" | "dates" | "assign"
  const [activeReq, setActiveReq] = useState(null);
  const [dates,     setDates]     = useState({ startDate: "", endDate: "" });
  const [selected,  setSelected]  = useState({});     // { staffId: name }

  const shown = filter === "All" ? state.requests : state.requests.filter((r) => r.status === filter);

  const open = (type, req) => {
    setActiveReq(req);
    if (type === "dates")  setDates({ startDate: req.startDate || "", endDate: req.endDate || "" });
    if (type === "assign") {
      const s = {};
      req.assignedStaff?.forEach((x) => { s[x.id] = x.name; });
      setSelected(s);
    }
    setModal(type);
  };
  const close = () => { setModal(null); setActiveReq(null); };

  const saveDates = () => {
    dispatch({ type: "SET_DATES", id: activeReq.id, ...dates });
    close();
  };

  const saveAssign = () => {
    dispatch({
      type: "ASSIGN_STAFF",
      reqId: activeReq.id,
      assignedStaff: Object.entries(selected).map(([id, name]) => ({ id: Number(id), name })),
    });
    close();
  };

  const toggleStaff = (s) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[s.id]) delete next[s.id]; else next[s.id] = s.name;
      return next;
    });
  };

  const stats = {
    total:    state.requests.length,
    pending:  state.requests.filter((r) => r.status === "Pending").length,
    approved: state.requests.filter((r) => r.status === "Approved").length,
    active:   state.requests.filter((r) => r.status === "Active").length,
  };

  return (
    <div>
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total",    value: stats.total,    color: "text-gray-900"   },
          { label: "Pending",  value: stats.pending,  color: "text-yellow-600" },
          { label: "Approved", value: stats.approved, color: "text-green-600"  },
          { label: "Active",   value: stats.active,   color: "text-blue-600"   },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {["All","Pending","Approved","Active","Rejected"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
              filter === f ? "bg-sky-500 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >{f}</button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {shown.length === 0 ? (
          <p className="text-gray-400 text-sm p-6">No requests match this filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Client</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Roles</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Dates</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Assigned</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{r.clientName}</p>
                      <p className="text-xs text-gray-400">{r.clientType} · {r.phone}</p>
                      <p className="text-xs text-gray-400">{r.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {r.roles.map((x, i) => (
                          <span key={i} className="text-xs bg-sky-50 text-sky-700 border border-sky-100 rounded-full px-2 py-0.5">
                            {x.role} ×{x.quantity}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3"><Pill label={r.status} color={statusColor(r.status)} /></td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {r.startDate ? <><div>▶ {r.startDate}</div><div>⏹ {r.endDate}</div></> : <span className="text-gray-300">Not set</span>}
                    </td>
                    <td className="px-4 py-3">
                      {r.assignedStaff?.length
                        ? <div className="flex flex-wrap gap-1">{r.assignedStaff.map((s) => <span key={s.id} className="text-xs bg-green-50 text-green-700 rounded-full px-2 py-0.5 border border-green-100">{s.name}</span>)}</div>
                        : <span className="text-xs text-gray-300">Unassigned</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {r.status === "Pending" && <>
                          <Btn variant="success" onClick={() => dispatch({ type: "APPROVE_REQUEST", id: r.id })}>✓ Approve</Btn>
                          <Btn variant="danger"  onClick={() => dispatch({ type: "REJECT_REQUEST",  id: r.id })}>✕ Reject</Btn>
                        </>}
                        {(r.status === "Approved" || r.status === "Active") && <>
                          <Btn variant="primary"  onClick={() => open("assign", r)}>+ Assign</Btn>
                          <Btn variant="default"  onClick={() => open("dates",  r)}>📅 Dates</Btn>
                        </>}
                        <Btn variant="ghost" onClick={() => open("detail", r)}>👁</Btn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail modal */}
      <Modal open={modal === "detail"} title={`Request — ${activeReq?.clientName}`} onClose={close}
        footer={<Btn onClick={close}>Close</Btn>}>
        {activeReq && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Name",     activeReq.clientName],
                ["Type",     activeReq.clientType],
                ["Email",    activeReq.email],
                ["Phone",    activeReq.phone],
                ["Location", activeReq.location],
                ["Status",   activeReq.status],
              ].map(([l, v]) => (
                <div key={l}><p className="text-xs text-gray-400">{l}</p><p className="font-medium">{v}</p></div>
              ))}
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Roles requested</p>
              <div className="flex flex-wrap gap-1">
                {activeReq.roles.map((x, i) => (
                  <span key={i} className="text-xs bg-sky-50 text-sky-700 border border-sky-100 rounded-full px-2 py-0.5">{x.role} ×{x.quantity}</span>
                ))}
              </div>
            </div>
            {activeReq.assignedStaff?.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Assigned staff</p>
                <div className="flex flex-wrap gap-1">
                  {activeReq.assignedStaff.map((s) => (
                    <span key={s.id} className="text-xs bg-green-50 text-green-700 rounded-full px-2 py-0.5 border border-green-100">{s.name}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Dates modal */}
      <Modal open={modal === "dates"} title={`Set dates — ${activeReq?.clientName}`} onClose={close}
        footer={<><Btn onClick={close}>Cancel</Btn><Btn variant="primary" onClick={saveDates}>💾 Save & activate</Btn></>}>
        <p className="text-xs text-gray-400">Setting both dates will flip the request status to Active and update the client dashboard.</p>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <FormField label="Start date">
            <input type="date" className={inputCls} value={dates.startDate} onChange={(e) => setDates((p) => ({ ...p, startDate: e.target.value }))} />
          </FormField>
          <FormField label="End date">
            <input type="date" className={inputCls} value={dates.endDate}   onChange={(e) => setDates((p) => ({ ...p, endDate:   e.target.value }))} />
          </FormField>
        </div>
      </Modal>

      {/* Assign modal */}
      <Modal open={modal === "assign"} title={`Assign staff — ${activeReq?.clientName}`} onClose={close}
        footer={<><Btn onClick={close}>Cancel</Btn><Btn variant="primary" onClick={saveAssign}>Save assignment</Btn></>}>
        {activeReq && (
          <>
            <p className="text-xs text-gray-500 mb-1">
              Roles needed: {activeReq.roles.map((x) => `${x.role} ×${x.quantity}`).join(", ")}
            </p>
            <p className="text-xs text-gray-400 mb-3">
              Contact details are shown so you can confirm availability before saving.
            </p>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {state.staff.map((s) => {
                const isSel = !!selected[s.id];
                return (
                  <div
                    key={s.id}
                    onClick={() => toggleStaff(s)}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                      isSel ? "border-sky-400 bg-sky-50" : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <Avatar name={s.name} />
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm ${isSel ? "text-sky-700" : "text-gray-900"}`}>{s.name}</p>
                      <p className="text-xs text-gray-400">{s.role} · {s.phone} · {s.email}</p>
                    </div>
                    <Pill label={s.status} color={s.status === "Available" ? "green" : "blue"} />
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: Staff Registry
// ─────────────────────────────────────────────────────────────────────────────
function StaffSection({ state, dispatch }) {
  const [modal,    setModal]    = useState(null);   // null | "edit" | "add"
  const [editing,  setEditing]  = useState(null);
  const [form,     setForm]     = useState({});
  const [search,   setSearch]   = useState("");

  const shown = search
    ? state.staff.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.role.toLowerCase().includes(search.toLowerCase()))
    : state.staff;

  const openEdit = (s) => { setEditing(s); setForm({ ...s }); setModal("edit"); };
  const openAdd  = ()  => { setEditing(null); setForm({ name: "", role: "", phone: "", email: "" }); setModal("add"); };
  const close    = ()  => setModal(null);

  const save = () => {
    if (editing) dispatch({ type: "UPDATE_STAFF", payload: { ...editing, ...form } });
    else         dispatch({ type: "ADD_STAFF",    payload: form });
    close();
  };

  const handle = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <input className={inputCls + " max-w-xs"} placeholder="Search name or role…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Btn variant="primary" onClick={openAdd}>+ Add staff</Btn>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Name","Role","Phone","Email","Status","Current job",""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((s) => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={s.name} />
                      <span className="font-medium text-gray-900">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.role}</td>
                  <td className="px-4 py-3 text-gray-600">{s.phone}</td>
                  <td className="px-4 py-3 text-gray-600">{s.email}</td>
                  <td className="px-4 py-3"><Pill label={s.status} color={s.status === "Available" ? "green" : "blue"} /></td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {s.currentJobId
                      ? state.requests.find((r) => r.id === s.currentJobId)?.clientName ?? "—"
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Btn variant="ghost" onClick={() => openEdit(s)}>✏️</Btn>
                      <Btn variant="danger" onClick={() => dispatch({ type: "REMOVE_STAFF", id: s.id })}>🗑</Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!modal} title={editing ? `Edit — ${editing.name}` : "Add new staff"} onClose={close}
        footer={<><Btn onClick={close}>Cancel</Btn><Btn variant="primary" onClick={save}>Save</Btn></>}>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Full name"><input name="name"  className={inputCls} value={form.name  || ""} onChange={handle} /></FormField>
          <FormField label="Role">     <input name="role"  className={inputCls} value={form.role  || ""} onChange={handle} /></FormField>
          <FormField label="Phone">    <input name="phone" className={inputCls} value={form.phone || ""} onChange={handle} /></FormField>
          <FormField label="Email">    <input name="email" className={inputCls} value={form.email || ""} onChange={handle} /></FormField>
          {editing && (
            <FormField label="Status">
              <select name="status" className={inputCls} value={form.status || "Available"} onChange={handle}>
                <option>Available</option>
                <option>Active</option>
              </select>
            </FormField>
          )}
        </div>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: Blog
// ─────────────────────────────────────────────────────────────────────────────
function BlogSection({ state, dispatch }) {
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState({ title: "", excerpt: "", date: "", status: "Draft" });

  const openEdit = (p) => { setEditing(p); setForm({ ...p }); setModal(true); };
  const openNew  = ()  => { setEditing(null); setForm({ title: "", excerpt: "", date: new Date().toISOString().slice(0,10), status: "Draft" }); setModal(true); };
  const close    = ()  => setModal(false);
  const handle   = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const save = () => {
    if (editing) dispatch({ type: "UPDATE_BLOG", payload: { ...editing, ...form } });
    else         dispatch({ type: "ADD_BLOG",    payload: form });
    close();
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Btn variant="primary" onClick={openNew}>+ New post</Btn>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {state.blog.map((p) => (
          <div key={p.id} className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-gray-900 text-sm leading-snug">{p.title}</p>
              <Pill label={p.status} color={p.status === "Published" ? "green" : "yellow"} />
            </div>
            <p className="text-xs text-gray-400">{p.date} · by Admin</p>
            <p className="text-xs text-gray-500 line-clamp-2">{p.excerpt}</p>
            <div className="flex gap-2 pt-1">
              <Btn variant="ghost" onClick={() => openEdit(p)}>✏️ Edit</Btn>
              <Btn variant="ghost" onClick={() => dispatch({ type: "UPDATE_BLOG", payload: { ...p, status: p.status === "Published" ? "Draft" : "Published" } })}>
                {p.status === "Published" ? "Unpublish" : "Publish"}
              </Btn>
              <Btn variant="danger" onClick={() => dispatch({ type: "DELETE_BLOG", id: p.id })}>🗑</Btn>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modal} title={editing ? "Edit post" : "New post"} onClose={close}
        footer={<><Btn onClick={close}>Cancel</Btn><Btn variant="primary" onClick={save}>Save</Btn></>}>
        <FormField label="Title">
          <input name="title" className={inputCls} value={form.title} onChange={handle} />
        </FormField>
        <FormField label="Excerpt / body">
          <textarea name="excerpt" className={inputCls + " resize-none"} rows={4} value={form.excerpt} onChange={handle} />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Date">
            <input type="date" name="date" className={inputCls} value={form.date} onChange={handle} />
          </FormField>
          <FormField label="Status">
            <select name="status" className={inputCls} value={form.status} onChange={handle}>
              <option>Draft</option>
              <option>Published</option>
            </select>
          </FormField>
        </div>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: Testimonials
// ─────────────────────────────────────────────────────────────────────────────
function TestimonialsSection({ state, dispatch }) {
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState({ name: "", role: "", text: "", rating: 5, visible: true });

  const openEdit = (t) => { setEditing(t); setForm({ ...t }); setModal(true); };
  const openNew  = ()  => { setEditing(null); setForm({ name: "", role: "", text: "", rating: 5, visible: true }); setModal(true); };
  const close    = ()  => setModal(false);
  const handle   = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const save = () => {
    if (editing) dispatch({ type: "UPDATE_TESTI", payload: { ...editing, ...form, rating: Number(form.rating) } });
    else         dispatch({ type: "ADD_TESTI",    payload: { ...form, rating: Number(form.rating) } });
    close();
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Btn variant="primary" onClick={openNew}>+ Add testimonial</Btn>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
        {state.testimonials.map((t) => (
          <div key={t.id} className="flex gap-3 p-4">
            <Avatar name={t.name} size="md" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-0.5">
                <p className="font-medium text-sm text-gray-900">{t.name}</p>
                <Pill label={t.visible ? "Visible" : "Hidden"} color={t.visible ? "green" : "yellow"} />
              </div>
              <p className="text-xs text-gray-400 mb-1">{t.role}</p>
              <p className="text-yellow-400 text-xs mb-1">{"★".repeat(t.rating)}{"☆".repeat(5 - t.rating)}</p>
              <p className="text-sm text-gray-600 italic">"{t.text}"</p>
              <div className="flex gap-2 mt-2">
                <Btn variant="ghost" onClick={() => openEdit(t)}>✏️ Edit</Btn>
                <Btn variant="ghost" onClick={() => dispatch({ type: "UPDATE_TESTI", payload: { ...t, visible: !t.visible } })}>
                  {t.visible ? "Hide" : "Show"}
                </Btn>
                <Btn variant="danger" onClick={() => dispatch({ type: "DELETE_TESTI", id: t.id })}>🗑</Btn>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modal} title={editing ? "Edit testimonial" : "Add testimonial"} onClose={close}
        footer={<><Btn onClick={close}>Cancel</Btn><Btn variant="primary" onClick={save}>Save</Btn></>}>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Name">
            <input name="name" className={inputCls} value={form.name} onChange={handle} />
          </FormField>
          <FormField label="Role / company">
            <input name="role" className={inputCls} value={form.role} onChange={handle} />
          </FormField>
        </div>
        <FormField label="Testimonial text">
          <textarea name="text" className={inputCls + " resize-none"} rows={3} value={form.text} onChange={handle} />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Rating (1–5)">
            <input name="rating" type="number" min="1" max="5" className={inputCls} value={form.rating} onChange={handle} />
          </FormField>
          <FormField label="Visible on site">
            <div className="flex items-center gap-2 mt-1">
              <input type="checkbox" name="visible" checked={!!form.visible} onChange={handle} className="accent-sky-500 w-4 h-4" />
              <span className="text-sm text-gray-600">Show on website</span>
            </div>
          </FormField>
        </div>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: Messages
// ─────────────────────────────────────────────────────────────────────────────
function MessagesSection({ state, dispatch }) {
  const [filter, setFilter]   = useState("all");
  const [active, setActive]   = useState(null);
  const [reply,  setReply]    = useState("");

  const shown = filter === "all" ? state.messages : state.messages.filter((m) => m.type === filter);

  const openMsg = (m) => {
    dispatch({ type: "MARK_MSG_READ", id: m.id });
    setActive(m);
    setReply("");
  };

  const unread = state.messages.filter((m) => !m.read).length;

  return (
    <div className="flex gap-4 h-full">
      {/* List */}
      <div className="flex-1 min-w-0">
        <div className="flex gap-2 mb-3 flex-wrap">
          {[["all","All"],["contact","Contact"],["staff","Staff requests"]].map(([k,l]) => (
            <button key={k} onClick={() => setFilter(k)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                filter === k ? "bg-sky-500 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}>{l}</button>
          ))}
          {unread > 0 && <span className="ml-auto text-xs text-red-500 font-medium self-center">{unread} unread</span>}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
          {shown.map((m) => (
            <div key={m.id} onClick={() => openMsg(m)}
              className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-gray-50 transition ${active?.id === m.id ? "bg-sky-50/60" : ""}`}>
              <Avatar name={m.from} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <p className={`text-sm truncate ${!m.read ? "font-semibold text-gray-900" : "text-gray-700"}`}>{m.subject}</p>
                  <span className="text-xs text-gray-400 flex-shrink-0">{m.time}</span>
                </div>
                <p className="text-xs text-gray-400 truncate"><strong>{m.from}</strong> — {m.body}</p>
              </div>
              {!m.read && <span className="w-2 h-2 rounded-full bg-sky-500 flex-shrink-0 mt-1.5" />}
            </div>
          ))}
          {shown.length === 0 && <p className="text-gray-400 text-sm p-4">No messages.</p>}
        </div>
      </div>

      {/* Detail pane */}
      {active && (
        <div className="w-80 flex-shrink-0 bg-white rounded-xl border border-gray-100 p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Avatar name={active.from} size="md" />
            <div>
              <p className="font-medium text-sm">{active.from}</p>
              <p className="text-xs text-gray-400">{active.time}</p>
            </div>
          </div>
          <p className="font-medium text-sm text-gray-900">{active.subject}</p>
          <p className="text-sm text-gray-600 leading-relaxed">{active.body}</p>
          <textarea
            className={inputCls + " resize-none mt-auto"}
            rows={4}
            placeholder="Type a reply…"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
          />
          <Btn variant="primary" className="w-full justify-center" onClick={() => { setReply(""); }}>
            ✉️ Send reply
          </Btn>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: Profiles
// ─────────────────────────────────────────────────────────────────────────────
function ProfilesSection({ state }) {
  // Derive unique clients from requests
  const seen = new Set();
  const clients = state.requests
    .filter((r) => { if (seen.has(r.email)) return false; seen.add(r.email); return true; })
    .map((r) => ({
      name:      r.clientName,
      email:     r.email,
      phone:     r.phone,
      type:      r.clientType,
      location:  r.location,
      requests:  state.requests.filter((x) => x.email === r.email).length,
    }));

  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState(null);

  return (
    <div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Name","Email","Phone","Type","Location","Requests",""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-6 text-gray-400 text-sm">No profiles yet. Profiles appear once a request is submitted.</td></tr>
              )}
              {clients.map((c, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={c.name} />
                      <span className="font-medium text-gray-900">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{c.email}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{c.phone}</td>
                  <td className="px-4 py-3"><Pill label={c.type} color="sky" /></td>
                  <td className="px-4 py-3 text-xs text-gray-500">{c.location}</td>
                  <td className="px-4 py-3 text-center font-medium text-sky-600">{c.requests}</td>
                  <td className="px-4 py-3">
                    <Btn variant="ghost" onClick={() => { setEditing(c); setModal(true); }}>✏️ Edit</Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal} title={`Edit profile — ${editing?.name}`} onClose={() => setModal(false)}
        footer={<Btn onClick={() => setModal(false)}>Close</Btn>}>
        {editing && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[["Name",editing.name],["Email",editing.email],["Phone",editing.phone],["Location",editing.location]].map(([l,v]) => (
              <FormField key={l} label={l}><input className={inputCls} defaultValue={v} /></FormField>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT: AdminPanel
// ─────────────────────────────────────────────────────────────────────────────
export function AdminPanel() {
  const { state, dispatch } = useStore();
  const [section, setSection] = useState("requests");

  const pendingCount = state.requests.filter((r) => r.status === "Pending").length;
  const unreadCount  = state.messages.filter((m) => !m.read).length;

  const sectionContent = {
    requests:     <RequestsSection     state={state} dispatch={dispatch} />,
    staff:        <StaffSection        state={state} dispatch={dispatch} />,
    blog:         <BlogSection         state={state} dispatch={dispatch} />,
    testimonials: <TestimonialsSection state={state} dispatch={dispatch} />,
    messages:     <MessagesSection     state={state} dispatch={dispatch} />,
    profiles:     <ProfilesSection     state={state} />,
  };

  const titles = {
    requests: "Requests", staff: "Staff Registry", blog: "Blog Manager",
    testimonials: "Testimonials", messages: "Messages", profiles: "Profiles",
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className="w-56 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col">
        <div className="px-5 py-5 border-b border-gray-100">
          <p className="font-bold text-gray-900 text-base">StaffLink</p>
          <p className="text-xs text-gray-400 font-medium">Admin Panel</p>
        </div>

        <nav className="flex-1 py-3">
          {NAV.map(({ key, label, icon }) => {
            const badge = key === "requests" ? pendingCount : key === "messages" ? unreadCount : 0;
            return (
              <button
                key={key}
                onClick={() => setSection(key)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition text-left ${
                  section === key
                    ? "bg-sky-50 text-sky-700 font-medium border-r-2 border-sky-500"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span className="text-base">{icon}</span>
                <span className="flex-1">{label}</span>
                {badge > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-semibold">SA</div>
            <div>
              <p className="text-xs font-medium text-gray-800">Super Admin</p>
              <p className="text-xs text-gray-400">admin@stafflink.ng</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="font-semibold text-gray-900">{titles[section]}</h1>
            <p className="text-xs text-gray-400">{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
          <div className="flex items-center gap-3">
            {pendingCount > 0 && (
              <button onClick={() => setSection("requests")} className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-full px-3 py-1 font-medium">
                {pendingCount} pending request{pendingCount > 1 ? "s" : ""}
              </button>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={section}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {sectionContent[section]}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default AdminPanel;