import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getNames } from "country-list";
import { apiStaffProfile } from "../api/auth";
import { useAuth } from "../pages/AuthContext";

/* ─── date option arrays ─────────────────────────────────────── */
const DAYS   = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));
const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];
const YEARS  = Array.from({ length: 70 }, (_, i) => String(2006 - i));

/* ─── keyframes only (no layout classes) ─────────────────────── */
const KEYFRAMES = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Outfit:wght@300;400;500;600&display=swap');
@keyframes fadeUp   { from { opacity:0; transform:translateY(26px)  } to { opacity:1; transform:translateY(0) } }
@keyframes fadeDown { from { opacity:0; transform:translateY(-26px) } to { opacity:1; transform:translateY(0) } }
@keyframes popIn    { from { opacity:0; transform:scale(.84) translateY(16px) } to { opacity:1; transform:scale(1) translateY(0) } }
@keyframes shimmer  { 0%  { background-position:200% center } 100% { background-position:-200% center } }
@keyframes pulse    { 0%,100% { box-shadow:0 0 0 0 rgba(14,165,233,.45) } 50% { box-shadow:0 0 0 10px rgba(14,165,233,0) } }
@keyframes spin     { to  { transform:rotate(360deg) } }
@keyframes checkDraw{ from{ stroke-dashoffset:40 } to { stroke-dashoffset:0 } }
@keyframes errShake { 0%,100%{ transform:translateX(0) } 20%,60%{ transform:translateX(-5px) } 40%,80%{ transform:translateX(5px) } }
@keyframes float    { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-7px) } }
input::placeholder  { color: rgba(170,205,240,.42); }
textarea::placeholder { color: rgba(170,205,240,.42); }
select option { background: #0d1e35; color: #ddeeff; }
`;

/* ─── design tokens ──────────────────────────────────────────── */
const FONT  = "'Outfit', sans-serif";
const SERIF = "'Cormorant Garamond', serif";
const SKY   = { 300:"#7dd3fc", 400:"#38bdf8", 500:"#0ea5e9", 600:"#0284c7", 700:"#0369a1", 800:"#075985" };

/* ─── base input styles ──────────────────────────────────────── */
const BASE = {
  width:"100%", minWidth:0, boxSizing:"border-box",
  fontFamily:FONT, fontSize:13, fontWeight:400, color:"#ddeeff",
  borderRadius:12, outline:"none", transition:"all .25s ease",
  paddingLeft:14, paddingRight:14,
};

const mkInput  = (x={}) => ({ ...BASE, paddingTop:10, paddingBottom:10, background:"rgba(255,255,255,.07)", border:"1.5px solid rgba(255,255,255,.12)", ...x });
const mkFocus  = (x={}) => ({ ...mkInput(x), background:"rgba(14,165,233,.12)", border:`1.5px solid ${SKY[400]}bb`, boxShadow:"0 0 0 3px rgba(14,165,233,.15)" });
const mkErr    = (x={}) => ({ ...mkInput(x), background:"rgba(248,113,113,.08)", border:"1.5px solid rgba(248,113,113,.6)", animation:"errShake .3s ease" });
const mkLocked = (x={}) => ({ ...BASE, paddingTop:10, paddingBottom:10, background:"rgba(255,255,255,.04)", border:"1.5px solid rgba(255,255,255,.08)", color:"rgba(221,238,255,.45)", cursor:"not-allowed", ...x });

/* floating variants — extra top padding for label space */
const mkFloat      = () => mkInput({ paddingTop:22, paddingBottom:6 });
const mkFloatFocus = () => mkFocus({ paddingTop:22, paddingBottom:6 });
const mkFloatErr   = () => mkErr  ({ paddingTop:22, paddingBottom:6 });
const mkFloatLock  = () => mkLocked({ paddingTop:22, paddingBottom:6 });

const SEL_X = { paddingTop:10, paddingBottom:10, paddingRight:36, appearance:"none", cursor:"pointer" };
const sRest = mkInput(SEL_X); const sFocus = mkFocus(SEL_X); const sErr = mkErr(SEL_X);
const tRest = mkInput({ resize:"none" }); const tFocus = mkFocus({ resize:"none" }); const tErr = mkErr({ resize:"none" });

const ERR_ST = { display:"block", fontSize:11, color:"rgba(252,165,165,.95)", marginTop:4, fontFamily:FONT, animation:"fadeUp .22s ease" };

/* ─── validation ─────────────────────────────────────────────── */
const isReq = (v) => {
  if (typeof v === "boolean") return v;
  if (Array.isArray(v)) return v.length > 0;
  return String(v || "").trim() !== "";
};
const INIT = {
  surname:"", otherName:"", email:"", phone:"", country:"", address:"",
  maritalStatus:"", language:"", dobDay:"", dobMonth:"", dobYear:"", gender:"",
  disabled:false, internallyDisplaced:false,

  // ── NEW: Next of Kin ──
  nokName:"", nokRelationship:"", nokPhone:"", nokAltPhone:"", nokAddress:"",

  // ── NEW: Job Experience ──
  noPriorExperience:false,
  jobExperience:[
    { organization:"", role:"", fromMonth:"", fromYear:"", toMonth:"", toYear:"",
      isCurrent:false, refName:"", refRelationship:"", refPhone:"", refEmail:"", saved:false },
  ],

  // ── NEW: Professional Picture ──
  profilePicture:null,

  primarySkill:"", yearsExp:"", additionalSkills:[], bio:"", qualification:"", agreed:false,
};

const S1 = ["surname","otherName","email","phone","country","address"];
const S2 = ["maritalStatus","language","dobDay","dobMonth","dobYear","gender"];
const S3 = ["nokName","nokRelationship","nokPhone","nokAddress"]; // Next of Kin (nokAltPhone optional)
const S5 = ["primarySkill","yearsExp","additionalSkills","bio","qualification","agreed"]; // Professional details

// blank job-experience entry, used when adding a new card
const emptyJobEntry = {
  organization:"", role:"", fromMonth:"", fromYear:"", toMonth:"", toYear:"",
  isCurrent:false, refName:"", refRelationship:"", refPhone:"", refEmail:"", saved:false,
};

function validate(form, keys) {
  const e = {};
  keys.forEach(k => { if (!isReq(form[k])) e[k] = "This field is required"; });
  if (keys.includes("email") && form.email && !/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
  if (keys.includes("phone") && form.phone && !/^\+?[\d\s\-()]{7,}$/.test(form.phone)) e.phone = "Enter a valid phone";
  if (keys.includes("nokPhone") && form.nokPhone && !/^\+?[\d\s\-()]{7,}$/.test(form.nokPhone)) e.nokPhone = "Enter a valid phone";
  return e;
}

/* ── NEW: per-entry validation for a Job Experience card ── */
function validateJobEntry(entry) {
  const e = {};
  if (!entry.organization.trim()) e.organization = "Required";
  if (!entry.role.trim()) e.role = "Required";
  if (!entry.fromMonth) e.fromMonth = "Required";
  if (!entry.fromYear) e.fromYear = "Required";
  if (!entry.isCurrent) {
    if (!entry.toMonth) e.toMonth = "Required";
    if (!entry.toYear) e.toYear = "Required";
  }
  if (!entry.refName.trim()) e.refName = "Required";
  if (!entry.refRelationship.trim()) e.refRelationship = "Required";
  if (!entry.refPhone.trim()) e.refPhone = "Required";
  else if (!/^\+?[\d\s\-()]{7,}$/.test(entry.refPhone)) e.refPhone = "Enter a valid phone";
  return e;
}

/* ── NEW: step-level validation for Job Experience ── */
function validateJobExperience(form) {
  if (form.noPriorExperience) return { hasError:false };
  if (!form.jobExperience.some(e => e.saved)) {
    return { hasError:true, jobExperienceGeneral:"Add at least one job experience, or check \u2018No prior work experience\u2019 above." };
  }
  return { hasError:false };
}

/* ── NEW: client-side image compression (canvas-based) ── */
function compressImage(file, { maxDimension = 800, targetKB = 350, minQuality = 0.3 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please upload a valid image file (JPG or PNG).")); return;
    }
    if (file.size > 15 * 1024 * 1024) {
      reject(new Error("Image is too large (max 15MB). Please choose a smaller file.")); return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) { height = Math.round(height * (maxDimension / width)); width = maxDimension; }
          else { width = Math.round(width * (maxDimension / height)); height = maxDimension; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const sizeKB = (str) => Math.round((str.length * 3 / 4) / 1024);
        let quality = 0.8;
        let dataUrl = canvas.toDataURL("image/jpeg", quality);
        while (sizeKB(dataUrl) > targetKB && quality > minQuality) {
          quality = Math.max(minQuality, quality - 0.1);
          dataUrl = canvas.toDataURL("image/jpeg", quality);
          if (quality === minQuality) break;
        }
        resolve({ dataUrl, originalSizeKB: Math.round(file.size / 1024), finalSizeKB: sizeKB(dataUrl) });
      };
      img.onerror = () => reject(new Error("Could not read image file."));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}

/* ══════════════════════ FIELD COMPONENTS ═══════════════════════ */

/* Floating label — label slides up when filled/focused */
function InputField({ label, value, onChange, type="text", err, req: r }) {
  const [f, setF] = useState(false);
  const raised = !!(value || f);
  return (
    <div style={{ position:"relative", minWidth:0 }}>
      <input
        style={err ? mkFloatErr() : f ? mkFloatFocus() : mkFloat()}
        type={type} placeholder="" value={value} onChange={onChange}
        onFocus={()=>setF(true)} onBlur={()=>setF(false)}
      />
      <label style={{
        position:"absolute", left:14, pointerEvents:"none", lineHeight:1,
        transition:"top .15s ease, font-size .15s ease, color .15s ease",
        top: raised ? 5 : "50%",
        transform: raised ? "none" : "translateY(-50%)",
        fontSize: raised ? 10 : 13,
        color: f ? SKY[300] : "rgba(148,163,184,0.7)",
        fontFamily:FONT,
      }}>
        {label}{r ? " *" : ""}
      </label>
      {err && <span style={ERR_ST}>{err}</span>}
    </div>
  );
}

/* Locked — always shows label at top */
function LockedField({ label, value }) {
  return (
    <div style={{ position:"relative", minWidth:0 }}>
      <input style={mkFloatLock()} placeholder="" value={value} readOnly tabIndex={-1} />
      <label style={{
        position:"absolute", left:14, top:5, pointerEvents:"none",
        fontSize:10, lineHeight:1, color:"rgba(148,163,184,0.55)", fontFamily:FONT,
      }}>
        {label}
      </label>
    </div>
  );
}

function SelectField({ label, value, onChange, opts, err, req: r }) {
  const [f, setF] = useState(false);
  return (
    <div style={{ minWidth:0 }}>
      <div style={{ position:"relative" }}>
        <select
          style={err ? sErr : f ? sFocus : sRest}
          value={value} onChange={onChange}
          onFocus={()=>setF(true)} onBlur={()=>setF(false)}
        >
          <option value="">{label}{r ? " *" : ""}</option>
          {opts.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <span style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", color:"rgba(180,215,255,.5)", fontSize:11 }}>▾</span>
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

function TextareaField({ label, value, onChange, err, req: r, rows=4 }) {
  const [f, setF] = useState(false);
  return (
    <div style={{ minWidth:0 }}>
      <textarea
        style={err ? tErr : f ? tFocus : tRest}
        rows={rows} placeholder={`${label}${r ? " *" : ""}`} value={value}
        onChange={onChange} onFocus={()=>setF(true)} onBlur={()=>setF(false)}
      />
      {err && <span style={ERR_ST}>{err}</span>}
    </div>
  );
}

function GenderToggle({ value, onChange, err }) {
  return (
    <div>
      <div style={{ display:"flex", gap:10 }}>
        {["Male","Female"].map(g => <GenderBtn key={g} label={`${g} *`} active={value===g} onClick={()=>onChange(g)} />)}
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
      style={{
        flex:1, padding:"11px 8px", borderRadius:12, fontFamily:FONT,
        fontSize:13, fontWeight:500, cursor:"pointer", transition:"all .25s ease",
        border: active ? `1.5px solid ${SKY[400]}bb` : hov ? "1.5px solid rgba(255,255,255,.38)" : "1.5px solid rgba(255,255,255,.15)",
        background: active ? `linear-gradient(135deg,rgba(14,165,233,.28),rgba(56,189,248,.12))` : hov ? "rgba(255,255,255,.12)" : "rgba(255,255,255,.06)",
        color: active ? SKY[300] : hov ? "#fff" : "rgba(200,225,255,.6)",
        boxShadow: active ? "0 0 12px rgba(14,165,233,.2)" : "none",
      }}
    >{label}</button>
  );
}

function StyledCheckbox({ checked, onToggle, label }) {
  return (
    <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
      <div onClick={onToggle} style={{
        flexShrink:0, width:22, height:22, borderRadius:6, cursor:"pointer",
        display:"flex", alignItems:"center", justifyContent:"center", transition:"all .25s ease",
        background: checked ? `linear-gradient(135deg,${SKY[700]},${SKY[400]})` : "rgba(255,255,255,.1)",
        border: checked ? `2px solid ${SKY[400]}bb` : "2px solid rgba(255,255,255,.22)",
        boxShadow: checked ? "0 0 10px rgba(14,165,233,.28)" : "none",
      }}>
        {checked && (
          <svg width="11" height="9" viewBox="0 0 12 10" fill="none">
            <path d="M1.5 5L4.5 8L10.5 2" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <span style={{ fontSize:13, color:"rgba(175,210,245,.7)", fontFamily:FONT }}>{label}</span>
    </label>
  );
}

/* ═══════════════════════ ADDITIONAL SKILLS ═════════════════════ */
const SKILL_OPTS = [
  "Driving","Cooking","Childcare","Cleaning","Gardening","Carpentry",
  "Welding","Painting","Tailoring","Catering","First Aid","Event Planning",
  "Data Entry","Customer Service","Sales","Photography","Videography",
  "Graphic Design","Social Media","Translation","Bookkeeping","Typing",
  "Machine Operation","Forklift Operation","Security","Other",
];

function AdditionalSkillsPicker({ value, onChange, err }) {
  const [dropF, setDropF] = useState(false);
  const [custom, setCustom] = useState("");
  const [customF, setCustomF] = useState(false);

  const addDrop = (e) => { const s=e.target.value; if(s && !value.includes(s)) onChange([...value,s]); e.target.value=""; };
  const addCustom = () => { const t=custom.trim(); if(t && !value.includes(t)) onChange([...value,t]); setCustom(""); };
  const remove = (s) => onChange(value.filter(x=>x!==s));

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      {value.length > 0 && (
        <div style={{
          display:"flex", flexWrap:"wrap", gap:7,
          padding:"10px 12px", borderRadius:12,
          background:"rgba(14,165,233,.06)", border:`1.5px solid rgba(14,165,233,.16)`,
        }}>
          {value.map(s => (
            <span key={s} style={{
              display:"inline-flex", alignItems:"center", gap:6,
              padding:"3px 10px 3px 11px", borderRadius:99,
              background:`linear-gradient(135deg,rgba(14,165,233,.2),rgba(56,189,248,.1))`,
              border:`1px solid ${SKY[400]}44`,
              fontSize:12, fontWeight:500, color:SKY[300], fontFamily:FONT,
            }}>
              {s}
              <span onClick={()=>remove(s)} style={{
                display:"inline-flex", alignItems:"center", justifyContent:"center",
                width:15, height:15, borderRadius:"50%", cursor:"pointer",
                background:"rgba(255,255,255,.1)", color:"rgba(200,230,255,.6)",
                fontSize:10, transition:"all .2s ease",
              }}
              onMouseEnter={e=>{e.currentTarget.style.background="rgba(248,113,113,.35)";e.currentTarget.style.color="#fff";}}
              onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,.1)";e.currentTarget.style.color="rgba(200,230,255,.6)";}}>✕</span>
            </span>
          ))}
        </div>
      )}
      <div style={{ position:"relative" }}>
        <select
          style={err&&value.length===0 ? sErr : dropF ? sFocus : sRest}
          defaultValue="" onChange={addDrop}
          onFocus={()=>setDropF(true)} onBlur={()=>setDropF(false)}
        >
          <option value="">Additional Skills *</option>
          {SKILL_OPTS.filter(o=>!value.includes(o)).map(o=>(
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <span style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", color:"rgba(180,215,255,.5)", fontSize:11 }}>▾</span>
      </div>
      <div style={{ display:"flex", gap:8 }}>
        <input
          style={{ ...(customF ? mkFocus() : mkInput()), flex:1 }}
          placeholder="Or type a custom skill and press Add…"
          value={custom} onChange={e=>setCustom(e.target.value)}
          onFocus={()=>setCustomF(true)} onBlur={()=>setCustomF(false)}
          onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addCustom();}}}
        />
        <button type="button" onClick={addCustom} style={{
          flexShrink:0, padding:"10px 16px", borderRadius:12, border:"none",
          cursor:"pointer", fontFamily:FONT, fontSize:12, fontWeight:600, color:"#fff",
          background:`linear-gradient(135deg,${SKY[700]},${SKY[500]})`,
          opacity:custom.trim()?1:0.45, transition:"all .25s ease", whiteSpace:"nowrap",
        }}>+ Add</button>
      </div>
      {err && value.length===0 && <span style={ERR_ST}>{err}</span>}
    </div>
  );
}

/* ═══════════════════════ NEW: JOB EXPERIENCE CARD ═══════════════
   Mirrors the ClientForm1 staff-role picker pattern: a filled entry
   collapses into a compact summary chip/card with Edit + Remove,
   while an unsaved entry shows the full input form.               */
function JobExperienceCard({ entry, index, onChange, onSave, onEdit, onRemove, showRemove }) {
  const [localErrs, setLocalErrs] = useState({});
  const set = (k) => (e) => onChange(index, k, e.target.type === "checkbox" ? e.target.checked : e.target.value);

  const handleSave = () => {
    const errs = validateJobEntry(entry);
    if (Object.keys(errs).length) { setLocalErrs(errs); return; }
    setLocalErrs({});
    onSave(index);
  };

  if (entry.saved) {
    const duration = entry.isCurrent
      ? `${entry.fromMonth} ${entry.fromYear} — Present`
      : `${entry.fromMonth} ${entry.fromYear} — ${entry.toMonth} ${entry.toYear}`;
    return (
      <div style={{
        borderRadius:14, border:"1.5px solid rgba(14,165,233,.22)",
        background:"rgba(14,165,233,.06)", padding:"14px 16px",
      }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10 }}>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:14, fontWeight:600, color:"#e8f0fe", fontFamily:FONT }}>
              {entry.role} · {entry.organization}
            </div>
            <div style={{ fontSize:11.5, color:"rgba(175,210,245,.55)", marginTop:3, fontFamily:FONT }}>
              {duration}
            </div>
            <div style={{ fontSize:11.5, color:"rgba(175,210,245,.45)", marginTop:5, fontFamily:FONT }}>
              Reference: {entry.refName} ({entry.refRelationship}) · {entry.refPhone}
            </div>
          </div>
          <div style={{ display:"flex", gap:10, flexShrink:0 }}>
            <button type="button" onClick={()=>onEdit(index)}
              style={{ fontSize:11, color:SKY[300], background:"none", border:"none", cursor:"pointer", fontFamily:FONT }}>
              ✎ Edit
            </button>
            {showRemove && (
              <button type="button" onClick={()=>onRemove(index)}
                style={{ fontSize:11, color:"rgba(248,113,113,.75)", background:"none", border:"none", cursor:"pointer", fontFamily:FONT }}>
                ✕ Remove
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      borderRadius:14, border:"1px solid rgba(255,255,255,.1)",
      background:"rgba(255,255,255,.04)", padding:16,
      display:"flex", flexDirection:"column", gap:12,
    }}>
      <Grid2>
        <InputField label="Organization Name" value={entry.organization} onChange={set("organization")} err={localErrs.organization} req />
        <InputField label="Job Role / Position" value={entry.role} onChange={set("role")} err={localErrs.role} req />
      </Grid2>

      <div>
        <span style={{ fontSize:11, color:"rgba(155,200,240,.55)", fontFamily:FONT, marginBottom:6, display:"block" }}>
          Duration *
        </span>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <DOBSelect value={entry.fromMonth} onChange={set("fromMonth")} placeholder="From: Month" opts={MONTHS} hasErr={!!localErrs.fromMonth} />
          <DOBSelect value={entry.fromYear} onChange={set("fromYear")} placeholder="From: Year" opts={YEARS} hasErr={!!localErrs.fromYear} />
        </div>

        <div style={{ marginTop:10 }}>
          <StyledCheckbox checked={entry.isCurrent} onToggle={()=>onChange(index,"isCurrent",!entry.isCurrent)} label="I currently work here" />
        </div>

        {!entry.isCurrent && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:10 }}>
            <DOBSelect value={entry.toMonth} onChange={set("toMonth")} placeholder="To: Month" opts={MONTHS} hasErr={!!localErrs.toMonth} />
            <DOBSelect value={entry.toYear} onChange={set("toYear")} placeholder="To: Year" opts={YEARS} hasErr={!!localErrs.toYear} />
          </div>
        )}
      </div>

      <div style={{ height:1, background:"rgba(255,255,255,.08)" }} />

      <span style={{ fontSize:11, color:"rgba(155,200,240,.55)", fontFamily:FONT }}>
        Reference Contact (for background check)
      </span>
      <Grid2>
        <InputField label="Reference Name" value={entry.refName} onChange={set("refName")} err={localErrs.refName} req />
        <InputField label="Relationship (e.g. Supervisor)" value={entry.refRelationship} onChange={set("refRelationship")} err={localErrs.refRelationship} req />
        <InputField label="Reference Phone Number" value={entry.refPhone} onChange={set("refPhone")} err={localErrs.refPhone} req />
        <InputField label="Reference Email (optional)" value={entry.refEmail} onChange={set("refEmail")} />
      </Grid2>

      <div style={{ display:"flex", justifyContent:"flex-end" }}>
        <button type="button" onClick={handleSave} style={{
          padding:"9px 20px", borderRadius:12, border:"none", cursor:"pointer",
          fontFamily:FONT, fontSize:12.5, fontWeight:600, color:"#fff",
          background:`linear-gradient(135deg,${SKY[700]},${SKY[500]})`,
          transition:"all .25s ease",
        }}>
          Save This Role
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════ NEW: PHOTO UPLOAD FIELD ════════════════ */
function PhotoUploadField({ value, meta, uploading, onFile, err }) {
  const inputRef = useRef(null);
  return (
    <div>
      <div
        onClick={()=>!uploading && inputRef.current?.click()}
        style={{
          display:"flex", alignItems:"center", gap:14, padding:14, borderRadius:14,
          cursor: uploading ? "wait" : "pointer",
          border: err ? "1.5px dashed rgba(248,113,113,.6)" : "1.5px dashed rgba(125,211,252,.35)",
          background:"rgba(255,255,255,.04)", transition:"all .25s ease",
        }}
      >
        <div style={{
          width:56, height:56, borderRadius:"50%", flexShrink:0, overflow:"hidden",
          background:"rgba(255,255,255,.08)", display:"flex", alignItems:"center", justifyContent:"center",
          border:"1.5px solid rgba(125,211,252,.3)",
        }}>
          {uploading ? (
            <span style={{ width:18, height:18, border:"2.5px solid rgba(255,255,255,.25)", borderTopColor:SKY[300], borderRadius:"50%", display:"inline-block", animation:"spin .75s linear infinite" }}/>
          ) : value ? (
            <img src={value} alt="Profile preview" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 15a4 4 0 100-8 4 4 0 000 8z" stroke="rgba(180,215,255,.55)" strokeWidth="1.6"/>
              <path d="M4 7h3l1.5-2h7L17 7h3v12H4V7z" stroke="rgba(180,215,255,.55)" strokeWidth="1.6" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:500, color:"#e8f0fe", fontFamily:FONT }}>
            {uploading ? "Compressing image…" : value ? "Change photo" : "Upload recent professional picture *"}
          </div>
          <div style={{ fontSize:11, color:"rgba(155,200,240,.45)", marginTop:2, fontFamily:FONT }}>
            {meta ? `Optimized: ${meta.originalSizeKB}KB → ${meta.finalSizeKB}KB` : "JPG or PNG, clear headshot"}
          </div>
        </div>
      </div>
      <input
        ref={inputRef} type="file" accept="image/*" style={{ display:"none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }}
      />
      {err && <span style={ERR_ST}>{err}</span>}
    </div>
  );
}

/* ═══════════════════════ PROGRESS ══════════════════════════════ */
const STEP_LABELS = ["Personal Info","More Details","Next of Kin","Job Experience","Professional"];

function Progress({ step, pct }) {
  const lastIdx = STEP_LABELS.length - 1;
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ display:"flex", alignItems:"center", marginBottom:14 }}>
        {STEP_LABELS.map((lbl,i) => {
          const s=i+1, done=s<step, active=s===step;
          return (
            <div key={s} style={{ display:"flex", alignItems:"center", flex:i<lastIdx?1:"none" }}>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                <div style={{
                  width:30, height:30, borderRadius:"50%", flexShrink:0,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontFamily:FONT, fontSize:11, fontWeight:600, transition:"all .4s ease",
                  background: done?`linear-gradient(135deg,${SKY[700]},${SKY[400]})`:active?`linear-gradient(135deg,${SKY[500]},${SKY[300]})`:"rgba(255,255,255,.1)",
                  border: active?`2px solid ${SKY[300]}aa`:done?"2px solid transparent":"2px solid rgba(255,255,255,.2)",
                  color: done||active?"#fff":"rgba(180,215,255,.5)",
                  boxShadow: active?`0 0 16px rgba(14,165,233,.45)`:"none",
                }}>
                  {done ? (
                    <svg width="11" height="9" viewBox="0 0 13 11" fill="none">
                      <path d="M1.5 5.5L5 9L11.5 2" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : s}
                </div>
                <span style={{
                  fontSize:9, fontWeight:600, textTransform:"uppercase", letterSpacing:".08em",
                  fontFamily:FONT, whiteSpace:"nowrap",
                  color: active?`${SKY[300]}ee`:done?`${SKY[300]}88`:"rgba(180,215,255,.35)",
                }}>{lbl}</span>
              </div>
              {i<lastIdx && (
                <div style={{
                  flex:1, height:2, borderRadius:99, margin:"0 8px 18px",
                  background: step>s?`linear-gradient(90deg,${SKY[700]},${SKY[400]})`:"rgba(255,255,255,.1)",
                  boxShadow: step>s?"0 0 8px rgba(14,165,233,.3)":"none",
                }}/>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:5 }}>
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
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        flex:1, padding:"12px 24px", borderRadius:12, border:"none",
        cursor:disabled?"not-allowed":"pointer",
        fontFamily:FONT, fontSize:14, fontWeight:600, color:"#fff",
        transition:"all .3s ease",
        background:disabled?"rgba(14,165,233,.2)":`linear-gradient(135deg,${SKY[700]},${SKY[500]},${SKY[400]})`,
        boxShadow:disabled?"none":hov?"0 14px 44px rgba(14,165,233,.5)":"0 6px 26px rgba(14,165,233,.28)",
        transform:disabled?"none":hov?"translateY(-2px)":"translateY(0)",
        opacity:disabled?0.5:1,
        display:"flex", alignItems:"center", justifyContent:"center", gap:10,
      }}
    >{children}</button>
  );
}

function SecondaryBtn({ children, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        padding:"11px 22px", borderRadius:12,
        border:`1.5px solid ${hov?"rgba(255,255,255,.36)":"rgba(255,255,255,.18)"}`,
        cursor:"pointer", fontFamily:FONT, fontSize:13, fontWeight:400,
        color:hov?"#fff":"rgba(190,220,255,.7)",
        background:hov?"rgba(255,255,255,.12)":"rgba(255,255,255,.06)",
        transition:"all .28s ease", whiteSpace:"nowrap",
      }}
    >{children}</button>
  );
}

/* ═══════════════════════ ALREADY SUBMITTED ═════════════════════ */
function AlreadySubmittedScreen({ onDashboard, onHome }) {
  return (
    <div style={{ width:"100%", minHeight:"85vh", display:"flex", alignItems:"center", justifyContent:"center", padding:20,
      borderRadius:20, background:"rgba(255,255,255,0.08)", backdropFilter:"blur(28px)",
      border:"1px solid rgba(255,255,255,0.12)", boxShadow:"0 8px 32px rgba(0,0,0,0.3)" }}>
      <div style={{ background:"rgba(6,18,40,.6)", border:`1.5px solid rgba(14,165,233,.28)`, borderRadius:20,
        padding:"40px 32px", maxWidth:440, width:"100%", textAlign:"center",
        backdropFilter:"blur(36px)", boxShadow:"0 40px 100px rgba(0,0,0,.3)",
        animation:"popIn .5s cubic-bezier(.34,1.56,.64,1)" }}>
        <div style={{ width:80, height:80, borderRadius:"50%", margin:"0 auto 20px",
          background:`linear-gradient(135deg,${SKY[800]},${SKY[600]})`,
          display:"flex", alignItems:"center", justifyContent:"center",
          boxShadow:"0 0 36px rgba(14,165,233,.3)", animation:"float 3s ease infinite" }}>
          <svg width="34" height="34" viewBox="0 0 38 38" fill="none">
            <path d="M19 8v14M19 26v2" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
          </svg>
        </div>
        <h2 style={{ fontFamily:SERIF, fontSize:26, fontWeight:700, color:"#e8f0fe", marginBottom:10 }}>Already Submitted</h2>
        <p style={{ fontSize:13, color:"rgba(175,210,245,.58)", lineHeight:1.75, fontFamily:FONT, marginBottom:8 }}>
          You have already submitted your staff application.
        </p>
        <p style={{ fontSize:12, color:"rgba(140,190,240,.38)", lineHeight:1.7, fontFamily:FONT, marginBottom:28 }}>
          If you need to make changes, please contact the Randle &amp; Hopkins admin team directly.
        </p>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <PrimaryBtn onClick={onDashboard}>Go to Dashboard →</PrimaryBtn>
          <SecondaryBtn onClick={onHome}>Back to Home</SecondaryBtn>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════ SUCCESS MODAL ═════════════════════════ */
function SuccessModal({ onDashboard, onHome }) {
  return (
    <div style={{ width:"100%", minHeight:"85vh", display:"flex", alignItems:"center", justifyContent:"center", padding:20,
      borderRadius:20, background:"rgba(255,255,255,0.08)", backdropFilter:"blur(28px)",
      border:"1px solid rgba(255,255,255,0.12)", boxShadow:"0 8px 32px rgba(0,0,0,0.3)" }}>
      <div style={{ background:"rgba(6,18,40,.6)", border:`1.5px solid rgba(14,165,233,.28)`, borderRadius:20,
        padding:"40px 32px", maxWidth:420, width:"100%", textAlign:"center",
        backdropFilter:"blur(36px)", boxShadow:"0 40px 100px rgba(0,0,0,.3)",
        animation:"popIn .5s cubic-bezier(.34,1.56,.64,1)" }}>
        <div style={{ width:80, height:80, borderRadius:"50%", margin:"0 auto 20px",
          background:`linear-gradient(135deg,${SKY[800]},${SKY[500]})`,
          display:"flex", alignItems:"center", justifyContent:"center",
          animation:"pulse 2s ease infinite", boxShadow:"0 0 36px rgba(14,165,233,.44)" }}>
          <svg width="34" height="34" viewBox="0 0 38 38" fill="none">
            <path d="M8 20L15 27L30 12" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray="40" strokeDashoffset="40"
              style={{ animation:"checkDraw .7s .3s ease forwards" }}/>
          </svg>
        </div>
        <h2 style={{ fontFamily:SERIF, fontSize:28, fontWeight:700, color:"#e8f0fe", marginBottom:10 }}>Application Received!</h2>
        <p style={{ fontSize:13, color:"rgba(175,210,245,.58)", lineHeight:1.75, fontFamily:FONT, marginBottom:28 }}>
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
const YOE_OPTIONS = ["1 year","2 years","3 years","4 years","5 years","6 years","7 years","8 years","9 years","10 years","10+ years"];
const PRIMARY_SKILL_OPTIONS = ["Driver","Nurse","Teacher","Accountant","IT Technician","Farmer","Journalist","Lawyer","Engineer","Chef","Security Guard","Cleaner","Tailor","Electrician","Plumber","Other"];
const QUALIFICATION_OPTIONS = [
  { label:"SSCE / O-Level", value:"SSCE" },
  { label:"OND", value:"OND" },
  { label:"HND", value:"HND" },
  { label:"B.Sc / B.A", value:"B.Sc" },
  { label:"M.Sc / MBA", value:"M.Sc" },
  { label:"PhD / Doctorate", value:"PhD" },
  { label:"Vocational / Trade Cert.", value:"Vocational" },
  { label:"Professional Certification", value:"Professional Certification" },
  { label:"No Formal Education", value:"No Formal Education" },
];

/* ═══════════════════════ GRID HELPERS (pure inline) ════════════ */
const Grid2 = ({ children, style={} }) => (
  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, ...style }}>
    {children}
  </div>
);
const FullSpan = ({ children, style={} }) => (
  <div style={{ gridColumn:"1 / -1", ...style }}>{children}</div>
);

/* ═══════════════════════ MAIN COMPONENT ═══════════════════════ */
export function StaffForm({ onSubmit }) {
  const navigate             = useNavigate();
  const { user, updateUser } = useAuth();

  const [step,    setStep]    = useState(1);
  const [form,    setForm]    = useState(INIT);
  const [errs,    setErrs]    = useState({});
  const [animDir, setAnimDir] = useState("fwd");
  const [animKey, setAnimKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const [countries, setCountries] = useState([]);

  // ── NEW: photo compression state ──
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoMeta, setPhotoMeta] = useState(null);

  // ── Load countries synchronously from country-list package ──
  useEffect(() => {
    setCountries(getNames().sort());
  }, []);

  useEffect(() => {
    if (!user) return;
    setForm(prev=>({
      ...prev,
      surname:   user.surname     || "",
      otherName: user.otherNames  || "",
      email:     user.email       || "",
      phone:     user.phoneNumber || "",
    }));
  }, [user?.surname, user?.otherNames, user?.email, user?.phoneNumber]);

  const alreadySubmitted =
    user?.staffProfileSubmitted === true ||
    (() => { try { return JSON.parse(localStorage.getItem("user")||"{}").staffProfileSubmitted===true; } catch { return false; } })();

  const set = k => e => setForm(f=>({ ...f, [k]: e.target.type==="checkbox" ? e.target.checked : e.target.value }));

  // ── Progress % now also accounts for Job Experience + Photo ──
  const flatKeys = [...S1,...S2,...S3,...S5];
  const filledFlat = flatKeys.filter(k=>isReq(form[k])).length;
  const jobExpDone = form.noPriorExperience || form.jobExperience.some(e=>e.saved);
  const photoDone = !!form.profilePicture;
  const totalFields = flatKeys.length + 2; // +1 job experience, +1 photo
  const pct = Math.round(((filledFlat + (jobExpDone?1:0) + (photoDone?1:0)) / totalFields) * 100);

  const transition = (next, dir) => {
    setAnimDir(dir); setAnimKey(k=>k+1); setStep(next);
    window.scrollTo({ top:0, behavior:"smooth" });
  };

  // ── NEW: handle photo selection + compression ──
  const handlePhotoSelect = async (file) => {
    setPhotoUploading(true);
    setErrs(e=>({ ...e, profilePicture: undefined }));
    try {
      const { dataUrl, originalSizeKB, finalSizeKB } = await compressImage(file);
      setForm(f=>({ ...f, profilePicture: dataUrl }));
      setPhotoMeta({ originalSizeKB, finalSizeKB });
    } catch (err) {
      setErrs(e=>({ ...e, profilePicture: err.message || "Could not process image." }));
    } finally {
      setPhotoUploading(false);
    }
  };

  // ── NEW: Job Experience card handlers ──
  const updateJobEntry = (idx, k, v) =>
    setForm(f=>({ ...f, jobExperience: f.jobExperience.map((e,i)=> i===idx ? { ...e, [k]:v } : e) }));
  const saveJobEntry = (idx) =>
    setForm(f=>({ ...f, jobExperience: f.jobExperience.map((e,i)=> i===idx ? { ...e, saved:true } : e) }));
  const editJobEntry = (idx) =>
    setForm(f=>({ ...f, jobExperience: f.jobExperience.map((e,i)=> i===idx ? { ...e, saved:false } : e) }));
  const removeJobEntry = (idx) =>
    setForm(f=>({ ...f, jobExperience: f.jobExperience.length>1 ? f.jobExperience.filter((_,i)=>i!==idx) : f.jobExperience }));
  const addJobEntry = () =>
    setForm(f=>({ ...f, jobExperience: [...f.jobExperience, { ...emptyJobEntry }] }));

  const goNext = async () => {
    const locked = ["surname","otherName","email","phone"];

    // ── NEW: Step 4 (Job Experience) uses its own validator ──
    if (step === 4) {
      const jobErrs = validateJobExperience(form);
      if (jobErrs.hasError) { setErrs(jobErrs); return; }
      setErrs({});
      transition(step+1, "fwd");
      return;
    }

    const keys =
      step===1 ? S1.filter(k=>!locked.includes(k)) :
      step===2 ? S2 :
      step===3 ? S3 :
      S5; // step 5 (professional details)
    const e = validate(form, keys);
    if (step === 5 && !form.profilePicture) e.profilePicture = "Please upload a recent professional picture";
    if (Object.keys(e).length) { setErrs(e); return; }
    setErrs({});
    if (step < 5) { transition(step+1,"fwd"); return; }

    setLoading(true);
    try {
      const monthIndex = String(MONTHS.indexOf(form.dobMonth)+1).padStart(2,"0");
      const isoDate    = `${form.dobYear}-${monthIndex}-${form.dobDay}`;
      const yoeMap = {"1 year":1,"2 years":2,"3 years":3,"4 years":4,"5 years":5,"6 years":6,"7 years":7,"8 years":8,"9 years":9,"10 years":10,"10+ years":10};

      const payload = {
        surname:               form.surname,
        otherNames:            form.otherName,
        email:                 form.email,
        phoneNumber:           form.phone,
        nationality:           form.country,
        country:               form.country,
        homeAddress:           form.address,
        maritalStatus:         form.maritalStatus,
        languageSkill:         form.language,
        dateOfBirth:           isoDate,
        gender:                form.gender,
        disabled:              form.disabled,
        internallyDisplaced:   form.internallyDisplaced,

        // ── NEW: Next of Kin ──
        nextOfKin: {
          name:                    form.nokName,
          relationship:             form.nokRelationship,
          phoneNumber:              form.nokPhone,
          alternativePhoneNumber:   form.nokAltPhone,
          address:                  form.nokAddress,
        },

        // ── NEW: Job Experience & References ──
        hasNoPriorExperience: form.noPriorExperience,
        jobExperience: form.noPriorExperience ? [] : form.jobExperience
          .filter(e=>e.saved)
          .map(e => ({
            organization: e.organization,
            role:         e.role,
            from:         `${e.fromMonth} ${e.fromYear}`,
            to:           e.isCurrent ? "Present" : `${e.toMonth} ${e.toYear}`,
            isCurrent:    e.isCurrent,
            reference: {
              name:         e.refName,
              relationship: e.refRelationship,
              phone:        e.refPhone,
              email:        e.refEmail,
            },
          })),

        // ── NEW: Professional Picture (compressed) ──
        profilePicture:         form.profilePicture,

        primarySkills:         form.primarySkill,
        yearsOfExperience:     yoeMap[form.yearsExp] ?? 0,
        additionalSkills:      form.additionalSkills.join(", "),
        bio:                   form.bio,
        educationalQualification: form.qualification,
        agreedToPolicy:        form.agreed,
      };

      await apiStaffProfile(payload);

      updateUser({ ...payload, staffProfileSubmitted: true });
      localStorage.setItem("staffProfile", JSON.stringify(payload));
      localStorage.removeItem("staffRequestDraft");
      setDone(true);
      onSubmit?.(payload);
    } catch (err) {
      alert(err.message || "Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => { setErrs({}); transition(step-1,"back"); };

  const stepAnim = animDir==="fwd"
    ? { animation:"fadeUp .38s cubic-bezier(.4,0,.2,1) both" }
    : { animation:"fadeDown .38s cubic-bezier(.4,0,.2,1) both" };

  const STEP_META = [
    { title:"Personal Information",  sub:"Tell us who you are — all fields are required."   },
    { title:"Additional Details",    sub:"A few more things to complete your profile."       },
    { title:"Next of Kin",           sub:"Who should we contact in case of emergency?"       },
    { title:"Job Experience",        sub:"Help us verify your work history quickly."         },
    { title:"Professional Details",  sub:"Your skills and qualifications help us match you." },
  ];

  if (alreadySubmitted) return (
    <><style>{KEYFRAMES}</style>
    <AlreadySubmittedScreen
      onDashboard={()=>{ onSubmit?.(); navigate("/dashboard"); }}
      onHome={()=>{ onSubmit?.(); navigate("/"); }}
    /></>
  );

  if (done) return (
    <><style>{KEYFRAMES}</style>
    <SuccessModal onDashboard={()=>navigate("/dashboard")} onHome={()=>navigate("/")} /></>
  );

  return (
    <div style={{
      width:"100%", maxHeight:"85vh", overflowY:"auto", overflowX:"hidden",
      borderRadius:20, position:"relative",
      background:"rgba(255,255,255,0.08)",
      backdropFilter:"blur(28px) saturate(130%)",
      WebkitBackdropFilter:"blur(28px) saturate(130%)",
      border:"1px solid rgba(255,255,255,0.12)",
      boxShadow:"0 8px 32px rgba(0,0,0,0.3)",
    }}>
      <style>{KEYFRAMES}</style>

      {/* top accent line */}
      <div style={{ height:2, background:`linear-gradient(90deg,transparent,${SKY[500]}cc,${SKY[400]}88,transparent)` }}/>
      <div style={{ height:24 }}/>

      <div style={{ padding:"0 28px 32px", fontFamily:FONT }}>

        {/* ── Header ── */}
        <div style={{ marginBottom:18 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:`linear-gradient(135deg,${SKY[500]},${SKY[300]})`, boxShadow:`0 0 8px ${SKY[500]}88` }}/>
            <span style={{ fontSize:10, fontWeight:600, letterSpacing:".22em", textTransform:"uppercase", color:`${SKY[400]}dd`, fontFamily:FONT }}>
              Randle &amp; Hopkins
            </span>
          </div>
          <h1 style={{ fontFamily:SERIF, fontSize:28, fontWeight:700, color:"#e8f0fe", letterSpacing:"-.022em", lineHeight:1.12 }}>
            {STEP_META[step-1].title}
          </h1>
          <p style={{ fontSize:12, color:"rgba(155,200,240,.5)", marginTop:4, fontWeight:300, fontFamily:FONT }}>
            {STEP_META[step-1].sub}
          </p>
        </div>

        <Progress step={step} pct={pct}/>

        <div key={animKey} style={stepAnim}>

          {/* ── Step 1 ── */}
          {step===1 && (
            <Grid2>
              <LockedField label="Surname"       value={form.surname}   />
              <LockedField label="Other Name"    value={form.otherName} />
              <LockedField label="Email Address" value={form.email}     />
              <LockedField label="Phone Number"  value={form.phone}     />

              {/* Country full width */}
              <FullSpan>
                <div style={{ position:"relative" }}>
                  <select
                    style={errs.country ? sErr : sRest}
                    value={form.country} onChange={set("country")}
                  >
                    <option value="">Country *</option>
                    {countries.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                  <span style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", color:"rgba(180,215,255,.5)", fontSize:11 }}>▾</span>
                </div>
                {errs.country && <span style={ERR_ST}>{errs.country}</span>}
              </FullSpan>

              {/* Address full width */}
              <FullSpan>
                <InputField label="Home Address" value={form.address} onChange={set("address")} err={errs.address} req />
              </FullSpan>
            </Grid2>
          )}

          {/* ── Step 2 ── */}
          {step===2 && (
            <Grid2>
              <SelectField label="Marital Status" value={form.maritalStatus} onChange={set("maritalStatus")}
                err={errs.maritalStatus} req opts={["Single","Married","Divorced","Widowed","Separated"]} />
              <InputField label="Language Skill" value={form.language} onChange={set("language")} err={errs.language} req />

              {/* DOB full width */}
              <FullSpan>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr 1fr", gap:10 }}>
                  <DOBSelect value={form.dobDay}   onChange={set("dobDay")}   placeholder="Day *"            opts={DAYS}   hasErr={!!errs.dobDay}/>
                  <DOBSelect value={form.dobMonth} onChange={set("dobMonth")} placeholder="Month of Birth *" opts={MONTHS} hasErr={!!errs.dobMonth}/>
                  <DOBSelect value={form.dobYear}  onChange={set("dobYear")}  placeholder="Year *"           opts={YEARS}  hasErr={!!errs.dobYear}/>
                </div>
                {(errs.dobDay||errs.dobMonth||errs.dobYear) && <span style={ERR_ST}>Please select your complete date of birth</span>}
              </FullSpan>

              <FullSpan>
                <GenderToggle value={form.gender} onChange={v=>setForm(f=>({...f,gender:v}))} err={errs.gender}/>
              </FullSpan>

              <FullSpan>
                <div style={{ display:"flex", gap:24, flexWrap:"wrap" }}>
                  <StyledCheckbox checked={form.disabled} onToggle={()=>setForm(f=>({...f,disabled:!f.disabled}))} label="Disabled (optional)" />
                  <StyledCheckbox checked={form.internallyDisplaced} onToggle={()=>setForm(f=>({...f,internallyDisplaced:!f.internallyDisplaced}))} label="Internally Displaced (optional)" />
                </div>
              </FullSpan>
            </Grid2>
          )}

          {/* ── Step 3: Next of Kin (NEW) ── */}
          {step===3 && (
            <Grid2>
              <InputField label="Full Name" value={form.nokName} onChange={set("nokName")} err={errs.nokName} req />
              <SelectField label="Relationship to Applicant" value={form.nokRelationship} onChange={set("nokRelationship")}
                err={errs.nokRelationship} req opts={["Parent","Spouse","Sibling","Child","Guardian","Other"]} />
              <InputField label="Phone Number" value={form.nokPhone} onChange={set("nokPhone")} err={errs.nokPhone} req />
              <InputField label="Alternative Phone Number (optional)" value={form.nokAltPhone} onChange={set("nokAltPhone")} />
              <FullSpan>
                <InputField label="Home Address" value={form.nokAddress} onChange={set("nokAddress")} err={errs.nokAddress} req />
              </FullSpan>
            </Grid2>
          )}

          {/* ── Step 4: Job Experience (NEW) ── */}
          {step===4 && (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <StyledCheckbox
                checked={form.noPriorExperience}
                onToggle={()=>setForm(f=>({ ...f, noPriorExperience: !f.noPriorExperience }))}
                label="I have no prior work experience"
              />

              {!form.noPriorExperience && (
                <>
                  {form.jobExperience.map((entry, i) => (
                    <JobExperienceCard
                      key={i} entry={entry} index={i}
                      onChange={updateJobEntry}
                      onSave={saveJobEntry}
                      onEdit={editJobEntry}
                      onRemove={removeJobEntry}
                      showRemove={form.jobExperience.length>1}
                    />
                  ))}

                  {form.jobExperience[form.jobExperience.length-1]?.saved && (
                    <button type="button" onClick={addJobEntry} style={{
                      alignSelf:"flex-start", fontSize:12.5, color:SKY[300],
                      background:"none", border:"none", cursor:"pointer", fontFamily:FONT,
                    }}>
                      + Add Another Role
                    </button>
                  )}

                  {errs.jobExperienceGeneral && <span style={ERR_ST}>{errs.jobExperienceGeneral}</span>}
                </>
              )}
            </div>
          )}

          {/* ── Step 5: Professional Details ── */}
          {step===5 && (
            <Grid2>
              {/* NEW: Professional Picture */}
              <FullSpan>
                <PhotoUploadField
                  value={form.profilePicture} meta={photoMeta} uploading={photoUploading}
                  onFile={handlePhotoSelect} err={errs.profilePicture}
                />
              </FullSpan>

              <SelectField label="Primary Skill" value={form.primarySkill} onChange={set("primarySkill")}
                err={errs.primarySkill} req opts={PRIMARY_SKILL_OPTIONS} />
              <SelectField label="Years of Experience" value={form.yearsExp} onChange={set("yearsExp")}
                err={errs.yearsExp} req opts={YOE_OPTIONS} />

              <FullSpan>
                <AdditionalSkillsPicker value={form.additionalSkills} onChange={v=>setForm(f=>({...f,additionalSkills:v}))} err={errs.additionalSkills} />
              </FullSpan>

              <FullSpan>
                <TextareaField label="Bio" value={form.bio} onChange={set("bio")} rows={3} err={errs.bio} req />
              </FullSpan>

              <FullSpan>
                <div style={{ position:"relative" }}>
                  <select style={errs.qualification ? sErr : sRest} value={form.qualification} onChange={set("qualification")}>
                    <option value="">Educational Qualification *</option>
                    {QUALIFICATION_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <span style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", color:"rgba(180,215,255,.5)", fontSize:11 }}>▾</span>
                </div>
                {errs.qualification && <span style={ERR_ST}>{errs.qualification}</span>}
              </FullSpan>

              <FullSpan>
                <label style={{ display:"flex", alignItems:"flex-start", gap:12, cursor:"pointer" }}>
                  <div onClick={()=>setForm(f=>({...f,agreed:!f.agreed}))} style={{
                    flexShrink:0, marginTop:2, width:22, height:22, borderRadius:6, cursor:"pointer",
                    display:"flex", alignItems:"center", justifyContent:"center", transition:"all .28s ease",
                    background:form.agreed?`linear-gradient(135deg,${SKY[700]},${SKY[400]})`:"rgba(255,255,255,.1)",
                    border:form.agreed?`2px solid ${SKY[400]}bb`:"2px solid rgba(255,255,255,.22)",
                    boxShadow:form.agreed?"0 0 10px rgba(14,165,233,.28)":"none",
                  }}>
                    {form.agreed && (
                      <svg width="11" height="9" viewBox="0 0 12 10" fill="none">
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
              </FullSpan>
            </Grid2>
          )}
        </div>

        {/* ── Nav ── */}
        <div style={{ display:"flex", gap:12, marginTop:24 }}>
          {step > 1 && <SecondaryBtn onClick={goBack}>← Back</SecondaryBtn>}
          <PrimaryBtn onClick={goNext} disabled={loading}>
            {loading ? (
              <>
                <span style={{ width:15, height:15, border:"2.5px solid rgba(255,255,255,.25)", borderTopColor:"#fff", borderRadius:"50%", display:"inline-block", animation:"spin .75s linear infinite" }}/>
                Submitting…
              </>
            ) : step < 5 ? "Continue →" : "Submit Application"}
          </PrimaryBtn>
        </div>

        <p style={{ textAlign:"center", marginTop:12, fontSize:10, color:"rgba(150,190,230,.28)", letterSpacing:".05em", fontFamily:FONT }}>
          <span style={{ color:"rgba(125,211,252,.55)" }}>*</span> All fields are required
        </p>
      </div>

      <div style={{ height:1, background:"linear-gradient(90deg,transparent,rgba(14,165,233,.1),transparent)" }}/>
    </div>
  );
}

export default StaffForm;