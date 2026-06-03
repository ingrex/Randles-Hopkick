// ─────────────────────────────────────────────────────────────────────────────
// auth.js  —  API layer for Randle & Hopkick
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = "https://randnhop.onrender.com";
const API      = `${BASE_URL}/api/v1`;

async function request(path, options = {}) {
  const { headers: optHeaders, ...restOptions } = options;

  const res = await fetch(`${API}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(optHeaders || {}),
    },
    ...restOptions,
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

function authHeaders() {
  const token = localStorage.getItem("authToken");
  if (!token) {
    console.warn("[auth.js] ⚠️  No auth token found in localStorage!");
    const err = new Error("No auth token — please log in again.");
    err.status = 401;
    throw err;
  }
  return { Authorization: `Bearer ${token}` };
}

export function getAuthToken()  { return localStorage.getItem("authToken") ?? null; }
export function hasAuthToken()  { return !!localStorage.getItem("authToken"); }
export function clearAuthToken() { localStorage.removeItem("authToken"); }

// ─── AUTH ────────────────────────────────────────────────────────────────────

export async function apiAdminGateLogin({ password }) {
  const data = await request("/auth/admin-gate-login", {
    method: "POST",
    body: JSON.stringify({ adminPassword: password }),
  });
  if (data?.token) localStorage.setItem("authToken", data.token);
  return data;
}

export async function apiLogin({ email, password }) {
  const data = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (data?.token) localStorage.setItem("authToken", data.token);
  return data;
}

export async function apiRegister({
  surname, otherNames, phoneNumber, email, password, confirmPassword,
}) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ surname, otherNames, phoneNumber, email, password, confirmPassword }),
  });
}

export async function apiGetProfile() {
  return request("/auth/profile", {
    method: "GET",
    headers: authHeaders(),
  });
}

export async function apiForgotPassword({ email }) {
  return request("/auth/forgotPassword", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function apiResetPassword({ token, password, confirmPassword }) {
  return request(`/auth/resetPassword/${token}`, {
    method: "POST",
    body: JSON.stringify({ password, confirmPassword }),
  });
}

// ─── STAFF / CLIENT REQUESTS (user-facing) ───────────────────────────────────

export async function apiStaffRequest(payload) {
  return request("/staff-request", {
    method: "POST",
    headers: { ...authHeaders() },
    body: JSON.stringify(payload),
  });
}

export async function apiStaffProfile(payload) {
  return request("/profile", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// NEW: Fetch the logged-in user's own staff requests.
// The backend returns the requests that belong to the authenticated user.
// GET /api/v1/staff-request/my  (adjust path if your backend uses a different one)
// ─────────────────────────────────────────────────────────────────────────────
export async function apiGetUserRequests() {
  return request("/staff-request/my", {
    method: "GET",
    headers: authHeaders(),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// NEW: Fetch the logged-in job-seeker's own profile + assigned jobs.
// GET /api/v1/profile/my
// ─────────────────────────────────────────────────────────────────────────────
export async function apiGetMyStaffProfile() {
  return request("/profile/my", {
    method: "GET",
    headers: authHeaders(),
  });
}

// ─── MARKETPLACE (admin-facing) ───────────────────────────────────────────────

export async function apiGetMarketplace() {
  return request("/profile/marketplace", {
    method: "GET",
    headers: authHeaders(),
  });
}

export async function apiGetMasterMarketplace() {
  return request("/admin/mastermarketplace", {
    method: "GET",
    cache: "no-store",
    headers: authHeaders(),
  });
}

// ─── ADMIN — request lifecycle ────────────────────────────────────────────────

export async function apiApproveRequest(id) {
  return request(`/admin/${id}/approve`, {
    method: "PATCH",
    headers: authHeaders(),
  });
}

export async function apiRejectRequest(id) {
  return request(`/admin/${id}/reject`, {
    method: "PATCH",
    headers: authHeaders(),
  });
}

export async function apiCompleteRequest(id) {
  return request(`/admin/${id}/complete`, {
    method: "PATCH",
    headers: authHeaders(),
  });
}

export async function apiAssignStaff(reqId, assignedStaff) {
  const staffIds = assignedStaff.map((s) => s.backendId ?? s._id ?? s.id);
  console.log("[auth.js] apiAssignStaff →", { reqId, staffIds });
  return request(`/admin/${reqId}/assign`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ staffIds }),
  });
}

export async function apiSetDates(id, { startDate, endDate }) {
  return request(`/admin/${id}/date`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ startDate, endDate }),
  });
}

export async function apiSubmitReview(requestId, { staffId, rating, comment }) {
  return request(`/profile/${requestId}/review`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ staffId, rating, comment }),
  });
}

// ─── TESTIMONIALS ─────────────────────────────────────────────────────────────

export async function apiFetchTestimonials() {
  return request("/testimonials", { method: "GET" });
}

export async function apiFetchAdminTestimonials() {
  return request("/testimonials/admin", {
    method: "GET",
    headers: authHeaders(),
  });
}

export async function apiCreateTestimonial(payload) {
  return request("/testimonials/admin", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      name:       payload.name       ?? "",
      role:       payload.role       ?? "",
      company:    payload.company    ?? "",
      content:    payload.content    ?? payload.text    ?? "",
      rating:     payload.rating     ?? 5,
      avatar:     payload.avatar     ?? payload.image   ?? "",
      isApproved: payload.isApproved ?? payload.visible ?? true,
    }),
  });
}

export async function apiUpdateTestimonial(id, payload) {
  return request(`/testimonials/admin/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({
      name:       payload.name       ?? "",
      role:       payload.role       ?? "",
      company:    payload.company    ?? "",
      content:    payload.content    ?? payload.text    ?? "",
      rating:     payload.rating     ?? 5,
      avatar:     payload.avatar     ?? payload.image   ?? "",
      isApproved: payload.isApproved ?? payload.visible ?? true,
    }),
  });
}

export async function apiDeleteTestimonial(id) {
  return request(`/testimonials/admin/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

// ─── CONTACT FORM ─────────────────────────────────────────────────────────────

export async function apiContactForm({ name, email, phone, subject, message }) {
  return request("/contact", {
    method: "POST",
    body: JSON.stringify({ name, email, phoneNumber: phone, subject, message }),
  });
}

export async function apiGetContactMessages() {
  return request("/contact/admin/all", {
    method: "GET",
    headers: authHeaders(),
  });
}

// ─── STAFF REGISTRY (admin CRUD) ─────────────────────────────────────────────

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