import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/v1/auth`;

/* Safely parse a fetch Response as JSON. Some backends (or platform-level
   errors, e.g. Render cold-starts/proxies) return an empty body or HTML
   instead of JSON on failure — res.json() would throw in that case and
   mask the real error, so we fall back to {} instead of crashing. */
async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

/* Build an Error object that carries the backend's status + errors payload
   along with the message, instead of collapsing everything down to a
   single string. Callers (e.g. Register.jsx) rely on err.status/err.errors
   to show field-level and duplicate-account messages correctly. */
function buildApiError(res, data) {
  const message =
    data?.message ||
    data?.error ||
    (Array.isArray(data?.errors) ? data.errors[0]?.message : null) ||
    `Request failed (${res.status})`;

  const err = new Error(message);
  err.status = res.status;
  err.errors = data?.errors;
  return err;
}

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  /* Restore session on page reload */
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try { setUser(JSON.parse(stored)); }
      catch { localStorage.removeItem("user"); }
    }
    setLoading(false);
  }, []);

  /* LOGIN */
  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await safeJson(res);
      if (!res.ok) throw buildApiError(res, data);

      const userData = data.user || data;

      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      if (data.token)       localStorage.setItem("authToken", data.token);
      if (data.accessToken) localStorage.setItem("authToken", data.accessToken);

      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.message,
        status: err.status,
        errors: err.errors,
      };
    } finally {
      setLoading(false);
    }
  };

  /* REGISTER */
  const register = async (formData) => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await safeJson(res);
      if (!res.ok) throw buildApiError(res, data);

      if (data.user || data.token) {
        const userData = data.user || data;
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        if (data.token)       localStorage.setItem("authToken", data.token);
        if (data.accessToken) localStorage.setItem("authToken", data.accessToken);
      }

      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.message,
        status: err.status,
        errors: err.errors,
      };
    } finally {
      setLoading(false);
    }
  };

  /* LOGOUT */
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
    localStorage.removeItem("staffProfile"); // ✅ FIX 3: clear staff cache on logout
    localStorage.removeItem("userProfile");  // ✅ also clear avatar so it doesn't bleed into next user
  };

  /* UPDATE USER — merges new fields into the existing user object
     and persists to localStorage so Profile always reflects the
     latest data without an extra API round-trip.               */
  const updateUser = (patch) => {
    setUser((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem("user", JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);