import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/v1/auth`;

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

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid credential");

      const userData = data.user || data;

      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      if (data.token)       localStorage.setItem("authToken", data.token);
      if (data.accessToken) localStorage.setItem("authToken", data.accessToken);

      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
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

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Register failed");

      if (data.user || data.token) {
        const userData = data.user || data;
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        if (data.token)       localStorage.setItem("authToken", data.token);
        if (data.accessToken) localStorage.setItem("authToken", data.accessToken);
      }

      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  /* LOGOUT */
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
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