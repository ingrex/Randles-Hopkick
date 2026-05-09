// src/store.js
// ─── Shared reactive store with localStorage persistence ─────────────────────
// Wrap your app root:  <StoreProvider> in main.jsx / App.jsx
// Any component:       const { state, dispatch } = useStore();
//
// KEY DESIGN DECISIONS
// ────────────────────
// 1.  All backend data is normalised into this store so every page reads from
//     ONE source of truth.
// 2.  localStorage is a cache. Backend is always the authority.
// 3.  useRealtimeSync() polls the marketplace endpoint every POLL_INTERVAL ms
//     so changes made by the admin (assign staff, set dates, complete) propagate
//     to all connected clients automatically.
// 4.  STORE_KEY is versioned; bumping it clears stale shapes automatically.
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useContext, useReducer, useEffect, useRef, useCallback } from "react";
import { apiGetMarketplace } from "./api/auth";   // ✅ was "../api/auth"

// ── Poll interval (ms) — 15 s is a good balance for near-real-time ───────────
const POLL_INTERVAL = 15_000;

// ─── Seed data ────────────────────────────────────────────────────────────────
const SEED_STAFF = [
  { id: 1, name: "Tunde Adeyemi",  role: "Electricians",        otherSkills: [],                              phone: "08011223344", email: "tunde.a@staff.ng",   status: "Available", currentJobId: null, averageRating: 4.7, totalReviews: 12, reviews: [] },
  { id: 2, name: "Chioma Nwosu",   role: "Housekeepers",         otherSkills: ["Laundry", "Ironing"],          phone: "08022334455", email: "chioma.n@staff.ng",  status: "Available", currentJobId: null, averageRating: 4.9, totalReviews: 8,  reviews: [] },
  { id: 3, name: "Ibrahim Musa",   role: "Masons / Bricklayers", otherSkills: ["Tiling", "Plastering"],        phone: "08033445566", email: "ibrahim.m@staff.ng", status: "Available", currentJobId: null, averageRating: 4.5, totalReviews: 20, reviews: [] },
  { id: 4, name: "Fatima Bello",   role: "Private Chefs",        otherSkills: ["Catering", "Baking"],          phone: "08044556677", email: "fatima.b@staff.ng",  status: "Available", currentJobId: null, averageRating: 5.0, totalReviews: 5,  reviews: [] },
  { id: 5, name: "Grace Okonkwo",  role: "Receptionists",        otherSkills: ["Customer Service", "Admin"],   phone: "08055667788", email: "grace.o@staff.ng",   status: "Available", currentJobId: null, averageRating: 4.3, totalReviews: 15, reviews: [] },
  { id: 6, name: "Emeka Eze",      role: "Security Guards",      otherSkills: ["CCTV Operation"],              phone: "08066778899", email: "emeka.e@staff.ng",   status: "Available", currentJobId: null, averageRating: 4.6, totalReviews: 9,  reviews: [] },
  { id: 7, name: "Amina Yusuf",    role: "Nannies",              otherSkills: ["Teaching", "First Aid"],       phone: "08077889900", email: "amina.y@staff.ng",   status: "Available", currentJobId: null, averageRating: 4.8, totalReviews: 11, reviews: [] },
  { id: 8, name: "Biodun Lawal",   role: "Plumbers",             otherSkills: ["Tiling", "Waterproofing"],     phone: "08088990011", email: "biodun.l@staff.ng",  status: "Available", currentJobId: null, averageRating: 4.2, totalReviews: 7,  reviews: [] },
];

const SEED_BLOG = [
  { id: 1, title: "How to find reliable household staff in Lagos",         date: "2026-04-18", status: "Published", excerpt: "Finding trustworthy domestic staff can be challenging in a busy city..." },
  { id: 2, title: "Top 5 benefits of outsourcing facility management",     date: "2026-04-05", status: "Published", excerpt: "Businesses across Nigeria are discovering the advantages..." },
  { id: 3, title: "Understanding labour regulations for domestic workers", date: "2026-03-22", status: "Draft",     excerpt: "The Nigerian Labour Act outlines specific provisions..." },
];

