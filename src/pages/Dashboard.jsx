import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ClientForm1 from "../ApplicationForms/ClientForm1";
import StaffForm   from "../ApplicationForms/StaffForm";
import PrivateForm from "../ApplicationForms/PrivateForm";
import { useStore, normaliseStaffProfile } from "../store";
import { useAuth }  from "./AuthContext";
import {
  apiSubmitReview,
  apiGetMyStaffProfile,
  apiGetUserRequests,
} from "../api/auth";

const MODES = ["Private", "Organization", "Staff"];

// ── small helpers ────────────────────────────────────────────────────────────
function Stat({ label, value }) {
  return (
    <motion.div whileHover={{ scale: 1.05 }} className="bg-white/20 backdrop-blur px-4 py-2 rounded-lg shrink-0">
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
    Pending:           "text-yellow-700 bg-yellow-50  border-yellow-200",
    Approved:          "text-green-700  bg-green-50   border-green-200",
    Declined:          "text-red-700    bg-red-50     border-red-200",
    Completed:         "text-purple-700 bg-purple-50  border-purple-200",
    Rejected:          "text-red-700    bg-red-50     border-red-200",
    "Awaiting Review": "text-orange-700 bg-orange-50  border-orange-200",
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

function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-2xl"
          onClick={(e) => e.stopPropagation()}>
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

function ReviewModal({ request, onSubmit, onClose, submitting }) {
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

      {request.assignedStaff?.length === 1 && (
        <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-lg px-3 py-2">
          <span className="text-xs text-white/50">Reviewing:</span>
          <span className="text-sm font-semibold text-white">{request.assignedStaff[0].name}</span>
        </div>
      )}

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

      {!request.assignedStaff?.length && (
        <p className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2">
          No staff assigned to this request yet.
        </p>
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
        <button onClick={onClose} disabled={submitting}
          className="px-5 py-2 bg-white/10 text-white rounded-xl font-medium text-sm hover:bg-white/20 transition disabled:opacity-40">
          Cancel
        </button>
        <button onClick={handle} disabled={!rating || !staffId || submitting}
          className="px-5 py-2 bg-sky-400 text-black rounded-xl font-medium text-sm disabled:opacity-40 flex items-center gap-2">
          {submitting ? (
            <>
              <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity="0.3"/>
                <path d="M21 12a9 9 0 00-9-9"/>
              </svg>
              Submitting…
            </>
          ) : "Submit review"}
        </button>
      </div>
    </div>
  );
}

// ── Lock icon ────────────────────────────────────────────────────────────────
function LockIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 38 38" fill="none" aria-hidden="true">
      <rect x="8" y="16" width="22" height="16" rx="4" stroke="#7dd3fc" strokeWidth="2.2"/>
      <path d="M13 16v-4a6 6 0 0 1 12 0v4" stroke="#7dd3fc" strokeWidth="2.2" strokeLinecap="round"/>
      <circle cx="19" cy="24" r="2.2" fill="#7dd3fc"/>
    </svg>
  );
}

// ── Shield icon ──────────────────────────────────────────────────────────────
function ShieldIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 38 38" fill="none" aria-hidden="true">
      <path
        d="M19 5L7 10v9c0 7.18 5.16 13.9 12 15.5C25.84 32.9 31 26.18 31 19v-9L19 5z"
        stroke="#7dd3fc" strokeWidth="2.2" strokeLinejoin="round"
      />
      <path d="M19 14v6M19 23v1.5" stroke="#7dd3fc" strokeWidth="2.4" strokeLinecap="round"/>
    </svg>
  );
}

// ── Already-Submitted modal ──────────────────────────────────────────────────
const SKY_500 = "#0ea5e9";
const SKY_300 = "#7dd3fc";
const OUTFIT  = "'Outfit', sans-serif";

