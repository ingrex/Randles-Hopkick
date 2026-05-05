// src/pages/Login.jsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "./AuthContext"; // ✅ use AuthContext login

/* ───────── VALIDATION ───────── */
function validate(fields) {
  const e = {};
  if (!fields.email.trim()) e.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email))
    e.email = "Invalid email";
  if (!fields.password.trim()) e.password = "Password required";
  else if (fields.password.length < 6) e.password = "Min 6 characters";
  return e;
}

/* ───────── COMPONENT ───────── */
export function Login({ onNavigateToRegister, onGoHome, onGoDashboard }) {
  const { login } = useAuth(); // ✅ AuthContext login — sets user state correctly

  const [fields, setFields]     = useState({ email: "", password: "" });
  const [errors, setErrors]     = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [done, setDone]         = useState(false);
  const [userData, setUserData] = useState(null);

  const set = (k, v) => {
    setFields((f) => ({ ...f, [k]: v }));
    setApiError("");
    if (errors[k]) setErrors((e) => { const c = { ...e }; delete c[k]; return c; });
  };

  const handleSubmit = async () => {
    const errs = validate(fields);
    if (Object.keys(errs).length) return setErrors(errs);

    setLoading(true);
    setApiError("");

    try {
      // ✅ This calls AuthContext's login() which:
      //    1. Hits the API
      //    2. Sets user state (so ProtectedRoute sees it)
      //    3. Saves to localStorage under "user" key
      const result = await login(fields.email, fields.password);

      if (!result.success) {
        setApiError(result.message || "Login failed");
        return;
      }

      // Also save token if returned (for API calls that need Bearer token)
      const stored = localStorage.getItem("user");
      if (stored) setUserData(JSON.parse(stored));

      setDone(true);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const pct = ((!!fields.email + !!fields.password) / 2) * 100;

  const displayName =
    userData?.surname ||
    userData?.otherNames ||
    userData?.email ||
    "there";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030410] text-white relative overflow-hidden">

      {/* BACKGROUND GLOW */}
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full blur-[90px]"
        animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0] }}
        transition={{ duration: 12, repeat: Infinity }}
        style={{ background: "radial-gradient(circle, rgba(120,60,240,0.4), transparent)" }}
      />

      {/* CARD */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-[420px] max-w-[95%] p-8 rounded-3xl"
        style={{
          background: "rgba(255,255,255,0.07)",
          backdropFilter: "blur(25px)",
          border: "1px solid rgba(255,255,255,0.15)",
        }}
      >
        {/* BRAND */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg border border-dashed border-white/40 flex items-center justify-center text-xs text-white/50">
            Logo
          </div>
          <span className="text-sm tracking-widest text-white/70 uppercase">
            Randle&Hopkick
          </span>
        </div>

        {/* NAV TABS — hide after success */}
        {!done && (
          <div className="flex bg-white/10 rounded-full p-1 mb-6">
            <button className="flex-1 py-2 rounded-full bg-gradient-to-r from-purple-400 to-blue-400">
              Sign In
            </button>
            <button
              onClick={onNavigateToRegister}
              className="flex-1 py-2 text-white/50"
            >
              Register
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">

          {/* ── SUCCESS SCREEN ── */}
          {done ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="text-center py-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: "linear-gradient(135deg,#a78bfa,#60a5fa)" }}
              >
                <span className="text-4xl">✓</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <h2 className="text-2xl font-semibold mb-1">
                  Welcome back, {displayName}! 🎉
                </h2>
                <p className="text-white/50 text-sm mb-8">
                  You're signed in successfully. Where would you like to go?
                </p>

                <div className="flex flex-col gap-3">
                  {/* ✅ onGoDashboard is now passed from App.jsx — user state
                      is already set so ProtectedRoute will let them through */}
                  <button
                    onClick={onGoDashboard}
                    className="w-full py-3 rounded-xl font-medium transition-opacity hover:opacity-90"
                    style={{ background: "linear-gradient(135deg,#a78bfa,#60a5fa)" }}
                  >
                    Go to Dashboard →
                  </button>
                  <button
                    onClick={onGoHome}
                    className="w-full py-3 rounded-xl font-medium bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    Go to Home
                  </button>
                </div>
              </motion.div>
            </motion.div>

          ) : (

            /* ── FORM ── */
            <motion.div
              key="form"
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
            >
              <div className="h-1 bg-white/10 rounded mb-6">
                <div
                  className="h-full rounded transition-all duration-300"
                  style={{
                    width: `${pct}%`,
                    background: "linear-gradient(90deg,#a78bfa,#60a5fa)",
                  }}
                />
              </div>

              <h2 className="text-xl mb-1">Welcome back</h2>
              <p className="text-sm text-white/50 mb-4">Sign in to continue</p>

              {apiError && (
                <div className="bg-red-500/10 border border-red-400 p-3 rounded mb-4 text-sm text-red-300">
                  ⚠ {apiError}
                </div>
              )}

              <div className="mb-4">
                <input
                  type="email"
                  placeholder="Email"
                  value={fields.email}
                  onChange={(e) => set("email", e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 outline-none focus:border-purple-400"
                />
                {errors.email && (
                  <p className="text-red-400 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              <div className="mb-4 relative">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Password"
                  value={fields.password}
                  onChange={(e) => set("password", e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 outline-none focus:border-purple-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50"
                >
                  {showPass ? "🙈" : "👁"}
                </button>
                {errors.password && (
                  <p className="text-red-400 text-xs mt-1">{errors.password}</p>
                )}
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-3 rounded-xl disabled:opacity-60 transition-opacity"
                style={{ background: "linear-gradient(135deg,#a78bfa,#60a5fa)" }}
              >
                {loading ? "Signing in…" : "Sign In →"}
              </button>

              <p className="text-center text-sm text-white/50 mt-4">
                Don't have an account?{" "}
                <button
                  onClick={onNavigateToRegister}
                  className="text-purple-300 hover:underline"
                >
                  Create one
                </button>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default Login;