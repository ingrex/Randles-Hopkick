import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ClientForm1 from "../ApplicationForms/ClientForm1";
import StaffForm   from "../ApplicationForms/StaffForm";
import PrivateForm from "../ApplicationForms/PrivateForm";
import { useStore } from "../store";
import { useAuth }  from "./AuthContext";

const MODES = ["Private", "Organization", "Staff"];


function Stat({ label, value }) {
  return (
    <motion.div whileHover={{ scale: 1.05 }} className="bg-white/20 backdrop-blur px-4 py-2 rounded-lg flex-shrink-0">
      <p className="text-xs opacity-80">{label}</p>
      <h4 className="font-bold text-sm sm:text-base">{value}</h4>
    </motion.div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="font-medium text-sm">{value || "—"}</p>
    </div>
  );
}

function StatusBadge({ status, awaitingReview = false }) {
  const displayStatus = status === "Completed" && awaitingReview ? "Awaiting Review" : status;
  const map = {
    Pending:          "text-yellow-700 bg-yellow-50  border-yellow-200",
    Approved:         "text-green-700  bg-green-50   border-green-200",
    Declined:         "text-red-700    bg-red-50     border-red-200",
    Completed:        "text-purple-700 bg-purple-50  border-purple-200",
    Rejected:         "text-red-700    bg-red-50     border-red-200",
    "Awaiting Review":"text-orange-700 bg-orange-50  border-orange-200",
  };
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border ${map[displayStatus] ?? "text-gray-600 bg-gray-50 border-gray-200"}`}>
      {displayStatus}
    </span>
  );
}

function StarRating({ value, max = 5, size = "sm" }) {
  const sz = size === "lg" ? "text-xl" : "text-sm";
  return (
    <span className={sz}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={i < Math.round(value) ? "text-yellow-400" : "text-gray-300"}>★</span>
      ))}
      <span className="text-xs text-gray-500 ml-1">{value > 0 ? value.toFixed(1) : "No ratings"}</span>
    </span>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function UserAvatar({ photoUrl, initials, size = "md" }) {
  const dim = size === "lg" ? "w-16 h-16 sm:w-20 sm:h-20 text-2xl" : "w-14 h-14 sm:w-16 sm:h-16 text-xl";
  return (
    <div className={`${dim} rounded-full border-2 border-white flex-shrink-0 overflow-hidden`}>
      {photoUrl ? (
        <img src={photoUrl} alt="avatar" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-sky-400/30 flex items-center justify-center font-bold text-white">
          {initials}
        </div>
      )}
    </div>
  );
}

// ── Modal shell ───────────────────────────────────────────────────────────────
function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute inset-0 bg-sky-400/10 blur-3xl rounded-xl pointer-events-none" />
          <button onClick={onClose}
            className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-slate-700 border border-white/20 text-white flex items-center justify-center hover:bg-slate-600 transition">
            ✕
          </button>
          <div className="relative">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Review Modal ──────────────────────────────────────────────────────────────
function ReviewModal({ request, staffList, onSubmit, onClose }) {
  const [rating,  setRating]  = useState(0);
  const [hover,   setHover]   = useState(0);
  const [comment, setComment] = useState("");
  const [staffId, setStaffId] = useState(request?.assignedStaff?.[0]?.id ?? null);

  if (!request) return null;

  const handle = () => {
    if (!rating || !staffId) return;
    onSubmit({ reqId: request.id, staffId, rating, comment });
  };

  return (
    <div className="w-full p-6 text-white rounded-xl bg-white/10 backdrop-blur-xl border border-white/10 shadow-lg space-y-5">
      <h2 className="text-xl font-semibold">Review completed job</h2>
      <p className="text-white/60 text-sm">Your rating helps us match the best staff with future clients.</p>

      {request.assignedStaff?.length > 1 && (
        <div>
          <p className="text-xs text-white/50 mb-2">Rate which staff member?</p>
          <div className="flex flex-wrap gap-2">
            {request.assignedStaff.map((s) => (
              <button key={s.id} onClick={() => setStaffId(s.id)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition ${staffId === s.id ? "border-sky-400 bg-sky-400/20 text-sky-300" : "border-white/20 text-white/60 hover:border-white/40"}`}>
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-xs text-white/50 mb-2">Overall rating *</p>
        <div className="flex gap-1">
          {[1,2,3,4,5].map((star) => (
            <button key={star}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(star)}
              className={`text-3xl transition ${star <= (hover || rating) ? "text-yellow-400" : "text-white/20"}`}>
              ★
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-xs text-white/50 mt-1">{["","Poor","Below average","Good","Very good","Excellent"][rating]}</p>
        )}
      </div>

      <div>
        <p className="text-xs text-white/50 mb-2">Comments (optional)</p>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3}
          placeholder="Share your experience…"
          className="w-full rounded-xl px-3 py-2 bg-white/10 border border-white/20 text-white outline-none focus:border-sky-400/60 transition text-sm resize-none placeholder-white/30" />
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="px-5 py-2 bg-white/10 text-white rounded-xl font-medium text-sm hover:bg-white/20 transition">Cancel</button>
        <button onClick={handle} disabled={!rating || !staffId} className="px-5 py-2 bg-sky-400 text-black rounded-xl font-medium text-sm disabled:opacity-40">
          Submit review
        </button>
      </div>
    </div>
  );
}

