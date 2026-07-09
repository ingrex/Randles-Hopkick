import { Btn, EmptyState, Avatar } from "../../../shared/adminUI";
import { UserPlus2, CalendarClock, CheckCircle2, Eye, Star } from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import SkillLevelBadge from "../components/SkillLevelBadge";
import { formatDate } from "../utils/workforceHelpers";

export default function ApplicantsTab({
  applicants, onViewProfile, onScheduleInterview, onRecordResult, onApprove, onAssignSkillLevel,
}) {
  if (applicants.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100">
        <EmptyState icon={UserPlus2} title="No applicants yet" subtitle="People who submit the registration form on the website will appear here." />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {applicants.map((a) => (
        <div key={a.id} className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar src={a.photoUrl} name={a.name} size="md" />
              <div>
                <p className="font-semibold text-gray-900 text-sm">{a.name}</p>
                <p className="text-xs text-gray-400">{a.email} · {a.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <StatusBadge status={a.employmentStatus} />
              <SkillLevelBadge level={a.skillLevel} />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            {a.interview.date
              ? <span>Interview: {formatDate(a.interview.date)} with {a.interview.interviewer || "—"} — <strong>{a.interview.status}</strong></span>
              : <span className="text-amber-600">No interview scheduled yet</span>}
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-gray-50">
            {!a.interview.date && (
              <Btn variant="primary" onClick={() => onScheduleInterview(a)}><CalendarClock size={12} /> Schedule interview</Btn>
            )}
            {a.interview.date && a.interview.status === "Pending" && (
              <Btn variant="brand" onClick={() => onRecordResult(a)}><Star size={12} /> Record result</Btn>
            )}
            {a.interview.status === "Passed" && (
              <Btn variant="success" onClick={() => onApprove(a)}><CheckCircle2 size={12} /> Approve as candidate</Btn>
            )}
            <Btn variant="ghost" onClick={() => onAssignSkillLevel(a)}>Assign skill level</Btn>
            <Btn variant="ghost" onClick={() => onViewProfile(a)}><Eye size={12} /> View</Btn>
          </div>
        </div>
      ))}
    </div>
  );
}