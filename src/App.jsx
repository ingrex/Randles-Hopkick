// src/App.jsx
import React from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
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

import { AuthProvider }  from "./pages/AuthContext";
import ProtectedRoute    from "./pages/ProtectedRoute";
import { StoreProvider } from "./store";

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  const authRoutes = ["/login", "/register"];
  const isAuthPage = authRoutes.includes(location.pathname.toLowerCase());

  return (
    <StoreProvider>
      <AuthProvider>
        <ScrollToTopOnNavigate />

        <div className="flex flex-col min-h-screen">
          {!isAuthPage && <Header />}

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

                {/* ── PROTECTED ── */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
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
    </StoreProvider>
  );
}

export default App;