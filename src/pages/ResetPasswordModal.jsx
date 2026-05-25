// src/pages/ResetPasswordModal.jsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock } from "lucide-react";
import { apiResetPassword } from "./auth";

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

function validate({ password, confirmPassword }) {
  const e = {};
  if (!password.trim()) e.password = "Password is required";
  else if (password.length < 6) e.password = "Min 6 characters";
  if (!confirmPassword.trim()) e.confirmPassword = "Please confirm your password";
  else if (password !== confirmPassword) e.confirmPassword = "Passwords do not match";
  return e;
}

export function ResetPasswordModal({ isOpen, token, onClose, onSuccess }) {
  const [fields, setFields] = useState({ password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const set = (k, v) => {
    setFields((f) => ({ ...f, [k]: v }));
    setApiError("");
    if (errors[k]) setErrors((e) => { const c = { ...e }; delete c[k]; return c; });
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setFields({ password: "", confirmPassword: "" });
      setErrors({});
      setApiError("");
      setLoading(false);
      setDone(false);
    }, 300);
  };

  const handleSubmit = async () => {
    if (!token) {
      setApiError("Reset token is missing or invalid. Please request a new link.");
      return;
    }
    const errs = validate(fields);
    if (Object.keys(errs).length) return setErrors(errs);

    setLoading(true);
    setApiError("");

    try {
      await apiResetPassword({
        token,
        password: fields.password,
        confirmPassword: fields.confirmPassword,
      });
      setDone(true);
    } catch (err) {
      setApiError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const pct = ((!!fields.password + !!fields.confirmPassword) / 2) * 100;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* BACKDROP */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={handleClose}
            className="fixed inset-0 z-40"
            style={{ background: "rgba(3,4,16,0.75)", backdropFilter: "blur(6px)" }}
          />

          {/* MODAL */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 32, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.35, type: "spring", stiffness: 260, damping: 24 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="w-[420px] max-w-full p-8 rounded-3xl relative"
              style={{
                background: "rgba(255,255,255,0.09)",
                backdropFilter: "blur(30px)",
                border: "1px solid rgba(255,255,255,0.18)",
              }}
            >
              {/* CLOSE */}
              <button
                onClick={handleClose}
                className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center
                  bg-white/10 border border-white/20 text-white/50
                  hover:text-white hover:bg-white/20 hover:scale-105
                  active:scale-95 transition-all duration-200"
                aria-label="Close"
              >
                <X size={14} />
              </button>

              <AnimatePresence mode="wait">

                {/* ── SUCCESS ── */}
                {done ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.35 }}
                    className="text-center py-2"
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
                      <h2 className="text-2xl font-semibold mb-1 text-white">Password updated!</h2>
                      <p className="text-white/50 text-sm mb-8">
                        Your password has been reset successfully. You can now sign in.
                      </p>
                      <button
                        onClick={() => { handleClose(); onSuccess?.(); }}
                        className="w-full py-3 rounded-xl font-medium transition-opacity hover:opacity-90"
                        style={{ background: "linear-gradient(135deg, #1a6dbd, #2385cd, #42aae8)" }}
                      >
                        Go to Sign In →
                      </button>
                    </motion.div>
                  </motion.div>

                ) : (

                  /* ── FORM ── */
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 30 }}
                  >
                    {/* PROGRESS */}
                    <div className="h-1 bg-white/10 rounded mb-6">
                      <div
                        className="h-full rounded transition-all duration-300"
                        style={{
                          width: `${pct}%`,
                          background: "linear-gradient(90deg, #1a6dbd, #2385cd, #42aae8)",
                        }}
                      />
                    </div>

                    {/* ICON */}
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                      style={{
                        background: "rgba(35,133,205,0.13)",
                        border: "1px solid rgba(35,133,205,0.3)",
                      }}
                    >
                      <Lock size={22} color="#42aae8" />
                    </div>

                    <h2 className="text-xl mb-1 text-white">Reset your password</h2>
                    <p className="text-sm text-white/50 mb-6">
                      Choose a new password for your account.
                    </p>

                    {apiError && (
                      <div className="bg-red-500/10 border border-red-400 p-3 rounded mb-4 text-sm text-red-300">
                        ⚠ {apiError}
                      </div>
                    )}

                    {/* NEW PASSWORD */}
                    <div className="mb-4 relative">
                      <input
                        type={showPass ? "text" : "password"}
                        placeholder="New password"
                        value={fields.password}
                        onChange={(e) => set("password", e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 outline-none focus:border-[#2385cd] text-white placeholder-white/30 pr-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                      >
                        {showPass ? <EyeSlashIcon /> : <EyeIcon />}
                      </button>
                      {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
                    </div>

                    {/* CONFIRM PASSWORD */}
                    <div className="mb-6 relative">
                      <input
                        type={showConfirm ? "text" : "password"}
                        placeholder="Confirm new password"
                        value={fields.confirmPassword}
                        onChange={(e) => set("confirmPassword", e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 outline-none focus:border-[#2385cd] text-white placeholder-white/30 pr-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                      >
                        {showConfirm ? <EyeSlashIcon /> : <EyeIcon />}
                      </button>
                      {errors.confirmPassword && (
                        <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>
                      )}
                    </div>

                    {/* SUBMIT */}
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="w-full py-3 rounded-xl disabled:opacity-60 transition-opacity hover:opacity-90 font-medium"
                      style={{ background: "linear-gradient(135deg, #1a6dbd, #2385cd, #42aae8)" }}
                    >
                      {loading ? "Updating password…" : "Update Password →"}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default ResetPasswordModal;