// store.js — shared reactive store (React Context + useReducer)
// Import this in App.jsx and wrap your router with <StoreProvider>
// Any component can call useStore() to read state or dispatch actions.

import { createContext, useContext, useReducer } from "react";

// ─── seed data ────────────────────────────────────────────────────────────────
const SEED_REQUESTS = [];          // starts empty; forms push into it
const SEED_STAFF = [
  { id: 1, name: "Tunde Adeyemi",  role: "Electricians",        phone: "08011223344", email: "tunde.a@staff.ng",  status: "Available", currentJobId: null },
  { id: 2, name: "Chioma Nwosu",   role: "Housekeepers",         phone: "08022334455", email: "chioma.n@staff.ng", status: "Available", currentJobId: null },
  { id: 3, name: "Ibrahim Musa",   role: "Masons / Bricklayers", phone: "08033445566", email: "ibrahim.m@staff.ng",status: "Available", currentJobId: null },
  { id: 4, name: "Fatima Bello",   role: "Private Chefs",        phone: "08044556677", email: "fatima.b@staff.ng", status: "Available", currentJobId: null },
  { id: 5, name: "Grace Okonkwo",  role: "Receptionists",        phone: "08055667788", email: "grace.o@staff.ng",  status: "Available", currentJobId: null },
  { id: 6, name: "Emeka Eze",      role: "Security Guards",      phone: "08066778899", email: "emeka.e@staff.ng",  status: "Available", currentJobId: null },
  { id: 7, name: "Amina Yusuf",    role: "Nannies",              phone: "08077889900", email: "amina.y@staff.ng",  status: "Available", currentJobId: null },
  { id: 8, name: "Biodun Lawal",   role: "Plumbers",             phone: "08088990011", email: "biodun.l@staff.ng", status: "Available", currentJobId: null },
];
const SEED_BLOG = [
  { id: 1, title: "How to find reliable household staff in Lagos", date: "2026-04-18", status: "Published", excerpt: "Finding trustworthy domestic staff can be challenging in a busy city..." },
  { id: 2, title: "Top 5 benefits of outsourcing facility management", date: "2026-04-05", status: "Published", excerpt: "Businesses across Nigeria are discovering the advantages..." },
  { id: 3, title: "Understanding labour regulations for domestic workers", date: "2026-03-22", status: "Draft",     excerpt: "The Nigerian Labour Act outlines specific provisions..." },
];
const SEED_TESTIMONIALS = [
  { id: 1, name: "Mrs Adunola Fashola", role: "Private client",           text: "StaffLink matched me with an incredible housekeeper within 48 hours. Highly recommend!", rating: 5, visible: true },
  { id: 2, name: "Mr Seun Odun",        role: "HR Manager, FinEdge Ltd",  text: "Seamless process. Our new receptionist started on time and exceeded expectations.",         rating: 5, visible: true },
  { id: 3, name: "Chidinma Obi",        role: "Private client",           text: "I was skeptical at first but the process was smooth and transparent.",                       rating: 4, visible: false },
];
const SEED_MESSAGES = [
  { id: 1, from: "Kemi Adeyemi",    subject: "Inquiry about generator technician", body: "Hello, I was wondering if you have experienced generator technicians available for a short-term contract.", type: "contact", time: "2h ago", read: false },
  { id: 2, from: "Tobi Alabi",      subject: "Change of address",                  body: "I need to update the location for my pending request to Ajah instead of Lekki.",                              type: "contact", time: "1d ago", read: true  },
];

// ─── initial state ─────────────────────────────────────────────────────────────
const initialState = {
  requests:     SEED_REQUESTS,
  staff:        SEED_STAFF,
  blog:         SEED_BLOG,
  testimonials: SEED_TESTIMONIALS,
  messages:     SEED_MESSAGES,
  nextReqId:    1,
  nextStaffId:  SEED_STAFF.length + 1,
  nextBlogId:   SEED_BLOG.length + 1,
  nextTestiId:  SEED_TESTIMONIALS.length + 1,
  nextMsgId:    SEED_MESSAGES.length + 1,
};

