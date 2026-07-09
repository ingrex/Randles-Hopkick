import { useState } from "react";
import {
  UserPlus2, CalendarCheck2, GraduationCap, ShieldAlert, BadgeCheck, BarChart3, Users, Archive,
} from "lucide-react";
import StaffSection from "../StaffSection";
import { useWorkforceStore } from "./hooks/useWorkforceStore";
import { EMPLOYMENT_STATUS, ADMIN_NAME } from "./utils/workforceHelpers";

import AnalyticsTab from "./tabs/AnalyticsTab";
import ApplicantsTab from "./tabs/ApplicantsTab";
import InterviewsTab from "./tabs/InterviewsTab";
import CandidatesTab from "./tabs/CandidatesTab";
import ProbationTab from "./tabs/ProbationTab";
import ConfirmedStaffTab from "./tabs/ConfirmedStaffTab";
import DeletedTab from "./tabs/DeletedTab";

import ProfileModal from "./components/ProfileModal";
import InterviewModal from "./components/InterviewModal";
import TransitionModal from "./components/TransitionModal";
import SkillLevelModal from "./components/SkillLevelModal";
import ReassignModal from "./components/ReassignModal";
import AssignmentModal from "./components/AssignmentModal";

// ─────────────────────────────────────────────────────────────────────────────
// WorkforceSection
// Entry point for the recruitment lifecycle (Applicant → Interview →
// Candidate → Confirmed Staff → Probation) plus organization analytics.
//
// The original Staff Registry (used for assigning people to client requests)
// is untouched and lives here as its own "Staff Registry" tab — it's a
// separate data model from the workforce pipeline below, since the pipeline
// records don't exist on the backend yet. Once the backend unifies them,
// this is the place to wire that up.
// ─────────────────────────────────────────────────────────────────────────────

const TABS = [
  { key: "analytics",  label: "Analytics",      Icon: BarChart3      },
  { key: "applicants", label: "Applicants",     Icon: UserPlus2      },
  { key: "interviews", label: "Interviews",     Icon: CalendarCheck2 },
  { key: "candidates", label: "Candidates",     Icon: GraduationCap  },
  { key: "probation",  label: "Probation",      Icon: ShieldAlert    },
  { key: "staff",      label: "Confirmed Staff",Icon: BadgeCheck     },
  { key: "registry",   label: "Staff Registry", Icon: Users          },
  { key: "deleted",    label: "Deleted",        Icon: Archive        },
];

