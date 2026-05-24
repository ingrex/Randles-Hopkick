/**
 * TestimonialsSection.jsx
 *
 * Standalone testimonials component — used on Home.jsx (and anywhere else).
 * Data comes from two sources, in priority order:
 *   1. `testimonials` prop  — passed directly (e.g. from a page that fetches its own data)
 *   2. Global store         — populated / updated by the AdminPanel in real-time
 *
 * The AdminPanel's TestimonialsSection manages add / edit / delete / visibility.
 * This component only DISPLAYS visible testimonials.
 *
 * Fields consumed per testimonial:
 *   id, name, role, text, image (URL), rating (1-5), visible (bool)
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "../store"; // adjust path if your store lives elsewhere

// ─── Fallback avatar initials ─────────────────────────────────────────────────
function Initials({ name }) {
  const letters = (name || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      style={{
        width: 60, height: 60, borderRadius: "50%",
        background: "linear-gradient(135deg, #2385cd, #0055cc)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "1.1rem", fontWeight: 700, color: "#fff",
        border: "2px solid rgba(35,133,205,0.45)",
        flexShrink: 0,
      }}
    >
      {letters}
    </div>
  );
}

// ─── Star row ─────────────────────────────────────────────────────────────────
function Stars({ rating = 5 }) {
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {[...Array(5)].map((_, i) => (
        <span
          key={i}
          style={{
            color: i < Math.round(rating) ? "#2385cd" : "rgba(35,133,205,0.2)",
            fontSize: 13,
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

// ─── Single card ──────────────────────────────────────────────────────────────
function TestimonialCard({ item }) {
  return (
    <div
      className="min-w-full px-1"
      role="group"
      aria-label={`Testimonial from ${item.name}`}
    >
      <div
        className="rounded-2xl relative"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(35,133,205,0.18)",
          padding: "28px 24px 32px",
        }}
      >
        {/* Decorative quote */}
        <span
          aria-hidden="true"
          style={{
            position: "absolute", top: 14, right: 20,
            fontSize: 72, lineHeight: 1,
            color: "rgba(35,133,205,0.10)",
            fontFamily: "Georgia, serif", fontWeight: 700,
            pointerEvents: "none", userSelect: "none",
          }}
        >
          "
        </span>

        {/* Avatar + name + role + stars */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              style={{
                width: 60, height: 60, borderRadius: "50%",
                objectFit: "cover", flexShrink: 0,
                border: "2px solid rgba(35,133,205,0.45)",
              }}
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
          ) : (
            <Initials name={item.name} />
          )}
          <div>
            <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.95rem", margin: "0 0 2px" }}>
              {item.name}
            </p>
            <p style={{
              fontWeight: 600, color: "#2385cd", fontSize: "0.72rem",
              textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 6px",
            }}>
              {item.role}
            </p>
            <Stars rating={item.rating} />
          </div>
        </div>

        {/* Accent divider */}
        <div style={{
          width: 36, height: 2, background: "#2385cd",
          borderRadius: 2, marginBottom: 14,
        }} />

        {/* Quote text */}
        <p
          className="italic leading-relaxed"
          style={{ color: "#c8d8e8", fontSize: "0.95rem", margin: 0 }}
        >
          "{item.text}"
        </p>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
/**
 * @param {object}  props
 * @param {Array}  [props.testimonials]  Optional override — if omitted, reads from global store
 * @param {string} [props.heading]       Section heading override
 * @param {string} [props.subheading]    Section sub-label override
 */
export default function TestimonialsSection({
  testimonials: propTestimonials,
  heading = "Trusted by Businesses & Families",
  subheading = "What our clients say",
}) {
  const { state } = useStore();

  // Use prop testimonials if provided, otherwise fall back to store
  const all = propTestimonials ?? state.testimonials ?? [];

  // Only show testimonials marked visible (admin can hide/show)
  const visible = all.filter((t) => t.visible !== false);

  const [current, setCurrent] = useState(0);

  // Auto-advance every 7 s; reset when list changes
  useEffect(() => {
    if (visible.length <= 1) return;
    const id = setInterval(() => {
      setCurrent((prev) => (prev + 1) % visible.length);
    }, 7000);
    return () => clearInterval(id);
  }, [visible.length]);

  // Keep current in bounds if testimonials are removed
  useEffect(() => {
    if (current >= visible.length && visible.length > 0) {
      setCurrent(visible.length - 1);
    }
  }, [visible.length, current]);

  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  // Nothing to show — render nothing (avoids empty section on page)
  if (visible.length === 0) return null;

  return (
    <section
      className="py-20 px-4 md:px-6 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0a0f1e 0%, #0d1b2a 60%, #0a1628 100%)",
      }}
      aria-label="Client testimonials"
    >
      {/* Ambient glows */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute", top: -120, left: -120,
          width: 400, height: 400,
          background: "radial-gradient(circle, #2385cd18 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute", bottom: -100, right: -100,
          width: 350, height: 350,
          background: "radial-gradient(circle, #2385cd12 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Section label */}
      <motion.p
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        variants={fadeUp}
        className="text-center font-semibold uppercase tracking-widest mb-2"
        style={{ fontSize: "0.75rem", color: "#2385cd" }}
      >
        {subheading}
      </motion.p>

      {/* Heading */}
      <motion.h2
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        variants={fadeUp}
        className="text-2xl md:text-4xl font-bold text-white text-center mb-12"
      >
        {heading}
      </motion.h2>

      {/* Slider */}
      <div className="max-w-2xl mx-auto overflow-hidden relative" aria-live="polite">
        <motion.div
          animate={{ x: `-${current * 100}%` }}
          transition={{ duration: 0.85, ease: [0.4, 0, 0.2, 1] }}
          className="flex"
        >
          {visible.map((item) => (
            <TestimonialCard key={item.id ?? item._id ?? item.name} item={item} />
          ))}
        </motion.div>
      </div>

      {/* Dot navigation */}
      {visible.length > 1 && (
        <div
          className="flex justify-center gap-2 mt-8"
          role="tablist"
          aria-label="Testimonial navigation"
        >
          {visible.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={current === i}
              aria-label={`Go to testimonial ${i + 1}`}
              onClick={() => setCurrent(i)}
              style={{
                width: 8, height: 8, borderRadius: "50%",
                border: "none", padding: 0, cursor: "pointer",
                background: current === i ? "#2385cd" : "rgba(35,133,205,0.25)",
                transform: current === i ? "scale(1.3)" : "scale(1)",
                transition: "background 0.3s, transform 0.3s",
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}