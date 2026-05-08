// store.js — shared reactive store with localStorage persistence
// Wrap your app: <StoreProvider> in App.jsx
// Any component: const { state, dispatch } = useStore();

import { createContext, useContext, useReducer } from "react";

// ─── Seed staff ───────────────────────────────────────────────────────────────
const SEED_STAFF = [
  { id: 1, name: "Tunde Adeyemi",  role: "Electricians",        phone: "08011223344", email: "tunde.a@staff.ng",   status: "Available", currentJobId: null, averageRating: 4.7, totalReviews: 12 },
  { id: 2, name: "Chioma Nwosu",   role: "Housekeepers",         phone: "08022334455", email: "chioma.n@staff.ng",  status: "Available", currentJobId: null, averageRating: 4.9, totalReviews: 8  },
  { id: 3, name: "Ibrahim Musa",   role: "Masons / Bricklayers", phone: "08033445566", email: "ibrahim.m@staff.ng", status: "Available", currentJobId: null, averageRating: 4.5, totalReviews: 20 },
  { id: 4, name: "Fatima Bello",   role: "Private Chefs",        phone: "08044556677", email: "fatima.b@staff.ng",  status: "Available", currentJobId: null, averageRating: 5.0, totalReviews: 5  },
  { id: 5, name: "Grace Okonkwo",  role: "Receptionists",        phone: "08055667788", email: "grace.o@staff.ng",   status: "Available", currentJobId: null, averageRating: 4.3, totalReviews: 15 },
  { id: 6, name: "Emeka Eze",      role: "Security Guards",      phone: "08066778899", email: "emeka.e@staff.ng",   status: "Available", currentJobId: null, averageRating: 4.6, totalReviews: 9  },
  { id: 7, name: "Amina Yusuf",    role: "Nannies",              phone: "08077889900", email: "amina.y@staff.ng",   status: "Available", currentJobId: null, averageRating: 4.8, totalReviews: 11 },
  { id: 8, name: "Biodun Lawal",   role: "Plumbers",             phone: "08088990011", email: "biodun.l@staff.ng",  status: "Available", currentJobId: null, averageRating: 4.2, totalReviews: 7  },
];

const SEED_BLOG = [
  { id: 1, title: "How to find reliable household staff in Lagos",           date: "2026-04-18", status: "Published", excerpt: "Finding trustworthy domestic staff can be challenging in a busy city..." },
  { id: 2, title: "Top 5 benefits of outsourcing facility management",       date: "2026-04-05", status: "Published", excerpt: "Businesses across Nigeria are discovering the advantages..." },
  { id: 3, title: "Understanding labour regulations for domestic workers",   date: "2026-03-22", status: "Draft",     excerpt: "The Nigerian Labour Act outlines specific provisions..." },
];

const SEED_TESTIMONIALS = [
  { id: 1, name: "Mrs Adunola Fashola", role: "Private client",          text: "StaffLink matched me with an incredible housekeeper within 48 hours. Highly recommend!", rating: 5, visible: true  },
  { id: 2, name: "Mr Seun Odun",        role: "HR Manager, FinEdge Ltd", text: "Seamless process. Our new receptionist started on time and exceeded expectations.",         rating: 5, visible: true  },
  { id: 3, name: "Chidinma Obi",        role: "Private client",          text: "I was skeptical at first but the process was smooth and transparent.",                       rating: 4, visible: false },
];

const SEED_MESSAGES = [
  { id: 1, from: "Kemi Adeyemi", subject: "Inquiry about generator technician", body: "Hello, I was wondering if you have experienced generator technicians available for a short-term contract.", type: "contact", time: "2h ago", read: false },
  { id: 2, from: "Tobi Alabi",   subject: "Change of address",                  body: "I need to update the location for my pending request to Ajah instead of Lekki.",                              type: "contact", time: "1d ago", read: true  },
];

// ─── default state ────────────────────────────────────────────────────────────
function defaultState() {
  return {
    requests:         [],
    staff:            SEED_STAFF,
    blog:             SEED_BLOG,
    testimonials:     SEED_TESTIMONIALS,
    messages:         SEED_MESSAGES,
    // FIX: registeredUsers holds every account created via Register.jsx
    registeredUsers:  [],
    nextReqId:        1,
    nextStaffId:      SEED_STAFF.length + 1,
    nextBlogId:       SEED_BLOG.length + 1,
    nextTestiId:      SEED_TESTIMONIALS.length + 1,
    nextMsgId:        SEED_MESSAGES.length + 1,
  };
}

