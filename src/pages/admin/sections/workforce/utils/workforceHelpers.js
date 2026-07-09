// ─────────────────────────────────────────────────────────────────────────────
// workforceHelpers.js
// Domain constants and pure helper functions for the Workforce Pipeline.
// Kept framework-agnostic (no React, no API calls) so it's easy to test and
// reuse across tabs, modals, and charts.
// ─────────────────────────────────────────────────────────────────────────────

export const ADMIN_NAME = "Super Admin"; // matches the placeholder used elsewhere in the admin panel

export const EMPLOYMENT_STATUS = {
  APPLICANT:       "Applicant",
  CANDIDATE:       "Candidate",
  PROBATION:       "Probation",
  CONFIRMED_STAFF: "ConfirmedStaff",
};

export const STATUS_LABELS = {
  Applicant:      "Applicant",
  Candidate:      "Candidate",
  Probation:      "Probation",
  ConfirmedStaff: "Confirmed Staff",
};

export const SKILL_LEVELS = ["Beginner", "Amateur", "Moderate", "Premium"];

export const INTERVIEW_STATUS = { PENDING: "Pending", PASSED: "Passed", FAILED: "Failed" };

// Allowed bidirectional employment-status transitions (spec §8)
export const ALLOWED_TRANSITIONS = {
  [EMPLOYMENT_STATUS.APPLICANT]:       [EMPLOYMENT_STATUS.CANDIDATE],
  [EMPLOYMENT_STATUS.CANDIDATE]:       [EMPLOYMENT_STATUS.CONFIRMED_STAFF, EMPLOYMENT_STATUS.PROBATION],
  [EMPLOYMENT_STATUS.PROBATION]:       [EMPLOYMENT_STATUS.CANDIDATE, EMPLOYMENT_STATUS.CONFIRMED_STAFF],
  [EMPLOYMENT_STATUS.CONFIRMED_STAFF]: [EMPLOYMENT_STATUS.PROBATION, EMPLOYMENT_STATUS.CANDIDATE],
};

export function statusColor(status) {
  return {
    Applicant:      "gray",
    Candidate:      "sky",
    Probation:      "orange",
    ConfirmedStaff: "green",
    Deleted:        "red",
  }[status] ?? "gray";
}

export function skillLevelColor(level) {
  return {
    Premium:  "purple",
    Moderate: "blue",
    Amateur:  "yellow",
    Beginner: "gray",
  }[level] ?? "gray";
}

export function addMonths(dateIso, months) {
  const d = new Date(dateIso);
  d.setMonth(d.getMonth() + months);
  return d.toISOString();
}

export function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function formatMonth(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
}

export function daysUntil(iso) {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

// ── Performance indicator (spec §16) ──────────────────────────────────────────
// green: 0-1 negative removals, yellow: 2-3, red: 4+
export function computePerformanceIndicator(removals = []) {
  const negatives = removals.filter((r) => r.sentiment === "negative").length;
  if (negatives >= 4) return "red";
  if (negatives >= 2) return "yellow";
  return "green";
}

export function performanceIndicatorColor(indicator) {
  return { green: "green", yellow: "yellow", red: "red" }[indicator] ?? "gray";
}

export const PERFORMANCE_HEX = { green: "#22c55e", yellow: "#eab308", red: "#ef4444" };

// ── Assignment eligibility (spec §11) ─────────────────────────────────────────
// Applicants can never be assigned. Probation staff are assignable only if
// company policy allows it — toggle this one flag to change that org-wide.
export const ALLOW_PROBATION_ASSIGNMENT = true;

export function canBeAssigned(employmentStatus) {
  if (employmentStatus === EMPLOYMENT_STATUS.APPLICANT) return false;
  if (employmentStatus === EMPLOYMENT_STATUS.PROBATION) return ALLOW_PROBATION_ASSIGNMENT;
  return true; // Candidate, ConfirmedStaff
}

// Assign button should stay disabled until staff, client, and date are all set (spec §12).
export function isAssignmentValid({ client, date }) {
  return Boolean(client?.trim()) && Boolean(date);
}


// ─────────────────────────────────────────────────────────────────────────────
// Chart-data builders — pure functions that turn the record list into the
// array shapes Recharts expects. Kept here (not in the components) so the
// data logic is easy to unit test independently of rendering.
// ─────────────────────────────────────────────────────────────────────────────

// Cumulative confirmed-staff headcount over time, derived from statusHistory.
// Used for the "is the organization growing" line chart.
export function buildGrowthSeries(records) {
  const confirmations = [];
  records.forEach((r) => {
    (r.statusHistory || []).forEach((h) => {
      if (h.to === EMPLOYMENT_STATUS.CONFIRMED_STAFF) confirmations.push(h.date);
    });
  });
  confirmations.sort((a, b) => new Date(a) - new Date(b));

  let running = 0;
  const series = [];
  confirmations.forEach((date) => {
    running += 1;
    series.push({ date: formatMonth(date), confirmedStaff: running });
  });
  // Collapse same-month entries to their final cumulative value for a cleaner line
  const byMonth = new Map();
  series.forEach((pt) => byMonth.set(pt.date, pt.confirmedStaff));
  return Array.from(byMonth.entries()).map(([date, confirmedStaff]) => ({ date, confirmedStaff }));
}

// Snapshot of how many people currently sit at each pipeline stage.
export function buildStageSnapshot(records) {
  const counts = { Applicant: 0, Candidate: 0, Probation: 0, ConfirmedStaff: 0 };
  records.forEach((r) => {
    if (r.deleted) return;
    if (counts[r.employmentStatus] !== undefined) counts[r.employmentStatus] += 1;
  });
  return Object.entries(counts).map(([status, count]) => ({ status: STATUS_LABELS[status], count }));
}

// Distribution of performance indicators across confirmed staff.
export function buildPerformanceDistribution(records) {
  const counts = { green: 0, yellow: 0, red: 0 };
  records.forEach((r) => {
    if (r.deleted || r.employmentStatus !== EMPLOYMENT_STATUS.CONFIRMED_STAFF) return;
    const indicator = r.performance?.indicator ?? "green";
    counts[indicator] = (counts[indicator] ?? 0) + 1;
  });
  return [
    { indicator: "Green",  count: counts.green,  fill: PERFORMANCE_HEX.green  },
    { indicator: "Yellow", count: counts.yellow, fill: PERFORMANCE_HEX.yellow },
    { indicator: "Red",    count: counts.red,    fill: PERFORMANCE_HEX.red    },
  ];
}

// Individual progress trend for one person's profile view.
export function buildIndividualProgressSeries(record) {
  const history = record?.performanceHistory ?? [];
  return history.map((pt) => ({ date: formatMonth(pt.date), score: pt.score }));
}