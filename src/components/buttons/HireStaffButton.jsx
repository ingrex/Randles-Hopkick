import { useState } from "react";
import { useNavigate } from "react-router-dom";
import HireStaffModal from "../modals/HireStaffModal";

export function HireStaffButton({ user, onBeforeOpen }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    if (!user) {
      navigate("/login");
      return;
    }

    // Close whatever parent modal/card is open first, then open HireStaffModal
    if (onBeforeOpen) onBeforeOpen();
    setOpen(true);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="px-8 py-3 rounded-full font-semibold text-white
          bg-white/10 backdrop-blur-md
          border border-white/30
          hover:border-[#2385cd]
          hover:text-[#2385cd]
          hover:bg-white/5
          hover:shadow-[0_0_25px_rgba(35,133,205,0.35)]
          hover:scale-[1.05]
          active:scale-[0.97]
          transition-all duration-300"
      >
        Hire Staff
      </button>

      {open && <HireStaffModal onClose={() => setOpen(false)} />}
    </>
  );
}

export default HireStaffButton;