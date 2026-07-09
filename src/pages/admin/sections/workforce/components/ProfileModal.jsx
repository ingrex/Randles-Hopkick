import { Modal, Btn, Avatar } from "../../../shared/adminUI";
import StatusBadge from "./StatusBadge";
import SkillLevelBadge from "./SkillLevelBadge";
import PerformanceIndicator from "./PerformanceIndicator";
import StaffProgressChart from "./charts/StaffProgressChart";
import { formatDate, daysUntil } from "../utils/workforceHelpers";

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="font-medium text-sm break-words">{value ?? "—"}</p>
    </div>
  );
}

export default function ProfileModal({ record, onClose }) {
  if (!record) return null;
  const r = record;

  return (
    <Modal open={!!record} title={`Profile — ${r.name}`} onClose={onClose} footer={<Btn onClick={onClose}>Close</Btn>}>
      <div className="space-y-5 text-sm">
        <div className="flex items-center gap-3">
          <Avatar src={r.photoUrl} name={r.name} size="md" />
          <div>
            <p className="font-semibold text-gray-900">{r.name}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <StatusBadge status={r.employmentStatus} />
              <SkillLevelBadge level={r.skillLevel} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Email" value={r.email} />
          <Field label="Phone" value={r.phone} />
          <Field label="Address" value={r.address} />
          <Field label="Current assignment" value={r.assignment?.current?.client ?? "Unassigned"} />
        </div>

        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Recruitment</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Interview date" value={formatDate(r.interview?.date)} />
            <Field label="Interview status" value={r.interview?.status} />
            <Field label="Interviewer" value={r.interview?.interviewer} />
            <Field label="Recommendation" value={r.interview?.recommendation} />
          </div>
        </div>

        {r.candidate && (
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Training</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Training start" value={formatDate(r.candidate.trainingStartDate)} />
              <Field label="Training end" value={formatDate(r.candidate.trainingEndDate)} />
              <Field label="Progress" value={r.candidate.trainingProgress} />
              <Field label="KPI status" value={r.candidate.kpi?.met === true ? "Met" : r.candidate.kpi?.met === false ? "Not met" : "Pending"} />
            </div>
          </div>
        )}

        {r.probation && (
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Probation</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Started" value={formatDate(r.probation.startDate)} />
              <Field label="Review date" value={`${formatDate(r.probation.reviewDate)} (${daysUntil(r.probation.reviewDate)}d)`} />
              <Field label="Reason" value={r.probation.reason} />
            </div>
          </div>
        )}

        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Performance trend</p>
          <StaffProgressChart record={r} />
          <div className="mt-2">
            <PerformanceIndicator indicator={r.performance?.indicator} removalCount={r.performance?.removals?.length ?? 0} />
          </div>
        </div>

        {r.assignment?.history?.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Assignment history</p>
            <div className="space-y-2">
              {r.assignment.history.map((a, i) => (
                <div key={i} className="bg-[#eaf4fc]/50 rounded-lg p-2 text-xs">
                  <p className="font-medium text-gray-800">{a.client}</p>
                  <p className="text-gray-500">{formatDate(a.startDate)} → {formatDate(a.endDate)}</p>
                  {a.removalReason && <p className="text-gray-500 italic mt-0.5">{a.removalReason}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {r.auditLog?.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Audit trail</p>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {r.auditLog.map((a, i) => (
                <div key={i} className="text-xs border-l-2 border-[#b8d9f0] pl-2">
                  <p className="font-medium text-gray-700">{a.action}</p>
                  <p className="text-gray-400">{a.previousValue} → {a.newValue} · {a.administrator} · {formatDate(a.timestamp)}</p>
                  {a.reason && <p className="text-gray-500 italic">{a.reason}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}