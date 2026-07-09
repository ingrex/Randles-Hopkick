import { Btn, EmptyState, Avatar } from "../../../shared/adminUI";
import { BadgeCheck, RefreshCw, ArrowDownCircle, Eye, UserCog, Trash2 } from "lucide-react";
import SkillLevelBadge from "../components/SkillLevelBadge";
import PerformanceIndicator from "../components/PerformanceIndicator";
import { formatDate } from "../utils/workforceHelpers";

export default function ConfirmedStaffTab({ staff, onReassign, onDemote, onAssignSkillLevel, onViewProfile, onAssign, onDelete }) {
  if (staff.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100">
        <EmptyState icon={BadgeCheck} title="No confirmed staff yet" subtitle="Staff who complete training with KPI met will appear here as Verified Staff." />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {staff.map((s) => (
        <div key={s.id} className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar src={s.photoUrl} name={s.name} size="md" />
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-700 bg-green-50 border border-green-100 rounded-full px-1.5 py-0.5">
                    <BadgeCheck size={10} /> Verified
                  </span>
                </div>
                <p className="text-xs text-gray-400">Confirmed {formatDate(s.confirmedStaff?.confirmationDate)}</p>
              </div>
            </div>
            <SkillLevelBadge level={s.skillLevel} />
          </div>

          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-gray-500">
              Assignment: <strong className="text-gray-700">{s.assignment?.current?.client ?? "Unassigned"}</strong>
            </span>
            <PerformanceIndicator indicator={s.performance?.indicator} removalCount={s.performance?.removals?.length ?? 0} />
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-gray-50">
            {s.assignment?.current
              ? <Btn variant="primary" onClick={() => onReassign(s)}><RefreshCw size={12} /> Reassign / end assignment</Btn>
              : <Btn variant="brand" onClick={() => onAssign(s)}><UserCog size={12} /> Assign</Btn>}
            <Btn variant="danger" onClick={() => onDemote(s)}><ArrowDownCircle size={12} /> Move to probation</Btn>
            <Btn variant="ghost" onClick={() => onAssignSkillLevel(s)}>Skill level</Btn>
            <Btn variant="ghost" onClick={() => onViewProfile(s)}><Eye size={12} /> View</Btn>
            <Btn variant="danger" onClick={() => onDelete(s)}><Trash2 size={12} /></Btn>
          </div>
        </div>
      ))}
    </div>
  );
}