export default function WorkforceSection({ state, dispatch }) {
  const [tab, setTab] = useState("analytics");
  const wf = useWorkforceStore();

  const [viewingProfile, setViewingProfile] = useState(null);
  const [interviewModal, setInterviewModal] = useState(null); // { mode, record }
  const [skillModal, setSkillModal]         = useState(null); // record
  const [reassignModal, setReassignModal]   = useState(null); // record
  const [assignModal, setAssignModal]       = useState(null); // record
  const [transition, setTransition]         = useState(null); // { kind, record }

  const closeAllModals = () => {
    setInterviewModal(null); setSkillModal(null); setReassignModal(null); setAssignModal(null); setTransition(null);
  };

  const applicants      = wf.records.filter((r) => !r.deleted && r.employmentStatus === EMPLOYMENT_STATUS.APPLICANT);
  const interviewed     = wf.records.filter((r) => !r.deleted && r.interview?.date);
  const candidates      = wf.records.filter((r) => !r.deleted && r.employmentStatus === EMPLOYMENT_STATUS.CANDIDATE);
  const probationers    = wf.records.filter((r) => !r.deleted && r.employmentStatus === EMPLOYMENT_STATUS.PROBATION);
  const confirmedStaff  = wf.records.filter((r) => !r.deleted && r.employmentStatus === EMPLOYMENT_STATUS.CONFIRMED_STAFF);
  const deletedRecords  = wf.records.filter((r) => r.deleted);

  // ── Transition modal config per kind — keeps WorkforceSection as the
  // single place that knows which store action maps to which button. ──────
  const transitionConfig = (() => {
    if (!transition) return null;
    const { kind, record } = transition;
    switch (kind) {
      case "approve":
        return {
          title: `Approve as candidate — ${record.name}`,
          description: "This starts a 3-month training period.",
          confirmLabel: "Approve",
          onConfirm: (reason) => { wf.approveCandidate(record.id, ADMIN_NAME, reason); closeAllModals(); },
        };
      case "confirm":
        return {
          title: `Confirm as staff — ${record.name}`,
          description: "This marks the person as Verified Staff, visible on the website.",
          confirmLabel: "Confirm",
          onConfirm: (reason) => { wf.confirmStaff(record.id, ADMIN_NAME, reason, record.skillLevel); closeAllModals(); },
        };
      case "probation":
        return {
          title: `Move to probation — ${record.name}`,
          description: "Starts a 1-month probation review period.",
          confirmLabel: "Move to probation",
          onConfirm: (reason) => { wf.moveToProbation(record.id, ADMIN_NAME, reason); closeAllModals(); },
        };
      case "returnToCandidate":
        return {
          title: `Return to training — ${record.name}`,
          description: "Moves this person back to Candidate status.",
          confirmLabel: "Return to training",
          onConfirm: (reason) => { wf.changeStatus(record.id, EMPLOYMENT_STATUS.CANDIDATE, ADMIN_NAME, reason); closeAllModals(); },
        };
      case "demoteToProbation":
        return {
          title: `Move to probation — ${record.name}`,
          description: "This removes Verified Staff status until re-confirmed.",
          confirmLabel: "Move to probation",
          onConfirm: (reason) => { wf.changeStatus(record.id, EMPLOYMENT_STATUS.PROBATION, ADMIN_NAME, reason); closeAllModals(); },
        };
      case "delete":
        return {
          title: `Delete — ${record.name}`,
          description: "This is a soft delete — the record moves to the Deleted tab and can be restored at any time.",
          confirmLabel: "Delete",
          onConfirm: (reason) => { wf.softDelete(record.id, ADMIN_NAME, reason); closeAllModals(); },
        };
      default:
        return null;
    }
  })();

  return (
    <div>
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {TABS.map(({ key, label, Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition shrink-0 ${
              tab === key ? "bg-[#2385cd] text-white shadow-sm" : "bg-white text-gray-600 border border-gray-200 hover:border-[#2385cd] hover:text-[#2385cd]"
            }`}>
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {tab === "analytics" && <AnalyticsTab records={wf.records} />}

      {tab === "applicants" && (
        <ApplicantsTab
          applicants={applicants}
          onViewProfile={setViewingProfile}
          onScheduleInterview={(r) => setInterviewModal({ mode: "schedule", record: r })}
          onRecordResult={(r) => setInterviewModal({ mode: "result", record: r })}
          onApprove={(r) => setTransition({ kind: "approve", record: r })}
          onAssignSkillLevel={setSkillModal}
        />
      )}

      {tab === "interviews" && (
        <InterviewsTab
          interviewed={interviewed}
          onRecordResult={(r) => setInterviewModal({ mode: "result", record: r })}
          onViewProfile={setViewingProfile}
        />
      )}

      {tab === "candidates" && (
        <CandidatesTab
          candidates={candidates}
          onUpdateTraining={wf.updateTraining}
          onConfirm={(r) => setTransition({ kind: "confirm", record: r })}
          onProbation={(r) => setTransition({ kind: "probation", record: r })}
          onAssignSkillLevel={setSkillModal}
          onViewProfile={setViewingProfile}
          onAssign={setAssignModal}
          onDelete={(r) => setTransition({ kind: "delete", record: r })}
        />
      )}

      {tab === "probation" && (
        <ProbationTab
          probationers={probationers}
          onConfirm={(r) => setTransition({ kind: "confirm", record: r })}
          onReturnToCandidate={(r) => setTransition({ kind: "returnToCandidate", record: r })}
          onViewProfile={setViewingProfile}
          onAssign={setAssignModal}
          onDelete={(r) => setTransition({ kind: "delete", record: r })}
        />
      )}

      {tab === "staff" && (
        <ConfirmedStaffTab
          staff={confirmedStaff}
          onReassign={setReassignModal}
          onDemote={(r) => setTransition({ kind: "demoteToProbation", record: r })}
          onAssignSkillLevel={setSkillModal}
          onViewProfile={setViewingProfile}
          onAssign={setAssignModal}
          onDelete={(r) => setTransition({ kind: "delete", record: r })}
        />
      )}

      {tab === "registry" && (
        <div>
          <p className="text-xs text-gray-500 bg-[#eaf4fc] border border-[#b8d9f0] rounded-lg px-3 py-2 mb-4">
            This is the original Staff Registry used for assigning people to client requests. It's unaffected by the
            Workforce Pipeline above and works exactly as before.
          </p>
          <StaffSection state={state} dispatch={dispatch} />
        </div>
      )}

      {tab === "deleted" && (
        <DeletedTab
          deletedRecords={deletedRecords}
          onRestore={(id) => wf.restore(id, ADMIN_NAME)}
          onPermanentDelete={wf.permanentDelete}
        />
      )}

      <ProfileModal record={viewingProfile} onClose={() => setViewingProfile(null)} />

      {interviewModal && (
        <InterviewModal
          open={!!interviewModal}
          mode={interviewModal.mode}
          applicantName={interviewModal.record.name}
          onClose={closeAllModals}
          onSchedule={(date, interviewer) => { wf.scheduleInterview(interviewModal.record.id, date, interviewer); closeAllModals(); }}
          onRecordResult={(status, notes, recommendation, admin) => { wf.recordInterviewResult(interviewModal.record.id, status, notes, recommendation, admin); closeAllModals(); }}
        />
      )}

      {skillModal && (
        <SkillLevelModal
          open={!!skillModal}
          currentLevel={skillModal.skillLevel}
          onClose={closeAllModals}
          onConfirm={(level, reason) => { wf.assignSkillLevel(skillModal.id, level, ADMIN_NAME, reason); closeAllModals(); }}
        />
      )}

      {reassignModal && (
        <ReassignModal
          open={!!reassignModal}
          currentClient={reassignModal.assignment?.current?.client}
          onClose={closeAllModals}
          onConfirm={(newClient, reason, sentiment, managerNote) => { wf.reassign(reassignModal.id, newClient, reason, sentiment, managerNote, ADMIN_NAME); closeAllModals(); }}
        />
      )}

      {assignModal && (
        <AssignmentModal
          open={!!assignModal}
          record={assignModal}
          onClose={closeAllModals}
          onConfirm={(client, date) => { wf.assignWorkforce(assignModal.id, client, date, ADMIN_NAME); closeAllModals(); }}
        />
      )}

      {transitionConfig && (
        <TransitionModal
          open={!!transition}
          title={transitionConfig.title}
          description={transitionConfig.description}
          confirmLabel={transitionConfig.confirmLabel}
          onClose={closeAllModals}
          onConfirm={transitionConfig.onConfirm}
        />
      )}
    </div>
  );
}