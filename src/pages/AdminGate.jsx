

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, Eye, EyeOff, AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import { apiAdminGateLogin } from "../api/auth";

export function AdminGate() {
  const navigate = useNavigate();

  const [pw,      setPw]      = useState("");
  const [error,   setError]   = useState("");
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shaking, setShaking] = useState(false);

  const shake = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await apiAdminGateLogin({ password: pw });
      sessionStorage.setItem("sl_admin_admitted", "true");
      navigate("/adminpanel", { replace: true });
    } catch (err) {
      setError(err.message || "Incorrect password. Access denied.");
      setPw("");
      shake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(56,189,248,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.3) 1px, transparent 1px)",
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
              <ShieldCheck className="w-7 h-7 text-sky-400" />
            </div>
            <h1 className="text-xl font-bold text-white">Admin Access</h1>
            <p className="text-sm text-slate-400 mt-1">Owner Panel</p>
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                >
                  {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-red-400 flex items-center gap-1.5"
              >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={!pw || loading}
              className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying…
                </>
              ) : (
                <>
                  Enter Admin Panel
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
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

export default AdminGate;