import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaClock,
  FaFacebookF, FaTwitter, FaInstagram, FaLinkedin,
  FaCheckCircle, FaPaperPlane,
} from "react-icons/fa";
import GetJobButton from "../components/buttons/GetJobButton";
import HireStaffButton from "../components/buttons/HireStaffButton";
import FAQSection from "../components/Faqsection";
import { useAuth } from "./AuthContext";
import { apiContactForm } from "../api/auth";

const INITIAL_FORM = { name: "", email: "", phone: "", subject: "", message: "" };
const MAX_MSG = 500;

/* ── Floating label field ─────────────────────────────────────────────── */
const FloatField = ({ label, name, type = "text", value, onChange, required, as }) => {
  const [focused, setFocused] = useState(false);
  const lifted = focused || value.length > 0;

  const baseStyle = {
    background: "rgba(255,255,255,0.06)",
    border: `1px solid ${focused ? "rgba(35,133,205,0.70)" : "rgba(255,255,255,0.12)"}`,
    borderRadius: "10px",
    color: "white",
    width: "100%",
    outline: "none",
    fontFamily: "inherit",
    fontSize: "14px",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxShadow: focused ? "0 0 0 3px rgba(35,133,205,0.15)" : "none",
  };

  const sharedProps = {
    name,
    value,
    onChange,
    required,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    style: as === "textarea"
      ? { ...baseStyle, padding: "22px 14px 10px", resize: "none", minHeight: "130px" }
      : { ...baseStyle, padding: "22px 14px 8px", height: "52px" },
  };

  return (
    <div style={{ position: "relative" }}>
      {as === "textarea"
        ? <textarea {...sharedProps} />
        : <input type={type} {...sharedProps} />
      }
      <label style={{
        position: "absolute",
        left: "14px",
        top: lifted ? "7px" : "50%",
        transform: as === "textarea"
          ? "none"
          : lifted ? "none" : "translateY(-50%)",
        fontSize: lifted ? "10px" : "13px",
        fontWeight: lifted ? "500" : "400",
        color: lifted
          ? (focused ? "rgba(35,133,205,0.9)" : "rgba(255,255,255,0.45)")
          : "rgba(255,255,255,0.45)",
        pointerEvents: "none",
        transition: "all 0.18s ease",
        letterSpacing: lifted ? "0.04em" : "0",
      }}>
        {label}{required ? " *" : ""}
      </label>
    </div>
  );
};

/* ── Contact card ─────────────────────────────────────────────────────── */
const ContactCard = ({ icon, title, detail, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: index * 0.1 }}
    viewport={{ once: true }}
    whileHover={{ y: -3 }}
    className="p-6 text-center rounded-lg border border-[#2385cd]/40 group"
    style={{
      background: "linear-gradient(135deg, rgba(15,23,42,0.90) 0%, rgba(35,133,205,0.20) 100%)",
      backdropFilter: "blur(6px)",
      WebkitBackdropFilter: "blur(6px)",
      transition: "box-shadow 0.3s",
      cursor: "default",
    }}
    onHoverStart={e => e.currentTarget.style.boxShadow = "0 8px 32px rgba(35,133,205,0.18)"}
    onHoverEnd={e => e.currentTarget.style.boxShadow = "none"}
  >
    <motion.div
      className="text-2xl mb-3 flex justify-center text-[#2385cd]"
      whileHover={{ scale: 1.2, rotate: 8 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      {icon}
    </motion.div>
    <h3 className="font-semibold mb-2">{title}</h3>
    <p className="text-sm text-gray-200">{detail}</p>
  </motion.div>
);

/* ── Success screen ───────────────────────────────────────────────────── */
const SuccessScreen = ({ onReset }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.94 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.94 }}
    transition={{ duration: 0.35 }}
    className="flex flex-col items-center justify-center text-center py-12 px-6"
  >
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.15, type: "spring", stiffness: 260, damping: 18 }}
      style={{
        width: 64, height: 64, borderRadius: "50%",
        background: "rgba(34,197,94,0.15)",
        border: "1px solid rgba(34,197,94,0.35)",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: "1.25rem",
      }}
    >
      <FaCheckCircle style={{ color: "#86efac", fontSize: 28 }} />
    </motion.div>
    <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Message sent!</h3>
    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", maxWidth: 260, lineHeight: 1.6, marginBottom: "1.5rem" }}>
      We'll get back to you within 24 hours. Check your inbox for a confirmation.
    </p>
    <button
      onClick={onReset}
      style={{
        background: "transparent",
        border: "1px solid rgba(35,133,205,0.45)",
        borderRadius: 8,
        color: "rgba(35,133,205,0.9)",
        padding: "8px 20px",
        fontSize: 13,
        cursor: "pointer",
        transition: "background 0.2s",
      }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(35,133,205,0.10)"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      OK
    </button>
  </motion.div>
);