// ─── persist / rehydrate ──────────────────────────────────────────────────────
const STORE_KEY = "stafflink_store_v3"; // bumped to v3 to avoid stale shape issues

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaultState();
    const saved = JSON.parse(raw);

    // Always merge seed staff so seeds survive but admin additions are kept
    const savedIds   = new Set((saved.staff || []).map((s) => s.id));
    const mergedStaff = [
      ...SEED_STAFF.filter((s) => !savedIds.has(s.id)),
      ...(saved.staff || []),
    ];

    // Keep seed testimonials merged with any admin-added ones
    const savedTestiIds = new Set((saved.testimonials || []).map((t) => t.id));
    const mergedTestis  = [
      ...SEED_TESTIMONIALS.filter((t) => !savedTestiIds.has(t.id)),
      ...(saved.testimonials || []),
    ];

    return {
      ...defaultState(),
      ...saved,
      staff:        mergedStaff,
      testimonials: mergedTestis,
    };
  } catch {
    return defaultState();
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch { /* quota — ignore */ }
}

// ─── reducer ──────────────────────────────────────────────────────────────────
function reducer(state, action) {
  let next = state;

  switch (action.type) {

    // ── Registered users (from Register.jsx on success) ───────────────────────
    case "REGISTER_USER": {
      // action.payload: { surname, otherNames, email, phoneNumber, registeredAt }
      const exists = state.registeredUsers.some((u) => u.email === action.payload.email);
      if (exists) return state; // deduplicate if called twice
      next = {
        ...state,
        registeredUsers: [
          ...state.registeredUsers,
          {
            ...action.payload,
            id:           Date.now(),
            photoUrl:     "",
            registeredAt: action.payload.registeredAt || new Date().toISOString(),
          },
        ],
      };
      break;
    }

    // Allow admin/profile to update a registered user's details & photo
    case "UPDATE_REGISTERED_USER": {
      next = {
        ...state,
        registeredUsers: state.registeredUsers.map((u) =>
          u.email === action.payload.email ? { ...u, ...action.payload } : u
        ),
      };
      break;
    }

    // ── Requests ──────────────────────────────────────────────────────────────
    case "ADD_REQUEST": {
      const req = {
        id:            state.nextReqId,
        clientType:    action.payload.clientType,
        clientName:    action.payload.clientName,
        email:         action.payload.email,
        phone:         action.payload.phone,
        location:      action.payload.location,
        roles:         action.payload.roles,
        status:        "Pending",
        startDate:     "",
        endDate:       "",
        assignedStaff: [],
        reviews:       [],
        submittedAt:   new Date().toISOString(),
      };
      next = { ...state, requests: [...state.requests, req], nextReqId: state.nextReqId + 1 };
      break;
    }

    // FIX: AdminPanel uses "APPROVE_REQUEST" with just id → status flip only
    case "APPROVE_REQUEST": {
      next = {
        ...state,
        requests: state.requests.map((r) =>
          r.id === action.id ? { ...r, status: "Approved" } : r
        ),
      };
      break;
    }

    case "REJECT_REQUEST": {
      next = { ...state, requests: state.requests.map((r) => r.id === action.id ? { ...r, status: "Rejected" } : r) };
      break;
    }

    case "ACTIVATE_REQUEST": {
      next = { ...state, requests: state.requests.map((r) => r.id === action.id ? { ...r, status: "Active" } : r) };
      break;
    }

    case "COMPLETE_REQUEST": {
      const updated  = state.requests.map((r) => r.id === action.id ? { ...r, status: "Completed" } : r);
      const req      = state.requests.find((r) => r.id === action.id);
      const freedIds = req?.assignedStaff?.map((s) => s.id) ?? [];
      next = {
        ...state,
        requests: updated,
        staff:    state.staff.map((s) => freedIds.includes(s.id) ? { ...s, status: "Available", currentJobId: null } : s),
      };
      break;
    }

    // FIX: AdminPanel calls SET_DATES — now handled correctly
    case "SET_DATES":
    case "UPDATE_DATES": {
      const { id, startDate, endDate } = action;
      next = {
        ...state,
        requests: state.requests.map((r) =>
          r.id === id
            ? { ...r, startDate, endDate, status: startDate && endDate ? "Active" : r.status }
            : r
        ),
      };
      break;
    }

    case "ASSIGN_STAFF": {
      const { reqId, assignedStaff } = action;
      const req     = state.requests.find((r) => r.id === reqId);
      const prevIds = req ? req.assignedStaff.map((s) => s.id) : [];
      const newIds  = assignedStaff.map((s) => s.id);
      const freed   = prevIds.filter((id) => !newIds.includes(id));
      const busied  = newIds.filter((id) => !prevIds.includes(id));
      next = {
        ...state,
        requests: state.requests.map((r) => r.id === reqId ? { ...r, assignedStaff } : r),
        staff:    state.staff.map((s) => {
          if (freed.includes(s.id))  return { ...s, status: "Available", currentJobId: null };
          if (busied.includes(s.id)) return { ...s, status: "Active",    currentJobId: reqId };
          return s;
        }),
      };
      break;
    }

    // ── Review ────────────────────────────────────────────────────────────────
    case "SUBMIT_REVIEW": {
      const { reqId, staffId, rating, comment } = action;
      const review = { rating, comment, submittedAt: new Date().toISOString(), reviewedReqId: reqId };
      const updatedReqs = state.requests.map((r) =>
        r.id === reqId ? { ...r, reviews: [...(r.reviews || []), review], reviewed: true } : r
      );
      const updatedStaff = state.staff.map((s) => {
        if (s.id !== staffId) return s;
        const allReviews = [...(s.reviews || []), review];
        const avg = allReviews.reduce((sum, rv) => sum + rv.rating, 0) / allReviews.length;
        return { ...s, reviews: allReviews, averageRating: Math.round(avg * 10) / 10, totalReviews: allReviews.length };
      });
      next = { ...state, requests: updatedReqs, staff: updatedStaff };
      break;
    }

    // ── Staff ─────────────────────────────────────────────────────────────────
    case "ADD_STAFF": {
      const s = { ...action.payload, id: state.nextStaffId, status: "Available", currentJobId: null, averageRating: 0, totalReviews: 0, reviews: [] };
      next = { ...state, staff: [...state.staff, s], nextStaffId: state.nextStaffId + 1 };
      break;
    }
    case "UPDATE_STAFF": { next = { ...state, staff: state.staff.map((s) => s.id === action.payload.id ? { ...s, ...action.payload } : s) }; break; }
    case "REMOVE_STAFF": { next = { ...state, staff: state.staff.filter((s) => s.id !== action.id) }; break; }

    // ── Blog ──────────────────────────────────────────────────────────────────
    case "ADD_BLOG":    { next = { ...state, blog: [...state.blog,    { ...action.payload, id: state.nextBlogId  }], nextBlogId:  state.nextBlogId  + 1 }; break; }
    case "UPDATE_BLOG": { next = { ...state, blog: state.blog.map((p)  => p.id === action.payload.id ? { ...p, ...action.payload } : p) }; break; }
    case "DELETE_BLOG": { next = { ...state, blog: state.blog.filter((p) => p.id !== action.id) }; break; }

    // ── Testimonials ──────────────────────────────────────────────────────────
    case "ADD_TESTI":    { next = { ...state, testimonials: [...state.testimonials, { ...action.payload, id: state.nextTestiId, visible: true }], nextTestiId: state.nextTestiId + 1 }; break; }
    case "UPDATE_TESTI": { next = { ...state, testimonials: state.testimonials.map((t) => t.id === action.payload.id ? { ...t, ...action.payload } : t) }; break; }
    case "DELETE_TESTI": { next = { ...state, testimonials: state.testimonials.filter((t) => t.id !== action.id) }; break; }

    // ── Messages ──────────────────────────────────────────────────────────────
    case "MARK_MSG_READ": { next = { ...state, messages: state.messages.map((m) => m.id === action.id ? { ...m, read: true } : m) }; break; }
    case "ADD_MSG":       { next = { ...state, messages: [...state.messages, { ...action.payload, id: state.nextMsgId, read: false, time: "Just now" }], nextMsgId: state.nextMsgId + 1 }; break; }

    default: return state;
  }

  saveState(next);
  return next;
}

// ─── context ──────────────────────────────────────────────────────────────────
const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be inside <StoreProvider>");
  return ctx;
}

// ─── Profile persistence ──────────────────────────────────────────────────────
const PROFILE_KEY = "stafflink_profile_v2";

export function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveProfile(profile) {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch {}
}

// ─── Helper: build ADD_REQUEST payload from form payload ──────────────────────
// FIX: was incorrectly receiving `data` (API response) as second arg — removed it.
export function buildRequestPayload(apiPayload) {
  const isOrg = apiPayload.clientType === "Organisation";
  return {
    clientType: apiPayload.clientType,
    clientName: isOrg
      ? apiPayload.companyDetails?.companyName
      : `${apiPayload.personalDetails?.surname} ${apiPayload.personalDetails?.otherName || ""}`.trim(),
    email:    isOrg ? apiPayload.companyDetails?.companyEmail   : apiPayload.personalDetails?.email,
    phone:    isOrg ? apiPayload.companyDetails?.companyPhone   : apiPayload.personalDetails?.phoneNo,
    location: isOrg ? apiPayload.companyDetails?.companyAddress : apiPayload.personalDetails?.businessLocation,
    roles:    apiPayload.requestedStaff,
  };
}