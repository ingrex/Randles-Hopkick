import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import GetJobButton from "../components/buttons/GetJobButton";
import HireStaffButton from "../components/buttons/HireStaffButton";
import HireStaffModal from "../components/modals/HireStaffModal";

/* ─── animation variants ─────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 45 },
  visible: (d = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.65, delay: d, ease: "easeOut" },
  }),
};
const fadeLeft = {
  hidden: { opacity: 0, x: -65 },
  visible: (d = 0) => ({
    opacity: 1, x: 0,
    transition: { duration: 0.65, delay: d, ease: "easeOut" },
  }),
};
const fadeRight = {
  hidden: { opacity: 0, x: 65 },
  visible: (d = 0) => ({
    opacity: 1, x: 0,
    transition: { duration: 0.65, delay: d, ease: "easeOut" },
  }),
};
const scaleIn = {
  hidden: { opacity: 0, scale: 0.87 },
  visible: (d = 0) => ({
    opacity: 1, scale: 1,
    transition: { duration: 0.6, delay: d, ease: "easeOut" },
  }),
};

/* ─── data ───────────────────────────────────────────────────────── */
const coreValues = [
  {
    title: "INTEGRITY",
    description:
      "We have a strong commitment to honesty and transparency in all dealings with clients and potential employees. This includes maintaining confidentiality, following ethical recruitment practices, and being upfront about any potential conflicts of interest.",
  },
  {
    title: "DEDICATION",
    description:
      "Our culture is loyalty — we make it a priority to imbibe this in our workforce. We treat all clients and employees with dignity and respect, valuing their unique perspectives while fostering a work environment free from discrimination.",
  },
  {

    title: "COMPETENCE",
    description:
      "We strive for excellence in all aspects of our operations — from candidate screening and placement, to customer service and follow-up support. Our culture of excellence drives us to deliver exceptional results and constantly improve.",
  },
  {
    title: "PROFESSIONALISM",
    description:
      "We want to be known for professional conduct in every dealing and process. Our workforce can be trusted in whatever capacity assigned, because they are trained to act professionally while delivering their tasks.",
  },
];