// ── Photo localStorage helpers ─────────────────────────────────────────────────
function loadPhoto() {
  try { return JSON.parse(localStorage.getItem("userProfile") || "{}")?.photoUrl || ""; }
  catch { return ""; }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN Dashboard
// ─────────────────────────────────────────────────────────────────────────────
export function Dashboard() {
  const location                   = useLocation();
  const navigate                   = useNavigate();
  const { state: store, dispatch } = useStore();
  const { user }                   = useAuth();

  const [mode,          setMode]          = useState("Private");
  const [activeTab,     setActiveTab]     = useState("Pending");
  const [modalType,     setModalType]     = useState(null);
  const [reviewReq,     setReviewReq]     = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const [photoUrl] = useState(() => loadPhoto());

  // ── Identity ────────────────────────────────────────────────────────────────
  const displayName = user
    ? `${user.surname || ""} ${user.otherNames || ""}`.trim()
    : "User";

  const initials = displayName
    .split(" ").filter(Boolean).map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";

  // Find staff record for the logged-in user
  const staffRecord = store.staff.find(
    (s) => s.name === displayName || s.email === user?.email
  );

  const subTitle =
    mode === "Staff"
      ? staffRecord?.role || "Staff Member"
      : mode === "Organization"
        ? "Organisation"
        : "Private Client";

  // Auto-open modal from navigation state
  useEffect(() => {
    if (location.state?.openModal) {
      const type = location.state.openModal;
      if (type === "private")      setMode("Private");
      if (type === "organization") setMode("Organization");
      setTimeout(() => setModalType(type), 100);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handlePrimaryAction = () => {
    if (mode === "Staff")              setModalType("staff");
    else if (mode === "Organization")  setModalType("organization");
    else                               setModalType("private");
  };

  const closeModal = () => { setModalType(null); setReviewReq(null); };

  // ── Derived data ─────────────────────────────────────────────────────────────
  const myRequests = store.requests;

  // Tab filtering — "Declined" replaces "Active"
  const filtered = myRequests.filter((r) => {
    if (activeTab === "Pending")   return r.status === "Pending";
    if (activeTab === "Approved")  return r.status === "Approved";
    if (activeTab === "Declined")  return r.status === "Declined" || r.status === "Rejected";
    if (activeTab === "Completed") return r.status === "Completed";
    return true;
  });

  const stats = {
    pending:   myRequests.filter((r) => r.status === "Pending").length,
    approved:  myRequests.filter((r) => r.status === "Approved").length,
    declined:  myRequests.filter((r) => r.status === "Declined" || r.status === "Rejected").length,
    completed: myRequests.filter((r) => r.status === "Completed").length,
  };

  const handleReviewSubmit = ({ reqId, staffId, rating, comment }) => {
    dispatch({ type: "SUBMIT_REVIEW", reqId, staffId, rating, comment });
    closeModal();
  };

  // ── Staff mode: jobs assigned to this user ───────────────────────────────────
  const staffActiveJobs = store.requests.filter(
    (r) =>
      ["Active", "Approved"].includes(r.status) &&
      r.assignedStaff?.some((s) => s.name === displayName || s.email === user?.email)
  );
  const staffCompletedJobs = store.requests.filter(
    (r) =>
      r.status === "Completed" &&
      r.assignedStaff?.some((s) => s.name === displayName || s.email === user?.email)
  );

  return (
    <div className="min-h-screen bg-gray-100">

      {/* ── HEADER ── */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative w-full">
        <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e" alt="header"
          className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/60" />

        <div className="relative z-10 px-4 pt-5 pb-6 sm:px-6 text-white">
          {/* Top bar — no edit profile button */}
          <div className="flex items-center justify-between mb-6 pt-16">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-wide">DASHBOARD</h1>
          </div>

          {/* Profile row */}
          <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <UserAvatar photoUrl={photoUrl} initials={initials} />
              <div>
                <h2 className="font-bold text-base sm:text-lg">{displayName}</h2>
                {/* Staff mode: skill + other skills */}
                {mode === "Staff" && staffRecord ? (
                  <>
                    <p className="text-sm opacity-90 font-medium">{staffRecord.role}</p>
                    {staffRecord.otherSkills?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {staffRecord.otherSkills.map((sk) => (
                          <span key={sk} className="text-[10px] bg-white/10 border border-white/20 text-white/70 rounded-full px-2 py-0.5">
                            {sk}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-1 flex items-center gap-1.5">
                      <StarRating value={staffRecord.averageRating} size="sm" />
                      <span className="text-xs text-white/50">({staffRecord.totalReviews} review{staffRecord.totalReviews !== 1 ? "s" : ""})</span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm opacity-80">{subTitle}</p>
                )}
                {user?.email && <p className="text-xs text-white/40 mt-0.5">{user.email}</p>}
              </div>
            </div>

            {/* Switch Mode + action */}
            <div className="flex flex-col gap-2 sm:items-end">
              <p className="text-xs font-bold text-white/80 uppercase tracking-wider">Switch Mode</p>
              <select value={mode} onChange={(e) => setMode(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg bg-white/10 text-white border border-white/30 backdrop-blur-md focus:outline-none focus:ring-1 focus:ring-sky-300/50">
                {MODES.map((m) => <option key={m} value={m} className="bg-slate-900 text-white">{m}</option>)}
              </select>
              <motion.button onClick={handlePrimaryAction}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="px-5 py-2 rounded-lg text-sm font-semibold text-white shadow-lg bg-gradient-to-r from-sky-600 to-sky-400">
                {mode === "Staff" ? "+ Get Job" : "+ Request Staff"}
              </motion.button>
            </div>
          </div>

          {/* Stats — hidden in Staff mode */}
          {mode !== "Staff" && (
            <div className="mt-5 flex gap-3 overflow-x-auto pb-1">
              <Stat label="Pending"   value={stats.pending} />
              <Stat label="Approved"  value={stats.approved} />
              <Stat label="Declined"  value={stats.declined} />
              <Stat label="Completed" value={stats.completed} />
            </div>
          )}
          {/* Staff mode: compact stats */}
          {mode === "Staff" && (
            <div className="mt-5 flex gap-3 overflow-x-auto pb-1">
              <Stat label="Active Jobs"     value={staffActiveJobs.length} />
              <Stat label="Completed Jobs"  value={staffCompletedJobs.length} />
            </div>
          )}
        </div>
      </motion.div>

      {/* ── BODY ── */}
      <div className="p-4">

        {/* ═══ STAFF MODE VIEW ═══════════════════════════════════════════════ */}
        {mode === "Staff" && (
          <>
            {/* Active / Approved jobs */}
            <div className="mb-2">
              <h3 className="font-semibold text-gray-800 mb-3 text-base">My Active Jobs</h3>
              {staffActiveJobs.length === 0 ? (
                <div className="bg-white p-5 rounded-xl shadow text-center text-gray-400 text-sm">
                  No active jobs assigned to you yet.
                </div>
              ) : (
                staffActiveJobs.map((r) => (
                  <motion.div key={r.id} whileHover={{ scale: 1.005 }}
                    className="bg-white p-4 rounded-xl shadow mb-3 space-y-2">
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div>
                        <p className="font-semibold text-gray-900">{r.clientName}</p>
                        <p className="text-xs text-gray-400">{r.clientType} · {r.location}</p>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {r.roles.map((role, i) => (
                        <span key={i} className="text-xs bg-sky-50 text-sky-700 border border-sky-200 rounded-full px-2.5 py-0.5">
                          {role.role} × {role.quantity}
                        </span>
                      ))}
                    </div>
                    {(r.startDate || r.endDate) && (
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Start Date" value={r.startDate} />
                        <Field label="End Date"   value={r.endDate} />
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </div>

            {/* Completed history toggle */}
            <div className="mt-4">
              <button
                onClick={() => setShowCompleted((v) => !v)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl shadow font-semibold text-sm transition ${
                  showCompleted ? "bg-sky-600 text-white" : "bg-white text-gray-700 hover:bg-purple-50"
                }`}>
                <span>📋 Completed Job History ({staffCompletedJobs.length})</span>
                <span>{showCompleted ? "▲" : "▼"}</span>
              </button>

              {showCompleted && (
                <div className="mt-3 space-y-3">
                  {staffCompletedJobs.length === 0 ? (
                    <div className="bg-white p-5 rounded-xl shadow text-center text-gray-400 text-sm">
                      No completed jobs yet.
                    </div>
                  ) : (
                    staffCompletedJobs.map((r) => (
                      <motion.div key={r.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-white p-4 rounded-xl shadow space-y-2">
                        <div className="flex items-start justify-between flex-wrap gap-2">
                          <div>
                            <p className="font-semibold text-gray-900">{r.clientName}</p>
                            <p className="text-xs text-gray-400">{r.clientType} · {r.location}</p>
                          </div>
                          <span className="text-xs bg-purple-50 text-sky-700 border border-purple-200 rounded-full px-2.5 py-0.5 font-semibold">
                            Completed
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {r.roles.map((role, i) => (
                            <span key={i} className="text-xs bg-sky-50 text-sky-700 border border-sky-200 rounded-full px-2.5 py-0.5">
                              {role.role} × {role.quantity}
                            </span>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Start Date" value={r.startDate} />
                          <Field label="End Date"   value={r.endDate} />
                        </div>
                        <p className="text-xs text-gray-300">
                          Completed {new Date(r.submittedAt).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" })}
                        </p>
                      </motion.div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Staff own rating panel */}
            {staffRecord && (
              <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-100 flex items-center gap-4">
                <div>
                  <p className="text-xs text-yellow-700 font-semibold mb-1">Your Overall Rating</p>
                  <StarRating value={staffRecord.averageRating} size="lg" />
                  <p className="text-xs text-gray-400 mt-0.5">
                    Based on {staffRecord.totalReviews} review{staffRecord.totalReviews !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* ═══ CLIENT / ORG MODE VIEW ════════════════════════════════════════ */}
        {mode !== "Staff" && (
          <>
            {/* Tab bar — Active replaced with Declined */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {["Pending","Approved","Declined","Completed"].map((tab) => (
                <motion.button key={tab} whileHover={{ scale: 1.04 }} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-full text-sm font-medium flex-shrink-0 transition ${
                    activeTab === tab ? "bg-sky-500 text-white shadow" : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}>
                  {tab}
                  {tab === "Pending" && stats.pending > 0 && (
                    <span className="ml-1.5 bg-yellow-400 text-black text-xs rounded-full px-1.5 py-0.5 font-bold">{stats.pending}</span>
                  )}
                  {tab === "Declined" && stats.declined > 0 && (
                    <span className="ml-1.5 bg-red-400 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">{stats.declined}</span>
                  )}
                </motion.button>
              ))}
            </div>

            {/* Empty state */}
            {filtered.length === 0 && (
              <div className="bg-white p-6 rounded-xl shadow text-center">
                <p className="text-gray-400 text-sm">
                  {activeTab === "Pending"
                    ? "No pending requests. Submit a new request using the button above."
                    : activeTab === "Approved"
                    ? "No approved requests yet."
                    : activeTab === "Declined"
                    ? "No declined requests."
                    : "No completed jobs yet."}
                </p>
              </div>
            )}

            {/* Request cards */}
            {filtered.map((r) => {
              const awaitingReview = r.status === "Completed" && !r.reviewed;
              // Normalise Rejected → Declined for display
              const displayStatus = r.status === "Rejected" ? "Declined" : r.status;
              return (
                <motion.div key={r.id} whileHover={{ scale: 1.005 }}
                  className="bg-white p-4 rounded-xl shadow mb-3 space-y-3">
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <p className="font-semibold text-gray-900">{r.clientName}</p>
                      <p className="text-xs text-gray-400">{r.clientType} · {r.location}</p>
                      <p className="text-xs text-gray-400">{r.email} · {r.phone}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={displayStatus} awaitingReview={awaitingReview} />
                      {/* Review button: only when Completed + not yet reviewed */}
                      {r.status === "Completed" && !r.reviewed && (
                        <button onClick={() => { setReviewReq(r); setModalType("review"); }}
                          className="px-3 py-1 text-xs bg-purple-50 text-sky-700 rounded-full border border-purple-200 hover:bg-purple-100 transition font-medium">
                          ⭐ Leave Review
                        </button>
                      )}
                      {r.status === "Completed" && r.reviewed && (
                        <span className="px-3 py-1 text-xs bg-green-50 text-green-600 rounded-full border border-green-200 font-medium">
                          ✓ Reviewed
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 mb-1">Roles requested</p>
                    <div className="flex flex-wrap gap-1.5">
                      {r.roles.map((role, i) => (
                        <span key={i} className="text-xs bg-sky-50 text-sky-700 border border-sky-200 rounded-full px-2.5 py-0.5">
                          {role.role} × {role.quantity}
                        </span>
                      ))}
                    </div>
                  </div>

                  {(r.startDate || r.endDate) && (
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Start Date" value={r.startDate} />
                      <Field label="End Date"   value={r.endDate} />
                    </div>
                  )}

                  {r.assignedStaff?.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Assigned staff</p>
                      <div className="flex flex-wrap gap-1.5">
                        {r.assignedStaff.map((s) => {
                          const staffInfo = store.staff.find((x) => x.id === s.id);
                          return (
                            <span key={s.id} className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-2.5 py-0.5 flex items-center gap-1">
                              {s.name}
                              {staffInfo && <StarRating value={staffInfo.averageRating} max={5} />}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-gray-300">
                    Submitted {new Date(r.submittedAt).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" })}
                  </p>
                </motion.div>
              );
            })}
          </>
        )}
      </div>

      {/* ── MODALS ── */}
      <Modal open={!!modalType} onClose={closeModal}>
        {modalType === "organization" && <ClientForm1 onSubmit={closeModal} />}
        {modalType === "private"      && <PrivateForm  onSubmit={closeModal} />}
        {modalType === "staff"        && <StaffForm    onSubmit={closeModal} />}
        {modalType === "staffProfile" && <StaffForm    onSubmit={closeModal} />}
        {modalType === "review" && (
          <ReviewModal
            request={reviewReq}
            staffList={store.staff}
            onSubmit={handleReviewSubmit}
            onClose={closeModal}
          />
        )}
      </Modal>
    </div>
  );
}

export default Dashboard;