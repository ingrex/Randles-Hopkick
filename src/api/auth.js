// src/api/auth.js

const BASE_URL = "https://randnhop.onrender.com";
const API = `${BASE_URL}/api/v1`;

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

/* ── Staff Request (authenticated) ── */
export async function apiStaffRequest(payload) {
  return request("/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// TESTIMONIALS — confirm these routes with your colleague
// Assumed: GET/POST /api/v1/testimonials  |  PUT/DELETE /api/v1/testimonials/:id
// ─────────────────────────────────────────────────────────────────────────────

/* ── Fetch all testimonials ── */
export async function apiFetchTestimonials() {
  return request("/testimonials", {
    method: "GET",
  });
}

/* ── Create testimonial (admin) ── */
export async function apiCreateTestimonial(payload) {
  // payload: { name, role, text, rating, visible }
  return request("/testimonials", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
}

/* ── Update testimonial (admin) ── */
export async function apiUpdateTestimonial(id, payload) {
  return request(`/testimonials/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
}

/* ── Delete testimonial (admin) ── */
export async function apiDeleteTestimonial(id) {
  return request(`/testimonials/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", ...authHeaders() },
  });
}