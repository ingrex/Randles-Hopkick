import { useReducer, useCallback } from "react";
import {
  apiScheduleInterview, apiRecordInterviewResult, apiApproveAsCandidate,
  apiUpdateTraining, apiConfirmAsStaff, apiMoveToProbation,
  apiChangeEmploymentStatus, apiAssignSkillLevel, apiReassignWorkforce,
  apiSoftDeleteWorkforce, apiRestoreWorkforce, apiAssignWorkforce, apiPermanentDeleteWorkforce,
} from "../../../../../api/workforce";
import {
  EMPLOYMENT_STATUS, INTERVIEW_STATUS, addMonths, computePerformanceIndicator,
} from "../utils/workforceHelpers";

// ─────────────────────────────────────────────────────────────────────────────
// Seed data — spread across the last several months so the analytics charts
// have real trend data to render. Replace with a live fetch once the backend
// endpoints in api/workforce.js are ready (see loadFromBackend below).
// ─────────────────────────────────────────────────────────────────────────────
function seedData() {
  return [
    {
      id: "wf-1001", name: "Chidinma Okoro", email: "chidinma.okoro@example.com", phone: "08012345678",
      address: "Lekki, Lagos", photoUrl: "",
      employmentStatus: EMPLOYMENT_STATUS.APPLICANT, skillLevel: null,
      interview: { date: "", interviewer: "", status: INTERVIEW_STATUS.PENDING, notes: "", recommendation: "", completedAt: null },
      candidate: null, confirmedStaff: null, probation: null,
      assignment: { current: null, history: [] },
      performance: { removals: [], indicator: "green" },
      performanceHistory: [],
      statusHistory: [], skillLevelHistory: [], auditLog: [], deleted: false,
    },
    {
      id: "wf-1002", name: "Emeka Nwosu", email: "emeka.nwosu@example.com", phone: "08087654321",
      address: "Ikeja, Lagos", photoUrl: "",
      employmentStatus: EMPLOYMENT_STATUS.CANDIDATE, skillLevel: "Amateur",
      interview: { date: "2026-06-01", interviewer: "Peace Obieke", status: INTERVIEW_STATUS.PASSED, notes: "Confident, well-spoken.", recommendation: "Proceed to training", completedAt: "2026-06-01" },
      candidate: {
        startDate: "2026-06-05", trainingStartDate: "2026-06-05",
        trainingEndDate: addMonths("2026-06-05", 3),
        trainingProgress: "On track", trainingNotes: "Good attitude, needs more speed in service.",
        kpi: { met: null, notes: "" },
      },
      confirmedStaff: null, probation: null,
      assignment: { current: null, history: [] },
      performance: { removals: [], indicator: "green" },
      performanceHistory: [
        { date: "2026-06-05", score: 55 },
        { date: "2026-07-01", score: 63 },
      ],
      statusHistory: [{ from: "Applicant", to: "Candidate", reason: "Passed interview", admin: "Super Admin", date: "2026-06-05" }],
      skillLevelHistory: [{ from: null, to: "Amateur", admin: "Super Admin", date: "2026-06-05" }],
      auditLog: [], deleted: false,
    },
    {
      id: "wf-1003", name: "Grace Adeyemi", email: "grace.adeyemi@example.com", phone: "08033445566",
      address: "Surulere, Lagos", photoUrl: "",
      employmentStatus: EMPLOYMENT_STATUS.CONFIRMED_STAFF, skillLevel: "Premium",
      interview: { date: "2025-11-01", interviewer: "Peace Obieke", status: INTERVIEW_STATUS.PASSED, notes: "Excellent.", recommendation: "Fast-track", completedAt: "2025-11-01" },
      candidate: { startDate: "2025-11-05", trainingStartDate: "2025-11-05", trainingEndDate: "2026-02-05", trainingProgress: "Completed", trainingNotes: "Outstanding.", kpi: { met: true, notes: "Exceeded targets." } },
      confirmedStaff: { confirmationDate: "2026-02-06", verified: true },
      probation: null,
      assignment: { current: { client: "The Okafor Residence", startDate: "2026-02-10" }, history: [] },
      performance: { removals: [], indicator: "green" },
      performanceHistory: [
        { date: "2025-11-05", score: 60 },
        { date: "2025-12-05", score: 68 },
        { date: "2026-01-05", score: 74 },
        { date: "2026-02-06", score: 82 },
        { date: "2026-04-01", score: 87 },
        { date: "2026-06-01", score: 91 },
      ],
      statusHistory: [
        { from: "Applicant", to: "Candidate",       reason: "Passed interview",       admin: "Super Admin", date: "2025-11-05" },
        { from: "Candidate", to: "ConfirmedStaff",  reason: "KPI met after training", admin: "Super Admin", date: "2026-02-06" },
      ],
      skillLevelHistory: [{ from: null, to: "Premium", admin: "Super Admin", date: "2025-11-05" }],
      auditLog: [], deleted: false,
    },
    {
      id: "wf-1004", name: "Tunde Bakare", email: "tunde.bakare@example.com", phone: "08099887766",
      address: "Yaba, Lagos", photoUrl: "",
      employmentStatus: EMPLOYMENT_STATUS.CONFIRMED_STAFF, skillLevel: "Moderate",
      interview: { date: "2025-09-01", interviewer: "Peace Obieke", status: INTERVIEW_STATUS.PASSED, notes: "Solid fundamentals.", recommendation: "Proceed", completedAt: "2025-09-01" },
      candidate: { startDate: "2025-09-05", trainingStartDate: "2025-09-05", trainingEndDate: "2025-12-05", trainingProgress: "Completed", trainingNotes: "Steady improvement.", kpi: { met: true, notes: "Met minimum bar." } },
      confirmedStaff: { confirmationDate: "2025-12-06", verified: true },
      probation: null,
      assignment: { current: { client: "Vantage Corp Facilities", startDate: "2025-12-10" }, history: [
        { client: "Lagoon Estates", startDate: "2025-12-10", endDate: "2026-03-01", removalReason: "Client requested younger staff profile", sentiment: "negative", managerNote: "No performance issue on our end." },
      ] },
      performance: { removals: [
        { date: "2026-03-01", client: "Lagoon Estates", reason: "Client requested younger staff profile", sentiment: "negative", managerNote: "No performance issue on our end." },
      ], indicator: "green" },
      performanceHistory: [
        { date: "2025-09-05", score: 50 },
        { date: "2025-12-06", score: 66 },
        { date: "2026-03-01", score: 60 },
        { date: "2026-06-01", score: 70 },
      ],
      statusHistory: [
        { from: "Applicant", to: "Candidate",      reason: "Passed interview",       admin: "Super Admin", date: "2025-09-05" },
        { from: "Candidate", to: "ConfirmedStaff", reason: "KPI met after training", admin: "Super Admin", date: "2025-12-06" },
      ],
      skillLevelHistory: [{ from: null, to: "Moderate", admin: "Super Admin", date: "2025-09-05" }],
      auditLog: [], deleted: false,
    },
    {
      id: "wf-1005", name: "Ifeoma Chukwu", email: "ifeoma.chukwu@example.com", phone: "08076543210",
      address: "Ajah, Lagos", photoUrl: "",
      employmentStatus: EMPLOYMENT_STATUS.PROBATION, skillLevel: "Beginner",
      interview: { date: "2026-02-15", interviewer: "Peace Obieke", status: INTERVIEW_STATUS.PASSED, notes: "Promising but inexperienced.", recommendation: "Monitor closely", completedAt: "2026-02-15" },
      candidate: { startDate: "2026-02-20", trainingStartDate: "2026-02-20", trainingEndDate: "2026-05-20", trainingProgress: "Below target", trainingNotes: "Struggled with time management.", kpi: { met: false, notes: "Missed 2 of 3 KPI targets." } },
      confirmedStaff: null,
      probation: { startDate: "2026-05-21", reason: "KPI not met after 3-month training", reviewDate: addMonths("2026-05-21", 1), extended: false },
      assignment: { current: null, history: [] },
      performance: { removals: [], indicator: "yellow" },
      performanceHistory: [
        { date: "2026-02-20", score: 40 },
        { date: "2026-04-01", score: 45 },
        { date: "2026-05-21", score: 48 },
      ],
      statusHistory: [
        { from: "Applicant", to: "Candidate", reason: "Passed interview",                     admin: "Super Admin", date: "2026-02-20" },
        { from: "Candidate", to: "Probation", reason: "KPI not met after 3-month training",    admin: "Super Admin", date: "2026-05-21" },
      ],
      skillLevelHistory: [{ from: null, to: "Beginner", admin: "Super Admin", date: "2026-02-20" }],
      auditLog: [], deleted: false,
    },
  ];
}

