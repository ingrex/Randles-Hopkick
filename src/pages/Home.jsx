import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import GetJobButton from "../components/buttons/GetJobButton";
import HireStaffButton from "../components/buttons/HireStaffButton";
import Testimonials from "../components/Testimonials";

const Home = () => {
  const user = JSON.parse(localStorage.getItem("user"));

  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  const stagger = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const stats = [
    {
      number: "100%",
      label: "Client Satisfaction",
      desc: "Trusted by every client we serve",
    },
    {
      number: "300+",
      label: "Staff Deployed",
      desc: "Across homes & businesses",
    },
    {
      number: "3+",
      label: "Years of Experience",
      desc: "Delivering excellence consistently",
    },
  ];

  return (
    <div className="w-full overflow-hidden">

      {/* HERO */}
      <section className="relative h-screen flex items-center justify-center text-white">
        {/* ✅ Hero image replacing the video — swap the URL below with your own image if needed */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('https://res.cloudinary.com/dotvnclej/image/upload/v1778599560/Untitled_design_14_ecewzo.jpg')",
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40"></div>

        <motion.div
          initial="hidden"
          animate="show"
          variants={stagger}
          className="relative text-center px-4 max-w-3xl"
        >
          <motion.h1
            variants={fadeUp}
            className="text-4xl md:text-6xl font-bold leading-tight"
          >
            Topnotch Outsourcing services
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-4 text-lg text-gray-200"
          >
            Recruitment, Outsourcing & Training
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="flex gap-4 justify-center mt-6"
          >
            <GetJobButton user={user} />
            <HireStaffButton user={user} />
          </motion.div>
        </motion.div>
      </section>

      {/* STATS */}
      <section
        style={{ background: "linear-gradient(135deg, #0a0f1e 0%, #0d1b2a 60%, #0a1628 100%)" }}
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
            <motion.div
              key={i}
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
                {stat.number}
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
              <p style={{ fontSize: "0.8rem", color: "#8899aa" }}>
                {stat.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* WHY CHOOSE US */}
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
          {[
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
          ].map((item, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              whileHover={{ scale: 1.05 }}
              className="p-6 rounded-xl shadow hover:shadow-xl transition"
            >
              <img src={item.icon} alt="icon" className="w-12 h-12 mx-auto mb-4" />
              <h3 className="font-semibold text-lg">{item.title}</h3>
              <p className="text-sm mt-2 text-gray-600">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* SERVICES */}
      <section className="py-20 px-6 bg-gray-100">
        <motion.h2
          initial="hidden"
          whileInView="show"
          variants={fadeUp}
          className="text-3xl font-bold text-center mb-12"
        >
          Our Services
        </motion.h2>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto"
        >
          {[
            {
              title: "Domestic Staffing",
              desc: "Professional home staff including nannies, cleaners, and cooks.",
              image: "https://res.cloudinary.com/dotvnclej/image/upload/v1778601551/Untitled_design_15_kvzz9a.jpg",
            },
            {
              title: "Corporate Staffing",
              desc: "Skilled professionals tailored to your business needs.",
              image: "https://res.cloudinary.com/dotvnclej/image/upload/v1778601888/Untitled_design_16_szvtnk.jpg",
            },
            {
              title: "Staff Training",
              desc: "We train staff to meet modern workplace standards.",
              image: "https://res.cloudinary.com/dotvnclej/image/upload/v1778602221/Untitled_design_17_o8eevf.jpg",
            },
            {
              title: "Artisan Outsourcing",
              desc: "Expert advice to optimize your workforce and processes.",
              image: "https://res.cloudinary.com/dotvnclej/image/upload/v1778602685/Untitled_design_18_rl7zlb.jpg",
            },
          ].map((service, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              whileHover={{ y: -10 }}
              className="rounded-xl overflow-hidden shadow-lg group relative"
            >
              <div className="relative h-56 w-full overflow-hidden">
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h3 className="text-lg font-semibold">{service.title}</h3>
                </div>
              </div>

              <div className="p-5 bg-white">
                <p className="text-sm text-gray-600">{service.desc}</p>
                <Link to="/services">
                  <button
                    className="mt-4 text-white px-4 py-2 rounded transition"
                    style={{ background: "#2385cd" }}
                    onMouseOver={(e) => (e.target.style.opacity = "0.85")}
                    onMouseOut={(e) => (e.target.style.opacity = "1")}
                  >
                    Explore Service
                  </button>
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* TESTIMONIALS — extracted into its own component */}
      <Testimonials />

      {/* CTA */}
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
              className="mt-6 text-white px-4 py-2 rounded-full transition"
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