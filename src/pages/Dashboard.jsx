// src/pages/Dashboard.jsx
// ─── Changes from original ────────────────────────────────────────────────────
// 1. Reads requests from shared store (no local state for requests).
// 2. "Active" tab shows only requests with status === "Active" (set by admin).
// 3. Each request card shows ALL roles & quantities correctly from the store.
// 4. Start date / end date now come from the store (set via AdminPanel).
// 5. Requests list shows assigned staff names.
// 6. Review button appears on Active cards.
// 7. Full Edit Profile modal (name, phone, location, avatar initials).
// 8. Stats reflect real store counts.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ClientForm1  from "../ApplicationForms/ClientForm1";
import StaffForm    from "../ApplicationForms/StaffForm";
import PrivateForm  from "../ApplicationForms/PrivateForm";
import { useStore } from "../store";

const modes = ["Private", "Organization", "Staff"];

// ── small shared components ───────────────────────────────────────────────────
export function Stat({ label, value }) {
  return (
    <motion.div whileHover={{ scale: 1.05 }} className="bg-white/20 backdrop-blur px-4 py-2 rounded-lg flex-shrink-0">
      <p className="text-xs opacity-80">{label}</p>
      <h4 className="font-bold text-sm sm:text-base">{value}</h4>
    </motion.div>
  );
}

export function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="font-medium text-sm">{value || "—"}</p>
    </div>
  );
}

