// src/pages/Register.jsx
import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "./AuthContext";
import { useStore } from "../store";
import { Home } from "lucide-react";
import Logo from "../components/Logo";

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

/* ───────── FIELDS (single page, all at once) ───────── */
const FIELDS = [
  { n: "surname",         l: "Surname",          p: "Surname",         t: "text",     ac: "family-name"   },
  { n: "otherNames",      l: "Other Names",       p: "Other Names",     t: "text",     ac: "given-name"    },
  { n: "phoneNumber",     l: "Phone Number",      p: "+234...",         t: "tel",      ac: "tel"           },
  { n: "email",           l: "Email",             p: "email@gmail.com", t: "email",    ac: "email"         },
  { n: "password",        l: "Password",          p: "Min 8 chars",     t: "password", ac: "new-password"  },
  { n: "confirmPassword", l: "Confirm Password",  p: "Repeat password", t: "password", ac: "new-password"  },
];

/* ───────── VALIDATION ───────── */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Accepts Nigerian numbers as +234XXXXXXXXXX (13 chars) or 0XXXXXXXXXX (11 digits),
// ignoring spaces/dashes the user may have typed.
const PHONE_RE = /^(\+234\d{10}|0\d{10})$/;

function normalizePhone(val) {
  return val.replace(/[\s-]/g, "");
}

function validateField(f, val, all) {
  if (!val.trim()) return "Required";
  if (f.n === "email" && !EMAIL_RE.test(val.trim())) return "Enter a valid email address";
  if (f.n === "phoneNumber" && !PHONE_RE.test(normalizePhone(val))) {
    return "Enter a valid number, e.g. +2348012345678";
  }
  if (f.n === "password" && val.length < 8) return "Min 8 characters";
  if (f.n === "confirmPassword" && val !== all.password) return "Passwords do not match";
  return null;
}

function validateAll(data) {
  const errs = {};
  FIELDS.forEach((f) => {
    const e = validateField(f, data[f.n], data);
    if (e) errs[f.n] = e;
  });
  return errs;
}

/* ───────── ERROR MESSAGE EXTRACTION ─────────
   Server error shapes vary a lot between backends/HTTP clients, so this pulls
   a human-readable message out of whatever we get back and adds a clearer,
   user-facing message specifically for "email already registered" cases,
   which previously fell through to a blank/undefined error. */
function extractErrorMessage(result, thrown) {
  let raw =
    result?.message ||
    result?.error ||
    result?.errors?.email ||
    (Array.isArray(result?.errors) ? result.errors[0]?.message : null) ||
    thrown?.response?.data?.message ||
    thrown?.response?.data?.error ||
    thrown?.data?.message ||
    thrown?.message;

  if (!raw || typeof raw !== "string") {
    raw = "Something went wrong while creating your account. Please try again.";
  }

  const lower = raw.toLowerCase();
  const status = result?.status ?? result?.statusCode ?? thrown?.response?.status ?? thrown?.status;

  const looksLikeDuplicateEmail =
    status === 409 ||
    (lower.includes("email") &&
      (lower.includes("exist") || lower.includes("taken") || lower.includes("already") || lower.includes("registered") || lower.includes("in use")));

  const looksLikeInvalidEmail =
    lower.includes("invalid") && lower.includes("email");

  if (looksLikeDuplicateEmail) {
    return "That email is already registered. Try signing in instead, or use a different email.";
  }
  if (looksLikeInvalidEmail) {
    return "That email address doesn't look valid. Please check and try again.";
  }
  return raw;
}

