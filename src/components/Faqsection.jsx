import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 45 },
  visible: (d = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay: d, ease: "easeOut" },
  }),
};

const faqs = [
  {
    question: "What services does Randle & Hopkick provide?",
    answer:
      "We provide domestic outsourcing and staffing solutions including cleaners, drivers, domestic staff, facility support personnel, janitorial services, and other professional workforce solutions for homes and businesses.",
  },
  {
    question: "How do I hire staff through the platform?",
    answer:
      "Simply click the Hire Staff button, complete the hiring request process, and our team will connect you with qualified and verified professionals that match your needs.",
  },
  {
    question: "Are your workers verified and trained?",
    answer:
      "Yes. Our workforce undergoes screening, verification, and professional orientation to ensure competence, integrity, professionalism, and reliability.",
  },
  {
    question: "Can job seekers apply through the website?",
    answer:
      "Yes. Job seekers can use the Get Job option to register, complete their profile, and apply for available opportunities through the platform.",
  },
  {
    question: "Do you provide services for corporate organizations?",
    answer:
      "Absolutely. We provide staffing and outsourcing services for homes, SMEs, and large corporate organizations across multiple industries.",
  },
];

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section
      className="relative py-20 px-6 md:px-14 text-white overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #07131f 0%, #0d2236 55%, #133b5e 100%)",
      }}
    >
      {/* background glow */}
      <div
        className="absolute top-0 right-0 w-100 h-100 rounded-full blur-3xl opacity-20"
        style={{ background: "#2385cd" }}
      />

      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="relative z-10 text-center mb-14"
      >
        <div
          className="w-16 h-1 rounded-full mx-auto mb-5"
          style={{ background: "#2385cd" }}
        />

        <h2 className="text-3xl md:text-5xl font-bold tracking-wide">
          FREQUENTLY ASKED QUESTIONS
        </h2>

        <p className="mt-5 max-w-2xl mx-auto text-sm md:text-base opacity-75 leading-relaxed">
          Everything you need to know about our staffing, outsourcing and
          recruitment services.
        </p>
      </motion.div>

      <div className="relative z-10 max-w-4xl mx-auto space-y-5">
        {faqs.map((faq, index) => (
          <motion.div
            key={index}
            variants={fadeUp}
            custom={index * 0.1}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="rounded-2xl overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(10px)",
            }}
          >
            <button
              onClick={() =>
                setOpenIndex(openIndex === index ? null : index)
              }
              className="w-full flex items-center justify-between text-left px-6 py-5"
            >
              <span className="font-semibold text-sm md:text-base pr-5">
                {faq.question}
              </span>

              <motion.span
                animate={{ rotate: openIndex === index ? 45 : 0 }}
                transition={{ duration: 0.25 }}
                className="text-3xl font-light"
                style={{ color: "#2385cd" }}
              >
                +
              </motion.span>
            </button>

            <AnimatePresence>
              {openIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6 text-sm md:text-[15px] leading-[1.9] opacity-80 text-justify">
                    {faq.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default FAQSection;