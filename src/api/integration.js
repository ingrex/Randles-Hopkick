// ─── How to wire everything together in your App.jsx ─────────────────────────
//
// 1. Wrap your router with <StoreProvider> so every page shares the same state.
// 2. Add a route for /admin that renders <AdminPanel />.
// 3. Everything else stays the same — Dashboard, PrivateForm, ClientForm1 all
//    use useStore() internally and will update automatically.
//
// ─────────────────────────────────────────────────────────────────────────────

// src/App.jsx  (example)
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { StoreProvider } from "./store";
import { Dashboard }   from "./pages/Dashboard";
import { AdminPanel }  from "./pages/AdminPanel";
// ... other imports (Login, Landing, etc.)

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"          element={<LandingPage />} />
          <Route path="/login"     element={<LoginPage />}  />
          <Route path="/dashboard" element={<Dashboard />}  />

          {/* Admin panel — protect this route with an auth guard in production */}
          <Route path="/admin"     element={<AdminPanel />} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA FLOW SUMMARY
// ─────────────────────────────────────────────────────────────────────────────
//
//  User fills PrivateForm / ClientForm1
//       │
//       ▼
//  apiStaffRequest(payload)  ← hits your backend
//       │
//       ▼
//  dispatch({ type: "ADD_REQUEST", payload })
//       │
//       ├──▶  Dashboard  — new request appears in "Pending" tab immediately
//       └──▶  AdminPanel — new row appears in Requests section
//
//  Admin clicks Approve
//       │
//       ▼
//  dispatch({ type: "APPROVE_REQUEST", id })
//       │
//       ├──▶  Dashboard  — card moves from Pending → Approved tab
//       └──▶  AdminPanel — status pill updates, Assign + Dates buttons appear
//
//  Admin sets dates (start + end)
//       │
//       ▼
//  dispatch({ type: "SET_DATES", id, startDate, endDate })
//       │
//       ├──▶  Status auto-flips to "Active"
//       ├──▶  Dashboard  — card moves to Active tab, dates shown, Review button appears
//       └──▶  AdminPanel — dates column populated
//
//  Admin assigns staff
//       │
//       ▼
//  dispatch({ type: "ASSIGN_STAFF", reqId, assignedStaff })
//       │
//       ├──▶  Request.assignedStaff updated
//       ├──▶  Staff status flips Available → Active (with currentJobId)
//       ├──▶  Dashboard  — assigned staff names shown on the Active card
//       └──▶  Staff's own dashboard (Staff mode) shows the assigned job
//
// ─────────────────────────────────────────────────────────────────────────────
// FILE LIST
// ─────────────────────────────────────────────────────────────────────────────
//
//  store.js           — shared state (StoreProvider + useStore hook)
//  AdminPanel.jsx     — full admin panel (6 sections)
//  Dashboard.jsx      — updated client/staff dashboard
//  PrivateForm.jsx    — updated (bug fix + store dispatch)
//  ClientForm1.jsx    — updated (bug fix + store dispatch)
//
// ─────────────────────────────────────────────────────────────────────────────
// BUG FIX NOTES
// ─────────────────────────────────────────────────────────────────────────────
//
//  OLD (broken) buildPayload in both forms:
//    requestedStaff: formData.employees
//      .filter((e) => e.name)
//      .map((e) => ({ role: e.name, quantity: Number(e.quantity) }))
//
//  The issue was NOT in buildPayload — it was correct. The bug was in how
//  Dashboard.jsx consumed the data: it pulled only the first element:
//    skill: data?.requestedStaff?.[0]?.role || data?.employees?.[0]?.name || "General"
//    qty:   data?.requestedStaff?.[0]?.quantity || ...  ← always 1 if qty reset
//
//  FIX: Dashboard now reads directly from store.requests[n].roles (the full
//  array) and renders each role with its correct quantity.
//  No more "General ×1" — every role and quantity selected in the form
//  is stored faithfully and displayed accurately.