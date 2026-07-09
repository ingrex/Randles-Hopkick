// ─────────────────────────────────────────────────────────────────────────────
// api/workforce.js
// API layer for the Workforce Pipeline (Applicant → Interview → Candidate →
// Confirmed Staff → Probation). Self-contained — does not modify auth.js.
//
// NOTE: These endpoint paths are proposed to match the backend spec. Adjust
// them once the backend routes are finalised; the shape of each function
// (arguments in, promise out) is what the rest of the Workforce Pipeline
// module depends on, so changing paths here is safe and won't ripple out.
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = "https://randnhop.onrender.com";
const API      = `${BASE_URL}/api/v1`;

async function request(path, options = {}) {
  const { headers: optHeaders, ...restOptions } = options;

  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...(optHeaders || {}) },
    ...restOptions,
  });

  const text = await res.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }

  if (!res.ok) {
    const err = new Error(data?.message || data?.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.data   = data;
    throw err;
  }
  return data;
}

function authHeaders() {
  const token = localStorage.getItem("authToken");
  if (!token) {
    const err = new Error("No auth token — please log in again.");
    err.status = 401;
    throw err;
  }
  return { Authorization: `Bearer ${token}` };
}

// ─── Applicants (spec §2) ───────────────────────────────────────────────────
export const apiGetApplicants = () =>
  request("/workforce/applicants", { headers: authHeaders() });

export const apiGetWorkforceProfile = (id) =>
  request(`/workforce/${id}`, { headers: authHeaders() });

// ─── Interviews (spec §3) ────────────────────────────────────────────────────
export const apiScheduleInterview = (id, payload) =>
  // payload: { date, interviewer }
  request(`/workforce/applicants/${id}/interview`, {
    method: "PATCH", headers: authHeaders(), body: JSON.stringify(payload),
  });

export const apiRecordInterviewResult = (id, payload) =>
  // payload: { status: 'Passed'|'Failed', notes, recommendation, admin }
  request(`/workforce/applicants/${id}/interview/result`, {
    method: "PATCH", headers: authHeaders(), body: JSON.stringify(payload),
  });

// ─── Candidate progression (spec §4, §5, §6) ─────────────────────────────────
export const apiApproveAsCandidate = (id, payload) =>
  // payload: { admin, reason }
  request(`/workforce/applicants/${id}/approve-candidate`, {
    method: "PATCH", headers: authHeaders(), body: JSON.stringify(payload),
  });

export const apiUpdateTraining = (id, payload) =>
  // payload: { trainingProgress, trainingNotes, kpiMet, kpiNotes, performanceScore }
  request(`/workforce/candidates/${id}/training`, {
    method: "PATCH", headers: authHeaders(), body: JSON.stringify(payload),
  });

export const apiConfirmAsStaff = (id, payload) =>
  // payload: { admin, reason, skillLevel }
  request(`/workforce/candidates/${id}/confirm`, {
    method: "PATCH", headers: authHeaders(), body: JSON.stringify(payload),
  });

// ─── Probation (spec §7) ──────────────────────────────────────────────────────
export const apiMoveToProbation = (id, payload) =>
  // payload: { admin, reason }
  request(`/workforce/${id}/probation`, {
    method: "PATCH", headers: authHeaders(), body: JSON.stringify(payload),
  });

// ─── Promotion / demotion (spec §8) ──────────────────────────────────────────
export const apiChangeEmploymentStatus = (id, payload) =>
  // payload: { toStatus, admin, reason }
  request(`/workforce/${id}/status`, {
    method: "PATCH", headers: authHeaders(), body: JSON.stringify(payload),
  });

// ─── Skill level (spec §9) ────────────────────────────────────────────────────
export const apiAssignSkillLevel = (id, payload) =>
  // payload: { level, admin, reason }
  request(`/workforce/${id}/skill-level`, {
    method: "PATCH", headers: authHeaders(), body: JSON.stringify(payload),
  });

// ─── Assignment / reassignment (spec §11–15) ─────────────────────────────────
export const apiAssignWorkforce = (id, payload) =>
  // payload: { client, assignmentDate }
  request(`/workforce/${id}/assign`, {
    method: "POST", headers: authHeaders(), body: JSON.stringify(payload),
  });

export const apiReassignWorkforce = (id, payload) =>
  // payload: { newClient, reason, sentiment: 'positive'|'negative', managerNote, admin }
  request(`/workforce/${id}/reassign`, {
    method: "POST", headers: authHeaders(), body: JSON.stringify(payload),
  });

// ─── Soft delete / restore (spec §17) ────────────────────────────────────────
export const apiSoftDeleteWorkforce = (id, payload) =>
  // payload: { admin, reason }
  request(`/workforce/${id}`, {
    method: "DELETE", headers: authHeaders(), body: JSON.stringify(payload),
  });

export const apiRestoreWorkforce = (id) =>
  request(`/workforce/${id}/restore`, { method: "PATCH", headers: authHeaders() });

export const apiPermanentDeleteWorkforce = (id) =>
  // Super Admin only — backend should enforce this regardless of frontend gating
  request(`/workforce/${id}/permanent`, { method: "DELETE", headers: authHeaders() });

// ─── Audit trail (spec §21) ───────────────────────────────────────────────────
export const apiGetAuditLog = (id) =>
  request(`/workforce/${id}/audit`, { headers: authHeaders() });

// ─── Analytics (org-wide performance/growth) ─────────────────────────────────
export const apiGetWorkforceAnalytics = () =>
  // Expected shape: { growthSeries: [{date, confirmedStaffCount}], statusCounts: {...},
  //                   performanceDistribution: {green, yellow, red} }
  request("/workforce/analytics", { headers: authHeaders() });