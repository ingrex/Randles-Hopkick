import { Btn, EmptyState, Avatar, Pill } from "../../../shared/adminUI";
import { CalendarCheck2, Star, Eye } from "lucide-react";
import { formatDate } from "../utils/workforceHelpers";

function outcomeColor(status) {
  return { Pending: "yellow", Passed: "green", Failed: "red" }[status] ?? "gray";
}

export default function InterviewsTab({ interviewed, onRecordResult, onViewProfile }) {
  if (interviewed.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100">
        <EmptyState icon={CalendarCheck2} title="No interviews scheduled" subtitle="Schedule an interview from the Applicants tab to see it here." />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#eaf4fc]/60 border-b border-[#b8d9f0]/50">
              {["Applicant", "Date", "Interviewer", "Outcome", "Notes", "Actions"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[#1a6fa8]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {interviewed.map((a) => (
              <tr key={a.id} className="border-b border-gray-50 hover:bg-[#eaf4fc]/30 transition">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar src={a.photoUrl} name={a.name} />
                    <span className="font-medium text-gray-900">{a.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{formatDate(a.interview.date)}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{a.interview.interviewer || "—"}</td>
                <td className="px-4 py-3"><Pill label={a.interview.status} color={outcomeColor(a.interview.status)} /></td>
                <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate" title={a.interview.notes}>{a.interview.notes || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {a.interview.status === "Pending" && (
                      <Btn variant="brand" onClick={() => onRecordResult(a)}><Star size={12} /> Record result</Btn>
                    )}
                    <Btn variant="ghost" onClick={() => onViewProfile(a)}><Eye size={12} /></Btn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}