const SEED_TESTIMONIALS = [
  { id: 1, name: "Mrs Adunola Fashola", role: "Private client",          text: "Randle & Hopkick matched me with an incredible housekeeper within 48 hours. Highly recommend!", rating: 5, visible: true  },
  { id: 2, name: "Mr Seun Odun",        role: "HR Manager, FinEdge Ltd", text: "Seamless process. Our new receptionist started on time and exceeded expectations.",              rating: 5, visible: true  },
  { id: 3, name: "Chidinma Obi",        role: "Private client",          text: "I was skeptical at first but the process was smooth and transparent.",                            rating: 4, visible: false },
];

const SEED_MESSAGES = [
  { id: 1, from: "Kemi Adeyemi", subject: "Inquiry about generator technician", body: "Hello, do you have experienced generator technicians for a short-term contract?", type: "contact", time: "2h ago", read: false, replies: [] },
  { id: 2, from: "Tobi Alabi",   subject: "Change of address",                  body: "I need to update the location for my pending request to Ajah instead of Lekki.",  type: "contact", time: "1d ago", read: true,  replies: [] },
];

// ─── Default state factory ────────────────────────────────────────────────────
function defaultState() {
  return {
    requests:        [],
    registeredUsers: [],
    staff:           SEED_STAFF,
    blog:            SEED_BLOG,
    testimonials:    SEED_TESTIMONIALS,
    messages:        SEED_MESSAGES,
    nextReqId:       1,
    nextStaffId:     SEED_STAFF.length + 1,
    nextBlogId:      SEED_BLOG.length + 1,
    nextTestiId:     SEED_TESTIMONIALS.length + 1,
    nextMsgId:       SEED_MESSAGES.length + 1,
    lastSyncedAt:    null,
  };
}

// ─── localStorage persistence ──────────────────────────────────────────────────
// Bump version string to auto-clear stale shapes after breaking changes.
const STORE_KEY = "rnh_store_v3";

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaultState();
    const saved = JSON.parse(raw);

    // Merge seed staff — seeds always present; admin additions on top
    const savedIds    = new Set((saved.staff || []).map((s) => s.id));
    const mergedStaff = [
      ...SEED_STAFF.filter((s) => !savedIds.has(s.id)),
      ...(saved.staff || []).map((s) => ({ otherSkills: [], ...s })),
    ];

    // Merge seed testimonials
    const savedTestiIds = new Set((saved.testimonials || []).map((t) => t.id));
    const mergedTestis  = [
      ...SEED_TESTIMONIALS.filter((t) => !savedTestiIds.has(t.id)),
      ...(saved.testimonials || []),
    ];

    return {
      ...defaultState(),
      ...saved,
      staff:           mergedStaff,
      testimonials:    mergedTestis,
      registeredUsers: saved.registeredUsers || [],
      requests:        saved.requests        || [],
      // Ensure messages always have replies array
      messages: (saved.messages || SEED_MESSAGES).map((m) => ({ replies: [], ...m })),
    };
  } catch {
    return defaultState();
  }
}

function persistState(state) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch { /* storage quota — silently ignore */ }
}

// ─── Normalise a backend request object ──────────────────────────────────────
export function normaliseRequest(raw) {
  return {
    id:            raw._id          ?? raw.id,
    backendId:     raw._id          ?? raw.id,
    clientType:    raw.clientType   ?? (raw.personalDetails ? "Individual" : "Organisation"),
    clientName:
      raw.clientName
      ?? raw.companyDetails?.companyName
      ?? `${raw.personalDetails?.surname ?? ""} ${raw.personalDetails?.otherName ?? ""}`.trim(),
    email:         raw.email        ?? raw.companyDetails?.companyEmail   ?? raw.personalDetails?.email   ?? "",
    phone:         raw.phone        ?? raw.companyDetails?.companyPhone   ?? raw.personalDetails?.phoneNo ?? "",
    location:      raw.location     ?? raw.companyDetails?.companyAddress ?? raw.personalDetails?.businessLocation ?? "",
    roles:         raw.roles        ?? raw.requestedStaff ?? [],
    status:        raw.status       ?? "Pending",
    startDate:     raw.startDate    ?? "",
    endDate:       raw.endDate      ?? "",
    assignedStaff: raw.assignedStaff ?? [],
    reviews:       raw.reviews      ?? [],
    // reviewed = true only after a review has been submitted
    reviewed:      raw.reviewed     ?? false,
    submittedAt:   raw.submittedAt  ?? raw.createdAt ?? new Date().toISOString(),
  };
}

