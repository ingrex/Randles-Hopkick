import { useState, useEffect, memo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Select from "react-select";
import countryList from "react-select-country-list";
import { apiStaffRequest } from "../api/auth";
import { useStore, buildRequestPayload } from "../store";
import { useAuth } from "../pages/AuthContext";

const glass =
  "bg-white/5 backdrop-blur-md border border-white/10 rounded-xl w-full focus:outline-none focus:ring-1 focus:ring-sky-300/40 transition text-white placeholder-white/50";

const glassLocked =
  "w-full rounded-xl bg-white/5 border border-white/10 text-white/50 cursor-not-allowed select-none outline-none";

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
    minHeight: "clamp(36px, 8vw, 44px)",
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
    fontSize: "clamp(12px, 3vw, 14px)",
  }),
  singleValue: (base) => ({ ...base, color: "white", fontSize: "clamp(12px, 3vw, 14px)" }),
  input:       (base) => ({ ...base, color: "white", fontSize: "clamp(12px, 3vw, 14px)" }),
  placeholder: (base) => ({ ...base, color: "rgba(255,255,255,0.5)", fontSize: "clamp(12px, 3vw, 14px)" }),
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

const getAuthPrefill = (user) => ({
  surname:   user?.surname     || "",
  otherName: user?.otherNames  || "",
  phone:     user?.phoneNumber || "",
  email:     user?.email       || "",
});

const getInitialForm = (user) => ({
  ...getAuthPrefill(user),
  nationality: null, businessLocation: "", additionalComment: "",
  employees: [{ name: "", quantity: 1, search: "" }],
  agreed: false,
});

/* ── Inline style constants matching StaffForm alignment ── */
const INPUT_STYLE = {
  width: "100%",
  minWidth: 0,
  padding: "clamp(8px,2vw,10px) clamp(12px,3vw,16px)",
  borderRadius: 12,
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "white",
  fontSize: "clamp(12px,3vw,13px)",
  outline: "none",
  transition: "all .25s ease",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const INPUT_LOCKED_STYLE = {
  ...INPUT_STYLE,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.07)",
  color: "rgba(221,238,255,0.45)",
  cursor: "not-allowed",
};

const FloatingInput = memo(({ name, value, onChange, placeholder, type = "text" }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: "relative", width: "100%", minWidth: 0 }}>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          ...INPUT_STYLE,
          paddingTop: 22,
          paddingBottom: 8,
          border: focused
            ? "1px solid rgba(56,189,248,0.6)"
            : "1px solid rgba(255,255,255,0.12)",
          background: focused
            ? "rgba(14,165,233,0.12)"
            : "rgba(255,255,255,0.07)",
          boxShadow: focused ? "0 0 0 3px rgba(14,165,233,0.15)" : "none",
        }}
      />
      <label
        style={{
          position: "absolute",
          left: 14,
          pointerEvents: "none",
          transition: "top 0.15s ease, font-size 0.15s ease, color 0.15s ease",
          top: value || focused ? 5 : "50%",
          transform: value || focused ? "none" : "translateY(-50%)",
          fontSize: value || focused ? 10 : 13,
          lineHeight: 1,
          color: focused ? "#7dd3fc" : "rgba(148,163,184,0.8)",
        }}
      >
        {placeholder}
      </label>
    </div>
  );
});

const LockedInput = ({ value, placeholder }) => (
  <div style={{ position: "relative", width: "100%", minWidth: 0 }}>
    <input
      value={value}
      readOnly
      tabIndex={-1}
      style={{
        ...INPUT_LOCKED_STYLE,
        paddingTop: 22,
        paddingBottom: 8,
      }}
    />
    <label
      style={{
        position: "absolute",
        left: 14,
        top: 5,
        pointerEvents: "none",
        fontSize: 10,
        lineHeight: 1,
        color: "rgba(148,163,184,0.6)",
      }}
    >
      {placeholder}
    </label>
  </div>
);