function AlreadySubmittedModal({ onClose }) {
  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md"
      style={{ padding: "clamp(8px,4vw,16px)" }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.88, opacity: 0 }}
        animate={{ scale: 1,    opacity: 1 }}
        exit={{ scale: 0.88,    opacity: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 26 }}
        style={{
          position: "relative", maxWidth: 400, width: "100%",
          maxHeight: "85vh", overflowY: "auto",
          background: "rgba(6,18,40,.95)",
          border: "1.5px solid rgba(14,165,233,.28)",
          borderRadius: "clamp(16px,4vw,24px)",
          padding: "clamp(20px,5vw,32px) clamp(16px,5vw,28px) clamp(16px,4vw,26px)",
          textAlign: "center", backdropFilter: "blur(36px)",
          boxShadow: "0 40px 100px rgba(0,0,0,.4), inset 0 1px 0 rgba(14,165,233,.12)",
          fontFamily: OUTFIT,
        }}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} style={{
          position: "absolute", top: 12, right: 12,
          width: 28, height: 28, borderRadius: "50%",
          background: "rgba(255,255,255,.08)",
          border: "1px solid rgba(255,255,255,.15)",
          color: "rgba(200,225,255,.6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", fontSize: 12, lineHeight: 1,
        }}>✕</button>

        <div style={{
          width: "clamp(48px,12vw,60px)", height: "clamp(48px,12vw,60px)",
          borderRadius: "50%",
          background: "linear-gradient(135deg,#075985,#0ea5e9)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 12px",
          boxShadow: "0 0 24px rgba(14,165,233,.35)",
        }}>
          <LockIcon />
        </div>

        <h2 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "clamp(18px,5vw,22px)", fontWeight: 700,
          color: "#e8f0fe", letterSpacing: "-.02em", marginBottom: 6,
        }}>
          Application Submitted
        </h2>

        <p style={{ fontSize: "clamp(11px,3vw,13px)", color: "rgba(175,210,245,.65)", lineHeight: 1.7, marginBottom: 5, fontWeight: 300 }}>
          Your staff registration has already been received by{" "}
          <span style={{ color: SKY_300, fontWeight: 500 }}>Randle &amp; Hopkins</span>.
        </p>
        <p style={{ fontSize: "clamp(11px,3vw,13px)", color: "rgba(175,210,245,.65)", lineHeight: 1.7, marginBottom: 16, fontWeight: 300 }}>
          To update your details, please contact our admin team directly.
        </p>

        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "9px 12px",
          background: "rgba(14,165,233,.08)",
          border: "1px solid rgba(14,165,233,.2)",
          borderRadius: 12, marginBottom: 16, textAlign: "left",
        }}>
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
            <rect x="1.5" y="3.5" width="15" height="11" rx="2" stroke={SKY_500} strokeWidth="1.6"/>
            <path d="M1.5 6l7.5 5 7.5-5" stroke={SKY_500} strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
          <div>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(125,211,252,.55)", margin: "0 0 2px" }}>
              Contact Admin
            </p>
            <p style={{ fontSize: "clamp(10px,2.8vw,12px)", color: "rgba(190,225,255,.75)", margin: 0 }}>
              admin@randleandhopkins.com
            </p>
          </div>
        </div>

        <button onClick={onClose} style={{
          width: "100%", padding: "10px 0", borderRadius: 20, border: "none",
          background: "linear-gradient(135deg,#0369a1,#0ea5e9,#38bdf8)",
          color: "#fff", fontFamily: OUTFIT,
          fontSize: "clamp(12px,3.5vw,14px)", fontWeight: 600, cursor: "pointer",
          boxShadow: "0 6px 26px rgba(14,165,233,.28)",
        }}>
          Got it
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── Warning modal ────────────────────────────────────────────────────────────
function WarningModal({ onProceed, onClose }) {
  const points = [
    { icon: "✎", label: "Details are locked after submission", sub: "Changes require contacting our admin team directly." },
    { icon: "◎", label: "One submission per account",          sub: "Each account may only register as staff once." },
    { icon: "✔", label: "Accuracy is essential",              sub: "Ensure name, skills and contact details are correct." },
  ];

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md"
      style={{ padding: "clamp(8px,4vw,16px)" }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.88, opacity: 0, y: 20 }}
        animate={{ scale: 1,    opacity: 1, y: 0 }}
        exit={{ scale: 0.88,    opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 340, damping: 26 }}
        style={{
          position: "relative", maxWidth: 440, width: "100%",
          maxHeight: "85vh", overflowY: "auto",
          background: "rgba(4,14,32,.97)",
          border: "1.5px solid rgba(14,165,233,.25)",
          borderRadius: "clamp(16px,4vw,24px)",
          padding: "clamp(20px,5vw,30px) clamp(14px,5vw,26px) clamp(14px,4vw,22px)",
          textAlign: "center", backdropFilter: "blur(40px)",
          boxShadow: "0 50px 120px rgba(0,0,0,.5), inset 0 1px 0 rgba(14,165,233,.1)",
          fontFamily: OUTFIT,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* top accent line */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 2,
          borderRadius: "24px 24px 0 0",
          background: "linear-gradient(90deg,transparent,#0ea5e9cc,#38bdf888,transparent)",
        }}/>

        <button onClick={onClose} style={{
          position: "absolute", top: 12, right: 12,
          width: 28, height: 28, borderRadius: "50%",
          background: "rgba(255,255,255,.07)",
          border: "1px solid rgba(255,255,255,.13)",
          color: "rgba(200,225,255,.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", fontSize: 12, lineHeight: 1,
        }}>✕</button>

        <div style={{
          width: "clamp(48px,13vw,60px)", height: "clamp(48px,13vw,60px)",
          borderRadius: "50%",
          background: "linear-gradient(135deg,rgba(3,105,161,.8),rgba(14,165,233,.6))",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 12px",
          boxShadow: "0 0 28px rgba(14,165,233,.3), inset 0 1px 0 rgba(255,255,255,.1)",
        }}>
          <ShieldIcon />
        </div>

        <h2 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "clamp(18px,5.5vw,23px)", fontWeight: 700,
          color: "#e8f0fe", letterSpacing: "-.025em", marginBottom: 4,
        }}>
          Before You Continue
        </h2>
        <p style={{
          fontSize: "clamp(10px,2.8vw,12px)",
          color: "rgba(155,200,245,.5)", lineHeight: 1.55, marginBottom: 14, fontWeight: 300,
        }}>
          Please read these important notes before filling the registration form.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 12, textAlign: "left" }}>
          {points.map(({ icon, label, sub }) => (
            <div key={label} style={{
              display: "flex", alignItems: "flex-start", gap: 10,
              padding: "8px 11px",
              background: "rgba(14,165,233,.06)",
              border: "1px solid rgba(14,165,233,.15)",
              borderRadius: 12,
            }}>
              <span style={{
                flexShrink: 0,
                width: "clamp(22px,6vw,26px)", height: "clamp(22px,6vw,26px)",
                borderRadius: "50%",
                background: "linear-gradient(135deg,rgba(3,105,161,.6),rgba(14,165,233,.4))",
                border: "1px solid rgba(14,165,233,.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, color: SKY_300,
              }}>{icon}</span>
              <div>
                <p style={{ fontSize: "clamp(11px,3vw,12px)", fontWeight: 600, color: "rgba(200,230,255,.85)", margin: "0 0 2px", fontFamily: OUTFIT }}>
                  {label}
                </p>
                <p style={{ fontSize: "clamp(10px,2.5vw,11px)", color: "rgba(150,195,240,.5)", margin: 0, fontWeight: 300, lineHeight: 1.45 }}>
                  {sub}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 11px",
          background: "rgba(255,255,255,.04)",
          border: "1px solid rgba(255,255,255,.09)",
          borderRadius: 10, marginBottom: 14, textAlign: "left",
        }}>
          <svg width="14" height="14" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
            <rect x="1.5" y="3.5" width="15" height="11" rx="2" stroke="rgba(125,211,252,.5)" strokeWidth="1.6"/>
            <path d="M1.5 6l7.5 5 7.5-5" stroke="rgba(125,211,252,.5)" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
          <p style={{ fontSize: "clamp(10px,2.5vw,11px)", color: "rgba(155,200,245,.42)", margin: 0, fontWeight: 300 }}>
            For changes after submission, contact{" "}
            <span style={{ color: "rgba(125,211,252,.7)", fontWeight: 500 }}>admin@randleandhopkins.com</span>
          </p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 20,
              background: "rgba(255,255,255,.07)",
              border: "1px solid rgba(255,255,255,.14)",
              color: "rgba(190,220,255,.6)", fontFamily: OUTFIT,
              fontSize: "clamp(11px,3vw,13px)", fontWeight: 400, cursor: "pointer",
              transition: "all .25s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.12)"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.07)"; e.currentTarget.style.color = "rgba(190,220,255,.6)"; }}
          >
            Cancel
          </button>
          <button
            onClick={onProceed}
            style={{
              flex: 2, padding: "10px 0", borderRadius: 20, border: "none",
              background: "linear-gradient(135deg,#0369a1,#0ea5e9,#38bdf8)",
              color: "#fff", fontFamily: OUTFIT,
              fontSize: "clamp(11px,3vw,13px)", fontWeight: 600, cursor: "pointer",
              boxShadow: "0 8px 28px rgba(14,165,233,.32)",
              transition: "all .3s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 12px 40px rgba(14,165,233,.52)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 8px 28px rgba(14,165,233,.32)"; e.currentTarget.style.transform = "none"; }}
          >
            I Understand → Continue
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

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

  const [mode,             setMode]             = useState("Private");
  const [activeTab,        setActiveTab]        = useState("Pending");
  const [modalType,        setModalType]        = useState(null);
  const [reviewReq,        setReviewReq]        = useState(null);
  const [showCompleted,    setShowCompleted]    = useState(false);
  const [reviewError,      setReviewError]      = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // ── Staff "Get Job" sub-modal state (mirrors GetJobButton) ────────────────
  const [staffModal, setStaffModal] = useState(null); // null | "done" | "warning" | "form"

  const [photoUrl] = useState(() => loadPhoto());

  // ── Identity ────────────────────────────────────────────────────────────────
  const displayName = user
    ? `${user.surname || ""} ${user.otherNames || ""}`.trim()
    : "User";

  const initials = displayName
    .split(" ").filter(Boolean).map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";

  const staffRecord = store.staff.find(
    (s) => s.name === displayName || s.email === user?.email
  );

  const subTitle =
    mode === "Staff"
      ? staffRecord?.role || "Staff Member"
      : mode === "Organization"
        ? "Organisation"
        : "Private Client";

  // ── syncUserRequests ────────────────────────────────────────────────────────
  // Pulls this user's own staff-requests from the backend (GET /staff-request/my)
  // and merges them into the store via SYNC_USER_REQUESTS. This is what keeps the
  // Dashboard's Pending/Approved/Declined/Completed tabs in sync with actions an
  // admin takes (approve, decline, complete, assign staff, set dates) from the
  // Admin Panel — those happen in the admin's own session and never reach this
  // browser's store unless we explicitly re-fetch.
  const syncUserRequests = useCallback(async () => {
    if (!user) return;
    try {
      const raw  = await apiGetUserRequests();
      const list = raw?.data ?? raw?.requests ?? raw;
      if (Array.isArray(list) && list.length) {
        dispatch({ type: "SYNC_USER_REQUESTS", requests: list });
      }
    } catch (err) {
      console.warn("[Dashboard] syncUserRequests failed:", err?.message);
    }
  }, [user, dispatch]);

  // ── syncStaffProfile ────────────────────────────────────────────────────────
  const syncStaffProfile = useCallback(async () => {
    if (!user || mode !== "Staff") return;
    try {
      const raw     = await apiGetMyStaffProfile();
      const profile = raw?.data ?? raw?.profile ?? raw;
      if (!profile || typeof profile !== "object") return;
      const normalised = normaliseStaffProfile(profile);
      if (normalised) dispatch({ type: "UPDATE_STAFF", payload: normalised });
    } catch (err) {
      console.warn("[Dashboard] syncStaffProfile failed:", err?.message);
    }
  }, [user, mode, dispatch]);

  // ── Hide header + footer whenever a staff sub-modal is open ───────────────
  useEffect(() => {
    const header = document.querySelector("header");
    const footer = document.querySelector("footer");
    const els = [header, footer].filter(Boolean);
    if (staffModal) {
      els.forEach(el => {
        el.style.transition = "opacity 0.2s ease, visibility 0.2s ease";
        el.style.opacity    = "0";
        el.style.visibility = "hidden";
      });
    } else {
      els.forEach(el => {
        el.style.opacity    = "1";
        el.style.visibility = "visible";
      });
    }
    return () => {
      els.forEach(el => {
        el.style.opacity    = "1";
        el.style.visibility = "visible";
      });
    };
  }, [staffModal]);

  // ── On mount + focus + visibility — staff profile (only relevant in Staff mode) ─
  useEffect(() => {
    syncStaffProfile();
    const onFocus      = () => syncStaffProfile();
    const onVisibility = () => {
      if (document.visibilityState === "visible") syncStaffProfile();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [syncStaffProfile]);

  useEffect(() => {
    if (mode === "Staff") syncStaffProfile();
  }, [mode, syncStaffProfile]);

  // ── On mount + focus + visibility — this user's own requests (Private/Organization) ─
  useEffect(() => {
    syncUserRequests();
    const onFocus      = () => syncUserRequests();
    const onVisibility = () => {
      if (document.visibilityState === "visible") syncUserRequests();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [syncUserRequests]);

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

  // ── Primary action handler — now with GetJobButton logic for Staff ─────────
  const handlePrimaryAction = () => {
    if (mode === "Staff") {
      // Mirror GetJobButton: check submitted → warning → form
      if (!user) { navigate("/login"); return; }
      if (user?.staffProfileSubmitted) { setStaffModal("done"); return; }
      setStaffModal("warning");
    } else if (mode === "Organization") {
      setModalType("organization");
    } else {
      setModalType("private");
    }
  };

  const closeModal = () => {
    setModalType(null);
    setReviewReq(null);
    setReviewError("");
  };

  const closeStaffModal = () => setStaffModal(null);

  const handleStaffFormSubmit = () => {
    setStaffModal(null);
    syncStaffProfile();
  };

  // ── Derived data ─────────────────────────────────────────────────────────────
  const myRequests = user?.email
    ? store.requests.filter((r) => r.email === user.email)
    : store.requests;

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

  // ── Review submit ─────────────────────────────────────────────────────────────
  const handleReviewSubmit = async ({ reqId, staffId, rating, comment }) => {
    setSubmittingReview(true);
    setReviewError("");

    const req = myRequests.find((r) => String(r.id) === String(reqId));
    const backendId = req?.backendId ?? req?.id ?? reqId;

    dispatch({ type: "SUBMIT_REVIEW", reqId, staffId, rating, comment });

    try {
      await apiSubmitReview(backendId, { staffId, rating, comment });
      closeModal();
      await syncStaffProfile();
    } catch (err) {
      console.error("[Dashboard] apiSubmitReview failed:", err.message);
      setReviewError("Review saved locally but backend sync failed.");
      setTimeout(() => closeModal(), 3000);
    } finally {
      setSubmittingReview(false);
    }
  };

  // ── Staff mode jobs ───────────────────────────────────────────────────────────
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
        <img src="https://res.cloudinary.com/dotvnclej/image/upload/v1780431641/bg2_v9bp0u.jpg" alt="header"
          className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/60" />

        <div className="relative z-10 px-4 pt-5 pb-6 sm:px-6 text-white">
          <div className="flex items-center justify-between mb-6 pt-16">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-wide">DASHBOARD</h1>
          </div>

          {/* Profile row */}
          <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <UserAvatar photoUrl={photoUrl} initials={initials} />
              <div>
                <h2 className="font-bold text-base sm:text-lg">{displayName}</h2>
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
                      <span className="text-xs text-white/50">
                        ({staffRecord.totalReviews} review{staffRecord.totalReviews !== 1 ? "s" : ""})
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm opacity-80">{subTitle}</p>
                )}
                {user?.email && <p className="text-xs text-white/40 mt-0.5">{user.email}</p>}
              </div>
            </div>

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

          {mode !== "Staff" && (
            <div className="mt-5 flex gap-3 overflow-x-auto pb-1">
              <Stat label="Pending"   value={stats.pending} />
              <Stat label="Approved"  value={stats.approved} />
              <Stat label="Declined"  value={stats.declined} />
              <Stat label="Completed" value={stats.completed} />
            </div>
          )}
          {mode === "Staff" && (
            <div className="mt-5 flex gap-3 overflow-x-auto pb-1">
              <Stat label="Active Jobs"    value={staffActiveJobs.length} />
              <Stat label="Completed Jobs" value={staffCompletedJobs.length} />
            </div>
          )}
        </div>
      </motion.div>

      {/* ── BODY ── */}
      <div className="p-4">

        {/* ═══ STAFF MODE ═════════════════════════════════════════════════════ */}
        {mode === "Staff" && (
          <>
            {staffActiveJobs.length > 0 && (
              <div className="mb-3 px-4 py-3 bg-sky-50 border border-sky-200 rounded-xl text-sky-700 text-sm font-medium flex items-center gap-2">
                <span>🔔</span>
                You have {staffActiveJobs.length} active job{staffActiveJobs.length > 1 ? "s" : ""} assigned to you.
              </div>
            )}

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

        {/* ═══ CLIENT / ORG MODE ══════════════════════════════════════════════ */}
        {mode !== "Staff" && (
          <>
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

            {filtered.map((r) => {
              const awaitingReview = r.status === "Completed" && !r.reviewed;
              const displayStatus  = r.status === "Rejected" ? "Declined" : r.status;
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

                      {r.status === "Completed" && !r.reviewed && (
                        <button
                          onClick={() => { setReviewReq(r); setModalType("review"); setReviewError(""); }}
                          className="px-3 py-1 text-xs bg-purple-50 text-sky-700 rounded-full border border-purple-200 hover:bg-purple-100 transition font-medium">
                          ⭐ Leave Review
                        </button>
                      )}
                      {r.status === "Completed" && r.reviewed && (
                        <div className="flex flex-col gap-1">
                          <span className="px-3 py-1 text-xs bg-green-50 text-green-600 rounded-full border border-green-200 font-medium self-start">
                            ✓ Reviewed
                          </span>
                          {(r.reviews ?? []).map((rv, i) => (
                            <div key={`dash-rv-${i}`} className="flex items-center gap-1.5 text-xs text-gray-500">
                              {rv.staffName && (
                                <span className="font-medium text-gray-700">{rv.staffName}</span>
                              )}
                              <span className="flex items-center gap-0.5">
                                {Array.from({ length: 5 }, (_, si) => (
                                  <span
                                    key={si}
                                    className={si < Math.round(rv.rating) ? "text-yellow-400" : "text-gray-300"}
                                  >
                                    ★
                                  </span>
                                ))}
                              </span>
                              {rv.comment && (
                                <span className="italic text-gray-400 truncate max-w-[160px]">"{rv.comment}"</span>
                              )}
                            </div>
                          ))}
                        </div>
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

      {/* ── CLIENT / ORG / REVIEW MODALS ── */}
      <Modal open={!!modalType} onClose={closeModal}>
        {modalType === "organization" && (
          <ClientForm1 onSubmit={() => { closeModal(); }} />
        )}
        {modalType === "private" && (
          <PrivateForm onSubmit={() => { closeModal(); }} />
        )}
        {modalType === "staff" && (
          <StaffForm onSubmit={() => { closeModal(); syncStaffProfile(); }} />
        )}
        {modalType === "staffProfile" && (
          <StaffForm onSubmit={() => { closeModal(); syncStaffProfile(); }} />
        )}
        {modalType === "review" && (
          <>
            <ReviewModal
              request={reviewReq}
              onSubmit={handleReviewSubmit}
              onClose={closeModal}
              submitting={submittingReview}
            />
            {reviewError && (
              <p className="mt-2 text-xs text-amber-300 text-center px-4">{reviewError}</p>
            )}
          </>
        )}
      </Modal>

      {/* ── STAFF "GET JOB" MODALS (mirrors GetJobButton flow) ── */}
      <AnimatePresence>
        {staffModal === "done" && (
          <AlreadySubmittedModal key="staff-done" onClose={closeStaffModal} />
        )}

        {staffModal === "warning" && (
          <WarningModal
            key="staff-warning"
            onClose={closeStaffModal}
            onProceed={() => setStaffModal("form")}
          />
        )}

        {staffModal === "form" && (
          <motion.div
            key="staff-form"
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeStaffModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1,   opacity: 1 }}
              exit={{ scale: 0.9,    opacity: 0 }}
              className="relative w-full max-w-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute inset-0 bg-sky-400/10 blur-3xl rounded-xl pointer-events-none" />
              <button
                onClick={closeStaffModal}
                className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-slate-700 border border-white/20 text-white flex items-center justify-center hover:bg-slate-600 transition"
              >
                ✕
              </button>
              <div className="relative">
                <StaffForm onSubmit={handleStaffFormSubmit} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default Dashboard;