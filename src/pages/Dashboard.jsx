// src/pages/Dashboard.jsx
// ─── Features ─────────────────────────────────────────────────────────────────
// • Data persists via store (localStorage) — survives page refresh
// • "Switch Mode" bold label above mode dropdown
// • Staff mode: shows average star rating
// • Individual mode: personal info in header
// • Organization mode: company/position info in header
// • Pending tab: shows pending requests
// • Approved tab: shows approved (admin set dates visible)
// • Active tab: shows active jobs (Review button available when Completed)
// • Completed tab: Review button → star rating modal → updates staff rating
// • Edit Profile: photo upload, marital status, skill, experience, position, etc.
// • Admin panel link in header (top-right corner)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ClientForm1 from "../ApplicationForms/ClientForm1";
import StaffForm   from "../ApplicationForms/StaffForm";
import PrivateForm from "../ApplicationForms/PrivateForm";
import AdminPanel from "./Adminpanel";
import { useStore, loadProfile, saveProfile } from "../store";

const MODES = ["Private", "Organization", "Staff"];

// ── helpers ──────────────────────────────────────────────────────────────────
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

function StatusBadge({ status }) {
  const map = {
    Pending:   "text-yellow-700 bg-yellow-50  border-yellow-200",
    Approved:  "text-green-700  bg-green-50   border-green-200",
    Active:    "text-blue-700   bg-blue-50    border-blue-200",
    Completed: "text-purple-700 bg-purple-50  border-purple-200",
    Rejected:  "text-red-700    bg-red-50     border-red-200",
  };
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border ${map[status] ?? "text-gray-600 bg-gray-50 border-gray-200"}`}>
      {status}
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
          <button onClick={onClose} className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-slate-700 border border-white/20 text-white flex items-center justify-center hover:bg-slate-600 transition">
            ✕
          </button>
          <div className="relative">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Review / Rating Modal ─────────────────────────────────────────────────────
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

      {/* Staff selector (if multiple assigned) */}
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

      {/* Stars */}
      <div>
        <p className="text-xs text-white/50 mb-2">Overall rating *</p>
        <div className="flex gap-1">
          {[1,2,3,4,5].map((star) => (
            <button key={star}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(star)}
              className={`text-3xl transition ${star <= (hover || rating) ? "text-yellow-400" : "text-white/20"}`}
            >★</button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-xs text-white/50 mt-1">
            {["","Poor","Below average","Good","Very good","Excellent"][rating]}
          </p>
        )}
      </div>

      {/* Comment */}
      <div>
        <p className="text-xs text-white/50 mb-2">Comments (optional)</p>
        <textarea
          value={comment} onChange={(e) => setComment(e.target.value)} rows={3}
          placeholder="Share your experience with this staff member…"
          className="w-full rounded-xl px-3 py-2 bg-white/10 border border-white/20 text-white outline-none focus:border-sky-400/60 transition text-sm resize-none placeholder-white/30"
        />
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="px-5 py-2 bg-white/10 text-white rounded-xl font-medium text-sm hover:bg-white/20 transition">
          Cancel
        </button>
        <button onClick={handle} disabled={!rating || !staffId}
          className="px-5 py-2 bg-sky-400 text-black rounded-xl font-medium text-sm disabled:opacity-40">
          Submit review
        </button>
      </div>
    </div>
  );
}

// ── Edit Profile Modal ────────────────────────────────────────────────────────
const MARITAL_OPTIONS   = ["Single", "Married", "Divorced", "Widowed", "Prefer not to say"];
const EXPERIENCE_LEVELS = ["Under 1 year", "1–2 years", "3–5 years", "5–10 years", "Over 10 years"];

function EditProfileModal({ profile, mode, onSave, onClose }) {
  const [form, setForm] = useState({ ...profile });
  const fileRef = useRef();

  const handle = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((p) => ({ ...p, photoUrl: reader.result }));
    reader.readAsDataURL(file);
  };

  const initials = (form.name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const fieldCls = "w-full rounded-xl px-3 py-2 bg-white/10 border border-white/20 text-white outline-none focus:border-sky-400/60 transition text-sm placeholder-white/30";
  const selectCls = fieldCls + " appearance-none cursor-pointer";
  const Label = ({ children }) => <label className="text-xs text-white/50 mb-1 block">{children}</label>;

  return (
    <div className="w-full max-h-[88vh] overflow-y-auto p-6 text-white rounded-xl bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl border border-white/10 shadow-lg">
      <h2 className="text-xl font-semibold mb-5">Edit Profile</h2>

      {/* Photo upload */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative cursor-pointer" onClick={() => fileRef.current?.click()}>
          {form.photoUrl ? (
            <img src={form.photoUrl} alt="avatar" className="w-20 h-20 rounded-full object-cover border-2 border-sky-400/60" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-sky-400/20 border-2 border-sky-400/40 flex items-center justify-center text-2xl font-bold text-sky-300">
              {initials}
            </div>
          )}
          <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-sky-400 flex items-center justify-center text-black text-xs font-bold">✏️</div>
        </div>
        <div>
          <p className="font-semibold">{form.name || "Your Name"}</p>
          <button onClick={() => fileRef.current?.click()} className="text-xs text-sky-400 hover:text-sky-300 transition mt-0.5">
            Change profile photo
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
        </div>
      </div>

      {/* Common fields */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="col-span-2">
          <Label>Full name *</Label>
          <input name="name" value={form.name || ""} onChange={handle} className={fieldCls} placeholder="e.g. Eze Emeka" />
        </div>
        <div>
          <Label>Email address *</Label>
          <input name="email" type="email" value={form.email || ""} onChange={handle} className={fieldCls} placeholder="you@example.com" />
        </div>
        <div>
          <Label>Phone number *</Label>
          <input name="phone" value={form.phone || ""} onChange={handle} className={fieldCls} placeholder="080..." />
        </div>
        <div className="col-span-2">
          <Label>Home / residential address</Label>
          <input name="homeAddress" value={form.homeAddress || ""} onChange={handle} className={fieldCls} placeholder="Street, city, state" />
        </div>
        <div>
          <Label>Date of birth</Label>
          <input name="dob" type="date" value={form.dob || ""} onChange={handle} className={fieldCls} />
        </div>
        <div>
          <Label>Marital status</Label>
          <select name="maritalStatus" value={form.maritalStatus || ""} onChange={handle} className={selectCls}>
            <option value="">Select…</option>
            {MARITAL_OPTIONS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
      </div>

      {/* Mode-specific fields */}
      {mode === "Private" && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="col-span-2">
            <Label>Occupation / job title</Label>
            <input name="occupation" value={form.occupation || ""} onChange={handle} className={fieldCls} placeholder="e.g. Business owner" />
          </div>
        </div>
      )}

      {mode === "Organization" && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <Label>Company / organisation name</Label>
            <input name="companyName" value={form.companyName || ""} onChange={handle} className={fieldCls} placeholder="Acme Ltd" />
          </div>
          <div>
            <Label>Your position / role</Label>
            <input name="position" value={form.position || ""} onChange={handle} className={fieldCls} placeholder="e.g. HR Manager" />
          </div>
          <div>
            <Label>Industry</Label>
            <input name="industry" value={form.industry || ""} onChange={handle} className={fieldCls} placeholder="e.g. Finance" />
          </div>
          <div>
            <Label>Company registration no.</Label>
            <input name="regNo" value={form.regNo || ""} onChange={handle} className={fieldCls} placeholder="RC-..." />
          </div>
        </div>
      )}

      {mode === "Staff" && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <Label>Primary skill / trade *</Label>
            <input name="skill" value={form.skill || ""} onChange={handle} className={fieldCls} placeholder="e.g. Electrician" />
          </div>
          <div>
            <Label>Years of experience</Label>
            <select name="experience" value={form.experience || ""} onChange={handle} className={selectCls}>
              <option value="">Select…</option>
              {EXPERIENCE_LEVELS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <Label>Other skills / specialisations</Label>
            <input name="otherSkills" value={form.otherSkills || ""} onChange={handle} className={fieldCls} placeholder="e.g. Solar installation, CCTV" />
          </div>
          <div className="col-span-2">
            <Label>Brief bio / professional summary</Label>
            <textarea name="bio" value={form.bio || ""} onChange={handle} rows={3}
              className={fieldCls + " resize-none"} placeholder="Tell clients about yourself…" />
          </div>
          <div>
            <Label>Availability</Label>
            <select name="availability" value={form.availability || ""} onChange={handle} className={selectCls}>
              <option value="">Select…</option>
              <option>Full-time</option>
              <option>Part-time</option>
              <option>Contract only</option>
            </select>
          </div>
          <div>
            <Label>NIN / ID number</Label>
            <input name="nin" value={form.nin || ""} onChange={handle} className={fieldCls} placeholder="NIN or national ID" />
          </div>
        </div>
      )}

      {/* Emergency contact */}
      <div className="grid grid-cols-2 gap-3 mb-5 pt-2 border-t border-white/10">
        <p className="col-span-2 text-xs text-white/40 font-semibold uppercase tracking-wide pt-1">Emergency contact</p>
        <div>
          <Label>Name</Label>
          <input name="emergencyName" value={form.emergencyName || ""} onChange={handle} className={fieldCls} placeholder="Full name" />
        </div>
        <div>
          <Label>Phone</Label>
          <input name="emergencyPhone" value={form.emergencyPhone || ""} onChange={handle} className={fieldCls} placeholder="080..." />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="px-5 py-2 bg-white/10 text-white rounded-xl font-medium text-sm hover:bg-white/20 transition">
          Cancel
        </button>
        <button onClick={() => onSave(form)} className="px-5 py-2 bg-sky-400 text-black rounded-xl font-medium text-sm">
          Save changes
        </button>
      </div>
    </div>
  );
}

// ── Default profile ───────────────────────────────────────────────────────────
const DEFAULT_PROFILE = {
  name: "Eze Emeka", email: "", phone: "", homeAddress: "",
  dob: "", maritalStatus: "", occupation: "", companyName: "", position: "",
  industry: "", regNo: "", skill: "", experience: "", otherSkills: "",
  bio: "", availability: "", nin: "", emergencyName: "", emergencyPhone: "",
  photoUrl: "",
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN Dashboard
// ─────────────────────────────────────────────────────────────────────────────
export function Dashboard() {
  const location             = useLocation();
  const navigate             = useNavigate();
  const { state: store, dispatch } = useStore();

  const [mode,      setMode]      = useState("Private");
  const [activeTab, setActiveTab] = useState("Pending");
  const [modalType, setModalType] = useState(null);
  const [reviewReq, setReviewReq] = useState(null);

  // Persist profile separately (includes base64 photo)
  const [profile, setProfile] = useState(() => loadProfile() ?? DEFAULT_PROFILE);

  const saveAndSetProfile = (p) => { setProfile(p); saveProfile(p); };

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
    if (mode === "Staff")        setModalType("staff");
    else if (mode === "Organization") setModalType("organization");
    else                          setModalType("private");
  };

  const closeModal = () => { setModalType(null); setReviewReq(null); };

  // ── Derived data ────────────────────────────────────────────────────────
  const myRequests = store.requests; // In a real app, filter by user id

  const filtered = myRequests.filter((r) => {
    if (activeTab === "Pending")   return r.status === "Pending";
    if (activeTab === "Approved")  return r.status === "Approved";
    if (activeTab === "Active")    return r.status === "Active";
    if (activeTab === "Completed") return r.status === "Completed";
    return true;
  });

  const stats = {
    pending:   myRequests.filter((r) => r.status === "Pending").length,
    approved:  myRequests.filter((r) => r.status === "Approved").length,
    active:    myRequests.filter((r) => r.status === "Active").length,
    completed: myRequests.filter((r) => r.status === "Completed").length,
  };

  // Staff mode: find the matching staff record for rating display
  const staffRecord = store.staff.find((s) => s.name === profile.name || s.email === profile.email);

  // Profile display
  const initials   = (profile.name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const subTitle   = mode === "Staff"        ? (profile.skill || "Staff Member")
                   : mode === "Organization" ? (profile.position || "Organisation")
                   : (profile.occupation || "Private Client");

  // Handle review submission
  const handleReviewSubmit = ({ reqId, staffId, rating, comment }) => {
    dispatch({ type: "SUBMIT_REVIEW", reqId, staffId, rating, comment });
    closeModal();
  };

  return (
    <div className="min-h-screen bg-gray-100">

      {/* ── HEADER ── */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative w-full">
        <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e" alt="header" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/60" />

        <div className="relative z-10 px-4 pt-5 pb-6 sm:px-6 text-white">

          {/* Top bar */}
          <div className="flex items-center justify-between mb-6 pt-16">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-wide">DASHBOARD</h1>
            <div className="flex gap-2">
              <motion.button whileHover={{ scale: 1.05 }} onClick={() => setModalType("editProfile")}
                className="px-3 py-1.5 text-xs sm:text-sm rounded-lg bg-white/20 border border-white/30 backdrop-blur">
                Edit Profile
              </motion.button>
              {/* Admin panel link — visible for admin users; in production guard with role check */}
              <motion.button whileHover={{ scale: 1.05 }} onClick={() => navigate("/admin")}
                className="px-3 py-1.5 text-xs sm:text-sm rounded-lg bg-sky-400/30 border border-sky-400/50 backdrop-blur text-sky-200 font-medium">
                ⚙ Admin
              </motion.button>
            </div>
          </div>

          {/* Profile row */}
          <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <motion.div whileHover={{ scale: 1.05 }} onClick={() => setModalType("editProfile")} className="cursor-pointer">
                {profile.photoUrl ? (
                  <img src={profile.photoUrl} alt="avatar" className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-white object-cover" />
                ) : (
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-white bg-sky-400/30 flex items-center justify-center text-xl font-bold">
                    {initials}
                  </div>
                )}
              </motion.div>
              <div>
                <h2 className="font-bold text-base sm:text-lg">{profile.name}</h2>
                <p className="text-sm opacity-80">{subTitle}</p>
                {/* Staff: show rating */}
                {mode === "Staff" && staffRecord && (
                  <div className="mt-0.5">
                    <StarRating value={staffRecord.averageRating} />
                    <span className="text-xs text-white/50 ml-1">({staffRecord.totalReviews} reviews)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Switch Mode + action button */}
            <div className="flex flex-col gap-2 sm:items-end">
              <p className="text-xs font-bold text-white/80 uppercase tracking-wider">Switch Mode</p>
              <select
                value={mode} onChange={(e) => setMode(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg bg-white/10 text-white border border-white/30 backdrop-blur-md focus:outline-none focus:ring-1 focus:ring-sky-300/50"
              >
                {MODES.map((m) => <option key={m} value={m} className="bg-slate-900 text-white">{m}</option>)}
              </select>
              <motion.button
                onClick={handlePrimaryAction}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="px-5 py-2 rounded-lg text-sm font-semibold text-white shadow-lg bg-gradient-to-r from-sky-600 to-sky-400"
              >
                {mode === "Staff" ? "+ Get Job" : "+ Request Staff"}
              </motion.button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-5 flex gap-3 overflow-x-auto pb-1">
            <Stat label="Pending"  value={stats.pending} />
            <Stat label="Approved" value={stats.approved} />
            <Stat label="Active"   value={stats.active} />
            <Stat label="Completed" value={stats.completed} />
          </div>
        </div>
      </motion.div>

      {/* ── BODY ── */}
      <div className="p-4">

        {/* Tab bar */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {["Pending","Approved","Active","Completed"].map((tab) => (
            <motion.button key={tab} whileHover={{ scale: 1.04 }} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-sm font-medium flex-shrink-0 transition ${
                activeTab === tab ? "bg-sky-500 text-white shadow" : "bg-white text-gray-600 hover:bg-gray-50"
              }`}>
              {tab}
              {tab === "Pending" && stats.pending > 0 && (
                <span className="ml-1.5 bg-yellow-400 text-black text-xs rounded-full px-1.5 py-0.5 font-bold">{stats.pending}</span>
              )}
            </motion.button>
          ))}
        </div>

        {/* Empty state hint */}
        {filtered.length === 0 && (
          <div className="bg-white p-6 rounded-xl shadow text-center">
            <p className="text-gray-400 text-sm mb-1">
              {activeTab === "Pending"
                ? "No pending requests. Submit a new request using the button above."
                : activeTab === "Approved"
                ? "No approved requests yet. Requests appear here once the admin approves and sets dates."
                : activeTab === "Active"
                ? "No active jobs currently."
                : "No completed jobs yet."}
            </p>
          </div>
        )}

        {/* Request cards */}
        {filtered.map((r) => (
          <motion.div key={r.id} whileHover={{ scale: 1.005 }}
            className="bg-white p-4 rounded-xl shadow mb-3 space-y-3">

            {/* Header row */}
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <p className="font-semibold text-gray-900">{r.clientName}</p>
                <p className="text-xs text-gray-400">{r.clientType} · {r.location}</p>
                <p className="text-xs text-gray-400">{r.email} · {r.phone}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={r.status} />
                {/* Review button — only for Completed and not yet reviewed */}
                {r.status === "Completed" && !r.reviewed && (
                  <button onClick={() => { setReviewReq(r); setModalType("review"); }}
                    className="px-3 py-1 text-xs bg-purple-50 text-purple-700 rounded-full border border-purple-200 hover:bg-purple-100 transition font-medium">
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

            {/* Roles */}
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

            {/* Dates (shown once admin sets them on approval) */}
            {(r.startDate || r.endDate) && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Start Date" value={r.startDate} />
                <Field label="End Date"   value={r.endDate} />
              </div>
            )}

            {/* Assigned staff */}
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

            {/* Submission date */}
            <p className="text-xs text-gray-300">Submitted {new Date(r.submittedAt).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" })}</p>
          </motion.div>
        ))}

        {/* Staff mode: show assigned jobs */}
        {mode === "Staff" && (
          <div className="bg-white p-4 rounded-xl shadow mt-4">
            <h3 className="font-semibold mb-3 text-gray-800">My Assigned Jobs</h3>
            {store.requests.filter((r) => ["Active","Approved"].includes(r.status) && r.assignedStaff?.some((s) => s.name === profile.name)).length === 0 ? (
              <p className="text-gray-400 text-sm">No jobs assigned to you yet.</p>
            ) : (
              store.requests
                .filter((r) => ["Active","Approved"].includes(r.status) && r.assignedStaff?.some((s) => s.name === profile.name))
                .map((r) => (
                  <div key={r.id} className="p-3 border border-gray-100 rounded-xl mb-2 flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <p className="font-medium text-sm text-gray-900">{r.clientName}</p>
                      <p className="text-xs text-gray-400">{r.roles.map((x) => `${x.role} ×${x.quantity}`).join(", ")}</p>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={r.status} />
                      <div className="text-xs text-gray-400 mt-1">{r.startDate} → {r.endDate}</div>
                    </div>
                  </div>
                ))
            )}
            {/* Staff rating summary */}
            {staffRecord && (
              <div className="mt-4 p-3 bg-yellow-50 rounded-xl border border-yellow-100">
                <p className="text-xs text-yellow-700 font-semibold mb-1">Your rating</p>
                <StarRating value={staffRecord.averageRating} size="lg" />
                <p className="text-xs text-gray-400 mt-0.5">Based on {staffRecord.totalReviews} review{staffRecord.totalReviews !== 1 ? "s" : ""}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MODALS ── */}
      <Modal open={!!modalType} onClose={closeModal}>
        {modalType === "organization" && <ClientForm1 onSubmit={closeModal} />}
        {modalType === "private"      && <PrivateForm  onSubmit={closeModal} />}
        {modalType === "staff"        && <StaffForm    onSubmit={closeModal} />}

        {modalType === "review" && (
          <ReviewModal
            request={reviewReq}
            staffList={store.staff}
            onSubmit={handleReviewSubmit}
            onClose={closeModal}
          />
        )}

        {modalType === "editProfile" && (
          <EditProfileModal
            profile={profile}
            mode={mode}
            onSave={(p) => { saveAndSetProfile(p); closeModal(); }}
            onClose={closeModal}
          />
        )}
      </Modal>
    </div>
  );
}

export default Dashboard;