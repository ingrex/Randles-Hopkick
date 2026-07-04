import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiGetMasterMarketplace, hasAuthToken, apiAdminGateLogin, clearAuthToken } from "../api/auth";
import { useStore, parseMasterMarketplace, normaliseMessage } from "../store";
import {
  apiFetchAdminTestimonials,
  apiCreateTestimonial,
  apiUpdateTestimonial,
  apiDeleteTestimonial,
  apiApproveRequest,
  apiRejectRequest,
  apiCompleteRequest,
  apiSetDates,
  apiAssignStaff,
  apiGetContactMessages,
  apiGetAdminBlogPosts,
  apiCreateBlogPost,
  apiUpdateBlogPost,
  apiDeleteBlogPost,
  apiSetFeaturedBlogPost,
  apiGetFeaturedBlogPost,
} from "../api/auth";
import { invalidateBlogCache } from "./data/blogPosts";
import {
  ClipboardList, Users, UserCheck, Newspaper, MessageSquare, Mail, BadgeCheck,
  Check, X, CheckCheck, Plus, Pencil, Trash2, Eye, CalendarDays, Save,
  UserPlus, Send, ArrowRightCircle, StopCircle, Star, AlertTriangle,
  ShieldAlert, Menu, ChevronLeft, MoreHorizontal, RefreshCw, LogIn, Lock,
  Flame, ChevronUp, ChevronDown, XCircle, CheckCircle2, Circle,
  Target, Repeat2, Image, Phone, Mail as MailIcon, Loader2,
} from "lucide-react";
import StaffSection from "./admin/sections/StaffSection";
import RegisteredSection from "./admin/sections/RegisteredSection";
import {
  Pill, Avatar, Modal, Btn, FormField, inputCls, StarRating, SkillTagInput, EmptyState,
  statusColor, safeKey,
} from "./admin/shared/adminUI";

// ── Brand tokens: Primary #2385cd | Navy #0f1e2e | Light #eaf4fc | Mid #b8d9f0

function displayStatus(r) {
  if (r.status === "Rejected")  return "Declined";
  if (r.status === "Completed" && !r.reviewed) return "Awaiting Review";
  return r.status;
}

function isReadyToApprove(r) {
  return (
    r.assignedStaff?.length > 0 &&
    r.startDate?.trim() &&
    r.endDate?.trim()
  );
}

function resolveBackendId(r) {
  const id = r.backendId ?? r._id ?? r.id;
  console.log(
    `[AdminPanel] resolveBackendId — local id: ${r.id}  backendId: ${r.backendId}  resolved: ${id}`
  );
  return id;
}