// Normalise a backend staff object
export function normaliseStaff(raw) {
  return {
    id:            raw._id          ?? raw.id,
    backendId:     raw._id          ?? raw.id,
    name:          raw.name         ?? `${raw.surname ?? ""} ${raw.otherNames ?? ""}`.trim(),
    role:          raw.role         ?? raw.primarySkill ?? "",
    otherSkills:   raw.otherSkills  ?? [],
    phone:         raw.phone        ?? raw.phoneNumber ?? "",
    email:         raw.email        ?? "",
    status:        raw.status       ?? "Available",
    currentJobId:  raw.currentJobId ?? null,
    averageRating: raw.averageRating ?? 0,
    totalReviews:  raw.totalReviews  ?? 0,
    reviews:       raw.reviews       ?? [],
  };
}

// Normalise a backend user object
export function normaliseUser(raw) {
  return {
    id:           raw._id         ?? raw.id,
    surname:      raw.surname     ?? "",
    otherNames:   raw.otherNames  ?? "",
    email:        raw.email       ?? "",
    phoneNumber:  raw.phoneNumber ?? raw.phone ?? "",
    photoUrl:     raw.photoUrl    ?? "",
    registeredAt: raw.createdAt   ?? raw.registeredAt ?? new Date().toISOString(),
  };
}

// ─── buildRequestPayload (used by forms after API call) ──────────────────────
export function buildRequestPayload(apiPayload, apiResponse) {
  if (apiResponse && (apiResponse._id || apiResponse.id)) {
    return normaliseRequest({ ...apiPayload, ...apiResponse });
  }
  const isOrg = apiPayload.clientType === "Organisation";
  return {
    id:            apiResponse?.id  ?? Date.now(),
    backendId:     apiResponse?._id ?? null,
    clientType:    apiPayload.clientType,
    clientName:    isOrg
                    ? apiPayload.companyDetails?.companyName
                    : `${apiPayload.personalDetails?.surname ?? ""} ${apiPayload.personalDetails?.otherName ?? ""}`.trim(),
    email:         isOrg ? apiPayload.companyDetails?.companyEmail   : apiPayload.personalDetails?.email,
    phone:         isOrg ? apiPayload.companyDetails?.companyPhone   : apiPayload.personalDetails?.phoneNo,
    location:      isOrg ? apiPayload.companyDetails?.companyAddress : apiPayload.personalDetails?.businessLocation,
    roles:         apiPayload.requestedStaff ?? [],
    status:        "Pending",
    startDate:     "",
    endDate:       "",
    assignedStaff: [],
    reviews:       [],
    reviewed:      false,
    submittedAt:   new Date().toISOString(),
  };
}

