import { useState } from "react";
import { Plus, Pencil, Trash2, Users, Save } from "lucide-react";
import {
  Pill, Avatar, Modal, Btn, FormField, inputCls, StarRating, SkillTagInput, EmptyState,
} from "../shared/adminUI";

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: Staff Registry
// Moved out of AdminPanel.jsx as-is — same props (state, dispatch), same
// dispatch actions (ADD_STAFF / UPDATE_STAFF / REMOVE_STAFF), no logic changes.
// This is the isolated file for future staff-section upgrades.
// ─────────────────────────────────────────────────────────────────────────────
export default function StaffSection({ state, dispatch }) {
  const [modal,   setModal]   = useState(null);
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

  const openEdit = (s) => { setEditing(s); setForm({ ...s, otherSkills: s.otherSkills ?? [] }); setModal("edit"); };
  const openAdd  = ()  => { setEditing(null); setForm({ name: "", role: "", phone: "", email: "", otherSkills: [] }); setModal("add"); };
  const close    = ()  => setModal(null);
  const handle   = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const save = () => {
    if (editing) dispatch({ type: "UPDATE_STAFF", payload: { ...editing, ...form } });
    else         dispatch({ type: "ADD_STAFF",    payload: form });
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

      <div className="block md:hidden space-y-3">
        {shown.map((s, idx) => (
          <div key={s.id ?? `staff-mob-${idx}`} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-3 mb-3">
              <Avatar name={s.name} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                <p className="text-xs text-gray-500">{s.role}</p>
              </div>
              <Pill label={s.status} color={s.status === "Available" ? "green" : "blue"} />
            </div>
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
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><Avatar name={s.name} /><span className="font-medium text-gray-900">{s.name}</span></div></td>
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

      <Modal open={!!modal} title={editing ? `Edit — ${editing.name}` : "Add new staff"} onClose={close}
        footer={<><Btn onClick={close}>Cancel</Btn><Btn variant="primary" onClick={save}><Save size={12} /> Save</Btn></>}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Full name">   <input name="name"  className={inputCls} value={form.name  || ""} onChange={handle} /></FormField>
          <FormField label="Primary role"><input name="role"  className={inputCls} value={form.role  || ""} onChange={handle} /></FormField>
          <FormField label="Phone">       <input name="phone" className={inputCls} value={form.phone || ""} onChange={handle} /></FormField>
          <FormField label="Email">       <input name="email" className={inputCls} value={form.email || ""} onChange={handle} /></FormField>
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
    </div>
  );
}
