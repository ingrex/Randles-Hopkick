import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, XCircle } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Shared UI primitives — used across all admin panel sections.
// Moved out of AdminPanel.jsx as-is (no logic changes) so sections can be
// split into their own files without duplicating these building blocks.
// ─────────────────────────────────────────────────────────────────────────────

// ── Brand tokens: Primary #2385cd | Navy #0f1e2e | Light #eaf4fc | Mid #b8d9f0

export function Pill({ label, color = "gray" }) {
  const map = {
    gray:   "bg-gray-100   text-gray-700",
    yellow: "bg-yellow-50  text-yellow-700",
    green:  "bg-green-50   text-green-700",
    blue:   "bg-[#eaf4fc]  text-[#1a6fa8]",
    red:    "bg-red-50     text-red-700",
    sky:    "bg-[#eaf4fc]  text-[#2385cd]",
    purple: "bg-purple-50  text-purple-700",
    brand:  "bg-[#2385cd]  text-white",
    orange: "bg-orange-50  text-orange-700",
  };
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${map[color] ?? map.gray}`}>
      {label}
    </span>
  );
}

export function Avatar({ src, name, size = "sm" }) {
  const initials = (name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const sz = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  if (src) return <img src={src} alt={name} className={`${sz} rounded-full object-cover shrink-0 border border-[#b8d9f0]`} />;
  return (
    <div className={`${sz} rounded-full bg-[#eaf4fc] text-[#2385cd] font-semibold flex items-center justify-center shrink-0`}>
      {initials}
    </div>
  );
}

export function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm sm:p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}>
        <motion.div
          initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
          className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-xl max-h-[92vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#eaf4fc] sticky top-0 bg-white z-10">
            <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-[#2385cd] transition p-1 -mr-1">
              <X size={18} />
            </button>
          </div>
          <div className="px-5 py-4 space-y-3">{children}</div>
          {footer && (
            <div className="px-5 py-3 border-t border-[#eaf4fc] flex justify-end gap-2 flex-wrap sticky bottom-0 bg-white">
              {footer}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function Btn({ children, onClick, variant = "default", disabled = false, className = "" }) {
  const base = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-40 cursor-pointer";
  const variants = {
    default: "bg-gray-100    text-gray-700  hover:bg-gray-200",
    primary: "bg-[#2385cd]   text-white     hover:bg-[#1a6fa8]",
    success: "bg-green-500   text-white     hover:bg-green-600",
    danger:  "bg-red-500     text-white     hover:bg-red-600",
    ghost:   "bg-transparent text-gray-500  hover:bg-[#eaf4fc] hover:text-[#2385cd]",
    brand:   "bg-[#eaf4fc]   text-[#2385cd] hover:bg-[#b8d9f0]",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function FormField({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      {children}
    </div>
  );
}

export const inputCls =
  "rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#2385cd] focus:ring-2 focus:ring-[#2385cd]/20 focus:bg-white transition w-full";

export function StarRating({ rating, max = 5 }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <Star key={`star-${i}`} size={12} className={i < Math.round(rating) ? "text-[#2385cd] fill-[#2385cd]" : "text-gray-200 fill-gray-200"} />
      ))}
    </span>
  );
}

export function SkillTagInput({ value = [], onChange }) {
  const [input, setInput] = useState("");
  const add = () => {
    const trimmed = input.trim();
    if (!trimmed || value.includes(trimmed)) { setInput(""); return; }
    onChange([...value, trimmed]);
    setInput("");
  };
  const remove = (skill) => onChange(value.filter((s) => s !== skill));
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input className={inputCls} placeholder="Type a skill and press Add…" value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} />
        <button type="button" onClick={add}
          className="px-3 py-2 rounded-lg bg-[#eaf4fc] text-[#2385cd] text-xs font-medium hover:bg-[#b8d9f0] transition shrink-0">
          Add
        </button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((sk) => (
            <span key={sk} className="flex items-center gap-1 text-xs bg-[#eaf4fc] text-[#1a6fa8] border border-[#b8d9f0] rounded-full px-2.5 py-0.5">
              {sk}
              <button type="button" onClick={() => remove(sk)} className="text-[#2385cd] hover:text-red-500 transition leading-none flex items-center"><XCircle size={12} /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function statusColor(s) {
  return {
    Pending:           "yellow",
    Approved:          "sky",
    Rejected:          "red",
    Declined:          "red",
    Completed:         "gray",
    "Awaiting Review": "orange",
  }[s] ?? "gray";
}

export function safeKey(r, idx) {
  return r?.backendId ?? r?._id ?? r?.id ?? `__row_${idx}`;
}

export function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-[#eaf4fc] flex items-center justify-center mb-3">
        <Icon size={20} className="text-[#2385cd]" />
      </div>
      <p className="text-sm font-medium text-gray-700">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1 max-w-xs">{subtitle}</p>}
    </div>
  );
}