// ─── Reducer ──────────────────────────────────────────────────────────────────
function reducer(state, action) {
  let next = state;

  switch (action.type) {

    // ── Marketplace bulk sync — replaces users, requests, staff from backend ──
    case "SYNC_MARKETPLACE": {
      const { users = [], requests = [], staff = [] } = action.payload;

      // ── Users ──
      const incomingUsers = users.map(normaliseUser);
      const serverEmails  = new Set(incomingUsers.map((u) => u.email));
      const localOnlyUsers = state.registeredUsers.filter((u) => !serverEmails.has(u.email));
      const mergedUsers    = [...incomingUsers, ...localOnlyUsers];

      // ── Requests — backend wins for status/dates, local wins for reviews ──
      const incomingReqs = requests.map(normaliseRequest);
      const localMap     = new Map(state.requests.map((r) => [String(r.id), r]));
      const mergedReqs   = incomingReqs.map((r) => {
        const local = localMap.get(String(r.id));
        return local
          ? { ...r, reviews: local.reviews ?? r.reviews, reviewed: local.reviewed ?? r.reviewed }
          : r;
      });
      // Keep local-only optimistic requests not yet acknowledged
      const localOnlyReqs = state.requests.filter(
        (r) => !r.backendId && !incomingReqs.some((i) => String(i.id) === String(r.id))
      );

      // ── Staff — merge with seed; backend wins for ratings/status ──
      const incomingStaff = staff.map(normaliseStaff);
      const serverStaffIds = new Set(incomingStaff.map((s) => String(s.id)));
      // Keep any locally added seed/admin staff not on backend yet
      const localOnlyStaff = state.staff.filter((s) => !serverStaffIds.has(String(s.id)));
      const mergedStaff    = [...incomingStaff, ...localOnlyStaff];

      next = {
        ...state,
        registeredUsers: mergedUsers,
        requests:        [...mergedReqs, ...localOnlyReqs],
        staff:           mergedStaff,
        lastSyncedAt:    new Date().toISOString(),
      };
      break;
    }

    // ── Backend sync — bulk replace requests only ─────────────────────────────
    case "SET_REQUESTS": {
      const incoming = (action.payload || []).map(normaliseRequest);
      const localMap = new Map(state.requests.map((r) => [String(r.id), r]));
      const merged   = incoming.map((r) => {
        const local = localMap.get(String(r.id));
        return local
          ? { ...r, reviews: local.reviews ?? r.reviews, reviewed: local.reviewed ?? r.reviewed }
          : r;
      });
      const localOnly = state.requests.filter(
        (r) => !r.backendId && !incoming.some((i) => String(i.id) === String(r.id))
      );
      next = { ...state, requests: [...merged, ...localOnly], lastSyncedAt: new Date().toISOString() };
      break;
    }

    // ── Registered users (admin bulk set) ────────────────────────────────────
    case "SET_REGISTERED_USERS": {
      const incoming     = (action.payload || []).map(normaliseUser);
      const serverEmails = new Set(incoming.map((u) => u.email));
      const localOnly    = state.registeredUsers.filter((u) => !serverEmails.has(u.email));
      next = { ...state, registeredUsers: [...incoming, ...localOnly] };
      break;
    }

    // ── Registration ──────────────────────────────────────────────────────────
    case "REGISTER_USER": {
      const exists = state.registeredUsers.some((u) => u.email === action.payload.email);
      if (exists) return state;
      next = {
        ...state,
        registeredUsers: [
          ...state.registeredUsers,
          { id: Date.now(), photoUrl: "", ...action.payload, registeredAt: action.payload.registeredAt ?? new Date().toISOString() },
        ],
      };
      break;
    }

    case "UPDATE_REGISTERED_USER": {
      next = {
        ...state,
        registeredUsers: state.registeredUsers.map((u) =>
          u.email === action.payload.email ? { ...u, ...action.payload } : u
        ),
      };
      break;
    }

    // ── Add request (optimistic) ──────────────────────────────────────────────
    case "ADD_REQUEST": {
      const id = action.payload.id ?? action.payload.backendId ?? Date.now();
      const alreadyExists = state.requests.some(
        (r) =>
          String(r.id) === String(id) ||
          (action.payload.backendId && String(r.backendId) === String(action.payload.backendId))
      );
      if (alreadyExists) return state;
      const req = {
        id,
        backendId:     action.payload.backendId ?? null,
        clientType:    action.payload.clientType ?? "",
        clientName:    action.payload.clientName ?? "",
        email:         action.payload.email      ?? "",
        phone:         action.payload.phone      ?? "",
        location:      action.payload.location   ?? "",
        roles:         action.payload.roles      ?? [],
        status:        "Pending",
        startDate:     "",
        endDate:       "",
        assignedStaff: [],
        reviews:       [],
        reviewed:      false,
        submittedAt:   action.payload.submittedAt ?? new Date().toISOString(),
      };
      next = { ...state, requests: [...state.requests, req], nextReqId: state.nextReqId + 1 };
      break;
    }

    // ── Request status transitions ─────────────────────────────────────────────
    case "APPROVE_REQUEST":
      next = {
        ...state,
        requests: state.requests.map((r) => String(r.id) === String(action.id) ? { ...r, status: "Approved" } : r),
      };
      break;

    case "REJECT_REQUEST":
      next = {
        ...state,
        requests: state.requests.map((r) => String(r.id) === String(action.id) ? { ...r, status: "Rejected" } : r),
      };
      break;

    case "ACTIVATE_REQUEST":
      next = {
        ...state,
        requests: state.requests.map((r) => String(r.id) === String(action.id) ? { ...r, status: "Active" } : r),
      };
      break;

    case "COMPLETE_REQUEST": {
      const updated  = state.requests.map((r) =>
        String(r.id) === String(action.id) ? { ...r, status: "Completed" } : r
      );
      const req      = state.requests.find((r) => String(r.id) === String(action.id));
      const freedIds = req?.assignedStaff?.map((s) => s.id) ?? [];
      next = {
        ...state,
        requests: updated,
        staff:    state.staff.map((s) =>
          freedIds.includes(s.id) ? { ...s, status: "Available", currentJobId: null } : s
        ),
      };
      break;
    }

    case "SET_DATES":
    case "UPDATE_DATES": {
      const { id, startDate, endDate } = action;
      next = {
        ...state,
        requests: state.requests.map((r) =>
          String(r.id) === String(id)
            ? { ...r, startDate, endDate, status: startDate && endDate ? "Active" : r.status }
            : r
        ),
      };
      break;
    }

    case "ASSIGN_STAFF": {
      const { reqId, assignedStaff } = action;
      const req     = state.requests.find((r) => String(r.id) === String(reqId));
      const prevIds = req ? req.assignedStaff.map((s) => s.id) : [];
      const newIds  = assignedStaff.map((s) => s.id);
      const freed   = prevIds.filter((id) => !newIds.includes(id));
      const busied  = newIds.filter((id) => !prevIds.includes(id));
      next = {
        ...state,
        requests: state.requests.map((r) =>
          String(r.id) === String(reqId) ? { ...r, assignedStaff } : r
        ),
        staff: state.staff.map((s) => {
          if (freed.includes(s.id))  return { ...s, status: "Available", currentJobId: null };
          if (busied.includes(s.id)) return { ...s, status: "Active",    currentJobId: Number(reqId) };
          return s;
        }),
      };
      break;
    }

    // ── Reviews ───────────────────────────────────────────────────────────────
    case "SUBMIT_REVIEW": {
      const { reqId, staffId, rating, comment } = action;
      const review = { rating, comment, submittedAt: new Date().toISOString(), reviewedReqId: reqId };
      const updatedReqs = state.requests.map((r) =>
        String(r.id) === String(reqId)
          ? { ...r, reviews: [...(r.reviews || []), review], reviewed: true }
          : r
      );
      const updatedStaff = state.staff.map((s) => {
        if (String(s.id) !== String(staffId)) return s;
        const allReviews = [...(s.reviews || []), review];
        const avg        = allReviews.reduce((sum, rv) => sum + rv.rating, 0) / allReviews.length;
        return { ...s, reviews: allReviews, averageRating: Math.round(avg * 10) / 10, totalReviews: allReviews.length };
      });
      next = { ...state, requests: updatedReqs, staff: updatedStaff };
      break;
    }

    // ── Staff registry ─────────────────────────────────────────────────────────
    case "ADD_STAFF": {
      const s = {
        ...action.payload,
        id:            state.nextStaffId,
        otherSkills:   action.payload.otherSkills ?? [],
        status:        "Available",
        currentJobId:  null,
        averageRating: 0,
        totalReviews:  0,
        reviews:       [],
      };
      next = { ...state, staff: [...state.staff, s], nextStaffId: state.nextStaffId + 1 };
      break;
    }
    case "UPDATE_STAFF":
      next = {
        ...state,
        staff: state.staff.map((s) => s.id === action.payload.id ? { ...s, ...action.payload } : s),
      };
      break;
    case "REMOVE_STAFF":
      next = { ...state, staff: state.staff.filter((s) => s.id !== action.id) };
      break;

    // ── Blog ──────────────────────────────────────────────────────────────────
    case "ADD_BLOG":
      next = { ...state, blog: [...state.blog, { ...action.payload, id: state.nextBlogId }], nextBlogId: state.nextBlogId + 1 };
      break;
    case "UPDATE_BLOG":
      next = { ...state, blog: state.blog.map((p) => p.id === action.payload.id ? { ...p, ...action.payload } : p) };
      break;
    case "DELETE_BLOG":
      next = { ...state, blog: state.blog.filter((p) => p.id !== action.id) };
      break;

    // ── Testimonials ──────────────────────────────────────────────────────────
    case "ADD_TESTI": {
      const id = action.payload.id ?? state.nextTestiId;
      if (state.testimonials.some((t) => t.id === id)) {
        return { ...state, testimonials: state.testimonials.map((t) => t.id === id ? { ...t, ...action.payload } : t) };
      }
      next = { ...state, testimonials: [...state.testimonials, { visible: true, ...action.payload, id }], nextTestiId: state.nextTestiId + 1 };
      break;
    }
    case "UPDATE_TESTI":
      next = { ...state, testimonials: state.testimonials.map((t) => t.id === action.payload.id ? { ...t, ...action.payload } : t) };
      break;
    case "DELETE_TESTI":
      next = { ...state, testimonials: state.testimonials.filter((t) => t.id !== action.id) };
      break;

    // ── Messages ──────────────────────────────────────────────────────────────
    case "MARK_MSG_READ":
      next = { ...state, messages: state.messages.map((m) => m.id === action.id ? { ...m, read: true } : m) };
      break;
    case "ADD_MSG":
      next = {
        ...state,
        messages:  [...state.messages, { replies: [], ...action.payload, id: state.nextMsgId, read: false, time: "Just now" }],
        nextMsgId: state.nextMsgId + 1,
      };
      break;
    // ── Threaded replies — push { text, sentAt, from:"Admin" } into msg.replies[] ──
    case "REPLY_MSG":
      next = {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.id
            ? { ...m, replies: [...(m.replies ?? []), { text: action.text, sentAt: Date.now(), from: "Admin" }] }
            : m
        ),
      };
      break;

    default:
      return state;
  }

  persistState(next);
  return next;
}

