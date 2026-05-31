import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

function KeyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="8.5" cy="8.5" r="5.5" stroke="#7dd3fc" strokeWidth="1.8"/>
      <path d="M12.5 12.5L20 20" stroke="#7dd3fc" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M17 17.5L19 19.5" stroke="#7dd3fc" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M15 15.5L17 17.5" stroke="#7dd3fc" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="#7dd3fc" strokeWidth="1.8"/>
      <path d="M3 9h18" stroke="#7dd3fc" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M9 9v12" stroke="#7dd3fc" strokeWidth="1.8" strokeLinecap="round"/>
      <rect x="6" y="13" width="2" height="2" rx="0.4" fill="#7dd3fc"/>
      <rect x="12" y="13" width="2" height="2" rx="0.4" fill="#7dd3fc"/>
      <rect x="12" y="17" width="2" height="2" rx="0.4" fill="#7dd3fc"/>
      <rect x="6" y="17" width="2" height="2" rx="0.4" fill="#7dd3fc"/>
      <rect x="6" y="5" width="2" height="2" rx="0.4" fill="#7dd3fc"/>
      <rect x="11" y="5" width="2" height="2" rx="0.4" fill="#7dd3fc"/>
      <rect x="16" y="5" width="2" height="2" rx="0.4" fill="#7dd3fc"/>
    </svg>
  );
}

