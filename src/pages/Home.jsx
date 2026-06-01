import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import GetJobButton from "../components/buttons/GetJobButton";
import HireStaffButton from "../components/buttons/HireStaffButton";
import Testimonials from "../components/Testimonials";

/* ─── Animated counter hook ─────────────────────────────────────── */
function useCountUp(target, duration = 1800, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    const numeric = parseFloat(target.replace(/[^0-9.]/g, ""));
    const isFloat = target.includes(".");
    const startTime = performance.now();
    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * numeric;
      setCount(isFloat ? current.toFixed(1) : Math.floor(current));
      if (progress < 1) requestAnimationFrame(tick);
      else setCount(isFloat ? numeric.toFixed(1) : Math.floor(numeric));
    };
    requestAnimationFrame(tick);
  }, [start, target, duration]);

  const suffix = target.replace(/[0-9.]/g, "");
  return `${count}${suffix}`;
}

/* ─── Single stat card with its own observer ────────────────────── */
function StatCard({ stat, index, fadeUp }) {
  const ref = useRef(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const animated = useCountUp(stat.number, 1800, started);

  return (
    <motion.div
      key={index}
      ref={ref}
      variants={fadeUp}
      className="flex flex-col justify-center px-10 py-8 relative"
    >
      <div
        style={{
          position: "absolute", left: 0, top: "50%",
          transform: "translateY(-50%)",
          width: "3px", height: "50%",
          background: "linear-gradient(180deg, #2385cd, #0055cc)",
          borderRadius: "2px",
        }}
      />
      <p
        style={{
          fontSize: "clamp(2.5rem, 5vw, 3.5rem)",
          fontWeight: "800",
          color: "#ffffff",
          letterSpacing: "-1px",
          lineHeight: 1,
          marginBottom: "0.5rem",
        }}
      >
        {animated}
      </p>
      <p
        style={{
          fontSize: "0.95rem",
          fontWeight: "600",
          color: "#2385cd",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: "0.35rem",
        }}
      >
        {stat.label}
      </p>
      <p style={{ fontSize: "0.8rem", color: "#8899aa" }}>{stat.desc}</p>
    </motion.div>
  );
}

/* ─── Main component ─────────────────────────────────────────────── */
const Home = () => {
  const user = JSON.parse(localStorage.getItem("user"));

  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.2 } },
  };

  const stats = [
    { number: "100%", label: "Client Satisfaction", desc: "Trusted by every client we serve" },
    { number: "300+", label: "Staff Deployed", desc: "Across homes & businesses" },
    { number: "3+",   label: "Years of Experience", desc: "Delivering excellence consistently" },
  ];

  const whyCards = [
    {
      title: "Verified Professionals",
      desc: "All staff are background-checked.",
      icon: "https://res.cloudinary.com/dotvnclej/image/upload/v1777909393/April_3_vldu5x.png",
    },
    {
      title: "Fast Hiring",
      desc: "Get staff within days.",
      icon: "https://res.cloudinary.com/dotvnclej/image/upload/v1777909591/April_4_qk6qah.png",
    },
    {
      title: "Affordable",
      desc: "Flexible pricing plans.",
      icon: "https://res.cloudinary.com/dotvnclej/image/upload/v1777909798/April_5_qhqmdd.png",
    },
    {
      title: "Support",
      desc: "We stay with you always.",
      icon: "https://res.cloudinary.com/dotvnclej/image/upload/v1777910015/April_6_plc6b3.png",
    },
  ];

  const services = [
    {
      number: "01",
      tag: "Residential",
      title: "Domestic Staffing",
      desc: "We provide professional, vetted home staff including nannies, cleaners, cooks, and housekeepers. Every candidate is background-checked and matched to fit your household's unique routine and culture.",
      image: "https://res.cloudinary.com/dotvnclej/image/upload/v1778601551/Untitled_design_15_kvzz9a.jpg",
    },
    {
      number: "02",
      tag: "Enterprise",
      title: "Corporate Staffing",
      desc: "We source and place skilled professionals tailored to your business operations; from administrative and customer-facing roles to support staff. Our process ensures you get reliable talent, fast.",
      image: "https://res.cloudinary.com/dotvnclej/image/upload/v1778601888/Untitled_design_16_szvtnk.jpg",
    },
    {
      number: "03",
      tag: "Development",
      title: "Staff Training",
      desc: "We equip your existing or newly placed staff with the skills to thrive in modern work environments. Our training programs cover professionalism, role-specific competencies, and workplace etiquette.",
      image: "https://res.cloudinary.com/dotvnclej/image/upload/v1778602221/Untitled_design_17_o8eevf.jpg",
    },
    {
      number: "04",
      tag: "Skilled Trades",
      title: "Artisan Outsourcing",
      desc: "We connect homes and businesses with skilled tradespeople; including electricians, plumbers, painters, and other craftsmen. Get reliable hands-on expertise without the hassle of sourcing them yourself.",
      image: "https://res.cloudinary.com/dotvnclej/image/upload/v1778602685/Untitled_design_18_rl7zlb.jpg",
    },
  ];

  return (
    <div className="w-full overflow-hidden">

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section className="relative h-screen flex items-center justify-center text-white overflow-hidden">

        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('https://res.cloudinary.com/dotvnclej/image/upload/v1778599560/Untitled_design_14_ecewzo.jpg')",
          }}
        />

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 to-black/50" />

        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(35,133,205,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(35,133,205,0.06) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Centre glow */}
        <div
          className="absolute"
          style={{
            width: "600px", height: "340px",
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(35,133,205,0.15) 0%, transparent 70%)",
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
          }}
        />

        {/* Hero content */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={stagger}
          className="relative text-center px-4 max-w-3xl"
        >
          {/* Animated badge */}
          <motion.div variants={fadeUp} className="flex justify-center mb-5">
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(35,133,205,0.15)",
                border: "0.5px solid rgba(35,133,205,0.45)",
                borderRadius: "100px",
                padding: "7px 18px",
                fontSize: "13px",
                color: "#7dc6f5",
                letterSpacing: "0.04em",
              }}
            >
              <span
                style={{
                  width: "7px", height: "7px",
                  borderRadius: "50%",
                  background: "#2385cd",
                  display: "inline-block",
                  animation: "heroPulse 1.8s infinite",
                }}
              />
              Nigeria's most trusted staffing agency
            </div>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-4xl md:text-6xl font-bold leading-tight"
          >
            The{" "}
            <span style={{ color: "#2385cd" }}>right staff</span>,<br />
            placed in days not weeks
          </motion.h1>

          <motion.p variants={fadeUp} className="mt-4 text-lg text-gray-300">
            Recruitment · Outsourcing · Training, built for homes &amp; businesses
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="flex gap-4 justify-center mt-8 flex-wrap"
          >
            <GetJobButton user={user} />
            <HireStaffButton user={user} />
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <div
          className="absolute left-1/2"
          style={{
            bottom: "72px",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
            opacity: 0.4,
          }}
        >
          <div
            style={{
              width: "1px", height: "32px",
              background: "linear-gradient(to bottom, #2385cd, transparent)",
              animation: "scrollLine 1.6s ease-in-out infinite",
            }}
          />
        </div>

        {/* CSS keyframes via style tag */}
        <style>{`
          @keyframes heroPulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.45; transform: scale(1.5); }
          }
          @keyframes scrollLine {
            0%   { transform: scaleY(0); transform-origin: top; opacity: 1; }
            49%  { transform: scaleY(1); transform-origin: top; opacity: 1; }
            50%  { transform: scaleY(1); transform-origin: bottom; opacity: 1; }
            100% { transform: scaleY(0); transform-origin: bottom; opacity: 0; }
          }
          .service-card .reveal-panel {
            position: absolute;
            bottom: 0; left: 0; right: 0;
            background: linear-gradient(to top, rgba(5,10,20,0.98) 60%, rgba(5,10,20,0.88) 100%);
            padding: 1.5rem;
            transform: translateY(100%);
            transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          .service-card:hover .reveal-panel {
            transform: translateY(0);
          }
          .service-card:hover img {
            transform: scale(1.08);
          }
          .service-card:hover .card-border {
            opacity: 1;
          }
          .explore-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            margin-top: 1rem;
            padding: 9px 20px;
            border: 1px solid rgba(35,133,205,0.6);
            border-radius: 100px;
            color: #7dc6f5;
            font-size: 0.82rem;
            font-weight: 600;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            background: transparent;
            cursor: pointer;
            transition: background 0.2s, border-color 0.2s, color 0.2s;
            text-decoration: none;
          }
          .explore-btn:hover {
            background: rgba(35,133,205,0.15);
            border-color: #2385cd;
            color: #ffffff;
          }
          .explore-btn .arrow {
            display: inline-block;
            transition: transform 0.2s;
          }
          .explore-btn:hover .arrow {
            transform: translateX(4px);
          }
        `}</style>
      </section>

      {/* ── STATS (animated counters) ──────────────────────────────── */}
      <section
        style={{
          background: "linear-gradient(135deg, #0a0f1e 0%, #0d1b2a 60%, #0a1628 100%)",
        }}
        className="py-16 px-6 relative overflow-hidden"
      >
        <div
          style={{
            position: "absolute", top: 0, left: 0, right: 0,
            height: "1px",
            background: "linear-gradient(90deg, transparent, #2385cd55, transparent)",
          }}
        />
        <div
          style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            height: "1px",
            background: "linear-gradient(90deg, transparent, #2385cd33, transparent)",
          }}
        />

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x"
          style={{ borderColor: "#2385cd22" }}
        >
          {stats.map((stat, i) => (
            <StatCard key={i} stat={stat} index={i} fadeUp={fadeUp} />
          ))}
        </motion.div>
      </section>

      {/* ── WHY CHOOSE US (accent top-border cards) ───────────────── */}
      <section className="py-20 px-6 text-center">
        <motion.h2
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-3xl font-bold mb-12"
        >
          Why Choose Us
        </motion.h2>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl mx-auto"
        >
          {whyCards.map((item, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              whileHover={{ scale: 1.05, y: -4 }}
              className="p-6 rounded-xl shadow hover:shadow-xl transition"
              style={{
                borderTop: "3px solid #2385cd",
                background: "linear-gradient(160deg, rgba(35,133,205,0.08) 0%, rgba(0,85,204,0.04) 100%)",
              }}
            >
              {/* Icon bubble */}
              <div
                className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{ background: "rgba(35,133,205,0.12)" }}
              >
                <img src={item.icon} alt="" className="w-8 h-8" />
              </div>
              <h3 className="font-semibold text-lg">{item.title}</h3>
              <p className="text-sm mt-2 text-gray-600">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── SERVICES (premium light, slide-up reveal) ─────────────── */}
      <section
        style={{
          background: "linear-gradient(160deg, #f0f6ff 0%, #e8f2fb 50%, #f5f9ff 100%)",
        }}
        className="py-24 px-6 relative overflow-hidden"
      >

        {/* Top border line */}
        <div
          style={{
            position: "absolute", top: 0, left: 0, right: 0,
            height: "1px",
            background: "linear-gradient(90deg, transparent, #2385cd44, transparent)",
          }}
        />
        {/* Bottom border line */}
        <div
          style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            height: "1px",
            background: "linear-gradient(90deg, transparent, #2385cd22, transparent)",
          }}
        />

        {/* Section header */}
        <div
          className="text-center mb-14 max-w-2xl mx-auto"
          style={{ position: "relative", zIndex: 10 }}
        >
          <p
            style={{
              fontSize: "0.78rem",
              fontWeight: "700",
              color: "#1565a8",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              marginBottom: "0.75rem",
            }}
          >
            What We Offer
          </p>
          <h2
            style={{
              fontSize: "clamp(1.8rem, 4vw, 2.4rem)",
              fontWeight: "800",
              color: "#0a1628",
              marginBottom: "0.75rem",
            }}
          >
            Our Services
          </h2>
          <p
            style={{
              color: "#2c4a6a",
              fontSize: "0.97rem",
              lineHeight: 1.75,
              marginTop: "0.5rem",
            }}
          >
            From your home to your boardroom — we place the right people, every time.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto" style={{ position: "relative", zIndex: 1 }}>
          {services.map((service, i) => (
            <div
              key={i}
              className="service-card rounded-2xl overflow-hidden relative cursor-pointer"
              style={{
                height: "340px",
                border: "1px solid rgba(35,133,205,0.25)",
                boxShadow: "0 4px 24px rgba(35,133,205,0.08)",
                transition: "border-color 0.3s, box-shadow 0.3s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(35,133,205,0.6)";
                e.currentTarget.style.boxShadow = "0 8px 36px rgba(35,133,205,0.18)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(35,133,205,0.25)";
                e.currentTarget.style.boxShadow = "0 4px 24px rgba(35,133,205,0.08)";
              }}
            >
              {/* Background image */}
              <img
                src={service.image}
                alt={service.title}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  transition: "transform 0.5s ease",
                }}
              />

              {/* Always-visible gradient + top meta */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to top, rgba(5,10,20,0.95) 0%, rgba(5,10,20,0.45) 45%, transparent 100%)",
                  pointerEvents: "none",
                }}
              />

              {/* Card number + tag — top left */}
              <div
                style={{
                  position: "absolute",
                  top: "1rem",
                  left: "1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: "800",
                    color: "#2385cd",
                    letterSpacing: "0.06em",
                  }}
                >
                  {service.number}
                </span>
                <span
                  style={{
                    fontSize: "0.68rem",
                    fontWeight: "600",
                    color: "#7dc6f5",
                    background: "rgba(35,133,205,0.2)",
                    border: "0.5px solid rgba(35,133,205,0.4)",
                    borderRadius: "100px",
                    padding: "3px 10px",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  {service.tag}
                </span>
              </div>

              {/* Always-visible title at bottom */}
              <div
                style={{
                  position: "absolute",
                  bottom: "1.2rem",
                  left: "1.2rem",
                  right: "1.2rem",
                }}
              >
                <h3
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: "700",
                    color: "#ffffff",
                    lineHeight: 1.2,
                    textShadow: "0 1px 8px rgba(0,0,0,0.7)",
                  }}
                >
                  {service.title}
                </h3>
              </div>

              {/* Slide-up reveal panel */}
              <div className="reveal-panel">
                <p
                  style={{
                    fontSize: "0.82rem",
                    color: "#ddeeff",
                    lineHeight: 1.65,
                    display: "-webkit-box",
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {service.desc}
                </p>
                <Link to="/services" style={{ textDecoration: "none" }}>
                  <span className="explore-btn">
                    Explore Service
                    <span className="arrow">→</span>
                  </span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────────────── */}
      <Testimonials />

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section className="relative py-28 px-6 text-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1400&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-black/65" />

        <div className="relative z-10 max-w-2xl mx-auto">
          <motion.h2
            initial="hidden"
            whileInView="show"
            variants={fadeUp}
            className="text-3xl md:text-4xl font-bold text-white"
          >
            Ready to Hire the Right Staff?
          </motion.h2>

          <motion.p
            initial="hidden"
            whileInView="show"
            variants={fadeUp}
            className="mt-4 text-gray-300"
          >
            Let us handle recruitment while you grow your business.
          </motion.p>

          <Link to="/contact">
            <motion.button
              initial="hidden"
              whileInView="show"
              variants={fadeUp}
              whileHover={{ scale: 1.05 }}
              className="mt-6 text-white px-6 py-3 rounded-full transition font-medium"
              style={{ background: "#2385cd" }}
            >
              Get Started Today
            </motion.button>
          </Link>
        </div>
      </section>

    </div>
  );
};

export default Home;