/* ── Main component ───────────────────────────────────────────────────── */
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
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError("Please fill in your name, email, and message.");
      return;
    }
    setSending(true);
    try {
      await apiContactForm(form);
      setSuccess(true);
      setForm(INITIAL_FORM);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const msgLen = form.message.length;
  const msgNearLimit = msgLen > MAX_MSG * 0.8;

  const fieldVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.35 } }),
  };

  return (
    <div className="bg-[#3f5357] min-h-screen text-white">

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative rounded-b-3xl overflow-hidden flex items-center"
        style={{
          minHeight: "500px",
          backgroundImage: `url('https://res.cloudinary.com/dotvnclej/image/upload/v1780164705/Dark_Blue_Modern_Geometric_Simple_Feature_Section_Website_UI_Prototype_3_wvb6sz.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div
          className="absolute inset-0 rounded-b-3xl"
          style={{ background: "linear-gradient(135deg, rgba(0,0,0,0.80) 0%, rgba(35,133,205,0.50) 100%)" }}
        />
        <div className="relative z-10 flex flex-row items-center justify-between h-full px-10 md:px-16 py-28 gap-8">
          <div className="flex flex-col items-start max-w-lg">
            <p className="uppercase tracking-widest text-[#2385cd] text-sm font-semibold mb-3">
              Get In Touch
            </p>
            <h1 className="text-5xl md:text-6xl font-bold mb-5 leading-tight">
              <span className="text-white">CONTACT </span>
              <span className="text-[#2385cd]">US</span>
            </h1>
            <p className="text-sm md:text-base mb-8 text-gray-300">
              We are here to help you. Reach out to us through any of the platforms below and our team will respond promptly.
            </p>
            <div className="flex gap-4">
              <HireStaffButton user={user} />
              <GetJobButton user={user} />
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── CONTACT OPTION CARDS ──────────────────────────────────────── */}
      <section
        className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        style={{ background: "#0f172a" }}
      >
        {[
          { icon: <FaPhoneAlt />,      title: "Call Us",         detail: "+234 706 817 2272" },
          { icon: <FaEnvelope />,      title: "Email Us",        detail: "info@randleandhopkick.com" },
          { icon: <FaMapMarkerAlt />,  title: "Visit Us",        detail: "73, Ogudu Road, Ojota, Lagos, Nigeria" },
          { icon: <FaClock />,         title: "Business Hours",  detail: "Open 24/7 — We're always here for you." },
        ].map((item, i) => (
          <ContactCard key={i} index={i} {...item} />
        ))}
      </section>

      {/* ── FORM + MAP ────────────────────────────────────────────────── */}
      <section
        className="p-6 md:p-10 grid grid-cols-1 lg:grid-cols-2 gap-8"
        style={{ background: "#1a1f2e" }}
      >
        {/* FORM CARD */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="rounded-xl shadow-lg overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(35,133,205,0.30)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
        >
          <AnimatePresence mode="wait">
            {success ? (
              <SuccessScreen key="success" onReset={() => setSuccess(false)} />
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-6"
              >
                <h2 className="text-xl font-bold mb-1">Send Us A Message</h2>
                <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.45)" }}>
                  Fill out the form and we'll get back within 24 hours.
                </p>

                {/* Error banner */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      key="err"
                      initial={{ opacity: 0, y: -8, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, y: -8, height: 0 }}
                      className="flex items-center gap-2 mb-4 p-3 rounded-lg text-sm"
                      style={{
                        background: "rgba(239,68,68,0.15)",
                        border: "1px solid rgba(239,68,68,0.35)",
                        color: "#fca5a5",
                      }}
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} noValidate>
                  <div className="space-y-4">

                    {/* Row 1 */}
                    <motion.div
                      className="grid grid-cols-1 md:grid-cols-2 gap-4"
                      custom={0} variants={fieldVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}
                    >
                      <FloatField label="Your Name" name="name" value={form.name} onChange={handleChange} required />
                      <FloatField label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
                    </motion.div>

                    {/* Row 2 */}
                    <motion.div
                      className="grid grid-cols-1 md:grid-cols-2 gap-4"
                      custom={1} variants={fieldVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}
                    >
                      <FloatField label="Phone" name="phone" value={form.phone} onChange={handleChange} />
                      <FloatField label="Subject" name="subject" value={form.subject} onChange={handleChange} />
                    </motion.div>

                    {/* Message + counter */}
                    <motion.div
                      custom={2} variants={fieldVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}
                      style={{ position: "relative" }}
                    >
                      <FloatField
                        label="Message"
                        name="message"
                        as="textarea"
                        value={form.message}
                        onChange={handleChange}
                        required
                      />
                      <span style={{
                        position: "absolute",
                        bottom: 10,
                        right: 12,
                        fontSize: 11,
                        color: msgNearLimit ? (msgLen >= MAX_MSG ? "#fca5a5" : "#fbbf24") : "rgba(255,255,255,0.30)",
                        transition: "color 0.2s",
                        pointerEvents: "none",
                      }}>
                        {msgLen}/{MAX_MSG}
                      </span>
                    </motion.div>

                    {/* Submit */}
                    <motion.div
                      custom={3} variants={fieldVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}
                    >
                      <motion.button
                        type="submit"
                        disabled={sending}
                        whileHover={sending ? {} : { scale: 1.015 }}
                        whileTap={sending ? {} : { scale: 0.985 }}
                        style={{
                          width: "100%",
                          padding: "13px",
                          borderRadius: 10,
                          fontWeight: 600,
                          fontSize: 14,
                          border: "none",
                          cursor: sending ? "not-allowed" : "pointer",
                          opacity: sending ? 0.65 : 1,
                          background: "linear-gradient(135deg, #2385cd, #4b86b4)",
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          letterSpacing: "0.02em",
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        {/* shimmer sweep */}
                        {!sending && (
                          <motion.span
                            style={{
                              position: "absolute",
                              inset: 0,
                              background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)",
                              backgroundSize: "200% 100%",
                            }}
                            initial={{ backgroundPositionX: "200%" }}
                            whileHover={{ backgroundPositionX: "-200%" }}
                            transition={{ duration: 0.55, ease: "easeInOut" }}
                          />
                        )}
                        {sending ? (
                          <>
                            <motion.span
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                              style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%" }}
                            />
                            Sending…
                          </>
                        ) : (
                          <>
                            <FaPaperPlane style={{ fontSize: 13 }} />
                            Send Message
                          </>
                        )}
                      </motion.button>
                    </motion.div>

                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* MAP + SOCIAL */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="flex flex-col gap-4"
        >
          <div style={{ position: "relative", borderRadius: 12, overflow: "hidden" }}>
            <iframe
              title="map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3963.5321134485894!2d3.3839175740462903!3d6.580573722499431!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x103b928efea67d8b%3A0x1f5bf4656249d9e5!2s73%20Ogudu%20Rd%2C%20Ojota%2C%20Lagos%20105102%2C%20Lagos!5e0!3m2!1sen!2sng!4v1775812764215!5m2!1sen!2sng"
              className="w-full h-64 md:h-80"
              style={{ border: "1px solid rgba(35,133,205,0.25)", borderRadius: 12, display: "block" }}
              loading="lazy"
            />
          </div>

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
              <h3 className="font-semibold text-sm uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.55)" }}>
                Our Address
              </h3>
              <p className="text-sm text-gray-300">73, Ogudu Road, Ojota, Lagos, Nigeria</p>
            </div>

            <div className="h-px bg-white/10" />

            <div>
              <h3 className="font-semibold text-sm uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.55)" }}>
                Follow Us
              </h3>
              <div className="flex gap-4 text-xl">
                {[
                  { href: "https://twitter.com/RandleHopkick",               icon: <FaTwitter /> },
                  { href: "https://web.facebook.com/randleandhopkick",        icon: <FaFacebookF /> },
                  { href: "https://www.instagram.com/randleandhopkick",       icon: <FaInstagram /> },
                  { href: "https://www.linkedin.com/company/randle-and-hopkick", icon: <FaLinkedin /> },
                ].map(({ href, icon }, i) => (
                  <motion.a
                    key={i}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    whileHover={{ scale: 1.25, color: "#2385cd" }}
                    whileTap={{ scale: 0.9 }}
                    style={{ color: "inherit", transition: "color 0.2s" }}
                  >
                    {icon}
                  </motion.a>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────── */}
      <FAQSection />
    </div>
  );
};

export default Contact;