/* ═══════════════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════════════ */
export function AboutPage() {
  const [openIndex,     setOpenIndex]     = useState(null);
  const [currentSlide,  setCurrentSlide]  = useState(0);
  const [hireModalOpen, setHireModalOpen] = useState(false);
  const [hoveredCard,   setHoveredCard]   = useState(null);

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  /* ── hide header whenever modal is open ── */
  useEffect(() => {
    if (hireModalOpen) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
    // cleanup on unmount
    return () => document.body.classList.remove("modal-open");
  }, [hireModalOpen]);

  const handleHireClick = () => {
    if (!user) { navigate("/login"); return; }
    setHireModalOpen(true);
  };

  const slides = [
    {
      image: "https://res.cloudinary.com/dotvnclej/image/upload/v1777915998/Workers_jkh5ha.jpg",
      title: "ABOUT US",
      description: "Connecting trusted professionals with homes and businesses across Nigeria.",
    },
    {
      image: "https://res.cloudinary.com/dotvnclej/image/upload/v1777916140/Our_team_bwvejv.jpg",
      title: "OUR TEAM",
      description: "Professional and experienced workforce, ready to serve.",
    },
    {
      image: "https://res.cloudinary.com/dotvnclej/image/upload/v1777916373/Check_your_phone_first_xxxtau.jpg",
      title: "INTEGRITY",
      description: "Built on trust, transparency and ethical practice.",
    },
    {
      image: "https://res.cloudinary.com/dotvnclej/image/upload/v1777916800/April_11_cblgrp.png",
      title: "EXCELLENCE",
      description: "We exceed expectations every time.",
    },
    {
      image: "https://res.cloudinary.com/dotvnclej/image/upload/v1777917079/Global_standard_qnckek.jpg",
      title: "GLOBAL STANDARD",
      description: "Delivering world-class domestic staffing services.",
    },
  ];

  /* auto-advance slides */
  useEffect(() => {
    const id = setInterval(
      () => setCurrentSlide(p => (p + 1) % slides.length),
      5000
    );
    return () => clearInterval(id);
  }, []);

  const nextSlide = () => setCurrentSlide(p => (p + 1) % slides.length);
  const prevSlide = () => setCurrentSlide(p => (p === 0 ? slides.length - 1 : p - 1));

  const faqs = [
    {
      question: "What services do you offer?",
      answer:
        "We provide recruitment and staffing solutions for domestic and corporate clients, including housekeepers, nannies, drivers, cooks, security personnel, and more.",
    },
    {
      question: "How can I apply for a job?",
      answer:
        "Click the 'Get a Job' button and browse available roles. Submit your profile and our team will match you with suitable placements.",
    },
    {
      question: "Do you support remote work?",
      answer:
        "Yes, we have both remote and onsite opportunities depending on the role and client requirements.",
    },
    {
      question: "How do you vet your candidates?",
      answer:
        "All candidates go through a rigorous screening process including background checks, reference verification, and skills assessment before placement.",
    },
  ];

  /* ══════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════ */
  return (
    <div className="bg-gray-200 min-h-screen overflow-x-hidden">

      {/*
        ╔══════════════════════════════════════════════════════════╗
        ║  MODAL — rendered at ROOT level, completely outside      ║
        ║  the hero section so slide changes can never unmount it  ║
        ╚══════════════════════════════════════════════════════════╝
        The CSS class  "modal-open"  added to <body> via useEffect
        above hides your header/nav. Add this to your global CSS:

          body.modal-open header,
          body.modal-open nav { display: none !important; }
      */}
      <AnimatePresence>
        {hireModalOpen && (
          <motion.div
            key="hire-modal-wrapper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            /* Full-screen backdrop so the modal truly sits above everything */
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1,   y: 0  }}
              exit={{ scale: 0.9, y: 30 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <HireStaffModal onClose={() => setHireModalOpen(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full">

        {/* ══════════════════════════════════════════════
            HERO — Ken-Burns carousel
        ══════════════════════════════════════════════ */}
        <section className="relative h-[70vh] flex items-center justify-center text-center text-white overflow-hidden">

          {/* slide images */}
          <div className="absolute inset-0">
            {slides.map((slide, i) => (
              <motion.div
                key={i}
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 1.08 }}
                animate={{
                  opacity: currentSlide === i ? 1 : 0,
                  scale:   currentSlide === i ? 1 : 1.08,
                }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
              >
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                />
              </motion.div>
            ))}
          </div>

          {/* dark gradient overlay */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.50) 0%, rgba(15,37,53,0.82) 100%)",
            }}
          />

          {/* slide content — keyed so it animates per slide */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 45 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="relative z-30 px-6"
            >
              <h1
                className="text-4xl md:text-6xl font-extrabold mb-4 tracking-wider"
                style={{
                  color: "#2385cd",
                  textShadow: "0 2px 24px rgba(35,133,205,0.55)",
                }}
              >
                {slides[currentSlide].title}
              </h1>

              <p className="max-w-xl mx-auto text-sm md:text-base opacity-85 leading-relaxed">
                {slides[currentSlide].description}
              </p>

              {/* CTA buttons — clicking opens modal at root level */}
              <div className="flex justify-center gap-4 mt-8">
                <button
                  onClick={handleHireClick}
                  className="px-8 py-3 rounded-full font-semibold text-white
                    bg-[#2385cd]/20 backdrop-blur-md border border-[#2385cd]/50
                    hover:bg-[#2385cd] hover:border-[#2385cd]
                    hover:shadow-[0_0_32px_rgba(35,133,205,0.6)] hover:scale-[1.07]
                    active:scale-[0.96] transition-all duration-300"
                >
                  Hire Staff
                </button>
                <GetJobButton user={user} />
              </div>
            </motion.div>
          </AnimatePresence>

          {/* swipe gesture layer */}
          <motion.div
            className="absolute inset-0 z-20"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x < -100) nextSlide();
              if (info.offset.x >  100) prevSlide();
            }}
          />

          {/* pill indicators */}
          <div className="absolute bottom-6 flex gap-2 z-30">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                style={{
                  width:        currentSlide === i ? "28px" : "10px",
                  height:       "10px",
                  borderRadius: "9999px",
                  background:   currentSlide === i
                    ? "#2385cd"
                    : "rgba(255,255,255,0.4)",
                  transition: "all 0.35s ease",
                }}
              />
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            WHO WE ARE
        ══════════════════════════════════════════════ */}
        <section
          className="text-white grid md:grid-cols-2 gap-0 items-stretch"
          style={{
            background:
              "linear-gradient(135deg, #0f2535 0%, #1a3d57 55%, #2385cd 100%)",
          }}
        >
          {/* text — slides in from left */}
          <motion.div
            variants={fadeLeft}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            className="p-8 md:p-14 flex flex-col justify-center"
          >
            {/* animated accent bar */}
            <motion.div
              className="h-1 mb-5 rounded"
              style={{ background: "#2385cd", originX: 0 }}
              initial={{ width: 0 }}
              whileInView={{ width: "3.5rem" }}
              transition={{ duration: 0.6, delay: 0.35 }}
              viewport={{ once: true }}
            />
            <h2 className="text-3xl font-bold mb-6 tracking-wide">WHO WE ARE</h2>

            <div className="space-y-4 text-sm md:text-[15px] leading-[1.9] opacity-90 text-justify">
              {[
                "Randle & Hopkick is a domestic outsourcing service firm established to provide exceptional services geared at meeting our clients' needs for domestic staff and related services. We seek to exceed client expectations through timely, professional delivery.",
                "We pride ourselves in our workforce and data bank of competent professionals cutting across the entire value chain of domestic services — from household employees to professional service providers — serving both individuals and corporate bodies.",
                "Trust, competence, integrity, dedication and professionalism are the core values that define our workforce and service providers, setting us apart as the preferred staffing partner in Nigeria.",
              ].map((para, i) => (
                <motion.p
                  key={i}
                  variants={fadeUp}
                  custom={0.15 + i * 0.12}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  {para}
                </motion.p>
              ))}
            </div>
          </motion.div>

          {/* image — slides in from right, zooms on hover */}
          <motion.div
            variants={fadeRight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            className="relative min-h-[320px] md:min-h-full overflow-hidden group"
          >
            <img
              src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=900&q=80"
              alt="Professional team at work"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              style={{ minHeight: "320px" }}
            />
            <div
              className="absolute inset-0 transition-opacity duration-500 group-hover:opacity-40"
              style={{
                background:
                  "linear-gradient(to right, rgba(15,37,53,0.55) 0%, transparent 60%)",
              }}
            />
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════════
            CORE VALUES — zoom + glow on hover
        ══════════════════════════════════════════════ */}
        <section
          className="text-white p-6 md:p-14"
          style={{
            background:
              "linear-gradient(160deg, #2385cd 0%, #1a6aaa 45%, #0f4a7a 100%)",
          }}
        >
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <div className="w-12 h-1 rounded bg-white/60 mx-auto mb-4" />
            <h2 className="text-2xl font-bold tracking-widest">CORE VALUES</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {coreValues.map((item, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i * 0.13}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                whileHover={{ scale: 1.07, y: -7 }}
                onHoverStart={() => setHoveredCard(i)}
                onHoverEnd={() => setHoveredCard(null)}
                className="rounded-xl p-5 text-left cursor-default"
                style={{
                  background: hoveredCard === i
                    ? "rgba(255,255,255,0.14)"
                    : "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderTop: hoveredCard === i
                    ? "3px solid rgba(255,255,255,0.92)"
                    : "3px solid rgba(255,255,255,0.38)",
                  boxShadow: hoveredCard === i
                    ? "0 16px 42px rgba(0,0,0,0.38), 0 0 24px rgba(35,133,205,0.32)"
                    : "0 4px 16px rgba(0,0,0,0.18)",
                  transition: "all 0.3s ease",
                }}
              >
                <motion.span
                  className="text-2xl mb-3 block"
                  animate={{ scale: hoveredCard === i ? 1.3 : 1 }}
                  transition={{ duration: 0.25 }}
                >
                  {item.icon}
                </motion.span>
                <h3 className="font-bold mb-3 tracking-wider text-white text-sm">
                  {item.title}
                </h3>
                <p className="opacity-75 text-xs leading-relaxed text-justify">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            MISSION & VISION
        ══════════════════════════════════════════════ */}
        <section
          className="text-white grid md:grid-cols-2 gap-0 items-stretch"
          style={{
            background:
              "linear-gradient(135deg, #0a1e2e 0%, #0f3351 50%, #1a5580 100%)",
          }}
        >
          {[
            {
              label: "MISSION",
              text: "To redefine the perception of service delivery and professionalism by domestic employees and local service providers — raising the standard of what clients can expect from every interaction.",
              img:  "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=700&q=80",
              alt:  "Mission — team collaboration",
              anim: fadeLeft,
              style: { borderRight: "1px solid rgba(35,133,205,0.25)" },
            },
            {
              label: "VISION",
              text: "To provide homes and corporate bodies with the most efficient and trusted staffing available in Nigeria, helping them focus on their core activities — job, business, or personal pursuits — with full peace of mind.",
              img:  "https://images.unsplash.com/photo-1497366216548-37526070297c?w=700&q=80",
              alt:  "Vision — modern professional workspace",
              anim: fadeRight,
              style: {},
            },
          ].map((card, i) => (
            <motion.div
              key={i}
              variants={card.anim}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.25 }}
              className="p-8 md:p-10 flex flex-col group"
              style={card.style}
            >
              <motion.div
                className="h-1 rounded mb-4"
                style={{ background: "#2385cd", originX: 0 }}
                initial={{ width: 0 }}
                whileInView={{ width: "2.5rem" }}
                transition={{ duration: 0.5, delay: 0.25 }}
                viewport={{ once: true }}
              />
              <h3 className="font-bold text-xl mb-3 tracking-widest text-[#2385cd]">
                {card.label}
              </h3>
              <p className="text-sm opacity-90 leading-7 text-justify mb-6">
                {card.text}
              </p>

              {/* image with zoom + shimmer on hover */}
              <div
                className="rounded-xl overflow-hidden mt-auto relative"
                style={{ height: "210px" }}
              >
                <img
                  src={card.img}
                  alt={card.alt}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background:
                      "linear-gradient(120deg, rgba(35,133,205,0.28) 0%, transparent 65%)",
                  }}
                />
              </div>
            </motion.div>
          ))}
        </section>

        {/* ══════════════════════════════════════════════
            FAQ
        ══════════════════════════════════════════════ */}
        <section
          className="text-white p-6 md:p-14"
          style={{
            background: "linear-gradient(180deg, #102e45 0%, #1a4d6e 100%)",
          }}
        >
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <div
              className="w-12 h-1 rounded mx-auto mb-4"
              style={{ background: "#2385cd" }}
            />
            <h2 className="text-2xl font-bold tracking-widest">
              FREQUENTLY ASKED QUESTIONS
            </h2>
          </motion.div>

          <div className="space-y-4 max-w-3xl mx-auto">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i * 0.1}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                whileHover={{ scale: 1.015, x: 5 }}
                className="rounded-xl overflow-hidden"
                style={{
                  border: openIndex === i
                    ? "1px solid rgba(35,133,205,0.65)"
                    : "1px solid rgba(35,133,205,0.28)",
                  background: openIndex === i
                    ? "rgba(35,133,205,0.15)"
                    : "rgba(35,133,205,0.07)",
                  boxShadow: openIndex === i
                    ? "0 6px 26px rgba(35,133,205,0.22)"
                    : "none",
                  transition: "border 0.25s, background 0.25s, box-shadow 0.25s",
                }}
              >
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full text-left flex justify-between items-center px-5 py-4 font-medium"
                >
                  <span className="text-sm md:text-base">{faq.question}</span>
                  <motion.span
                    className="text-xl font-bold flex-shrink-0 ml-3"
                    style={{ color: "#2385cd" }}
                    animate={{ rotate: openIndex === i ? 45 : 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    +
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {openIndex === i && (
                    <motion.div
                      key="answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-4 pt-3 text-sm opacity-80 leading-relaxed border-t border-white/10">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            CTA — background image + DARK overlay
        ══════════════════════════════════════════════ */}
        <section className="relative text-white text-center py-24 px-6 overflow-hidden">

          {/* background image */}
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1400&q=80"
              alt="CTA background"
              className="w-full h-full object-cover"
            />
          </div>

          {/* ✅ Uniformly dark overlay — no brand-blue bleed in the middle */}
          <div
            className="absolute inset-0"
            style={{ background: "rgba(8, 20, 30, 0.88)" }}
          />

          {/* subtle animated radial glow — very low opacity so it doesn't colour-shift */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{ opacity: [0.04, 0.12, 0.04] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(35,133,205,0.5) 0%, transparent 70%)",
            }}
          />

          {/* content */}
          <motion.div
            variants={scaleIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="relative z-10"
          >
            {/* icon ring */}
            <motion.div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-7"
              style={{
                border: "2px solid rgba(35,133,205,0.55)",
                background: "rgba(35,133,205,0.15)",
                backdropFilter: "blur(8px)",
              }}
              whileHover={{
                scale: 1.14,
                boxShadow: "0 0 34px rgba(35,133,205,0.55)",
              }}
              transition={{ duration: 0.3 }}
            >
              <svg
                width="34" height="34" viewBox="0 0 24 24"
                fill="none" stroke="white" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </motion.div>

            <motion.h2
              variants={fadeUp}
              custom={0.1}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-extrabold mb-3 tracking-wide"
            >
              READY TO GET STARTED?
            </motion.h2>

            <motion.p
              variants={fadeUp}
              custom={0.2}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="text-sm md:text-base opacity-75 mb-10 max-w-lg mx-auto leading-relaxed"
            >
              Whether you need trusted domestic staff or are looking for your next
              opportunity, we connect the right people with the right homes and
              businesses across Nigeria.
            </motion.p>

            <motion.div
              variants={fadeUp}
              custom={0.3}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="flex justify-center gap-5 flex-wrap"
            >
              {/* CTA hire button reuses the same root-level modal */}
              <button
                onClick={handleHireClick}
                className="px-8 py-3 rounded-full font-semibold text-white
                  bg-[#2385cd]/20 backdrop-blur-md border border-[#2385cd]/50
                  hover:bg-[#2385cd] hover:border-[#2385cd]
                  hover:shadow-[0_0_32px_rgba(35,133,205,0.6)] hover:scale-[1.07]
                  active:scale-[0.96] transition-all duration-300"
              >
                Hire Staff
              </button>
              <GetJobButton user={user} />
            </motion.div>
          </motion.div>
        </section>

      </div>
    </div>
  );
}

export default AboutPage;