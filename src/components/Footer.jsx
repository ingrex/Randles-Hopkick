import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Logo from "./Logo";

/**
 * useServiceHashScroll — add inside ServicesPage to auto-scroll to hash sections.
 *
 * Usage in ServicesPage.jsx:
 *   import { useServiceHashScroll } from "./Footer";
 *   export function ServicesPage() { useServiceHashScroll(); ... }
 */
export function useServiceHashScroll() {
  useEffect(() => {
    const hash = window.location.hash?.replace("#", "");
    if (!hash) return;
    const t = setTimeout(() => {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return () => clearTimeout(t);
  }, []);
}

/* ─────────────────────────────────────────────────────────────────
   WhatsAppFloatingCTA — export and place once in App.jsx / layout
   so it persists across all pages.

   Usage in App.jsx:
     import { WhatsAppFloatingCTA } from "./Footer";
     export default function App() {
       return (
         <>
           <Router> ... </Router>
           <WhatsAppFloatingCTA />
         </>
       );
     }
───────────────────────────────────────────────────────────────── */
export const WhatsAppFloatingCTA = () => {
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);

  // Fade in after 1.5 s so it doesn't clash with page load
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <a
      href="https://wa.me/2347068172272?text=Hello%2C%20I%27d%20like%20to%20enquire%20about%20your%20staffing%20services."
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "fixed",
        bottom: "28px",
        right: "28px",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: "10px",
        background: "#25D366",
        borderRadius: "50px",
        boxShadow: "0 4px 24px rgba(37,211,102,0.35)",
        padding: hovered ? "12px 20px 12px 14px" : "14px",
        textDecoration: "none",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 0.4s ease, transform 0.4s ease, padding 0.25s ease, box-shadow 0.2s ease",
        overflow: "hidden",
        whiteSpace: "nowrap",
        cursor: "pointer",
      }}
    >
      {/* WhatsApp icon */}
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.115.549 4.099 1.51 5.827L.057 23.428a.75.75 0 0 0 .921.921l5.687-1.49A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.699 9.699 0 0 1-4.952-1.355l-.355-.211-3.676.964.979-3.58-.232-.368A9.699 9.699 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z" />
      </svg>

      {/* Label — only visible on hover */}
      <span
        style={{fontSize: "13px",fontWeight: 600,color: "white",maxWidth: hovered ? "140px" : "0px",opacity: hovered ? 1 : 0,transition: "max-width 0.25s ease, opacity 0.2s ease",overflow: "hidden",
        letterSpacing: "0.2px",
        }}
      >
        Chat with us
      </span>
    </a>
  );
};

/* ── Social icon paths ── */
const FacebookIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);
const InstagramIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
  </svg>
);
const LinkedInIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);
const XIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4l16 16M4 20L20 4" />
  </svg>
);
const WhatsAppIconSmall = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

/* ── Contact icon helpers ── */
const MapPinIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const PhoneIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.07 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3 2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16.92z" />
  </svg>
);
const MailIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);
const GlobeIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

/* ── Reusable sub-components ────────────────────────────────────── */
const ContactItem = ({ icon, children }) => (
  <div className="flex items-start gap-3 mb-4">
    <div className="w-[30px] h-[30px] flex-shrink-0 rounded-md border border-white/10 flex items-center justify-center text-[#2385cd] mt-0.5">
      {icon}
    </div>
    <div className="text-[12.5px] text-white/55 leading-relaxed">{children}</div>
  </div>
);

const SocialBtn = ({ href, label, children }) => (
  <a
    href={href}
    aria-label={label}
    target="_blank"
    rel="noopener noreferrer"
    className="w-8 h-8 rounded-md border border-white/[0.12] flex items-center justify-center text-white/45 hover:border-[#2385cd] hover:text-[#2385cd] hover:bg-[#2385cd]/10 transition-all duration-200"
  >
    {children}
  </a>
);

/**
 * NavLink — highlights the active route using react-router-dom's useLocation.
 *
 * For hash links like /services#corporate, it matches both the pathname
 * and the hash so the correct service link lights up when on that page.
 */
const NavLink = ({ href, children }) => {
  const { pathname, hash } = useLocation();

  // Split href into path + optional hash
  const [linkPath, linkHash = ""] = href.split("#");
  const fullHash = linkHash ? `#${linkHash}` : "";

  const isActive =
    pathname === linkPath && (fullHash === "" || hash === fullHash);

  return (
    <li>
      <a
        href={href}
        className={[
          "text-[13.5px] transition-colors duration-200 flex items-center gap-2 group",
          isActive ? "text-white font-medium" : "text-white/60 hover:text-white",
        ].join(" ")}
      >
        <span
          className={[
            "block h-px transition-all duration-300",
            isActive
              ? "w-5 bg-[#2385cd]"
              : "w-3 bg-white/20 group-hover:w-5 group-hover:bg-[#2385cd]",
          ].join(" ")}
        />
        {children}
        {isActive && (
          <span className="ml-auto w-1 h-1 rounded-full bg-[#2385cd] flex-shrink-0" />
        )}
      </a>
    </li>
  );
};

