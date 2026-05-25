// src/pages/Register.jsx
import { useState, useRef, useCallback } from "react";
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

/* ───────── IMAGE COMPRESSOR ───────── */
// Resizes the image to max 200×200 px and re-encodes as JPEG at 80% quality.
// A 200px avatar thumbnail is ~8–15 KB — well within any server limit.
function compressImage(dataUrl, maxSize = 200, quality = 0.8) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      const w = Math.round(img.width  * scale);
      const h = Math.round(img.height * scale);

      const canvas = document.createElement("canvas");
      canvas.width  = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);

      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(dataUrl); // fallback: pass original if anything fails
    img.src = dataUrl;
  });
}

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
      { n: "password",        l: "Password", p: "Min 8 chars",     t: "password" },
      { n: "confirmPassword", l: "Confirm",  p: "Repeat password", t: "password" },
    ],
  },
];

/* ───────── VALIDATION ───────── */
function validateField(f, val, all) {
  if (!val.trim()) return "Required";
  if (f.n === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return "Invalid email";
  if (f.n === "password" && val.length < 8) return "Min 8 characters";
  if (f.n === "confirmPassword" && val !== all.password) return "Passwords mismatch";
  return null;
}

/* ───────── AVATAR UPLOAD (step 0 extra UI) ───────── */
function AvatarUpload({ photoUrl, surname, otherNames, onPhotoChange }) {
  const fileRef = useRef();
  const [compressing, setCompressing] = useState(false);

  const initials = [surname?.[0], otherNames?.[0]]
    .filter(Boolean).join("").toUpperCase() || "?";

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      setCompressing(true);
      try {
        // Compress before storing — keeps payload small enough for the server
        const compressed = await compressImage(reader.result);
        onPhotoChange(compressed);
      } finally {
        setCompressing(false);
      }
    };
    reader.readAsDataURL(file);

    // Reset input so the same file can be re-selected if needed
    e.target.value = "";
  };

  return (
    <div className="flex items-center gap-3 mb-4 p-2.5 rounded-xl bg-white/5 border border-white/10">
      {/* Small avatar */}
      <div className="relative cursor-pointer group flex-shrink-0" onClick={() => fileRef.current?.click()}>
        {photoUrl ? (
          <img src={photoUrl} alt="avatar"
            className="w-10 h-10 rounded-full object-cover border border-[#2385cd]/60" />
        ) : (
          <div className="w-10 h-10 rounded-full border border-dashed border-white/30 bg-white/10 flex items-center justify-center text-sm font-bold text-white/50 group-hover:border-[#2385cd]/60 transition-all duration-200">
            {compressing ? "…" : initials}
          </div>
        )}
        {/* Camera dot */}
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#2385cd] flex items-center justify-center shadow">
          <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24"
            fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </div>
      </div>

      {/* Text + button inline */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-white/50 leading-tight">
          Profile photo <span className="text-white/25">(optional)</span>
        </p>
        {compressing && <p className="text-[10px] text-[#2385cd]/70 truncate mt-0.5">Optimising…</p>}
        {!compressing && photoUrl && <p className="text-[10px] text-white/30 truncate mt-0.5">Photo selected</p>}
      </div>

      <button type="button" onClick={() => fileRef.current?.click()} disabled={compressing}
        className="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white/60 hover:text-white hover:border-[#2385cd]/60 transition-all duration-200 disabled:opacity-40">
        {compressing ? "…" : photoUrl ? "Change" : "Upload"}
      </button>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

/* ───────── COMPONENT ───────── */
export function Register({ onNavigateToLogin, onGoHome, onGoDashboard }) {
  const { register }  = useAuth();
  const { dispatch }  = useStore();

  const [step,        setStep]        = useState(0);
  const [data,        setData]        = useState({
    surname: "", otherNames: "", phoneNumber: "", email: "",
    password: "", confirmPassword: "", photoUrl: "",
  });
  const [errors,      setErrors]      = useState({});
  const [apiError,    setApiError]    = useState("");
  const [loading,     setLoading]     = useState(false);
  const [done,        setDone]        = useState(false);
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const curStep = STEPS[step];
  const isLast  = step === STEPS.length - 1;
  const pct     = ((step + 1) / STEPS.length) * 100;

  const handleChange = useCallback((name, val) => {
    setData((p) => ({ ...p, [name]: val }));
    setApiError("");
    if (errors[name]) setErrors((e) => { const x = { ...e }; delete x[name]; return x; });
  }, [errors]);

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

      // Strip photoUrl from the API payload — send it separately or store locally only.
      // Base64 images bloat the JSON body and cause 413 errors on most servers.
      // The compressed thumbnail is already persisted to localStorage below.
      const { photoUrl, ...apiPayload } = data;

      const result = await register(apiPayload);
      if (!result.success) {
        setApiError(result.message || "Registration failed");
        return;
      }

      // Save registered user into shared store (+ photo)
      dispatch({
        type: "REGISTER_USER",
        payload: {
          surname:      data.surname,
          otherNames:   data.otherNames,
          email:        data.email,
          phoneNumber:  data.phoneNumber,
          photoUrl:     data.photoUrl,
          registeredAt: new Date().toISOString(),
        },
      });

      // Persist compressed photo for dashboard to pick up
      if (data.photoUrl) {
        try {
          const existing = JSON.parse(localStorage.getItem("userProfile") || "{}");
          localStorage.setItem("userProfile", JSON.stringify({ ...existing, photoUrl: data.photoUrl }));
        } catch {}
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
        className="relative z-10 w-[420px] max-w-[95%] p-8 rounded-3xl"
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
            /* ── FORM STEPS ── */
            <motion.div key={step} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <div className="h-1 bg-white/10 rounded mb-6">
                <div className="h-full rounded transition-all duration-500"
                  style={{ width: `${pct}%`, background: "linear-gradient(90deg, #1a6dbd, #2385cd, #42aae8)" }} />
              </div>

              <p className="text-xs text-white/30 mb-1 uppercase tracking-widest">Step {step + 1} of {STEPS.length}</p>
              <h2 className="text-xl mb-1">{curStep.title}</h2>
              <p className="text-sm text-white/50 mb-4">{curStep.sub}</p>

              {/* ── Optional photo upload on step 1 only ── */}
              {step === 0 && (
                <AvatarUpload
                  photoUrl={data.photoUrl}
                  surname={data.surname}
                  otherNames={data.otherNames}
                  onPhotoChange={(url) => setData((p) => ({ ...p, photoUrl: url }))}
                />
              )}

              {apiError && (
                <div className="bg-red-500/10 border border-red-400 p-3 rounded mb-4 text-sm text-red-300">⚠ {apiError}</div>
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
                    {errors[f.n] && <p className="text-red-400 text-xs mt-1">{errors[f.n]}</p>}
                  </div>
                );
              })}

              <div className="flex gap-2 mt-4">
                {step > 0 && (
                  <button onClick={back} className="flex-1 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">← Back</button>
                )}
                <button onClick={next} disabled={loading}
                  className="flex-1 py-3 rounded-xl disabled:opacity-60 transition-opacity hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #1a6dbd, #2385cd, #42aae8)" }}>
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