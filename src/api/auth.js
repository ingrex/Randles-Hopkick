// src/api/auth.js
// ─── All API helpers for Randle & Hopkick ────────────────────────────────────

const BASE_URL = "https://randnhop.onrender.com";
const API      = `${BASE_URL}/api/v1`;

// ── Internal request helper ────────────────────────────────────────────────
async function request(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : {};

  if (!res.ok) {
    throw new Error(data?.message || data?.error || `Request failed (${res.status})`);
  }

  return data;
}

// ── Auth header helper ─────────────────────────────────────────────────────
function authHeaders() {
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
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
  return request("/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// MARKETPLACE
// ─────────────────────────────────────────────────────────────────────────────

export async function apiGetMarketplace() {
  return request("/profile/marketplace", {
    method: "GET",
    headers: { "Content-Type": "application/json", ...authHeaders() },
  });
}

export async function apiGetMasterMarketplace() {
  return request("/admin/mastermarketplace", {
    method: "GET",
    headers: { "Content-Type": "application/json", ...authHeaders() },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — request management
// ─────────────────────────────────────────────────────────────────────────────

export async function apiApproveRequest(id) {
  return request(`/profile/${id}/approve`, {
    method: "PATCH",
    headers: authHeaders(),
  });
}

export async function apiRejectRequest(id) {
  return request(`/profile/${id}/reject`, {
    method: "PATCH",
    headers: authHeaders(),
  });
}

export async function apiSetDates(id, { startDate, endDate }) {
  return request(`/profile/${id}/dates`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ startDate, endDate }),
  });
}

export async function apiAssignStaff(reqId, assignedStaff) {
  return request(`/profile/${reqId}/assign`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ assignedStaff }),
  });
}

export async function apiCompleteRequest(id) {
  return request(`/profile/${id}/complete`, {
    method: "PATCH",
    headers: authHeaders(),
  });
}

export async function apiSubmitReview(reqId, { staffId, rating, comment }) {
  return request(`/profile/${reqId}/review`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ staffId, rating, comment }),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — staff registry
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// TESTIMONIALS
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// CONTACT FORM
// ─────────────────────────────────────────────────────────────────────────────

export async function apiContactForm({ name, email, phone, subject, message }) {
  return request("/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ name, email, phone, subject, message }),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTACT MESSAGES (Admin)
// ─────────────────────────────────────────────────────────────────────────────

export async function apiGetContactMessages() {
  return request("/contact/admin/all", {
    method: "GET",
    headers: { "Content-Type": "application/json", ...authHeaders() },
  });
}