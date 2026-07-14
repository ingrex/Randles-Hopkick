import { useState } from "react";
import { Plus, Pencil, Trash2, Users, Save, Eye, X } from "lucide-react";
import {
  Pill, Avatar, Modal, Btn, FormField, inputCls, StarRating, SkillTagInput, EmptyState,
} from "../shared/adminUI";

/* ─────────────────────────────────────────────────────────────────────────
   Small presentational helpers used only inside the profile view.
   Kept local to this file so we don't need to touch adminUI's exports.
   ───────────────────────────────────────────────────────────────────────── */

function SectionTitle({ children }) {
  return (
    <h4 className="text-xs font-semibold uppercase tracking-wide text-[#1a6fa8] mb-3">
      {children}
    </h4>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm text-gray-800 break-words">
        {value === undefined || value === null || value === "" ? (
          <span className="text-gray-300">—</span>
        ) : (
          String(value)
        )}
      </p>
    </div>
  );
}

function DetailGrid({ children }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>;
}

function ProfileSection({ title, children, show = true }) {
  if (!show) return null;
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <SectionTitle>{title}</SectionTitle>
      {children}
    </div>
  );
}

function hasContent(v) {
  if (Array.isArray(v)) return v.length > 0;
  if (v && typeof v === "object") return Object.values(v).some((x) => hasContent(x));
  return v !== undefined && v !== null && String(v).trim() !== "";
}

