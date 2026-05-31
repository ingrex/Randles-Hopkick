// src/pages/Profile.jsx
import { useState, useEffect, useRef } from "react";
import {
  User, Home, Briefcase, Mail, Phone, Globe, Heart, Languages,
  Calendar, MapPin, Wrench, Clock, GraduationCap, Sparkles,
  FileText, Camera, ClipboardList, AlertTriangle,
  ShieldCheck, ArrowLeft, BadgeCheck, Star,
} from "lucide-react";
import { useAuth } from "./AuthContext";
import { apiGetProfile } from "../api/auth";

const SKY = {
  100: "#e0f2fe", 200: "#bae6fd", 300: "#7dd3fc",
  400: "#38bdf8", 500: "#0ea5e9", 600: "#0284c7",
  700: "#0369a1", 800: "#075985",
};
const FONT  = "'Outfit', sans-serif";
const SERIF = "'Cormorant Garamond', serif";

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Outfit:wght@300;400;500;600;700&display=swap');

@keyframes fadeUp  { from { opacity:0; transform:translateY(22px) } to { opacity:1; transform:translateY(0) } }
@keyframes slideIn { from { opacity:0; transform:translateX(-16px) } to { opacity:1; transform:translateX(0) } }
@keyframes pulse   { 0%,100% { box-shadow:0 0 0 0 rgba(14,165,233,.4) } 50% { box-shadow:0 0 10px rgba(14,165,233,0) } }
@keyframes spin    { to { transform:rotate(360deg) } }
@keyframes float   { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-7px) } }

.pf-card  { animation: fadeUp  .5s cubic-bezier(.4,0,.2,1) both; }
.pf-field { animation: slideIn .4s cubic-bezier(.4,0,.2,1) both; }

.pf-section {
  background: rgba(255,255,255,.055);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 20px;
  padding: 24px 26px;
  position: relative;
  overflow: hidden;
  transition: border-color .3s ease;
}
.pf-section:hover  { border-color: rgba(14,165,233,.2); }
.pf-section-accent { border-color: rgba(14,165,233,.18) !important; }

.pf-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(14,165,233,.16), transparent);
  margin: 8px 0;
}

