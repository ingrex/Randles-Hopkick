import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

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

export function AboutPage() {
  const [openIndex, setOpenIndex] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  // 👇 Replace with your real image URLs
  const slides = [
    {
      image: "https://res.cloudinary.com/dotvnclej/image/upload/v1777915998/Workers_jkh5ha.jpg",
      title: "ABOUT US",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    },
    {
      image: "https://res.cloudinary.com/dotvnclej/image/upload/v1777916140/Our_team_bwvejv.jpg",
      title: "OUR TEAM",
      description: "Professional and experienced workforce.",
    },
    {
      image: "https://res.cloudinary.com/dotvnclej/image/upload/v1777916373/Check_your_phone_first_xxxtau.jpg",
      title: "INTEGRITY",
      description: "Built on trust and transparency.",
    },
    {
      image: "https://res.cloudinary.com/dotvnclej/image/upload/v1777916800/April_11_cblgrp.png",
      title: "EXCELLENCE",
      description: "We exceed expectations every time.",
    },
    {
      image: "https://res.cloudinary.com/dotvnclej/image/upload/v1777917079/Global_standard_qnckek.jpg",
      title: "GLOBAL STANDARD",
      description: "Delivering world-class services.",
    },
  ];

  // Auto slide
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) =>
      prev === 0 ? slides.length - 1 : prev - 1
    );
  };

  const faqs = [
    { question: "What services do you offer?", answer: "We provide recruitment and staffing solutions." },
    { question: "How can I apply for a job?", answer: "Click the Find Job button and browse available roles." },
    { question: "Do you support remote work?", answer: "Yes, we have both remote and onsite opportunities." },
  ];

  return (
 <div className="bg-gray-200 min-h-screen">
  <div className="w-full">

        {/* HERO SECTION (UPDATED TO CAROUSEL) */}
        <section className="relative h-[70vh] flex items-center justify-center text-center text-white overflow-hidden">

          {/* Slides */}
          <div className="absolute w-full h-full">
            {slides.map((slide, index) => (
              <motion.div
                key={index}
                className="absolute w-full h-full"
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{
                  opacity: currentSlide === index ? 1 : 0,
                  scale: currentSlide === index ? 1 : 1.1,
                }}
                transition={{ duration: 1 }}
              >
                <img
                  src={slide.image}
                  alt="hero"
                  className="w-full h-full object-cover"
                />
              </motion.div>
            ))}
          </div>

          {/* Overlay */}
          <div className="absolute inset-0 bg-black/60" />

          {/* Content */}
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative z-10 px-6"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-blue-400 mb-6">
              {slides[currentSlide].title}
            </h1>
            <p className="max-w-xl mx-auto text-sm md:text-base opacity-80">
              {slides[currentSlide].description}
            </p>

            <div className="flex justify-center gap-4 mt-6">
              <button className="border border-blue-400 text-blue-400 px-5 py-2 rounded-full hover:bg-blue-400 hover:text-white transition">
                HIRE NOW
              </button>
              <button className="border border-blue-400 text-blue-400 px-5 py-2 rounded-full hover:bg-blue-400 hover:text-white transition">
                FIND JOB
              </button>
            </div>
          </motion.div>

          {/* Swipe */}
          <motion.div
            className="absolute inset-0 z-20"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(e, info) => {
              if (info.offset.x < -100) nextSlide();
              if (info.offset.x > 100) prevSlide();
            }}
          />

          {/* Indicators */}
          <div className="absolute bottom-5 flex gap-2 z-30">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full ${
                  currentSlide === index ? "bg-blue-400" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        </section>

        {/* Who We Are */}
        <section className="bg-[#5c6f73] text-white grid md:grid-cols-2 gap-6 p-6 md:p-10 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-bold mb-4">WHO WE ARE</h2>
            <p className="text-sm leading-relaxed opacity-90">
              Randle & Hopkick is a domestic outsourcing service firm established to provide exceptional services  that are geared at meeting our clients needs or domestic staff and related services. At Randle and Hopkick, we seek to exceed our client expectations through the provision of exceptional and timely professional services. 

            We pride ourselves in our workforce and data bank of competent professionals cutting across the value chain of domestic services (domestic employees – professional service providers), for individuals and corporate bodies. 

            Trust, competence, integrity, dedication and professionalism are the core values that define our workforce and service providers.
            </p>
          </motion.div>

          <motion.img
            src=" "
            alt="placeholder"
            className="w-full h-48 md:h-full object-cover rounded-lg"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          />
        </section>

{/* Core Values */}
<section className="bg-[#3f5357] text-white p-6 md:p-10 text-center">
  <motion.h2
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    viewport={{ once: true }}
    className="text-xl font-bold mb-6"
  >
    CORE VALUE
  </motion.h2>

  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
    {coreValues.map((item, index) => (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        viewport={{ once: true }}
      >
        <h3 className="font-semibold mb-2">{item.title}</h3>
        <p className="opacity-80 text-xs">{item.description}</p>
      </motion.div>
    ))}
  </div>
</section>

        {/* Mission & Vision */}
        <section className="bg-[#5c6f73] text-white grid md:grid-cols-2 gap-6 p-6 md:p-10">
          <motion.div className="border p-4" initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} viewport={{ once: true }}>
            <h3 className="font-bold mb-2">MISSION</h3>
            <p className="text-sm opacity-90">To redefine the perception of service delivery and professionalism by domestic employees and local service providers</p>
            <img src="https://via.placeholder.com/300x200" alt="mission" className="mt-4 rounded" />
          </motion.div>

          <motion.div className="border p-4" initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} viewport={{ once: true }}>
            <h3 className="font-bold mb-2">VISION</h3>
            <p className="text-sm opacity-90">Our mission is to provide homes and corporate bodies with the most efficient and trusted staffing available in Nigeria, thereby helping them to focus on their job, business, trip as the case may be.</p>
            <img src="https://via.placeholder.com/300x200" alt="vision" className="mt-4 rounded" />
          </motion.div>
        </section>

        {/* FAQ Section */}
        <section className="bg-[#3f5357] text-white p-6 md:p-10">
          <h2 className="text-xl font-bold mb-6 text-center">FREQUENTLY ASKED QUESTIONS</h2>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-white/30 rounded-lg p-4">
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full text-left flex justify-between items-center"
                >
                  <span>{faq.question}</span>
                  <span>{openIndex === index ? "-" : "+"}</span>
                </button>

                {openIndex === index && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-2 text-sm opacity-80"
                  >
                    {faq.answer}
                  </motion.p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-black text-white text-center py-12 px-6">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} viewport={{ once: true }}>
            <h2 className="text-xl md:text-2xl font-bold mb-4">READY TO GET STARTED?</h2>
            <p className="text-sm opacity-80 mb-6 max-w-md mx-auto">Lorem ipsum dolor sit amet.</p>
            <div className="flex justify-center gap-4">
              <button className="border border-white px-6 py-2 rounded-full hover:bg-white hover:text-black transition">
                Hire Now
              </button>
              <button className="border border-white px-6 py-2 rounded-full hover:bg-white hover:text-black transition">
                Find Job
              </button>
            </div>
          </motion.div>
        </section>

      </div>
    </div>
  );
}

export default AboutPage;