// ─── reducer ──────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {

    // ── Requests ──────────────────────────────────────────────────────────────
    case "ADD_REQUEST": {
      const req = {
        id:            state.nextReqId,
        clientType:    action.payload.clientType,       // "Individual" | "Organisation"
        clientName:    action.payload.clientName,
        email:         action.payload.email,
        phone:         action.payload.phone,
        location:      action.payload.location,
        roles:         action.payload.roles,            // [{ role, quantity }]
        status:        "Pending",                       // Pending → Approved → Active
        startDate:     "",
        endDate:       "",
        assignedStaff: [],                              // [{ id, name }]
        submittedAt:   new Date().toISOString(),
      };
      return { ...state, requests: [...state.requests, req], nextReqId: state.nextReqId + 1 };
    }
    case "APPROVE_REQUEST": {
      return {
        ...state,
        requests: state.requests.map(r =>
          r.id === action.id ? { ...r, status: "Approved" } : r
        ),
      };
    }
    case "REJECT_REQUEST": {
      return {
        ...state,
        requests: state.requests.map(r =>
          r.id === action.id ? { ...r, status: "Rejected" } : r
        ),
      };
    }
    case "SET_DATES": {
      // Setting both dates → flips status to Active
      const { id, startDate, endDate } = action;
      return {
        ...state,
        requests: state.requests.map(r =>
          r.id === id
            ? { ...r, startDate, endDate, status: startDate && endDate ? "Active" : r.status }
            : r
        ),
      };
    }
    case "ASSIGN_STAFF": {
      // assignedStaff = [{ id, name }]
      const { reqId, assignedStaff } = action;
      const assignedIds = assignedStaff.map(s => s.id);
      // free previously assigned staff who are no longer in the new list
      const req = state.requests.find(r => r.id === reqId);
      const prevIds = req ? req.assignedStaff.map(s => s.id) : [];
      const freed   = prevIds.filter(id => !assignedIds.includes(id));
      const busied  = assignedIds.filter(id => !prevIds.includes(id));
      return {
        ...state,
        requests: state.requests.map(r =>
          r.id === reqId ? { ...r, assignedStaff } : r
        ),
        staff: state.staff.map(s => {
          if (freed.includes(s.id))  return { ...s, status: "Available", currentJobId: null };
          if (busied.includes(s.id)) return { ...s, status: "Active",    currentJobId: reqId };
          return s;
        }),
      };
    }

    // ── Staff ─────────────────────────────────────────────────────────────────
    case "ADD_STAFF": {
      const s = { ...action.payload, id: state.nextStaffId, status: "Available", currentJobId: null };
      return { ...state, staff: [...state.staff, s], nextStaffId: state.nextStaffId + 1 };
    }
    case "UPDATE_STAFF": {
      return { ...state, staff: state.staff.map(s => s.id === action.payload.id ? { ...s, ...action.payload } : s) };
    }
    case "REMOVE_STAFF": {
      return { ...state, staff: state.staff.filter(s => s.id !== action.id) };
    }

    // ── Blog ──────────────────────────────────────────────────────────────────
    case "ADD_BLOG": {
      const p = { ...action.payload, id: state.nextBlogId };
      return { ...state, blog: [...state.blog, p], nextBlogId: state.nextBlogId + 1 };
    }
    case "UPDATE_BLOG": {
      return { ...state, blog: state.blog.map(p => p.id === action.payload.id ? { ...p, ...action.payload } : p) };
    }
    case "DELETE_BLOG": {
      return { ...state, blog: state.blog.filter(p => p.id !== action.id) };
    }

    // ── Testimonials ──────────────────────────────────────────────────────────
    case "ADD_TESTI": {
      const t = { ...action.payload, id: state.nextTestiId, visible: true };
      return { ...state, testimonials: [...state.testimonials, t], nextTestiId: state.nextTestiId + 1 };
    }
    case "UPDATE_TESTI": {
      return { ...state, testimonials: state.testimonials.map(t => t.id === action.payload.id ? { ...t, ...action.payload } : t) };
    }
    case "DELETE_TESTI": {
      return { ...state, testimonials: state.testimonials.filter(t => t.id !== action.id) };
    }

    // ── Messages ──────────────────────────────────────────────────────────────
    case "MARK_MSG_READ": {
      return { ...state, messages: state.messages.map(m => m.id === action.id ? { ...m, read: true } : m) };
    }
    case "ADD_MSG": {
      const m = { ...action.payload, id: state.nextMsgId, read: false, time: "Just now" };
      return { ...state, messages: [...state.messages, m], nextMsgId: state.nextMsgId + 1 };
    }

    default:
      return state;
  }
}

// ─── context & provider ───────────────────────────────────────────────────────
const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}

// ─── helper used by forms to build the ADD_REQUEST payload ───────────────────
// Pass the raw formData from PrivateForm or ClientForm1 after a successful API call.
export function buildRequestPayload(apiPayload, apiResponse) {
  const isOrg = apiPayload.clientType === "Organisation";
  return {
    clientType: apiPayload.clientType,
    clientName: isOrg
      ? apiPayload.companyDetails?.companyName
      : `${apiPayload.personalDetails?.surname} ${apiPayload.personalDetails?.otherName || ""}`.trim(),
    email: isOrg
      ? apiPayload.companyDetails?.companyEmail
      : apiPayload.personalDetails?.email,
    phone: isOrg
      ? apiPayload.companyDetails?.companyPhone
      : apiPayload.personalDetails?.phoneNo,
    location: isOrg
      ? apiPayload.companyDetails?.companyAddress
      : apiPayload.personalDetails?.businessLocation,
    roles: apiPayload.requestedStaff,   // already [{ role, quantity }]
  };
}