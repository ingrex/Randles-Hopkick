import { useState } from "react";
import {
  ClipboardList, Check, X, CheckCheck, Eye, CalendarDays, Save, UserPlus,
  ArrowRightCircle, StopCircle, Star, AlertTriangle, CheckCircle2, Circle,
  Target, Repeat2,
} from "lucide-react";
import {
  apiApproveRequest, apiRejectRequest, apiCompleteRequest, apiSetDates, apiAssignStaff,
} from "../../../api/auth";
import {
  Pill, Avatar, Modal, Btn, FormField, inputCls, StarRating, EmptyState,
} from "../shared/adminUI";

// ─────────────────────────────────────────────────────────────────────────────
// Request-domain helpers — peculiar to this section, exported so other
// sections (e.g. RegisteredSection's request-history preview) can reuse them
// without duplicating the business rules.
// ─────────────────────────────────────────────────────────────────────────────

export function statusColor(s) {
  return {
    Pending:           "yellow",
    Approved:          "sky",
    Rejected:          "red",
    Declined:          "red",
    Completed:         "gray",
    "Awaiting Review": "orange",
  }[s] ?? "gray";
}

export function displayStatus(r) {
  if (r.status === "Rejected")  return "Declined";
  if (r.status === "Completed" && !r.reviewed) return "Awaiting Review";
  return r.status;
}

export function isReadyToApprove(r) {
  return (
    r.assignedStaff?.length > 0 &&
    r.startDate?.trim() &&
    r.endDate?.trim()
  );
}

export function resolveBackendId(r) {
  const id = r.backendId ?? r._id ?? r.id;
  console.log(
    `[RequestsSection] resolveBackendId — local id: ${r.id}  backendId: ${r.backendId}  resolved: ${id}`
  );
  return id;
}

export function isValidBackendId(id) {
  if (!id) return false;
  const str = String(id);
  if (/^\d{13,}$/.test(str)) return false;
  return true;
}

export function safeKey(r, idx) {
  return r?.backendId ?? r?._id ?? r?.id ?? `__row_${idx}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// dedupeRequests
// Guards against ghost/duplicate rows for the same underlying request — e.g. a
// locally-created placeholder that never got cleared once the backend-synced
// copy arrived with a different id shape. Without this, a stale "Pending"
// duplicate could sit alongside the real Approved/Completed row and make tabs
// look inconsistent. Prefers the entry with a valid, synced backend id.
// ─────────────────────────────────────────────────────────────────────────────
function dedupeRequests(list) {
  const seen = new Map();
  for (const r of list) {
    const key = r.backendId ?? r.id;
    if (!key) continue;
    const existing = seen.get(key);
    if (!existing) { seen.set(key, r); continue; }
    const existingValid = isValidBackendId(existing.backendId ?? existing.id);
    const currentValid  = isValidBackendId(r.backendId ?? r.id);
    if (currentValid && !existingValid) seen.set(key, r);
  }
  return Array.from(seen.values());
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: Requests
// Moved out of AdminPanel.jsx as-is — same props (state, dispatch), same
// dispatch actions and API calls, no logic changes beyond the dedupe guard
// above and the SET_DATES/UPDATE_DATES reducer fix (see store.js) which
// stops approved requests from silently drifting into an untracked "Active"
// status that no filter tab could show.
// ─────────────────────────────────────────────────────────────────────────────
export default function RequestsSection({ state, dispatch }) {
  const [filter,      setFilter]      = useState("All");
  const [modal,       setModal]       = useState(null);
  const [activeReq,   setActiveReq]   = useState(null);
  const [dates,       setDates]       = useState({ startDate: "", endDate: "" });
  const [selected,    setSelected]    = useState({});
  const [skillFilter, setSkillFilter] = useState("primary");

  const allRequests = dedupeRequests(state.requests);

  const liveReq = activeReq
    ? (allRequests.find((r) => String(r.id) === String(activeReq.id)) ?? activeReq)
    : null;

  const shown = filter === "All"
    ? allRequests
    : filter === "Declined"
      ? allRequests.filter((r) => r.status === "Rejected" || r.status === "Declined")
      : filter === "Awaiting Review"
        ? allRequests.filter((r) => r.status === "Completed" && !r.reviewed)
        : allRequests.filter((r) => r.status === filter);

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
      console.error("[RequestsSection] apiSetDates failed:", err.message);
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
      console.error("[RequestsSection] apiAssignStaff failed:", err.message);
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
    total:          allRequests.length,
    pending:        allRequests.filter((r) => r.status === "Pending").length,
    approved:       allRequests.filter((r) => r.status === "Approved").length,
    awaitingReview: allRequests.filter((r) => r.status === "Completed" && !r.reviewed).length,
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
              ].map(([l, v]) => (
                <div key={l}><p className="text-xs text-gray-400">{l}</p><p className="font-medium break-all">{v}</p></div>
              ))}
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