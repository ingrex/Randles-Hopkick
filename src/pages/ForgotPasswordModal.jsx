// src/pages/ForgotPasswordModal.jsx

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, X, Lock } from "lucide-react";   // ← added Lock

/* ───────── VALIDATION ───────── */
function validate(email) {
  if (!email.trim()) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Invalid email address";
  return null;
}

/* ───────── REAL API CALL ───────── */
async function sendResetEmail(email) {
  const res = await fetch("/api/auth/forgot-password", {   // ← your endpoint
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Something went wrong. Please try again.");
  }

  return { success: true };
}

/* ───────── COMPONENT ───────── */
export function ForgotPasswordModal({ isOpen, onClose }) {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setEmail("");
      setFieldError("");
      setApiError("");
      setLoading(false);
      setDone(false);
    }, 300);
  };

  const handleChange = (v) => {
    setEmail(v);
    setFieldError("");
    setApiError("");
  };

  const handleSubmit = async () => {
    const err = validate(email);
    if (err) return setFieldError(err);

    setLoading(true);
    setApiError("");

    try {
      await sendResetEmail(email);
      setDone(true);
    } catch (err) {
      setApiError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const pct = email.trim() ? 100 : 0;

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
              className="w-105 max-w-full p-8 rounded-3xl relative"
              style={{
                background: "rgba(255,255,255,0.09)",
                backdropFilter: "blur(30px)",
                border: "1px solid rgba(255,255,255,0.18)",
              }}
            >
              {/* CLOSE BUTTON */}
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
                      <span className="text-4xl">✉</span>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                    >
                      <h2 className="text-2xl font-semibold mb-1 text-white">Check your inbox</h2>
                      <p className="text-white/50 text-sm mb-3">We sent a reset link to:</p>
                      <p
                        className="text-sm font-medium mb-6 px-3 py-2 rounded-lg"
                        style={{
                          background: "rgba(35,133,205,0.15)",
                          border: "1px solid rgba(35,133,205,0.3)",
                          color: "#42aae8",
                        }}
                      >
                        {email}
                      </p>
                      <p className="text-white/40 text-xs mb-6">
                        Didn't receive it? Check your spam or try again below.
                      </p>

                      <div className="flex flex-col gap-3">
                        <button
                          onClick={() => { setDone(false); setEmail(""); }}
                          className="w-full py-3 rounded-xl font-medium transition-opacity hover:opacity-90"
                          style={{ background: "linear-gradient(135deg, #1a6dbd, #2385cd, #42aae8)" }}
                        >
                          Try another email
                        </button>
                        <button
                          onClick={handleClose}
                          className="w-full py-3 rounded-xl font-medium bg-white/10 hover:bg-white/20 transition-colors text-white"
                        >
                          Back to Sign In
                        </button>
                      </div>
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
                    {/* PROGRESS BAR */}
                    <div className="h-1 bg-white/10 rounded mb-6">
                      <div
                        className="h-full rounded transition-all duration-300"
                        style={{
                          width: `${pct}%`,
                          background: "linear-gradient(90deg, #1a6dbd, #2385cd, #42aae8)",
                        }}
                      />
                    </div>

                    {/* BACK LINK */}
                    <button
                      onClick={handleClose}
                      className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors mb-5"
                    >
                      <ArrowLeft size={13} />
                      Back to Sign In
                    </button>

                    {/* ICON — replaced emoji with Lock icon */}
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                      style={{
                        background: "rgba(35,133,205,0.13)",
                        border: "1px solid rgba(35,133,205,0.3)",
                      }}
                    >
                      <Lock size={22} color="#42aae8" />   {/* ← clean icon */}
                    </div>

                    <h2 className="text-xl mb-1 text-white">Forgot password?</h2>
                    <p className="text-sm text-white/50 mb-6">
                      Enter your email and we'll send you a reset link.
                    </p>

                    {apiError && (
                      <div className="bg-red-500/10 border border-red-400 p-3 rounded mb-4 text-sm text-red-300">
                        ⚠ {apiError}
                      </div>
                    )}

                    {/* EMAIL */}
                    <div className="mb-5">
                      <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => handleChange(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 outline-none focus:border-[#2385cd] text-white placeholder-white/30"
                      />
                      {fieldError && (
                        <p className="text-red-400 text-xs mt-1">{fieldError}</p>
                      )}
                    </div>

                    {/* SUBMIT */}
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="w-full py-3 rounded-xl disabled:opacity-60 transition-opacity hover:opacity-90 mb-4 font-medium"
                      style={{ background: "linear-gradient(135deg, #1a6dbd, #2385cd, #42aae8)" }}
                    >
                      {loading ? "Sending link…" : "Send Reset Link →"}
                    </button>

                    <p className="text-center text-sm text-white/50">
                      Remember your password?{" "}
                      <button
                        onClick={handleClose}
                        style={{ color: "#42aae8" }}
                        className="hover:underline"
                      >
                        Sign in
                      </button>
                    </p>
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

export default ForgotPasswordModal;