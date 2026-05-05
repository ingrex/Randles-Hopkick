// src/App.jsx
import React from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import Header from "./components/Header";
import Footer from "./components/Footer";
import { ScrollToTopOnNavigate, ScrollToTopButton } from "./components/ScrollToTop";

import Home      from "./pages/Home";
import AboutPage from "./pages/About";
import Contact   from "./pages/Contact";
import Services  from "./pages/Services";
import Dashboard from "./pages/Dashboard";

import ApplicantForm from "./pages/ApplicantForm";
import ClientForm1   from "./ApplicationForms/ClientForm1";
import StaffForm     from "./ApplicationForms/StaffForm";
import PrivateForm   from "./ApplicationForms/PrivateForm";

import Login    from "./pages/Login";
import Register from "./pages/Register";

import { AuthProvider } from "./pages/AuthContext";
import ProtectedRoute   from "./pages/ProtectedRoute";

// Thin page wrapper so /PrivateForm route still works if accessed directly
function PrivateFormPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <PrivateForm isOpen={true} onClose={() => navigate(-1)} />
    </div>
  );
}

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  const authRoutes = ["/login", "/register"];
  const isAuthPage = authRoutes.includes(location.pathname.toLowerCase());

  return (
    <AuthProvider>
      <ScrollToTopOnNavigate />

      <div className="flex flex-col min-h-screen">
        {!isAuthPage && <Header />}

        <main className="grow">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>

              {/* ── PUBLIC ── */}
              <Route path="/"         element={<Home />} />
              <Route path="/about"    element={<AboutPage />} />
              <Route path="/contact"  element={<Contact />} />
              <Route path="/services" element={<Services />} />

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

              {/* ── PROTECTED ── */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              {/* ── FORM ROUTES (protected — require auth token to submit) ── */}
              <Route path="/applicantform" element={<ApplicantForm />} />

              {/* ✅ FIX: wrapped in ProtectedRoute — apiStaffRequest sends Bearer token,
                  unauthenticated users would get a 401 from the API */}
              <Route
                path="/clientform1"
                element={
                  <ProtectedRoute>
                    {/* ✅ FIX: navigate to dashboard after successful submission */}
                    <ClientForm1
                      onSubmit={() => navigate("/dashboard")}
                    />
                  </ProtectedRoute>
                }
              />

              {/* ✅ FIX: also protect StaffForm and PrivateForm if they submit to authenticated endpoints */}
              <Route
                path="/StaffForm"
                element={
                  <ProtectedRoute>
                    <StaffForm />
                  </ProtectedRoute>
                }
              />
              {/* PrivateForm is now a modal — no dedicated route needed.
                  Open it with state: const [showPrivate, setShowPrivate] = useState(false)
                  Then render: <PrivateForm isOpen={showPrivate} onClose={() => setShowPrivate(false)} />
                  on any page that has a "Request Staff (Individual)" button. */}
              <Route
                path="/PrivateForm"
                element={
                  <ProtectedRoute>
                    <PrivateFormPage />
                  </ProtectedRoute>
                }
              />

            </Routes>
          </AnimatePresence>
        </main>

        {!isAuthPage && <Footer />}
      </div>

      {!isAuthPage && <ScrollToTopButton />}
    </AuthProvider>
  );
}

export default App;