.pf-tag {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 4px 11px; border-radius: 99px;
  font-size: 11px; font-weight: 500; letter-spacing: .04em;
  font-family: 'Outfit', sans-serif;
}
.pf-tag-blue  { background: rgba(14,165,233,.13); border: 1px solid rgba(14,165,233,.28); color: #7dd3fc; }
.pf-tag-green { background: rgba(34,197,94,.11);  border: 1px solid rgba(34,197,94,.25);  color: #86efac; }
.pf-tag-amber { background: rgba(251,191,36,.1);  border: 1px solid rgba(251,191,36,.22); color: #fde68a; }

.pf-back-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 15px; border-radius: 99px;
  background: rgba(255,255,255,.07);
  border: 1px solid rgba(255,255,255,.13);
  color: rgba(190,220,255,.65); font-size: 12px;
  font-family: 'Outfit', sans-serif;
  cursor: pointer; transition: all .25s;
}
.pf-back-btn:hover { background: rgba(255,255,255,.12); color: rgba(210,235,255,.85); }

.pf-admin-notice {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 12px 16px; border-radius: 13px;
  background: rgba(14,165,233,.06);
  border: 1px solid rgba(14,165,233,.16);
  margin-bottom: 0;
}

/* ── responsive ── */
@media (max-width: 720px) {
  .pf-main-grid  { grid-template-columns: 1fr !important; }
  .pf-staff-grid { grid-template-columns: 1fr 1fr !important; }
  .pf-hero-row   { flex-direction: column !important; align-items: flex-start !important; gap: 18px !important; }
  .pf-stat-row   { gap: 8px !important; width: 100%; }
  .pf-stat-card  { padding: 12px 10px !important; }
  /* mobile header is h-16 = 64px */
  .pf-root       { padding-top: 64px !important; }
}
@media (max-width: 480px) {
  .pf-staff-grid { grid-template-columns: 1fr !important; }
  .pf-hero-name  { font-size: 22px !important; }
  .pf-stat-row   { flex-wrap: wrap !important; }
}
`;

/* ── helpers ── */
function getInitials(sur = "", other = "") {
  return [(sur[0] || ""), (other[0] || "")].filter(Boolean).join("").toUpperCase() || "?";
}
function fmtDate(iso) {
  if (!iso) return null;
  try { return new Date(iso).toLocaleDateString("en-GB", { day:"2-digit", month:"long", year:"numeric" }); }
  catch { return iso; }
}
function yearsLabel(n) {
  if (n === undefined || n === null) return null;
  if (n === 0)  return "< 1 year";
  if (n <= 2)   return "1 – 2 years";
  if (n <= 5)   return "3 – 5 years";
  if (n <= 10)  return "6 – 10 years";
  return "10+ years";
}

/* ── sub-components ── */
function Spinner({ size = 16 }) {
  return (
    <span style={{
      width: size, height: size, flexShrink: 0,
      border: `2px solid rgba(14,165,233,.2)`,
      borderTopColor: SKY[400], borderRadius: "50%",
      display: "inline-block", animation: "spin .7s linear infinite",
    }}/>
  );
}

function FieldRow({ label, value, icon: Icon, delay = 0, accent = false }) {
  const empty = !value;
  return (
    <div className="pf-field" style={{ animationDelay:`${delay}ms`, display:"flex", flexDirection:"column", gap:4, minWidth:0 }}>
      <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:9, fontWeight:600, textTransform:"uppercase", letterSpacing:".16em", color:"rgba(140,190,240,.48)", fontFamily:FONT }}>
        {Icon && <Icon size={9} strokeWidth={2.5} style={{ flexShrink:0 }}/>}
        {label}
      </span>
      <span style={{ fontSize:13, fontWeight: accent ? 600 : 400, fontFamily:FONT, wordBreak:"break-word", lineHeight:1.55, color: empty ? "rgba(140,185,220,.28)" : accent ? SKY[300] : "rgba(210,235,255,.82)", fontStyle: empty ? "italic" : "normal" }}>
        {empty ? "Not provided" : value}
      </span>
    </div>
  );
}

function SectionCard({ title, subtitle, icon, children, delay = 0, accent = false }) {
  return (
    <div className={`pf-section pf-card${accent ? " pf-section-accent" : ""}`} style={{ animationDelay:`${delay}ms` }}>
      {accent && <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,transparent,${SKY[500]}cc,${SKY[400]}88,transparent)` }}/>}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16, gap:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:10, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", background:`linear-gradient(135deg,${SKY[800]},${SKY[600]})`, color:"#fff" }}>
            {icon}
          </div>
          <div>
            <h3 style={{ fontFamily:SERIF, fontSize:17, fontWeight:600, color:"#e8f0fe", letterSpacing:"-.01em", margin:0 }}>{title}</h3>
            {subtitle && <p style={{ fontFamily:FONT, fontSize:11, color:"rgba(140,190,240,.42)", margin:"2px 0 0" }}>{subtitle}</p>}
          </div>
        </div>
      </div>
      <div className="pf-divider"/>
      <div style={{ marginTop:16 }}>{children}</div>
    </div>
  );
}

function StatCard({ label, value, icon, delay = 0 }) {
  return (
    <div className="pf-stat-card pf-card" style={{ animationDelay:`${delay}ms`, flex:1, minWidth:0, background:"rgba(255,255,255,.055)", border:"1px solid rgba(255,255,255,.09)", borderRadius:16, padding:"14px 13px", display:"flex", flexDirection:"column", gap:6 }}>
      <div style={{ color: SKY[400] }}>{icon}</div>
      <span style={{ fontFamily:SERIF, fontSize:17, fontWeight:600, color:"#e8f0fe", lineHeight:1.2 }}>{value || "—"}</span>
      <span style={{ fontFamily:FONT, fontSize:9, fontWeight:600, textTransform:"uppercase", letterSpacing:".12em", color:"rgba(140,190,240,.42)" }}>{label}</span>
    </div>
  );
}

