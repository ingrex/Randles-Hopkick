export const BASE_URL =
  import.meta.env.MODE === "development"
    ? ""  
    : "https://randnhop.onrender.com";

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("authToken");

  const res = await fetch(`${BASE_URL}/api/v1${endpoint}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    body: options.body,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : {};

  if (!res.ok) {
    throw new Error(
      data?.message ||
      data?.error ||
      `Request failed (${res.status})`
    );
  }

  return data;
}