function ModalShell({ onClose, children }) {
  // Hide header when modal is open
  useEffect(() => {
    const header = document.querySelector("header");
    if (!header) return;
    header.style.transition = "opacity 0.2s ease, visibility 0.2s ease";
    header.style.opacity = "0";
    header.style.visibility = "hidden";
    return () => {
      header.style.opacity = "1";
      header.style.visibility = "visible";
    };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50"
      style={{ padding: "clamp(8px, 4vw, 16px)" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full"
        style={{ maxWidth: "clamp(300px, 90vw, 672px)" }}
      >
        {/* Glow */}
        <div className="absolute inset-0 bg-sky-400/10 blur-3xl rounded-xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-slate-700 border border-white/20 text-white flex items-center justify-center hover:bg-slate-600 hover:scale-110 transition-all duration-300"
        >
          ✕
        </button>

        <div className="relative">{children}</div>
      </motion.div>
    </div>
  );
}

export function HireStaffModal({ onClose }) {
  const navigate = useNavigate();

  const handleContinue = (type) => {
    onClose();
    navigate("/dashboard", { state: { openModal: type } });
  };

  const handleHome = () => {
    onClose();
    navigate("/");
  };

  return (
    <ModalShell onClose={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full rounded-3xl
        bg-white/10 backdrop-blur-xl border border-white/20
        shadow-2xl text-white"
        style={{
          padding: "clamp(16px, 5vw, 32px)",
          maxHeight: "85vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "clamp(12px, 4vw, 24px)" }}>
          <h2 style={{ fontSize: "clamp(18px, 5vw, 24px)", fontWeight: 700 }}>
            Hire Staff
          </h2>
          <p className="text-white/50" style={{ fontSize: "clamp(11px, 3vw, 14px)", marginTop: 4 }}>
            Choose how you'd like to hire
          </p>
        </div>

        {/* Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
            gap: "clamp(10px, 3vw, 24px)",
          }}
        >

          {/* ───────────────── PRIVATE ───────────────── */}
          <motion.div
            whileHover={{ scale: 1.03 }}
            className="rounded-2xl bg-white/10 border border-white/20
            hover:bg-white/20 transition-all duration-300
            backdrop-blur-lg flex flex-col
            hover:shadow-[0_0_25px_rgba(35,133,205,0.18)]"
            style={{ padding: "clamp(14px, 4vw, 24px)" }}
          >
            <div className="flex-1">
              <div
                className="rounded-full bg-sky-400/20 flex items-center justify-center"
                style={{
                  width: "clamp(32px, 8vw, 40px)",
                  height: "clamp(32px, 8vw, 40px)",
                  marginBottom: "clamp(8px, 2vw, 12px)",
                }}
              >
                <KeyIcon />
              </div>

              <h3 style={{ fontSize: "clamp(14px, 4vw, 18px)", fontWeight: 600, marginBottom: "clamp(6px, 2vw, 8px)" }}>
                Private Hiring
              </h3>

              <p className="text-white/70" style={{ fontSize: "clamp(11px, 2.8vw, 14px)", lineHeight: 1.55 }}>
                Hire trusted staff for personal or household needs like
                nannies, cleaners, drivers, and more.
              </p>
            </div>

            {/* Buttons */}
            <div
              style={{
                marginTop: "clamp(12px, 3vw, 20px)",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "clamp(6px, 2vw, 12px)",
              }}
            >
              <button
                onClick={handleHome}
                className="rounded-full font-medium
                bg-white/10 backdrop-blur-md text-white border border-white/20
                hover:border-white/50 hover:bg-white/20
                hover:shadow-[0_0_15px_rgba(255,255,255,0.25)]
                hover:scale-[1.03] active:scale-95 transition-all duration-300"
                style={{ padding: "clamp(7px, 2vw, 10px) clamp(8px, 2vw, 12px)", fontSize: "clamp(11px, 3vw, 14px)" }}
              >
                Home
              </button>

              <button
                onClick={() => handleContinue("private")}
                className="relative overflow-hidden rounded-full font-medium
                text-white border border-cyan-400/40
                bg-gradient-to-r from-[#2385cd] via-cyan-400 to-[#2385cd]
                hover:shadow-[0_0_18px_#2385cd,0_0_40px_rgba(35,133,205,0.6)]
                hover:scale-[1.03] active:scale-95 transition-all duration-300 group"
                style={{ padding: "clamp(7px, 2vw, 10px) clamp(8px, 2vw, 12px)", fontSize: "clamp(11px, 3vw, 14px)" }}
              >
                <span className="relative z-10">Continue</span>
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-white/10 blur-md transition duration-300" />
              </button>
            </div>
          </motion.div>

          {/* ───────────────── ORGANIZATION ───────────────── */}
          <motion.div
            whileHover={{ scale: 1.03 }}
            className="rounded-2xl bg-white/10 border border-white/20
            hover:bg-white/20 transition-all duration-300
            backdrop-blur-lg flex flex-col
            hover:shadow-[0_0_25px_rgba(35,133,205,0.18)]"
            style={{ padding: "clamp(14px, 4vw, 24px)" }}
          >
            <div className="flex-1">
              <div
                className="rounded-full bg-sky-400/20 flex items-center justify-center"
                style={{
                  width: "clamp(32px, 8vw, 40px)",
                  height: "clamp(32px, 8vw, 40px)",
                  marginBottom: "clamp(8px, 2vw, 12px)",
                }}
              >
                <BuildingIcon />
              </div>

              <h3 style={{ fontSize: "clamp(14px, 4vw, 18px)", fontWeight: 600, marginBottom: "clamp(6px, 2vw, 8px)" }}>
                Organization Hiring
              </h3>

              <p className="text-white/70" style={{ fontSize: "clamp(11px, 2.8vw, 14px)", lineHeight: 1.55 }}>
                Recruit skilled professionals for your business or company
                operations quickly and efficiently.
              </p>
            </div>

            {/* Buttons */}
            <div
              style={{
                marginTop: "clamp(12px, 3vw, 20px)",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "clamp(6px, 2vw, 12px)",
              }}
            >
              <button
                onClick={handleHome}
                className="rounded-full font-medium
                bg-white/10 backdrop-blur-md text-white border border-white/20
                hover:border-white/50 hover:bg-white/20
                hover:shadow-[0_0_15px_rgba(255,255,255,0.25)]
                hover:scale-[1.03] active:scale-95 transition-all duration-300"
                style={{ padding: "clamp(7px, 2vw, 10px) clamp(8px, 2vw, 12px)", fontSize: "clamp(11px, 3vw, 14px)" }}
              >
                Home
              </button>

              <button
                onClick={() => handleContinue("organization")}
                className="relative overflow-hidden rounded-full font-medium
                text-white border border-cyan-400/40
                bg-gradient-to-r from-[#1d4ed8] via-[#2385cd] to-cyan-400
                hover:shadow-[0_0_18px_#2385cd,0_0_40px_rgba(35,133,205,0.6)]
                hover:scale-[1.03] active:scale-95 transition-all duration-300 group"
                style={{ padding: "clamp(7px, 2vw, 10px) clamp(8px, 2vw, 12px)", fontSize: "clamp(11px, 3vw, 14px)" }}
              >
                <span className="relative z-10">Continue</span>
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-white/10 blur-md transition duration-300" />
              </button>
            </div>
          </motion.div>

        </div>
      </motion.div>
    </ModalShell>
  );
}

export default HireStaffModal;