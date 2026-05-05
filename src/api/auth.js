// src/api/auth.js

const BASE_URL =
  import.meta.env.MODE === "development"
    ? "https://randnhop.onrender.com"
    : "https://randnhop.onrender.com";

const API = `${BASE_URL}/api/v1`;

// ── Internal request helper ───────────────────────────────────────────────
async function request(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: {
      "Content-Type": "application/json",
      /* spread any extra headers passed in (e.g. Authorization) */
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : {};

  if (!res.ok) {
    throw new Error(
      data?.message || data?.error || `Request failed (${res.status})`
    );
  }

  return data;
}

// ── Auth header helper ────────────────────────────────────────────────────
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
export async function apiRegister({
  surname,
  otherNames,
  phoneNumber,
  email,
  password,
  confirmPassword,
}) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      surname,
      otherNames,
      phoneNumber,
      email,
      password,
      confirmPassword,
    }),
  });
}

/* ── Get Profile (authenticated) ── */
export async function apiGetProfile() {
  return request("/auth/profile", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
  });
}

/* ── Staff Request (authenticated) ───────────────────────────────────────
   Endpoint: POST /api/v1/profile
   Confirmed 200 OK via Postman.
   Requires Bearer token — 401 is thrown without it.
──────────────────────────────────────────────────────────────────────────── */
export async function apiStaffRequest(payload) {
  return request("/profile", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),            /* ← fixes the 401 */
    },
    body: JSON.stringify(payload),
  });
}