function AdminNotice() {
  return (
    <div className="pf-admin-notice">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink:0, marginTop:1 }}>
        <rect x="1.5" y="3.5" width="15" height="11" rx="2" stroke={SKY[400]} strokeWidth="1.5"/>
        <path d="M1.5 6l7.5 5 7.5-5" stroke={SKY[400]} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      <div>
        <p style={{ fontFamily:FONT, fontSize:11, fontWeight:600, color:`${SKY[300]}bb`, margin:"0 0 2px", textTransform:"uppercase", letterSpacing:".1em" }}>Need to update your details?</p>
        <p style={{ fontFamily:FONT, fontSize:12, color:"rgba(175,210,245,.5)", margin:0, fontWeight:300, lineHeight:1.55 }}>
          Profile details can only be changed by contacting our admin team at{" "}
          <span style={{ color:SKY[300], fontWeight:500 }}>info@randleandhopkick.com</span>.
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════ MAIN COMPONENT ══════════════════════════ */
export function Profile({ onNavigate }) {
  const { user } = useAuth();
  const [staffData,    setStaffData]    = useState(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError,   setFetchError]   = useState("");

  const fileRef = useRef();
  const [avatarUrl, setAvatarUrl] = useState(() => {
    try { return JSON.parse(localStorage.getItem("userProfile") || "{}").photoUrl || ""; }
    catch { return ""; }
  });

  useEffect(() => {
    (async () => {
      setFetchLoading(true);
      try {
        const data    = await apiGetProfile();
        const profile = data?.profile || data?.staffProfile || data?.staff || data || {};
        const merged  = { ...profile };
        const staffFields = [
          "nationality","homeAddress","maritalStatus","languageSkill","dateOfBirth",
          "gender","disabled","internallyDisplaced","primarySkills","yearsOfExperience",
          "additionalSkills","bio","educationalQualification","agreedToPolicy",
        ];
        if (user) {
          staffFields.forEach(k => { if (!merged[k] && user[k] != null) merged[k] = user[k]; });
        }
        setStaffData(merged);
      } catch {
        if (user) {
          setStaffData({
            nationality: user.nationality, homeAddress: user.homeAddress,
            maritalStatus: user.maritalStatus, languageSkill: user.languageSkill,
            dateOfBirth: user.dateOfBirth, gender: user.gender,
            disabled: user.disabled, internallyDisplaced: user.internallyDisplaced,
            primarySkills: user.primarySkills, yearsOfExperience: user.yearsOfExperience,
            additionalSkills: user.additionalSkills, bio: user.bio,
            educationalQualification: user.educationalQualification,
            agreedToPolicy: user.agreedToPolicy,
          });
        } else {
          setFetchError("Could not load profile data.");
        }
      } finally {
        setFetchLoading(false);
      }
    })();
  }, [user]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result;
      setAvatarUrl(url);
      try {
        const existing = JSON.parse(localStorage.getItem("userProfile") || "{}");
        localStorage.setItem("userProfile", JSON.stringify({ ...existing, photoUrl: url }));
      } catch {}
    };
    reader.readAsDataURL(file);
  };

  const displayName   = [user?.surname, user?.otherNames].filter(Boolean).join(" ") || "Your Name";
  const hasStaffData  = staffData && Object.values(staffData).some(v => v != null && v !== "");
  const staffComplete = !!(user?.staffProfileSubmitted || (staffData?.primarySkills && staffData?.bio));
  const skillTags = [
    staffData?.primarySkills,
    ...(staffData?.additionalSkills?.split(/[,;]/)?.map(s => s.trim()).filter(Boolean) || []),
  ].filter(Boolean);

  return (

    <div
      className="pf-root"
      style={{
    minHeight: "100vh",
    background: "#03080f",
    fontFamily: FONT,
    paddingTop: "80px",  
      }}
    >
      <style>{STYLES}</style>

      {/* decorative glows — absolute, never fixed */}
      <div style={{ position:"absolute", width:500, height:500, top:0, right:-110, borderRadius:"50%", filter:"blur(95px)", background:"radial-gradient(circle,rgba(14,165,233,.15),transparent)", pointerEvents:"none", zIndex:0 }}/>
      <div style={{ position:"absolute", width:360, height:360, bottom:30, left:-90, borderRadius:"50%", filter:"blur(85px)", background:"radial-gradient(circle,rgba(3,104,172,.12),transparent)", pointerEvents:"none", zIndex:0 }}/>

      {/* page content */}
      <div
        style={{
          maxWidth: 1020, margin: "0 auto",
          padding: "24px 22px 60px",
          position: "relative", zIndex: 1,
        }}
      >

        {/* ── HERO CARD ── */}
        <div className="pf-card" style={{ animationDelay:"0ms", marginBottom:24, padding:"26px 28px 24px", background:"rgba(255,255,255,.05)", backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)", border:"1px solid rgba(255,255,255,.1)", borderRadius:24, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,transparent,${SKY[500]},${SKY[400]}88,transparent)` }}/>

          <div className="pf-hero-row" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:20 }}>
            {/* avatar */}
            <div style={{ display:"flex", alignItems:"center", gap:18 }}>
              <div style={{ position:"relative", cursor:"pointer", flexShrink:0 }} onClick={() => fileRef.current?.click()} title="Click to change photo">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile photo" style={{ width:76, height:76, borderRadius:"50%", objectFit:"cover", border:`2.5px solid ${SKY[500]}88`, boxShadow:`0 0 22px rgba(14,165,233,.22)` }}/>
                ) : (
                  <div style={{ width:76, height:76, borderRadius:"50%", background:`linear-gradient(135deg,${SKY[800]},${SKY[500]})`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:SERIF, fontSize:26, fontWeight:700, color:"#fff", border:`2.5px solid ${SKY[500]}66`, boxShadow:`0 0 22px rgba(14,165,233,.2)`, animation:"pulse 3s ease infinite" }}>
                    {getInitials(user?.surname, user?.otherNames)}
                  </div>
                )}
                <div style={{ position:"absolute", bottom:1, right:1, width:22, height:22, borderRadius:"50%", background:`linear-gradient(135deg,${SKY[700]},${SKY[500]})`, display:"flex", alignItems:"center", justifyContent:"center", border:"2px solid #03080f", color:"#fff" }}>
                  <Camera size={11} strokeWidth={2.5}/>
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleAvatarChange}/>
              </div>

              <div>
                <h1 className="pf-hero-name" style={{ fontFamily:SERIF, fontSize:28, fontWeight:700, color:"#e8f0fe", letterSpacing:"-.022em", margin:0, lineHeight:1.1 }}>{displayName}</h1>
                <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", gap:7, marginTop:7 }}>
                  <span className={`pf-tag ${staffComplete ? "pf-tag-green" : "pf-tag-amber"}`}>
                    {staffComplete ? <><BadgeCheck size={11} strokeWidth={2.5}/> Staff Verified</> : <><AlertTriangle size={11} strokeWidth={2.5}/> Complete Profile</>}
                  </span>
                  {staffData?.primarySkills && (
                    <span className="pf-tag pf-tag-blue"><Wrench size={10} strokeWidth={2.5}/> {staffData.primarySkills}</span>
                  )}
                </div>
                <p style={{ fontFamily:FONT, fontSize:11, color:"rgba(140,190,240,.4)", marginTop:6 }}>
                  Member since {user?.createdAt ? fmtDate(user.createdAt) : "N/A"}
                </p>
              </div>
            </div>

            {/* stat cards */}
            <div className="pf-stat-row" style={{ display:"flex", gap:11, flexShrink:0 }}>
              <StatCard delay={80}  icon={<GraduationCap size={18} strokeWidth={1.8}/>} label="Qualification" value={staffData?.educationalQualification}/>
              <StatCard delay={130} icon={<Clock         size={18} strokeWidth={1.8}/>} label="Experience"    value={yearsLabel(staffData?.yearsOfExperience)}/>
              <StatCard delay={180} icon={<Globe         size={18} strokeWidth={1.8}/>} label="Nationality"   value={staffData?.nationality}/>
            </div>
          </div>

          {staffData?.bio && (
            <div style={{ marginTop:18, padding:"11px 16px", background:"rgba(14,165,233,.06)", borderRadius:12, border:"1px solid rgba(14,165,233,.14)", display:"flex", gap:10, alignItems:"flex-start" }}>
              <FileText size={14} strokeWidth={1.8} style={{ color:SKY[400], flexShrink:0, marginTop:2 }}/>
              <p style={{ fontFamily:FONT, fontSize:12, color:"rgba(190,225,255,.6)", lineHeight:1.75, margin:0, fontStyle:"italic" }}>"{staffData.bio}"</p>
            </div>
          )}
        </div>

        {/* ── GRID ── */}
        <div className="pf-main-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>

          <SectionCard title="Personal Information" subtitle="From your registration" icon={<User size={17} strokeWidth={2}/>} delay={100} accent>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              <FieldRow label="Surname"     value={user?.surname}     delay={40}  icon={Star} accent/>
              <FieldRow label="Other Names" value={user?.otherNames}  delay={70}  icon={Star} accent/>
              <FieldRow label="Email"       value={user?.email}       delay={100} icon={Mail}/>
              <FieldRow label="Phone"       value={user?.phoneNumber} delay={130} icon={Phone}/>
            </div>
            <div style={{ marginTop:16 }}><AdminNotice /></div>
          </SectionCard>

          <SectionCard title="Personal Details" subtitle="Demographics & location" icon={<Home size={17} strokeWidth={2}/>} delay={140}>
            {fetchLoading ? (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:24, gap:10 }}>
                <Spinner/><span style={{ fontFamily:FONT, fontSize:12, color:"rgba(140,190,240,.45)" }}>Loading…</span>
              </div>
            ) : fetchError ? (
              <div style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 0" }}>
                <AlertTriangle size={13} style={{ color:"rgba(252,165,165,.7)", flexShrink:0 }}/>
                <p style={{ fontFamily:FONT, fontSize:12, color:"rgba(252,165,165,.7)", margin:0 }}>{fetchError}</p>
              </div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                <FieldRow label="Nationality"    value={staffData?.nationality}   delay={50}  icon={Globe}/>
                <FieldRow label="Marital Status" value={staffData?.maritalStatus} delay={80}  icon={Heart}/>
                <FieldRow label="Gender"         value={staffData?.gender}        delay={110} icon={User}/>
                <FieldRow label="Language Skill" value={staffData?.languageSkill} delay={140} icon={Languages}/>
                <div style={{ gridColumn:"1/-1" }}>
                  <FieldRow label="Date of Birth" value={fmtDate(staffData?.dateOfBirth)} delay={170} icon={Calendar}/>
                </div>
                <div style={{ gridColumn:"1/-1" }}>
                  <FieldRow label="Home Address" value={staffData?.homeAddress} delay={200} icon={MapPin}/>
                </div>
              </div>
            )}
          </SectionCard>

          {/* Staff Profile — full width */}
          <div style={{ gridColumn:"1 / -1" }}>
            <SectionCard title="Staff Profile" subtitle="Your professional details registered with Randle & Hopkins" icon={<Briefcase size={17} strokeWidth={2}/>} delay={180} accent>
              {fetchLoading ? (
                <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:36, gap:10 }}>
                  <Spinner size={18}/><span style={{ fontFamily:FONT, fontSize:13, color:"rgba(140,190,240,.45)" }}>Fetching staff details…</span>
                </div>
              ) : (
                <div>
                  {skillTags.length > 0 && (
                    <div style={{ display:"flex", flexWrap:"wrap", gap:7, marginBottom:20, padding:"11px 14px", background:"rgba(14,165,233,.055)", borderRadius:12, border:"1px solid rgba(14,165,233,.12)" }}>
                      {skillTags.map((s, i) => (
                        <span key={i} className="pf-tag pf-tag-blue"><Wrench size={10} strokeWidth={2.5}/> {s}</span>
                      ))}
                    </div>
                  )}

                  <div className="pf-staff-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:18 }}>
                    <FieldRow label="Primary Skill"    value={staffData?.primarySkills}                delay={50}  icon={Wrench}        accent/>
                    <FieldRow label="Years Experience" value={yearsLabel(staffData?.yearsOfExperience)} delay={80}  icon={Clock}/>
                    <FieldRow label="Qualification"    value={staffData?.educationalQualification}      delay={110} icon={GraduationCap}/>
                    <FieldRow label="Nationality"      value={staffData?.nationality}                   delay={140} icon={Globe}/>
                    <FieldRow label="Marital Status"   value={staffData?.maritalStatus}                 delay={170} icon={Heart}/>
                    <FieldRow label="Gender"           value={staffData?.gender}                        delay={200} icon={User}/>
                    <FieldRow label="Language Skill"   value={staffData?.languageSkill}                 delay={230} icon={Languages}/>
                    <FieldRow label="Date of Birth"    value={fmtDate(staffData?.dateOfBirth)}          delay={260} icon={Calendar}/>
                    <FieldRow label="Home Address"     value={staffData?.homeAddress}                   delay={290} icon={MapPin}/>
                  </div>

                  {staffData?.additionalSkills && (
                    <>
                      <div className="pf-divider" style={{ margin:"18px 0 14px" }}/>
                      <FieldRow label="Additional Skills" value={staffData.additionalSkills} delay={310} icon={Sparkles}/>
                    </>
                  )}

                  {staffData?.bio && (
                    <>
                      <div className="pf-divider" style={{ margin:"18px 0 14px" }}/>
                      <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:9, fontWeight:600, textTransform:"uppercase", letterSpacing:".16em", color:"rgba(140,190,240,.48)", fontFamily:FONT, marginBottom:8 }}>
                        <FileText size={9} strokeWidth={2.5}/> Professional Bio
                      </span>
                      <p style={{ fontFamily:FONT, fontSize:13, color:"rgba(200,230,255,.68)", lineHeight:1.8, margin:0, padding:"12px 16px", background:"rgba(14,165,233,.05)", borderRadius:10, border:"1px solid rgba(14,165,233,.1)", fontStyle:"italic" }}>
                        {staffData.bio}
                      </p>
                    </>
                  )}

                  {!hasStaffData && !fetchError && (
                    <div style={{ textAlign:"center", padding:"28px 0" }}>
                      <div style={{ display:"flex", justifyContent:"center", marginBottom:12, color:"rgba(140,190,240,.3)", animation:"float 3s ease infinite" }}>
                        <ClipboardList size={40} strokeWidth={1.4}/>
                      </div>
                      <p style={{ fontFamily:FONT, fontSize:13, color:"rgba(140,190,240,.45)", margin:0 }}>No staff profile found.</p>
                      <p style={{ fontFamily:FONT, fontSize:11, color:"rgba(140,190,240,.28)", margin:"5px 0 0" }}>Submit the Staff Registration form to complete your profile.</p>
                    </div>
                  )}

                  {hasStaffData && <div style={{ marginTop:22 }}><AdminNotice /></div>}
                </div>
              )}

              {staffData?.agreedToPolicy && (
                <div style={{ marginTop:20, display:"flex", alignItems:"center", gap:8, padding:"9px 14px", background:"rgba(34,197,94,.07)", border:"1px solid rgba(34,197,94,.17)", borderRadius:10, flexWrap:"wrap" }}>
                  <ShieldCheck size={14} style={{ color:"#86efac", flexShrink:0 }} strokeWidth={2}/>
                  <span className="pf-tag pf-tag-green" style={{ fontSize:10 }}>Terms &amp; Policy Agreed</span>
                  <span style={{ fontFamily:FONT, fontSize:11, color:"rgba(134,239,172,.48)" }}>You have accepted Randle &amp; Hopkins's terms and privacy policy.</span>
                </div>
              )}
            </SectionCard>
          </div>

        </div>{/* end grid */}

        <p style={{ textAlign:"center", marginTop:28, fontSize:10, color:"rgba(140,190,240,.2)", letterSpacing:".06em", fontFamily:FONT }}>
          Randle &amp; Hopkins · Profile data is encrypted and secure
        </p>
      </div>
    </div>
  );
}

export default Profile;