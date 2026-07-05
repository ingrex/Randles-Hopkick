import { useState } from "react";
import { UserCheck, Eye } from "lucide-react";
import {
  Pill, Avatar, Modal, Btn, EmptyState, inputCls,
} from "../shared/adminUI";
import { statusColor, safeKey } from "./RequestsSection";

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: Registered Users
// Moved out of AdminPanel.jsx as-is — same props (state only, read-only section),
// no dispatch actions, no logic changes. Isolated for independent upgrades.
// ─────────────────────────────────────────────────────────────────────────────
export default function RegisteredSection({ state }) {
  const [search,  setSearch]  = useState("");
  const [modal,   setModal]   = useState(false);
  const [viewing, setViewing] = useState(null);

  const users = state.registeredUsers || [];
  const shown = search
    ? users.filter((u) =>
        `${u.surname} ${u.otherNames || ""}`.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  const reqCount = (email) => state.requests.filter((r) => r.email === email).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3">
        <input className={inputCls + " flex-1 max-w-xs"} placeholder="Search name or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <span className="text-xs text-gray-400 shrink-0">{users.length} user{users.length !== 1 ? "s" : ""}</span>
      </div>

      {users.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100">
          <EmptyState icon={UserCheck} title="No registered users yet" subtitle="Users who sign up on the website will appear here automatically." />
        </div>
      )}

      <div className="block md:hidden space-y-3">
        {shown.map((u, idx) => {
          const fullName = `${u.surname} ${u.otherNames || ""}`.trim();
          return (
            <div key={u.id ?? u._id ?? `reguser-mob-${idx}`} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-3 mb-2">
                <Avatar src={u.photoUrl} name={fullName} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{fullName}</p>
                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                  <p className="text-xs text-gray-400">{u.phoneNumber || "—"}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-400">
                  {u.registeredAt ? new Date(u.registeredAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                  <span className="ml-2 font-medium text-[#2385cd]">{reqCount(u.email)} requests</span>
                </div>
                <Btn variant="ghost" onClick={() => { setViewing(u); setModal(true); }}><Eye size={13} /> View</Btn>
              </div>
            </div>
          );
        })}
      </div>

      {shown.length > 0 && (
        <div className="hidden md:block bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#eaf4fc]/60 border-b border-[#b8d9f0]/50">
                  {["User", "Email", "Phone", "Registered", "Requests", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[#1a6fa8]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map((u, idx) => {
                  const fullName = `${u.surname} ${u.otherNames || ""}`.trim();
                  return (
                    <tr key={u.id ?? u._id ?? `reguser-desk-${idx}`} className="border-b border-gray-50 hover:bg-[#eaf4fc]/30 transition">
                      <td className="px-4 py-3"><div className="flex items-center gap-2"><Avatar src={u.photoUrl} name={fullName} /><span className="font-medium text-gray-900">{fullName}</span></div></td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{u.email}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{u.phoneNumber || "—"}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {u.registeredAt ? new Date(u.registeredAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </td>
                      <td className="px-4 py-3 text-center"><span className="font-medium text-[#2385cd]">{reqCount(u.email)}</span></td>
                      <td className="px-4 py-3"><Btn variant="ghost" onClick={() => { setViewing(u); setModal(true); }}><Eye size={13} /> View</Btn></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modal} title={viewing ? `Profile — ${`${viewing.surname} ${viewing.otherNames || ""}`.trim()}` : ""} onClose={() => setModal(false)} footer={<Btn onClick={() => setModal(false)}>Close</Btn>}>
        {viewing && (() => {
          const fullName = `${viewing.surname} ${viewing.otherNames || ""}`.trim();
          const userReqs = state.requests.filter((r) => r.email === viewing.email);
          return (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar src={viewing.photoUrl} name={fullName} size="md" />
                <div>
                  <p className="font-semibold text-gray-900">{fullName}</p>
                  <p className="text-xs text-gray-400 break-all">{viewing.email}</p>
                  <p className="text-xs text-gray-400">{viewing.phoneNumber || "—"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-gray-400">Registered</p><p className="font-medium">{viewing.registeredAt ? new Date(viewing.registeredAt).toLocaleDateString("en-GB") : "—"}</p></div>
                <div><p className="text-xs text-gray-400">Total requests</p><p className="font-medium text-[#2385cd]">{userReqs.length}</p></div>
              </div>
              {userReqs.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Submitted requests</p>
                  <div className="space-y-2">
                    {userReqs.map((r, ri) => {
                      const ds = r.status === "Rejected" ? "Declined" : r.status;
                      return (
                        <div key={safeKey(r, ri)} className="flex items-center justify-between p-2 bg-[#eaf4fc]/50 rounded-lg text-xs">
                          <div>
                            <p className="font-medium text-gray-800">{(r.roles || []).map((x) => `${x.role} ×${x.quantity}`).join(", ")}</p>
                            <p className="text-gray-400">{new Date(r.submittedAt).toLocaleDateString("en-GB")}</p>
                          </div>
                          <Pill label={ds} color={statusColor(ds)} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}