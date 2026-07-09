import { useState } from "react";
import { Modal, Btn, FormField, inputCls } from "../../../shared/adminUI";
import { ADMIN_NAME } from "../utils/workforceHelpers";

// mode: "schedule" — set date + interviewer
// mode: "result"   — record Passed/Failed + notes + recommendation
export default function InterviewModal({ open, mode, applicantName, onClose, onSchedule, onRecordResult }) {
  const [date, setDate]                 = useState("");
  const [interviewer, setInterviewer]   = useState("");
  const [status, setStatus]             = useState("Passed");
  const [notes, setNotes]               = useState("");
  const [recommendation, setRecommendation] = useState("");

  const reset = () => { setDate(""); setInterviewer(""); setStatus("Passed"); setNotes(""); setRecommendation(""); };
  const handleClose = () => { reset(); onClose(); };

  const handleScheduleConfirm = () => {
    onSchedule(date, interviewer);
    reset();
  };
  const handleResultConfirm = () => {
    onRecordResult(status, notes, recommendation, ADMIN_NAME);
    reset();
  };

  if (mode === "schedule") {
    return (
      <Modal
        open={open}
        title={`Schedule interview — ${applicantName}`}
        onClose={handleClose}
        footer={<><Btn onClick={handleClose}>Cancel</Btn><Btn variant="primary" onClick={handleScheduleConfirm} disabled={!date || !interviewer.trim()}>Schedule</Btn></>}
      >
        <FormField label="Interview date">
          <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
        </FormField>
        <FormField label="Interviewer">
          <input className={inputCls} value={interviewer} onChange={(e) => setInterviewer(e.target.value)} placeholder="Name of interviewer" />
        </FormField>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      title={`Record interview result — ${applicantName}`}
      onClose={handleClose}
      footer={<><Btn onClick={handleClose}>Cancel</Btn><Btn variant="primary" onClick={handleResultConfirm} disabled={!notes.trim()}>Save result</Btn></>}
    >
      <FormField label="Outcome">
        <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="Passed">Passed</option>
          <option value="Failed">Failed</option>
        </select>
      </FormField>
      <FormField label="Interview notes *">
        <textarea className={inputCls + " resize-none"} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="How did the interview go?" />
      </FormField>
      <FormField label="Recommendation">
        <input className={inputCls} value={recommendation} onChange={(e) => setRecommendation(e.target.value)} placeholder="e.g. Proceed to training" />
      </FormField>
    </Modal>
  );
}