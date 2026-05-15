// src/store.js
// ─── Shared reactive store ────────────────────────────────────────────────────
// localStorage is used ONLY for UI-owned data (blog, staff, testimonials,
// message replies). All server-owned data (requests, registeredUsers) is
// always fetched fresh from the backend on mount and on tab focus.

import { createContext, useContext, useReducer } from "react";

// ─── Seed data ────────────────────────────────────────────────────────────────
const SEED_STAFF = [
  { id: 1, name: "Tunde Adeyemi",  role: "Electricians",        phone: "08011223344", email: "tunde.a@staff.ng",   status: "Available", currentJobId: null, averageRating: 4.7, totalReviews: 12, reviews: [], otherSkills: [] },
  { id: 2, name: "Chioma Nwosu",   role: "Housekeepers",         phone: "08022334455", email: "chioma.n@staff.ng",  status: "Available", currentJobId: null, averageRating: 4.9, totalReviews: 8,  reviews: [], otherSkills: [] },
  { id: 3, name: "Ibrahim Musa",   role: "Masons / Bricklayers", phone: "08033445566", email: "ibrahim.m@staff.ng", status: "Available", currentJobId: null, averageRating: 4.5, totalReviews: 20, reviews: [], otherSkills: [] },
  { id: 4, name: "Fatima Bello",   role: "Private Chefs",        phone: "08044556677", email: "fatima.b@staff.ng",  status: "Available", currentJobId: null, averageRating: 5.0, totalReviews: 5,  reviews: [], otherSkills: [] },
  { id: 5, name: "Grace Okonkwo",  role: "Receptionists",        phone: "08055667788", email: "grace.o@staff.ng",   status: "Available", currentJobId: null, averageRating: 4.3, totalReviews: 15, reviews: [], otherSkills: [] },
  { id: 6, name: "Emeka Eze",      role: "Security Guards",      phone: "08066778899", email: "emeka.e@staff.ng",   status: "Available", currentJobId: null, averageRating: 4.6, totalReviews: 9,  reviews: [], otherSkills: [] },
  { id: 7, name: "Amina Yusuf",    role: "Nannies",              phone: "08077889900", email: "amina.y@staff.ng",   status: "Available", currentJobId: null, averageRating: 4.8, totalReviews: 11, reviews: [], otherSkills: [] },
  { id: 8, name: "Biodun Lawal",   role: "Plumbers",             phone: "08088990011", email: "biodun.l@staff.ng",  status: "Available", currentJobId: null, averageRating: 4.2, totalReviews: 7,  reviews: [], otherSkills: [] },
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
    requests:        [],   // always loaded from backend
    registeredUsers: [],   // always loaded from backend
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

// ─── localStorage ─────────────────────────────────────────────────────────────
// v4 — only persists UI-owned data, not server-owned data
const STORE_KEY = "rnh_store_v4";

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaultState();
    const saved = JSON.parse(raw);

    // Merge seed staff with saved staff (saved wins on id conflict)
    const savedStaffIds = new Set((saved.staff || []).map((s) => s.id));
    const mergedStaff   = [
      ...SEED_STAFF.filter((s) => !savedStaffIds.has(s.id)),
      ...(saved.staff || []),
    ];

    // Merge seed testimonials with saved testimonials
    const savedTestiIds = new Set((saved.testimonials || []).map((t) => t.id));
    const mergedTestis  = [
      ...SEED_TESTIMONIALS.filter((t) => !savedTestiIds.has(t.id)),
      ...(saved.testimonials || []),
    ];

    // Ensure replies array exists on every message
    const mergedMessages = (saved.messages ?? SEED_MESSAGES).map((m) => ({
      ...m,
      replies: m.replies ?? [],
    }));

    return {
      ...defaultState(),
      ...saved,
      staff:           mergedStaff,
      testimonials:    mergedTestis,
      messages:        mergedMessages,
      // Always start with empty server-owned data; backend will populate on mount
      registeredUsers: [],
      requests:        [],
    };
  } catch {
    return defaultState();
  }
}

