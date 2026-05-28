import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import StaffForm from "../../ApplicationForms/StaffForm";

const SKY_500 = "#0ea5e9";
const SKY_300 = "#7dd3fc";
const FONT    = "'Outfit', sans-serif";

/* ── Lock icon ── */
function LockIcon() {
  return (
    <svg width="38" height="38" viewBox="0 0 38 38" fill="none" aria-hidden="true">
      <rect x="8" y="16" width="22" height="16" rx="4" stroke="#7dd3fc" strokeWidth="2.2"/>
      <path d="M13 16v-4a6 6 0 0 1 12 0v4" stroke="#7dd3fc" strokeWidth="2.2" strokeLinecap="round"/>
      <circle cx="19" cy="24" r="2.2" fill="#7dd3fc"/>
    </svg>
  );
}

/* ── Warning / shield icon ── */
function ShieldIcon() {
  return (
    <svg width="38" height="38" viewBox="0 0 38 38" fill="none" aria-hidden="true">
      <path
        d="M19 5L7 10v9c0 7.18 5.16 13.9 12 15.5C25.84 32.9 31 26.18 31 19v-9L19 5z"
        stroke="#7dd3fc" strokeWidth="2.2" strokeLinejoin="round"
      />
      <path d="M19 14v6M19 23v1.5" stroke="#7dd3fc" strokeWidth="2.4" strokeLinecap="round"/>
    </svg>
  );
}

/* ════════════════════════════════════════
   ALREADY-SUBMITTED MODAL
════════════════════════════════════════ */
function AlreadySubmittedModal({ onClose }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.88, opacity: 0 }}
        animate={{ scale: 1,    opacity: 1 }}
        exit={{ scale: 0.88,    opacity: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 26 }}
        style={{
          position: "relative", maxWidth: 420, width: "100%",
          background: "rgba(6,18,40,.95)",
          border: "1.5px solid rgba(14,165,233,.28)",
          borderRadius: 28, padding: "42px 36px 36px",
          textAlign: "center", backdropFilter: "blur(36px)",
          boxShadow: "0 40px 100px rgba(0,0,0,.4), inset 0 1px 0 rgba(14,165,233,.12)",
          fontFamily: FONT,
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 14, right: 14,
            width: 30, height: 30, borderRadius: "50%",
            background: "rgba(255,255,255,.08)",
            border: "1px solid rgba(255,255,255,.15)",
            color: "rgba(200,225,255,.6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", fontSize: 14, lineHeight: 1,
          }}
        >✕</button>

        <div style={{
          width: 76, height: 76, borderRadius: "50%",
          background: "linear-gradient(135deg,#075985,#0ea5e9)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px",
          boxShadow: "0 0 32px rgba(14,165,233,.35)",
        }}>
          <LockIcon />
        </div>

        <h2 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 26, fontWeight: 700,
          color: "#e8f0fe", letterSpacing: "-.02em", marginBottom: 10,
        }}>
          Application Submitted
        </h2>

        <p style={{ fontSize: 13, color: "rgba(175,210,245,.65)", lineHeight: 1.75, marginBottom: 8, fontWeight: 300 }}>
          Your staff registration has already been received by{" "}
          <span style={{ color: SKY_300, fontWeight: 500 }}>Randle &amp; Hopkins</span>.
        </p>
        <p style={{ fontSize: 13, color: "rgba(175,210,245,.65)", lineHeight: 1.75, marginBottom: 24, fontWeight: 300 }}>
          To update any of your details, please contact our admin team directly.
          We review every application carefully.
        </p>

        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "12px 16px",
          background: "rgba(14,165,233,.08)",
          border: "1px solid rgba(14,165,233,.2)",
          borderRadius: 14, marginBottom: 24, textAlign: "left",
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
            <rect x="1.5" y="3.5" width="15" height="11" rx="2" stroke={SKY_500} strokeWidth="1.6"/>
            <path d="M1.5 6l7.5 5 7.5-5" stroke={SKY_500} strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
          <div>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "rgba(125,211,252,.55)", margin: "0 0 2px" }}>
              Contact Admin
            </p>
            <p style={{ fontSize: 12, color: "rgba(190,225,255,.75)", margin: 0 }}>
              admin@randleandhopkins.com
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            width: "100%", padding: "12px 0", borderRadius: 20, border: "none",
            background: "linear-gradient(135deg,#0369a1,#0ea5e9,#38bdf8)",
            color: "#fff", fontFamily: FONT, fontSize: 14, fontWeight: 600,
            cursor: "pointer", boxShadow: "0 6px 26px rgba(14,165,233,.28)",
          }}
        >
          Got it
        </button>
      </motion.div>
    </motion.div>
  );
}

