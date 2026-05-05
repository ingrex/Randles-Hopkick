// src/pages/Register.jsx
import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "./AuthContext"; // ✅ use AuthContext register

/* ───────── STEPS ───────── */
const STEPS = [
  {
    title: "Who are you?",
    sub: "Let's start with your name",
    fields: [
      { n: "surname",    l: "Surname",     p: "Surname",     t: "text" },
      { n: "otherNames", l: "Other Names", p: "Other Names", t: "text" },
    ],
  },
  {
    title: "Stay in touch",
    sub: "How can we reach you?",
    fields: [
      { n: "phoneNumber", l: "Phone Number", p: "+234...",         t: "tel"   },
      { n: "email",       l: "Email",        p: "email@gmail.com", t: "email" },
    ],
  },
  {
    title: "Secure it",
    sub: "Create a strong password",
    fields: [
      { n: "password",        l: "Password", p: "Min 8 chars",    t: "password" },
      { n: "confirmPassword", l: "Confirm",  p: "Repeat password", t: "password" },
    ],
  },
];

/* ───────── VALIDATION ───────── */
function validateField(f, val, all) {
  if (!val.trim()) return "Required";
  if (f.n === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val))
    return "Invalid email";
  if (f.n === "password" && val.length < 8) return "Min 8 characters";
  if (f.n === "confirmPassword" && val !== all.password) return "Passwords mismatch";
  return null;
}

/* ───────── COMPONENT ───────── */
export function Register({ onNavigateToLogin, onGoHome, onGoDashboard }) {
  const { register } = useAuth(); // ✅ AuthContext register

  const [step, setStep]       = useState(0);
  const [data, setData]       = useState({
    surname: "",
    otherNames: "",
    phoneNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors]     = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const rootRef = useRef(null);
  const curStep = STEPS[step];
  const isLast  = step === STEPS.length - 1;
  const pct     = ((step + 1) / STEPS.length) * 100;

  const handleChange = useCallback(
    (name, val) => {
      setData((p) => ({ ...p, [name]: val }));
      setApiError("");
      if (errors[name]) setErrors((e) => { const x = { ...e }; delete x[name]; return x; });
    },
    [errors]
  );

  const next = async () => {
    const errs = {};
    curStep.fields.forEach((f) => {
      const e = validateField(f, data[f.n], data);
      if (e) errs[f.n] = e;
    });
    if (Object.keys(errs).length) return setErrors(errs);
    if (!isLast) return setStep((s) => s + 1);

    try {
      setLoading(true);
      setApiError("");

      // ✅ Uses AuthContext register — consistent with how data is stored
      const result = await register(data);

      if (!result.success) {
        setApiError(result.message || "Registration failed");
        return;
      }

      setDone(true);
    } catch (e) {
      setApiError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const back = () => step > 0 && setStep((s) => s - 1);

  return (
    <div
      ref={rootRef}
      className="min-h-screen flex items-center justify-center bg-[#030410] text-white relative overflow-hidden"
    >
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
        className="relative z-10 w-[420px] max-w-[95%] p-8 rounded-3xl"
        style={{
          background: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(25px)",
          border: "1px solid rgba(255,255,255,0.2)",
        }}
      >
        {/* BRAND */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 border border-dashed border-white/40 rounded-lg flex items-center justify-center text-xs text-white/50">
            Logo
          </div>
          <span className="text-sm tracking-widest text-white/70 uppercase">
            Randle&Hopkick
          </span>
        </div>

        {/* NAV TABS — hide after success */}
        {!done && (
          <div className="flex bg-white/10 rounded-full p-1 mb-5">
            <button onClick={onNavigateToLogin} className="flex-1 py-2 text-white/50">
              Sign In
            </button>
            <button className="flex-1 py-2 rounded-full bg-gradient-to-r from-purple-400 to-blue-400">
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
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: "linear-gradient(135deg,#a78bfa,#60a5fa)" }}
              >
                <span className="text-4xl">🎉</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="text-2xl font-semibold mb-1">Account Created!</h2>
                <p className="text-white/50 text-sm mb-2">
                  Welcome to Randle&Hopkick, {data.surname}!
                </p>
                <p className="text-white/30 text-xs mb-8">
                  Your account is ready. Where would you like to go?
                </p>

                <div className="flex flex-col gap-3">
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
                  <button
                    onClick={onNavigateToLogin}
                    className="w-full py-2 text-sm text-white/40 hover:text-white/70 transition-colors"
                  >
                    Sign in instead
                  </button>
                </div>
              </motion.div>
            </motion.div>

          ) : (

            /* ── FORM STEPS ── */
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
            >
              <div className="h-1 bg-white/10 rounded mb-6">
                <div
                  className="h-full rounded transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    background: "linear-gradient(90deg,#a78bfa,#60a5fa)",
                  }}
                />
              </div>

              <p className="text-xs text-white/30 mb-1 uppercase tracking-widest">
                Step {step + 1} of {STEPS.length}
              </p>
              <h2 className="text-xl mb-1">{curStep.title}</h2>
              <p className="text-sm text-white/50 mb-4">{curStep.sub}</p>

              {apiError && (
                <div className="bg-red-500/10 border border-red-400 p-3 rounded mb-4 text-sm text-red-300">
                  ⚠ {apiError}
                </div>
              )}

              {curStep.fields.map((f) => {
                const isPwd   = f.t === "password";
                const visible = f.n === "password" ? showPass : showConfirm;

                return (
                  <div key={f.n} className="mb-4 relative">
                    <input
                      type={isPwd ? (visible ? "text" : "password") : f.t}
                      placeholder={f.p}
                      value={data[f.n]}
                      onChange={(e) => handleChange(f.n, e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 outline-none focus:border-purple-400 pr-10"
                    />
                    {isPwd && (
                      <button
                        type="button"
                        onClick={() =>
                          f.n === "password"
                            ? setShowPass((s) => !s)
                            : setShowConfirm((s) => !s)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50"
                      >
                        {visible ? "🙈" : "👁"}
                      </button>
                    )}
                    {errors[f.n] && (
                      <p className="text-red-400 text-xs mt-1">{errors[f.n]}</p>
                    )}
                  </div>
                );
              })}

              <div className="flex gap-2 mt-4">
                {step > 0 && (
                  <button
                    onClick={back}
                    className="flex-1 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                  >
                    ← Back
                  </button>
                )}
                <button
                  onClick={next}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl disabled:opacity-60 transition-opacity"
                  style={{ background: "linear-gradient(135deg,#a78bfa,#60a5fa)" }}
                >
                  {loading ? "Processing…" : isLast ? "Create Account" : "Continue →"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default Register;