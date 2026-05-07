import { useState } from "react";
import { useNavigate } from "react-router-dom";
import HireStaffModal from "../modals/HireStaffModal";

export function HireStaffButton({ user }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    if (!user) {
      navigate("/login");
      return;
    }

    setOpen(true);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="relative px-6 py-2 rounded-full text-sm font-semibold text-white overflow-hidden group transition-all duration-300 hover:scale-105 active:scale-95"
      >
        {/* Button Text */}
        <span className="relative z-10">Hire Staff</span>

        {/* Animated Gradient Background */}
        <span className="absolute inset-0 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 opacity-80 blur-sm group-hover:opacity-100 transition duration-300" />

        {/* Glass Overlay */}
        <span className="absolute inset-[1px] rounded-full bg-black/30 backdrop-blur-md border border-white/20" />
      </button>

      {open && <HireStaffModal onClose={() => setOpen(false)} />}
    </>
  );
}

export default HireStaffButton;