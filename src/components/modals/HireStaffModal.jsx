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
          className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-slate-700 border border-white/20 text-white flex items-center justify-center hover:bg-slate-600 transition"
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
          {/* Private */}
          <motion.div
            whileHover={{ scale: 1.03 }}
            className="p-6 rounded-2xl bg-white/10 border border-white/20
            hover:bg-white/20 transition backdrop-blur-lg flex flex-col"
          >
            <div className="flex-1">
              <div className="w-10 h-10 rounded-full bg-sky-400/20 flex items-center justify-center mb-3">
                <span className="text-sky-300 text-lg"></span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Private Hiring</h3>
              <p className="text-sm text-white/70">
                Hire trusted staff for personal or household needs like
                nannies, cleaners, drivers, and more.
              </p>
            </div>
            <button
              onClick={() => handleContinue("private")}
              className="mt-5 w-full px-3 py-2 rounded-full font-medium
              bg-[#3e99da] text-white
              hover:shadow-[0_0_15px_#2385cd,0_0_35px_#2385cd]
              hover:scale-[1.02] transition-all duration-300"
            >
              Continue
            </button>
          </motion.div>

          {/* Organization */}
          <motion.div
            whileHover={{ scale: 1.03 }}
            className="p-6 rounded-2xl bg-white/10 border border-white/20
            hover:bg-white/20 transition backdrop-blur-lg flex flex-col"
          >
            <div className="flex-1">
              <div className="w-10 h-10 rounded-full bg-sky-400/20 flex items-center justify-center mb-3">
                <span className="text-sky-300 text-lg"></span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Organization Hiring</h3>
              <p className="text-sm text-white/70">
                Recruit skilled professionals for your business or company
                operations quickly and efficiently.
              </p>
            </div>
            <button
              onClick={() => handleContinue("organization")}
              className="mt-5 w-full px-2 py-2 active:scale-95 rounded-full font-medium
              bg-white/10 backdrop-blur-md text-white border border-white/20
              hover:border-[#2385cd]/70 hover:text-[#4aa2e0]
              hover:shadow-[0_0_15px_#2385cd] hover:bg-white/5
              transition-all duration-300"
            >
              Continue
            </button>
          </motion.div>
        </div>
      </motion.div>
    </ModalShell>
  );
}
export default HireStaffModal;