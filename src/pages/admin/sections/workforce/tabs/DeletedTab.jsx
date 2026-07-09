import { useState } from "react";
import { Btn, EmptyState, Avatar, Modal, FormField, inputCls } from "../../../shared/adminUI";
import { Archive, RotateCcw, Trash2, AlertTriangle } from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import { formatDate } from "../utils/workforceHelpers";

// Permanent delete is destructive and irreversible, so it gets its own
// type-to-confirm safeguard on top of the backend's Super-Admin-only gate
// (the frontend cannot enforce roles — this is a UI-level speed bump only).
function PermanentDeleteModal({ record, onClose, onConfirm }) {
  const [typed, setTyped] = useState("");
  if (!record) return null;
  const match = typed.trim().toLowerCase() === record.name.trim().toLowerCase();

  return (
    <Modal
      open={!!record}
      title="Permanently delete — this cannot be undone"
      onClose={onClose}
      footer={<><Btn onClick={onClose}>Cancel</Btn><Btn variant="danger" onClick={() => { onConfirm(record.id); setTyped(""); }} disabled={!match}>Delete permanently</Btn></>}
    >
      <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
        <AlertTriangle size={13} className="shrink-0 mt-0.5" />
        This removes {record.name}'s record entirely, including all history. This action cannot be reversed. Backend should restrict this to Super Admin accounts regardless of what this screen allows.
      </div>
      <FormField label={`Type "${record.name}" to confirm`}>
        <input className={inputCls} value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={record.name} />
      </FormField>
    </Modal>
  );
}

export default function DeletedTab({ deletedRecords, onRestore, onPermanentDelete }) {
  const [permanentTarget, setPermanentTarget] = useState(null);

  if (deletedRecords.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100">
        <EmptyState icon={Archive} title="No deleted records" subtitle="Soft-deleted staff and candidates will appear here, recoverable at any time." />
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs text-gray-500 bg-[#eaf4fc] border border-[#b8d9f0] rounded-lg px-3 py-2 mb-4">
        Deletion here is a soft delete — records are hidden from the pipeline but nothing is destroyed unless permanently deleted below.
      </p>
      <div className="space-y-3">
        {deletedRecords.map((r) => (
          <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar src={r.photoUrl} name={r.name} size="md" />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{r.name}</p>
                  <p className="text-xs text-gray-400">Deleted {formatDate(r.deletedAt)}</p>
                </div>
              </div>
              <StatusBadge status={r.employmentStatus} />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-gray-50">
              <Btn variant="brand" onClick={() => onRestore(r.id)}><RotateCcw size={12} /> Restore</Btn>
              <Btn variant="danger" onClick={() => setPermanentTarget(r)}><Trash2 size={12} /> Delete permanently</Btn>
            </div>
          </div>
        ))}
      </div>

      <PermanentDeleteModal
        record={permanentTarget}
        onClose={() => setPermanentTarget(null)}
        onConfirm={(id) => { onPermanentDelete(id); setPermanentTarget(null); }}
      />
    </div>
  );
}