// src/pages/AdminPanel.jsx  — MOBILE-RESPONSIVE EDITION
// ─── Sections ─────────────────────────────────────────────────────────────────
// 1. Requests      — approve/reject, set dates (auto-flips to Active), assign staff, complete
//                    → Assign modal has PRIMARY SKILL / OTHER SKILLS filter toggle
//                    → Complete is only possible once the job end-date has passed
// 2. Staff         — registry: primarySkill, otherSkills (tag input), contact details, ratings
// 3. Registered    — every user who signed up (synced via marketplace API)
// 4. Blog          — create/edit/delete/publish posts
// 5. Testimonials  — add/edit/delete/show/hide, synced to backend API
// 6. Messages      — contact + staff-request submissions, mark read, threaded replies
// 7. Profiles      — clients derived from submitted requests
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "../store";
import {
  apiFetchTestimonials,
  apiCreateTestimonial,
  apiUpdateTestimonial,
  apiDeleteTestimonial,
  apiApproveRequest,
  apiRejectRequest,
  apiCompleteRequest,
  apiSetDates,
  apiAssignStaff as apiAssignStaffCall,
} from "../api/auth";
import {
  ClipboardList, Users, UserCheck, Newspaper, MessageSquare, Mail, BadgeCheck,
  Check, X, CheckCheck, Plus, Pencil, Trash2, Eye, CalendarDays, Save,
  UserPlus, Send, ArrowRightCircle, StopCircle, Star, AlertTriangle,
  ShieldAlert, Menu, ChevronLeft, MoreHorizontal,
} from "lucide-react";

// ── Brand tokens ──────────────────────────────────────────────────────────────
// Primary: #2385cd   Navy sidebar: #0f1e2e
// Light tint: #eaf4fc   Mid tint: #b8d9f0

// ── Tiny helpers ───────────────────────────────────────────────────────────────
function Pill({ label, color = "gray" }) {
  const map = {
    gray:   "bg-gray-100   text-gray-700",
    yellow: "bg-yellow-50  text-yellow-700",
    green:  "bg-green-50   text-green-700",
    blue:   "bg-[#eaf4fc]  text-[#1a6fa8]",
    red:    "bg-red-50     text-red-700",
    sky:    "bg-[#eaf4fc]  text-[#2385cd]",
    purple: "bg-purple-50  text-purple-700",
    brand:  "bg-[#2385cd]  text-white",
    orange: "bg-orange-50  text-orange-700",
  };
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${map[color] ?? map.gray}`}>
      {label}
    </span>
  );
}

function statusColor(s) {
  return { Pending:"yellow", Approved:"sky", Active:"blue", Rejected:"red", Completed:"gray", "Awaiting Review":"orange" }[s] ?? "gray";
}

function Avatar({ src, name, size = "sm" }) {
  const initials = (name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const sz = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  if (src) return <img src={src} alt={name} className={`${sz} rounded-full object-cover flex-shrink-0 border border-[#b8d9f0]`} />;
  return (
    <div className={`${sz} rounded-full bg-[#eaf4fc] text-[#2385cd] font-semibold flex items-center justify-center flex-shrink-0`}>
      {initials}
    </div>
  );
}

// Modal — full-screen on mobile, centered card on desktop
function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm sm:p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}>
        <motion.div
          initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
          className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-xl max-h-[92vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#eaf4fc] sticky top-0 bg-white z-10">
            <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-[#2385cd] transition p-1 -mr-1"><X size={18} /></button>
          </div>
          <div className="px-5 py-4 space-y-3">{children}</div>
          {footer && <div className="px-5 py-3 border-t border-[#eaf4fc] flex justify-end gap-2 flex-wrap sticky bottom-0 bg-white">{footer}</div>}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Btn({ children, onClick, variant = "default", disabled = false, className = "" }) {
  const base = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-40 cursor-pointer";
  const variants = {
    default: "bg-gray-100    text-gray-700  hover:bg-gray-200",
    primary: "bg-[#2385cd]   text-white     hover:bg-[#1a6fa8]",
    success: "bg-green-500   text-white     hover:bg-green-600",
    danger:  "bg-red-500     text-white     hover:bg-red-600",
    ghost:   "bg-transparent text-gray-500  hover:bg-[#eaf4fc] hover:text-[#2385cd]",
    brand:   "bg-[#eaf4fc]   text-[#2385cd] hover:bg-[#b8d9f0]",
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

const inputCls =
  "rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#2385cd] focus:ring-2 focus:ring-[#2385cd]/20 focus:bg-white transition w-full";

function StarRating({ rating, max = 5 }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <Star key={i} size={12} className={i < Math.round(rating) ? "text-[#2385cd] fill-[#2385cd]" : "text-gray-200 fill-gray-200"} />
      ))}
    </span>
  );
}

