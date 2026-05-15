import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiStaffRequest } from "../api/auth";
import { useAuth } from "../pages/AuthContext";

/* ─── date option arrays ─────────────────────────────────────── */
const DAYS   = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));
const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];
const YEARS  = Array.from({ length: 70 }, (_, i) => String(2006 - i));

/* ─── keyframes + mobile styles ─────────────────────────────── */
const KEYFRAMES = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Outfit:wght@300;400;500;600&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

@keyframes fadeUp   { from { opacity:0; transform:translateY(26px)  } to { opacity:1; transform:translateY(0) } }
@keyframes fadeDown { from { opacity:0; transform:translateY(-26px) } to { opacity:1; transform:translateY(0) } }
@keyframes popIn    { from { opacity:0; transform:scale(.84) translateY(16px) } to { opacity:1; transform:scale(1) translateY(0) } }
@keyframes shimmer  { 0%  { background-position:200% center } 100% { background-position:-200% center } }
@keyframes pulse    { 0%,100% { box-shadow:0 0 0 0 rgba(14,165,233,.45) } 50% { box-shadow:0 0 0 10px rgba(14,165,233,0) } }
@keyframes spin     { to  { transform:rotate(360deg) } }
@keyframes checkDraw{ from{ stroke-dashoffset:40 } to { stroke-dashoffset:0 } }
@keyframes cardIn   { from{ opacity:0; transform:translateY(32px) scale(.97) } to { opacity:1; transform:translateY(0) scale(1) } }
@keyframes errShake { 0%,100%{ transform:translateX(0) } 20%,60%{ transform:translateX(-5px) } 40%,80%{ transform:translateX(5px) } }

