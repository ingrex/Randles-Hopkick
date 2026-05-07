import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

function ModalShell({ onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-2xl"
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
        className="w-full rounded-3xl p-6 md:p-8
        bg-white/10 backdrop-blur-xl border border-white/20
        shadow-2xl text-white"
      >
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Hire Staff</h2>

          <p className="text-white/50 text-sm mt-1">
            Choose how you'd like to hire
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* ───────────────── PRIVATE ───────────────── */}
          <motion.div
            whileHover={{ scale: 1.03 }}
            className="p-6 rounded-2xl bg-white/10 border border-white/20
            hover:bg-white/20 transition-all duration-300
            backdrop-blur-lg flex flex-col
            hover:shadow-[0_0_25px_rgba(35,133,205,0.18)]"
          >
            <div className="flex-1">
              <div className="w-10 h-10 rounded-full bg-sky-400/20 flex items-center justify-center mb-3">
                <span className="text-sky-300 text-lg"></span>
              </div>

              <h3 className="text-lg font-semibold mb-2">
                Private Hiring
              </h3>

              <p className="text-sm text-white/70">
                Hire trusted staff for personal or household needs like
                nannies, cleaners, drivers, and more.
              </p>
            </div>

            {/* Buttons */}
            <div className="mt-5 grid grid-cols-2 gap-3">

              {/* Home */}
              <button
                onClick={handleHome}
                className="px-3 py-2 rounded-full font-medium
                bg-white/10 backdrop-blur-md text-white border border-white/20
                hover:border-white/50 hover:bg-white/20
                hover:shadow-[0_0_15px_rgba(255,255,255,0.25)]
                hover:scale-[1.03]
                active:scale-95
                transition-all duration-300"
              >
                Home
              </button>

              {/* Continue */}
              <button
                onClick={() => handleContinue("private")}
                className="relative overflow-hidden px-3 py-2 rounded-full font-medium
                text-white border border-cyan-400/40
                bg-gradient-to-r from-[#2385cd] via-cyan-400 to-[#2385cd]
                hover:shadow-[0_0_18px_#2385cd,0_0_40px_rgba(35,133,205,0.6)]
                hover:scale-[1.03]
                active:scale-95
                transition-all duration-300 group"
              >
                <span className="relative z-10">Continue</span>

                {/* Glow Overlay */}
                <span
                  className="absolute inset-0 opacity-0 group-hover:opacity-100
                  bg-white/10 blur-md transition duration-300"
                />
              </button>
            </div>
          </motion.div>

          {/* ───────────────── ORGANIZATION ───────────────── */}
          <motion.div
            whileHover={{ scale: 1.03 }}
            className="p-6 rounded-2xl bg-white/10 border border-white/20
            hover:bg-white/20 transition-all duration-300
            backdrop-blur-lg flex flex-col
            hover:shadow-[0_0_25px_rgba(35,133,205,0.18)]"
          >
            <div className="flex-1">
              <div className="w-10 h-10 rounded-full bg-sky-400/20 flex items-center justify-center mb-3">
                <span className="text-sky-300 text-lg"></span>
              </div>

              <h3 className="text-lg font-semibold mb-2">
                Organization Hiring
              </h3>

              <p className="text-sm text-white/70">
                Recruit skilled professionals for your business or company
                operations quickly and efficiently.
              </p>
            </div>

            {/* Buttons */}
            <div className="mt-5 grid grid-cols-2 gap-3">

              {/* Home */}
              <button
                onClick={handleHome}
                className="px-3 py-2 rounded-full font-medium
                bg-white/10 backdrop-blur-md text-white border border-white/20
                hover:border-white/50 hover:bg-white/20
                hover:shadow-[0_0_15px_rgba(255,255,255,0.25)]
                hover:scale-[1.03]
                active:scale-95
                transition-all duration-300"
              >
                Home
              </button>

              {/* Continue */}
              <button
                onClick={() => handleContinue("organization")}
                className="relative overflow-hidden px-3 py-2 rounded-full font-medium
                text-white border border-cyan-400/40
                bg-gradient-to-r from-[#1d4ed8] via-[#2385cd] to-cyan-400
                hover:shadow-[0_0_18px_#2385cd,0_0_40px_rgba(35,133,205,0.6)]
                hover:scale-[1.03]
                active:scale-95
                transition-all duration-300 group"
              >
                <span className="relative z-10">Continue</span>

                {/* Glow Overlay */}
                <span
                  className="absolute inset-0 opacity-0 group-hover:opacity-100
                  bg-white/10 blur-md transition duration-300"
                />
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </ModalShell>
  );
}

export default HireStaffModal;