// ─── Context & Provider ───────────────────────────────────────────────────────
const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  // ── Real-time polling: fetch marketplace every POLL_INTERVAL ms ──
  const timerRef = useRef(null);

  const syncMarketplace = useCallback(async () => {
    try {
      const data = await apiGetMarketplace();
      // The endpoint returns something like { users, requests, staff } — adjust
      // field names here if your backend uses different keys.
      const users    = data.users    ?? data.registeredUsers ?? [];
      const requests = data.requests ?? data.staffRequests   ?? [];
      const staff    = data.staff    ?? data.staffMembers    ?? [];
      dispatch({ type: "SYNC_MARKETPLACE", payload: { users, requests, staff } });
    } catch {
      // Silently swallow — we still have cached state; try again next interval
    }
  }, []);

  useEffect(() => {
    // Initial fetch on mount
    syncMarketplace();
    // Set up polling
    timerRef.current = setInterval(syncMarketplace, POLL_INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [syncMarketplace]);

  return (
    <StoreContext.Provider value={{ state, dispatch, syncMarketplace }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}

// ─── Profile helpers ──────────────────────────────────────────────────────────
const PROFILE_KEY = "rnh_profile_v1";

export function loadProfile() {
  try { const raw = localStorage.getItem(PROFILE_KEY); return raw ? JSON.parse(raw) : null; }
  catch { return null; }
}

export function saveProfile(profile) {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch {}
}

export default normaliseRequest;