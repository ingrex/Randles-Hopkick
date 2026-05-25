import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Select from "react-select";
import countryList from "react-select-country-list";
import { apiStaffRequest } from "../api/auth";
import { useStore, buildRequestPayload } from "../store";
import { useAuth } from "../pages/AuthContext";

const glass =
  "bg-white/5 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-sky-300/40 transition text-white placeholder-white/50";

const glassLocked =
  "bg-white/5 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2 w-full text-white/50 cursor-not-allowed select-none";

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

const glassSelectStyles = {
  control: (base, state) => ({
    ...base,
    backgroundColor: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.1)",
    boxShadow: state.isFocused ? "0 0 0 1px rgba(56,189,248,0.5), 0 0 12px rgba(56,189,248,0.4)" : "none",
    borderRadius: "12px",
    color: "white",
  }),
  menu:        (base)        => ({ ...base, backgroundColor: "rgba(15,23,42,0.95)", backdropFilter: "blur(16px)", border: "1px solid rgba(56,189,248,0.3)" }),
  option:      (base, state) => ({ ...base, backgroundColor: state.isFocused ? "rgba(56,189,248,0.2)" : "transparent", color: "white" }),
  singleValue: (base)        => ({ ...base, color: "white" }),
  input:       (base)        => ({ ...base, color: "white" }),
  placeholder: (base)        => ({ ...base, color: "rgba(255,255,255,0.5)" }),
};

const STORAGE_KEY = "organizationFormDraft";

const getAuthPrefill = (user) => ({
  surname:   user?.surname     || "",
  otherName: user?.otherNames  || "",
  phone:     user?.phoneNumber || "",
});

const getInitialForm = (user) => ({
  ...getAuthPrefill(user),
  role: "",
  companyName: "", email: "", companyPhone: "", address: "", country: null,
  industry: "", regNo: "",
  employees: [{ name: "", quantity: 1, search: "" }],
  agreed: false,
});

