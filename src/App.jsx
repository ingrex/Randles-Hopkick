// src/App.jsx
import React from "react";
import { Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import Header from "./components/Header";
import Footer from "./components/Footer";
import { ScrollToTopOnNavigate, ScrollToTopButton } from "./components/ScrollToTop";

import Home          from "./pages/Home";
import AboutPage     from "./pages/About";
import Contact       from "./pages/Contact";
import Services      from "./pages/Services";
import Dashboard     from "./pages/Dashboard";
import ApplicantForm from "./pages/ApplicantForm";

import Login    from "./pages/Login";
import Register from "./pages/Register";

import { AuthProvider } from "./pages/AuthContext";
import ProtectedRoute   from "./pages/ProtectedRoute";
import { StoreProvider } from "./store";
import AdminPanel        from "./pages/Adminpanel";
import AdminGate         from "./pages/AdminGate";

// ── Admin-only guard ──────────────────────────────────────────────────────────
// Reads the session flag set by AdminGate after the owner enters the password.
// If not present → silently redirect to the gate. No error, no hint to users.
function AdminRoute({ children }) {
  const admitted = sessionStorage.getItem("sl_admin_admitted") === "true";
  return admitted ? children : <Navigate to="/admin-gate" replace />;
}

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  const authRoutes  = ["/login", "/register"];
  const adminRoutes = ["/admin-gate", "/adminpanel"];
  const isAuthPage  = authRoutes.includes(location.pathname.toLowerCase());
  const isAdminPage = adminRoutes.includes(location.pathname.toLowerCase());
  const hideChrome  = isAuthPage || isAdminPage;   // no Header/Footer on admin screens

  return (
    <StoreProvider>
      <AuthProvider>
        <ScrollToTopOnNavigate />

        <div className="flex flex-col min-h-screen">
          {!hideChrome && <Header />}

          <main className="grow">
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>

                {/* ── PUBLIC ── */}
                <Route path="/"              element={<Home />} />
                <Route path="/about"         element={<AboutPage />} />
                <Route path="/contact"       element={<Contact />} />
                <Route path="/services"      element={<Services />} />
                <Route path="/applicantform" element={<ApplicantForm />} />

                {/* ── AUTH ── */}
                <Route
                  path="/login"
                  element={
                    <Login
                      onNavigateToRegister={() => navigate("/register")}
                      onGoHome={      () => navigate("/")          }
                      onGoDashboard={ () => navigate("/dashboard") }
                    />
                  }
                />
                <Route
                  path="/register"
                  element={
                    <Register
                      onNavigateToLogin={() => navigate("/login")}
                      onGoHome={      () => navigate("/")          }
                      onGoDashboard={ () => navigate("/dashboard") }
                    />
                  }
                />

                {/* ── PROTECTED (regular users) ── */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />

                {/* ── ADMIN GATE ────────────────────────────────────────────
                    Password screen. This URL is NOT linked anywhere on the
                    site — only you know it. Visiting /adminpanel directly
                    without passing through here redirects back to this gate.
                    Live URL:  https://yourdomain.com/admin-gate
                ── */}
                <Route path="/admin-gate" element={<AdminGate />} />

                {/* ── ADMIN PANEL ───────────────────────────────────────────
                    Only reachable after AdminGate sets sl_admin_admitted in
                    sessionStorage. Refreshing the tab keeps you in (session
                    is alive). Closing the browser tab logs you out.
                ── */}
                <Route
                  path="/adminpanel"
                  element={
                    <AdminRoute>
                      <AdminPanel />
                    </AdminRoute>
                  }
                />

              </Routes>
            </AnimatePresence>
          </main>

          {!hideChrome && <Footer />}
        </div>

        {!hideChrome && <ScrollToTopButton />}
      </AuthProvider>
    </StoreProvider>
  );
}

export default App;