export function PrivateForm({ onSubmit }) {
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
          email:     base.email,
        };
      }
      return base;
    } catch {
      return getInitialForm(user);
    }
  });

  useEffect(() => {
    if (!user) return;
    setFormData((prev) => ({
      ...prev,
      surname:   user.surname     || "",
      otherName: user.otherNames  || "",
      phone:     user.phoneNumber || "",
      email:     user.email       || "",
    }));
  }, [user?.surname, user?.otherNames, user?.phoneNumber, user?.email]);

  useEffect(() => { setCountries(countryList().getData()); }, []);
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(formData)); }, [formData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const isStep1Valid = () =>
    formData.surname.trim() &&
    formData.email.trim() &&
    formData.phone.trim() &&
    formData.businessLocation.trim();

  const isStep2Valid = () =>
    formData.nationality &&
    formData.employees.some((e) => e.name.trim()) &&
    formData.agreed;

  const progress = step === 1
    ? Math.floor(
        [formData.surname, formData.email, formData.phone, formData.businessLocation]
          .filter(Boolean).length / 4 * 100
      )
    : isStep2Valid() ? 100 : 60;

  const updateEmployee = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      employees: prev.employees.map((emp, i) =>
        i === index ? { ...emp, [field]: value } : emp
      ),
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
      return {
        ...prev,
        employees: updated.length ? updated : [{ name: "", quantity: 1, search: "" }],
      };
    });
  };

  const addEmployee = () => {
    const last = formData.employees[formData.employees.length - 1];
    if (!last.name) return;
    setFormData((prev) => ({
      ...prev,
      employees: [...prev.employees, { name: "", quantity: 1, search: "" }],
    }));
  };

  const buildPayload = () => ({
    clientType: "Private",
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

  if (submitStatus === "success") {
    return (
      <div className="w-full p-8 text-white rounded-xl bg-white/10 backdrop-blur-xl border border-white/10 shadow-lg flex flex-col items-center gap-4 text-center">
        <div className="text-5xl">✅</div>
        <h3 className="text-2xl font-semibold">Request Submitted!</h3>
        <p className="text-white/60">Your staff request has been received. We'll be in touch shortly.</p>
        <div className="flex gap-3 mt-2">
          <button
            onClick={() => { setFormData(getInitialForm(user)); setStep(1); setSubmitStatus(null); }}
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

  return (
    <div
      className="w-full text-white rounded-xl bg-white/10 backdrop-blur-xl border border-white/10 shadow-lg"
      style={{
        maxHeight: "85vh",
        overflowY: "auto",
        padding: "clamp(16px,4vw,24px) clamp(16px,5vw,32px)",
      }}
    >
      <h2
        style={{
          fontSize: "clamp(18px,5vw,24px)",
          fontWeight: 600,
          marginBottom: "clamp(6px,2vw,8px)",
        }}
      >
        Request Staff
      </h2>

      {/* Step indicators */}
      <div
        style={{
          display: "flex",
          gap: "clamp(6px,2vw,8px)",
          marginBottom: "clamp(10px,3vw,16px)",
        }}
      >
        {steps.map((label, i) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "clamp(4px,1.5vw,8px)", flex: 1 }}>
            <div
              style={{
                width: "clamp(24px,6vw,28px)",
                height: "clamp(24px,6vw,28px)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "clamp(10px,2.5vw,13px)",
                fontWeight: 700,
                flexShrink: 0,
                transition: "all 0.3s",
                background:
                  step > i + 1
                    ? "#38bdf8"
                    : step === i + 1
                    ? "rgba(56,189,248,0.2)"
                    : "rgba(255,255,255,0.1)",
                border:
                  step === i + 1
                    ? "1px solid rgba(56,189,248,0.7)"
                    : "1px solid transparent",
                color:
                  step > i + 1
                    ? "black"
                    : step === i + 1
                    ? "#7dd3fc"
                    : "rgba(255,255,255,0.3)",
              }}
            >
              {step > i + 1 ? "✓" : i + 1}
            </div>
            <span
              style={{
                fontSize: "clamp(9px,2.2vw,11px)",
                color: step === i + 1 ? "#7dd3fc" : "rgba(255,255,255,0.3)",
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </span>
            {i < steps.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: step > i + 1 ? "#38bdf8" : "rgba(255,255,255,0.1)",
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: "clamp(4px,1vw,6px)",
          background: "rgba(255,255,255,0.1)",
          borderRadius: 99,
          overflow: "hidden",
          marginBottom: "clamp(16px,4vw,24px)",
        }}
      >
        <div
          style={{
            height: "100%",
            background: "linear-gradient(90deg,#0369a1,#38bdf8,#7dd3fc)",
            borderRadius: 99,
            transition: "width 0.5s ease",
            width: `${progress}%`,
            boxShadow: "0 0 10px rgba(56,189,248,0.4)",
          }}
        />
      </div>

      <AnimatePresence mode="wait">
        {/* ── Step 1 — Personal Info ── */}
        {step === 1 && (
          <motion.div
            key="s1"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "clamp(8px,2.5vw,12px)",
                marginBottom: "clamp(8px,2.5vw,12px)",
              }}
            >
              <LockedInput value={formData.surname}   placeholder="Surname" />
              <LockedInput value={formData.otherName} placeholder="Other Name" />
              <LockedInput value={formData.email}     placeholder="Email Address" />
              <LockedInput value={formData.phone}     placeholder="Phone Number" />
              <div style={{ gridColumn: "1 / -1" }}>
                <FloatingInput
                  name="businessLocation"
                  value={formData.businessLocation}
                  onChange={handleChange}
                  placeholder="Business / Home Location *"
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "clamp(8px,2vw,12px)" }}>
              <button
                onClick={() => setStep(2)}
                disabled={!isStep1Valid()}
                style={{
                  padding: "clamp(8px,2vw,10px) clamp(18px,4vw,24px)",
                  background: isStep1Valid() ? "linear-gradient(135deg,#0369a1,#38bdf8)" : "rgba(56,189,248,0.2)",
                  color: isStep1Valid() ? "white" : "rgba(255,255,255,0.3)",
                  border: "none",
                  borderRadius: 12,
                  fontSize: "clamp(12px,3vw,14px)",
                  fontWeight: 600,
                  cursor: isStep1Valid() ? "pointer" : "not-allowed",
                  transition: "all 0.25s ease",
                }}
              >
                Next →
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Step 2 — Staff Request ── */}
        {step === 2 && (
          <motion.div
            key="s2"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "clamp(10px,3vw,16px)" }}>
              {/* Country */}
              <Select
                options={countries}
                value={formData.nationality}
                onChange={(v) => setFormData((p) => ({ ...p, nationality: v }))}
                placeholder="Country *"
                styles={glassSelectStyles}
              />

              <p
                style={{
                  color: "rgba(255,255,255,0.5)",
                  fontSize: "clamp(11px,2.5vw,13px)",
                  margin: 0,
                }}
              >
                Add the staff roles you need:
              </p>

              {formData.employees.map((emp, index) => {
                const filtered = STAFF_ROLES.filter(
                  (role) =>
                    role.toLowerCase().includes((emp.search || "").toLowerCase()) &&
                    !formData.employees.some((e, i) => e.name === role && i !== index)
                );
                return (
                  <div
                    key={index}
                    style={{
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(255,255,255,0.04)",
                      padding: "clamp(10px,3vw,14px)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "clamp(8px,2vw,12px)",
                    }}
                  >
                    {!emp.name ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <input
                          style={{
                            ...INPUT_STYLE,
                            background: "rgba(255,255,255,0.07)",
                          }}
                          placeholder="Search staff role..."
                          value={emp.search}
                          onChange={(e) => updateEmployee(index, "search", e.target.value)}
                          autoFocus={index === formData.employees.length - 1}
                        />
                        {emp.search && filtered.length > 0 && (
                          <div
                            style={{
                              background: "rgba(13,20,52,0.95)",
                              border: "1px solid rgba(255,255,255,0.1)",
                              borderRadius: 8,
                              maxHeight: "clamp(120px,30vw,176px)",
                              overflowY: "auto",
                            }}
                          >
                            {filtered.map((role) => (
                              <div
                                key={role}
                                onClick={() => selectRole(index, role)}
                                style={{
                                  padding: "clamp(8px,2vw,10px) clamp(10px,2.5vw,12px)",
                                  cursor: "pointer",
                                  fontSize: "clamp(11px,2.8vw,13px)",
                                  color: "rgba(255,255,255,0.8)",
                                  transition: "background 0.15s",
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = "rgba(56,189,248,0.15)"}
                                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                              >
                                {role}
                              </div>
                            ))}
                          </div>
                        )}
                        {emp.search && filtered.length === 0 && (
                          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "clamp(10px,2.5vw,12px)", paddingLeft: 4 }}>
                            No matching roles found.
                          </p>
                        )}
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "clamp(8px,2vw,12px)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span
                            style={{
                              background: "rgba(56,189,248,0.15)",
                              color: "#7dd3fc",
                              border: "1px solid rgba(56,189,248,0.25)",
                              borderRadius: 8,
                              padding: "clamp(4px,1vw,6px) clamp(10px,2.5vw,14px)",
                              fontSize: "clamp(11px,2.8vw,13px)",
                              fontWeight: 500,
                            }}
                          >
                            {emp.name}
                          </span>
                          <button
                            onClick={() => clearRole(index)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "rgba(255,255,255,0.3)",
                              cursor: "pointer",
                              fontSize: "clamp(10px,2.5vw,12px)",
                              transition: "color 0.2s",
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
                            onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.3)"}
                          >
                            ✕ Change
                          </button>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "clamp(11px,2.8vw,13px)" }}>
                            How many do you need?
                          </span>
                          <div style={{ display: "flex", alignItems: "center", gap: "clamp(8px,2vw,12px)" }}>
                            <button
                              onClick={() => updateEmployee(index, "quantity", Math.max(1, emp.quantity - 1))}
                              style={{
                                width: "clamp(28px,7vw,32px)",
                                height: "clamp(28px,7vw,32px)",
                                borderRadius: "50%",
                                background: "rgba(255,255,255,0.08)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                color: "white",
                                fontSize: "clamp(14px,3.5vw,18px)",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.2s",
                              }}
                            >−</button>
                            <span style={{ width: "clamp(20px,5vw,28px)", textAlign: "center", fontWeight: 600, fontSize: "clamp(14px,3.5vw,18px)" }}>
                              {emp.quantity}
                            </span>
                            <button
                              onClick={() => updateEmployee(index, "quantity", emp.quantity + 1)}
                              style={{
                                width: "clamp(28px,7vw,32px)",
                                height: "clamp(28px,7vw,32px)",
                                borderRadius: "50%",
                                background: "rgba(255,255,255,0.08)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                color: "white",
                                fontSize: "clamp(14px,3.5vw,18px)",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.2s",
                              }}
                            >+</button>
                          </div>
                        </div>
                      </div>
                    )}
                    {formData.employees.length > 1 && (
                      <button
                        onClick={() => removeEmployee(index)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "rgba(248,113,113,0.5)",
                          cursor: "pointer",
                          fontSize: "clamp(10px,2.5vw,12px)",
                          textAlign: "right",
                          transition: "color 0.2s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
                        onMouseLeave={e => e.currentTarget.style.color = "rgba(248,113,113,0.5)"}
                      >
                        Remove this role
                      </button>
                    )}
                  </div>
                );
              })}

              <button
                onClick={addEmployee}
                style={{
                  background: "none",
                  border: "none",
                  color: "#38bdf8",
                  cursor: "pointer",
                  fontSize: "clamp(12px,3vw,13px)",
                  textAlign: "left",
                  padding: 0,
                  transition: "color 0.2s",
                }}
                onMouseEnter={e => e.currentTarget.style.color = "#7dd3fc"}
                onMouseLeave={e => e.currentTarget.style.color = "#38bdf8"}
              >
                + Add Another Role
              </button>

              {/* Additional Comment */}
              <textarea
                name="additionalComment"
                value={formData.additionalComment}
                onChange={handleChange}
                rows={3}
                placeholder="Additional comments (optional)"
                style={{
                  ...INPUT_STYLE,
                  resize: "none",
                  padding: "clamp(10px,2.5vw,12px) clamp(12px,3vw,16px)",
                }}
              />

              {/* Agreement */}
              <label style={{ display: "flex", alignItems: "flex-start", gap: "clamp(8px,2vw,12px)", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  name="agreed"
                  checked={formData.agreed}
                  onChange={handleChange}
                  style={{ marginTop: 2, accentColor: "#38bdf8", flexShrink: 0 }}
                />
                <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "clamp(11px,2.8vw,13px)", lineHeight: 1.6 }}>
                  I agree to the terms and conditions, and confirm that the information provided is accurate.
                </span>
              </label>

              {submitStatus === "error" && (
                <div
                  style={{
                    background: "rgba(248,113,113,0.08)",
                    border: "1px solid rgba(248,113,113,0.3)",
                    borderRadius: 12,
                    padding: "clamp(10px,2.5vw,12px) clamp(12px,3vw,16px)",
                    color: "#f87171",
                    fontSize: "clamp(11px,2.8vw,13px)",
                  }}
                >
                  ⚠️ {errorMessage}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "clamp(4px,1.5vw,8px)" }}>
                <button
                  onClick={() => setStep(1)}
                  disabled={submitting}
                  style={{
                    background: "none",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 12,
                    color: "rgba(255,255,255,0.6)",
                    cursor: "pointer",
                    fontSize: "clamp(12px,3vw,13px)",
                    padding: "clamp(8px,2vw,10px) clamp(14px,3.5vw,20px)",
                    transition: "all 0.25s",
                    opacity: submitting ? 0.4 : 1,
                  }}
                >
                  ← Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!isStep2Valid() || submitting}
                  style={{
                    padding: "clamp(8px,2vw,10px) clamp(18px,4vw,24px)",
                    background: isStep2Valid() && !submitting
                      ? "linear-gradient(135deg,#0369a1,#38bdf8)"
                      : "rgba(56,189,248,0.2)",
                    color: isStep2Valid() && !submitting ? "white" : "rgba(255,255,255,0.3)",
                    border: "none",
                    borderRadius: 12,
                    fontSize: "clamp(12px,3vw,14px)",
                    fontWeight: 600,
                    cursor: isStep2Valid() && !submitting ? "pointer" : "not-allowed",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    transition: "all 0.25s",
                  }}
                >
                  {submitting ? (
                    <>
                      <span
                        style={{
                          display: "inline-block",
                          width: "clamp(12px,3vw,16px)",
                          height: "clamp(12px,3vw,16px)",
                          border: "2px solid rgba(255,255,255,0.25)",
                          borderTopColor: "white",
                          borderRadius: "50%",
                          animation: "spin .75s linear infinite",
                        }}
                      />
                      Submitting...
                    </>
                  ) : (
                    "Submit Request"
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default PrivateForm;