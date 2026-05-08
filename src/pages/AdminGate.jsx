// src/pages/AdminGate.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Password screen that sits in front of the admin panel.
// • URL is /admin-gate — not linked anywhere on the public site.
// • On success: sets sessionStorage flag → navigates to /adminpanel.
// • Session lasts until the browser tab is closed (sessionStorage).
// • Change ADMIN_PASSWORD below to whatever secret you want.
// • In production, move the password to an env variable:
//     const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;
//   then add  VITE_ADMIN_PASSWORD=yourSecret  to your .env file.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

// ⚠️  CHANGE THIS before going live.
// Better: use  import.meta.env.VITE_ADMIN_PASSWORD  and set it in .env
const ADMIN_PASSWORD = "stafflink@admin2026";

export default function AdminGate() {
  const navigate  = useNavigate();
  const [pw,      setPw]      = useState("");
  const [error,   setError]   = useState("");
  const [visible, setVisible] = useState(false);
  const [shaking, setShaking] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) {
      sessionStorage.setItem("sl_admin_admitted", "true");
      navigate("/adminpanel", { replace: true });
    } else {
      setError("Incorrect password. Access denied.");
      setPw("");
      // Shake animation
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(56,189,248,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.3) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Card */}
        <motion.div
          animate={shaking ? { x: [-8, 8, -6, 6, -4, 4, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="bg-slate-900 border border-slate-700 rounded-2xl p-8 shadow-2xl"
        >
          {/* Logo / title */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔐</span>
            </div>
            <h1 className="text-xl font-bold text-white">Admin Access</h1>
            <p className="text-sm text-slate-400 mt-1">StaffLink — Owner Panel</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Admin password
              </label>
              <div className="relative">
                <input
                  type={visible ? "text" : "password"}
                  value={pw}
                  onChange={(e) => { setPw(e.target.value); setError(""); }}
                  placeholder="Enter admin password"
                  autoFocus
                  className="w-full rounded-xl bg-slate-800 border border-slate-600 text-white px-4 py-3 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 transition placeholder-slate-500 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setVisible((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition text-sm"
                >
                  {visible ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-red-400 flex items-center gap-1"
              >
                ⚠️ {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={!pw}
              className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Enter Admin Panel →
            </button>
          </form>

          <p className="text-xs text-slate-600 text-center mt-6">
            This page is not publicly accessible.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}