/* ════════════════════════════════════════
   WARNING MODAL  (shown before form)
════════════════════════════════════════ */
function WarningModal({ onProceed, onClose }) {
  const points = [
    { icon: "✎", label: "Details are locked after submission", sub: "Changes require contacting our admin team directly." },
    { icon: "◎", label: "One submission per account",          sub: "Each account may only register as staff once." },
    { icon: "✔", label: "Accuracy is essential",              sub: "Ensure name, skills and contact details are correct." },
  ];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.88, opacity: 0, y: 24 }}
        animate={{ scale: 1,    opacity: 1, y: 0 }}
        exit={{ scale: 0.88,    opacity: 0, y: 24 }}
        transition={{ type: "spring", stiffness: 340, damping: 26 }}
        style={{
          position: "relative", maxWidth: 460, width: "100%",
          background: "rgba(4,14,32,.97)",
          border: "1.5px solid rgba(14,165,233,.25)",
          borderRadius: 28, padding: "44px 38px 38px",
          textAlign: "center", backdropFilter: "blur(40px)",
          boxShadow: "0 50px 120px rgba(0,0,0,.5), inset 0 1px 0 rgba(14,165,233,.1)",
          fontFamily: FONT,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* top accent line */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 2, borderRadius: "28px 28px 0 0",
          background: "linear-gradient(90deg,transparent,#0ea5e9cc,#38bdf888,transparent)",
        }}/>

        {/* close */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 14, right: 14,
            width: 30, height: 30, borderRadius: "50%",
            background: "rgba(255,255,255,.07)",
            border: "1px solid rgba(255,255,255,.13)",
            color: "rgba(200,225,255,.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", fontSize: 14, lineHeight: 1,
          }}
        >✕</button>

        {/* icon */}
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          background: "linear-gradient(135deg,rgba(3,105,161,.8),rgba(14,165,233,.6))",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 22px",
          boxShadow: "0 0 40px rgba(14,165,233,.3), inset 0 1px 0 rgba(255,255,255,.1)",
        }}>
          <ShieldIcon />
        </div>

        <h2 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 27, fontWeight: 700,
          color: "#e8f0fe", letterSpacing: "-.025em", marginBottom: 8,
        }}>
          Before You Continue
        </h2>
        <p style={{ fontSize: 12, color: "rgba(155,200,245,.5)", lineHeight: 1.7, marginBottom: 26, fontWeight: 300 }}>
          Please read these important notes before filling the registration form.
        </p>

        {/* checklist */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28, textAlign: "left" }}>
          {points.map(({ icon, label, sub }) => (
            <div key={label} style={{
              display: "flex", alignItems: "flex-start", gap: 13,
              padding: "12px 15px",
              background: "rgba(14,165,233,.06)",
              border: "1px solid rgba(14,165,233,.15)",
              borderRadius: 14,
            }}>
              <span style={{
                flexShrink: 0, width: 30, height: 30, borderRadius: "50%",
                background: "linear-gradient(135deg,rgba(3,105,161,.6),rgba(14,165,233,.4))",
                border: "1px solid rgba(14,165,233,.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, color: SKY_300,
              }}>{icon}</span>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(200,230,255,.85)", margin: "0 0 3px", fontFamily: FONT }}>
                  {label}
                </p>
                <p style={{ fontSize: 11, color: "rgba(150,195,240,.5)", margin: 0, fontWeight: 300, lineHeight: 1.55 }}>
                  {sub}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* admin contact */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 14px",
          background: "rgba(255,255,255,.04)",
          border: "1px solid rgba(255,255,255,.09)",
          borderRadius: 12, marginBottom: 26, textAlign: "left",
        }}>
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
            <rect x="1.5" y="3.5" width="15" height="11" rx="2" stroke="rgba(125,211,252,.5)" strokeWidth="1.6"/>
            <path d="M1.5 6l7.5 5 7.5-5" stroke="rgba(125,211,252,.5)" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
          <p style={{ fontSize: 11, color: "rgba(155,200,245,.42)", margin: 0, fontWeight: 300 }}>
            For changes after submission, contact{" "}
            <span style={{ color: "rgba(125,211,252,.7)", fontWeight: 500 }}>admin@randleandhopkins.com</span>
          </p>
        </div>

        {/* CTA buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: "12px 0", borderRadius: 20,
              background: "rgba(255,255,255,.07)",
              border: "1px solid rgba(255,255,255,.14)",
              color: "rgba(190,220,255,.6)", fontFamily: FONT,
              fontSize: 13, fontWeight: 400, cursor: "pointer",
              transition: "all .25s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.12)"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.07)"; e.currentTarget.style.color = "rgba(190,220,255,.6)"; }}
          >
            Cancel
          </button>
          <button
            onClick={onProceed}
            style={{
              flex: 2, padding: "12px 0", borderRadius: 20, border: "none",
              background: "linear-gradient(135deg,#0369a1,#0ea5e9,#38bdf8)",
              color: "#fff", fontFamily: FONT,
              fontSize: 14, fontWeight: 600, cursor: "pointer",
              boxShadow: "0 8px 28px rgba(14,165,233,.32)",
              transition: "all .3s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 12px 40px rgba(14,165,233,.52)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 8px 28px rgba(14,165,233,.32)"; e.currentTarget.style.transform = "none"; }}
          >
            I Understand — Continue →
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════ */
export function GetJobButton({ user, onProfileRefresh }) {
  const navigate = useNavigate();

  // "warning" → show warning modal
  // "form"    → show staff form
  // "done"    → show already-submitted modal
  // null      → nothing open
  const [modal, setModal] = useState(null);

  const alreadySubmitted = !!user?.staffProfileSubmitted;

  const handleClick = () => {
    if (!user) { navigate("/login"); return; }
    if (alreadySubmitted) { setModal("done"); return; }
    setModal("warning");
  };

  const handleFormSubmit = (payload) => {
    setModal(null);
    onProfileRefresh?.(payload);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="px-8 py-3 rounded-full font-semibold text-white
          bg-[#2385cd]
          shadow-[0_10px_30px_rgba(35,133,205,0.35)]
          hover:shadow-[0_15px_40px_rgba(35,133,205,0.55)]
          hover:scale-[1.05]
          active:scale-[0.97]
          transition-all duration-300"
      >
        Get Job
      </button>

      <AnimatePresence>

        {/* Already submitted */}
        {modal === "done" && (
          <AlreadySubmittedModal key="done" onClose={() => setModal(null)} />
        )}

        {/* Warning gate */}
        {modal === "warning" && (
          <WarningModal
            key="warning"
            onClose={() => setModal(null)}
            onProceed={() => setModal("form")}
          />
        )}

        {/* Registration form */}
        {modal === "form" && (
          <motion.div
            key="form"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1,   opacity: 1 }}
              exit={{ scale: 0.9,    opacity: 0 }}
              className="relative w-full max-w-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* glow */}
              <div className="absolute inset-0 bg-sky-400/10 blur-3xl rounded-xl pointer-events-none" />

              {/* close */}
              <button
                onClick={() => setModal(null)}
                className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-slate-700 border border-white/20 text-white flex items-center justify-center hover:bg-slate-600 transition"
              >
                ✕
              </button>

              <div className="relative">
                <StaffForm onSubmit={handleFormSubmit} />
              </div>
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>
    </>
  );
}

export default GetJobButton;