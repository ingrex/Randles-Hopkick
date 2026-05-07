import React, { useEffect } from "react";
import Logo from "./Logo";

/**
 * Add this hook inside ServicesPage so arriving at /services#corporate
 * (etc.) automatically scrolls to the correct section.
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

const Footer = () => {
  return (
    <footer className="bg-[#00223d] text-gray-300 pt-16 pb-6 px-6">
      <div className="max-w-7xl mx-auto grid gap-10 md:grid-cols-2 lg:grid-cols-4">

        {/* BRAND */}
        <div>
          <h2 className="text-gray-500 text-2xl font-semibold mb-2">
            <Logo width={100} />
          </h2>
          <p className="text-sm leading-6">
            Randle & Hopkick is a domestic outsourcing service firm established to provide exceptional
            services that are geared at meeting our client's needs for domestic staff and related
            services. At Randle and Hopkick, we seek to exceed our client expectations through the
            provision of exceptional and timely professional services... Read more
          </p>
          <p className="text-white font-extrabold mt-4 text-sm tracking-wide">
            REACHING FOR THE NEXT MILESTONE
          </p>
        </div>

        {/* QUICK LINKS */}
        <div>
          <h3 className="text-white font-semibold mb-4">QUICK LINKS</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="/"         className="hover:text-white transition-colors">Home</a></li>
            <li><a href="/services" className="hover:text-white transition-colors">Services</a></li>
            <li><a href="/about"    className="hover:text-white transition-colors">About Us</a></li>
            <li><a href="/contact"  className="hover:text-white transition-colors">Contact</a></li>
          </ul>
        </div>

        {/* SERVICES */}
        <div>
          <h3 className="text-white font-semibold mb-4">OUR SERVICES</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="/services#corporate"  className="hover:text-white transition-colors">Corporate Staffing</a></li>
            <li><a href="/services#artisans" className="hover:text-white transition-colors">Artisan Outsourcing</a></li>
            <li><a href="/services#domestic"   className="hover:text-white transition-colors">Domestic Staffing</a></li>
            <li><a href="/services#training"      className="hover:text-white transition-colors">Staff Training</a></li>
          </ul>
        </div>

        {/* CONTACT */}
        <div>
          <h3 className="text-white font-semibold mb-4">CONTACT US</h3>
          <p className="text-sm leading-6">73, Ogudu Road, Ojota, Lagos. Nigeria</p>
          <p className="mt-2 text-sm">+234 706 817 2272</p>
          <p className="mt-2 text-sm">info@randleandhopkick.com</p>
          <p className="mt-2 text-gray-300 text-sm">www.randleandhopkick.com</p>

          {/* SOCIAL ICONS */}
          <div className="flex gap-3 mt-5">

            {/* Facebook */}
            <a href="https://web.facebook.com/randleandhopkick" aria-label="Facebook"
              target="_blank" rel="noopener noreferrer"
              className="w-9 h-9 rounded-full border border-gray-600 flex items-center justify-center text-gray-400 hover:border-[#2385cd] hover:text-[#2385cd] hover:bg-[#2385cd]/10 transition-all duration-200">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
            </a>

            {/* Instagram */}
            <a href="https://instagram.com/randleandhopkick" aria-label="Instagram"
              target="_blank" rel="noopener noreferrer"
              className="w-9 h-9 rounded-full border border-gray-600 flex items-center justify-center text-gray-400 hover:border-[#2385cd] hover:text-[#2385cd] hover:bg-[#2385cd]/10 transition-all duration-200">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <circle cx="12" cy="12" r="4"/>
                <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/>
              </svg>
            </a>

            {/* LinkedIn */}
            <a href="https://linkedin.com/company/randleandhopkick" aria-label="LinkedIn"
              target="_blank" rel="noopener noreferrer"
              className="w-9 h-9 rounded-full border border-gray-600 flex items-center justify-center text-gray-400 hover:border-[#2385cd] hover:text-[#2385cd] hover:bg-[#2385cd]/10 transition-all duration-200">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/>
                <rect x="2" y="9" width="4" height="12"/>
                <circle cx="4" cy="4" r="2"/>
              </svg>
            </a>

            {/* X / Twitter */}
            <a href="https://x.com/randleandhopkick" aria-label="X / Twitter"
              target="_blank" rel="noopener noreferrer"
              className="w-9 h-9 rounded-full border border-gray-600 flex items-center justify-center text-gray-400 hover:border-[#2385cd] hover:text-[#2385cd] hover:bg-[#2385cd]/10 transition-all duration-200">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4l16 16M4 20L20 4"/>
              </svg>
            </a>

            {/* WhatsApp */}
            <a href="https://wa.me/2347068172272" aria-label="WhatsApp"
              target="_blank" rel="noopener noreferrer"
              className="w-9 h-9 rounded-full border border-gray-600 flex items-center justify-center text-gray-400 hover:border-[#2385cd] hover:text-[#2385cd] hover:bg-[#2385cd]/10 transition-all duration-200">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
              </svg>
            </a>

          </div>
        </div>

      </div>

      <div className="border-t border-gray-600 mt-10 pt-4 text-center text-sm text-gray-400">
        <p>© {new Date().getFullYear()} Randle & Hopkick. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;