export function ClientForm1({ onSubmit }) {
  const navigate     = useNavigate();
  const { dispatch } = useStore();
  const { user }     = useAuth();

  const [step,         setStep]         = useState(1);
  const [countries,    setCountries]    = useState([]);
  const [submitting,   setSubmitting]   = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState(() => {
    try {
      const s     = localStorage.getItem(STORAGE_KEY);
      const draft = s ? JSON.parse(s) : null;
      const base  = getInitialForm(user);
      if (draft) {
        return {
          ...draft,
          surname:   base.surname,
          otherName: base.otherName,
          phone:     base.phone,
        };
      }
      return base;
    } catch {
      return getInitialForm(user);
    }
  });

  // Sync locked fields whenever user arrives from async storage
  useEffect(() => {
    if (!user) return;
    setFormData((prev) => ({
      ...prev,
      surname:   user.surname     || "",
      otherName: user.otherNames  || "",
      phone:     user.phoneNumber || "",
    }));
  }, [user?.surname, user?.otherNames, user?.phoneNumber]);

  useEffect(() => { setCountries(countryList().getData()); }, []);
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(formData)); }, [formData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const isEmailValid  = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const isStep1Valid  = () => formData.surname.trim() && formData.phone.trim() && formData.role.trim();
  const isStep2Valid  = () =>
    formData.companyName.trim() && formData.email.trim() && isEmailValid(formData.email) &&
    formData.companyPhone.trim() && formData.address.trim() && formData.country &&
    formData.industry.trim() && formData.regNo.trim();
  const isStep3Valid  = () => formData.employees.some((e) => e.name.trim()) && formData.agreed;

  const nextStep = () => {
    if (step === 1 && !isStep1Valid()) return;
    if (step === 2 && !isStep2Valid()) return;
    setStep((p) => p + 1);
  };

  const updateEmployee = (index, field, value) =>
    setFormData((p) => ({ ...p, employees: p.employees.map((e, i) => i === index ? { ...e, [field]: value } : e) }));

  const selectRole = (index, role) =>
    setFormData((p) => ({ ...p, employees: p.employees.map((e, i) => i === index ? { ...e, name: role, search: role } : e) }));

  const clearRole = (index) =>
    setFormData((p) => ({ ...p, employees: p.employees.map((e, i) => i === index ? { ...e, name: "", search: "" } : e) }));

  const removeEmployee = (index) =>
    setFormData((p) => {
      const updated = p.employees.filter((_, i) => i !== index);
      return { ...p, employees: updated.length ? updated : [{ name: "", quantity: 1, search: "" }] };
    });

  const addEmployee = () => {
    if (!formData.employees[formData.employees.length - 1].name) return;
    setFormData((p) => ({ ...p, employees: [...p.employees, { name: "", quantity: 1, search: "" }] }));
  };

  // ── FIX: repDetails now sends surname as a separate field, not joined into name ──
  const buildPayload = () => ({
    clientType: "Organisation",
    repDetails: {
      surname:     formData.surname.trim(),
      otherName:   formData.otherName.trim(),
      phoneNumber: formData.phone.trim(),
      jobRole:     formData.role.trim(),
    },
    companyDetails: {
      companyName:    formData.companyName.trim(),
      companyEmail:   formData.email.trim(),
      companyPhone:   formData.companyPhone.trim(),
      companyAddress: formData.address.trim(),
      industry:       formData.industry.trim(),
      companyRegNo:   formData.regNo.trim(),
    },
    requestedStaff: formData.employees
      .filter((e) => e.name.trim())
      .map((e) => ({ role: e.name, quantity: Number(e.quantity) })),
    agreedToPolicy: formData.agreed,
  });

  // ── FIX: guard all three steps before submitting ──
  const handleSubmit = async () => {
    if (!isStep1Valid() || !isStep2Valid() || !isStep3Valid()) return;
    setSubmitting(true);
    setSubmitStatus(null);
    setErrorMessage("");
    try {
      const payload = buildPayload();
      const data    = await apiStaffRequest(payload);

      dispatch({ type: "ADD_REQUEST", payload: buildRequestPayload(payload, data) });

      localStorage.removeItem(STORAGE_KEY);
      setSubmitStatus("success");
      if (onSubmit) onSubmit(data);
    } catch (err) {
      if (err.message?.includes("401") || err.message?.toLowerCase().includes("unauthorized")) {
        navigate("/login"); return;
      }
      setSubmitStatus("error");
      setErrorMessage(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitStatus === "success") {
    return (
      <div className="w-full p-8 text-white rounded-xl bg-white/10 backdrop-blur-xl border border-white/10 shadow-lg flex flex-col items-center gap-4 text-center">
        <div className="text-5xl">✅</div>
        <h2 className="text-2xl font-semibold">Request Submitted!</h2>
        <p className="text-white/60">Your staff request has been received. We will be in touch shortly.</p>
        <div className="flex gap-3 mt-2">
          <button onClick={() => { setFormData(getInitialForm(user)); setStep(1); setSubmitStatus(null); }}
            className="px-6 py-2 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition">
            New Request
          </button>
          <button onClick={() => { if (onSubmit) onSubmit(); else navigate("/dashboard"); }}
            className="px-6 py-2 bg-sky-400 text-black rounded-xl font-medium">
            Done
          </button>
        </div>
      </div>
    );
  }

  const steps = ["Rep Details", "Company", "Staff"];

  return (
    <div className="w-full max-h-[85vh] overflow-y-auto p-6 text-white rounded-xl bg-white/10 backdrop-blur-xl border border-white/10 shadow-lg">
      <h2 className="text-2xl font-semibold mb-2">Request Staff</h2>

      {/* Step indicator */}
      <div className="flex gap-2 mb-6">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              step > i+1 ? "bg-sky-400 text-black" : step === i+1 ? "bg-sky-400/30 border border-sky-400 text-sky-300" : "bg-white/10 text-white/30"
            }`}>{step > i+1 ? "✓" : i+1}</div>
            <span className={`text-xs ${step === i+1 ? "text-sky-300" : "text-white/30"}`}>{label}</span>
            {i < steps.length-1 && <div className={`flex-1 h-px ${step > i+1 ? "bg-sky-400" : "bg-white/10"}`} />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── Step 1: Rep Details ── */}
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-30 }} className="grid grid-cols-2 gap-4">

            {/* Surname — locked */}
            <div className="flex flex-col gap-1">
              <label className="text-white/40 text-xs pl-1">Surname</label>
              <input
                className={glassLocked}
                value={formData.surname}
                readOnly
                tabIndex={-1}
              />
            </div>

            {/* Other Name — locked */}
            <div className="flex flex-col gap-1">
              <label className="text-white/40 text-xs pl-1">Other Name</label>
              <input
                className={glassLocked}
                value={formData.otherName}
                readOnly
                tabIndex={-1}
              />
            </div>

            {/* Phone — locked */}
            <div className="flex flex-col gap-1">
              <label className="text-white/40 text-xs pl-1">Phone</label>
              <input
                className={glassLocked}
                value={formData.phone}
                readOnly
                tabIndex={-1}
              />
            </div>

            {/* Job Role — editable */}
            <input
              className={glass}
              placeholder="Job Role *"
              name="role"
              value={formData.role}
              onChange={handleChange}
            />

            <div className="col-span-2 flex justify-end">
              <button
                onClick={nextStep}
                disabled={!isStep1Valid()}
                className="px-6 py-2 bg-sky-400 text-black rounded-xl font-medium disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Step 2: Company Details ── */}
        {step === 2 && (
          <motion.div key="s2" initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-30 }} className="grid grid-cols-2 gap-4">
            <input className={glass} placeholder="Company Name *"   name="companyName"  value={formData.companyName}  onChange={handleChange} />
            <div className="flex flex-col gap-1">
              <input className={glass} placeholder="Company Email *" name="email" type="email" value={formData.email} onChange={handleChange} />
              {formData.email && !isEmailValid(formData.email) && <span className="text-red-400 text-xs pl-1">Invalid email address</span>}
            </div>
            <input className={glass} placeholder="Company Phone *"   name="companyPhone" value={formData.companyPhone} onChange={handleChange} />
            <input className={glass} placeholder="Company Address *" name="address"      value={formData.address}      onChange={handleChange} />
            <div className="col-span-2">
              <Select options={countries} value={formData.country} onChange={(v) => setFormData((p) => ({ ...p, country: v }))} placeholder="Country *" styles={glassSelectStyles} />
            </div>
            <input className={glass} placeholder="Industry *"         name="industry" value={formData.industry} onChange={handleChange} />
            <input className={glass} placeholder="Reg No (RC-...) *"  name="regNo"    value={formData.regNo}    onChange={handleChange} />
            <div className="col-span-2 flex justify-between">
              <button onClick={() => setStep(1)} className="px-4 py-2 text-white/60 hover:text-white transition">← Back</button>
              <button onClick={nextStep} disabled={!isStep2Valid()} className="px-6 py-2 bg-sky-400 text-black rounded-xl font-medium disabled:opacity-40">Next →</button>
            </div>
          </motion.div>
        )}

        {/* ── Step 3: Staff Roles ── */}
        {step === 3 && (
          <motion.div key="s3" initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-30 }} className="space-y-4">
            <p className="text-white/50 text-sm">Add the staff roles you need:</p>
            {formData.employees.map((emp, index) => {
              const filtered = STAFF_ROLES.filter(
                (role) => role.toLowerCase().includes((emp.search || "").toLowerCase()) &&
                  !formData.employees.some((e, i) => e.name === role && i !== index)
              );
              return (
                <div key={index} className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-3">
                  {!emp.name ? (
                    <div className="space-y-1">
                      <input className={glass} placeholder="Search staff role..." value={emp.search}
                        onChange={(e) => updateEmployee(index, "search", e.target.value)}
                        autoFocus={index === formData.employees.length - 1} />
                      {emp.search && filtered.length > 0 && (
                        <div className="bg-slate-900/90 border border-white/10 rounded-lg max-h-44 overflow-y-auto">
                          {filtered.map((role) => (
                            <div key={role} onClick={() => selectRole(index, role)}
                              className="px-3 py-2 hover:bg-sky-400/20 cursor-pointer text-sm text-white/80 hover:text-white transition">{role}</div>
                          ))}
                        </div>
                      )}
                      {emp.search && filtered.length === 0 && <p className="text-white/30 text-xs pl-1">No matching roles found.</p>}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="bg-sky-400/20 text-sky-300 border border-sky-400/30 rounded-lg px-3 py-1 text-sm font-medium">{emp.name}</span>
                        <button onClick={() => clearRole(index)} className="text-white/30 hover:text-red-400 transition text-xs">✕ Change</button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/50 text-sm">How many do you need?</span>
                        <div className="flex items-center gap-3">
                          <button onClick={() => updateEmployee(index, "quantity", Math.max(1, emp.quantity - 1))}
                            className="w-8 h-8 rounded-full bg-white/10 hover:bg-sky-400/30 hover:text-sky-300 transition text-lg font-bold flex items-center justify-center">−</button>
                          <span className="w-8 text-center font-semibold text-lg">{emp.quantity}</span>
                          <button onClick={() => updateEmployee(index, "quantity", emp.quantity + 1)}
                            className="w-8 h-8 rounded-full bg-white/10 hover:bg-sky-400/30 hover:text-sky-300 transition text-lg font-bold flex items-center justify-center">+</button>
                        </div>
                      </div>
                    </div>
                  )}
                  {formData.employees.length > 1 && (
                    <button onClick={() => removeEmployee(index)} className="text-red-400/50 hover:text-red-400 transition text-xs w-full text-right">Remove this role</button>
                  )}
                </div>
              );
            })}
            <button onClick={addEmployee} className="text-sky-400 hover:text-sky-300 transition text-sm">+ Add Another Role</button>
            <label className="flex items-start gap-3 cursor-pointer mt-2">
              <input type="checkbox" name="agreed" checked={formData.agreed} onChange={handleChange} className="mt-1 accent-sky-400" />
              <span className="text-white/70 text-sm">I agree to the terms and conditions, and confirm that the information provided is accurate.</span>
            </label>
            {submitStatus === "error" && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">⚠️ {errorMessage}</div>
            )}
            <div className="flex justify-between pt-2">
              <button onClick={() => setStep(2)} disabled={submitting} className="px-4 py-2 text-white/60 hover:text-white transition disabled:opacity-40">← Back</button>
              <button onClick={handleSubmit} disabled={!isStep3Valid() || submitting}
                className="px-6 py-2 bg-sky-400 text-black rounded-xl font-medium disabled:opacity-40 flex items-center gap-2">
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

export default ClientForm1;