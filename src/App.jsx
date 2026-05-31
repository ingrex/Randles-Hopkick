// src/App.jsx
import React, { useState } from "react";
import { Routes, Route, useLocation, useNavigate, Navigate, useParams } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import Header from "./components/Header";
import Footer from "./components/Footer";
import { ScrollToTopOnNavigate, ScrollToTopButton } from "./components/ScrollToTop";

import Home          from "./pages/Home";
import AboutPage     from "./pages/About";
import Contact       from "./pages/Contact";
import Services      from "./pages/Services";
import Dashboard     from "./pages/Dashboard";
import BlogPage      from "./pages/Blogpage";
import BlogPostPage  from "./pages/BlogPostPage";
import ApplicantForm from "./pages/ApplicantForm";

import Login    from "./pages/Login";
import Register from "./pages/Register";

import { AuthProvider } from "./pages/AuthContext";
import ProtectedRoute   from "./pages/ProtectedRoute";
import { StoreProvider } from "./store";
import AdminPanel        from "./pages/Adminpanel";
import AdminGate         from "./pages/AdminGate";
import Profile from "./pages/Profile";

import SplashScreen from "./components/SplashScreen";  
import PageWrapper  from "./components/PageWrapper";     

function AdminRoute({ children }) {
  const admitted = sessionStorage.getItem("sl_admin_admitted") === "true";
  return admitted ? children : <Navigate to="/admin-gate" replace />;
}

// Wrapper to extract slug param and pass to BlogPostPage
function BlogPostPageWrapper({ navigate }) {
  const { slug } = useParams();
  return (
    <BlogPostPage
      slug={slug}
      onNavigate={(s) => navigate(`/blog/${s}`)}
      onBackToBlog={() => navigate("/blog")}
    />
  );
}

function App() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const [splashDone, setSplashDone] = useState(false);

  const authRoutes  = ["/login", "/register"];
  const adminRoutes = ["/admin-gate", "/adminpanel"];
  const isAuthPage  = authRoutes.includes(location.pathname.toLowerCase());
  const isAdminPage = adminRoutes.includes(location.pathname.toLowerCase());
  const hideChrome  = isAuthPage || isAdminPage;

  return (
    <StoreProvider>
      <AuthProvider>
        <ScrollToTopOnNavigate />

        {/* ── SPLASH (shown once on first load) ── */}
        {!splashDone && (
          <SplashScreen onDone={() => setSplashDone(true)} />
        )}

        <div className="flex flex-col min-h-screen">
          {!hideChrome && <Header />}

          <main className="grow">
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>

                {/* ── PUBLIC ── */}
                <Route path="/"              element={<PageWrapper><Home /></PageWrapper>} />
                <Route path="/about"         element={<PageWrapper><AboutPage /></PageWrapper>} />
                <Route path="/contact"       element={<PageWrapper><Contact /></PageWrapper>} />
                <Route path="/services"      element={<PageWrapper><Services /></PageWrapper>} />
                <Route path="/applicantform" element={<PageWrapper><ApplicantForm /></PageWrapper>} />

                {/* ── BLOG ── */}
                <Route
                  path="/blog"
                  element={
                    <PageWrapper>
                      <BlogPage onNavigate={(slug) => navigate(`/blog/${slug}`)} />
                    </PageWrapper>
                  }
                />
                <Route
                  path="/blog/:slug"
                  element={
                    <PageWrapper>
                      <BlogPostPageWrapper navigate={navigate} />
                    </PageWrapper>
                  }
                />

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
                      <PageWrapper><Dashboard /></PageWrapper>
                    </ProtectedRoute>
                  }
                />

                {/* ── PROFILE ── */}
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <PageWrapper><Profile onNavigate={navigate} /></PageWrapper>
                    </ProtectedRoute>
                  }
                />

                {/* ── ADMIN ── */}
                <Route path="/admin-gate" element={<AdminGate />} />
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