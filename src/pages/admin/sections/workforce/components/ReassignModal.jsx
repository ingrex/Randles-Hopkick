import { useState } from "react";
import { Modal, Btn, FormField, inputCls } from "../../../shared/adminUI";

export default function ReassignModal({ open, currentClient, onClose, onConfirm }) {
  const [newClient, setNewClient]     = useState("");
  const [reason, setReason]           = useState("");
  const [sentiment, setSentiment]     = useState("positive");
  const [managerNote, setManagerNote] = useState("");

  const reset = () => { setNewClient(""); setReason(""); setSentiment("positive"); setManagerNote(""); };
  const handleClose = () => { reset(); onClose(); };
  const handleConfirm = () => {
    onConfirm(newClient.trim() || null, reason.trim(), sentiment, managerNote.trim());
    reset();
  };

  return (
    <Modal
      open={open}
      title="Reassign / end assignment"
      onClose={handleClose}
      footer={<><Btn onClick={handleClose}>Cancel</Btn><Btn variant="primary" onClick={handleConfirm} disabled={!reason.trim()}>Save</Btn></>}
    >
      <p className="text-xs text-gray-500">
        Closing current assignment{currentClient ? ` at ${currentClient}` : ""}. Leave "New client" blank if this person is only being taken off assignment for now.
      </p>
      <FormField label="New client (optional)">
        <input className={inputCls} value={newClient} onChange={(e) => setNewClient(e.target.value)} placeholder="Next client, if reassigning immediately" />
      </FormField>
      <FormField label="Reason for removal *">
        <textarea className={inputCls + " resize-none"} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is this assignment ending?" />
      </FormField>
      <FormField label="Reason type">
        <select className={inputCls} value={sentiment} onChange={(e) => setSentiment(e.target.value)}>
          <option value="positive">Positive (e.g. client relocated, contract ended well)</option>
          <option value="negative">Negative (e.g. performance issue, client complaint)</option>
        </select>
      </FormField>
      <FormField label="Manager note">
        <textarea className={inputCls + " resize-none"} rows={2} value={managerNote} onChange={(e) => setManagerNote(e.target.value)} placeholder="Internal note for the record…" />
      </FormField>
    </Modal>
  );
}