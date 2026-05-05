import React from "react";
import { motion } from "framer-motion";
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaClock, FaFacebookF, FaTwitter, FaInstagram, FaYoutube } from "react-icons/fa";

const Contact = () => {
  return (
    <div className="bg-[#3f5357] min-h-screen text-white pb-24">
      {/* HERO SECTION */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative bg-[#0b2c2f] rounded-b-3xl p-10 pt-24 text-center"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-[#4b86b4] mb-4">
          CONTACT US
        </h1>
        <p className="max-w-2xl mx-auto text-sm md:text-base mb-6">
          We are here to help you. Reach out to us through any of the
          platforms below and our team will respond promptly.
        </p>

        <div className="flex justify-center gap-4">
          <button className="border border-white px-2 py-1 rounded-full hover:bg-white hover:text-black transition">
            Hire Now
          </button>
          <button className="border border-white px-2 py-1 rounded-full hover:bg-white hover:text-black transition">
            Find Job
          </button>
        </div>
      </motion.section>

      {/* CONTACT OPTIONS */}
      <section className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { icon: <FaPhoneAlt />, title: "Call Us" },
          { icon: <FaEnvelope />, title: "Email Us" },
          { icon: <FaMapMarkerAlt />, title: "Visit Us" },
          { icon: <FaClock />, title: "Business Hour" },
        ].map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            viewport={{ once: true }}
            className="border border-gray-300 p-6 text-center rounded-lg hover:scale-105 hover:shadow-lg transition duration-300"
          >
            <div className="text-2xl mb-3 flex justify-center">
              {item.icon}
            </div>
            <h3 className="font-semibold mb-2">{item.title}</h3>
            <p className="text-sm text-gray-300">
              Lorem ipsum dolor sit amet consectetur adipisicing elit.
            </p>
          </motion.div>
        ))}
      </section>

      {/* FORM + MAP */}
      <section className="p-6 md:p-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* FORM */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-[#0b2c2f] p-6 rounded-lg"
        >
          <h2 className="text-xl font-bold mb-2">Send Us A Message</h2>
          <p className="text-sm mb-4">
            Fill out the form and we will get back within 24 hours.
          </p>

          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Your Name"
                className="p-2 bg-gray-200 text-black rounded"
              />
              <input
                type="email"
                placeholder="Email"
                className="p-2 bg-gray-200 text-black rounded"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Phone"
                className="p-2 bg-gray-200 text-black rounded"
              />
              <input
                type="text"
                placeholder="Subject"
                className="p-2 bg-gray-200 text-black rounded"
              />
            </div>

            <textarea
              placeholder="Message"
              rows="4"
              className="w-full p-2 bg-gray-200 text-black rounded"
            ></textarea>

            <button className="w-full border border-[#4b86b4] text-[#4b86b4] py-2 rounded hover:bg-[#4b86b4] hover:text-white transition">
              Send Message
            </button>
          </form>
        </motion.div>

        {/* MAP + SOCIAL */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <iframe
            title="map"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3963.5321134485894!2d3.3839175740462903!3d6.580573722499431!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x103b928efea67d8b%3A0x1f5bf4656249d9e5!2s73%20Ogudu%20Rd%2C%20Ojota%2C%20Lagos%20105102%2C%20Lagos!5e0!3m2!1sen!2sng!4v1775812764215!5m2!1sen!2sng"
            className="w-full h-64 md:h-80 rounded-lg mb-4"
            loading="lazy"
          ></iframe>

          <div className="mt-0.5">
            <h3 className="font-semibold mb-2">Follow Us</h3>
            <div className="flex gap-4 text-xl">
              <a href="#" target="_blank" rel="noreferrer" className="hover:text-[#4b86b4] transition">
                <FaTwitter />
              </a>
              <a href="#" target="_blank" rel="noreferrer" className="hover:text-[#4b86b4] transition">
                <FaFacebookF />
              </a>
              <a href="#" target="_blank" rel="noreferrer" className="hover:text-[#4b86b4] transition">
                <FaInstagram />
              </a>
              <a href="#" target="_blank" rel="noreferrer" className="hover:text-[#4b86b4] transition">
                <FaYoutube />
              </a>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default Contact;
