// src/components/Header.jsx

import React, { useState, useEffect, useRef } from "react";
import {
  Menu,
  X,
  ChevronDown,
  User,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../pages/AuthContext";
import Logo from "./Logo";
import HireStaffButton from "./buttons/HireStaffButton1";

/* ── Magnetic Nav Item ── */
const MagneticNavItem = ({ children }) => {
  const ref = useRef(null);

  const handleMouseMove = (e) => {
    const el = ref.current;
    const rect = el.getBoundingClientRect();

    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    el.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
  };

  const handleMouseLeave = () => {
    const el = ref.current;
    el.style.transform = "translate(0px, 0px)";
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="transition-transform duration-300 ease-out"
    >
      {children}
    </div>
  );
};

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const { user, logout } = useAuth();

  /* ── Scroll detection ── */
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);

    window.addEventListener("scroll", onScroll);

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── Close menus on route change ── */
  useEffect(() => {
    setDropdownOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getInitials = (u) => {
    if (!u) return "?";

    const parts = [
      u.surname,
      u.otherNames,
      u.firstName,
      u.name,
    ].filter(Boolean);

    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    if (u.email) {
      return u.email[0].toUpperCase();
    }

    return "?";
  };

  const getDisplayName = (u) => {
    if (!u) return "";

    if (u.otherNames && u.surname) {
      return `${u.otherNames} ${u.surname}`;
    }

    if (u.surname) return u.surname;
    if (u.name) return u.name;
    if (u.email) return u.email;

    return "User";
  };

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Services", path: "/services" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
        isScrolled
          ? "bg-[#0f2027]/90 backdrop-blur-xl shadow-lg border-b border-white/10"
          : "bg-black/30 backdrop-blur-md"
      }`}
    >
      {/* FIXED HEIGHT CONTAINER */}
      <div className="relative max-w-7xl mx-auto px-6 h-16 md:h-20 flex items-center justify-between">

        {/* ── LEFT: LOGO ── */}
        <div className="flex items-center pt-4 min-w-[140px]">
          <NavLink to="/" className="flex items-center">
            <Logo className="w-auto" />
          </NavLink>
        </div>

        {/* ── CENTER NAV ── */}
        <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          {navItems.map((item, i) => {
            const isActive = location.pathname === item.path;

            return (
              <MagneticNavItem key={i}>
                <NavLink
                  to={item.path}
                  className={`relative text-sm font-medium transition ${
                    isActive
                      ? "text-white"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  {item.name}

                  {isActive && (
                    <motion.div
                      layoutId="underline"
                      className="absolute left-0 -bottom-1 w-full h-0.5 bg-blue-400"
                    />
                  )}
                </NavLink>
              </MagneticNavItem>
            );
          })}
        </nav>

        {/* ── RIGHT ── */}
        <div className="hidden md:flex items-center gap-5 min-w-[200px] justify-end">

          {!user && (
            <NavLink
              to="/login"
              className="text-sm text-white px-3 py-1 rounded-md bg-white/10 border border-white/20 hover:bg-white/20 transition"
            >
              Login
            </NavLink>
          )}

          {user && (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/10 transition"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-xs font-semibold border border-white/20">
                  {getInitials(user)}
                </div>

                <span className="text-sm text-white/90 max-w-[110px] truncate">
                  {getDisplayName(user)}
                </span>

                <ChevronDown
                  size={14}
                  className={`text-white/70 transition-transform ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-3 w-56 bg-[#1e2a2e] rounded-xl shadow-xl border border-white/10 p-3 z-50"
                  >
                    <div className="flex items-center gap-3 mb-3 pb-3 border-b border-white/10">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                        {getInitials(user)}
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm text-white font-medium truncate">
                          {getDisplayName(user)}
                        </p>

                        {user.email && (
                          <p className="text-xs text-white/45 truncate">
                            {user.email}
                          </p>
                        )}
                      </div>
                    </div>

                    <NavLink
                      to="/dashboard"
                      className="flex items-center gap-2 px-2 py-2 rounded-md text-white/80 hover:text-white hover:bg-white/10 text-sm transition"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <LayoutDashboard size={14} />
                      Dashboard
                    </NavLink>

                    <NavLink
                      to="/profile"
                      className="flex items-center gap-2 px-2 py-2 rounded-md text-white/80 hover:text-white hover:bg-white/10 text-sm transition"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <User size={14} />
                      My Profile
                    </NavLink>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-white/10 text-sm text-red-400 hover:text-red-300 transition mt-1"
                    >
                      <LogOut size={14} />
                      Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* CTA */}
          <div className="flex items-center">
            <HireStaffButton user={user} />
          </div>
        </div>

        {/* ── MOBILE TOGGLE ── */}
        <div className="md:hidden">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="p-2 rounded-lg bg-white/10 border border-white/20 text-white"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* ── MOBILE MENU ── */}
      <motion.div
        initial={{ height: 0 }}
        animate={{ height: menuOpen ? "auto" : 0 }}
        className="md:hidden overflow-hidden bg-[#0f2027] px-6"
      >
        <div className="py-5 space-y-4">

          {navItems.map((item, i) => (
            <NavLink
              key={i}
              to={item.path}
              className={({ isActive }) =>
                `block text-sm ${
                  isActive ? "text-blue-400" : "text-white"
                }`
              }
              onClick={() => setMenuOpen(false)}
            >
              {item.name}
            </NavLink>
          ))}

          <div className="border-t border-white/10 pt-4 space-y-3">

            {!user ? (
              <NavLink
                to="/login"
                className="block text-white text-sm"
                onClick={() => setMenuOpen(false)}
              >
                Login
              </NavLink>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                    {getInitials(user)}
                  </div>

                  <div>
                    <p className="text-sm text-white font-medium">
                      {getDisplayName(user)}
                    </p>

                    {user.email && (
                      <p className="text-xs text-white/45">
                        {user.email}
                      </p>
                    )}
                  </div>
                </div>

                <NavLink
                  to="/dashboard"
                  className="flex items-center gap-2 text-blue-400 text-sm"
                  onClick={() => setMenuOpen(false)}
                >
                  <LayoutDashboard size={14} />
                  Dashboard
                </NavLink>

                <NavLink
                  to="/profile"
                  className="flex items-center gap-2 text-white/80 text-sm"
                  onClick={() => setMenuOpen(false)}
                >
                  <User size={14} />
                  My Profile
                </NavLink>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-red-400 text-sm"
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </>
            )}
          </div>

          {/* Mobile CTA */}
          <div className="pt-2">
            <HireStaffButton user={user} />
          </div>

        </div>
      </motion.div>
    </header>
  );
};

export default Header;