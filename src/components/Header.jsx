// src/components/Header.jsx — Premium Upgrade (Fixed)

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Menu, X, ChevronDown, User, LogOut, LayoutDashboard } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../pages/AuthContext";
import Logo from "./Logo";
import HireStaffButton from "./buttons/HireStaffButton1";

/* ─────────────────────────────────────────
   useIsMobile — replaces all Tailwind md: classes.
   Returns true when viewport width < 768px.
   Inline styles always override className, so
   visibility is driven by JS state instead.
───────────────────────────────────────── */
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
};

/* ─────────────────────────────────────────
   Magnetic Nav Item
───────────────────────────────────────── */
const MagneticNavItem = ({ children }) => {
  const ref = useRef(null);
  const handleMouseMove = (e) => {
    const el = ref.current;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    el.style.transform = `translate(${x * 0.18}px, ${y * 0.18}px)`;
  };
  const handleMouseLeave = () => {
    ref.current.style.transform = "translate(0px, 0px)";
  };
  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transition: "transform 0.35s cubic-bezier(0.23, 1, 0.32, 1)" }}
    >
      {children}
    </div>
  );
};

/* ─────────────────────────────────────────
   useClickOutside
───────────────────────────────────────── */
const useClickOutside = (ref, handler) => {
  useEffect(() => {
    const listener = (e) => {
      if (!ref.current || ref.current.contains(e.target)) return;
      handler(e);
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
};

/* ─────────────────────────────────────────
   Online dot indicator
───────────────────────────────────────── */
const OnlineDot = () => (
  <span
    style={{
      position: "absolute",
      bottom: 1,
      right: 1,
      width: 9,
      height: 9,
      borderRadius: "50%",
      background: "#22c55e",
      border: "2px solid transparent",
      boxSizing: "border-box",
    }}
  />
);

/* ══════════════════════════════════════════
   HEADER
══════════════════════════════════════════ */
const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isMobile = useIsMobile();

  const dropdownRef = useRef(null);
  useClickOutside(dropdownRef, () => setDropdownOpen(false));

  const isScrolled = scrollY > 10;

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setDropdownOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  // Auto-close mobile menu when resizing to desktop
  useEffect(() => {
    if (!isMobile) setMenuOpen(false);
  }, [isMobile]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const handleLogout = useCallback(() => {
    logout();
    navigate("/login");
  }, [logout, navigate]);

  const getInitials = (u) => {
    if (!u) return "?";
    const parts = [u.surname, u.otherNames, u.firstName, u.name].filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    if (u.email) return u.email[0].toUpperCase();
    return "?";
  };

  const getDisplayName = (u) => {
    if (!u) return "";
    if (u.otherNames && u.surname) return `${u.otherNames} ${u.surname}`;
    if (u.surname) return u.surname;
    if (u.name) return u.name;
    if (u.email) return u.email;
    return "User";
  };

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Services", path: "/services" },
    { name: "About", path: "/about" },
    { name: "Blog", path: "/blog" },
    { name: "Contact", path: "/contact" },
  ];

  const mobileMenuVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: { opacity: 1, height: "auto", transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, height: 0, transition: { duration: 0.22, ease: "easeIn" } },
  };

  const mobileItemVariants = {
    hidden: { opacity: 0, x: -12 },
    visible: (i) => ({
      opacity: 1, x: 0,
      transition: { delay: i * 0.05 + 0.08, duration: 0.28, ease: "easeOut" },
    }),
  };

  const dropdownVariants = {
    hidden: { opacity: 0, y: -6, scale: 0.975, filter: "blur(4px)" },
    visible: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, y: -6, scale: 0.975, filter: "blur(4px)", transition: { duration: 0.12 } },
  };

  return (
    <>
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          zIndex: 1000,
          overflow: "visible",
          transition: "all 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
          background: isScrolled ? "rgba(10, 20, 28, 0.88)" : "rgba(0, 0, 0, 0.25)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderBottom: isScrolled ? "1px solid rgba(56, 139, 255, 0.18)" : "1px solid rgba(255,255,255,0.06)",
          boxShadow: isScrolled ? "0 1px 0 0 rgba(56,139,255,0.08), 0 4px 24px rgba(0,0,0,0.35)" : "none",
        }}
      >
        {/* Top accent line */}
        <motion.div
          animate={{ opacity: isScrolled ? 1 : 0 }}
          transition={{ duration: 0.4 }}
          style={{
            position: "absolute", top: 0, left: 0, right: 0, height: "1px",
            background: "linear-gradient(90deg, transparent 0%, rgba(56,139,255,0.5) 30%, rgba(99,179,255,0.6) 50%, rgba(56,139,255,0.5) 70%, transparent 100%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            maxWidth: "80rem",
            margin: "0 auto",
            padding: "0 1.5rem",
            height: isScrolled ? "64px" : "88px",
            transition: "height 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "2rem",
          }}
        >

          {/* ── LOGO ── */}
          <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            <NavLink to="/" style={{ display: "flex", alignItems: "center" }}>
              <Logo />
            </NavLink>
          </div>

          {/* ── DESKTOP NAV — only rendered on desktop ── */}
          {!isMobile && (
            <nav
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",       // tighter gap — pill bg handles spacing
                flexShrink: 1,
                overflow: "visible",  // was "hidden" — was clipping the underline
              }}
            >
              {navItems.map((item, i) => {
                const isActive = location.pathname === item.path;
                return (
                  <MagneticNavItem key={i}>
                    <NavLink
                      to={item.path}
                      style={{
                        position: "relative",
                        display: "inline-flex",
                        alignItems: "center",
                        fontSize: "0.875rem",
                        fontWeight: isActive ? 600 : 500,
                        letterSpacing: "0.01em",
                        color: isActive ? "#fff" : "rgba(255,255,255,0.6)",
                        textDecoration: "none",
                        whiteSpace: "nowrap",
                        // Pill padding — gives the background and underline room
                        padding: "6px 14px 8px",
                        borderRadius: "8px",
                        transition: "color 0.2s, background 0.2s",
                        // Active pill: subtle blue tint background
                        background: isActive
                          ? "rgba(59,130,246,0.12)"
                          : "transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.color = "#fff";
                          e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.color = "rgba(255,255,255,0.6)";
                          e.currentTarget.style.background = "transparent";
                        }
                      }}
                    >
                      {item.name}

                      {/* ── Upgraded active indicator:
                          - Thicker 3px bar (was 2px)
                          - Sits at bottom: 0 inside padded pill (always visible)
                          - Wider glow spread for better visibility
                          - Brighter gradient
                      ── */}
                      {isActive && (
                        <motion.div
                          layoutId="nav-underline"
                          style={{
                            position: "absolute",
                            left: "14px",         // aligned to text, not pill edge
                            right: "14px",
                            bottom: 0,
                            height: "3px",        // was 2px
                            borderRadius: "999px",
                            background: "linear-gradient(90deg, #60a5fa, #93c5fd, #60a5fa)",
                            boxShadow: "0 0 10px 2px rgba(96,165,250,0.8), 0 0 20px 4px rgba(96,165,250,0.35)",
                          }}
                          transition={{ type: "spring", stiffness: 380, damping: 28 }}
                        />
                      )}
                    </NavLink>
                  </MagneticNavItem>
                );
              })}
            </nav>
          )}

          {/* ── DESKTOP RIGHT ACTIONS — only rendered on desktop ── */}
          {!isMobile && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                justifyContent: "flex-end",
                flexShrink: 0,
              }}
            >
              {!user && (
                <NavLink
                  to="/login"
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 500,
                    color: "rgba(255,255,255,0.8)",
                    padding: "6px 14px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.15)",
                    background: "rgba(255,255,255,0.07)",
                    transition: "all 0.2s",
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.13)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                  }}
                >
                  Login
                </NavLink>
              )}

              {user && (
                <div ref={dropdownRef} style={{ position: "relative" }}>
                  <button
                    onClick={() => setDropdownOpen((o) => !o)}
                    aria-expanded={dropdownOpen}
                    aria-haspopup="true"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "5px 10px 5px 5px",
                      borderRadius: "40px",
                      border: dropdownOpen ? "1px solid rgba(96,165,250,0.4)" : "1px solid rgba(255,255,255,0.12)",
                      background: dropdownOpen ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.06)",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (!dropdownOpen) {
                        e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!dropdownOpen) {
                        e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                      }
                    }}
                  >
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <div
                        style={{
                          width: 30, height: 30, borderRadius: "50%",
                          background: "linear-gradient(135deg, #0ea5e9, #3b82f6)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "11px", fontWeight: 600, color: "#fff",
                          border: "1.5px solid rgba(255,255,255,0.2)",
                        }}
                      >
                        {getInitials(user)}
                      </div>
                      <OnlineDot />
                    </div>
                    <span
                      style={{
                        fontSize: "0.8125rem", fontWeight: 500,
                        color: "rgba(255,255,255,0.9)",
                        maxWidth: "90px", overflow: "hidden",
                        textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}
                    >
                      {getDisplayName(user).split(" ")[0]}
                    </span>
                    <motion.div
                      animate={{ rotate: dropdownOpen ? 180 : 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 22 }}
                    >
                      <ChevronDown size={13} style={{ color: "rgba(255,255,255,0.5)" }} />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        variants={dropdownVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        style={{
                          position: "absolute", right: 0, top: "calc(100% + 10px)",
                          width: "230px",
                          background: "rgba(13, 22, 32, 0.96)",
                          borderRadius: "14px",
                          border: "1px solid rgba(255,255,255,0.1)",
                          boxShadow: "0 20px 40px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(255,255,255,0.05) inset",
                          padding: "10px", zIndex: 50,
                          backdropFilter: "blur(20px)",
                          WebkitBackdropFilter: "blur(20px)",
                        }}
                      >
                        {/* User info */}
                        <div
                          style={{
                            display: "flex", alignItems: "center", gap: "10px",
                            padding: "6px 8px 12px",
                            borderBottom: "1px solid rgba(255,255,255,0.08)",
                            marginBottom: "6px",
                          }}
                        >
                          <div style={{ position: "relative", flexShrink: 0 }}>
                            <div
                              style={{
                                width: 36, height: 36, borderRadius: "50%",
                                background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "13px", fontWeight: 600, color: "#fff",
                                border: "2px solid rgba(255,255,255,0.12)",
                              }}
                            >
                              {getInitials(user)}
                            </div>
                            <OnlineDot />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {getDisplayName(user)}
                            </p>
                            {user.email && (
                              <p style={{ margin: 0, fontSize: "11px", color: "rgba(255,255,255,0.35)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {user.email}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Menu items */}
                        {[
                          { to: "/dashboard", icon: <LayoutDashboard size={14} />, label: "Dashboard", hint: "⌘D" },
                          { to: "/profile", icon: <User size={14} />, label: "My Profile", hint: null },
                        ].map(({ to, icon, label, hint }) => (
                          <NavLink
                            key={to}
                            to={to}
                            onClick={() => setDropdownOpen(false)}
                            style={{
                              display: "flex", alignItems: "center", justifyContent: "space-between",
                              padding: "8px 10px", borderRadius: "8px", textDecoration: "none",
                              color: "rgba(255,255,255,0.75)", fontSize: "13px", fontWeight: 450,
                              transition: "all 0.15s", marginBottom: "2px",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#fff"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.75)"; }}
                          >
                            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              {icon}{label}
                            </span>
                            {hint && (
                              <kbd style={{ fontSize: "10px", padding: "1px 5px", borderRadius: "4px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.3)", fontFamily: "system-ui" }}>
                                {hint}
                              </kbd>
                            )}
                          </NavLink>
                        ))}

                        {/* Sign out */}
                        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", marginTop: "6px", paddingTop: "6px" }}>
                          <button
                            onClick={handleLogout}
                            style={{
                              width: "100%", display: "flex", alignItems: "center", gap: "8px",
                              padding: "8px 10px", borderRadius: "8px", background: "transparent",
                              border: "none", cursor: "pointer", fontSize: "13px",
                              color: "rgba(248,113,113,0.8)", transition: "all 0.15s",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.color = "#f87171"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(248,113,113,0.8)"; }}
                          >
                            <LogOut size={14} />
                            Sign out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <div style={{ flexShrink: 0 }}>
                <HireStaffButton user={user} />
              </div>
            </div>
          )}

          {/* ── MOBILE HAMBURGER — only rendered on mobile ── */}
          {isMobile && (
            <div style={{ display: "flex", justifyContent: "flex-end", flexShrink: 0 }}>
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={() => setMenuOpen((o) => !o)}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                style={{
                  padding: "7px", borderRadius: "10px",
                  background: menuOpen ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.08)",
                  border: menuOpen ? "1px solid rgba(96,165,250,0.3)" : "1px solid rgba(255,255,255,0.15)",
                  color: "#fff", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s",
                }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={menuOpen ? "close" : "open"}
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    {menuOpen ? <X size={19} /> : <Menu size={19} />}
                  </motion.div>
                </AnimatePresence>
              </motion.button>
            </div>
          )}
        </div>
      </header>

      {/* ── MOBILE BACKDROP ── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setMenuOpen(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 998,
              background: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(2px)",
              WebkitBackdropFilter: "blur(2px)",
            }}
          />
        )}
      </AnimatePresence>

      {/* ── MOBILE MENU DRAWER ── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            variants={mobileMenuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              position: "fixed",
              top: isScrolled ? "64px" : "88px",
              left: 0, right: 0, zIndex: 999,
              background: "rgba(10, 18, 26, 0.97)",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "1.25rem 1.5rem 1.5rem" }}>

              {navItems.map((item, i) => {
                const isActive = location.pathname === item.path;
                return (
                  <motion.div key={i} custom={i} variants={mobileItemVariants} initial="hidden" animate="visible">
                    <NavLink
                      to={item.path}
                      onClick={() => setMenuOpen(false)}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "11px 0", borderBottom: "1px solid rgba(255,255,255,0.05)",
                        fontSize: "15px", fontWeight: isActive ? 600 : 400,
                        color: isActive ? "#60a5fa" : "rgba(255,255,255,0.8)",
                        textDecoration: "none",
                      }}
                    >
                      {item.name}
                      {isActive && (
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#60a5fa", boxShadow: "0 0 6px #60a5fa" }} />
                      )}
                    </NavLink>
                  </motion.div>
                );
              })}

              <div style={{ marginTop: "1.25rem", paddingTop: "1.25rem", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                {!user ? (
                  <motion.div custom={navItems.length} variants={mobileItemVariants} initial="hidden" animate="visible">
                    <NavLink
                      to="/login"
                      onClick={() => setMenuOpen(false)}
                      style={{ display: "block", color: "rgba(255,255,255,0.8)", fontSize: "15px", textDecoration: "none", marginBottom: "1rem" }}
                    >
                      Login
                    </NavLink>
                  </motion.div>
                ) : (
                  <motion.div custom={navItems.length} variants={mobileItemVariants} initial="hidden" animate="visible">
                    <div
                      style={{
                        display: "flex", alignItems: "center", gap: "12px",
                        padding: "10px 12px", borderRadius: "12px",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        marginBottom: "12px",
                      }}
                    >
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        <div
                          style={{
                            width: 38, height: 38, borderRadius: "50%",
                            background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "13px", fontWeight: 600, color: "#fff",
                          }}
                        >
                          {getInitials(user)}
                        </div>
                        <OnlineDot />
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#fff" }}>{getDisplayName(user)}</p>
                        {user.email && <p style={{ margin: 0, fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>{user.email}</p>}
                      </div>
                    </div>

                    <NavLink to="/dashboard" onClick={() => setMenuOpen(false)} style={{ display: "flex", alignItems: "center", gap: "8px", color: "#60a5fa", fontSize: "14px", textDecoration: "none", padding: "8px 0" }}>
                      <LayoutDashboard size={15} /> Dashboard
                    </NavLink>
                    <NavLink to="/profile" onClick={() => setMenuOpen(false)} style={{ display: "flex", alignItems: "center", gap: "8px", color: "rgba(255,255,255,0.7)", fontSize: "14px", textDecoration: "none", padding: "8px 0" }}>
                      <User size={15} /> My Profile
                    </NavLink>
                    <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: "8px", color: "#f87171", fontSize: "14px", background: "none", border: "none", cursor: "pointer", padding: "8px 0", marginTop: "2px" }}>
                      <LogOut size={15} /> Sign out
                    </button>
                  </motion.div>
                )}
              </div>

              <motion.div custom={navItems.length + 1} variants={mobileItemVariants} initial="hidden" animate="visible" style={{ marginTop: "1.25rem" }}>
                <HireStaffButton user={user} />
              </motion.div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;