// src/pages/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // ✅ Wait for AuthContext to finish reading localStorage
  // Without this, it redirects to /login before the stored user is loaded
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030410]">
        <div className="w-8 h-8 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;