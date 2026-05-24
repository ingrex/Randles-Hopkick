const BASE_URL = "https://randnhop.onrender.com";
const API      = `${BASE_URL}/api/v1`;

// ── Internal request helper 
async function request(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await res.text();

  // ── DEBUG ──────────────────────────────────────────────────────────────────
  console.log(`[auth.js] ${options.method ?? "GET"} ${path}`);
  console.log(`[auth.js] Status:`, res.status, res.statusText);
  console.log(`[auth.js] Raw response text:`, text);
  // ──────────────────────────────────────────────────────────────────────────

  const data = text ? JSON.parse(text) : {};

  console.log(`[auth.js] Parsed response object:`, data);

  if (!res.ok) {
    throw new Error(data?.message || data?.error || `Request failed (${res.status})`);
  }

  return data;
}


function authHeaders() {
  const token = localStorage.getItem("authToken");

  // ── DEBUG ──────────────────────────────────────────────────────────────────
  console.log("[auth.js] authHeaders() — token present?", !!token);
  if (token) console.log("[auth.js] Token preview:", token.slice(0, 30) + "...");
  else console.warn("[auth.js] ⚠️  No auth token found in localStorage!");
  // ──────────────────────────────────────────────────────────────────────────

  return token ? { Authorization: `Bearer ${token}` } : {};
}

/* ── Admin Gate Login ── */
export async function apiAdminGateLogin({ password }) {
  const data = await request("/auth/admin-gate-login", {
    method: "POST",
    body: JSON.stringify({ adminPassword: password }),
  });

  // ── DEBUG ──────────────────────────────────────────────────────────────────
  console.log("[auth.js] apiAdminGateLogin response:", data);
  console.log("[auth.js] Token in response?", !!data?.token);
  // ──────────────────────────────────────────────────────────────────────────

  if (data?.token) localStorage.setItem("authToken", data.token);
  return data;
}

/* ── Login ── */
export async function apiLogin({ email, password }) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

/* ── Register ── */
export async function apiRegister({ surname, otherNames, phoneNumber, email, password, confirmPassword }) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ surname, otherNames, phoneNumber, email, password, confirmPassword }),
  });
}

/* ── Get Profile (authenticated) ── */
export async function apiGetProfile() {
  return request("/auth/profile", {
    method: "GET",
    headers: { "Content-Type": "application/json", ...authHeaders() },
  });
}

/* ── Staff / Client Request (authenticated) ── */
export async function apiStaffRequest(payload) {
  return request("/staff-request", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
}

/* ── Staff Profile Submission (authenticated) ── */
export async function apiStaffProfile(payload) {
  return request("/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
}


// MARKETPLACE

export async function apiGetMarketplace() {
  const data = await request("/profile/marketplace", {
    method: "GET",
    headers: { "Content-Type": "application/json", ...authHeaders() },
  });
  console.log("=== apiGetMarketplace RAW ===", JSON.stringify(data).slice(0, 1000));
  return data;
}

export async function apiGetMasterMarketplace() {
  // ── DEBUG ──────────────────────────────────────────────────────────────────
  console.log("[auth.js] apiGetMasterMarketplace() called");
  const token = localStorage.getItem("authToken");
  console.log("[auth.js] Token for mastermarketplace:", token ? token.slice(0, 30) + "..." : "❌ MISSING");
  // ──────────────────────────────────────────────────────────────────────────

  return request("/admin/mastermarketplace", {
    method: "GET",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — request management
// All four action endpoints now use /admin/:id/... per the backend contract.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Approve a staff request.
 * PATCH /api/v1/admin/:id/approve
 */
export async function apiApproveRequest(id) {
  return request(`/admin/${id}/approve`, {
    method: "PATCH",
    headers: authHeaders(),
  });
}

/**
 * Reject / decline a staff request.
 * PATCH /api/v1/admin/:id/reject
 */
export async function apiRejectRequest(id) {
  return request(`/admin/${id}/reject`, {
    method: "PATCH",
    headers: authHeaders(),
  });
}

/**
 * Mark a request as completed.
 * PATCH /api/v1/admin/:id/complete
 */
export async function apiCompleteRequest(id) {
  return request(`/admin/${id}/complete`, {
    method: "PATCH",
    headers: authHeaders(),
  });
}

/**
 * Assign staff members to a request.
 * PATCH /api/v1/admin/:id/assign
 *
 * @param {string|number} reqId        - The request's backend ID.
 * @param {Array<{id,name}>} assignedStaff - Staff objects to assign.
 */
export async function apiAssignStaff(reqId, assignedStaff) {
  const staffIds = assignedStaff.map((s) => s.id);
   console.log("POST body:", { reqId, staffIds });
  return request(`/admin/${reqId}/assign`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ staffIds }),
  });
}

export async function apiSetDates(id, { startDate, endDate }) {
  return request(`/admin/${id}/date`, {   // ← was /dates
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ startDate, endDate }),
  });
}

// TESTIMONIALS

export async function apiFetchTestimonials() {
  return request("/testimonials", { method: "GET" });
}

export async function apiCreateTestimonial(payload) {
  return request("/testimonials", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
}

export async function apiUpdateTestimonial(id, payload) {
  return request(`/testimonials/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
}

export async function apiDeleteTestimonial(id) {
  return request(`/testimonials/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", ...authHeaders() },
  });
}

// CONTACT FORM  (public submission)

export async function apiContactForm({ name, email, phone, subject, message }) {
  return request("/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, phoneNumber: phone, subject, message }),
  });
}

// CONTACT MESSAGES (Admin)

export async function apiGetContactMessages() {
  return request("/contact/admin/all", {
    method: "GET",
    headers: { "Content-Type": "application/json", ...authHeaders() },
  });
}

// STAFF REGISTRY — admin CRUD

export async function apiAddStaff(payload) {
  return request("/staff", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
}

export async function apiUpdateStaff(id, payload) {
  return request(`/staff/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
}

export async function apiRemoveStaff(id) {
  return request(`/staff/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

// REVIEWS

/**
 * Submit a client review for a completed request.
 * POST /api/v1/profile/:requestId/review
 *
 * @param {string|number} requestId - The backend ID of the completed request.
 * @param {{ staffId: number, rating: number, comment?: string }} payload
 */
export async function apiSubmitReview(requestId, { staffId, rating, comment }) {
  return request(`/profile/${requestId}/review`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ staffId, rating, comment }),
  });
}