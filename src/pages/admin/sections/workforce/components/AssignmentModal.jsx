import { useState } from "react";
import { Modal, Btn, FormField, inputCls } from "../../../shared/adminUI";
import { isAssignmentValid } from "../utils/workforceHelpers";

// Two-step assignment flow per spec §13: fill in client + date, review a
// confirmation summary, then save. The Assign button stays disabled until
// both required fields are present (spec §12).
export default function AssignmentModal({ open, record, onClose, onConfirm }) {
  const [client, setClient] = useState("");
  const [date, setDate]     = useState("");
  const [step, setStep]     = useState("form"); // "form" | "confirm"

  const reset = () => { setClient(""); setDate(""); setStep("form"); };
  const handleClose = () => { reset(); onClose(); };

  const valid = isAssignmentValid({ client, date });

  const handleSave = () => {
    onConfirm(client.trim(), date);
    reset();
  };

  if (!record) return null;

  return (
    <Modal
      open={open}
      title={`Assign — ${record.name}`}
      onClose={handleClose}
      footer={
        step === "form" ? (
          <><Btn onClick={handleClose}>Cancel</Btn><Btn variant="primary" onClick={() => setStep("confirm")} disabled={!valid}>Review</Btn></>
        ) : (
          <><Btn onClick={() => setStep("form")}>Back</Btn><Btn variant="success" onClick={handleSave}>Confirm assignment</Btn></>
        )
      }
    >
      {step === "form" ? (
        <>
          <FormField label="Client *">
            <input className={inputCls} value={client} onChange={(e) => setClient(e.target.value)} placeholder="Client or household name" />
          </FormField>
          <FormField label="Assignment date *">
            <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
          </FormField>
          {!valid && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              Both client and assignment date are required before this can be confirmed.
            </p>
          )}
        </>
      ) : (
        <div className="space-y-3 text-sm">
          <p className="text-xs text-gray-500">Please confirm the details before saving — this will be recorded against {record.name}'s assignment history.</p>
          <div className="bg-[#eaf4fc]/60 rounded-lg p-3 space-y-1.5">
            <p><span className="text-gray-400">Staff:</span> <strong>{record.name}</strong></p>
            <p><span className="text-gray-400">Client:</span> <strong>{client}</strong></p>
            <p><span className="text-gray-400">Start date:</span> <strong>{date}</strong></p>
          </div>
        </div>
      )}
    </Modal>
  );
}