function isValidBackendId(id) {
  if (!id) return false;
  const str = String(id);
  if (/^\d{13,}$/.test(str)) return false;
  return true;
}

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

  const liveReq = activeReq
    ? (state.requests.find((r) => String(r.id) === String(activeReq.id)) ?? activeReq)
    : null;

  const shown = filter === "All"
    ? state.requests
    : filter === "Declined"
      ? state.requests.filter((r) => r.status === "Rejected" || r.status === "Declined")
      : filter === "Awaiting Review"
        ? state.requests.filter((r) => r.status === "Completed" && !r.reviewed)
        : state.requests.filter((r) => r.status === filter);

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
    const hasStart = dates.startDate?.trim();
    const hasEnd   = dates.endDate?.trim();
    if (!hasStart && !hasEnd) { close(); return; }
    const backendId = resolveBackendId(activeReq);
    if (!isValidBackendId(backendId)) { close(); return; }
    try {
      await apiSetDates(backendId, { startDate: hasStart || undefined, endDate: hasEnd || undefined });
    } catch (err) {
      console.error("[AdminPanel] apiSetDates failed:", err.message);
    }
    close();
  };

  const saveAssign = async () => {
    const staffList = Object.entries(selected).map(([id, name]) => ({ id, name }));
    dispatch({ type: "ASSIGN_STAFF", reqId: activeReq.id, assignedStaff: staffList });
    const backendId = resolveBackendId(activeReq);
    if (!isValidBackendId(backendId)) { close(); return; }
    const enrichedStaffList = staffList.map((s) => {
      const storeRecord = state.staff.find((st) => String(st.id) === String(s.id) || st.name === s.name);
      return { ...s, resolvedId: storeRecord?.backendId ?? storeRecord?.id ?? s.id };
    });
    try {
      await apiAssignStaff(backendId, enrichedStaffList.map((s) => ({ id: s.resolvedId, name: s.name })));
    } catch (err) {
      console.error("[AdminPanel] apiAssignStaff failed:", err.message);
    }
    close();
  };

  const toggleStaff = (s) =>
    setSelected((prev) => {
      const n = { ...prev };
      if (n[s.id]) delete n[s.id]; else n[s.id] = s.name;
      return n;
    });

  const handleApprove = async (r) => {
    if (!isReadyToApprove(r)) return;
    dispatch({ type: "APPROVE_REQUEST", id: r.id });
    const backendId = resolveBackendId(r);
    if (!isValidBackendId(backendId)) return;
    try { await apiApproveRequest(backendId); } catch (err) { console.error(err.message); }
  };

  const handleDecline = async (r) => {
    dispatch({ type: "DECLINE_REQUEST", id: r.id });
    const backendId = resolveBackendId(r);
    if (!isValidBackendId(backendId)) return;
    try { await apiRejectRequest(backendId); } catch (err) { console.error(err.message); }
  };

  const handleComplete = async (r) => {
    dispatch({ type: "COMPLETE_REQUEST", id: r.id });
    const backendId = resolveBackendId(r);
    if (!isValidBackendId(backendId)) return;
    try { await apiCompleteRequest(backendId); } catch (err) { console.error(err.message); }
  };

  const stats = {
    total:          state.requests.length,
    pending:        state.requests.filter((r) => r.status === "Pending").length,
    approved:       state.requests.filter((r) => r.status === "Approved").length,
    awaitingReview: state.requests.filter((r) => r.status === "Completed" && !r.reviewed).length,
  };

  const roleKeywords = liveReq?.roles?.map((x) => x.role.toLowerCase()) ?? [];
  const filteredStaff = state.staff.filter((s) => {
    if (skillFilter === "primary") return roleKeywords.some((kw) => s.role.toLowerCase().includes(kw));
    return roleKeywords.some((kw) => (s.otherSkills || []).some((sk) => sk.toLowerCase().includes(kw)));
  });
  const staffToShow = filteredStaff.length > 0 ? filteredStaff : state.staff;

  const ActionButtons = ({ r }) => {
    const ready = isReadyToApprove(r);
    const backendId = resolveBackendId(r);
    const hasValidId = isValidBackendId(backendId);
    return (
      <div className="flex flex-wrap gap-1.5">
        {!hasValidId && r.status === "Pending" && (
          <span title="This request was created locally and hasn't synced to the backend yet. Refresh to load it."
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium bg-amber-50 text-amber-600 border border-amber-200 select-none">
            <AlertTriangle size={10} /> Not synced
          </span>
        )}
        {r.status === "Pending" && (
          <>
            <Btn variant="primary" onClick={() => open("assign", r)}><UserPlus size={12} /> Assign Staff</Btn>
            <Btn variant="brand" onClick={() => open("dates", r)}><CalendarDays size={12} /> Set Dates</Btn>
            {ready ? (
              <Btn variant="success" onClick={() => handleApprove(r)}><Check size={12} /> Approve</Btn>
            ) : (
              <span title="Assign staff and set dates first to unlock approval"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-50 text-gray-300 border border-dashed border-gray-200 cursor-not-allowed select-none">
                <Check size={12} /> Approve
              </span>
            )}
            <Btn variant="danger" onClick={() => handleDecline(r)}><X size={12} /> Decline</Btn>
          </>
        )}
        {r.status === "Approved" && (
          <>
            <Btn variant="primary" onClick={() => handleComplete(r)}><CheckCheck size={12} /> Complete</Btn>
            <Btn variant="primary" onClick={() => open("assign", r)}><UserPlus size={12} /> Re-assign</Btn>
            <Btn variant="brand" onClick={() => open("dates", r)}><CalendarDays size={12} /> Dates</Btn>
          </>
        )}
        {r.status === "Completed" && !r.reviewed && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-orange-50 text-orange-600 border border-orange-100 select-none">
            <Star size={11} /> Awaiting review
          </span>
        )}
        {r.status === "Completed" && r.reviewed && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-600 border border-green-100 select-none">
            <CheckCheck size={11} /> Reviewed
          </span>
        )}
        <Btn variant="ghost" onClick={() => open("detail", r)}><Eye size={12} /> View</Btn>
      </div>
    );
  };

  const ReadinessHint = ({ r }) => {
    if (r.status !== "Pending" || isReadyToApprove(r)) return null;
    const noStaff = !r.assignedStaff?.length;
    const noDates = !r.startDate?.trim();
    return (
      <div className="flex items-start gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5 mt-1">
        <AlertTriangle size={11} className="shrink-0 mt-0.5" />
        {noStaff && noDates ? "Assign staff and set dates to unlock approval"
          : noStaff ? "Assign at least one staff member to unlock approval"
          : "Set start & end dates to unlock approval"}
      </div>
    );
  };

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total",           value: stats.total,          color: "text-gray-900",   bg: "bg-white"      },
          { label: "Pending",         value: stats.pending,        color: "text-yellow-600", bg: "bg-yellow-50"  },
          { label: "Approved",        value: stats.approved,       color: "text-[#2385cd]",  bg: "bg-[#eaf4fc]"  },
          { label: "Awaiting Review", value: stats.awaitingReview, color: "text-orange-600", bg: "bg-orange-50"  },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-[#b8d9f0]/40`}>
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
        {["All", "Pending", "Approved", "Completed", "Awaiting Review", "Declined"].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition shrink-0 ${
              filter === f ? "bg-[#2385cd] text-white shadow-sm" : "bg-white text-gray-600 border border-gray-200 hover:border-[#2385cd] hover:text-[#2385cd]"
            }`}>{f}</button>
        ))}
      </div>

      {shown.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100">
          <EmptyState icon={ClipboardList} title="No requests found"
            subtitle={filter === "All" ? "Requests submitted through the website will appear here." : `No ${filter.toLowerCase()} requests at the moment.`} />
        </div>
      )}

      <div className="block md:hidden space-y-3">
        {shown.map((r, idx) => {
          const ds  = displayStatus(r);
          const key = safeKey(r, idx);
          return (
            <div key={key} className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{r.clientName}</p>
                  <p className="text-xs text-gray-400">{r.clientType} · {r.phone}</p>
                  <p className="text-xs text-gray-400">{r.email}</p>
                </div>
                <Pill label={ds} color={statusColor(ds)} />
              </div>
              {r.status === "Pending" && (
                <div className="flex gap-3 text-[10px]">
                  <span className={`flex items-center gap-1 ${r.assignedStaff?.length ? "text-green-600" : "text-gray-300"}`}>
                    {r.assignedStaff?.length ? <CheckCircle2 size={11} /> : <Circle size={11} />} Staff assigned
                  </span>
                  <span className={`flex items-center gap-1 ${r.startDate?.trim() ? "text-green-600" : "text-gray-300"}`}>
                    {r.startDate?.trim() ? <CheckCircle2 size={11} /> : <Circle size={11} />} Dates set
                  </span>
                </div>
              )}
              <div className="flex flex-wrap gap-1">
                {(r.roles || []).map((x, i) => (
                  <span key={`role-${key}-${i}`} className="text-xs bg-[#eaf4fc] text-[#2385cd] border border-[#b8d9f0] rounded-full px-2 py-0.5">{x.role} ×{x.quantity}</span>
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
                  {r.assignedStaff.map((s, si) => (
                    <span key={s.id ?? `staff-${si}`} className="text-xs bg-green-50 text-green-700 rounded-full px-2 py-0.5 border border-green-100">{s.name}</span>
                  ))}
                </div>
              )}
              {r.status === "Completed" && (
                <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border ${r.reviewed ? "bg-green-50 border-green-100 text-green-700" : "bg-orange-50 border-orange-100 text-orange-700"}`}>
                  {r.reviewed ? <CheckCheck size={11} className="shrink-0" /> : <Star size={11} className="shrink-0" />}
                  {r.reviewed ? "Client reviewed" : "Awaiting client review"}
                </div>
              )}
              {r.reviews?.length > 0 && (
                <div className="bg-[#eaf4fc]/60 rounded-lg px-2.5 py-2 space-y-1">
                  {r.reviews.map((rv, i) => (
                    <div key={`rv-${key}-${i}`} className="flex items-start gap-2">
                      <span className="inline-flex gap-0.5 shrink-0 mt-0.5">
                        {Array.from({ length: 5 }, (_, si) => (
                          <Star key={`rvstar-${i}-${si}`} size={10} className={si < Math.round(rv.rating) ? "text-[#2385cd] fill-[#2385cd]" : "text-gray-200 fill-gray-200"} />
                        ))}
                      </span>
                      {rv.comment && <p className="text-xs text-gray-500 italic truncate">"{rv.comment}"</p>}
                    </div>
                  ))}
                </div>
              )}
              <ReadinessHint r={r} />
              <div className="pt-1 border-t border-gray-50"><ActionButtons r={r} /></div>
            </div>
          );
        })}
      </div>

      {shown.length > 0 && (
        <div className="hidden md:block bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#eaf4fc]/60 border-b border-[#b8d9f0]/50">
                  {["Client", "Roles", "Status", "Dates", "Assigned", "Review", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[#1a6fa8]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map((r, idx) => {
                  const ds  = displayStatus(r);
                  const key = safeKey(r, idx);
                  return (
                    <tr key={key} className="border-b border-gray-50 hover:bg-[#eaf4fc]/30 transition">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{r.clientName}</p>
                        <p className="text-xs text-gray-400">{r.clientType} · {r.phone}</p>
                        <p className="text-xs text-gray-400">{r.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(r.roles || []).map((x, i) => (
                            <span key={`role-${key}-${i}`} className="text-xs bg-[#eaf4fc] text-[#2385cd] border border-[#b8d9f0] rounded-full px-2 py-0.5">{x.role} ×{x.quantity}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Pill label={ds} color={statusColor(ds)} />
                        {r.status === "Pending" && (
                          <div className="mt-1 flex flex-col gap-0.5">
                            <span className={`flex items-center gap-1 text-[10px] ${r.assignedStaff?.length ? "text-green-600" : "text-gray-300"}`}>
                              {r.assignedStaff?.length ? <CheckCircle2 size={10} /> : <Circle size={10} />} Staff assigned
                            </span>
                            <span className={`flex items-center gap-1 text-[10px] ${r.startDate?.trim() ? "text-green-600" : "text-gray-300"}`}>
                              {r.startDate?.trim() ? <CheckCircle2 size={10} /> : <Circle size={10} />} Dates set
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {r.startDate ? (
                          <>
                            <div className="flex items-center gap-1"><ArrowRightCircle size={11} className="text-green-500 shrink-0" />{r.startDate}</div>
                            <div className="flex items-center gap-1 mt-0.5"><StopCircle size={11} className="text-red-400 shrink-0" />{r.endDate}</div>
                          </>
                        ) : <span className="text-gray-300">Not set</span>}
                      </td>
                      <td className="px-4 py-3">
                        {r.assignedStaff?.length
                          ? <div className="flex flex-wrap gap-1">{r.assignedStaff.map((s, si) => (
                              <span key={s.id ?? `astaff-${si}`} className="text-xs bg-green-50 text-green-700 rounded-full px-2 py-0.5 border border-green-100">{s.name}</span>
                            ))}</div>
                          : <span className="text-xs text-gray-300">Unassigned</span>}
                      </td>
                      <td className="px-4 py-3">
                        {r.status === "Completed" ? (
                          <div className="space-y-1.5">
                            <span className={`inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5 border font-medium ${r.reviewed ? "bg-green-50 border-green-100 text-green-700" : "bg-orange-50 border-orange-100 text-orange-700"}`}>
                              {r.reviewed ? <CheckCheck size={10} /> : <Star size={10} />}
                              {r.reviewed ? "Reviewed" : "Awaiting"}
                            </span>
                            {r.reviews?.length > 0 && r.reviews.map((rv, i) => (
                              <div key={`dtblrv-${key}-${i}`} className="flex items-center gap-1">
                                <span className="inline-flex gap-0.5">
                                  {Array.from({ length: 5 }, (_, si) => (
                                    <Star key={`dtblstar-${key}-${i}-${si}`} size={9} className={si < Math.round(rv.rating) ? "text-[#2385cd] fill-[#2385cd]" : "text-gray-200 fill-gray-200"} />
                                  ))}
                                </span>
                                {rv.comment && (
                                  <span className="text-[10px] text-gray-400 italic truncate max-w-[120px]" title={rv.comment}>"{rv.comment}"</span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : <span className="text-xs text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3"><ActionButtons r={r} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modal === "detail"} title={`Request — ${liveReq?.clientName}`} onClose={close} footer={<Btn onClick={close}>Close</Btn>}>
        {liveReq && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Name",       liveReq.clientName],
                ["Type",       liveReq.clientType],
                ["Email",      liveReq.email],
                ["Phone",      liveReq.phone],
                ["Location",   liveReq.location],
                ["Status",     displayStatus(liveReq)],
                ["Backend ID", resolveBackendId(liveReq)],
              ].map(([l, v]) => (
                <div key={l}><p className="text-xs text-gray-400">{l}</p><p className="font-medium break-all">{v}</p></div>
              ))}
              <div>
                <p className="text-xs text-gray-400">Synced ID?</p>
                {isValidBackendId(resolveBackendId(liveReq)) ? (
                  <p className="font-medium flex items-center gap-1 text-green-600"><CheckCircle2 size={13} /> Yes</p>
                ) : (
                  <p className="font-medium flex items-center gap-1 text-amber-600"><AlertTriangle size={13} /> Not synced</p>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Roles requested</p>
              <div className="flex flex-wrap gap-1">
                {(liveReq.roles || []).map((x, i) => (
                  <span key={`modal-role-${i}`} className="text-xs bg-[#eaf4fc] text-[#2385cd] border border-[#b8d9f0] rounded-full px-2 py-0.5">{x.role} ×{x.quantity}</span>
                ))}
              </div>
            </div>
            {liveReq.assignedStaff?.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Assigned staff</p>
                <div className="flex flex-wrap gap-1">
                  {liveReq.assignedStaff.map((s, si) => (
                    <span key={s.id ?? `modal-staff-${si}`} className="text-xs bg-green-50 text-green-700 border border-green-100 rounded-full px-2 py-0.5">{s.name}</span>
                  ))}
                </div>
              </div>
            )}
            {liveReq.reviews?.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Client reviews</p>
                <div className="space-y-2">
                  {liveReq.reviews.map((rv, i) => (
                    <div key={`modal-rv-${i}`} className="bg-[#eaf4fc]/50 rounded-lg p-2 text-xs">
                      <div className="flex items-center gap-1 mb-0.5">
                        {Array.from({ length: 5 }).map((_, si) => (
                          <Star key={`modal-rvstar-${i}-${si}`} size={10} className={si < rv.rating ? "text-[#2385cd] fill-[#2385cd]" : "text-gray-200 fill-gray-200"} />
                        ))}
                        <span className="text-gray-500 ml-1">{rv.rating}/5</span>
                      </div>
                      {rv.comment && <p className="text-gray-600 italic">"{rv.comment}"</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-400">Submitted</p>
              <p className="font-medium">{new Date(liveReq.submittedAt).toLocaleString("en-GB")}</p>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={modal === "dates"} title={`Set dates — ${liveReq?.clientName}`} onClose={close}
        footer={<><Btn onClick={close}>Cancel</Btn><Btn variant="primary" onClick={saveDates}><Save size={12} /> Save dates</Btn></>}>
        {liveReq && !isValidBackendId(resolveBackendId(liveReq)) && (
          <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <AlertTriangle size={13} className="shrink-0" />
            This request hasn't synced from the backend yet. Dates will be saved locally only.
          </div>
        )}
        <p className="text-xs text-gray-400">
          {liveReq?.status === "Pending" ? "Once staff is also assigned, the Approve button will become active." : "Update the start and end dates for this assignment."}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          <FormField label="Start date">
            <input type="date" className={inputCls} value={dates.startDate} onChange={(e) => setDates((p) => ({ ...p, startDate: e.target.value }))} />
          </FormField>
          <FormField label="End date">
            <input type="date" className={inputCls} value={dates.endDate} onChange={(e) => setDates((p) => ({ ...p, endDate: e.target.value }))} />
          </FormField>
        </div>
      </Modal>

      <Modal open={modal === "assign"} title={`Assign staff — ${liveReq?.clientName}`} onClose={close}
        footer={<><Btn onClick={close}>Cancel</Btn><Btn variant="primary" onClick={saveAssign}><Save size={12} /> Save assignment</Btn></>}>
        {liveReq && (
          <>
            {!isValidBackendId(resolveBackendId(liveReq)) && (
              <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <AlertTriangle size={13} className="shrink-0" />
                This request hasn't synced yet. Assignment will be saved locally.
              </div>
            )}
            <p className="text-xs text-gray-500 mb-1">Roles needed: {(liveReq.roles || []).map((x) => `${x.role} ×${x.quantity}`).join(", ")}</p>
            {liveReq.status === "Pending" && (
              <div className="flex items-center gap-1.5 text-xs text-[#1a6fa8] bg-[#eaf4fc] border border-[#b8d9f0] rounded-lg px-3 py-2 mb-2">
                <AlertTriangle size={11} className="text-[#2385cd] shrink-0" />
                Assign staff (and set dates) first — the Approve button unlocks only when both are done.
              </div>
            )}
            {state.staff.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400">No staff records found.</div>
            ) : (
              <>
                <div className="flex gap-2 mb-3">
                  {["primary", "other"].map((f) => (
                    <button key={f} onClick={() => setSkillFilter(f)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition ${
                        skillFilter === f ? "bg-[#2385cd] text-white border-[#2385cd]" : "bg-white text-gray-600 border-gray-200 hover:border-[#2385cd] hover:text-[#2385cd]"
                      }`}>
                      {f === "primary"
                        ? <span className="flex items-center gap-1.5"><Target size={12} /> Primary Skill</span>
                        : <span className="flex items-center gap-1.5"><Repeat2 size={12} /> Alt. Skills</span>
                      }
                    </button>
                  ))}
                </div>
                {filteredStaff.length === 0 && (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-2">No exact skill match — showing all staff.</p>
                )}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {staffToShow.map((s, si) => {
                    const isSel = !!selected[s.id];
                    return (
                      <div key={s.id ?? `assign-staff-${si}`} onClick={() => toggleStaff(s)}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                          isSel ? "border-[#2385cd] bg-[#eaf4fc]" : "border-gray-100 hover:border-[#b8d9f0] hover:bg-gray-50"
                        }`}>
                        <Avatar name={s.name} />
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-sm ${isSel ? "text-[#2385cd]" : "text-gray-900"}`}>{s.name}</p>
                          <p className="text-xs text-gray-400">{s.role}</p>
                          {s.otherSkills?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {s.otherSkills.map((sk, ski) => (
                                <span key={`sk-${s.id ?? si}-${ski}`} className="text-[10px] bg-gray-100 text-gray-500 rounded-full px-1.5 py-0.5">{sk}</span>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center gap-1 mt-0.5">
                            <StarRating rating={s.averageRating} />
                            <span className="text-xs text-gray-400">{s.averageRating > 0 ? s.averageRating.toFixed(1) : "—"}</span>
                          </div>
                          <p className="text-[9px] text-gray-300 mt-0.5 font-mono truncate" title={s.id}>id: {s.id}</p>
                        </div>
                        <Pill label={s.status} color={s.status === "Available" ? "green" : "blue"} />
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}

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
function BlogSection({ state, dispatch }) {
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