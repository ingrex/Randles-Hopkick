import { Btn, EmptyState, Avatar } from "../../../shared/adminUI";
import { ShieldAlert, CheckCircle2, RotateCcw, Eye, UserCog, Trash2 } from "lucide-react";
import { formatDate, daysUntil, ALLOW_PROBATION_ASSIGNMENT } from "../utils/workforceHelpers";

export default function ProbationTab({ probationers, onConfirm, onReturnToCandidate, onViewProfile, onAssign, onDelete }) {
  if (probationers.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100">
        <EmptyState icon={ShieldAlert} title="No one on probation" subtitle="Candidates who don't meet KPI after training will appear here." />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {probationers.map((p) => {
        const daysLeft = daysUntil(p.probation.reviewDate);
        const overdue  = daysLeft !== null && daysLeft <= 0;
        return (
          <div key={p.id} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar src={p.photoUrl} name={p.name} size="md" />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{p.name}</p>
                  <p className="text-xs text-gray-400">Probation since {formatDate(p.probation.startDate)}</p>
                </div>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${overdue ? "bg-red-50 text-red-600" : "bg-orange-50 text-orange-600"}`}>
                Review {formatDate(p.probation.reviewDate)} {overdue ? "(overdue)" : `(${daysLeft}d)`}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2 italic">{p.probation.reason}</p>
            <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-gray-50">
              <Btn variant="success" onClick={() => onConfirm(p)}><CheckCircle2 size={12} /> Confirm as staff</Btn>
              <Btn variant="brand" onClick={() => onReturnToCandidate(p)}><RotateCcw size={12} /> Return to training</Btn>
              {ALLOW_PROBATION_ASSIGNMENT && (
                <Btn variant="brand" onClick={() => onAssign(p)}><UserCog size={12} /> Assign</Btn>
              )}
              <Btn variant="ghost" onClick={() => onViewProfile(p)}><Eye size={12} /> View</Btn>
              <Btn variant="danger" onClick={() => onDelete(p)}><Trash2 size={12} /></Btn>
            </div>
          </div>
        );
      })}
    </div>
  );
}