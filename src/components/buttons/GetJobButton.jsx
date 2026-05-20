import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import StaffForm from "../../ApplicationForms/StaffForm";

const SKY_500 = "#0ea5e9";
const SKY_300 = "#7dd3fc";
const FONT    = "'Outfit', sans-serif";

/* ── small lock icon inline SVG ── */
function LockIcon() {
  return (
    <svg width="38" height="38" viewBox="0 0 38 38" fill="none" aria-hidden="true">
      <rect x="8" y="16" width="22" height="16" rx="4" stroke="#7dd3fc" strokeWidth="2.2"/>
      <path d="M13 16v-4a6 6 0 0 1 12 0v4" stroke="#7dd3fc" strokeWidth="2.2" strokeLinecap="round"/>
      <circle cx="19" cy="24" r="2.2" fill="#7dd3fc"/>
    </svg>
  );
}

/* ── "Already submitted" modal ── */
function AlreadySubmittedModal({ onClose }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
      style={{ alignItems: "center", justifyContent: "center" }}
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
          position: "relative",
          maxWidth: 420,
          width: "100%",
          background: "rgba(6,18,40,.95)",
          border: "1.5px solid rgba(14,165,233,.28)",
          borderRadius: 28,
          padding: "42px 36px 36px",
          textAlign: "center",
          backdropFilter: "blur(36px)",
          boxShadow: "0 40px 100px rgba(0,0,0,.4), inset 0 1px 0 rgba(14,165,233,.12)",
          fontFamily: FONT,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* close */}
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

        {/* icon */}
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
          color: "#e8f0fe", letterSpacing: "-.02em",
          marginBottom: 10,
        }}>
          Application Submitted
        </h2>

        <p style={{
          fontSize: 13, color: "rgba(175,210,245,.65)",
          lineHeight: 1.75, marginBottom: 8, fontWeight: 300,
        }}>
          Your staff registration has already been received by{" "}
          <span style={{ color: SKY_300, fontWeight: 500 }}>Randle &amp; Hopkins</span>.
        </p>

        <p style={{
          fontSize: 13, color: "rgba(175,210,245,.65)",
          lineHeight: 1.75, marginBottom: 24, fontWeight: 300,
        }}>
          To update any of your details, please contact our admin team directly.
          We review every application carefully.
        </p>

        {/* admin contact highlight */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "12px 16px",
          background: "rgba(14,165,233,.08)",
          border: "1px solid rgba(14,165,233,.2)",
          borderRadius: 14,
          marginBottom: 24,
          textAlign: "left",
        }}>
          {/* envelope icon */}
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true" style={{ flexShrink: 0, color: SKY_500 }}>
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
            width: "100%", padding: "12px 0",
            borderRadius: 20, border: "none",
            background: "linear-gradient(135deg,#0369a1,#0ea5e9,#38bdf8)",
            color: "#fff", fontFamily: FONT,
            fontSize: 14, fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 6px 26px rgba(14,165,233,.28)",
          }}
        >
          Got it
        </button>
      </motion.div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════ */
export function GetJobButton({ user, onProfileRefresh }) {
  const navigate    = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const alreadySubmitted = !!user?.staffProfileSubmitted;

  const handleClick = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setShowModal(true);
  };

  /* Called by StaffForm on successful submission.
     onProfileRefresh (optional) lets the parent re-fetch profile data. */
  const handleFormSubmit = (payload) => {
    setShowModal(false);
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
        {showModal && (
          alreadySubmitted ? (
            /* ── Already submitted → info modal ── */
            <AlreadySubmittedModal onClose={() => setShowModal(false)} />
          ) : (
            /* ── First time → registration form ── */
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
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
                  onClick={() => setShowModal(false)}
                  className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-slate-700 border border-white/20 text-white flex items-center justify-center hover:bg-slate-600 transition"
                >
                  ✕
                </button>

                {/* one-time notice strip */}
                <div style={{
                  marginBottom: 8,
                  padding: "9px 16px",
                  background: "rgba(14,165,233,.1)",
                  border: "1px solid rgba(14,165,233,.22)",
                  borderRadius: 14,
                  fontFamily: FONT,
                  fontSize: 12,
                  color: "rgba(180,220,255,.7)",
                  lineHeight: 1.6,
                  textAlign: "center",
                }}>
                  <span style={{ color: SKY_300, fontWeight: 600 }}>Important: </span>
                  Please fill in your details carefully.
                  Once submitted, changes can only be made by contacting our admin team.
                </div>

                <div className="relative">
                  <StaffForm onSubmit={handleFormSubmit} />
                </div>
              </motion.div>
            </motion.div>
          )
        )}
      </AnimatePresence>
    </>
  );
}

export default GetJobButton;