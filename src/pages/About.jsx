import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import GetJobButton from "../components/buttons/GetJobButton";
import FAQSection from "../components/Faqsection";
import HireStaffButton from "../components/buttons/HireStaffButton";
import HireStaffModal from "../components/modals/HireStaffModal";


/* ─── animation variants ─*/
const fadeUp = {
  hidden: { opacity: 0, y: 45 },
  visible: (d = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay: d, ease: "easeOut" },
  }),
};

const fadeLeft = {
  hidden: { opacity: 0, x: -65 },
  visible: (d = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.65, delay: d, ease: "easeOut" },
  }),
};

const fadeRight = {
  hidden: { opacity: 0, x: 65 },
  visible: (d = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.65, delay: d, ease: "easeOut" },
  }),
};

const fadeInOnly = {
  hidden: { opacity: 0 },
  visible: (d = 0) => ({
    opacity: 1,
    transition: { duration: 0.65, delay: d, ease: "easeOut" },
  }),
};

/* ─── data ── */
const coreValues = [
  {
    title: "INTEGRITY",
    description:
      "We have a strong commitment to honesty and transparency in all dealings with clients and potential employees. This includes maintaining confidentiality of sensitive information, following ethical recruitment practices, and being upfront about any potential conflicts of interest. Same is pass onto our staff.",
  },
  {
    title: "DEDICATION",
    description:
      "Our culture is loyalty, hence, we make it a priority to imbibe this culture in our workforce. We treats all clients and employees with dignity and respect, valuing their unique perspectives and experiences while fostering a work environment that is free from discrimination and harassment.",
  },
  {
    title: "COMPETENCE",
    description:
      "We strive for excellence in all aspects of our operations, from the quality of its candidate screening and placement services, to its customer service and follow-up support. Our culture of excellence drives us to deliver exceptional results and always strive for improvement.",
  },
  {
    title: "PROFESSIONALISM",
    description:
      "We want to be know for our professional conduct and approach in our dealings and process. This is what make us stand out. Our workforce can be trusted in what ever capacity or role assigned to them, because they are trained to be act professionally while delivering their task.",
  },
];

/* ─── team data ── */
const technicalTeamContent = {
  heading: "Technical Team",
  paragraphs: [
    "Our technical team is made up of seasoned professionals with over a decade experience in specialized field of facilities management, janitorial services, automobile leasing and management, hospitality, etc.",
    "These individuals have worked with multinational companies like, Exxon Mobile, Dangote Flour, Coca-Cola, ETECO Integrated Facility manager, Nigeria Brewery, Promasidor, etc. These are companies where superior services delivery is non-negotiable. Hence, we shall deliver nothing less that the global standard when it comes to outsourcing services.",
  ],
};

/* ─── placement process data ── */
const placementProcessSteps = [
  {
    step: "01",
    title: "Screening & Verification",
    text: "Every candidate undergoes background checks, reference verification, and skills assessment before being added to our pool.",
  },
  {
    step: "02",
    title: "Needs Matching",
    text: "We take time to understand each client's specific requirements — role, environment, and expectations — before recommending staff.",
  },
  {
    step: "03",
    title: "Trial & Feedback",
    text: "Placements are monitored closely in the first weeks, with direct client feedback loops to confirm fit.",
  },
  {
    step: "04",
    title: "Ongoing Support",
    text: "We stay engaged after deployment, ready to replace or adjust staffing if a client's needs change.",
  },
];