function SkillTagInput({ value = [], onChange }) {
  const [input, setInput] = useState("");
  const add = () => {
    const trimmed = input.trim();
    if (!trimmed || value.includes(trimmed)) { setInput(""); return; }
    onChange([...value, trimmed]);
    setInput("");
  };
  const remove = (skill) => onChange(value.filter((s) => s !== skill));
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input className={inputCls} placeholder="Type a skill and press Add…" value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} />
        <button type="button" onClick={add}
          className="px-3 py-2 rounded-lg bg-[#eaf4fc] text-[#2385cd] text-xs font-medium hover:bg-[#b8d9f0] transition flex-shrink-0">
          Add
        </button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((sk) => (
            <span key={sk} className="flex items-center gap-1 text-xs bg-[#eaf4fc] text-[#1a6fa8] border border-[#b8d9f0] rounded-full px-2.5 py-0.5">
              {sk}
              <button type="button" onClick={() => remove(sk)} className="text-[#2385cd] hover:text-red-500 transition leading-none">×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Nav ────────────────────────────────────────────────────────────────────────
const NAV = [
  { key: "requests",     label: "Requests",       Icon: ClipboardList },
  { key: "staff",        label: "Staff",           Icon: Users         },
  { key: "registered",   label: "Registered",      Icon: UserCheck     },
  { key: "blog",         label: "Blog",            Icon: Newspaper     },
  { key: "testimonials", label: "Testimonials",    Icon: MessageSquare },
  { key: "messages",     label: "Messages",        Icon: Mail          },
  { key: "profiles",     label: "Client Profiles", Icon: BadgeCheck    },
];

// ── Mobile nav bottom bar items (most used 5, rest in drawer) ─────────────────
const BOTTOM_NAV = ["requests", "staff", "messages", "profiles", "registered"];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: Requests
// ─────────────────────────────────────────────────────────────────────────────
function RequestsSection({ state, dispatch }) {
  const [filter,      setFilter]      = useState("All");
  const [modal,       setModal]       = useState(null);
  const [activeReq,   setActiveReq]   = useState(null);
  const [dates,       setDates]       = useState({ startDate: "", endDate: "" });
  const [selected,    setSelected]    = useState({});
  const [skillFilter, setSkillFilter] = useState("primary");

  const shown = filter === "All" ? state.requests : state.requests.filter((r) => r.status === filter);

  const open = (type, req) => {
    setActiveReq(req);
    if (type === "dates")  setDates({ startDate: req.startDate || "", endDate: req.endDate || "" });
    if (type === "assign") {
      const s = {};
      req.assignedStaff?.forEach((x) => { s[x.id] = x.name; });
      setSelected(s);
      setSkillFilter("primary");
    }
    setModal(type);
  };
  const close = () => { setModal(null); setActiveReq(null); };

  const saveDates = async () => {
    dispatch({ type: "SET_DATES", id: activeReq.id, ...dates });
    try { await apiSetDates(activeReq.backendId ?? activeReq.id, dates); } catch { /* local-only */ }
    close();
  };

  const saveAssign = async () => {
    const staffList = Object.entries(selected).map(([id, name]) => ({ id: Number(id), name }));
    dispatch({ type: "ASSIGN_STAFF", reqId: activeReq.id, assignedStaff: staffList });
    try { await apiAssignStaffCall(activeReq.backendId ?? activeReq.id, staffList); } catch { /* local-only */ }
    close();
  };

  const toggleStaff = (s) =>
    setSelected((prev) => { const n = { ...prev }; if (n[s.id]) delete n[s.id]; else n[s.id] = s.name; return n; });

  const handleApprove = async (r) => {
    dispatch({ type: "APPROVE_REQUEST", id: r.id });
    try { await apiApproveRequest(r.backendId ?? r.id); } catch { /* local-only */ }
  };
  const handleReject = async (r) => {
    dispatch({ type: "REJECT_REQUEST", id: r.id });
    try { await apiRejectRequest(r.backendId ?? r.id); } catch { /* local-only */ }
  };
  const handleComplete = async (r) => {
    dispatch({ type: "COMPLETE_REQUEST", id: r.id });
    try { await apiCompleteRequest(r.backendId ?? r.id); } catch { /* local-only */ }
  };

  const stats = {
    total:    state.requests.length,
    pending:  state.requests.filter((r) => r.status === "Pending").length,
    approved: state.requests.filter((r) => r.status === "Approved").length,
    active:   state.requests.filter((r) => r.status === "Active").length,
  };

  const roleKeywords = activeReq?.roles?.map((x) => x.role.toLowerCase()) ?? [];
  const filteredStaff = state.staff.filter((s) => {
    if (skillFilter === "primary") return roleKeywords.some((kw) => s.role.toLowerCase().includes(kw));
    return roleKeywords.some((kw) => (s.otherSkills || []).some((sk) => sk.toLowerCase().includes(kw)));
  });
  const staffToShow = filteredStaff.length > 0 ? filteredStaff : state.staff;

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total",    value: stats.total,    color: "text-gray-900",   bg: "bg-white"      },
          { label: "Pending",  value: stats.pending,  color: "text-yellow-600", bg: "bg-yellow-50"  },
          { label: "Approved", value: stats.approved, color: "text-[#2385cd]",  bg: "bg-[#eaf4fc]"  },
          { label: "Active",   value: stats.active,   color: "text-[#1a6fa8]",  bg: "bg-[#eaf4fc]"  },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-[#b8d9f0]/40`}>
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters — horizontally scrollable on mobile */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
        {["All","Pending","Approved","Active","Completed","Rejected"].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition flex-shrink-0 ${
              filter === f
                ? "bg-[#2385cd] text-white shadow-sm"
                : "bg-white text-gray-600 border border-gray-200 hover:border-[#2385cd] hover:text-[#2385cd]"
            }`}>{f}</button>
        ))}
      </div>

      {shown.length === 0 && (
        <p className="text-gray-400 text-sm p-6 text-center bg-white rounded-xl border border-gray-100">
          No requests match this filter.
        </p>
      )}

      {/* ── MOBILE: Card list ── */}
      <div className="block md:hidden space-y-3">
        {shown.map((r) => {
          const displayStatus = r.status === "Completed" && !r.reviewed ? "Awaiting Review" : r.status;
          return (
            <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{r.clientName}</p>
                  <p className="text-xs text-gray-400">{r.clientType} · {r.phone}</p>
                  <p className="text-xs text-gray-400">{r.email}</p>
                </div>
                <Pill label={displayStatus} color={statusColor(displayStatus)} />
              </div>
              <div className="flex flex-wrap gap-1">
                {r.roles.map((x, i) => (
                  <span key={i} className="text-xs bg-[#eaf4fc] text-[#2385cd] border border-[#b8d9f0] rounded-full px-2 py-0.5">
                    {x.role} ×{x.quantity}
                  </span>
                ))}
              </div>
              {r.startDate && (
                <div className="text-xs text-gray-500 flex flex-col gap-0.5">
                  <div className="flex items-center gap-1"><ArrowRightCircle size={11} className="text-green-500" />{r.startDate}</div>
                  <div className="flex items-center gap-1"><StopCircle size={11} className="text-red-400" />{r.endDate}</div>
                </div>
              )}
              {r.assignedStaff?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {r.assignedStaff.map((s) => (
                    <span key={s.id} className="text-xs bg-green-50 text-green-700 rounded-full px-2 py-0.5 border border-green-100">{s.name}</span>
                  ))}
                </div>
              )}
              {/* Actions */}
              <div className="flex flex-wrap gap-1.5 pt-1 border-t border-gray-50">
                {r.status === "Pending" && <>
                  <Btn variant="success" onClick={() => handleApprove(r)}><Check size={12} /> Approve</Btn>
                  <Btn variant="danger"  onClick={() => handleReject(r)}><X size={12} /> Reject</Btn>
                </>}
                {r.status === "Active" && (
                  <Btn variant="primary" onClick={() => handleComplete(r)}><CheckCheck size={12} /> Complete</Btn>
                )}
                {(r.status === "Approved" || r.status === "Active") && <>
                  <Btn variant="primary" onClick={() => open("assign", r)}><UserPlus size={12} /> Assign</Btn>
                  <Btn variant="brand"   onClick={() => open("dates",  r)}><CalendarDays size={12} /> Dates</Btn>
                </>}
                <Btn variant="ghost" onClick={() => open("detail", r)}><Eye size={12} /> View</Btn>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── DESKTOP: Table ── */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#eaf4fc]/60 border-b border-[#b8d9f0]/50">
                {["Client","Roles","Status","Dates","Assigned","Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[#1a6fa8]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => {
                const displayStatus = r.status === "Completed" && !r.reviewed ? "Awaiting Review" : r.status;
                return (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-[#eaf4fc]/30 transition">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{r.clientName}</p>
                      <p className="text-xs text-gray-400">{r.clientType} · {r.phone}</p>
                      <p className="text-xs text-gray-400">{r.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {r.roles.map((x, i) => (
                          <span key={i} className="text-xs bg-[#eaf4fc] text-[#2385cd] border border-[#b8d9f0] rounded-full px-2 py-0.5">
                            {x.role} ×{x.quantity}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3"><Pill label={displayStatus} color={statusColor(displayStatus)} /></td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {r.startDate ? (
                        <>
                          <div className="flex items-center gap-1"><ArrowRightCircle size={11} className="text-green-500 flex-shrink-0" />{r.startDate}</div>
                          <div className="flex items-center gap-1 mt-0.5"><StopCircle size={11} className="text-red-400 flex-shrink-0" />{r.endDate}</div>
                        </>
                      ) : <span className="text-gray-300">Not set</span>}
                    </td>
                    <td className="px-4 py-3">
                      {r.assignedStaff?.length
                        ? <div className="flex flex-wrap gap-1">{r.assignedStaff.map((s) => (
                            <span key={s.id} className="text-xs bg-green-50 text-green-700 rounded-full px-2 py-0.5 border border-green-100">{s.name}</span>
                          ))}</div>
                        : <span className="text-xs text-gray-300">Unassigned</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {r.status === "Pending" && <>
                          <Btn variant="success" onClick={() => handleApprove(r)}><Check size={12} /> Approve</Btn>
                          <Btn variant="danger"  onClick={() => handleReject(r)}><X size={12} /> Reject</Btn>
                        </>}
                        {r.status === "Active" && (
                          <Btn variant="primary" onClick={() => handleComplete(r)}><CheckCheck size={12} /> Complete</Btn>
                        )}
                        {(r.status === "Approved" || r.status === "Active") && <>
                          <Btn variant="primary" onClick={() => open("assign", r)}><UserPlus size={12} /> Assign</Btn>
                          <Btn variant="brand"   onClick={() => open("dates",  r)}><CalendarDays size={12} /> Dates</Btn>
                        </>}
                        <Btn variant="ghost" onClick={() => open("detail", r)}><Eye size={12} /></Btn>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail modal */}
      <Modal open={modal === "detail"} title={`Request — ${activeReq?.clientName}`} onClose={close}
        footer={<Btn onClick={close}>Close</Btn>}>
        {activeReq && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              {[["Name",activeReq.clientName],["Type",activeReq.clientType],["Email",activeReq.email],
                ["Phone",activeReq.phone],["Location",activeReq.location],["Status",activeReq.status]].map(([l,v]) => (
                <div key={l}><p className="text-xs text-gray-400">{l}</p><p className="font-medium break-all">{v}</p></div>
              ))}
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Roles requested</p>
              <div className="flex flex-wrap gap-1">
                {activeReq.roles.map((x,i) => (
                  <span key={i} className="text-xs bg-[#eaf4fc] text-[#2385cd] border border-[#b8d9f0] rounded-full px-2 py-0.5">{x.role} ×{x.quantity}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400">Submitted</p>
              <p className="font-medium">{new Date(activeReq.submittedAt).toLocaleString("en-GB")}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Dates modal */}
      <Modal open={modal === "dates"} title={`Set dates — ${activeReq?.clientName}`} onClose={close}
        footer={
          <>
            <Btn onClick={close}>Cancel</Btn>
            <Btn variant="primary" onClick={saveDates}><Save size={12} /> Save &amp; activate</Btn>
          </>
        }>
        <p className="text-xs text-gray-400">Setting both dates flips the request to <strong>Active</strong>.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          <FormField label="Start date">
            <input type="date" className={inputCls} value={dates.startDate}
              onChange={(e) => setDates((p) => ({ ...p, startDate: e.target.value }))} />
          </FormField>
          <FormField label="End date">
            <input type="date" className={inputCls} value={dates.endDate}
              onChange={(e) => setDates((p) => ({ ...p, endDate: e.target.value }))} />
          </FormField>
        </div>
      </Modal>

      {/* Assign modal */}
      <Modal open={modal === "assign"} title={`Assign staff — ${activeReq?.clientName}`} onClose={close}
        footer={
          <>
            <Btn onClick={close}>Cancel</Btn>
            <Btn variant="primary" onClick={saveAssign}><Save size={12} /> Save assignment</Btn>
          </>
        }>
        {activeReq && (
          <>
            <p className="text-xs text-gray-500 mb-2">
              Roles needed: {activeReq.roles.map((x) => `${x.role} ×${x.quantity}`).join(", ")}
            </p>
            <div className="flex gap-2 mb-3">
              <button onClick={() => setSkillFilter("primary")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition ${
                  skillFilter === "primary"
                    ? "bg-[#2385cd] text-white border-[#2385cd]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-[#2385cd] hover:text-[#2385cd]"
                }`}>🎯 Primary Skill</button>
              <button onClick={() => setSkillFilter("other")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition ${
                  skillFilter === "other"
                    ? "bg-[#2385cd] text-white border-[#2385cd]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-[#2385cd] hover:text-[#2385cd]"
                }`}>🔄 Alt. Skills</button>
            </div>
            {filteredStaff.length === 0 && (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-2">
                No exact skill match — showing all staff.
              </p>
            )}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {staffToShow.map((s) => {
                const isSel = !!selected[s.id];
                return (
                  <div key={s.id} onClick={() => toggleStaff(s)}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                      isSel ? "border-[#2385cd] bg-[#eaf4fc]" : "border-gray-100 hover:border-[#b8d9f0] hover:bg-gray-50"
                    }`}>
                    <Avatar name={s.name} />
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm ${isSel ? "text-[#2385cd]" : "text-gray-900"}`}>{s.name}</p>
                      <p className="text-xs text-gray-400">{s.role}</p>
                      {s.otherSkills?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {s.otherSkills.map((sk) => (
                            <span key={sk} className="text-[10px] bg-gray-100 text-gray-500 rounded-full px-1.5 py-0.5">{sk}</span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-1 mt-0.5">
                        <StarRating rating={s.averageRating} />
                        <span className="text-xs text-gray-400">{s.averageRating > 0 ? s.averageRating.toFixed(1) : "—"}</span>
                      </div>
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
  const [modal,   setModal]   = useState(null);
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState({});
  const [search,  setSearch]  = useState("");

  const shown = search
    ? state.staff.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.role.toLowerCase().includes(search.toLowerCase()) ||
        (s.otherSkills || []).some((sk) => sk.toLowerCase().includes(search.toLowerCase()))
      )
    : state.staff;

  const openEdit = (s) => { setEditing(s); setForm({ ...s, otherSkills: s.otherSkills ?? [] }); setModal("edit"); };
  const openAdd  = ()  => { setEditing(null); setForm({ name:"", role:"", phone:"", email:"", otherSkills:[] }); setModal("add"); };
  const close    = ()  => setModal(null);
  const handle   = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const save = () => {
    if (editing) dispatch({ type: "UPDATE_STAFF", payload: { ...editing, ...form } });
    else         dispatch({ type: "ADD_STAFF",    payload: form });
    close();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3">
        <input className={inputCls + " flex-1 max-w-xs"} placeholder="Search name, role, or skill…"
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <Btn variant="primary" onClick={openAdd}><Plus size={13} /> Add staff</Btn>
      </div>

      {/* ── MOBILE: Cards ── */}
      <div className="block md:hidden space-y-3">
        {shown.map((s) => (
          <div key={s.id} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-3 mb-3">
              <Avatar name={s.name} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                <p className="text-xs text-gray-500">{s.role}</p>
              </div>
              <Pill label={s.status} color={s.status === "Available" ? "green" : "blue"} />
            </div>
            {s.otherSkills?.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {s.otherSkills.map((sk) => (
                  <span key={sk} className="text-[10px] bg-[#eaf4fc] text-[#1a6fa8] border border-[#b8d9f0] rounded-full px-1.5 py-0.5">{sk}</span>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <StarRating rating={s.averageRating} />
                <span className="text-xs text-gray-400">{s.averageRating > 0 ? s.averageRating.toFixed(1) : "—"}</span>
              </div>
              <div className="flex gap-1">
                <Btn variant="ghost" onClick={() => openEdit(s)}><Pencil size={13} /></Btn>
                <Btn variant="danger" onClick={() => dispatch({ type: "REMOVE_STAFF", id: s.id })}><Trash2 size={13} /></Btn>
              </div>
            </div>
            <div className="text-xs text-gray-400 mt-2 flex gap-3">
              <span>{s.phone}</span>
              <span className="truncate">{s.email}</span>
            </div>
          </div>
        ))}
        {shown.length === 0 && <p className="text-gray-400 text-sm text-center p-6 bg-white rounded-xl border border-gray-100">No staff found.</p>}
      </div>

      {/* ── DESKTOP: Table ── */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#eaf4fc]/60 border-b border-[#b8d9f0]/50">
                {["Name","Primary Role","Other Skills","Phone","Email","Status","Rating",""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[#1a6fa8]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((s) => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-[#eaf4fc]/30 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={s.name} />
                      <span className="font-medium text-gray-900">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.role}</td>
                  <td className="px-4 py-3">
                    {s.otherSkills?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {s.otherSkills.map((sk) => (
                          <span key={sk} className="text-[10px] bg-[#eaf4fc] text-[#1a6fa8] border border-[#b8d9f0] rounded-full px-1.5 py-0.5">{sk}</span>
                        ))}
                      </div>
                    ) : <span className="text-xs text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.phone}</td>
                  <td className="px-4 py-3 text-gray-600">{s.email}</td>
                  <td className="px-4 py-3"><Pill label={s.status} color={s.status === "Available" ? "green" : "blue"} /></td>
                  <td className="px-4 py-3 text-xs">
                    <div className="flex items-center gap-1">
                      <StarRating rating={s.averageRating} />
                      <span className="text-gray-400 ml-1">{s.averageRating > 0 ? s.averageRating.toFixed(1) : "—"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Btn variant="ghost" onClick={() => openEdit(s)}><Pencil size={13} /></Btn>
                      <Btn variant="danger" onClick={() => dispatch({ type: "REMOVE_STAFF", id: s.id })}><Trash2 size={13} /></Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!modal} title={editing ? `Edit — ${editing.name}` : "Add new staff"} onClose={close}
        footer={<><Btn onClick={close}>Cancel</Btn><Btn variant="primary" onClick={save}><Save size={12} /> Save</Btn></>}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Full name">    <input name="name"  className={inputCls} value={form.name  || ""} onChange={handle} /></FormField>
          <FormField label="Primary role"> <input name="role"  className={inputCls} value={form.role  || ""} onChange={handle} /></FormField>
          <FormField label="Phone">        <input name="phone" className={inputCls} value={form.phone || ""} onChange={handle} /></FormField>
          <FormField label="Email">        <input name="email" className={inputCls} value={form.email || ""} onChange={handle} /></FormField>
          {editing && (
            <FormField label="Status">
              <select name="status" className={inputCls} value={form.status || "Available"} onChange={handle}>
                <option>Available</option>
                <option>Active</option>
              </select>
            </FormField>
          )}
        </div>
        <FormField label="Other / alternative skills">
          <SkillTagInput value={form.otherSkills || []} onChange={(tags) => setForm((p) => ({ ...p, otherSkills: tags }))} />
        </FormField>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: Registered Users
// ─────────────────────────────────────────────────────────────────────────────
function RegisteredSection({ state }) {
  const [search,  setSearch]  = useState("");
  const [modal,   setModal]   = useState(false);
  const [viewing, setViewing] = useState(null);

  const users = state.registeredUsers || [];
  const shown = search
    ? users.filter((u) =>
        `${u.surname} ${u.otherNames || ""}`.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  const reqCount = (email) => state.requests.filter((r) => r.email === email).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3">
        <input className={inputCls + " flex-1 max-w-xs"} placeholder="Search name or email…"
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <span className="text-xs text-gray-400 flex-shrink-0">{users.length} user{users.length !== 1 ? "s" : ""}</span>
      </div>

      {/* ── MOBILE: Cards ── */}
      <div className="block md:hidden space-y-3">
        {shown.length === 0 && (
          <p className="text-gray-400 text-sm text-center p-6 bg-white rounded-xl border border-gray-100">No registered users yet.</p>
        )}
        {shown.map((u) => {
          const fullName = `${u.surname} ${u.otherNames || ""}`.trim();
          return (
            <div key={u.id} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-3 mb-2">
                <Avatar src={u.photoUrl} name={fullName} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{fullName}</p>
                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                  <p className="text-xs text-gray-400">{u.phoneNumber || "—"}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-400">
                  {u.registeredAt
                    ? new Date(u.registeredAt).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" })
                    : "—"}
                  <span className="ml-2 font-medium text-[#2385cd]">{reqCount(u.email)} requests</span>
                </div>
                <Btn variant="ghost" onClick={() => { setViewing(u); setModal(true); }}>
                  <Eye size={13} /> View
                </Btn>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── DESKTOP: Table ── */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#eaf4fc]/60 border-b border-[#b8d9f0]/50">
                {["User","Email","Phone","Registered","Requests",""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[#1a6fa8]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-gray-400 text-sm text-center">No registered users yet.</td></tr>
              )}
              {shown.map((u) => {
                const fullName = `${u.surname} ${u.otherNames || ""}`.trim();
                return (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-[#eaf4fc]/30 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar src={u.photoUrl} name={fullName} />
                        <span className="font-medium text-gray-900">{fullName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{u.email}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{u.phoneNumber || "—"}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {u.registeredAt
                        ? new Date(u.registeredAt).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" })
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-medium text-[#2385cd]">{reqCount(u.email)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Btn variant="ghost" onClick={() => { setViewing(u); setModal(true); }}><Eye size={13} /> View</Btn>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modal}
        title={viewing ? `Profile — ${`${viewing.surname} ${viewing.otherNames || ""}`.trim()}` : ""}
        onClose={() => setModal(false)}
        footer={<Btn onClick={() => setModal(false)}>Close</Btn>}>
        {viewing && (() => {
          const fullName = `${viewing.surname} ${viewing.otherNames || ""}`.trim();
          const userReqs = state.requests.filter((r) => r.email === viewing.email);
          return (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar src={viewing.photoUrl} name={fullName} size="md" />
                <div>
                  <p className="font-semibold text-gray-900">{fullName}</p>
                  <p className="text-xs text-gray-400 break-all">{viewing.email}</p>
                  <p className="text-xs text-gray-400">{viewing.phoneNumber || "—"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400">Registered</p>
                  <p className="font-medium">{viewing.registeredAt ? new Date(viewing.registeredAt).toLocaleDateString("en-GB") : "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Total requests</p>
                  <p className="font-medium text-[#2385cd]">{userReqs.length}</p>
                </div>
              </div>
              {userReqs.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Submitted requests</p>
                  <div className="space-y-2">
                    {userReqs.map((r) => (
                      <div key={r.id} className="flex items-center justify-between p-2 bg-[#eaf4fc]/50 rounded-lg text-xs">
                        <div>
                          <p className="font-medium text-gray-800">{r.roles.map((x) => `${x.role} ×${x.quantity}`).join(", ")}</p>
                          <p className="text-gray-400">{new Date(r.submittedAt).toLocaleDateString("en-GB")}</p>
                        </div>
                        <Pill label={r.status} color={statusColor(r.status)} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
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
  const [form,    setForm]    = useState({ title:"", excerpt:"", date:"", status:"Draft" });

  const openEdit = (p) => { setEditing(p); setForm({ ...p }); setModal(true); };
  const openNew  = ()  => { setEditing(null); setForm({ title:"", excerpt:"", date: new Date().toISOString().slice(0,10), status:"Draft" }); setModal(true); };
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
        <Btn variant="primary" onClick={openNew}><Plus size={13} /> New post</Btn>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {state.blog.map((p) => (
          <div key={p.id} className="bg-white rounded-xl border border-gray-100 p-4 space-y-2 hover:border-[#b8d9f0] transition">
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-gray-900 text-sm leading-snug">{p.title}</p>
              <Pill label={p.status} color={p.status === "Published" ? "green" : "yellow"} />
            </div>
            <p className="text-xs text-[#2385cd]/70">{p.date}</p>
            <p className="text-xs text-gray-500 line-clamp-2">{p.excerpt}</p>
            <div className="flex gap-2 pt-1 flex-wrap">
              <Btn variant="ghost" onClick={() => openEdit(p)}><Pencil size={13} /> Edit</Btn>
              <Btn variant="brand" onClick={() => dispatch({ type: "UPDATE_BLOG", payload: { ...p, status: p.status === "Published" ? "Draft" : "Published" } })}>
                {p.status === "Published" ? "Unpublish" : "Publish"}
              </Btn>
              <Btn variant="danger" onClick={() => dispatch({ type: "DELETE_BLOG", id: p.id })}><Trash2 size={13} /></Btn>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modal} title={editing ? "Edit post" : "New post"} onClose={close}
        footer={<><Btn onClick={close}>Cancel</Btn><Btn variant="primary" onClick={save}><Save size={12} /> Save</Btn></>}>
        <FormField label="Title"><input name="title" className={inputCls} value={form.title} onChange={handle} /></FormField>
        <FormField label="Excerpt / body">
          <textarea name="excerpt" className={inputCls + " resize-none"} rows={4} value={form.excerpt} onChange={handle} />
        </FormField>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Date"><input type="date" name="date" className={inputCls} value={form.date} onChange={handle} /></FormField>
          <FormField label="Status">
            <select name="status" className={inputCls} value={form.status} onChange={handle}>
              <option>Draft</option><option>Published</option>
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
  const [form,    setForm]    = useState({ name:"", role:"", text:"", rating:5, visible:true });
  const [saving,  setSaving]  = useState(false);
  const [apiNote, setApiNote] = useState("");

  useEffect(() => {
    apiFetchTestimonials().then((data) => {
      const list = Array.isArray(data) ? data : data.testimonials ?? [];
      list.forEach((t) => {
        const storeId = t._id ?? t.id;
        const exists  = state.testimonials.find((s) => s.id === storeId);
        if (!exists) dispatch({ type: "ADD_TESTI",    payload: { ...t, id: storeId } });
        else         dispatch({ type: "UPDATE_TESTI", payload: { ...t, id: storeId } });
      });
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openEdit = (t) => { setEditing(t); setForm({ ...t }); setModal(true); setApiNote(""); };
  const openNew  = ()  => { setEditing(null); setForm({ name:"", role:"", text:"", rating:5, visible:true }); setModal(true); setApiNote(""); };
  const close    = ()  => { setModal(false); setApiNote(""); };
  const handle   = (e) => {
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
      else         dispatch({ type: "ADD_TESTI",    payload: { ...payload } });
      setApiNote("Saved locally — backend sync failed.");
    } finally { setSaving(false); }
  };

  const toggleVisible = async (t) => {
    const updated = { ...t, visible: !t.visible };
    try { await apiUpdateTestimonial(t.id, { visible: !t.visible }); } catch { /* local only */ }
    dispatch({ type: "UPDATE_TESTI", payload: updated });
  };

  const remove = async (t) => {
    try { await apiDeleteTestimonial(t.id); } catch { /* local only */ }
    dispatch({ type: "DELETE_TESTI", id: t.id });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-2">
        <p className="text-xs text-gray-400 hidden sm:block">Changes sync to the backend and reflect on the public site immediately.</p>
        <Btn variant="primary" onClick={openNew}><Plus size={13} /> Add testimonial</Btn>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
        {state.testimonials.length === 0 && <p className="text-gray-400 text-sm p-6">No testimonials yet.</p>}
        {state.testimonials.map((t) => (
          <div key={t.id} className="flex gap-3 p-4 hover:bg-[#eaf4fc]/20 transition">
            <Avatar name={t.name} size="md" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-0.5">
                <p className="font-medium text-sm text-gray-900">{t.name}</p>
                <Pill label={t.visible ? "Visible" : "Hidden"} color={t.visible ? "green" : "yellow"} />
              </div>
              <p className="text-xs text-gray-400 mb-1">{t.role}</p>
              <div className="mb-1"><StarRating rating={t.rating} /></div>
              <p className="text-sm text-gray-600 italic line-clamp-2">"{t.text}"</p>
              <div className="flex gap-2 mt-2 flex-wrap">
                <Btn variant="ghost" onClick={() => openEdit(t)}><Pencil size={13} /> Edit</Btn>
                <Btn variant="brand" onClick={() => toggleVisible(t)}>{t.visible ? "Hide" : "Show"}</Btn>
                <Btn variant="danger" onClick={() => remove(t)}><Trash2 size={13} /></Btn>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modal} title={editing ? "Edit testimonial" : "Add testimonial"} onClose={close}
        footer={
          <>
            {apiNote && <p className="text-xs text-amber-600 mr-auto self-center flex items-center gap-1"><AlertTriangle size={12} /> {apiNote}</p>}
            <Btn onClick={close} disabled={saving}>Cancel</Btn>
            <Btn variant="primary" onClick={save} disabled={saving}>{saving ? "Saving…" : <><Save size={12} /> Save</>}</Btn>
          </>
        }>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Name"><input name="name" className={inputCls} value={form.name} onChange={handle} /></FormField>
          <FormField label="Role / company"><input name="role" className={inputCls} value={form.role} onChange={handle} /></FormField>
        </div>
        <FormField label="Testimonial text">
          <textarea name="text" className={inputCls + " resize-none"} rows={3} value={form.text} onChange={handle} />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Rating (1–5)">
            <input name="rating" type="number" min="1" max="5" className={inputCls} value={form.rating} onChange={handle} />
          </FormField>
          <FormField label="Visible on site">
            <div className="flex items-center gap-2 mt-2">
              <input type="checkbox" name="visible" checked={!!form.visible} onChange={handle} className="w-4 h-4 rounded accent-[#2385cd]" />
              <span className="text-sm text-gray-600">Show on website</span>
            </div>
          </FormField>
        </div>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: Messages — mobile-friendly single-pane with back nav
// ─────────────────────────────────────────────────────────────────────────────
function MessagesSection({ state, dispatch }) {
  const [filter,      setFilter]      = useState("all");
  const [active,      setActive]      = useState(null);
  const [reply,       setReply]       = useState("");
  // Mobile: "list" | "detail"
  const [mobilePane,  setMobilePane]  = useState("list");

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
        {[["all","All"],["contact","Contact"],["staff","Staff requests"]].map(([k,l]) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition flex-shrink-0 ${
              filter === k ? "bg-[#2385cd] text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-[#2385cd] hover:text-[#2385cd]"
            }`}>{l}</button>
        ))}
        {unread > 0 && <span className="ml-auto text-xs text-red-500 font-medium flex-shrink-0">{unread} unread</span>}
      </div>
      <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
        {shown.map((m) => (
          <div key={m.id} onClick={() => openMsg(m)}
            className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-[#eaf4fc]/40 transition ${
              liveActive?.id === m.id ? "bg-[#eaf4fc]/60 border-l-2 border-[#2385cd]" : ""
            }`}>
            <Avatar name={m.from} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <p className={`text-sm truncate ${!m.read ? "font-semibold text-gray-900" : "text-gray-700"}`}>{m.subject}</p>
                <span className="text-xs text-gray-400 flex-shrink-0">{m.time}</span>
              </div>
              <p className="text-xs text-gray-400 truncate"><strong>{m.from}</strong> — {m.body}</p>
              {m.replies?.length > 0 && (
                <span className="text-xs text-[#2385cd] font-medium mt-0.5 inline-block">
                  {m.replies.length} repl{m.replies.length > 1 ? "ies" : "y"} sent
                </span>
              )}
            </div>
            {!m.read && <span className="w-2 h-2 rounded-full bg-[#2385cd] flex-shrink-0 mt-1.5" />}
          </div>
        ))}
        {shown.length === 0 && <p className="text-gray-400 text-sm p-4">No messages.</p>}
      </div>
    </div>
  );

  const MessageDetail = liveActive && (
    <div className="flex flex-col bg-white rounded-xl border border-gray-100 overflow-hidden" style={{ minHeight: 400 }}>
      <div className="p-4 border-b border-[#eaf4fc] bg-[#eaf4fc]/40">
        {/* Back button on mobile */}
        <button className="flex items-center gap-1 text-xs text-[#2385cd] font-medium mb-3 md:hidden"
          onClick={() => setMobilePane("list")}>
          <ChevronLeft size={14} /> Back to messages
        </button>
        <div className="flex items-center gap-2 mb-1">
          <Avatar name={liveActive.from} size="md" />
          <div>
            <p className="font-medium text-sm text-gray-900">{liveActive.from}</p>
            <p className="text-xs text-gray-400">{liveActive.time}</p>
          </div>
        </div>
        <p className="font-semibold text-sm text-gray-900 mt-2">{liveActive.subject}</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="flex gap-2">
          <Avatar name={liveActive.from} size="sm" />
          <div className="bg-gray-50 rounded-xl rounded-tl-none px-3 py-2 text-sm text-gray-600 leading-relaxed max-w-[85%]">
            {liveActive.body}
          </div>
        </div>
        {liveActive.replies?.map((r, i) => (
          <div key={i} className="flex gap-2 justify-end">
            <div className="bg-[#2385cd] rounded-xl rounded-tr-none px-3 py-2 text-sm text-white leading-relaxed max-w-[85%]">
              <p>{r.text}</p>
              <p className="text-[10px] text-white/60 mt-1 text-right">
                {new Date(r.sentAt).toLocaleTimeString("en-GB", { hour:"2-digit", minute:"2-digit" })}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#0f1e2e] text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">SA</div>
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
      {/* Mobile: toggle between list and detail */}
      <div className="block md:hidden">
        {mobilePane === "list" ? MessageList : (MessageDetail || MessageList)}
      </div>
      {/* Desktop: side-by-side */}
      <div className="hidden md:flex gap-4 min-h-0">
        {MessageList}
        {liveActive && <div className="w-80 flex-shrink-0">{MessageDetail}</div>}
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
      name: r.clientName, email: r.email, phone: r.phone, type: r.clientType,
      location: r.location,
      requests: state.requests.filter((x) => x.email === r.email).length,
      regUser:  (state.registeredUsers || []).find((u) => u.email === r.email),
    }));

  const [modal,   setModal]   = useState(false);
  const [viewing, setViewing] = useState(null);

  return (
    <div>
      {/* ── MOBILE: Cards ── */}
      <div className="block md:hidden space-y-3">
        {clients.length === 0 && (
          <p className="text-gray-400 text-sm text-center p-6 bg-white rounded-xl border border-gray-100">No profiles yet.</p>
        )}
        {clients.map((c, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-4">
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
              <div className="text-xs text-gray-500">
                {c.location} · <span className="font-medium text-[#2385cd]">{c.requests} requests</span>
              </div>
              <Btn variant="ghost" onClick={() => { setViewing(c); setModal(true); }}><Eye size={13} /> View</Btn>
            </div>
          </div>
        ))}
      </div>

      {/* ── DESKTOP: Table ── */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#eaf4fc]/60 border-b border-[#b8d9f0]/50">
                {["Name","Email","Phone","Type","Location","Requests",""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[#1a6fa8]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-gray-400 text-sm text-center">No profiles yet.</td></tr>
              )}
              {clients.map((c, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-[#eaf4fc]/30 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar src={c.regUser?.photoUrl} name={c.name} />
                      <span className="font-medium text-gray-900">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{c.email}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{c.phone}</td>
                  <td className="px-4 py-3"><Pill label={c.type} color="sky" /></td>
                  <td className="px-4 py-3 text-xs text-gray-500">{c.location}</td>
                  <td className="px-4 py-3 text-center font-medium text-[#2385cd]">{c.requests}</td>
                  <td className="px-4 py-3">
                    <Btn variant="ghost" onClick={() => { setViewing(c); setModal(true); }}><Eye size={13} /> View</Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal} title={`Profile — ${viewing?.name}`} onClose={() => setModal(false)}
        footer={<Btn onClick={() => setModal(false)}>Close</Btn>}>
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
              {viewing.regUser && (
                <div><p className="text-xs text-gray-400">Registered</p>
                  <p className="font-medium">{new Date(viewing.regUser.registeredAt).toLocaleDateString("en-GB")}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT: AdminPanel — with mobile sidebar drawer + bottom nav
// ─────────────────────────────────────────────────────────────────────────────
export function AdminPanel() {
  const { state, dispatch } = useStore();
  const [section,     setSection]     = useState("requests");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pendingCount  = state.requests.filter((r) => r.status === "Pending").length;
  const unreadCount   = state.messages.filter((m) => !m.read).length;
  const newUsersCount = (state.registeredUsers || []).filter((u) => {
    if (!u.registeredAt) return false;
    return Date.now() - new Date(u.registeredAt).getTime() < 24 * 60 * 60 * 1000;
  }).length;

  const getBadge = (key) =>
    key === "requests" ? pendingCount : key === "messages" ? unreadCount : key === "registered" ? newUsersCount : 0;

  const sectionContent = {
    requests:     <RequestsSection     state={state} dispatch={dispatch} />,
    staff:        <StaffSection        state={state} dispatch={dispatch} />,
    registered:   <RegisteredSection   state={state} dispatch={dispatch} />,
    blog:         <BlogSection         state={state} dispatch={dispatch} />,
    testimonials: <TestimonialsSection state={state} dispatch={dispatch} />,
    messages:     <MessagesSection     state={state} dispatch={dispatch} />,
    profiles:     <ProfilesSection     state={state} />,
  };

  const titles = {
    requests:"Requests", staff:"Staff Registry", registered:"Registered Users",
    blog:"Blog Manager", testimonials:"Testimonials", messages:"Messages", profiles:"Client Profiles",
  };

  const navigate = (key) => { setSection(key); setSidebarOpen(false); };

  // Sidebar nav items — shared between desktop sidebar and mobile drawer
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
            <Icon size={14} className="flex-shrink-0" style={{ color: isActive ? "#2385cd" : undefined }} />
            <span className="flex-1 truncate font-medium">{label}</span>
            {badge > 0 && (
              <span className="text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold flex-shrink-0"
                style={{ backgroundColor: "#2385cd" }}>{badge}</span>
            )}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">

      {/* ── Mobile sidebar overlay ─────────────────────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)} />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 flex flex-col w-56 md:hidden"
              initial={{ x: -224 }} animate={{ x: 0 }} exit={{ x: -224 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{ backgroundColor: "#0f1e2e" }}>
              <div className="px-4 py-5 border-b border-white/10 flex items-center justify-between">
                <div>
                  <p className="font-bold text-white text-sm leading-tight">Randle&amp;Hopkick</p>
                  <p className="text-xs font-medium mt-0.5" style={{ color: "#2385cd" }}>Admin Panel</p>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="text-white/50 hover:text-white p-1">
                  <X size={16} />
                </button>
              </div>
              {SidebarNav}
              <div className="px-3 py-4 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: "#2385cd" }}>SA</div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white truncate">Super Admin</p>
                    <p className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.4)" }}>admin@randlehopkick.ng</p>
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Desktop sidebar ────────────────────────────────────────────────── */}
      <aside className="hidden md:flex w-44 flex-shrink-0 flex-col" style={{ backgroundColor: "#0f1e2e" }}>
        <div className="px-4 py-5 border-b border-white/10">
          <p className="font-bold text-white text-sm leading-tight">Randle&amp;Hopkick</p>
          <p className="text-xs font-medium mt-0.5" style={{ color: "#2385cd" }}>Admin Panel</p>
        </div>
        {SidebarNav}
        <div className="px-3 py-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
              style={{ backgroundColor: "#2385cd" }}>SA</div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">Super Admin</p>
              <p className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.4)" }}>admin@randlehopkick.ng</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Header */}
        <header className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between flex-shrink-0 gap-3 bg-[#0f1e2e] md:bg-white border-b border-white/10 md:border-gray-100">
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger — mobile only */}
            <button className="md:hidden p-1.5 rounded-lg hover:bg-white/10 transition flex-shrink-0"
              onClick={() => setSidebarOpen(true)}>
              <Menu size={18} className="text-white md:text-gray-600" />
            </button>
            <div className="min-w-0">
              <h1 className="font-semibold text-white md:text-gray-900 text-sm sm:text-base truncate">{titles[section]}</h1>
              <p className="text-xs text-white/40 md:text-gray-400 hidden sm:block">
                {new Date().toLocaleDateString("en-GB", { weekday:"long", day:"numeric", month:"long", year:"numeric" })}
                {state.lastSyncedAt && (
                  <span className="ml-2 text-[#2385cd]">
                    · Synced {new Date(state.lastSyncedAt).toLocaleTimeString("en-GB", { hour:"2-digit", minute:"2-digit" })}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
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
                style={{ color:"#2385cd", backgroundColor:"#eaf4fc", borderColor:"#b8d9f0" }}>
                <UserCheck size={12} /> {newUsersCount} new user{newUsersCount > 1 ? "s" : ""}
              </button>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 md:pb-6">
          <AnimatePresence mode="wait">
            <motion.div key={section}
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
              transition={{ duration:0.15 }}>
              {sectionContent[section]}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* ── Mobile bottom navigation bar ───────────────────────────────────── */}
      <nav className="fixed bottom-0 inset-x-0 z-30 md:hidden border-t border-white/10 flex items-stretch"
        style={{ backgroundColor: "#0f1e2e", paddingBottom: "env(safe-area-inset-bottom)" }}>
        {BOTTOM_NAV.map((key) => {
          const { label, Icon } = NAV.find((n) => n.key === key);
          const badge     = getBadge(key);
          const isActive  = section === key;
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
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-[#2385cd]" />
              )}
            </button>
          );
        })}
        {/* "More" button for remaining nav items */}
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