function pushAudit(record, entry) {
  return {
    ...record,
    auditLog: [{ ...entry, timestamp: new Date().toISOString() }, ...(record.auditLog || [])],
  };
}

function reducer(state, action) {
  switch (action.type) {
    case "SET_ALL":
      return action.payload;

    case "SCHEDULE_INTERVIEW": {
      const { id, date, interviewer } = action;
      return state.map((r) => r.id === id
        ? pushAudit(
            { ...r, interview: { ...r.interview, date, interviewer, status: INTERVIEW_STATUS.PENDING } },
            { action: "Interview Scheduled", previousValue: r.interview.date || "—", newValue: date, administrator: interviewer, reason: "Interview scheduled" }
          )
        : r);
    }

    case "RECORD_INTERVIEW_RESULT": {
      const { id, status, notes, recommendation, admin } = action;
      return state.map((r) => r.id === id
        ? pushAudit(
            { ...r, interview: { ...r.interview, status, notes, recommendation, completedAt: new Date().toISOString() } },
            { action: `Interview ${status}`, previousValue: INTERVIEW_STATUS.PENDING, newValue: status, administrator: admin, reason: notes }
          )
        : r);
    }

    case "APPROVE_CANDIDATE": {
      const { id, admin, reason } = action;
      return state.map((r) => {
        if (r.id !== id) return r;
        const now = new Date().toISOString();
        const updated = {
          ...r,
          employmentStatus: EMPLOYMENT_STATUS.CANDIDATE,
          candidate: {
            startDate: now, trainingStartDate: now, trainingEndDate: addMonths(now, 3),
            trainingProgress: "Just started", trainingNotes: "", kpi: { met: null, notes: "" },
          },
          performanceHistory: [...(r.performanceHistory || []), { date: now, score: 50 }],
          statusHistory: [{ from: r.employmentStatus, to: EMPLOYMENT_STATUS.CANDIDATE, reason, admin, date: now }, ...r.statusHistory],
        };
        return pushAudit(updated, { action: "Approved as Candidate", previousValue: r.employmentStatus, newValue: EMPLOYMENT_STATUS.CANDIDATE, administrator: admin, reason });
      });
    }

    case "UPDATE_TRAINING": {
      const { id, trainingProgress, trainingNotes, kpiMet, kpiNotes, performanceScore } = action;
      return state.map((r) => {
        if (r.id !== id) return r;
        const now = new Date().toISOString();
        const history = performanceScore != null
          ? [...(r.performanceHistory || []), { date: now, score: performanceScore }]
          : r.performanceHistory;
        return {
          ...r,
          candidate: { ...r.candidate, trainingProgress, trainingNotes, kpi: { met: kpiMet, notes: kpiNotes } },
          performanceHistory: history,
        };
      });
    }

    case "CONFIRM_STAFF": {
      const { id, admin, reason, skillLevel } = action;
      return state.map((r) => {
        if (r.id !== id) return r;
        const now = new Date().toISOString();
        let updated = {
          ...r,
          employmentStatus: EMPLOYMENT_STATUS.CONFIRMED_STAFF,
          confirmedStaff: { confirmationDate: now, verified: true },
          statusHistory: [{ from: r.employmentStatus, to: EMPLOYMENT_STATUS.CONFIRMED_STAFF, reason, admin, date: now }, ...r.statusHistory],
        };
        if (skillLevel && skillLevel !== r.skillLevel) {
          updated = { ...updated, skillLevel, skillLevelHistory: [{ from: r.skillLevel, to: skillLevel, admin, date: now }, ...r.skillLevelHistory] };
        }
        return pushAudit(updated, { action: "Confirmed as Staff", previousValue: r.employmentStatus, newValue: EMPLOYMENT_STATUS.CONFIRMED_STAFF, administrator: admin, reason });
      });
    }

    case "MOVE_TO_PROBATION": {
      const { id, admin, reason } = action;
      return state.map((r) => {
        if (r.id !== id) return r;
        const now = new Date().toISOString();
        const updated = {
          ...r,
          employmentStatus: EMPLOYMENT_STATUS.PROBATION,
          probation: { startDate: now, reason, reviewDate: addMonths(now, 1), extended: false },
          statusHistory: [{ from: r.employmentStatus, to: EMPLOYMENT_STATUS.PROBATION, reason, admin, date: now }, ...r.statusHistory],
        };
        return pushAudit(updated, { action: "Moved to Probation", previousValue: r.employmentStatus, newValue: EMPLOYMENT_STATUS.PROBATION, administrator: admin, reason });
      });
    }

    case "CHANGE_STATUS": {
      const { id, toStatus, admin, reason } = action;
      return state.map((r) => {
        if (r.id !== id) return r;
        const now = new Date().toISOString();
        const updated = {
          ...r,
          employmentStatus: toStatus,
          statusHistory: [{ from: r.employmentStatus, to: toStatus, reason, admin, date: now }, ...r.statusHistory],
        };
        return pushAudit(updated, { action: `Status changed to ${toStatus}`, previousValue: r.employmentStatus, newValue: toStatus, administrator: admin, reason });
      });
    }

    case "ASSIGN_SKILL_LEVEL": {
      const { id, level, admin, reason } = action;
      return state.map((r) => {
        if (r.id !== id) return r;
        const now = new Date().toISOString();
        const updated = {
          ...r, skillLevel: level,
          skillLevelHistory: [{ from: r.skillLevel, to: level, admin, date: now }, ...r.skillLevelHistory],
        };
        return pushAudit(updated, { action: "Skill Level Changed", previousValue: r.skillLevel ?? "None", newValue: level, administrator: admin, reason });
      });
    }

    case "REASSIGN": {
      const { id, newClient, reason, sentiment, managerNote, admin } = action;
      return state.map((r) => {
        if (r.id !== id) return r;
        const now = new Date().toISOString();
        const closedAssignment = r.assignment.current
          ? { ...r.assignment.current, endDate: now, removalReason: reason, sentiment, managerNote }
          : null;
        const newHistory = closedAssignment ? [closedAssignment, ...r.assignment.history] : r.assignment.history;
        const newRemovals = sentiment
          ? [{ date: now, client: r.assignment.current?.client, reason, sentiment, managerNote }, ...r.performance.removals]
          : r.performance.removals;
        const updated = {
          ...r,
          assignment: { current: newClient ? { client: newClient, startDate: now } : null, history: newHistory },
          performance: { removals: newRemovals, indicator: computePerformanceIndicator(newRemovals) },
        };
        return pushAudit(updated, { action: "Reassigned", previousValue: r.assignment.current?.client ?? "None", newValue: newClient ?? "None", administrator: admin, reason });
      });
    }

    case "ASSIGN": {
      const { id, client, date, admin } = action;
      return state.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, assignment: { ...r.assignment, current: { client, startDate: date } } };
        return pushAudit(updated, { action: "Assigned", previousValue: "Unassigned", newValue: client, administrator: admin, reason: `Assigned starting ${date}` });
      });
    }

    case "PERMANENT_DELETE": {
      const { id } = action;
      return state.filter((r) => r.id !== id);
    }

    case "SOFT_DELETE": {
      const { id, admin, reason } = action;
      return state.map((r) => r.id === id
        ? pushAudit({ ...r, deleted: true, deletedAt: new Date().toISOString() },
            { action: "Deleted", previousValue: "Active", newValue: "Deleted", administrator: admin, reason })
        : r);
    }

    case "RESTORE": {
      const { id, admin } = action;
      return state.map((r) => r.id === id
        ? pushAudit({ ...r, deleted: false, deletedAt: null },
            { action: "Restored", previousValue: "Deleted", newValue: "Active", administrator: admin, reason: "Restored from deleted staff" })
        : r);
    }

    default:
      return state;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// useWorkforceStore