export function StatusBadge({ status }) {
  const map = {
    Active:   "text-blue-600 bg-blue-50",
    Pending:  "text-yellow-600 bg-yellow-50",
    Approved: "text-green-600 bg-green-50",
    Rejected: "text-red-600 bg-red-50",
  };
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${map[status] ?? "text-gray-600 bg-gray-50"}`}>
      {status}
    </span>
  );
}

// ── Universal Modal ───────────────────────────────────────────────────────────
function UniversalModal({ open, onClose, children }) {
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
          <button
            onClick={onClose}
            className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-slate-700 border border-white/20 text-white flex items-center justify-center hover:bg-slate-600 transition"
          >✕</button>
          <div className="relative">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Review Modal (read-only job detail) ──────────────────────────────────────
function ReviewModal({ request, onClose }) {
  if (!request) return null;
  return (
    <div className="w-full p-6 text-white rounded-xl bg-white/10 backdrop-blur-xl border border-white/10 shadow-lg space-y-4">
      <h2 className="text-xl font-semibold">Job Detail</h2>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div><p className="text-white/50 text-xs">Client</p><p className="font-medium">{request.clientName}</p></div>
        <div><p className="text-white/50 text-xs">Type</p><p className="font-medium">{request.clientType}</p></div>
        <div><p className="text-white/50 text-xs">Start date</p><p className="font-medium">{request.startDate || "—"}</p></div>
        <div><p className="text-white/50 text-xs">End date</p><p className="font-medium">{request.endDate || "—"}</p></div>
      </div>
      <div>
        <p className="text-white/50 text-xs mb-2">Roles</p>
        <div className="flex flex-wrap gap-2">
          {request.roles.map((r, i) => (
            <span key={i} className="bg-sky-400/20 text-sky-300 border border-sky-400/30 rounded-lg px-3 py-1 text-sm">
              {r.role} × {r.quantity}
            </span>
          ))}
        </div>
      </div>
      {request.assignedStaff?.length > 0 && (
        <div>
          <p className="text-white/50 text-xs mb-2">Assigned staff</p>
          <div className="flex flex-wrap gap-2">
            {request.assignedStaff.map((s) => (
              <span key={s.id} className="bg-green-400/20 text-green-300 border border-green-400/30 rounded-lg px-3 py-1 text-sm">
                {s.name}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="flex justify-end">
        <button onClick={onClose} className="px-5 py-2 bg-sky-400 text-black rounded-xl font-medium text-sm">Close</button>
      </div>
    </div>
  );
}

// ── Edit Profile Modal ────────────────────────────────────────────────────────
function EditProfileModal({ profile, onSave, onClose }) {
  const [form, setForm] = useState({ ...profile });
  const handle = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  const initials = form.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="w-full p-6 text-white rounded-xl bg-white/10 backdrop-blur-xl border border-white/10 shadow-lg space-y-5">
      <h2 className="text-xl font-semibold">Edit Profile</h2>

      {/* avatar preview */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-sky-400/30 border-2 border-sky-400/60 flex items-center justify-center text-sky-200 text-xl font-bold">
          {initials}
        </div>
        <div>
          <p className="text-sm font-medium">{form.name}</p>
          <p className="text-xs text-white/50">{form.mode === "Staff" ? form.jobTitle : form.mode + " Client"}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 flex flex-col gap-1">
          <label className="text-xs text-white/50">Full name</label>
          <input name="name" value={form.name} onChange={handle}
            className="rounded-xl px-3 py-2 bg-white/10 border border-white/20 text-white outline-none focus:border-sky-400/60 transition text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-white/50">Email</label>
          <input name="email" value={form.email} onChange={handle}
            className="rounded-xl px-3 py-2 bg-white/10 border border-white/20 text-white outline-none focus:border-sky-400/60 transition text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-white/50">Phone</label>
          <input name="phone" value={form.phone} onChange={handle}
            className="rounded-xl px-3 py-2 bg-white/10 border border-white/20 text-white outline-none focus:border-sky-400/60 transition text-sm" />
        </div>
        <div className="col-span-2 flex flex-col gap-1">
          <label className="text-xs text-white/50">Location</label>
          <input name="location" value={form.location} onChange={handle}
            className="rounded-xl px-3 py-2 bg-white/10 border border-white/20 text-white outline-none focus:border-sky-400/60 transition text-sm" />
        </div>
        {form.mode === "Staff" && (
          <div className="col-span-2 flex flex-col gap-1">
            <label className="text-xs text-white/50">Job title / skill</label>
            <input name="jobTitle" value={form.jobTitle || ""} onChange={handle}
              className="rounded-xl px-3 py-2 bg-white/10 border border-white/20 text-white outline-none focus:border-sky-400/60 transition text-sm" />
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-1">
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

// ── Main Dashboard ────────────────────────────────────────────────────────────
export function Dashboard() {
  const location          = useLocation();
  const { state: store }  = useStore();

  const [mode,       setMode]       = useState("Private");
  const [activeTab,  setActiveTab]  = useState("Pending");
  const [modalType,  setModalType]  = useState(null);   // "private"|"organization"|"staff"|"review"|"editProfile"
  const [reviewReq,  setReviewReq]  = useState(null);

  // profile state (per-user; would come from auth context in a real app)
  const [profile, setProfile] = useState({
    name: "Eze Emeka", email: "eze@mail.com", phone: "08012345678",
    location: "Lekki, Lagos", mode: "Private", jobTitle: "",
  });

  // auto-open modal from navigation state (e.g. HireStaffModal)
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

  // ── derive filtered requests from store ──────────────────────────────────
  // For "Staff" mode we'd show jobs the staff member is assigned to.
  // For client modes we filter by clientName matching this user's profile.
  // In a real app this would filter by userId; here we show all requests for demo.
  const myRequests = store.requests;

  const filtered = myRequests.filter((r) => {
    if (activeTab === "Active")    return r.status === "Active";
    if (activeTab === "Pending")   return r.status === "Pending";
    if (activeTab === "Approved")  return r.status === "Approved";
    if (activeTab === "Completed") return r.status === "Completed";
    return true;
  });

  // ── stats ────────────────────────────────────────────────────────────────
  const statCounts = {
    active:   myRequests.filter((r) => r.status === "Active").length,
    pending:  myRequests.filter((r) => r.status === "Pending").length,
    approved: myRequests.filter((r) => r.status === "Approved").length,
  };

  const initials = profile.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-gray-100">

      {/* ── HEADER ── */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative w-full">
        <img
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e"
          alt="header background"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/55" />

        <div className="relative z-10 px-4 pt-5 pb-6 sm:px-6 text-white">
          <div className="flex items-center justify-between mb-6 pt-20">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-wide">DASHBOARD</h1>
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => setModalType("editProfile")}
              className="px-3 py-1.5 text-xs sm:text-sm rounded-lg bg-white/20 border border-white/30 backdrop-blur"
            >
              Edit Profile
            </motion.button>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.08 }}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-white bg-sky-400/30 flex items-center justify-center text-white text-lg font-bold"
              >
                {initials}
              </motion.div>
              <div>
                <h2 className="font-bold text-base sm:text-lg">{profile.name}</h2>
                <p className="text-xs sm:text-sm opacity-80">
                  {mode === "Private"      && "Private Client"}
                  {mode === "Organization" && "Company Manager"}
                  {mode === "Staff"        && (profile.jobTitle || "Staff Member")}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:items-end">
              <select
                value={mode} onChange={(e) => setMode(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg bg-white/10 text-white border border-white/30 backdrop-blur-md focus:outline-none focus:ring-1 focus:ring-sky-300/50"
              >
                {modes.map((m) => (
                  <option key={m} value={m} className="bg-slate-900 text-white">{m}</option>
                ))}
              </select>
              <motion.button
                onClick={handlePrimaryAction}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className={`px-5 py-2 rounded-lg text-sm font-semibold text-white shadow-lg ${
                  mode === "Staff"
                    ? "bg-gradient-to-r from-sky-300 to-sky-600"
                    : "bg-gradient-to-r from-sky-600 to-sky-300"
                }`}
              >
                {mode === "Staff" ? "+ Get Job" : "+ Request Staff"}
              </motion.button>
            </div>
          </div>

          <div className="mt-5 flex gap-3 overflow-x-auto">
            <Stat label="Total Requests"   value={myRequests.length} />
            <Stat label="Pending"          value={statCounts.pending} />
            <Stat label="Approved"         value={statCounts.approved} />
            {mode === "Staff" && <Stat label="Active Jobs" value={statCounts.active} />}
          </div>
        </div>
      </motion.div>

      {/* ── BODY ── */}
      <div className="p-4">
        {/* Tab bar */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {["Pending", "Approved", "Active", "Completed"].map((tab) => (
            <motion.button
              key={tab}
              whileHover={{ scale: 1.05 }}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-sm font-medium flex-shrink-0 ${
                activeTab === tab ? "bg-sky-500 text-white" : "bg-white text-gray-700"
              }`}
            >
              {tab}
            </motion.button>
          ))}
        </div>

        {/* Requests list */}
        <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="font-semibold mb-4">
            {activeTab === "Active"
              ? "Active Jobs (approved & scheduled)"
              : activeTab + " Requests"}
          </h3>

          {filtered.length === 0 ? (
            <p className="text-gray-400 text-sm">
              {activeTab === "Active"
                ? "No active jobs yet. Requests become active once the admin approves and sets dates."
                : `No ${activeTab.toLowerCase()} requests.`}
            </p>
          ) : (
            filtered.map((r) => (
              <motion.div
                key={r.id}
                whileHover={{ scale: 1.01 }}
                className="p-4 border rounded-xl flex flex-col gap-3 mb-3"
              >
                {/* Top row: client + status + review button */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="font-semibold text-sm">{r.clientName}</p>
                    <p className="text-xs text-gray-400">{r.clientType} · {r.location}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={r.status} />
                    {r.status === "Active" && (
                      <button
                        onClick={() => { setReviewReq(r); setModalType("review"); }}
                        className="px-3 py-1 text-xs bg-sky-50 text-sky-600 rounded-full border border-sky-200 hover:bg-sky-100 transition font-medium"
                      >
                        Review
                      </button>
                    )}
                  </div>
                </div>

                {/* Roles — shows ALL roles with correct quantities */}
                <div>
                  <p className="text-xs text-gray-400 mb-1">Roles requested</p>
                  <div className="flex flex-wrap gap-2">
                    {r.roles.map((role, i) => (
                      <span key={i} className="text-xs bg-sky-50 text-sky-700 border border-sky-200 rounded-full px-2 py-0.5">
                        {role.role} × {role.quantity}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Dates (only shown once set by admin) */}
                {(r.startDate || r.endDate) && (
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Start Date" value={r.startDate} />
                    <Field label="End Date"   value={r.endDate} />
                  </div>
                )}

                {/* Assigned staff (only shown if assigned) */}
                {r.assignedStaff?.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Assigned staff</p>
                    <div className="flex flex-wrap gap-2">
                      {r.assignedStaff.map((s) => (
                        <span key={s.id} className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5">
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>

        {/* Staff mode: show active jobs they are assigned to */}
        {mode === "Staff" && (
          <div className="bg-white p-4 rounded-xl shadow mt-4">
            <h3 className="font-semibold mb-3">My Assigned Jobs</h3>
            {store.requests
              .filter((r) => r.status === "Active" && r.assignedStaff?.some((s) => s.name === profile.name))
              .length === 0 ? (
              <p className="text-gray-400 text-sm">No jobs assigned yet.</p>
            ) : (
              store.requests
                .filter((r) => r.status === "Active" && r.assignedStaff?.some((s) => s.name === profile.name))
                .map((r) => (
                  <div key={r.id} className="p-3 border rounded-xl mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm">{r.clientName}</p>
                      <StatusBadge status={r.status} />
                    </div>
                    <div className="flex gap-4 text-xs text-gray-500">
                      <span>Start: {r.startDate || "—"}</span>
                      <span>End: {r.endDate || "—"}</span>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}
      </div>

      {/* ── MODALS ── */}
      <UniversalModal open={!!modalType} onClose={() => { setModalType(null); setReviewReq(null); }}>
        {modalType === "organization" && (
          <ClientForm1 onSubmit={() => setModalType(null)} />
        )}
        {modalType === "private" && (
          <PrivateForm onSubmit={() => setModalType(null)} />
        )}
        {modalType === "staff" && (
          <StaffForm onSubmit={() => setModalType(null)} />
        )}
        {modalType === "review" && (
          <ReviewModal request={reviewReq} onClose={() => { setModalType(null); setReviewReq(null); }} />
        )}
        {modalType === "editProfile" && (
          <EditProfileModal
            profile={{ ...profile, mode }}
            onSave={(updated) => { setProfile(updated); setModalType(null); }}
            onClose={() => setModalType(null)}
          />
        )}
      </UniversalModal>
    </div>
  );
}

export default Dashboard;