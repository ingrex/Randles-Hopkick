import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Home = () => {
  const [current, setCurrent] = useState(0);

  const testimonials = [
    {
      name: "Sandra",
      role: "CEO Company",
      text: "Amazing service and support. Highly recommended.",
      image: "https://via.placeholder.com/100",
    },
    {
      name: "David",
      role: "Manager",
      text: "Professional team and reliable delivery.",
      image: "https://via.placeholder.com/100",
    },
    {
      name: "Grace",
      role: "HR Lead",
      text: "Great outsourcing experience overall.",
      image: "https://via.placeholder.com/100",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

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

  return (
    <div className="w-full overflow-hidden">

      {/* HERO */}
      <section className="relative h-screen flex items-center justify-center text-white">

        {/* Placeholder background image instead of video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute w-full h-full object-cover"
      >
        <source
          src="https://res.cloudinary.com/dotvnclej/video/upload/v1777903931/samples/dance-2.mp4"
          type="video/mp4"
        />
        Your browser does not support the video tag.
      </video>

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
            <button className="bg-blue-600 hover:bg-blue-700 transition px-6 py-3 rounded-full">
              Get Job
            </button>

            <button className="border border-white px-6 py-3 rounded-full hover:bg-white hover:text-black transition">
              Hire Staff
            </button>
          </motion.div>
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
              <img
                src={item.icon}
                alt="icon"
                className="w-12 h-12 mx-auto mb-4"
              />
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
        image: "https://res.cloudinary.com/dotvnclej/image/upload/v1777910962/April_7_ec1xit.png",
      },
      {
        title: "Corporate Staffing",
        desc: "Skilled professionals tailored to your business needs.",
        image: "https://res.cloudinary.com/dotvnclej/image/upload/v1777911236/April_8_h7n5ck.png",
      },
      {
        title: "Training Programs",
        desc: "We train staff to meet modern workplace standards.",
        image: "https://res.cloudinary.com/dotvnclej/image/upload/v1777911495/April_9_pilfux.png",
      },
      {
        title: "Artisan Outsoucing",
        desc: "Expert advice to optimize your workforce and processes.",
        image: "https://res.cloudinary.com/dotvnclej/image/upload/v1777911812/April_10_i3s4dx.png",
      },
    ].map((service, i) => (
      <motion.div
        key={i}
        variants={fadeUp}
        whileHover={{ y: -10 }}
        className="rounded-xl overflow-hidden shadow-lg group relative"
      >
        {/* IMAGE */}
        <div className="relative h-56 w-full overflow-hidden">
          <img
            src={service.image}
            alt={service.title}
            className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
          />

          {/* GRADIENT OVERLAY */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>

          {/* TEXT ON IMAGE */}
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h3 className="text-lg font-semibold">
              {service.title}
            </h3>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-5 bg-white">
          <p className="text-sm text-gray-600">
            {service.desc}
          </p>

          <Link to="/services">
            <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
              Explore Service
            </button>
          </Link>
        </div>
      </motion.div>
    ))}
  </motion.div>
</section>

      {/* TESTIMONIALS */}
      <section className="py-20 px-6 text-center">
        <h2 className="text-3xl font-bold mb-10">Testimonials</h2>

        <div className="relative max-w-xl mx-auto overflow-hidden">
          <motion.div
            animate={{ x: `-${current * 100}%` }}
            transition={{ duration: 0.6 }}
            className="flex"
          >
            {testimonials.map((item, i) => (
              <div key={i} className="min-w-full p-6">
                <div className="shadow-lg p-6 rounded-xl">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 mx-auto rounded-full mb-4 object-cover"
                  />

                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-sm text-gray-500">{item.role}</p>

                  <p className="mt-4 italic text-gray-600">
                    "{item.text}"
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <motion.h2
          initial="hidden"
          whileInView="show"
          variants={fadeUp}
          className="text-3xl font-bold"
        >
          Ready to Hire the Right Staff?
        </motion.h2>

        <motion.p
          initial="hidden"
          whileInView="show"
          variants={fadeUp}
          className="mt-4 text-gray-600"
        >
          Let us handle recruitment while you grow your business.
        </motion.p>

        <motion.button
          whileHover={{ scale: 1.05 }}
          className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full"
        >
          Get Started Today
        </motion.button>
      </section>
    </div>
  );
};

export default Home;