// Only persist UI-owned data — server-owned data comes from the backend
function persistState(state) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      staff:        state.staff,
      blog:         state.blog,
      testimonials: state.testimonials,
      messages:     state.messages,
      nextStaffId:  state.nextStaffId,
      nextBlogId:   state.nextBlogId,
      nextTestiId:  state.nextTestiId,
      nextMsgId:    state.nextMsgId,
    }));
  } catch {}
}

// ─────────────────────────────────────────────────────────────────────────────
// pickArray
// ─────────────────────────────────────────────────────────────────────────────
function pickArray(obj, ...keys) {
  if (!obj || typeof obj !== "object") return [];
  for (const key of keys) {
    const val = key.split(".").reduce((o, k) => (o && typeof o === "object" ? o[k] : undefined), obj);
    if (Array.isArray(val) && val.length > 0) return val;
  }
  // Last-resort: return first non-empty array found
  for (const val of Object.values(obj)) {
    if (Array.isArray(val) && val.length > 0) return val;
  }
  return [];
}

// ─────────────────────────────────────────────────────────────────────────────
// normaliseRequest
// ─────────────────────────────────────────────────────────────────────────────
export function normaliseRequest(raw) {
  if (!raw || typeof raw !== "object") return null;

  const clientType =
    raw.clientType ??
    (raw.companyDetails  ? "Organisation" :
     raw.personalDetails ? "Individual"   : "Unknown");

  const clientName =
    raw.clientName ??
    raw.companyDetails?.companyName ??
    raw.companyDetails?.name ??
    (raw.personalDetails
      ? `${raw.personalDetails.surname   ?? raw.personalDetails.firstName ?? ""}
         ${raw.personalDetails.otherName ?? raw.personalDetails.lastName  ?? ""}`.trim()
      : raw.name ?? "");

  const email =
    raw.email ??
    raw.companyDetails?.companyEmail  ?? raw.companyDetails?.email  ??
    raw.personalDetails?.email        ?? "";

  const phone =
    raw.phone ?? raw.phoneNumber ??
    raw.companyDetails?.companyPhone  ?? raw.companyDetails?.phone  ??
    raw.personalDetails?.phoneNo      ?? raw.personalDetails?.phone ??
    raw.personalDetails?.phoneNumber  ?? "";

  const location =
    raw.location ?? raw.address ??
    raw.companyDetails?.companyAddress ?? raw.companyDetails?.address ??
    raw.personalDetails?.businessLocation ??
    raw.personalDetails?.address      ?? raw.personalDetails?.location ?? "";

  const rawRoles = raw.roles ?? raw.requestedStaff ?? raw.staffRoles ?? raw.services ?? [];
  const roles = (Array.isArray(rawRoles) ? rawRoles : []).map((r) => {
    if (typeof r === "string") return { role: r, quantity: 1 };
    return {
      role:     r.role     ?? r.name  ?? r.title    ?? r.staffType ?? r.type ?? "Staff",
      quantity: r.quantity ?? r.count ?? r.qty       ?? r.number   ?? 1,
    };
  });

  const rawStatus = raw.status ?? "Pending";
  const status    = rawStatus === "Rejected" ? "Declined" : rawStatus;

  const reviews = (raw.reviews ?? []).map((rv) => ({
    rating:        rv.rating  ?? rv.stars   ?? 0,
    comment:       rv.comment ?? rv.review  ?? rv.text  ?? "",
    submittedAt:   rv.submittedAt ?? rv.createdAt ?? new Date().toISOString(),
    reviewedReqId: rv.reviewedReqId ?? raw._id ?? raw.id,
    staffId:       rv.staffId  ?? rv.staff  ?? null,
  }));

  const assignedStaff = (raw.assignedStaff ?? raw.staff ?? raw.assignedTo ?? []).map((s) =>
    typeof s === "string"
      ? { id: s, name: s }
      : { id: s._id ?? s.id, name: s.name ?? s.fullName ?? s.staffName ?? "" }
  );

  return {
    id:            raw._id ?? raw.id,
    backendId:     raw._id ?? raw.id,
    clientType,
    clientName,
    email,
    phone,
    location,
    roles,
    status,
    startDate:     raw.startDate  ?? raw.start        ?? raw.startingDate ?? "",
    endDate:       raw.endDate    ?? raw.end           ?? raw.endingDate   ?? "",
    assignedStaff,
    reviews,
    reviewed:      raw.reviewed   ?? reviews.length > 0,
    submittedAt:   raw.submittedAt ?? raw.createdAt   ?? raw.dateSubmitted ?? new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// normaliseUser
// ─────────────────────────────────────────────────────────────────────────────
export function normaliseUser(u) {
  if (!u || typeof u !== "object") return null;

  let surname    = u.surname    ?? u.lastName  ?? "";
  let otherNames = u.otherNames ?? u.firstName ?? u.otherName ?? "";

  if (!surname && !otherNames) {
    const full  = (u.fullName ?? u.name ?? "").trim();
    const parts = full.split(/\s+/);
    surname     = parts[0]            ?? "";
    otherNames  = parts.slice(1).join(" ");
  }

  return {
    id:           u._id         ?? u.id,
    surname,
    otherNames,
    email:        u.email       ?? "",
    phoneNumber:  u.phoneNumber ?? u.phone ?? u.phoneNo ?? "",
    photoUrl:     u.photoUrl    ?? u.avatar ?? u.profilePicture ?? u.photo ?? "",
    registeredAt: u.createdAt   ?? u.registeredAt ?? u.dateRegistered ?? new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// normaliseStaff
// ─────────────────────────────────────────────────────────────────────────────
export function normaliseStaff(s) {
  if (!s || typeof s !== "object") return null;

  let name = s.name ?? s.fullName ?? "";
  if (!name && (s.firstName || s.lastName)) {
    name = `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim();
  }

  const reviews = (s.reviews ?? []).map((r) => ({
    rating:      r.rating  ?? r.stars ?? 0,
    comment:     r.comment ?? r.text  ?? "",
    submittedAt: r.submittedAt ?? r.createdAt ?? new Date().toISOString(),
  }));

  return {
    id:            s._id          ?? s.id,
    name,
    role:          s.role         ?? s.primaryRole ?? s.skillSet ?? s.title ?? s.position ?? "",
    phone:         s.phone        ?? s.phoneNumber  ?? s.phoneNo  ?? "",
    email:         s.email        ?? "",
    status:        s.status       ?? "Available",
    currentJobId:  s.currentJobId ?? null,
    averageRating: typeof s.averageRating === "number" ? s.averageRating : (s.rating ?? 0),
    totalReviews:  typeof s.totalReviews  === "number" ? s.totalReviews  : (s.reviewCount ?? reviews.length),
    reviews,
    otherSkills:   s.otherSkills ?? s.alternateSkills ?? s.skills ?? [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// normaliseMessage
// ─────────────────────────────────────────────────────────────────────────────
export function normaliseMessage(m, idx) {
  if (!m || typeof m !== "object") return null;
  return {
    id:      m._id     ?? m.id      ?? `server-${idx}`,
    from:    m.from    ?? m.name    ?? m.senderName  ?? m.sender ?? "Unknown",
    subject: m.subject ?? m.title   ?? m.topic       ?? "New message",
    body:    m.body    ?? m.message ?? m.content     ?? m.text   ?? "",
    type:    m.type    ?? "contact",
    time:    m.time    ?? (m.createdAt
               ? new Date(m.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
               : "Recently"),
    read:    m.read    ?? false,
    replies: (m.replies ?? []).map((r) => ({
      text:   r.text   ?? r.body ?? r.message ?? "",
      sentAt: r.sentAt ?? r.createdAt ?? new Date().toISOString(),
    })),
    email:   m.email   ?? m.senderEmail ?? "",
    phone:   m.phone   ?? m.phoneNumber ?? "",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// parseMasterMarketplace
// ─────────────────────────────────────────────────────────────────────────────
export function parseMasterMarketplace(raw) {
  if (!raw || typeof raw !== "object") {
    return { users: [], requests: [], messages: [], staff: [] };
  }

  // DEV diagnostic — check the browser console
  if (typeof window !== "undefined" && process?.env?.NODE_ENV !== "production") {
    console.group("🛰  [mastermarketplace] raw response");
    console.log("Top-level keys:", Object.keys(raw));
    Object.entries(raw).forEach(([k, v]) => {
      console.log(
        `  ${k}: ${Array.isArray(v) ? `Array(${v.length})` : typeof v}`,
        Array.isArray(v) && v[0] ? "sample →" : "",
        Array.isArray(v) && v[0] ? JSON.stringify(v[0]).slice(0, 120) : ""
      );
    });
    console.groupEnd();
  }

  // Unwrap common envelope shapes
  const root = raw.data ?? raw.result ?? raw.payload ?? raw.response ?? raw;

  const rawUsers = pickArray(
    root,
    "users", "registeredUsers", "clients", "members",
    "accounts", "userList", "allUsers", "userData",
    "data.users", "data.registeredUsers", "data.clients",
  );

  const rawRequests = pickArray(
    root,
    "requests", "profiles", "staffRequests", "applications",
    "orders", "jobs", "allRequests", "requestData",
    "data.requests", "data.profiles", "data.staffRequests",
  );

  const rawMessages = pickArray(
    root,
    "messages", "contacts", "contactMessages", "enquiries",
    "inquiries", "inbox", "allMessages", "messageData",
    "data.messages", "data.contacts", "data.enquiries",
  );

  const rawStaff = pickArray(
    root,
    "staff", "staffMembers", "workers", "employees",
    "agents", "allStaff", "staffData",
    "data.staff", "data.staffMembers", "data.workers",
  );

  return {
    users:    rawUsers.map(normaliseUser).filter(Boolean),
    requests: rawRequests.map(normaliseRequest).filter(Boolean),
    messages: rawMessages.map((m, i) => normaliseMessage(m, i)).filter(Boolean),
    staff:    rawStaff.map(normaliseStaff).filter(Boolean),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// buildRequestPayload
// ─────────────────────────────────────────────────────────────────────────────
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
                     : `${apiPayload.personalDetails?.surname   ?? ""}
                        ${apiPayload.personalDetails?.otherName ?? ""}`.trim(),
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

// ─────────────────────────────────────────────────────────────────────────────
// Reducer
// ─────────────────────────────────────────────────────────────────────────────
function reducer(state, action) {
  let next = state;

  switch (action.type) {

    // ── LOAD_MARKETPLACE ──────────────────────────────────────────────────────
    // Payload is pre-parsed by parseMasterMarketplace() before dispatch.
    // Shape: { users[], requests[], messages[], staff[] }
    case "LOAD_MARKETPLACE": {
      const { users = [], requests = [], messages = [], staff = [] } = action.payload;

      // Requests: backend wins; preserve local reviews/reviewed flags
      const localReqMap    = new Map(state.requests.map((r) => [String(r.id), r]));
      const mergedRequests = requests.map((r) => {
        const local = localReqMap.get(String(r.id));
        if (!local) return r;
        return {
          ...r,
          reviews:  local.reviews?.length ? local.reviews  : r.reviews,
          reviewed: local.reviewed        ? local.reviewed : r.reviewed,
        };
      });
      // Keep requests that were added locally (no backendId) and not yet synced
      const backendReqIds = new Set(requests.map((r) => String(r.id)));
      const localOnlyReqs = state.requests.filter(
        (r) => !r.backendId && !backendReqIds.has(String(r.id))
      );

      // Users: backend is source of truth; preserve local-only entries
      const serverEmails   = new Set(users.map((u) => u.email));
      const localOnlyUsers = state.registeredUsers.filter((u) => !serverEmails.has(u.email));

      // Messages: backend wins; merge local replies into server messages;
      // preserve local-only seed messages
      const localMsgMap   = new Map(state.messages.map((m) => [String(m.id), m]));
      const mergedMessages = messages.map((m) => {
        const local = localMsgMap.get(String(m.id));
        if (!local) return m;
        // Preserve any replies the admin typed locally
        return {
          ...m,
          read:    local.read || m.read,
          replies: local.replies?.length ? local.replies : m.replies,
        };
      });
      const serverMsgIds  = new Set(messages.map((m) => String(m.id)));
      const localOnlyMsgs = state.messages.filter((m) => !serverMsgIds.has(String(m.id)));

      // Staff: update existing records, append brand-new backend staff
      const backendStaffMap = new Map(staff.map((s) => [String(s.id), s]));
      const mergedStaff     = state.staff.map((s) => {
        const b = backendStaffMap.get(String(s.id));
        if (!b) return s;
        return {
          ...s,
          ...b,
          otherSkills:   b.otherSkills?.length ? b.otherSkills : s.otherSkills,
          averageRating: b.averageRating > 0   ? b.averageRating : s.averageRating,
          totalReviews:  b.totalReviews  > 0   ? b.totalReviews  : s.totalReviews,
        };
      });
      const localStaffIds = new Set(state.staff.map((s) => String(s.id)));
      const brandNewStaff = staff.filter((s) => !localStaffIds.has(String(s.id)));

      next = {
        ...state,
        requests:        [...mergedRequests, ...localOnlyReqs],
        registeredUsers: [...users, ...localOnlyUsers],
        messages:        [...mergedMessages, ...localOnlyMsgs],
        staff:           [...mergedStaff, ...brandNewStaff],
        lastSyncedAt:    new Date().toISOString(),
      };
      break;
    }

    // ── SET_REQUESTS ─────────────────────────────────────────────────────────
    case "SET_REQUESTS": {
      const incoming   = (action.payload || []).map(normaliseRequest).filter(Boolean);
      const localMap   = new Map(state.requests.map((r) => [String(r.id), r]));
      const merged     = incoming.map((r) => {
        const local = localMap.get(String(r.id));
        return local
          ? { ...r, reviews: local.reviews ?? r.reviews, reviewed: local.reviewed ?? r.reviewed }
          : r;
      });
      const backendIds = new Set(incoming.map((r) => String(r.id)));
      const localOnly  = state.requests.filter(
        (r) => !r.backendId && !backendIds.has(String(r.id))
      );
      next = { ...state, requests: [...merged, ...localOnly], lastSyncedAt: new Date().toISOString() };
      break;
    }

    // ── SET_REGISTERED_USERS ──────────────────────────────────────────────────
    case "SET_REGISTERED_USERS": {
      const incoming     = (action.payload || []).map(normaliseUser).filter(Boolean);
      const serverEmails = new Set(incoming.map((u) => u.email));
      const localOnly    = state.registeredUsers.filter((u) => !serverEmails.has(u.email));
      next = { ...state, registeredUsers: [...incoming, ...localOnly] };
      break;
    }

    // ── REGISTER_USER ─────────────────────────────────────────────────────────
    case "REGISTER_USER": {
      if (state.registeredUsers.some((u) => u.email === action.payload.email)) return state;
      next = {
        ...state,
        registeredUsers: [
          ...state.registeredUsers,
          {
            id:           Date.now(),
            photoUrl:     "",
            ...action.payload,
            registeredAt: action.payload.registeredAt ?? new Date().toISOString(),
          },
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

    // ── ADD_REQUEST (optimistic) ──────────────────────────────────────────────
    case "ADD_REQUEST": {
      const id = action.payload.id ?? action.payload.backendId ?? Date.now();
      const already = state.requests.some(
        (r) =>
          String(r.id) === String(id) ||
          (action.payload.backendId && String(r.backendId) === String(action.payload.backendId))
      );
      if (already) return state;
      next = {
        ...state,
        requests: [
          ...state.requests,
          {
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
          },
        ],
        nextReqId: state.nextReqId + 1,
      };
      break;
    }

    // ── Status transitions ────────────────────────────────────────────────────
    case "APPROVE_REQUEST": {
      next = {
        ...state,
        requests: state.requests.map((r) =>
          String(r.id) === String(action.id) ? { ...r, status: "Approved" } : r
        ),
      };
      break;
    }

    case "DECLINE_REQUEST":
    case "REJECT_REQUEST": {
      next = {
        ...state,
        requests: state.requests.map((r) =>
          String(r.id) === String(action.id) ? { ...r, status: "Declined" } : r
        ),
      };
      break;
    }

    case "ACTIVATE_REQUEST": {
      next = {
        ...state,
        requests: state.requests.map((r) =>
          String(r.id) === String(action.id) ? { ...r, status: "Active" } : r
        ),
      };
      break;
    }

    case "COMPLETE_REQUEST": {
      const req      = state.requests.find((r) => String(r.id) === String(action.id));
      const freedIds = req?.assignedStaff?.map((s) => s.id) ?? [];
      next = {
        ...state,
        requests: state.requests.map((r) =>
          String(r.id) === String(action.id) ? { ...r, status: "Completed" } : r
        ),
        staff: state.staff.map((s) =>
          freedIds.includes(s.id) ? { ...s, status: "Available", currentJobId: null } : s
        ),
      };
      break;
    }

    // SET_DATES: saves dates; only flips Approved → Active (not Pending → Active)
    case "SET_DATES":
    case "UPDATE_DATES": {
      const { id, startDate, endDate } = action;
      next = {
        ...state,
        requests: state.requests.map((r) => {
          if (String(r.id) !== String(id)) return r;
          const shouldActivate = r.status === "Approved" && startDate && endDate;
          return { ...r, startDate, endDate, status: shouldActivate ? "Active" : r.status };
        }),
      };
      break;
    }

    case "ASSIGN_STAFF": {
      const { reqId, assignedStaff } = action;
      const req     = state.requests.find((r) => String(r.id) === String(reqId));
      const prevIds = req?.assignedStaff?.map((s) => s.id) ?? [];
      const newIds  = assignedStaff.map((s) => s.id);
      next = {
        ...state,
        requests: state.requests.map((r) =>
          String(r.id) === String(reqId) ? { ...r, assignedStaff } : r
        ),
        staff: state.staff.map((s) => {
          if (prevIds.includes(s.id) && !newIds.includes(s.id))
            return { ...s, status: "Available", currentJobId: null };
          if (!prevIds.includes(s.id) && newIds.includes(s.id))
            return { ...s, status: "Active", currentJobId: Number(reqId) };
          return s;
        }),
      };
      break;
    }

    // ── Reviews ───────────────────────────────────────────────────────────────
    case "SUBMIT_REVIEW": {
      const { reqId, staffId, rating, comment } = action;
      const review = { rating, comment, submittedAt: new Date().toISOString(), reviewedReqId: reqId };
      const updatedStaff = state.staff.map((s) => {
        if (s.id !== staffId) return s;
        const allReviews = [...(s.reviews || []), review];
        const avg = allReviews.reduce((sum, rv) => sum + rv.rating, 0) / allReviews.length;
        return { ...s, reviews: allReviews, averageRating: Math.round(avg * 10) / 10, totalReviews: allReviews.length };
      });
      next = {
        ...state,
        requests: state.requests.map((r) =>
          String(r.id) === String(reqId)
            ? { ...r, reviews: [...(r.reviews || []), review], reviewed: true }
            : r
        ),
        staff: updatedStaff,
      };
      break;
    }

    // ── Staff registry ────────────────────────────────────────────────────────
    case "ADD_STAFF": {
      next = {
        ...state,
        staff: [
          ...state.staff,
          {
            ...action.payload,
            id:            action.payload.id ?? state.nextStaffId,
            status:        "Available",
            currentJobId:  null,
            averageRating: 0,
            totalReviews:  0,
            reviews:       [],
            otherSkills:   action.payload.otherSkills ?? [],
          },
        ],
        nextStaffId: state.nextStaffId + 1,
      };
      break;
    }
    case "UPDATE_STAFF": {
      next = {
        ...state,
        staff: state.staff.map((s) =>
          String(s.id) === String(action.payload.id) ? { ...s, ...action.payload } : s
        ),
      };
      break;
    }
    case "REMOVE_STAFF": {
      next = { ...state, staff: state.staff.filter((s) => String(s.id) !== String(action.id)) };
      break;
    }

    // ── Blog ──────────────────────────────────────────────────────────────────
    case "ADD_BLOG": {
      next = {
        ...state,
        blog:      [...state.blog, { ...action.payload, id: state.nextBlogId }],
        nextBlogId: state.nextBlogId + 1,
      };
      break;
    }
    case "UPDATE_BLOG": {
      next = {
        ...state,
        blog: state.blog.map((p) =>
          p.id === action.payload.id ? { ...p, ...action.payload } : p
        ),
      };
      break;
    }
    case "DELETE_BLOG": {
      next = { ...state, blog: state.blog.filter((p) => p.id !== action.id) };
      break;
    }

    // ── Testimonials ──────────────────────────────────────────────────────────
    case "ADD_TESTI": {
      const id = action.payload.id ?? state.nextTestiId;
      if (state.testimonials.some((t) => t.id === id)) {
        return {
          ...state,
          testimonials: state.testimonials.map((t) =>
            t.id === id ? { ...t, ...action.payload } : t
          ),
        };
      }
      next = {
        ...state,
        testimonials: [...state.testimonials, { visible: true, ...action.payload, id }],
        nextTestiId:  state.nextTestiId + 1,
      };
      break;
    }
    case "UPDATE_TESTI": {
      next = {
        ...state,
        testimonials: state.testimonials.map((t) =>
          t.id === action.payload.id ? { ...t, ...action.payload } : t
        ),
      };
      break;
    }
    case "DELETE_TESTI": {
      next = { ...state, testimonials: state.testimonials.filter((t) => t.id !== action.id) };
      break;
    }

    // ── Messages ──────────────────────────────────────────────────────────────
    case "MARK_MSG_READ": {
      next = {
        ...state,
        messages: state.messages.map((m) =>
          String(m.id) === String(action.id) ? { ...m, read: true } : m
        ),
      };
      break;
    }
    case "ADD_MSG": {
      next = {
        ...state,
        messages:  [
          ...state.messages,
          { ...action.payload, id: state.nextMsgId, read: false, time: "Just now", replies: [] },
        ],
        nextMsgId: state.nextMsgId + 1,
      };
      break;
    }
    case "REPLY_MSG": {
      next = {
        ...state,
        messages: state.messages.map((m) =>
          String(m.id) === String(action.id)
            ? {
                ...m,
                replies: [
                  ...(m.replies || []),
                  { text: action.text, sentAt: new Date().toISOString() },
                ],
              }
            : m
        ),
      };
      break;
    }

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

// ─── Profile helpers ──────────────────────────────────────────────────────────
const PROFILE_KEY = "rnh_profile_v1";
export function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
export function saveProfile(profile) {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch {}
}

export default normaliseRequest;