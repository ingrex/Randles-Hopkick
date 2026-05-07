// src/ApplicationForms/PrivateForm.jsx
// ─── FIXES in this version ────────────────────────────────────────────────────
// 1. Role & quantity bug: each employee row is now kept in full until submit;
//    buildPayload() correctly maps every row that has a name selected.
// 2. After a successful API call the form dispatches ADD_REQUEST into the shared
//    store so Dashboard and AdminPanel both see the new request immediately.
// 3. Success screen "Done" button closes the modal via onSubmit().
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, memo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Select from "react-select";
import countryList from "react-select-country-list";
import { apiStaffRequest } from "../api/auth";
import { useStore, buildRequestPayload } from "../store";

const glass =
  "bg-white/5 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-sky-300/40 transition text-white placeholder-white/50";

const glassSelectStyles = {
  control: (base, state) => ({
    ...base,
    backgroundColor: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.1)",
    boxShadow: state.isFocused
      ? "0 0 0 1px rgba(56,189,248,0.5), 0 0 12px rgba(56,189,248,0.4)"
      : "none",
    borderRadius: "12px",
    color: "white",
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: "rgba(15,23,42,0.95)",
    backdropFilter: "blur(16px)",
    border: "1px solid rgba(56,189,248,0.3)",
    zIndex: 9999,
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isFocused ? "rgba(56,189,248,0.2)" : "transparent",
    color: "white",
  }),
  singleValue: (base) => ({ ...base, color: "white" }),
  input:       (base) => ({ ...base, color: "white" }),
  placeholder: (base) => ({ ...base, color: "rgba(255,255,255,0.5)" }),
};

const STAFF_ROLES = [
  "Receptionists","Office Assistants","Data Entry Clerks","Cleaners / Janitors",
  "Facility Managers","Maintenance Technicians","Electricians",
  "Customer Service Representatives","Sales Representatives","IT Support Staff",
  "Dispatch Riders","Drivers","Housekeepers","Maids","Nannies",
  "Laundry Assistants","Caregivers","Private Chefs","Event Cooks",
  "Security Guards","Masons / Bricklayers","Carpenters","Painters",
  "Tilers","Plumbers","Generator Technicians","HVAC Technicians",
  "Welders / Fabricators","Furniture Makers","Interior Decorators",
  "Upholsterers","Tailors / Fashion Designers","Barbers / Hair Stylists",
  "Makeup Artists","Handymen","Installers (Solar, CCTV)",
  "Digital Marketing","Content Creation","Video Production","Training Programs",
];

const STORAGE_KEY = "privateFormDraft";
const INITIAL_FORM = {
  surname: "", otherName: "", email: "", phone: "",
  nationality: null, businessLocation: "", additionalComment: "",
  employees: [{ name: "", quantity: 1, search: "" }],
  agreed: false,
};

const FloatingInput = memo(({ name, value, onChange, placeholder, type = "text" }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      <input
        type={type} name={name} value={value} onChange={onChange}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        className="w-full rounded-xl px-3 pt-6 pb-2 bg-white/10 border border-white/20 text-white outline-none focus:border-sky-400/60 transition"
      />
      <label
        className="absolute left-3 pointer-events-none transition-all duration-150"
        style={{
          top:      value || focused ? "4px"     : "14px",
          fontSize: value || focused ? "0.65rem" : "0.875rem",
          color:    focused ? "#7dd3fc" : "#94a3b8",
        }}
      >
        {placeholder}
      </label>
    </div>
  );
});

