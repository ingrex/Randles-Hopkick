// src/pages/Login.jsx
// Changes from original:
//   1. Import ForgotPasswordModal
//   2. Add showForgotModal state
//   3. Render <ForgotPasswordModal> at the bottom of the component
//   4. "Forgot password?" button now sets showForgotModal(true) instead of calling onNavigateToForgotPassword

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "./AuthContext";
import { Home } from "lucide-react";
import Logo from "../components/Logo";
import { ForgotPasswordModal } from "./ForgotPasswordModal"; // ← NEW

/* ───────── SVG EYE ICONS ───────── */
function EyeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeSlashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="2" y1="2" x2="22" y2="22" />
      <path d="M6.71 6.71A10.94 10.94 0 0 0 1 12s4 8 11 8c2.35 0 4.47-.82 6.13-2.13" />
      <path d="M17.47 17.47A10.94 10.94 0 0 0 23 12S19 4 12 4c-1.29 0-2.54.22-3.71.63" />
      <path d="M9.53 9.53A3 3 0 0 0 12 15a3 3 0 0 0 2.47-1.47" />
    </svg>
  );
}

/* ───────── VALIDATION ───────── */
function validate(fields) {
  const e = {};
  if (!fields.email.trim()) {
    e.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    e.email = "Invalid email";
  }
  if (!fields.password.trim()) {
    e.password = "Password required";
  } else if (fields.password.length < 6) {
    e.password = "Min 6 characters";
  }
  return e;
}

/* ───────── COMPONENT ───────── */
export function Login({
  onNavigateToRegister,
  onGoHome,
  onGoDashboard,
  // onNavigateToForgotPassword is no longer needed — modal handles it internally
}) {
  const { login } = useAuth();

  const [fields, setFields] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [done, setDone] = useState(false);
  const [userData, setUserData] = useState(null);
  const [showForgotModal, setShowForgotModal] = useState(false); // ← NEW

  const set = (k, v) => {
    setFields((f) => ({ ...f, [k]: v }));
    setApiError("");
    if (errors[k]) {
      setErrors((e) => { const c = { ...e }; delete c[k]; return c; });
    }
  };

  const handleSubmit = async () => {
    const errs = validate(fields);
    if (Object.keys(errs).length) return setErrors(errs);

    setLoading(true);
    setApiError("");

    try {
      const result = await login(fields.email, fields.password);
      if (!result.success) {
        setApiError(result.message || "Login failed");
        return;
      }

      const stored = localStorage.getItem("user");
      if (stored) {
        const parsedUser = JSON.parse(stored);
        setUserData(parsedUser);
      }
      setDone(true);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const pct = ((!!fields.email + !!fields.password) / 2) * 100;

  const displayName =
    userData?.username || userData?.name || userData?.fullName ||
    userData?.firstName || userData?.surname || userData?.otherNames ||
    userData?.email?.split("@")[0] || "there";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030410] text-white relative overflow-hidden">

      {/* BACKGROUND GLOW */}
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full blur-[90px]"
        animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0] }}
        transition={{ duration: 12, repeat: Infinity }}
        style={{ background: "radial-gradient(circle, rgba(35,133,205,0.35), transparent)" }}
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
        {/* BRAND + HOME BUTTON */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg border border-dashed border-white/40 flex items-center justify-center text-xs text-white/50">
              <Logo />
            </div>
            <span className="text-sm tracking-widest text-white/70 uppercase">
              Randle&Hopkick
            </span>
          </div>

          <button
            onClick={onGoHome}
            className="flex items-center gap-2 px-3 py-2 rounded-full
              bg-white/10 backdrop-blur-md border border-white/20
              text-white/80 text-xs font-medium
              hover:text-white hover:border-[#2385cd]
              hover:bg-[#2385cd]/10
              hover:shadow-[0_0_15px_rgba(35,133,205,0.35)]
              hover:scale-105 active:scale-95
              transition-all duration-300"
          >
            <Home size={14} />
            Home
          </button>
        </div>

        {/* NAV TABS */}
        {!done && (
          <div className="flex bg-white/10 rounded-full p-1 mb-6">
            <button
              className="flex-1 py-2 rounded-full"
              style={{ background: "linear-gradient(135deg, #1a6dbd, #2385cd)" }}
            >
              Sign In
            </button>
            <button onClick={onNavigateToRegister} className="flex-1 py-2 text-white/50">
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
                style={{ background: "linear-gradient(135deg, #1a6dbd, #2385cd, #42aae8)" }}
              >
                <span className="text-4xl">✓</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <h2 className="text-2xl font-semibold mb-1">Welcome back! 🎉</h2>
                <p className="text-white/50 text-sm mb-8">
                  You're signed in successfully. Where would you like to go?
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={onGoDashboard}
                    className="w-full py-3 rounded-xl font-medium transition-opacity hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, #1a6dbd, #2385cd, #42aae8)" }}
                  >
                    Dashboard →
                  </button>
                  <button
                    onClick={onGoHome}
                    className="w-full py-3 rounded-xl font-medium bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    Home
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
                    background: "linear-gradient(90deg, #1a6dbd, #2385cd, #42aae8)",
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

              {/* EMAIL */}
              <div className="mb-4">
                <input
                  type="email"
                  placeholder="Email"
                  value={fields.email}
                  onChange={(e) => set("email", e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 outline-none focus:border-[#2385cd]"
                />
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
              </div>

              {/* PASSWORD */}
              <div className="mb-1 relative">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Password"
                  value={fields.password}
                  onChange={(e) => set("password", e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 outline-none focus:border-[#2385cd] pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? <EyeSlashIcon /> : <EyeIcon />}
                </button>
                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
              </div>

              {/* ── FORGOT PASSWORD — opens modal ── */}
              <div className="flex justify-end mb-5 mt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)} // ← CHANGED
                  className="text-xs hover:underline transition-colors"
                  style={{ color: "#42aae8" }}
                >
                  Forgot password?
                </button>
              </div>

              {/* SUBMIT */}
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-3 rounded-xl disabled:opacity-60 transition-opacity hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #1a6dbd, #2385cd, #42aae8)" }}
              >
                {loading ? "Signing in…" : "Sign In →"}
              </button>

              <p className="text-center text-sm text-white/50 mt-4">
                Don't have an account?{" "}
                <button onClick={onNavigateToRegister} style={{ color: "#42aae8" }} className="hover:underline">
                  Sign Up
                </button>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── FORGOT PASSWORD MODAL ── */}
      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
      />
    </div>
  );
}

export default Login;