import { useState } from "react";
import { Modal, Btn, FormField, inputCls } from "../../../shared/adminUI";
import { SKILL_LEVELS } from "../utils/workforceHelpers";

export default function SkillLevelModal({ open, currentLevel, onClose, onConfirm }) {
  const [level, setLevel]   = useState(currentLevel || "Beginner");
  const [reason, setReason] = useState("");

  const handleClose = () => { setReason(""); onClose(); };
  const handleConfirm = () => {
    onConfirm(level, reason.trim());
    setReason("");
  };

  return (
    <Modal
      open={open}
      title="Assign skill level"
      onClose={handleClose}
      footer={<><Btn onClick={handleClose}>Cancel</Btn><Btn variant="primary" onClick={handleConfirm} disabled={!reason.trim()}>Save</Btn></>}
    >
      <FormField label="Skill level">
        <select className={inputCls} value={level} onChange={(e) => setLevel(e.target.value)}>
          {SKILL_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </FormField>
      <FormField label="Reason *">
        <textarea
          className={inputCls + " resize-none"}
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Basis for this skill level assignment…"
        />
      </FormField>
    </Modal>
  );
}