input::placeholder  { color: rgba(170,205,240,.42); }
textarea::placeholder { color: rgba(170,205,240,.42); }
select option       { background: #0d1e35; color: #ddeeff; }

@media (max-width: 600px) {
  .fg  { grid-template-columns: 1fr !important; }
  .ff  { grid-column: 1 !important; }
  .dob-grid { grid-template-columns: 1fr !important; }
  .sf-inner { padding: 8px 14px 24px !important; }
  .step-lbl { font-size: 8px !important; white-space: normal !important; text-align: center; max-width: 52px; }
  .sf-title { font-size: 20px !important; }
  .sf-nav { flex-direction: column !important; }
  .sf-nav button { width: 100% !important; flex: none !important; }
  input, select, textarea { min-width: 0 !important; max-width: 100% !important; font-size: 14px !important; }
  .step-circle { width: 26px !important; height: 26px !important; font-size: 10px !important; }
  .gender-btn { font-size: 12px !important; padding: 10px 4px !important; }
}

@media (max-width: 380px) {
  .sf-inner { padding: 6px 10px 20px !important; }
  .sf-title { font-size: 18px !important; }
}
`;

/* ─── design tokens ──────────────────────────────────────────── */
const FONT  = "'Outfit', sans-serif";
const SERIF = "'Cormorant Garamond', serif";
const SKY   = { 300:"#7dd3fc", 400:"#38bdf8", 500:"#0ea5e9", 600:"#0284c7", 700:"#0369a1", 800:"#075985" };

const BASE = {
  width:"100%", minWidth:0,
  fontFamily:FONT, fontSize:13, fontWeight:400,
  color:"#ddeeff", borderRadius:20, outline:"none", transition:"all .28s ease",
};

const mkInput  = (extra={}) => ({ ...BASE, background:"rgba(255,255,255,.14)", border:"1.5px solid rgba(255,255,255,.28)", padding:"10px 16px", ...extra });
const mkFocus  = (extra={}) => ({ ...mkInput(extra), background:"rgba(14,165,233,.16)", border:`1.5px solid ${SKY[400]}bb`, boxShadow:"0 0 0 3px rgba(14,165,233,.18)" });
const mkErr    = (extra={}) => ({ ...mkInput(extra), background:"rgba(248,113,113,.1)", border:"1.5px solid rgba(248,113,113,.6)", animation:"errShake .3s ease" });
const mkLocked = (extra={}) => ({ ...BASE, background:"rgba(255,255,255,.05)", border:"1.5px solid rgba(255,255,255,.1)", padding:"10px 16px", color:"rgba(221,238,255,.45)", cursor:"not-allowed", ...extra });

const SEL_EXTRA = { padding:"10px 38px 10px 16px", appearance:"none", cursor:"pointer" };
const iRest = mkInput(); const iFocus = mkFocus(); const iErr = mkErr();
const sRest = mkInput(SEL_EXTRA); const sFocus = mkFocus(SEL_EXTRA); const sErr = mkErr(SEL_EXTRA);
const tRest = mkInput({ resize:"none" }); const tFocus = mkFocus({ resize:"none" }); const tErr = mkErr({ resize:"none" });

const LBL_ST = { display:"block", fontSize:10, fontWeight:600, textTransform:"uppercase", letterSpacing:".14em", color:"rgba(195,222,255,.78)", marginBottom:6, fontFamily:FONT };
const ERR_ST = { display:"block", fontSize:11, color:"rgba(252,165,165,.95)", marginTop:4, fontFamily:FONT, animation:"fadeUp .22s ease" };
const LOCKED_LABEL_ST = { ...LBL_ST, color:"rgba(195,222,255,.38)" };

/* ─── validation ─────────────────────────────────────────────── */
const isReq = (v) => (typeof v === "boolean" ? v : String(v || "").trim() !== "");

const INIT = {
  surname:"", otherName:"", email:"", phone:"", nationality:"", address:"",
  maritalStatus:"", language:"", dobDay:"", dobMonth:"", dobYear:"", gender:"",
  primarySkill:"", yearsExp:"", additionalSkills:"", bio:"", qualification:"", agreed:false,
};

const S1 = ["surname","otherName","email","phone","nationality","address"];
const S2 = ["maritalStatus","language","dobDay","dobMonth","dobYear","gender"];
const S3 = ["primarySkill","yearsExp","additionalSkills","bio","qualification","agreed"];

function validate(form, keys) {
  const e = {};
  keys.forEach(k => { if (!isReq(form[k])) e[k] = "This field is required"; });
  if (keys.includes("email") && form.email && !/\S+@\S+\.\S+/.test(form.email))
    e.email = "Enter a valid email address";
  if (keys.includes("phone") && form.phone && !/^\+?[\d\s\-()]{7,}$/.test(form.phone))
    e.phone = "Enter a valid phone number";
  return e;
}

/* ═══════════════════════ FIELD COMPONENTS ══════════════════════ */

function InputField({ label, value, onChange, placeholder, type="text", err, req:r }) {
  const [f, setF] = useState(false);
  return (
    <div style={{ display:"flex", flexDirection:"column", minWidth:0 }}>
      <label style={LBL_ST}>{label}{r && <span style={{color:SKY[300]}}> *</span>}</label>
      <input
        style={err ? iErr : f ? iFocus : iRest}
        type={type} placeholder={placeholder} value={value} onChange={onChange}
        onFocus={()=>setF(true)} onBlur={()=>setF(false)}
      />
      {err && <span style={ERR_ST}>{err}</span>}
    </div>
  );
}

/* Read-only locked field — visually dimmed, no interaction */
function LockedField({ label, value }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", minWidth:0 }}>
      <label style={LOCKED_LABEL_ST}>{label}</label>
      <input
        style={mkLocked()}
        value={value}
        readOnly
        tabIndex={-1}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, opts, placeholder, err, req:r }) {
  const [f, setF] = useState(false);
  return (
    <div style={{ display:"flex", flexDirection:"column", minWidth:0 }}>
      <label style={LBL_ST}>{label}{r && <span style={{color:SKY[300]}}> *</span>}</label>
      <div style={{ position:"relative", minWidth:0 }}>
        <select
          style={err ? sErr : f ? sFocus : sRest}
          value={value} onChange={onChange}
          onFocus={()=>setF(true)} onBlur={()=>setF(false)}
        >
          <option value="">{placeholder || "Select…"}</option>
          {opts.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <span style={{ position:"absolute", right:13, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", color:"rgba(180,215,255,.5)", fontSize:11 }}>▾</span>
      </div>
      {err && <span style={ERR_ST}>{err}</span>}
    </div>
  );
}

function DOBSelect({ value, onChange, placeholder, opts, hasErr }) {
  const [f, setF] = useState(false);
  return (
    <div style={{ position:"relative", minWidth:0 }}>
      <select
        style={hasErr ? sErr : f ? sFocus : sRest}
        value={value} onChange={onChange}
        onFocus={()=>setF(true)} onBlur={()=>setF(false)}
      >
        <option value="">{placeholder}</option>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <span style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", color:"rgba(180,215,255,.5)", fontSize:11 }}>▾</span>
    </div>
  );
}

function TextareaField({ label, value, onChange, placeholder, err, req:r, rows=4 }) {
  const [f, setF] = useState(false);
  return (
    <div style={{ display:"flex", flexDirection:"column", minWidth:0 }}>
      <label style={LBL_ST}>{label}{r && <span style={{color:SKY[300]}}> *</span>}</label>
      <textarea
        style={err ? tErr : f ? tFocus : tRest}
        rows={rows} placeholder={placeholder} value={value} onChange={onChange}
        onFocus={()=>setF(true)} onBlur={()=>setF(false)}
      />
      {err && <span style={ERR_ST}>{err}</span>}
    </div>
  );
}

function GenderToggle({ value, onChange, err }) {
  return (
    <div style={{ display:"flex", flexDirection:"column" }}>
      <label style={LBL_ST}>Gender<span style={{color:SKY[300]}}> *</span></label>
      <div style={{ display:"flex", gap:10 }}>
        {["Male","Female"].map(g => <GenderBtn key={g} label={g} active={value===g} onClick={()=>onChange(g)} />)}
      </div>
      {err && <span style={ERR_ST}>{err}</span>}
    </div>
  );
}

function GenderBtn({ label, active, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button" onClick={onClick}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      className="gender-btn"
      style={{
        flex:1, padding:"11px 8px", borderRadius:20, fontFamily:FONT,
        fontSize:13, fontWeight:500, cursor:"pointer", transition:"all .28s ease",
        border: active ? `1.5px solid ${SKY[400]}bb` : hov ? "1.5px solid rgba(255,255,255,.38)" : "1.5px solid rgba(255,255,255,.22)",
        background: active ? `linear-gradient(135deg,rgba(14,165,233,.32),rgba(56,189,248,.14))` : hov ? "rgba(255,255,255,.16)" : "rgba(255,255,255,.1)",
        color: active ? SKY[300] : hov ? "#fff" : "rgba(200,225,255,.65)",
        boxShadow: active ? "0 0 12px rgba(14,165,233,.22)" : "none",
      }}
    >{label}</button>
  );
}

/* ═══════════════════════ PROGRESS BAR ═════════════════════════ */
const STEP_LABELS = ["Personal Info", "More Details", "Professional"];

function Progress({ step, pct }) {
  return (
    <div style={{ marginBottom:24 }}>
      <div style={{ display:"flex", alignItems:"center", marginBottom:16 }}>
        {STEP_LABELS.map((lbl, i) => {
          const s = i + 1;
          const done   = s < step;
          const active = s === step;
          return (
            <div key={s} style={{ display:"flex", alignItems:"center", flex: i < 2 ? 1 : "none" }}>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
                <div
                  className="step-circle"
                  style={{
                    width:32, height:32, borderRadius:"50%",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontFamily:FONT, fontSize:12, fontWeight:600, transition:"all .4s ease",
                    background: done ? `linear-gradient(135deg,${SKY[700]},${SKY[400]})` : active ? `linear-gradient(135deg,${SKY[500]},${SKY[300]})` : "rgba(255,255,255,.1)",
                    border: active ? `2px solid ${SKY[300]}aa` : done ? "2px solid transparent" : "2px solid rgba(255,255,255,.2)",
                    color: done||active ? "#fff" : "rgba(180,215,255,.5)",
                    boxShadow: active ? `0 0 16px rgba(14,165,233,.45)` : "none",
                    flexShrink:0,
                  }}
                >
                  {done ? (
                    <svg width="13" height="11" viewBox="0 0 13 11" fill="none">
                      <path d="M1.5 5.5L5 9L11.5 2" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : s}
                </div>
                <span className="step-lbl" style={{
                  fontSize:9, fontWeight:600, textTransform:"uppercase", letterSpacing:".1em",
                  fontFamily:FONT, whiteSpace:"nowrap",
                  color: active ? `${SKY[300]}ee` : done ? `${SKY[300]}88` : "rgba(180,215,255,.35)",
                  transition:"color .4s ease",
                }}>{lbl}</span>
              </div>
              {i < 2 && (
                <div style={{
                  flex:1, height:2, borderRadius:99, margin:"0 8px 18px",
                  background: step > s ? `linear-gradient(90deg,${SKY[700]},${SKY[400]})` : "rgba(255,255,255,.1)",
                  transition:"background .5s ease",
                  boxShadow: step > s ? "0 0 8px rgba(14,165,233,.3)" : "none",
                }}/>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:6 }}>
        <span style={{
          fontSize:11, fontWeight:600, fontFamily:FONT,
          background:"linear-gradient(90deg,#7dd3fc,#38bdf8,#bae6fd)",
          backgroundSize:"200% auto", animation:"shimmer 3s linear infinite",
          WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
        }}>{pct}% complete</span>
      </div>
      <div style={{ height:5, borderRadius:99, background:"rgba(255,255,255,.1)", overflow:"hidden", position:"relative" }}>
        <div style={{
          position:"absolute", inset:"0 auto 0 0", width:`${pct}%`,
          background:`linear-gradient(90deg,${SKY[800]},${SKY[500]},${SKY[300]})`,
          borderRadius:99, transition:"width .7s cubic-bezier(.4,0,.2,1)",
          boxShadow:"0 0 14px rgba(14,165,233,.5)",
        }}/>
      </div>
    </div>
  );
}

/* ═══════════════════════ BUTTONS ═══════════════════════════════ */
function PrimaryBtn({ children, onClick, disabled }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick} disabled={disabled}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        flex:1, padding:"13px 24px", borderRadius:20, border:"none",
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily:FONT, fontSize:14, fontWeight:600, color:"#fff",
        transition:"all .3s ease",
        background: disabled ? "rgba(14,165,233,.2)" : `linear-gradient(135deg,${SKY[700]},${SKY[500]},${SKY[400]})`,
        boxShadow: disabled ? "none" : hov ? "0 14px 44px rgba(14,165,233,.5)" : "0 6px 26px rgba(14,165,233,.28)",
        transform: disabled ? "none" : hov ? "translateY(-2px)" : "translateY(0)",
        opacity: disabled ? 0.5 : 1,
        display:"flex", alignItems:"center", justifyContent:"center", gap:10,
      }}
    >{children}</button>
  );
}

function SecondaryBtn({ children, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        padding:"12px 22px", borderRadius:20,
        border: `1.5px solid ${hov ? "rgba(255,255,255,.36)" : "rgba(255,255,255,.2)"}`,
        cursor:"pointer", fontFamily:FONT, fontSize:13, fontWeight:400,
        color: hov ? "#fff" : "rgba(190,220,255,.7)",
        background: hov ? "rgba(255,255,255,.14)" : "rgba(255,255,255,.07)",
        transition:"all .28s ease", whiteSpace:"nowrap",
      }}
    >{children}</button>
  );
}

/* ═══════════════════════ SUCCESS MODAL ════════════════════════ */
function SuccessModal({ onDashboard, onHome }) {
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:100,
      display:"flex", alignItems:"center", justifyContent:"center",
      background:"rgba(0,0,0,.72)", backdropFilter:"blur(14px)", padding:20,
    }}>
      <div style={{
        background:"rgba(6,18,40,.93)",
        border:"1.5px solid rgba(14,165,233,.28)",
        borderRadius:28, padding:"48px 40px",
        maxWidth:420, width:"100%", textAlign:"center",
        backdropFilter:"blur(36px)",
        boxShadow:"0 40px 100px rgba(0,0,0,.65), inset 0 1px 0 rgba(14,165,233,.14)",
        animation:"popIn .5s cubic-bezier(.34,1.56,.64,1)",
      }}>
        <div style={{
          width:82, height:82, borderRadius:"50%", margin:"0 auto 22px",
          background:`linear-gradient(135deg,${SKY[800]},${SKY[500]})`,
          display:"flex", alignItems:"center", justifyContent:"center",
          animation:"pulse 2s ease infinite",
          boxShadow:"0 0 36px rgba(14,165,233,.44)",
        }}>
          <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
            <path d="M8 20L15 27L30 12" stroke="#fff" strokeWidth="3.5"
              strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray="40" strokeDashoffset="40"
              style={{ animation:"checkDraw .7s .3s ease forwards" }}/>
          </svg>
        </div>
        <h2 style={{ fontFamily:SERIF, fontSize:30, fontWeight:700, color:"#e8f0fe", letterSpacing:"-.02em", marginBottom:10 }}>
          Application Received!
        </h2>
        <p style={{ fontSize:13, color:"rgba(175,210,245,.58)", lineHeight:1.75, fontFamily:FONT, fontWeight:300, marginBottom:30 }}>
          Your details have been submitted successfully. Our team at Randle &amp; Hopkins will review your application and be in touch shortly.
        </p>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <PrimaryBtn onClick={onDashboard}>Go to Dashboard →</PrimaryBtn>
          <SecondaryBtn onClick={onHome}>Back to Home</SecondaryBtn>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════ OPTION LISTS ══════════════════════════ */
const NATIONALITY_OPTIONS = [
  { label:"Nigerian", value:"Nigerian" }, { label:"Ghanaian", value:"Ghanaian" },
  { label:"Kenyan", value:"Kenyan" }, { label:"South African", value:"South African" },
  { label:"Ethiopian", value:"Ethiopian" }, { label:"Cameroonian", value:"Cameroonian" },
  { label:"Ugandan", value:"Ugandan" }, { label:"Tanzanian", value:"Tanzanian" },
  { label:"British", value:"British" }, { label:"American", value:"American" },
  { label:"Canadian", value:"Canadian" }, { label:"French", value:"French" },
  { label:"Other", value:"Other" },
];

const PRIMARY_SKILL_OPTIONS = [
  "Driver","Nurse","Teacher","Accountant","IT Technician","Farmer",
  "Journalist","Lawyer","Engineer","Chef","Security Guard","Cleaner",
  "Tailor","Electrician","Plumber","Other",
];

const QUALIFICATION_OPTIONS = [
  { label:"SSCE / O-Level", value:"SSCE" }, { label:"OND", value:"OND" },
  { label:"HND", value:"HND" }, { label:"B.Sc / B.A", value:"B.Sc" },
  { label:"M.Sc / MBA", value:"M.Sc" }, { label:"PhD / Doctorate", value:"PhD" },
  { label:"Vocational / Trade Cert.", value:"Vocational" },
  { label:"Professional Certification", value:"Professional Certification" },
  { label:"No Formal Education", value:"No Formal Education" },
];

/* ═══════════════════════ MAIN COMPONENT ═══════════════════════ */
export function StaffForm() {
  const navigate    = useNavigate();
  const { user }    = useAuth();

  const [step,    setStep]    = useState(1);
  const [form,    setForm]    = useState(INIT);
  const [errs,    setErrs]    = useState({});
  const [animDir, setAnimDir] = useState("fwd");
  const [animKey, setAnimKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);

  // Sync locked fields when user loads asynchronously
  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      surname:   user.surname     || "",
      otherName: user.otherNames  || "",
      email:     user.email       || "",
      phone:     user.phoneNumber || "",
    }));
  }, [user?.surname, user?.otherNames, user?.email, user?.phoneNumber]);

  const set = k => e =>
    setForm(f => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const allKeys = [...S1,...S2,...S3];
  const pct = Math.round(allKeys.filter(k => isReq(form[k])).length / allKeys.length * 100);

  const transition = (next, dir) => {
    setAnimDir(dir);
    setAnimKey(k => k + 1);
    setStep(next);
    window.scrollTo({ top:0, behavior:"smooth" });
  };

  const goNext = async () => {
    // Exclude locked fields from validation — they're always filled from auth
    const lockedKeys = ["surname","otherName","email","phone"];
    const keys = (step === 1 ? S1 : step === 2 ? S2 : S3).filter(k => !lockedKeys.includes(k));
    const e = validate(form, keys);
    if (Object.keys(e).length) { setErrs(e); return; }
    setErrs({});

    if (step < 3) { transition(step + 1, "fwd"); return; }

    setLoading(true);
    try {
      const monthIndex = String(MONTHS.indexOf(form.dobMonth) + 1).padStart(2, "0");
      const isoDate    = `${form.dobYear}-${monthIndex}-${form.dobDay}`;

      const yoeMap = {
        "Less than 1 year": 0, "1 – 2 years": 1,
        "3 – 5 years": 3, "6 – 10 years": 6, "10+ years": 10,
      };

      const payload = {
        surname:                  form.surname,
        otherNames:               form.otherName,
        email:                    form.email,
        phoneNumber:              form.phone,
        nationality:              form.nationality,
        homeAddress:              form.address,
        maritalStatus:            form.maritalStatus,
        languageSkill:            form.language,
        dateOfBirth:              isoDate,
        gender:                   form.gender,
        primarySkills:            form.primarySkill,
        yearsOfExperience:        yoeMap[form.yearsExp] ?? 0,
        additionalSkills:         form.additionalSkills,
        bio:                      form.bio,
        educationalQualification: form.qualification,
        agreedToPolicy:           form.agreed,
      };

      await apiStaffRequest(payload);
      localStorage.removeItem("staffRequestDraft");
      setDone(true);
    } catch (err) {
      console.error("Staff request error:", err.message);
      alert(err.message || "Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => { setErrs({}); transition(step - 1, "back"); };

  const stepAnim = animDir === "fwd"
    ? { animation:"fadeUp .38s cubic-bezier(.4,0,.2,1) both" }
    : { animation:"fadeDown .38s cubic-bezier(.4,0,.2,1) both" };

  const STEP_META = [
    { title:"Personal Information",  sub:"Tell us who you are — all fields are required."   },
    { title:"Additional Details",    sub:"A few more things to complete your profile."       },
    { title:"Professional Details",  sub:"Your skills and qualifications help us match you." },
  ];

  return (
    <div style={{
      width:"100%", maxHeight:"85vh", overflowY:"auto", overflowX:"hidden",
      borderRadius:20,
      background:"rgba(255,255,255,0.08)",
      backdropFilter:"blur(28px) saturate(130%)",
      WebkitBackdropFilter:"blur(28px) saturate(130%)",
      border:"1px solid rgba(255,255,255,0.12)",
      boxShadow:"0 8px 32px rgba(0,0,0,0.3)",
      position:"relative",
    }}>
      <style>{KEYFRAMES}</style>

      <div style={{ height:2, background:`linear-gradient(90deg,transparent,${SKY[500]}cc,${SKY[400]}88,transparent)` }}/>
      <div style={{ height:48 }} aria-hidden="true" />

      <div className="sf-inner" style={{ padding:"4px 40px 40px", fontFamily:FONT }}>

        {/* brand header */}
        <div style={{ marginBottom:24 }}>
          <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:8 }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:`linear-gradient(135deg,${SKY[500]},${SKY[300]})`, boxShadow:`0 0 8px ${SKY[500]}88` }}/>
            <span style={{ fontSize:10, fontWeight:600, letterSpacing:".22em", textTransform:"uppercase", color:`${SKY[400]}dd`, fontFamily:FONT }}>
              Randle &amp; Hopkins
            </span>
          </div>
          <h1 className="sf-title" style={{ fontFamily:SERIF, fontSize:32, fontWeight:700, color:"#e8f0fe", letterSpacing:"-.022em", lineHeight:1.12 }}>
            {STEP_META[step-1].title}
          </h1>
          <p style={{ fontSize:12, color:"rgba(155,200,240,.5)", marginTop:6, fontWeight:300, fontFamily:FONT }}>
            {STEP_META[step-1].sub}
          </p>
        </div>

        <Progress step={step} pct={pct}/>

        <div key={animKey} style={stepAnim}>

          {/* ── STEP 1: Personal Information ── */}
          {step===1 && (
            <div className="fg" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              {/* Locked from auth */}
              <LockedField label="Surname"       value={form.surname}   />
              <LockedField label="Other Name"    value={form.otherName} />
              <LockedField label="Email Address" value={form.email}     />
              <LockedField label="Phone Number"  value={form.phone}     />

              {/* Editable */}
              <div style={{ display:"flex", flexDirection:"column", minWidth:0 }}>
                <label style={LBL_ST}>Nationality<span style={{color:SKY[300]}}> *</span></label>
                <div style={{ position:"relative", minWidth:0 }}>
                  <select style={errs.nationality ? sErr : sRest} value={form.nationality} onChange={set("nationality")}>
                    <option value="">Select nationality</option>
                    {NATIONALITY_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <span style={{ position:"absolute", right:13, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", color:"rgba(180,215,255,.5)", fontSize:11 }}>▾</span>
                </div>
                {errs.nationality && <span style={ERR_ST}>{errs.nationality}</span>}
              </div>

              <InputField label="Home Address" value={form.address} onChange={set("address")} placeholder="City, State, Country" err={errs.address} req/>
            </div>
          )}

          {/* ── STEP 2: Additional Details ── */}
          {step===2 && (
            <div className="fg" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              <SelectField label="Marital Status" value={form.maritalStatus} onChange={set("maritalStatus")} placeholder="Select status" err={errs.maritalStatus} req
                opts={["Single","Married","Divorced","Widowed","Separated"]}/>
              <InputField label="Language Skill" value={form.language} onChange={set("language")} placeholder="e.g. English, Yoruba" err={errs.language} req/>

              <div className="ff" style={{ gridColumn:"1/-1" }}>
                <label style={LBL_ST}>Date of Birth<span style={{color:SKY[300]}}> *</span></label>
                <div className="dob-grid" style={{ display:"grid", gridTemplateColumns:"1fr 2fr 1fr", gap:10 }}>
                  <DOBSelect value={form.dobDay}   onChange={set("dobDay")}   placeholder="Day"   opts={DAYS}   hasErr={!!errs.dobDay}/>
                  <DOBSelect value={form.dobMonth} onChange={set("dobMonth")} placeholder="Month" opts={MONTHS} hasErr={!!errs.dobMonth}/>
                  <DOBSelect value={form.dobYear}  onChange={set("dobYear")}  placeholder="Year"  opts={YEARS}  hasErr={!!errs.dobYear}/>
                </div>
                {(errs.dobDay||errs.dobMonth||errs.dobYear) && (
                  <span style={ERR_ST}>Please select your complete date of birth</span>
                )}
              </div>

              <div className="ff" style={{ gridColumn:"1/-1" }}>
                <GenderToggle value={form.gender} onChange={v => setForm(f => ({...f, gender:v}))} err={errs.gender}/>
              </div>
            </div>
          )}

          {/* ── STEP 3: Professional Details ── */}
          {step===3 && (
            <div className="fg" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              <SelectField label="Primary Skill" value={form.primarySkill} onChange={set("primarySkill")} placeholder="Select skill" err={errs.primarySkill} req opts={PRIMARY_SKILL_OPTIONS}/>
              <SelectField label="Years of Experience" value={form.yearsExp} onChange={set("yearsExp")} placeholder="Select range" err={errs.yearsExp} req
                opts={["Less than 1 year","1 – 2 years","3 – 5 years","6 – 10 years","10+ years"]}/>

              <div className="ff" style={{ gridColumn:"1/-1" }}>
                <InputField label="Additional Skills" value={form.additionalSkills} onChange={set("additionalSkills")} placeholder="e.g. Driving, Cooking, Childcare" err={errs.additionalSkills} req/>
              </div>
              <div className="ff" style={{ gridColumn:"1/-1" }}>
                <TextareaField label="Bio" value={form.bio} onChange={set("bio")} rows={3}
                  placeholder="Brief description of your background and career goals…" err={errs.bio} req/>
              </div>

              <div className="ff" style={{ gridColumn:"1/-1" }}>
                <div style={{ display:"flex", flexDirection:"column", minWidth:0 }}>
                  <label style={LBL_ST}>Educational Qualification<span style={{color:SKY[300]}}> *</span></label>
                  <div style={{ position:"relative", minWidth:0 }}>
                    <select style={errs.qualification ? sErr : sRest} value={form.qualification} onChange={set("qualification")}>
                      <option value="">Select qualification</option>
                      {QUALIFICATION_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <span style={{ position:"absolute", right:13, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", color:"rgba(180,215,255,.5)", fontSize:11 }}>▾</span>
                  </div>
                  {errs.qualification && <span style={ERR_ST}>{errs.qualification}</span>}
                </div>
              </div>

              <div className="ff" style={{ gridColumn:"1/-1", marginTop:4 }}>
                <label style={{ display:"flex", alignItems:"flex-start", gap:12, cursor:"pointer" }}>
                  <div
                    onClick={() => setForm(f => ({...f, agreed:!f.agreed}))}
                    style={{
                      flexShrink:0, marginTop:2, width:22, height:22, borderRadius:7, cursor:"pointer",
                      display:"flex", alignItems:"center", justifyContent:"center", transition:"all .28s ease",
                      background: form.agreed ? `linear-gradient(135deg,${SKY[700]},${SKY[400]})` : "rgba(255,255,255,.13)",
                      border: form.agreed ? `2px solid ${SKY[400]}bb` : "2px solid rgba(255,255,255,.26)",
                      boxShadow: form.agreed ? "0 0 12px rgba(14,165,233,.32)" : "none",
                    }}
                  >
                    {form.agreed && (
                      <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                        <path d="M1.5 5L4.5 8L10.5 2" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span style={{ fontSize:12, color:"rgba(175,210,245,.6)", lineHeight:1.7, fontWeight:300, fontFamily:FONT }}>
                    I agree to Randle &amp; Hopkins's{" "}
                    <span style={{ color:SKY[300], textDecoration:"underline", textUnderlineOffset:3, cursor:"pointer" }}>Terms and Conditions</span>
                    {" "}and{" "}
                    <span style={{ color:SKY[300], textDecoration:"underline", textUnderlineOffset:3, cursor:"pointer" }}>Privacy Policy</span>
                  </span>
                </label>
                {errs.agreed && <span style={{ ...ERR_ST, marginLeft:34 }}>You must agree to the terms to continue</span>}
              </div>
            </div>
          )}
        </div>

        {/* navigation */}
        <div className="sf-nav" style={{ display:"flex", gap:12, marginTop:28 }}>
          {step > 1 && <SecondaryBtn onClick={goBack}>← Back</SecondaryBtn>}
          <PrimaryBtn onClick={goNext} disabled={loading}>
            {loading ? (
              <>
                <span style={{ width:15, height:15, border:"2.5px solid rgba(255,255,255,.25)", borderTopColor:"#fff", borderRadius:"50%", display:"inline-block", animation:"spin .75s linear infinite" }}/>
                Submitting…
              </>
            ) : step < 3 ? "Continue →" : "Submit Application"}
          </PrimaryBtn>
        </div>

        <p style={{ textAlign:"center", marginTop:14, fontSize:10, color:"rgba(150,190,230,.28)", letterSpacing:".05em", fontFamily:FONT }}>
          <span style={{ color:"rgba(125,211,252,.55)" }}>*</span> All fields are required
        </p>
      </div>

      <div style={{ height:1, background:"linear-gradient(90deg,transparent,rgba(14,165,233,.1),transparent)" }}/>

      {done && (
        <SuccessModal
          onDashboard={() => navigate("/dashboard")}
          onHome={() => navigate("/")}
        />
      )}
    </div>
  );
}

export default StaffForm;