export function PrivateForm({ onSubmit }) {
  const navigate    = useNavigate();
  const { dispatch } = useStore();

  const [step,          setStep]          = useState(1);
  const [countries,     setCountries]     = useState([]);
  const [submitting,    setSubmitting]    = useState(false);
  const [submitStatus,  setSubmitStatus]  = useState(null);   // null | "success" | "error"
  const [errorMessage,  setErrorMessage]  = useState("");

  const [formData, setFormData] = useState(() => {
    try { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : INITIAL_FORM; }
    catch { return INITIAL_FORM; }
  });

  useEffect(() => { setCountries(countryList().getData()); }, []);
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(formData)); }, [formData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const isEmailValid = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const isStep1Valid = () =>
    formData.surname.trim() && formData.email.trim() && isEmailValid(formData.email) &&
    formData.phone.trim() && formData.businessLocation.trim() && formData.nationality;

  // ✅ FIX: valid when at least one employee has a name selected
  const isStep2Valid = () =>
    formData.employees.some((e) => e.name.trim()) && formData.agreed;

  const progress = step === 1
    ? Math.floor(
        [formData.surname, formData.email, formData.phone, formData.businessLocation, formData.nationality]
          .filter(Boolean).length / 5 * 100
      )
    : isStep2Valid() ? 100 : 60;

  const updateEmployee = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      employees: prev.employees.map((emp, i) => i === index ? { ...emp, [field]: value } : emp),
    }));
  };

  const selectRole = (index, role) => {
    setFormData((prev) => ({
      ...prev,
      employees: prev.employees.map((emp, i) =>
        i === index ? { ...emp, name: role, search: role } : emp
      ),
    }));
  };

  const clearRole = (index) => {
    setFormData((prev) => ({
      ...prev,
      employees: prev.employees.map((emp, i) =>
        i === index ? { ...emp, name: "", search: "" } : emp
      ),
    }));
  };

  const removeEmployee = (index) => {
    setFormData((prev) => {
      const updated = prev.employees.filter((_, i) => i !== index);
      return { ...prev, employees: updated.length ? updated : [{ name: "", quantity: 1, search: "" }] };
    });
  };

  const addEmployee = () => {
    const last = formData.employees[formData.employees.length - 1];
    if (!last.name) return;   // must select a role before adding another row
    setFormData((prev) => ({
      ...prev,
      employees: [...prev.employees, { name: "", quantity: 1, search: "" }],
    }));
  };

  // ✅ FIX: correctly maps ALL selected roles with their actual quantities
  const buildPayload = () => ({
    clientType: "Individual",
    personalDetails: {
      surname:           formData.surname.trim(),
      otherName:         formData.otherName.trim(),
      email:             formData.email.trim(),
      phoneNo:           formData.phone.trim(),
      nationality:       formData.nationality?.label || "",
      businessLocation:  formData.businessLocation.trim(),
      additionalComment: formData.additionalComment.trim(),
    },
    requestedStaff: formData.employees
      .filter((e) => e.name.trim())
      .map((e) => ({ role: e.name, quantity: Number(e.quantity) })),
    agreedToPolicy: formData.agreed,
  });

  const handleSubmit = async () => {
    if (!isStep2Valid()) return;
    setSubmitting(true);
    setSubmitStatus(null);
    setErrorMessage("");
    try {
      const payload = buildPayload();
      const data    = await apiStaffRequest(payload);

      // ✅ Push into shared store so Dashboard + AdminPanel update immediately
      dispatch({ type: "ADD_REQUEST", payload: buildRequestPayload(payload, data) });

      localStorage.removeItem(STORAGE_KEY);
      setSubmitStatus("success");
      if (onSubmit) onSubmit(data);
    } catch (err) {
      if (err.message?.includes("401") || err.message?.toLowerCase().includes("unauthorized")) {
        navigate("/login");
        return;
      }
      setSubmitStatus("error");
      setErrorMessage(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const steps = ["Personal Info", "Staff Request"];

  // ── Success screen ──────────────────────────────────────────────────────────
  if (submitStatus === "success") {
    return (
      <div className="w-full p-8 text-white rounded-xl bg-white/10 backdrop-blur-xl border border-white/10 shadow-lg flex flex-col items-center gap-4 text-center">
        <div className="text-5xl">✅</div>
        <h3 className="text-2xl font-semibold">Request Submitted!</h3>
        <p className="text-white/60">Your staff request has been received. We'll be in touch shortly.</p>
        <div className="flex gap-3 mt-2">
          <button
            onClick={() => { setFormData(INITIAL_FORM); setStep(1); setSubmitStatus(null); }}
            className="px-6 py-2 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition"
          >
            New Request
          </button>
          <button
            onClick={() => onSubmit && onSubmit()}
            className="px-6 py-2 bg-sky-400 text-black rounded-xl font-medium"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-h-[85vh] overflow-y-auto p-6 text-white rounded-xl bg-white/10 backdrop-blur-xl border border-white/10 shadow-lg">
      <h2 className="text-2xl font-semibold mb-2">Request Staff</h2>

      {/* Step indicators */}
      <div className="flex gap-2 mb-4">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              step > i + 1 ? "bg-sky-400 text-black"
              : step === i + 1 ? "bg-sky-400/30 border border-sky-400 text-sky-300"
              : "bg-white/10 text-white/30"
            }`}>
              {step > i + 1 ? "✓" : i + 1}
            </div>
            <span className={`text-xs ${step === i + 1 ? "text-sky-300" : "text-white/30"}`}>{label}</span>
            {i < steps.length - 1 && <div className={`flex-1 h-px ${step > i + 1 ? "bg-sky-400" : "bg-white/10"}`} />}
          </div>
        ))}
      </div>

      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-6">
        <div className="h-full bg-sky-400 rounded-full transition-all duration-400" style={{ width: `${progress}%` }} />
      </div>

      <AnimatePresence mode="wait">
        {/* ── Step 1 ── */}
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FloatingInput name="surname"    value={formData.surname}    onChange={handleChange} placeholder="Surname *" />
              <FloatingInput name="otherName"  value={formData.otherName}  onChange={handleChange} placeholder="Other Name" />
              <div className="flex flex-col gap-1">
                <FloatingInput name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Email Address *" />
                {formData.email && !isEmailValid(formData.email) && (
                  <span className="text-red-400 text-xs pl-1">Invalid email</span>
                )}
              </div>
              <FloatingInput name="phone"            value={formData.phone}            onChange={handleChange} placeholder="Phone Number *" />
              <div className="col-span-2">
                <Select options={countries} value={formData.nationality} onChange={(v) => setFormData((p) => ({ ...p, nationality: v }))} placeholder="Nationality *" styles={glassSelectStyles} />
              </div>
              <div className="col-span-2">
                <FloatingInput name="businessLocation" value={formData.businessLocation} onChange={handleChange} placeholder="Business / Home Location *" />
              </div>
              <div className="col-span-2">
                <textarea name="additionalComment" value={formData.additionalComment} onChange={handleChange} rows={3} placeholder="Additional comments (optional)" className={glass + " resize-none"} />
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={() => setStep(2)} disabled={!isStep1Valid()} className="px-6 py-2 bg-sky-400 text-black rounded-xl font-medium disabled:opacity-40">
                Next →
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Step 2 ── */}
        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
            <p className="text-white/50 text-sm">Add the staff roles you need:</p>

            {formData.employees.map((emp, index) => {
              const filtered = STAFF_ROLES.filter(
                (role) =>
                  role.toLowerCase().includes((emp.search || "").toLowerCase()) &&
                  !formData.employees.some((e, i) => e.name === role && i !== index)
              );
              return (
                <div key={index} className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-3">
                  {!emp.name ? (
                    <div className="space-y-1">
                      <input
                        className={glass}
                        placeholder="Search staff role..."
                        value={emp.search}
                        onChange={(e) => updateEmployee(index, "search", e.target.value)}
                        autoFocus={index === formData.employees.length - 1}
                      />
                      {emp.search && filtered.length > 0 && (
                        <div className="bg-slate-900/90 border border-white/10 rounded-lg max-h-44 overflow-y-auto">
                          {filtered.map((role) => (
                            <div key={role} onClick={() => selectRole(index, role)} className="px-3 py-2 hover:bg-sky-400/20 cursor-pointer text-sm text-white/80 hover:text-white transition">
                              {role}
                            </div>
                          ))}
                        </div>
                      )}
                      {emp.search && filtered.length === 0 && (
                        <p className="text-white/30 text-xs pl-1">No matching roles found.</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="bg-sky-400/20 text-sky-300 border border-sky-400/30 rounded-lg px-3 py-1 text-sm font-medium">
                          {emp.name}
                        </span>
                        <button onClick={() => clearRole(index)} className="text-white/30 hover:text-red-400 transition text-xs">
                          ✕ Change
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/50 text-sm">How many do you need?</span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateEmployee(index, "quantity", Math.max(1, emp.quantity - 1))}
                            className="w-8 h-8 rounded-full bg-white/10 hover:bg-sky-400/30 hover:text-sky-300 transition text-lg font-bold flex items-center justify-center"
                          >−</button>
                          <span className="w-8 text-center font-semibold text-lg">{emp.quantity}</span>
                          <button
                            onClick={() => updateEmployee(index, "quantity", emp.quantity + 1)}
                            className="w-8 h-8 rounded-full bg-white/10 hover:bg-sky-400/30 hover:text-sky-300 transition text-lg font-bold flex items-center justify-center"
                          >+</button>
                        </div>
                      </div>
                    </div>
                  )}
                  {formData.employees.length > 1 && (
                    <button onClick={() => removeEmployee(index)} className="text-red-400/50 hover:text-red-400 transition text-xs w-full text-right">
                      Remove this role
                    </button>
                  )}
                </div>
              );
            })}

            <button onClick={addEmployee} className="text-sky-400 hover:text-sky-300 transition text-sm">
              + Add Another Role
            </button>

            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" name="agreed" checked={formData.agreed} onChange={handleChange} className="mt-1 accent-sky-400" />
              <span className="text-white/70 text-sm">
                I agree to the terms and conditions, and confirm that the information provided is accurate.
              </span>
            </label>

            {submitStatus === "error" && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                ⚠️ {errorMessage}
              </div>
            )}

            <div className="flex justify-between pt-2">
              <button onClick={() => setStep(1)} disabled={submitting} className="px-4 py-2 text-white/60 hover:text-white transition disabled:opacity-40">
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isStep2Valid() || submitting}
                className="px-6 py-2 bg-sky-400 text-black rounded-xl font-medium disabled:opacity-40 flex items-center gap-2"
              >
                {submitting
                  ? <><span className="inline-block w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />Submitting...</>
                  : "Submit Request"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default PrivateForm;