/* COMPONENT */
export function AboutPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [hireModalOpen, setHireModalOpen] = useState(false);

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (hireModalOpen) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }

    return () => document.body.classList.remove("modal-open");
  }, [hireModalOpen]);

  const handleHireClick = () => {
    if (!user) {
      navigate("/login");
      return;
    }

    setHireModalOpen(true);
  };

  const slides = [
    {
      image:
        "https://res.cloudinary.com/dotvnclej/image/upload/v1780431613/tabbg1_zovthx.png",
      titleWhite: "ABOUT ",
      titleBlue: "US",
      description:
        "Connecting trusted professionals with homes and businesses across Nigeria.",
    },
    {
      image:
        "https://res.cloudinary.com/dotvnclej/image/upload/v1780431641/bg2_v9bp0u.jpg",
      titleWhite: "OUR ",
      titleBlue: "TEAM",
      description:
        "Professional and experienced workforce, ready to serve.",
    },
  ];

  useEffect(() => {
    const id = setInterval(() => {
      setCurrentSlide((p) => (p + 1) % slides.length);
    }, 5000);

    return () => clearInterval(id);
  }, []);

  return (
    <div className="bg-gray-200 min-h-screen overflow-x-hidden">
      <AnimatePresence>
        {hireModalOpen && (
          <motion.div
            key="hire-modal-wrapper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-9999 flex items-center justify-center"
            style={{
              background: "rgba(0,0,0,0.75)",
              backdropFilter: "blur(4px)",
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <HireStaffModal
                onClose={() => setHireModalOpen(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════ */}
      <section className="relative h-[70vh] flex items-center justify-center text-center text-white overflow-hidden">
        {/* Slide images */}
        <div className="absolute inset-0">
          {slides.map((slide, i) => (
            <motion.div
              key={i}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.08 }}
              animate={{
                opacity: currentSlide === i ? 1 : 0,
                scale: currentSlide === i ? 1 : 1.08,
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

        {/* Overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.50) 0%, rgba(15,37,53,0.82) 100%)",
          }}
        />

        <div className="relative z-30 px-6 flex flex-col items-center">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 45 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <h1
              className="text-4xl md:text-6xl font-extrabold mb-4 tracking-wider"
              style={{ textShadow: "0 2px 24px rgba(35,133,205,0.55)" }}
            >
              <span className="text-white">
                {slides[currentSlide].titleWhite}
              </span>
              <span style={{ color: "#2385cd" }}>
                {slides[currentSlide].titleBlue}
              </span>
            </h1>

            <p className="max-w-xl mx-auto text-sm md:text-base opacity-85 leading-relaxed">
              {slides[currentSlide].description}
            </p>
          </motion.div>

          <motion.div
            variants={fadeInOnly}
            initial="hidden"
            animate="visible"
            custom={0.4}
            className="flex justify-center gap-4 mt-8"
          >
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
        <motion.div
          variants={fadeLeft}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="p-8 md:p-14 flex flex-col justify-center"
        >
          <div
            className="h-1 mb-5 rounded w-14"
            style={{ background: "#2385cd" }}
          />

          <h2 className="text-3xl font-bold mb-6 tracking-wide">
            WHO WE ARE
          </h2>

          <div className="space-y-4 text-sm md:text-[15px] leading-[1.9] opacity-90 text-justify">
            <p>
              Randle & Hopkick is a domestic outsourcing service
              firm established to provide exceptional services
              geared at meeting our clients' needs.
            </p>

            <p>
              We pride ourselves in our workforce and competent
              professionals cutting across the entire value chain
              of domestic services.
            </p>

            <p>
              Trust, competence, integrity, dedication and
              professionalism define our workforce and service
              providers.
            </p>
          </div>
        </motion.div>

        <motion.div
          variants={fadeRight}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="relative min-h-[320px] overflow-hidden group"
        >
          <img
            src="https://res.cloudinary.com/dotvnclej/image/upload/v1779733903/who_we_are_wejxdr.png"
            alt="Professional team"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />

          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, rgba(15,37,53,0.55) 0%, transparent 60%)",
            }}
          />
        </motion.div>
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
            text:
              "To redefine the perception of service delivery and professionalism by domestic employees and local service providers, raising the standard of what clients can expect from every interaction.",
            img:
              "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=700&q=80",
            alt: "Mission — team collaboration",
            anim: fadeLeft,
            style: {
              borderRight: "1px solid rgba(35,133,205,0.25)",
            },
          },
          {
            label: "VISION",
            text:
              "To provide homes and corporate bodies with the most efficient and trusted staffing available in Nigeria, helping them focus on their core activities with complete peace of mind.",
            img:
              "https://images.unsplash.com/photo-1497366216548-37526070297c?w=700&q=80",
            alt: "Vision — modern professional workspace",
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
            className="p-8 md:p-12 flex flex-col group relative overflow-hidden"
            style={card.style}
          >
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background:
                  "linear-gradient(120deg, rgba(35,133,205,0.12) 0%, transparent 70%)",
              }}
            />

            <motion.div
              className="h-1 rounded mb-5 relative z-10"
              style={{ background: "#2385cd", originX: 0 }}
              initial={{ width: 0 }}
              whileInView={{ width: "3rem" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            />

            <h3
              className="font-bold text-2xl mb-4 tracking-[0.2em] relative z-10"
              style={{ color: "#2385cd" }}
            >
              {card.label}
            </h3>

            <p className="text-sm md:text-[15px] opacity-90 leading-[2] text-justify mb-8 relative z-10">
              {card.text}
            </p>

            <div
              className="rounded-2xl overflow-hidden mt-auto relative"
              style={{
                height: "240px",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <img
                src={card.img}
                alt={card.alt}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />

              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, rgba(8,18,28,0.78) 0%, rgba(8,18,28,0.12) 60%, transparent 100%)",
                }}
              />

              <div
                className="absolute bottom-4 left-4 px-4 py-2 rounded-full text-xs tracking-widest font-semibold"
                style={{
                  background: "rgba(35,133,205,0.16)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(35,133,205,0.35)",
                  color: "#ffffff",
                }}
              >
                RANDLE & HOPKICK
              </div>
            </div>
          </motion.div>
        ))}
      </section>

      {/* ══════════════════════════════════════════════
          PREMIUM TEAM SECTION
      ══════════════════════════════════════════════ */}
      <section
        className="relative py-20 md:py-28 px-6 md:px-14 overflow-hidden text-white"
        style={{
          background:
            "linear-gradient(180deg, #07131f 0%, #0d2236 50%, #133b5e 100%)",
        }}
      >
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-3xl opacity-40"
          style={{ background: "#2385cd" }}
        />

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="relative z-10 text-center mb-16"
        >
          <div
            className="w-16 h-1 rounded-full mx-auto mb-5"
            style={{ background: "#2385cd" }}
          />

          <h2 className="text-3xl md:text-5xl font-extrabold tracking-wide">
            OUR TEAM
          </h2>

          <p className="mt-5 max-w-2xl mx-auto text-sm md:text-base opacity-70 leading-relaxed">
            Built on experience, professionalism and global service standards;
            our people are the strength behind every successful delivery.
          </p>
        </motion.div>

        <div className="relative z-10 grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* placement process card */}
          <motion.div
            variants={fadeLeft}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            whileHover={{ y: -8 }}
            className="relative overflow-hidden rounded-3xl"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(12px)",
              boxShadow: "0 25px 60px rgba(0,0,0,0.35)",
            }}
          >
            <div
              className="absolute inset-0 opacity-10"
              style={{
                background:
                  "linear-gradient(135deg, #2385cd 0%, transparent 70%)",
              }}
            />

            <div className="relative p-8 md:p-10">
              <div className="mb-8">
                <span
                  className="inline-block px-4 py-2 rounded-full text-xs tracking-widest font-semibold uppercase"
                  style={{
                    background: "rgba(35,133,205,0.14)",
                    color: "#2385cd",
                    border: "1px solid rgba(35,133,205,0.3)",
                  }}
                >
                  Our Process
                </span>

                <h3 className="text-xl font-bold mt-4">
                  The Right Staff, Every Time
                </h3>
              </div>

              <div className="space-y-5">
                {placementProcessSteps.map((item, i) => (
                  <motion.div
                    key={item.step}
                    variants={fadeUp}
                    custom={i * 0.1}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="flex gap-4"
                  >
                    <div
                      className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{
                        background: "rgba(35,133,205,0.15)",
                        border: "1px solid rgba(35,133,205,0.4)",
                        color: "#2385cd",
                      }}
                    >
                      {item.step}
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold mb-1">
                        {item.title}
                      </h4>
                      <p className="text-xs opacity-75 leading-relaxed">
                        {item.text}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* technical team card */}
          <motion.div
            variants={fadeRight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            whileHover={{ y: -8 }}
            className="relative overflow-hidden rounded-3xl"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(12px)",
              boxShadow: "0 25px 60px rgba(0,0,0,0.35)",
            }}
          >
            <div
              className="absolute inset-0 opacity-10"
              style={{
                background:
                  "linear-gradient(135deg, #2385cd 0%, transparent 70%)",
              }}
            />

            <div className="relative p-8 md:p-10 h-full flex flex-col">
              <div className="mb-8">
                <span
                  className="inline-block px-4 py-2 rounded-full text-xs tracking-widest font-semibold uppercase"
                  style={{
                    background: "rgba(35,133,205,0.14)",
                    color: "#2385cd",
                    border: "1px solid rgba(35,133,205,0.3)",
                  }}
                >
                  Technical Team
                </span>
              </div>

              <div className="space-y-5 text-sm md:text-[15px] leading-[2] opacity-85 text-justify">
                {technicalTeamContent.paragraphs.map((para, i) => (
                  <motion.p
                    key={i}
                    variants={fadeUp}
                    custom={i * 0.1}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                  >
                    {para}
                  </motion.p>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          CORE VALUES
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {coreValues.map((item, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              custom={i * 0.13}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              whileHover={{ scale: 1.05, y: -7 }}
              className="rounded-xl p-5"
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
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
          FAQ SECTION
      ══════════════════════════════════════════════ */}
      <FAQSection />
    </div>
  );
}

export default AboutPage;