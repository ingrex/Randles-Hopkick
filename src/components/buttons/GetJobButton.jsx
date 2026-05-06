import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import StaffForm from "../../ApplicationForms/StaffForm";

export function GetJobButton({ user }) {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const handleClick = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setShowModal(true);
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
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}  // click backdrop to close
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-2xl"
              onClick={(e) => e.stopPropagation()}  // don't close when clicking inside
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-sky-400/10 blur-3xl rounded-xl pointer-events-none" />

              {/* Close button */}
              <button
                onClick={() => setShowModal(false)}
                className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-slate-700 border border-white/20 text-white flex items-center justify-center hover:bg-slate-600 transition"
              >
                ✕
              </button>

              <div className="relative">
                <StaffForm onSubmit={() => setShowModal(false)} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default GetJobButton;