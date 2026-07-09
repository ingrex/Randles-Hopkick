import { useState } from "react";
import { Btn, EmptyState, Avatar, FormField, inputCls } from "../../../shared/adminUI";
import { GraduationCap, CheckCircle2, AlertTriangle, Eye, UserCog, Trash2 } from "lucide-react";
import SkillLevelBadge from "../components/SkillLevelBadge";
import { formatDate, daysUntil } from "../utils/workforceHelpers";

function TrainingRow({ c, onUpdateTraining, onConfirm, onProbation, onAssignSkillLevel, onViewProfile, onAssign, onDelete }) {
  const [progress, setProgress] = useState(c.candidate.trainingProgress);
  const [notes, setNotes]       = useState(c.candidate.trainingNotes);
  const [kpiMet, setKpiMet]     = useState(c.candidate.kpi?.met);
  const [kpiNotes, setKpiNotes] = useState(c.candidate.kpi?.notes ?? "");

  const daysLeft = daysUntil(c.candidate.trainingEndDate);
  const trainingEnded = daysLeft !== null && daysLeft <= 0;

  const saveTraining = () => onUpdateTraining(c.id, progress, notes, kpiMet, kpiNotes);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar src={c.photoUrl} name={c.name} size="md" />
          <div>
            <p className="font-semibold text-gray-900 text-sm">{c.name}</p>
            <p className="text-xs text-gray-400">
              Training: {formatDate(c.candidate.trainingStartDate)} → {formatDate(c.candidate.trainingEndDate)}
              {" · "}
              {trainingEnded ? <span className="text-amber-600 font-medium">Training period ended</span> : `${daysLeft}d remaining`}
            </p>
          </div>
        </div>
        <SkillLevelBadge level={c.skillLevel} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
        <FormField label="Training progress">
          <input className={inputCls} value={progress} onChange={(e) => setProgress(e.target.value)} placeholder="e.g. On track, Below target" />
        </FormField>
        <FormField label="KPI status">
          <select className={inputCls} value={kpiMet === null ? "" : String(kpiMet)} onChange={(e) => setKpiMet(e.target.value === "" ? null : e.target.value === "true")}>
            <option value="">Pending</option>
            <option value="true">Met</option>
            <option value="false">Not met</option>
          </select>
        </FormField>
      </div>
      <FormField label="Training / KPI notes">
        <textarea className={inputCls + " resize-none"} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Manager's comments…" />
      </FormField>
      <div className="flex justify-end mt-1">
        <Btn variant="brand" onClick={saveTraining}>Save training notes</Btn>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-gray-50">
        <Btn
          variant="success"
          onClick={() => onConfirm(c)}
          disabled={kpiMet !== true}
        >
          <CheckCircle2 size={12} /> Confirm as staff
        </Btn>
        <Btn
          variant="danger"
          onClick={() => onProbation(c)}
          disabled={kpiMet !== false && !trainingEnded}
        >
          <AlertTriangle size={12} /> Move to probation
        </Btn>
        <Btn variant="ghost" onClick={() => onAssignSkillLevel(c)}>Skill level</Btn>
        <Btn variant="brand" onClick={() => onAssign(c)}><UserCog size={12} /> Assign</Btn>
        <Btn variant="ghost" onClick={() => onViewProfile(c)}><Eye size={12} /> View</Btn>
        <Btn variant="danger" onClick={() => onDelete(c)}><Trash2 size={12} /></Btn>
      </div>
    </div>
  );
}

export default function CandidatesTab({
  candidates, onUpdateTraining, onConfirm, onProbation, onAssignSkillLevel, onViewProfile, onAssign, onDelete,
}) {
  if (candidates.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100">
        <EmptyState icon={GraduationCap} title="No candidates in training" subtitle="Approve an applicant from the Applicants tab to start their 3-month training." />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {candidates.map((c) => (
        <TrainingRow
          key={c.id} c={c}
          onUpdateTraining={onUpdateTraining} onConfirm={onConfirm} onProbation={onProbation}
          onAssignSkillLevel={onAssignSkillLevel} onViewProfile={onViewProfile}
          onAssign={onAssign} onDelete={onDelete}
        />
      ))}
    </div>
  );
}