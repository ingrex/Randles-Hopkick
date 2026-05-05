import { useState } from "react";

const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const YEARS = Array.from({ length: 70 }, (_, i) => String(2006 - i));

const BG = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1800&q=85&auto=format&fit=crop";

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Outfit:wght@300;400;500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
@keyframes fadeUp{from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeDown{from{opacity:0;transform:translateY(-32px)}to{opacity:1;transform:translateY(0)}}
@keyframes popIn{from{opacity:0;transform:scale(.8) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}
@keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(14,165,233,.45)}50%{box-shadow:0 0 0 10px rgba(14,165,233,0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes checkDraw{from{stroke-dashoffset:40}to{stroke-dashoffset:0}}
@keyframes orb1{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(40px,-30px) scale(1.1)}}
@keyframes orb2{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-35px,40px) scale(1.08)}}
@keyframes orb3{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(25px,25px) scale(1.05)}}
@keyframes cardIn{from{opacity:0;transform:translateY(40px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes errShake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}
.gi{width:100%;background:rgba(255,255,255,.09);border:1.5px solid rgba(255,255,255,.18);border-radius:22px;padding:14px 20px;color:#fff;font-family:'Outfit',sans-serif;font-size:14px;font-weight:300;transition:all .3s ease;outline:none;backdrop-filter:blur(10px)}
.gi::placeholder{color:rgba(255,255,255,.35)}
.gi:focus{border-color:rgba(14,165,233,.8);background:rgba(14,165,233,.13);box-shadow:0 0 0 4px rgba(14,165,233,.18),0 4px 20px rgba(14,165,233,.12)}
.gi:hover:not(:focus){border-color:rgba(255,255,255,.34);background:rgba(255,255,255,.13)}
.gi.err{border-color:rgba(248,113,113,.7)!important;background:rgba(248,113,113,.09)!important;animation:errShake .35s ease}
.gs{width:100%;background:rgba(255,255,255,.09);border:1.5px solid rgba(255,255,255,.18);border-radius:22px;padding:14px 44px 14px 20px;color:#fff;font-family:'Outfit',sans-serif;font-size:14px;font-weight:300;transition:all .3s ease;outline:none;backdrop-filter:blur(10px);appearance:none;cursor:pointer}
.gs:focus{border-color:rgba(14,165,233,.8);background:rgba(14,165,233,.13);box-shadow:0 0 0 4px rgba(14,165,233,.18)}
.gs:hover:not(:focus){border-color:rgba(255,255,255,.34);background:rgba(255,255,255,.13)}
.gs option{background:#082844;color:#fff}
.gs.err{border-color:rgba(248,113,113,.7)!important;background:rgba(248,113,113,.09)!important}
.gt{width:100%;background:rgba(255,255,255,.09);border:1.5px solid rgba(255,255,255,.18);border-radius:22px;padding:14px 20px;color:#fff;font-family:'Outfit',sans-serif;font-size:14px;font-weight:300;transition:all .3s ease;outline:none;backdrop-filter:blur(10px);resize:none}
.gt::placeholder{color:rgba(255,255,255,.35)}
.gt:focus{border-color:rgba(14,165,233,.8);background:rgba(14,165,233,.13);box-shadow:0 0 0 4px rgba(14,165,233,.18)}
.gt:hover:not(:focus){border-color:rgba(255,255,255,.34);background:rgba(255,255,255,.13)}
.gt.err{border-color:rgba(248,113,113,.7)!important;background:rgba(248,113,113,.09)!important}
.lbl{display:block;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.13em;color:rgba(255,255,255,.55);margin-bottom:7px}
.ferr{display:block;font-size:11px;color:rgba(248,113,113,.9);margin-top:5px;font-family:'Outfit',sans-serif;letter-spacing:.02em;animation:fadeUp .25s ease}
.sa{position:absolute;right:15px;top:50%;transform:translateY(-50%);pointer-events:none;color:rgba(255,255,255,.4);font-size:11px}
.tog{flex:1;padding:14px 8px;border-radius:22px;font-family:'Outfit',sans-serif;font-size:13px;font-weight:500;cursor:pointer;transition:all .3s cubic-bezier(.4,0,.2,1);border:1.5px solid rgba(255,255,255,.18);background:rgba(255,255,255,.07);color:rgba(255,255,255,.5)}
.tog.on{background:linear-gradient(135deg,rgba(14,165,233,.32),rgba(56,189,248,.14));border-color:rgba(14,165,233,.72);color:#7dd3fc;box-shadow:0 0 18px rgba(14,165,233,.22)}
.tog:hover:not(.on){background:rgba(255,255,255,.13);border-color:rgba(255,255,255,.3);color:rgba(255,255,255,.8)}
.btn-primary{width:100%;padding:16px 24px;border-radius:22px;border:none;cursor:pointer;font-family:'Outfit',sans-serif;font-size:14px;font-weight:600;color:#fff;transition:all .35s cubic-bezier(.4,0,.2,1);background:linear-gradient(135deg,#0369a1,#0ea5e9,#38bdf8);box-shadow:0 8px 32px rgba(14,165,233,.38);display:flex;align-items:center;justify-content:center;gap:10px;letter-spacing:.01em}
.btn-primary:hover:not(:disabled){transform:translateY(-3px);box-shadow:0 16px 48px rgba(14,165,233,.52)}
.btn-primary:active:not(:disabled){transform:translateY(-1px)}
.btn-primary:disabled{background:rgba(14,165,233,.25);box-shadow:none;cursor:not-allowed}
.btn-sec{width:100%;padding:15px 24px;border-radius:22px;border:1.5px solid rgba(255,255,255,.18);cursor:pointer;font-family:'Outfit',sans-serif;font-size:14px;font-weight:400;color:rgba(255,255,255,.6);background:rgba(255,255,255,.07);transition:all .3s ease}
.btn-sec:hover{background:rgba(255,255,255,.13);color:#fff;border-color:rgba(255,255,255,.32)}
.row2{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.full{grid-column:1/-1}
@media(max-width:580px){.row2{grid-template-columns:1fr!important}.full{grid-column:1!important}.tog{font-size:12px!important;padding:11px 5px!important}}
@media(max-width:380px){.togrow{flex-wrap:wrap!important}.tog{flex:1 1 calc(50% - 5px)!important}}
`;

const isReq = (v) => (typeof v === "boolean" ? v : String(v || "").trim() !== "");

const initForm = {
  surname: "", otherName: "", email: "", phone: "", nationality: "", address: "",
  maritalStatus: "", language: "", dobDay: "", dobMonth: "", dobYear: "", gender: "",
  primarySkill: "", yearsExp: "", additionalSkills: "", bio: "", qualification: "", agreed: false,
};

const S1_KEYS = ["surname","otherName","email","phone","nationality","address","maritalStatus","language","dobDay","dobMonth","dobYear","gender"];
const S2_KEYS = ["primarySkill","yearsExp","additionalSkills","bio","qualification","agreed"];

function validate(form, keys) {
  const e = {};
  keys.forEach((k) => { if (!isReq(form[k])) e[k] = "Required"; });
  if (keys.includes("email") && form.email && !/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
  if (keys.includes("phone") && form.phone && !/^\+?[\d\s\-()]{7,}$/.test(form.phone)) e.phone = "Enter a valid phone number";
  return e;
}

function SelectField({ label, value, onChange, opts, placeholder, err, req: r }) {
  return (
    <div>
      <label className="lbl">{label}{r && <span style={{ color: "#7dd3fc" }}> *</span>}</label>
      <div style={{ position: "relative" }}>
        <select className={`gs${err ? " err" : ""}`} value={value} onChange={onChange}>
          <option value="">{placeholder || "Select"}</option>
          {opts.map((o) => <option key={o.v || o} value={o.v || o}>{o.l || o}</option>)}
        </select>
        <span className="sa">▾</span>
      </div>
      {err && <span className="ferr">{err}</span>}
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, type = "text", err, req: r }) {
  return (
    <div>
      <label className="lbl">{label}{r && <span style={{ color: "#7dd3fc" }}> *</span>}</label>
      <input className={`gi${err ? " err" : ""}`} type={type} placeholder={placeholder} value={value} onChange={onChange} />
      {err && <span className="ferr">{err}</span>}
    </div>
  );
}

function Progress({ step, pct }) {
  return (
    <div style={{ marginBottom: 30 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".15em", textTransform: "uppercase", color: "rgba(255,255,255,.4)" }}>
          Step {step} of 2
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "'Outfit',sans-serif", background: "linear-gradient(90deg,#7dd3fc,#38bdf8,#bae6fd)", backgroundSize: "200% auto", animation: "shimmer 3s linear infinite", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          {pct}% complete
        </span>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: "rgba(255,255,255,.1)", overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", inset: "0 auto 0 0", width: `${pct}%`, background: "linear-gradient(90deg,#075985,#0ea5e9,#7dd3fc)", borderRadius: 99, transition: "width .75s cubic-bezier(.4,0,.2,1)", boxShadow: "0 0 20px rgba(14,165,233,.6)" }} />
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        {[1, 2].map((s) => (
          <div key={s} style={{ flex: 1, height: 3, borderRadius: 99, transition: "all .5s ease", background: s <= step ? "linear-gradient(90deg,#0284c7,#38bdf8)" : "rgba(255,255,255,.1)", boxShadow: s <= step ? "0 0 10px rgba(14,165,233,.45)" : "" }} />
        ))}
      </div>
    </div>
  );
}

function SuccessModal({ onAction }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.65)", backdropFilter: "blur(14px)", padding: 20 }}>
      <div style={{ background: "rgba(7,32,55,.8)", border: "1.5px solid rgba(14,165,233,.35)", borderRadius: 32, padding: "52px 44px", maxWidth: 420, width: "100%", textAlign: "center", backdropFilter: "blur(40px)", boxShadow: "0 48px 120px rgba(0,0,0,.6),inset 0 1px 0 rgba(14,165,233,.25)", animation: "popIn .5s cubic-bezier(.34,1.56,.64,1)" }}>
        <div style={{ width: 90, height: 90, borderRadius: "50%", margin: "0 auto 28px", background: "linear-gradient(135deg,#0369a1,#0ea5e9)", display: "flex", alignItems: "center", justifyContent: "center", animation: "pulse 2s ease infinite", boxShadow: "0 0 48px rgba(14,165,233,.5)" }}>
          <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
            <path d="M9 22L17 30L33 14" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="40" strokeDashoffset="40" style={{ animation: "checkDraw .7s .3s ease forwards" }} />
          </svg>
        </div>
        <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 34, fontWeight: 700, color: "#fff", letterSpacing: "-.02em", marginBottom: 12 }}>
          Application Received!
        </h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,.52)", lineHeight: 1.7, fontFamily: "'Outfit',sans-serif", fontWeight: 300, marginBottom: 36 }}>
          Your details have been submitted successfully. Our team at Randle &amp; Hopkins will review your application and be in touch shortly.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button className="btn-primary" onClick={onAction} style={{ borderRadius: 22 }}>
            Go to Dashboard →
          </button>
          <button className="btn-sec" onClick={onAction}>
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export  function ApplicantForm() {
  const [step, setStep]       = useState(1);
  const [form, setForm]       = useState(initForm);
  const [errs, setErrs]       = useState({});
  const [animDir, setAnimDir] = useState("fwd");
  const [animKey, setAnimKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const setGender = (v) => setForm((f) => ({ ...f, gender: v }));

  const allKeys = [...S1_KEYS, ...S2_KEYS];
  const filled  = allKeys.filter((k) => isReq(form[k])).length;
  const pct     = Math.round((filled / allKeys.length) * 100);

  const go = (nextStep, dir) => {
    setAnimDir(dir);
    setAnimKey((k) => k + 1);
    setStep(nextStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goNext = () => {
    const e = validate(form, S1_KEYS);
    if (Object.keys(e).length) { setErrs(e); return; }
    setErrs({});
    go(2, "fwd");
  };

  const goBack = () => { setErrs({}); go(1, "back"); };

  const handleSubmit = () => {
    const e = validate(form, S2_KEYS);
    if (Object.keys(e).length) { setErrs(e); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); setDone(true); }, 1800);
  };

  const stepAnim = animDir === "fwd"
    ? { animation: "fadeUp .42s cubic-bezier(.4,0,.2,1) both" }
    : { animation: "fadeDown .42s cubic-bezier(.4,0,.2,1) both" };

  return (
    <div style={{ minHeight: "100vh", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 20px", fontFamily: "'Outfit',sans-serif", backgroundImage: `url(${BG})`, backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed" }}>
      <style>{STYLES}</style>

      {/* Dark overlay */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(145deg,rgba(2,8,23,.82) 0%,rgba(7,57,90,.6) 50%,rgba(2,8,23,.86) 100%)", backdropFilter: "blur(3px)" }} />

      {/* Animated background orbs */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "10%", left: "5%", width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle,rgba(3,105,161,.45),transparent 70%)", filter: "blur(70px)", animation: "orb1 9s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "4%", width: 450, height: 450, borderRadius: "50%", background: "radial-gradient(circle,rgba(7,89,133,.38),transparent 70%)", filter: "blur(80px)", animation: "orb2 12s ease-in-out infinite" }} />
        <div style={{ position: "absolute", top: "50%", left: "40%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(14,165,233,.18),transparent 70%)", filter: "blur(60px)", animation: "orb3 10s ease-in-out infinite" }} />
      </div>

      {/* Glass card */}
      <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 620, background: "rgba(255,255,255,.065)", backdropFilter: "blur(40px) saturate(170%)", border: "1.5px solid rgba(255,255,255,.13)", borderRadius: 36, overflow: "hidden", boxShadow: "0 52px 130px rgba(0,0,0,.58),inset 0 1.5px 0 rgba(255,255,255,.17),inset 0 -1px 0 rgba(0,0,0,.15)", animation: "cardIn .65s cubic-bezier(.4,0,.2,1) both" }}>

        {/* Top accent line */}
        <div style={{ height: 2.5, background: "linear-gradient(90deg,transparent,rgba(14,165,233,.9),rgba(56,189,248,.6),transparent)" }} />

        <div style={{ padding: "44px 52px 52px" }}>

          {/* Brand header */}
          <div style={{ marginBottom: 30 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "linear-gradient(135deg,#0ea5e9,#7dd3fc)", boxShadow: "0 0 10px rgba(14,165,233,.6)" }} />
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".22em", textTransform: "uppercase", color: "rgba(56,189,248,.85)" }}>
                Randle &amp; Hopkins
              </span>
            </div>
            <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 36, fontWeight: 700, color: "#fff", letterSpacing: "-.025em", lineHeight: 1.12 }}>
              {step === 1 ? "Personal Information" : "Professional Details"}
            </h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,.38)", marginTop: 6, fontWeight: 300 }}>
              {step === 1 ? "Tell us about yourself — all fields are required." : "Your skills and qualifications help us match you better."}
            </p>
          </div>

          <Progress step={step} pct={pct} />

          {/* Animated step content */}
          <div key={animKey} style={stepAnim}>

            {/* ── STEP 1 ── */}
            {step === 1 && (
              <div className="row2">
                <InputField label="Surname" value={form.surname} onChange={set("surname")} placeholder="Your surname" err={errs.surname} req />
                <InputField label="Other Name" value={form.otherName} onChange={set("otherName")} placeholder="Other name" err={errs.otherName} req />
                <InputField label="Email Address" type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" err={errs.email} req />
                <InputField label="Phone Number" type="tel" value={form.phone} onChange={set("phone")} placeholder="+234 800 000 0000" err={errs.phone} req />

                <SelectField label="Nationality" value={form.nationality} onChange={set("nationality")} placeholder="Select country" err={errs.nationality} req
                  opts={["Nigeria","Ghana","Kenya","South Africa","Ethiopia","Cameroon","Uganda","Tanzania","United Kingdom","United States","Canada","France","Other"]} />
                <InputField label="Home Address (Current)" value={form.address} onChange={set("address")} placeholder="City, State, Country" err={errs.address} req />

                <SelectField label="Marital Status" value={form.maritalStatus} onChange={set("maritalStatus")} placeholder="Select status" err={errs.maritalStatus} req
                  opts={["Single","Married","Divorced","Widowed","Separated"]} />
                <InputField label="Language Skill" value={form.language} onChange={set("language")} placeholder="e.g. English, French" err={errs.language} req />

                {/* Date of Birth */}
                <div className="full">
                  <label className="lbl">Date of Birth<span style={{ color: "#7dd3fc" }}> *</span></label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: 10 }}>
                    <div style={{ position: "relative" }}>
                      <select className={`gs${errs.dobDay ? " err" : ""}`} value={form.dobDay} onChange={set("dobDay")}>
                        <option value="">Day</option>
                        {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <span className="sa">▾</span>
                    </div>
                    <div style={{ position: "relative" }}>
                      <select className={`gs${errs.dobMonth ? " err" : ""}`} value={form.dobMonth} onChange={set("dobMonth")}>
                        <option value="">Month</option>
                        {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <span className="sa">▾</span>
                    </div>
                    <div style={{ position: "relative" }}>
                      <select className={`gs${errs.dobYear ? " err" : ""}`} value={form.dobYear} onChange={set("dobYear")}>
                        <option value="">Year</option>
                        {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                      </select>
                      <span className="sa">▾</span>
                    </div>
                  </div>
                  {(errs.dobDay || errs.dobMonth || errs.dobYear) && (
                    <span className="ferr">Please select your complete date of birth</span>
                  )}
                </div>

                {/* Gender toggle */}
                <div className="full">
                  <label className="lbl">Gender<span style={{ color: "#7dd3fc" }}> *</span></label>
                  <div className="togrow" style={{ display: "flex", gap: 10 }}>
                    {["Male", "Female", "Non-binary", "Prefer not to say"].map((g) => (
                      <button key={g} type="button" className={`tog${form.gender === g ? " on" : ""}`} onClick={() => setGender(g)}>
                        {g}
                      </button>
                    ))}
                  </div>
                  {errs.gender && <span className="ferr">Please select your gender</span>}
                </div>
              </div>
            )}

            {/* ── STEP 2 ── */}
            {step === 2 && (
              <div className="row2">
                <SelectField label="Primary Skill" value={form.primarySkill} onChange={set("primarySkill")} placeholder="Select skill" err={errs.primarySkill} req
                  opts={["Technology / IT","Healthcare","Education / Teaching","Finance & Accounting","Trade / Artisan","Agriculture","Media & Communications","Legal Services","Engineering","Other"]} />
                <SelectField label="Years of Experience" value={form.yearsExp} onChange={set("yearsExp")} placeholder="Select range" err={errs.yearsExp} req
                  opts={["Less than 1 year","1 – 2 years","3 – 5 years","6 – 10 years","10+ years"]} />

                <div className="full">
                  <InputField label="Additional Skills" value={form.additionalSkills} onChange={set("additionalSkills")} placeholder="e.g. Driving, Cooking, Childcare, First Aid" err={errs.additionalSkills} req />
                </div>

                <div className="full">
                  <label className="lbl">Bio<span style={{ color: "#7dd3fc" }}> *</span></label>
                  <textarea className={`gt${errs.bio ? " err" : ""}`} rows={4} placeholder="A brief description about yourself, your background and career goals…" value={form.bio} onChange={set("bio")} />
                  {errs.bio && <span className="ferr">Bio is required</span>}
                </div>

                <div className="full">
                  <SelectField label="Educational Qualification" value={form.qualification} onChange={set("qualification")} placeholder="Select qualification" err={errs.qualification} req
                    opts={["SSCE / O-Level","OND / HND","B.Sc / B.A","M.Sc / MBA","PhD / Doctorate","Vocational / Trade Certificate","Professional Certification","No Formal Education"]} />
                </div>

                {/* Terms & Conditions */}
                <div className="full" style={{ marginTop: 6 }}>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: 14, cursor: "pointer" }}>
                    <div
                      onClick={() => setForm((f) => ({ ...f, agreed: !f.agreed }))}
                      style={{ flexShrink: 0, marginTop: 1, width: 24, height: 24, borderRadius: 9, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .3s ease", background: form.agreed ? "linear-gradient(135deg,#0369a1,#38bdf8)" : "rgba(255,255,255,.08)", border: form.agreed ? "2px solid rgba(56,189,248,.8)" : "2px solid rgba(255,255,255,.22)", boxShadow: form.agreed ? "0 0 18px rgba(14,165,233,.4)" : "none" }}
                    >
                      {form.agreed && (
                        <svg width="13" height="11" viewBox="0 0 13 11" fill="none">
                          <path d="M1.5 5.5L5 9L11.5 2" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,.48)", lineHeight: 1.7, fontWeight: 300 }}>
                      I agree to Randle &amp; Hopkins's{" "}
                      <span style={{ color: "#7dd3fc", textDecoration: "underline", textUnderlineOffset: 3, cursor: "pointer" }}>Terms and Conditions</span>
                      {" "}and{" "}
                      <span style={{ color: "#7dd3fc", textDecoration: "underline", textUnderlineOffset: 3, cursor: "pointer" }}>Privacy Policy</span>
                    </span>
                  </label>
                  {errs.agreed && <span className="ferr" style={{ marginLeft: 38 }}>You must agree to the terms to continue</span>}
                </div>
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          <div style={{ display: "flex", gap: 12, marginTop: 36 }}>
            {step === 2 && (
              <button className="btn-sec" onClick={goBack} style={{ flex: "0 0 auto", width: "auto", padding: "16px 28px", borderRadius: 22 }}>
                ← Back
              </button>
            )}
            {step === 1 ? (
              <button className="btn-primary" onClick={goNext} style={{ flex: 1 }}>
                Continue to Step 2 →
              </button>
            ) : (
              <button className="btn-primary" onClick={handleSubmit} disabled={loading} style={{ flex: 1, opacity: loading ? 0.7 : 1 }}>
                {loading ? (
                  <>
                    <span style={{ width: 16, height: 16, border: "2.5px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin .75s linear infinite" }} />
                    Submitting…
                  </>
                ) : "Submit Application ✦"}
              </button>
            )}
          </div>

          <p style={{ textAlign: "center", marginTop: 18, fontSize: 11, color: "rgba(255,255,255,.25)", letterSpacing: ".05em" }}>
            <span style={{ color: "rgba(125,211,252,.7)" }}>*</span> All fields are required
          </p>
        </div>

        {/* Bottom shimmer line */}
        <div style={{ height: 1.5, background: "linear-gradient(90deg,transparent,rgba(14,165,233,.15),transparent)" }} />
      </div>

      {/* Success modal */}
      {done && <SuccessModal onAction={() => setDone(false)} />}

      {/* Extra responsive overrides */}
      <style>{`
        @media(max-width:580px){
          div[style*="padding: 44px 52px"]{padding:30px 22px 36px!important}
          h1[style*="fontSize: 36"]{font-size:28px!important}
        }
      `}</style>
    </div>
  );
}
export default ApplicantForm;