/* ── Main Footer ── */
const Footer = () => {
  return (
    <footer className="bg-[#00223d] text-gray-300 overflow-hidden">

      {/* Accent bar */}
      <div
        className="h-[3px]"
        style={{ background: "linear-gradient(90deg, #2385cd 0%, transparent 60%)" }}
      />

      {/* Main grid */}
      <div className="max-w-7xl mx-auto grid gap-0 md:grid-cols-2 lg:grid-cols-4 px-6 md:px-12 pt-14 pb-12">

        {/* BRAND */}
        <div className="lg:pr-10 pb-10 lg:pb-0">
          <div className="mb-3">
            <Logo width={90} />
          </div>
          <p className="text-[13px] italic text-white/40 mb-4 leading-relaxed" style={{ fontFamily: "'Georgia', serif" }}>
            "Exceptional people for exceptional results."
          </p>
          <p className="text-[13px] text-white/45 leading-[1.85] mb-6">
            Randle &amp; Hopkick is a domestic outsourcing service firm established to provide exceptional
            services geared at meeting our clients' needs for domestic staff and related services; built on trust,
            precision, and a commitment to exceeding expectations.{" "}
            <a href="/about" className="text-[#2385cd] hover:underline underline-offset-2">Read more</a>
          </p>
        </div>

        {/* QUICK LINKS */}
        <div className="lg:border-l lg:border-white/[0.06] lg:pl-10 lg:pr-10 pb-10 lg:pb-0">
          <h3 className="text-[10px] tracking-[3px] uppercase text-white/30 font-medium mb-6">Quick Links</h3>
          <ul className="space-y-3.5">
            <NavLink href="/">Home</NavLink>
            <NavLink href="/services">Services</NavLink>
            <NavLink href="/about">About Us</NavLink>
            <NavLink href="/blog">Blog</NavLink>
            <NavLink href="/contact">Contact</NavLink>
          </ul>
        </div>

        {/* SERVICES */}
        <div className="lg:border-l lg:border-white/[0.06] lg:pl-10 lg:pr-10 pb-10 lg:pb-0">
          <h3 className="text-[10px] tracking-[3px] uppercase text-white/30 font-medium mb-6">Our Services</h3>
          <ul className="space-y-3.5">
            <NavLink href="/services#corporate">Corporate Staffing</NavLink>
            <NavLink href="/services#artisans">Artisan Outsourcing</NavLink>
            <NavLink href="/services#domestic">Domestic Staffing</NavLink>
            <NavLink href="/services#training">Staff Training</NavLink>
          </ul>
        </div>

        {/* CONTACT */}
        <div className="lg:border-l lg:border-white/[0.06] lg:pl-10">
          <h3 className="text-[10px] tracking-[3px] uppercase text-white/30 font-medium mb-6">Contact Us</h3>

          <ContactItem icon={<MapPinIcon />}>
            73, Ogudu Road, Ojota<br />Lagos, Nigeria
          </ContactItem>

          <ContactItem icon={<PhoneIcon />}>
            +234 706 817 2272
          </ContactItem>

          <ContactItem icon={<MailIcon />}>
            info@randleandhopkick.com
          </ContactItem>

          <ContactItem icon={<GlobeIcon />}>
            www.randleandhopkick.com
          </ContactItem>

          {/* Social icons */}
          <div className="flex gap-2 mt-6">
            <SocialBtn href="https://web.facebook.com/randleandhopkick" label="Facebook">
              <FacebookIcon />
            </SocialBtn>
            <SocialBtn href="https://instagram.com/randleandhopkick" label="Instagram">
              <InstagramIcon />
            </SocialBtn>
            <SocialBtn href="https://linkedin.com/company/randleandhopkick" label="LinkedIn">
              <LinkedInIcon />
            </SocialBtn>
            <SocialBtn href="https://x.com/randleandhopkick" label="X / Twitter">
              <XIcon />
            </SocialBtn>
            <SocialBtn href="https://wa.me/2347068172272" label="WhatsApp">
              <WhatsAppIconSmall />
            </SocialBtn>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/[0.06] mx-6 md:mx-12" />
      <div className="px-6 md:px-12 py-4 flex flex-col sm:flex-row justify-between items-center gap-3">
        <p className="text-[11.5px] text-white/25 tracking-wide">
          © {new Date().getFullYear()} Randle &amp; Hopkick. All rights reserved.
        </p>
        <div className="flex gap-5">
          <a href="/privacy" className="text-[11.5px] text-white/25 hover:text-white/50 transition-colors duration-200">
            Privacy Policy
          </a>
          <a href="/terms" className="text-[11.5px] text-white/25 hover:text-white/50 transition-colors duration-200">
            Terms of Service
          </a>
        </div>
      </div>

    </footer>
  );
};

export default Footer;