/* ───────── COMPONENT ───────── */
export function Register({ onNavigateToLogin, onGoHome, onGoDashboard }) {
  const { register }  = useAuth();
  const { dispatch }  = useStore();

  const [data,        setData]        = useState({
    surname: "", otherNames: "", phoneNumber: "", email: "",
    password: "", confirmPassword: "",
  });
  const [errors,      setErrors]      = useState({});
  const [apiError,    setApiError]    = useState("");
  const [loading,     setLoading]     = useState(false);
  const [done,        setDone]        = useState(false);
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const firstFieldRef = useRef(null);

  // Autofocus the first field on mount — there's no multi-step flow anymore
  // to justify leaving focus unset.
  useEffect(() => {
    firstFieldRef.current?.focus();
  }, []);

  const handleChange = useCallback((name, val) => {
    setData((p) => {
      const next = { ...p, [name]: val };

      // Live password-match feedback: revalidate confirmPassword whenever
      // either password field changes, instead of only on submit.
      if (name === "password" || name === "confirmPassword") {
        setErrors((e) => {
          const x = { ...e };
          if (next.confirmPassword) {
            if (next.confirmPassword !== next.password) {
              x.confirmPassword = "Passwords do not match";
            } else {
              delete x.confirmPassword;
            }
          }
          return x;
        });
      }
      return next;
    });

    setApiError("");
    if (errors[name] && name !== "password" && name !== "confirmPassword") {
      setErrors((e) => { const x = { ...e }; delete x[name]; return x; });
    }
  }, [errors]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  };

  const submit = async () => {
    // Normalize before validating/sending: trim names & phone, and
    // trim+lowercase email so "John@Gmail.com " and "john@gmail.com"
    // are treated as the same account both client- and server-side.
    const normalized = {
      ...data,
      surname: data.surname.trim(),
      otherNames: data.otherNames.trim(),
      phoneNumber: normalizePhone(data.phoneNumber.trim()),
      email: data.email.trim().toLowerCase(),
    };
    setData(normalized);

    const errs = validateAll(normalized);
    if (Object.keys(errs).length) return setErrors(errs);

    let result;
    try {
      setLoading(true);
      setApiError("");

      result = await register(normalized);

      if (!result?.success) {
        setApiError(extractErrorMessage(result, null));
        // Surface field-level email error too, if the server flagged it
        if (result?.errors?.email) {
          setErrors((e) => ({ ...e, email: "Already registered" }));
        }
        return;
      }

      // Save registered user into shared store
      dispatch({
        type: "REGISTER_USER",
        payload: {
          surname:      normalized.surname,
          otherNames:   normalized.otherNames,
          email:        normalized.email,
          phoneNumber:  normalized.phoneNumber,
          registeredAt: new Date().toISOString(),
        },
      });

      // Clear password fields from state now that we're done with them
      setData((p) => ({ ...p, password: "", confirmPassword: "" }));
      setDone(true);
    } catch (e) {
      setApiError(extractErrorMessage(result, e));
    } finally {
      setLoading(false);
    }
  };

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
        className="relative z-10 w-[440px] max-w-[95%] p-8 rounded-3xl"
        style={{
          background: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(25px)",
          border: "1px solid rgba(255,255,255,0.2)",
        }}
      >
        {/* BRAND + HOME */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border border-dashed border-white/40 rounded-lg flex items-center justify-center text-xs text-white/50">
              <Logo />
            </div>
            <span className="text-sm tracking-widest text-white/70 uppercase">Randle&amp;Hopkick</span>
          </div>
          <button onClick={onGoHome}
            className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/80 text-xs font-medium hover:text-white hover:border-[#2385cd] hover:bg-[#2385cd]/10 hover:shadow-[0_0_15px_rgba(35,133,205,0.35)] hover:scale-105 active:scale-95 transition-all duration-300">
            <Home size={14} /> Home
          </button>
        </div>

        {/* NAV TABS */}
        {!done && (
          <div className="flex bg-white/10 rounded-full p-1 mb-5">
            <button onClick={onNavigateToLogin} className="flex-1 py-2 text-white/50">Sign In</button>
            <button className="flex-1 py-2 rounded-full" style={{ background: "linear-gradient(135deg, #1a6dbd, #2385cd)" }}>
              Register
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* ── SUCCESS ── */}
          {done ? (
            <motion.div key="success"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }} className="text-center py-4">
              <motion.div
                initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: "linear-gradient(135deg, #1a6dbd, #2385cd, #42aae8)" }}>
                <span className="text-4xl">🎉</span>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <h2 className="text-2xl font-semibold mb-1">Account Created!</h2>
                <p className="text-white/50 text-sm mb-2">Welcome to Randle&amp;Hopkick, {data.surname}!</p>
                <p className="text-white/30 text-xs mb-8">Your account is ready. Where would you like to go?</p>
                <div className="flex flex-col gap-3">
                  <button onClick={onGoDashboard}
                    className="w-full py-3 rounded-xl font-medium transition-opacity hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, #1a6dbd, #2385cd, #42aae8)" }}>
                    Go to Dashboard →
                  </button>
                  <button onClick={onGoHome} className="w-full py-3 rounded-xl font-medium bg-white/10 hover:bg-white/20 transition-colors">
                    Go to Home
                  </button>
                  <button onClick={onNavigateToLogin} className="w-full py-2 text-sm text-white/40 hover:text-white/70 transition-colors">
                    Sign in instead
                  </button>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            /* ── SINGLE-PAGE FORM ── */
            <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <p className="text-xs text-white/30 mb-1 uppercase tracking-widest">Create your account</p>
              <h2 className="text-xl mb-1">Sign up</h2>
              <p className="text-sm text-white/50 mb-4">Fill in your details below</p>

              {apiError && (
                <div role="alert" className="bg-red-500/10 border border-red-400 p-3 rounded mb-4 text-sm text-red-300">
                  ⚠ {apiError}
                </div>
              )}

              {FIELDS.map((f, idx) => {
                const isPwd   = f.t === "password";
                const visible = f.n === "password" ? showPass : showConfirm;
                return (
                  <div key={f.n} className="mb-4 relative">
                    <input
                      ref={idx === 0 ? firstFieldRef : undefined}
                      type={isPwd ? (visible ? "text" : "password") : f.t}
                      placeholder={f.p}
                      value={data[f.n]}
                      autoComplete={f.ac}
                      onChange={(e) => handleChange(f.n, e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 outline-none focus:border-[#2385cd] pr-11"
                    />
                    {isPwd && (
                      <button type="button"
                        onClick={() => f.n === "password" ? setShowPass((s) => !s) : setShowConfirm((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                        aria-label={visible ? "Hide password" : "Show password"}>
                        {visible ? <EyeSlashIcon /> : <EyeIcon />}
                      </button>
                    )}
                    {f.n === "password" && !errors.password && (
                      <p className="text-white/25 text-xs mt-1">Use a mix of letters, numbers &amp; symbols</p>
                    )}
                    {errors[f.n] && <p className="text-red-400 text-xs mt-1">{errors[f.n]}</p>}
                  </div>
                );
              })}

              <button onClick={submit} disabled={loading}
                className="w-full py-3 rounded-xl disabled:opacity-60 transition-opacity hover:opacity-90 mt-2"
                style={{ background: "linear-gradient(135deg, #1a6dbd, #2385cd, #42aae8)" }}>
                {loading ? "Processing…" : "Create Account"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default Register;