// Every action optimistically updates local state, then calls the matching
// backend endpoint from api/workforce.js. Until those endpoints exist,
// failures are caught and logged so the UI keeps working from local state.
// ─────────────────────────────────────────────────────────────────────────────
export function useWorkforceStore() {
  const [records, dispatch] = useReducer(reducer, undefined, seedData);

  const scheduleInterview = useCallback((id, date, interviewer) => {
    dispatch({ type: "SCHEDULE_INTERVIEW", id, date, interviewer });
    apiScheduleInterview(id, { date, interviewer }).catch((e) => console.warn("[workforce] scheduleInterview:", e.message));
  }, []);

  const recordInterviewResult = useCallback((id, status, notes, recommendation, admin) => {
    dispatch({ type: "RECORD_INTERVIEW_RESULT", id, status, notes, recommendation, admin });
    apiRecordInterviewResult(id, { status, notes, recommendation, admin }).catch((e) => console.warn("[workforce] recordInterviewResult:", e.message));
  }, []);

  const approveCandidate = useCallback((id, admin, reason) => {
    dispatch({ type: "APPROVE_CANDIDATE", id, admin, reason });
    apiApproveAsCandidate(id, { admin, reason }).catch((e) => console.warn("[workforce] approveCandidate:", e.message));
  }, []);

  const updateTraining = useCallback((id, trainingProgress, trainingNotes, kpiMet, kpiNotes, performanceScore) => {
    dispatch({ type: "UPDATE_TRAINING", id, trainingProgress, trainingNotes, kpiMet, kpiNotes, performanceScore });
    apiUpdateTraining(id, { trainingProgress, trainingNotes, kpiMet, kpiNotes, performanceScore }).catch((e) => console.warn("[workforce] updateTraining:", e.message));
  }, []);

  const confirmStaff = useCallback((id, admin, reason, skillLevel) => {
    dispatch({ type: "CONFIRM_STAFF", id, admin, reason, skillLevel });
    apiConfirmAsStaff(id, { admin, reason, skillLevel }).catch((e) => console.warn("[workforce] confirmStaff:", e.message));
  }, []);

  const moveToProbation = useCallback((id, admin, reason) => {
    dispatch({ type: "MOVE_TO_PROBATION", id, admin, reason });
    apiMoveToProbation(id, { admin, reason }).catch((e) => console.warn("[workforce] moveToProbation:", e.message));
  }, []);

  const changeStatus = useCallback((id, toStatus, admin, reason) => {
    dispatch({ type: "CHANGE_STATUS", id, toStatus, admin, reason });
    apiChangeEmploymentStatus(id, { toStatus, admin, reason }).catch((e) => console.warn("[workforce] changeStatus:", e.message));
  }, []);

  const assignSkillLevel = useCallback((id, level, admin, reason) => {
    dispatch({ type: "ASSIGN_SKILL_LEVEL", id, level, admin, reason });
    apiAssignSkillLevel(id, { level, admin, reason }).catch((e) => console.warn("[workforce] assignSkillLevel:", e.message));
  }, []);

  const reassign = useCallback((id, newClient, reason, sentiment, managerNote, admin) => {
    dispatch({ type: "REASSIGN", id, newClient, reason, sentiment, managerNote, admin });
    apiReassignWorkforce(id, { newClient, reason, sentiment, managerNote, admin }).catch((e) => console.warn("[workforce] reassign:", e.message));
  }, []);

  const assignWorkforce = useCallback((id, client, date, admin) => {
    dispatch({ type: "ASSIGN", id, client, date, admin });
    apiAssignWorkforce(id, { client, assignmentDate: date }).catch((e) => console.warn("[workforce] assignWorkforce:", e.message));
  }, []);

  const softDelete = useCallback((id, admin, reason) => {
    dispatch({ type: "SOFT_DELETE", id, admin, reason });
    apiSoftDeleteWorkforce(id, { admin, reason }).catch((e) => console.warn("[workforce] softDelete:", e.message));
  }, []);

  const restore = useCallback((id, admin) => {
    dispatch({ type: "RESTORE", id, admin });
    apiRestoreWorkforce(id).catch((e) => console.warn("[workforce] restore:", e.message));
  }, []);

  const permanentDelete = useCallback((id) => {
    dispatch({ type: "PERMANENT_DELETE", id });
    apiPermanentDeleteWorkforce(id).catch((e) => console.warn("[workforce] permanentDelete:", e.message));
  }, []);

  return {
    records,
    scheduleInterview, recordInterviewResult, approveCandidate, updateTraining,
    confirmStaff, moveToProbation, changeStatus, assignSkillLevel, reassign,
    assignWorkforce, softDelete, restore, permanentDelete,
  };
}