import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaClock,
  FaFacebookF, FaTwitter, FaInstagram, FaYoutube, FaLinkedin,
  FaCheckCircle,
} from "react-icons/fa";
import GetJobButton from "../components/buttons/GetJobButton";
import HireStaffButton from "../components/buttons/HireStaffButton";
import { useAuth } from "./AuthContext";

const BASE_URL = "https://randnhop.onrender.com";

const glass =
  "bg-white/5 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-sky-300/40 transition text-white placeholder-white/50";

const INITIAL_FORM = { name: "", email: "", phone: "", subject: "", message: "" };

const Contact = () => {
  const { user } = useAuth();

  const [form, setForm]       = useState(INITIAL_FORM);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Basic client-side validation
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError("Please fill in your name, email, and message.");
      return;
    }

    setSending(true);
    try {
      const token = localStorage.getItem("authToken");

      const res = await fetch(`${BASE_URL}/api/v1/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          subject: form.subject,
          message: form.message,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || data?.error || `Request failed (${res.status})`);
      }

      setSuccess(true);
      setForm(INITIAL_FORM);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-[#3f5357] min-h-screen text-white pb-24">
      {/* HERO SECTION */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative rounded-b-3xl text-center overflow-hidden"
        style={{
          minHeight: "400px",
          backgroundImage: `url('https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1600&auto=format&fit=crop')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div
          className="absolute inset-0 rounded-b-3xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(0,0,0,0.80) 0%, rgba(35,133,205,0.50) 100%)",
          }}
        />
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 py-28">
          <p className="uppercase tracking-widest text-[#2385cd] text-sm font-semibold mb-3">
            Get In Touch
          </p>
          <h1 className="text-5xl md:text-6xl font-bold mb-5 leading-tight">
            <span className="text-white">CONTACT </span>
            <span className="text-[#2385cd]">US</span>
          </h1>
          <p className="max-w-xl mx-auto text-sm md:text-base mb-8 text-gray-300">
            We are here to help you. Reach out to us through any of the
            platforms below and our team will respond promptly.
          </p>

          <div className="flex justify-center gap-4">
            <HireStaffButton user={user} />
            <GetJobButton user={user} />
          </div>
        </div>
      </motion.section>

      {/* CONTACT OPTIONS */}
      <section className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" style={{ background: "#0f172a" }}>
        {[
          { icon: <FaPhoneAlt />, title: "Call Us", detail: "+234 706 817 2272" },
          { icon: <FaEnvelope />, title: "Email Us", detail: "info@randleandhopkick.com" },
          { icon: <FaMapMarkerAlt />, title: "Visit Us", detail: "73, Ogudu Road, Ojota, Lagos, Nigeria" },
          { icon: <FaClock />, title: "Business Hours", detail: "Open 24/7 — We're always here for you." },
        ].map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            viewport={{ once: true }}
            className="p-6 text-center rounded-lg hover:scale-105 hover:shadow-lg transition duration-300 border border-[#2385cd]/40"
            style={{
              background:
                "linear-gradient(135deg, rgba(15,23,42,0.90) 0%, rgba(35,133,205,0.20) 100%)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
            }}
          >
            <div className="text-2xl mb-3 flex justify-center text-[#2385cd]">
              {item.icon}
            </div>
            <h3 className="font-semibold mb-2">{item.title}</h3>
            <p className="text-sm text-gray-200">{item.detail}</p>
          </motion.div>
        ))}
      </section>

      {/* FORM + MAP */}
      <section
        className="p-6 md:p-10 grid grid-cols-1 lg:grid-cols-2 gap-8"
        style={{ background: "#1a1f2e" }}
      >
        {/* FORM */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="p-6 rounded-xl shadow-lg"
          style={{
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(35,133,205,0.30)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
        >
          <h2 className="text-xl font-bold mb-1">Send Us A Message</h2>
          <p className="text-sm text-white/50 mb-5">
            Fill out the form and we will get back within 24 hours.
          </p>

          {/* SUCCESS BANNER */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 mb-4 p-3 rounded-lg text-sm"
              style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.35)", color: "#86efac" }}
            >
              <FaCheckCircle className="shrink-0" />
              Message sent! We'll get back to you within 24 hours.
            </motion.div>
          )}

          {/* ERROR BANNER */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 mb-4 p-3 rounded-lg text-sm"
              style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.35)", color: "#fca5a5" }}
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="name"
                  placeholder="Your Name *"
                  className={glass}
                  value={form.name}
                  onChange={handleChange}
                  required
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email *"
                  className={glass}
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="phone"
                  placeholder="Phone"
                  className={glass}
                  value={form.phone}
                  onChange={handleChange}
                />
                <input
                  type="text"
                  name="subject"
                  placeholder="Subject"
                  className={glass}
                  value={form.subject}
                  onChange={handleChange}
                />
              </div>
              <textarea
                name="message"
                placeholder="Message *"
                rows="5"
                className={glass}
                style={{ resize: "none" }}
                value={form.message}
                onChange={handleChange}
                required
              />
              <button
                type="submit"
                disabled={sending}
                className="w-full py-2.5 rounded-xl font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(135deg, #2385cd, #4b86b4)",
                  color: "white",
                }}
                onMouseEnter={(e) => { if (!sending) e.currentTarget.style.opacity = "0.85"; }}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                {sending ? "Sending…" : "Send Message"}
              </button>
            </div>
          </form>
        </motion.div>

        {/* MAP + SOCIAL */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="flex flex-col gap-4"
        >
          <iframe
            title="map"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3963.5321134485894!2d3.3839175740462903!3d6.580573722499431!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x103b928efea67d8b%3A0x1f5bf4656249d9e5!2s73%20Ogudu%20Rd%2C%20Ojota%2C%20Lagos%20105102%2C%20Lagos!5e0!3m2!1sen!2sng!4v1775812764215!5m2!1sen!2sng"
            className="w-full h-64 md:h-80 rounded-xl"
            style={{ border: "1px solid rgba(35,133,205,0.25)" }}
            loading="lazy"
          />

          {/* Social + address card */}
          <div
            className="p-5 rounded-xl flex flex-col gap-3"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(35,133,205,0.25)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
            }}
          >
            <div>
              <h3 className="font-semibold text-sm text-white/70 uppercase tracking-wider mb-1">
                Our Address
              </h3>
              <p className="text-sm text-gray-300">
                73, Ogudu Road, Ojota, Lagos, Nigeria
              </p>
            </div>
            <div className="h-px bg-white/10" />
            <div>
              <h3 className="font-semibold text-sm text-white/70 uppercase tracking-wider mb-2">
                Follow Us
              </h3>
              <div className="flex gap-4 text-xl">
                <a href="https://twitter.com/RandleHopkick" target="_blank" rel="noreferrer" className="hover:text-[#2385cd] transition"><FaTwitter /></a>
                <a href="https://web.facebook.com/randleandhopkick" target="_blank" rel="noreferrer" className="hover:text-[#2385cd] transition"><FaFacebookF /></a>
                <a href="https://www.instagram.com/randleandhopkick" target="_blank" rel="noreferrer" className="hover:text-[#2385cd] transition"><FaInstagram /></a>
                <a href="https://www.linkedin.com/company/randle-and-hopkick" target="_blank" rel="noreferrer" className="hover:text-[#2385cd] transition"><FaLinkedin /></a>
              </div>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default Contact;