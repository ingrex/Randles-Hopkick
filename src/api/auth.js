// ─────────────────────────────────────────────────────────────────────────────
// auth.js  —  API layer for Randle & Hopkick
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = "https://randnhop.onrender.com";
const API      = `${BASE_URL}/api/v1`;

// ─────────────────────────────────────────────────────────────────────────────
// Internal request helper
// ─────────────────────────────────────────────────────────────────────────────
async function request(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await res.text();

  console.log(`[auth.js] ${options.method ?? "GET"} ${path}`);
  console.log(`[auth.js] Status:`, res.status, res.statusText);
  console.log(`[auth.js] Raw response:`, text?.slice(0, 400));

  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }

  if (!res.ok) {
    const msg = data?.message || data?.error || `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.data   = data;
    throw err;
  }

  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth token helpers
// ─────────────────────────────────────────────────────────────────────────────
function authHeaders() {
  const token = localStorage.getItem("authToken");
  if (!token) console.warn("[auth.js] ⚠️  No auth token found in localStorage!");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getAuthToken() {
  return localStorage.getItem("authToken") ?? null;
}

export function clearAuthToken() {
  localStorage.removeItem("authToken");
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────

/** Admin gate login — stores the returned JWT in localStorage */
export async function apiAdminGateLogin({ password }) {
  const data = await request("/auth/admin-gate-login", {
    method: "POST",
    body: JSON.stringify({ adminPassword: password }),
  });
  if (data?.token) localStorage.setItem("authToken", data.token);
  return data;
}

/** Regular user login — stores the returned JWT in localStorage */
export async function apiLogin({ email, password }) {
  const data = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (data?.token) localStorage.setItem("authToken", data.token);
  return data;
}

/** New user registration */
export async function apiRegister({
  surname, otherNames, phoneNumber, email, password, confirmPassword,
}) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      surname, otherNames, phoneNumber, email, password, confirmPassword,
    }),
  });
}

/**
 * Fetch the authenticated user's profile.
 * GET /api/v1/auth/profile
 */
export async function apiGetProfile() {
  return request("/auth/profile", {
    method: "GET",
    headers: authHeaders(),
  });
}

/**
 * Send a password-reset email.
 * POST /api/v1/auth/forgotPassword
 *
 * @param {{ email: string }} payload
 * @returns {Promise<Object>} Backend confirmation message
 */
export async function apiForgotPassword({ email }) {
  return request("/auth/forgotPassword", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

/**
 * Reset the user's password using the token from the email link.
 * POST /api/v1/auth/resetPassword/:token
 *
 * @param {{ token: string, password: string, confirmPassword: string }} payload
 * @returns {Promise<Object>} Backend confirmation + optionally a new JWT
 */
export async function apiResetPassword({ token, password, confirmPassword }) {
  return request(`/auth/resetPassword/${token}`, {
    method: "POST",
    body: JSON.stringify({ password, confirmPassword }),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// STAFF / CLIENT REQUESTS  (user-facing)
// ─────────────────────────────────────────────────────────────────────────────

/** Submit a new staff/client request (authenticated) */
export async function apiStaffRequest(payload) {
  return request("/staff-request", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

/** Submit / update the job-seeker's own profile (authenticated) */
export async function apiStaffProfile(payload) {
  return request("/profile", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// MARKETPLACE  (admin-facing)
// ─────────────────────────────────────────────────────────────────────────────

/** Public marketplace — visible to authenticated users */
export async function apiGetMarketplace() {
  return request("/profile/marketplace", {
    method: "GET",
    headers: authHeaders(),
  });
}

/**
 * Master marketplace — admin only.
 * Returns { users, staff (requests), profile (staff profiles), messages, testimonials }
 */
export async function apiGetMasterMarketplace() {
  return request("/admin/mastermarketplace", {
    method: "GET",
    cache: "no-store",
    headers: authHeaders(),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — request lifecycle
// ─────────────────────────────────────────────────────────────────────────────

/** Approve a staff request. PATCH /api/v1/admin/:id/approve */
export async function apiApproveRequest(id) {
  return request(`/admin/${id}/approve`, {
    method: "PATCH",
    headers: authHeaders(),
  });
}

/** Reject a staff request. PATCH /api/v1/admin/:id/reject */
export async function apiRejectRequest(id) {
  return request(`/admin/${id}/reject`, {
    method: "PATCH",
    headers: authHeaders(),
  });
}

/** Mark a request as completed. PATCH /api/v1/admin/:id/complete */
export async function apiCompleteRequest(id) {
  return request(`/admin/${id}/complete`, {
    method: "PATCH",
    headers: authHeaders(),
  });
}

/**
 * Assign staff members to a request.
 * PATCH /api/v1/admin/:id/assign
 */
export async function apiAssignStaff(reqId, assignedStaff) {
  const staffIds = assignedStaff.map((s) => s.id);
  console.log("[auth.js] apiAssignStaff →", { reqId, staffIds });
  return request(`/admin/${reqId}/assign`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ staffIds }),
  });
}

/**
 * Set start / end dates for a request.
 * PATCH /api/v1/admin/:id/date
 */
export async function apiSetDates(id, { startDate, endDate }) {
  return request(`/admin/${id}/date`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ startDate, endDate }),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// REVIEWS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Submit a client review for a completed request.
 * POST /api/v1/profile/:requestId/review
 */
export async function apiSubmitReview(requestId, { staffId, rating, comment }) {
  return request(`/profile/${requestId}/review`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ staffId, rating, comment }),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// TESTIMONIALS
// ─────────────────────────────────────────────────────────────────────────────

export async function apiFetchTestimonials() {
  return request("/testimonials", { method: "GET" });
}

export async function apiCreateTestimonial(payload) {
  return request("/testimonials", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function apiUpdateTestimonial(id, payload) {
  return request(`/testimonials/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function apiDeleteTestimonial(id) {
  return request(`/testimonials/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTACT FORM  (public)
// ─────────────────────────────────────────────────────────────────────────────

export async function apiContactForm({ name, email, phone, subject, message }) {
  return request("/contact", {
    method: "POST",
    body: JSON.stringify({ name, email, phoneNumber: phone, subject, message }),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTACT MESSAGES  (admin)
// ─────────────────────────────────────────────────────────────────────────────

export async function apiGetContactMessages() {
  return request("/contact/admin/all", {
    method: "GET",
    headers: authHeaders(),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// STAFF REGISTRY  (admin CRUD)
// ─────────────────────────────────────────────────────────────────────────────

export async function apiAddStaff(payload) {
  return request("/staff", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function apiUpdateStaff(id, payload) {
  return request(`/staff/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function apiRemoveStaff(id) {
  return request(`/staff/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}