/* ── Job experience entry, read-only card ── */
function JobExperienceRow({ entry, idx }) {
  const duration = entry.isCurrent
    ? `${entry.from ?? ""} — Present`
    : `${entry.from ?? ""} — ${entry.to ?? ""}`;
  const ref = entry.reference ?? {};
  return (
    <div
      className={`py-3 ${idx > 0 ? "border-t border-gray-50" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900">
            {entry.role || "Role"} <span className="text-gray-400 font-normal">· {entry.organization || "—"}</span>
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{duration}</p>
        </div>
      </div>
      {(ref.name || ref.phone) && (
        <p className="text-xs text-gray-500 mt-1.5">
          Reference: {ref.name || "—"}{ref.relationship ? ` (${ref.relationship})` : ""}{ref.phone ? ` · ${ref.phone}` : ""}
        </p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Main component
   ───────────────────────────────────────────────────────────────────────── */

export default function StaffSection({ state, dispatch }) {
  const [modal,   setModal]   = useState(null); // "view" | "edit" | "add"
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState({});
  const [search,  setSearch]  = useState("");

  const shown = search
    ? state.staff.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.role.toLowerCase().includes(search.toLowerCase()) ||
        (s.otherSkills || []).some((sk) => sk.toLowerCase().includes(search.toLowerCase()))
      )
    : state.staff;

  const openView = (s) => { setEditing(s); setModal("view"); };
  const openEdit = (s) => { setEditing(s); setForm({ ...s, otherSkills: s.otherSkills ?? [] }); setModal("edit"); };
  const openAdd  = ()  => { setEditing(null); setForm({ name: "", role: "", phone: "", email: "", otherSkills: [] }); setModal("add"); };
  const close    = ()  => { setModal(null); setEditing(null); };
  const handle   = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const save = () => {
    if (modal === "edit") dispatch({ type: "UPDATE_STAFF", payload: { ...editing, ...form } });
    else                  dispatch({ type: "ADD_STAFF",    payload: form });
    close();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3">
        <input className={inputCls + " flex-1 max-w-xs"} placeholder="Search name, role, or skill…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Btn variant="primary" onClick={openAdd}><Plus size={13} /> Add staff</Btn>
      </div>

      {state.staff.length === 0 && !search && (
        <div className="bg-white rounded-xl border border-gray-100">
          <EmptyState icon={Users} title="No staff records yet" subtitle="Staff data will load from the backend. You can also add staff manually." />
        </div>
      )}

      {/* ── Mobile cards ── */}
      <div className="block md:hidden space-y-3">
        {shown.map((s, idx) => (
          <div key={s.id ?? `staff-mob-${idx}`} className="bg-white rounded-xl border border-gray-100 p-4">
            <button className="w-full text-left" onClick={() => openView(s)}>
              <div className="flex items-center gap-3 mb-3">
                {s.photoUrl ? (
                  <img src={s.photoUrl} alt={s.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <Avatar name={s.name} size="md" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                  <p className="text-xs text-gray-500">{s.role}</p>
                </div>
                <Pill label={s.status} color={s.status === "Available" ? "green" : "blue"} />
              </div>
            </button>
            {s.otherSkills?.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {s.otherSkills.map((sk, ski) => (
                  <span key={`sk-mob-${s.id ?? idx}-${ski}`} className="text-[10px] bg-[#eaf4fc] text-[#1a6fa8] border border-[#b8d9f0] rounded-full px-1.5 py-0.5">{sk}</span>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <StarRating rating={s.averageRating} />
                <span className="text-xs text-gray-400">{s.averageRating > 0 ? s.averageRating.toFixed(1) : "—"}</span>
              </div>
              <div className="flex gap-1">
                <Btn variant="ghost" onClick={() => openView(s)}><Eye size={13} /></Btn>
                <Btn variant="ghost" onClick={() => openEdit(s)}><Pencil size={13} /></Btn>
                <Btn variant="danger" onClick={() => dispatch({ type: "REMOVE_STAFF", id: s.id })}><Trash2 size={13} /></Btn>
              </div>
            </div>
            <div className="text-xs text-gray-400 mt-2 flex gap-3">
              <span>{s.phone}</span>
              <span className="truncate">{s.email}</span>
            </div>
          </div>
        ))}
        {shown.length === 0 && search && <p className="text-gray-400 text-sm text-center p-6 bg-white rounded-xl border border-gray-100">No staff found.</p>}
      </div>

      {/* ── Desktop table ── */}
      {shown.length > 0 && (
        <div className="hidden md:block bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#eaf4fc]/60 border-b border-[#b8d9f0]/50">
                  {["Name", "Primary Role", "Other Skills", "Phone", "Email", "Status", "Rating", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[#1a6fa8]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map((s, idx) => (
                  <tr key={s.id ?? `staff-desk-${idx}`} className="border-b border-gray-50 hover:bg-[#eaf4fc]/30 transition">
                    <td className="px-4 py-3">
                      <button className="flex items-center gap-2 text-left" onClick={() => openView(s)}>
                        {s.photoUrl ? (
                          <img src={s.photoUrl} alt={s.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <Avatar name={s.name} />
                        )}
                        <span className="font-medium text-gray-900 hover:underline">{s.name}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{s.role}</td>
                    <td className="px-4 py-3">
                      {s.otherSkills?.length > 0
                        ? <div className="flex flex-wrap gap-1">{s.otherSkills.map((sk, ski) => (
                            <span key={`sk-desk-${s.id ?? idx}-${ski}`} className="text-[10px] bg-[#eaf4fc] text-[#1a6fa8] border border-[#b8d9f0] rounded-full px-1.5 py-0.5">{sk}</span>
                          ))}</div>
                        : <span className="text-xs text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{s.phone}</td>
                    <td className="px-4 py-3 text-gray-600">{s.email}</td>
                    <td className="px-4 py-3"><Pill label={s.status} color={s.status === "Available" ? "green" : "blue"} /></td>
                    <td className="px-4 py-3 text-xs">
                      <div className="flex items-center gap-1">
                        <StarRating rating={s.averageRating} />
                        <span className="text-gray-400 ml-1">{s.averageRating > 0 ? s.averageRating.toFixed(1) : "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Btn variant="ghost" onClick={() => openView(s)}><Eye size={13} /></Btn>
                        <Btn variant="ghost" onClick={() => openEdit(s)}><Pencil size={13} /></Btn>
                        <Btn variant="danger" onClick={() => dispatch({ type: "REMOVE_STAFF", id: s.id })}><Trash2 size={13} /></Btn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Full profile — read only ── */}
      {modal === "view" && editing && (
        <Modal
          open
          title={editing.name || "Staff profile"}
          onClose={close}
          footer={
            <>
              <Btn onClick={close}><X size={12} /> Close</Btn>
              <Btn variant="primary" onClick={() => openEdit(editing)}><Pencil size={12} /> Edit</Btn>
            </>
          }
        >
          <div className="space-y-4">
            {/* header strip */}
            <div className="flex items-center gap-4 bg-[#eaf4fc]/40 border border-[#b8d9f0]/40 rounded-xl p-4">
              {editing.photoUrl ? (
                <img src={editing.photoUrl} alt={editing.name} className="w-16 h-16 rounded-full object-cover flex-shrink-0" />
              ) : (
                <Avatar name={editing.name} size="lg" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold text-gray-900 truncate">{editing.name}</p>
                <p className="text-sm text-gray-500">{editing.role || "—"}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Pill label={editing.status} color={editing.status === "Available" ? "green" : "blue"} />
                  <div className="flex items-center gap-1">
                    <StarRating rating={editing.averageRating} />
                    <span className="text-xs text-gray-400">
                      {editing.averageRating > 0 ? editing.averageRating.toFixed(1) : "—"} ({editing.totalReviews ?? 0})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <ProfileSection title="Contact & personal">
              <DetailGrid>
                <DetailRow label="Phone" value={editing.phone} />
                <DetailRow label="Email" value={editing.email} />
                <DetailRow label="Location / address" value={editing.location} />
                <DetailRow label="Nationality" value={editing.nationality} />
                <DetailRow label="State of origin" value={editing.stateOfOrigin} />
                <DetailRow label="LGA of origin" value={editing.lgaOfOrigin} />
                <DetailRow label="Country" value={editing.country} />
                <DetailRow label="Date of birth" value={editing.dateOfBirth} />
                <DetailRow label="Gender" value={editing.gender} />
                <DetailRow label="Marital status" value={editing.maritalStatus} />
                <DetailRow label="Disabled" value={editing.disabled ? "Yes" : editing.disabled === false ? "No" : undefined} />
                <DetailRow label="Internally displaced" value={editing.internallyDisplaced ? "Yes" : editing.internallyDisplaced === false ? "No" : undefined} />
              </DetailGrid>
            </ProfileSection>

            <ProfileSection title="Professional details">
              <DetailGrid>
                <DetailRow label="Primary role" value={editing.role} />
                <DetailRow label="Years of experience" value={editing.experience ? `${editing.experience} year(s)` : undefined} />
                <DetailRow label="Education" value={editing.education} />
                <DetailRow label="Languages" value={editing.languages} />
              </DetailGrid>
              {editing.otherSkills?.length > 0 && (
                <div className="mt-3">
                  <p className="text-[11px] text-gray-400 mb-1.5">Other / alternative skills</p>
                  <div className="flex flex-wrap gap-1">
                    {editing.otherSkills.map((sk, i) => (
                      <span key={`view-sk-${i}`} className="text-[10px] bg-[#eaf4fc] text-[#1a6fa8] border border-[#b8d9f0] rounded-full px-1.5 py-0.5">{sk}</span>
                    ))}
                  </div>
                </div>
              )}
              {editing.bio && (
                <div className="mt-3">
                  <p className="text-[11px] text-gray-400 mb-1">Bio</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{editing.bio}</p>
                </div>
              )}
            </ProfileSection>

            <ProfileSection title="Next of kin" show={hasContent(editing.nextOfKin)}>
              <DetailGrid>
                <DetailRow label="Name" value={editing.nextOfKin?.name} />
                <DetailRow label="Relationship" value={editing.nextOfKin?.relationship} />
                <DetailRow label="Phone" value={editing.nextOfKin?.phoneNumber} />
                <DetailRow label="Alternative phone" value={editing.nextOfKin?.alternativePhoneNumber} />
                <DetailRow label="Address" value={editing.nextOfKin?.address} />
              </DetailGrid>
            </ProfileSection>

            <ProfileSection title="Job experience" show={hasContent(editing.jobExperience)}>
              {(editing.jobExperience ?? []).map((entry, i) => (
                <JobExperienceRow key={i} entry={entry} idx={i} />
              ))}
            </ProfileSection>

            <ProfileSection title="Reviews" show={hasContent(editing.reviews)}>
              <div className="space-y-3">
                {(editing.reviews ?? []).map((rv, i) => (
                  <div key={i} className={`${i > 0 ? "pt-3 border-t border-gray-50" : ""}`}>
                    <div className="flex items-center justify-between">
                      <StarRating rating={rv.rating} />
                      <span className="text-[11px] text-gray-400">
                        {rv.submittedAt ? new Date(rv.submittedAt).toLocaleDateString() : ""}
                      </span>
                    </div>
                    {rv.comment && <p className="text-sm text-gray-700 mt-1">{rv.comment}</p>}
                  </div>
                ))}
              </div>
            </ProfileSection>
          </div>
        </Modal>
      )}

      {/* ── Edit / Add — admin-editable fields only ── */}
      {(modal === "edit" || modal === "add") && (
        <Modal open title={editing ? `Edit — ${editing.name}` : "Add new staff"} onClose={close}
          footer={<><Btn onClick={close}>Cancel</Btn><Btn variant="primary" onClick={save}><Save size={12} /> Save</Btn></>}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Full name">    <input name="name"     className={inputCls} value={form.name     || ""} onChange={handle} /></FormField>
            <FormField label="Primary role"> <input name="role"     className={inputCls} value={form.role     || ""} onChange={handle} /></FormField>
            <FormField label="Phone">        <input name="phone"    className={inputCls} value={form.phone    || ""} onChange={handle} /></FormField>
            <FormField label="Email">        <input name="email"    className={inputCls} value={form.email    || ""} onChange={handle} /></FormField>
            <FormField label="Location">     <input name="location" className={inputCls} value={form.location || ""} onChange={handle} /></FormField>
            <FormField label="Years of experience">
              <input name="experience" type="number" min="0" className={inputCls} value={form.experience ?? ""} onChange={handle} />
            </FormField>
            {editing && (
              <FormField label="Status">
                <select name="status" className={inputCls} value={form.status || "Available"} onChange={handle}>
                  <option>Available</option>
                  <option>Active</option>
                </select>
              </FormField>
            )}
          </div>
          <FormField label="Other / alternative skills">
            <SkillTagInput value={form.otherSkills || []} onChange={(tags) => setForm((p) => ({ ...p, otherSkills: tags }))} />
          </FormField>
        </Modal>
      )}
    </div>
  );
}