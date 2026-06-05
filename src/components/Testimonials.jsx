import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { apiFetchTestimonials } from "../api/auth";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

function normalise(t, i) {
  if (!t || typeof t !== "object") return null;
  return {
    id:      t._id        ?? t.id         ?? `testi-${i}`,
    name:    t.name       ?? t.author     ?? t.clientName  ?? "",
    role:    t.role       ?? t.title      ?? t.position    ?? "",
    company: t.company    ?? "",
    text:    t.text       ?? t.content    ?? t.testimonial ?? t.review ?? t.body ?? "",
    image:   t.image      ?? t.avatar     ?? t.photo       ?? t.photoUrl
             ?? t.imageUrl ?? t.picture   ?? t.img         ?? "",
    rating:  typeof t.rating === "number" ? t.rating : Number(t.rating ?? t.stars ?? 5),
    visible: true,
  };
}

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [current, setCurrent]           = useState(0);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    apiFetchTestimonials()
      .then((data) => {
        const raw  = Array.isArray(data) ? data : (data?.testimonials ?? data?.data ?? []);
        const list = raw
          .map((t, i) => normalise(t, i))
          .filter((t) => t && t.text);
        setTestimonials(list);
      })
      .catch((err) => {
        console.error("[Testimonials] fetch failed:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (current >= testimonials.length && testimonials.length > 0) {
      setCurrent(0);
    }
  }, [testimonials.length, current]);

  useEffect(() => {
    if (testimonials.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  if (loading) return null;
  if (!testimonials.length) return null;

  return (
    <section
      className="py-20 px-4 md:px-6 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0a0f1e 0%, #0d1b2a 60%, #0a1628 100%)",
      }}
    >
      <div style={{ position:"absolute", top:"-120px", left:"-120px", width:"400px", height:"400px",
        background:"radial-gradient(circle, #2385cd18 0%, transparent 70%)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", bottom:"-100px", right:"-100px", width:"350px", height:"350px",
        background:"radial-gradient(circle, #2385cd12 0%, transparent 70%)", pointerEvents:"none" }} />

      <motion.p
        initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
        className="text-center font-semibold uppercase tracking-widest mb-2"
        style={{ fontSize: "0.75rem", color: "#2385cd" }}
      >
        What our clients say
      </motion.p>

      <motion.h2
        initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
        className="text-2xl md:text-4xl font-bold text-white text-center mb-12"
      >
        Trusted by Businesses &amp; Families
      </motion.h2>

      <div className="max-w-2xl mx-auto overflow-hidden relative">
        <motion.div
          animate={{ x: `-${current * 100}%` }}
          transition={{ duration: 0.85, ease: [0.4, 0, 0.2, 1] }}
          className="flex"
        >
          {testimonials.map((item, i) => (
            <div key={item.id ?? i} className="min-w-full px-1">
              <div
                className="rounded-2xl relative"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(35,133,205,0.18)",
                  padding: "28px 24px 32px",
                }}
              >
                <span style={{
                  position:"absolute", top:"14px", right:"20px",
                  fontSize:"72px", lineHeight:1,
                  color:"rgba(35,133,205,0.1)",
                  fontFamily:"Georgia, serif", fontWeight:700,
                  pointerEvents:"none", userSelect:"none",
                }}>"</span>

                <div style={{ display:"flex", alignItems:"center", gap:"16px", marginBottom:"20px" }}>
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{
                        width:"60px", height:"60px", borderRadius:"50%",
                        objectFit:"cover", flexShrink:0,
                        border:"2px solid rgba(35,133,205,0.45)",
                      }}
                    />
                  ) : (
                    <div style={{
                      width:"60px", height:"60px", borderRadius:"50%", flexShrink:0,
                      border:"2px solid rgba(35,133,205,0.45)",
                      background:"rgba(35,133,205,0.15)",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      color:"#2385cd", fontWeight:700, fontSize:"1.1rem",
                    }}>
                      {item.name?.charAt(0)?.toUpperCase() ?? "?"}
                    </div>
                  )}

                  <div>
                    <p style={{ fontWeight:700, color:"#ffffff", fontSize:"0.95rem", margin:"0 0 2px" }}>
                      {item.name}
                    </p>
                    <p style={{ fontWeight:600, color:"#2385cd", fontSize:"0.72rem",
                      textTransform:"uppercase", letterSpacing:"0.05em", margin:"0 0 6px" }}>
                      {item.role && item.company
                        ? `${item.role}, ${item.company}`
                        : item.role || item.company}
                    </p>
                    <div style={{ display:"flex", gap:"3px" }}>
                      {[...Array(5)].map((_, s) => (
                        <span key={s} style={{
                          color: s < (item.rating ?? 5) ? "#2385cd" : "rgba(35,133,205,0.25)",
                          fontSize:"12px",
                        }}>★</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ width:"36px", height:"2px", background:"#2385cd",
                  borderRadius:"2px", marginBottom:"14px" }} />

                <p className="italic leading-relaxed"
                  style={{ color:"#c8d8e8", fontSize:"0.95rem", margin:0 }}>
                  "{item.text}"
                </p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {testimonials.length > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Go to testimonial ${i + 1}`}
              style={{
                width:"8px", height:"8px", borderRadius:"50%",
                border:"none", padding:0, cursor:"pointer",
                background: current === i ? "#2385cd" : "rgba(35,133,205,0.25)",
                transform: current === i ? "scale(1.3)" : "scale(1)",
                transition:"background 0.3s, transform 0.3s",
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default Testimonials;