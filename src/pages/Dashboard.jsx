import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ClientForm1 from "../ApplicationForms/ClientForm1";
import StaffForm from "../ApplicationForms/StaffForm";
import PrivateForm from "../ApplicationForms/PrivateForm";

const modes = ["Private", "Organization", "Staff"];

export function Stat({ label, value }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="bg-white/20 backdrop-blur px-4 py-2 rounded-lg flex-shrink-0"
    >
      <p className="text-xs opacity-80">{label}</p>
      <h4 className="font-bold text-sm sm:text-base">{value}</h4>
    </motion.div>
  );
}

export function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="font-medium text-sm">{value}</p>
    </div>
  );
}

export function Status({ status }) {
  const colors = {
    Active: "text-blue-600 bg-blue-50",
    Pending: "text-yellow-600 bg-yellow-50",
    Completed: "text-green-600 bg-green-50",
  };
  return (
    <span
      className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${colors[status]}`}
    >
      {status}
    </span>
  );
}

/* ── Universal Modal ── */
function UniversalModal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Glow */}
          <div className="absolute inset-0 bg-sky-400/10 blur-3xl rounded-xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-slate-700
            border border-white/20 text-white flex items-center justify-center
            hover:bg-slate-600 transition"
          >
            ✕
          </button>

          <div className="relative">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ── Main Dashboard ── */
export function Dashboard() {
  const location = useLocation();

  const [mode, setMode] = useState("Private");
  const [activeTab, setActiveTab] = useState("Active");
  const [modalType, setModalType] = useState(null); // "private" | "organization" | "staff"
  const [requests, setRequests] = useState([]);

  // ── Auto-open modal when navigated from HireStaffModal ──
  useEffect(() => {
    if (location.state?.openModal) {
      const type = location.state.openModal;

      // Switch mode to match the form type
      if (type === "private") setMode("Private");
      if (type === "organization") setMode("Organization");

      // Small delay so the mode switch renders before modal opens
      setTimeout(() => setModalType(type), 100);

      // Clear navigation state so refresh doesn't re-trigger
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handlePrimaryAction = () => {
    if (mode === "Staff") setModalType("staff");
    else if (mode === "Organization") setModalType("organization");
    else setModalType("private");
  };

  const handleFormSubmit = (data, type) => {
    const newRequest = {
      id: Date.now(),
      status: "Pending",
      skill:
        data?.requestedStaff?.[0]?.role ||
        data?.employees?.[0]?.name ||
        "General",
      qty:
        data?.requestedStaff?.[0]?.quantity ||
        data?.employees?.[0]?.quantity ||
        1,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: "—",
      display:
        type === "organization"
          ? data?.companyDetails?.companyName
          : type === "private"
          ? data?.personalDetails?.surname
          : data?.surname || "—",
    };
    setRequests((prev) => [...prev, newRequest]);
    setModalType(null);
  };

  const filtered = requests.filter((r) => r.status === activeTab);
  const matchedJobs = requests.filter((r) => r.status === "Active");

  return (
    <div className="min-h-screen bg-gray-100">

      {/* ── HEADER ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full"
      >
        <img
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e"
          alt="header"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/55" />

        <div className="relative z-10 px-4 pt-5 pb-6 sm:px-6 text-white">
          <div className="flex items-center justify-between mb-6 pt-20">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-wide">
              DASHBOARD
            </h1>
            <motion.button
              whileHover={{ scale: 1.05 }}
              className="px-3 py-1.5 text-xs sm:text-sm rounded-lg bg-white/20 border border-white/30 backdrop-blur"
            >
              Edit Profile
            </motion.button>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <motion.img
                whileHover={{ scale: 1.08 }}
                src="https://via.placeholder.com/60"
                alt="avatar"
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-white object-cover"
              />
              <div>
                <h2 className="font-bold text-base sm:text-lg">Eze Emeka</h2>
                <p className="text-xs sm:text-sm opacity-80">
                  {mode === "Private" && "Private Client"}
                  {mode === "Organization" && "Company Manager"}
                  {mode === "Staff" && "Electrician"}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:items-end">
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg bg-white/10 text-white border
                border-white/30 backdrop-blur-md focus:outline-none focus:ring-1
                focus:ring-sky-300/50"
              >
                {modes.map((m) => (
                  <option key={m} value={m} className="bg-slate-900 text-white">
                    {m}
                  </option>
                ))}
              </select>

              <motion.button
                onClick={handlePrimaryAction}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
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
            <Stat label="Active Requests" value={requests.length} />
            <Stat
              label="Pending"
              value={requests.filter((r) => r.status === "Pending").length}
            />
            {mode === "Staff" && (
              <Stat label="Matched Jobs" value={matchedJobs.length} />
            )}
          </div>
        </div>
      </motion.div>

      {/* ── BODY ── */}
      <div className="p-4">
        <div className="flex gap-2 mb-4">
          {["Active", "Pending", "Completed"].map((tab) => (
            <motion.button
              key={tab}
              whileHover={{ scale: 1.05 }}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                activeTab === tab
                  ? "bg-sky-500 text-white"
                  : "bg-white text-gray-700"
              }`}
            >
              {tab}
            </motion.button>
          ))}
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="font-semibold mb-4">Requests</h3>
          {filtered.length === 0 ? (
            <p className="text-gray-400 text-sm">
              No {activeTab.toLowerCase()} requests.
            </p>
          ) : (
            filtered.map((r) => (
              <motion.div
                key={r.id}
                whileHover={{ scale: 1.02 }}
                className="p-4 border rounded-xl flex flex-col md:flex-row
                md:justify-between gap-4 mb-3"
              >
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3 w-full">
                  {(mode === "Organization" || mode === "Private") && (
                    <Field label="Name" value={r.display} />
                  )}
                  <Field label="Skill" value={r.skill} />
                  <Field label="Qty" value={r.qty} />
                  <Field label="Start Date" value={r.startDate} />
                  <Field label="End Date" value={r.endDate} />
                  <Status status={r.status} />
                </div>
              </motion.div>
            ))
          )}
        </div>

        {mode === "Staff" && matchedJobs.length > 0 && (
          <div className="bg-white p-4 rounded-xl shadow mt-6">
            <h3 className="font-semibold mb-3">Active Jobs</h3>
            {matchedJobs.map((job) => (
              <div key={job.id} className="p-3 border rounded mb-2">
                {job.skill} - {job.qty} needed
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── MODAL ── */}
      <UniversalModal open={!!modalType} onClose={() => setModalType(null)}>
        {modalType === "organization" && (
          <ClientForm1
            onSubmit={(data) => handleFormSubmit(data, "organization")}
          />
        )}
        {modalType === "private" && (
          <PrivateForm
            onSubmit={(data) => handleFormSubmit(data, "private")}
          />
        )}
        {modalType === "staff" && (
          <StaffForm
            onSubmit={(data) => handleFormSubmit(data, "staff")}
          />
        )}
      </UniversalModal>
    </div>
  );
}

export default Dashboard;