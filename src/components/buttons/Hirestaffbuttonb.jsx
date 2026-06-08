import { useState } from "react";
import { useNavigate } from "react-router-dom";
import HireStaffModal from "../modals/HireStaffModal";

export function HireStaffButtonB({ user, variant = "default", style = {} }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setOpen(true);
  };

  /* ── variant: "gold" — used inside the CTA block (warm gold pill) ── */
  if (variant === "gold") {
    return (
      <>
        <button
          onClick={handleClick}
          style={{
            background: "#c8a96e",
            color: "#0d1b2e",
            border: "none",
            padding: "12px 28px",
            fontSize: 13,
            fontWeight: 500,
            fontFamily: "'DM Sans', sans-serif",
            cursor: "pointer",
            letterSpacing: "0.3px",
            borderRadius: 2,
            transition: "background 0.15s",
            ...style,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#b8924f")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#c8a96e")}
        >
          Hire Staff Today
        </button>

        {open && <HireStaffModal onClose={() => setOpen(false)} />}
      </>
    );
  }

  /* ── variant: "outline" — ghost/outline for dark backgrounds ── */
  if (variant === "outline") {
    return (
      <>
        <button
          onClick={handleClick}
          style={{
            background: "rgba(255,255,255,0.07)",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.25)",
            padding: "12px 24px",
            fontSize: 13,
            fontFamily: "'DM Sans', sans-serif",
            cursor: "pointer",
            borderRadius: 2,
            transition: "background 0.15s, border-color 0.15s",
            ...style,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.13)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.45)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.07)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
          }}
        >
          Hire Staff Today
        </button>

        {open && <HireStaffModal onClose={() => setOpen(false)} />}
      </>
    );
  }

  /* ── variant: "default" — solid blue, used in sidebar ── */
  return (
    <>
      <button
        onClick={handleClick}
        style={{
          background: "#2385cd",
          color: "#fff",
          border: "none",
          padding: "12px 28px",
          fontSize: 13,
          fontWeight: 500,
          fontFamily: "'DM Sans', sans-serif",
          cursor: "pointer",
          letterSpacing: "0.3px",
          borderRadius: 2,
          transition: "background 0.15s",
          ...style,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#1a6aaa")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "#2385cd")}
      >
        Hire Staff Today
      </button>

      {open && <HireStaffModal onClose={() => setOpen(false)} />}
    </>
  );
}

export default HireStaffButtonB;