

import { createContext, useContext, useReducer } from "react";

function defaultState() {
  return {
    requests:        [],
    registeredUsers: [],
    staff:           [],
    blog:            [],
    testimonials:    [],
    messages:        [],
    nextReqId:       1,
    nextStaffId:     1,
    nextBlogId:      1,
    nextTestiId:     1,
    nextMsgId:       1,
    lastSyncedAt:    null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// localStorage persistence
// ─────────────────────────────────────────────────────────────────────────────
const STORE_KEY = "rnh_store_v5";

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaultState();
    const saved = JSON.parse(raw);
    return {
      ...defaultState(),
      staff:           saved.staff           ?? [],
      blog:            saved.blog            ?? [],
      testimonials:    saved.testimonials    ?? [],
      messages:        (saved.messages ?? []).map((m) => ({ ...m, replies: m.replies ?? [] })),
      requests:        saved.requests        ?? [],
      registeredUsers: saved.registeredUsers ?? [],
      nextReqId:       saved.nextReqId       ?? 1,
      nextStaffId:     saved.nextStaffId     ?? 1,
      nextBlogId:      saved.nextBlogId      ?? 1,
      nextTestiId:     saved.nextTestiId     ?? 1,
      nextMsgId:       saved.nextMsgId       ?? 1,
      lastSyncedAt:    null,
    };
  } catch {
    return defaultState();
  }
}

function persistState(state) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      staff:           state.staff,
      blog:            state.blog,
      testimonials:    state.testimonials,
      messages:        state.messages,
      requests:        state.requests,
      registeredUsers: state.registeredUsers,
      nextReqId:       state.nextReqId,
      nextStaffId:     state.nextStaffId,
      nextBlogId:      state.nextBlogId,
      nextTestiId:     state.nextTestiId,
      nextMsgId:       state.nextMsgId,
    }));
  } catch { /* quota exceeded — ignore */ }
}

// ─────────────────────────────────────────────────────────────────────────────
// normaliseRequest
// Handles every shape the backend currently returns for a staff-request doc.
// ─────────────────────────────────────────────────────────────────────────────
export function normaliseRequest(raw) {
  if (!raw || typeof raw !== "object") return null;

  const pd  = raw.personalDetails ?? {};
  const cd  = raw.companyDetails  ?? {};
  const rep = raw.repDetails      ?? {};

  const clientType =
    raw.clientType ??
    (Object.keys(cd).length  ? "Organisation" :
     Object.keys(pd).length  ? "Private"      : "Unknown");

  const isOrg = clientType === "Organisation";

  const clientName = (() => {
    if (raw.clientName) return raw.clientName;
    if (isOrg) return cd.companyName ?? cd.name ?? rep.surname ?? "";
    return `${pd.surname ?? pd.firstName ?? ""} ${pd.otherName ?? pd.lastName ?? ""}`.trim()
      || raw.name || "";
  })();

  const email =
    raw.email ??
    (isOrg ? (cd.companyEmail ?? cd.email ?? "") : (pd.email ?? ""));

  const phone =
    raw.phone ?? raw.phoneNumber ??
    (isOrg
      ? (cd.companyPhone ?? cd.phone ?? rep.phoneNumber ?? "")
      : (pd.phoneNo ?? pd.phone ?? pd.phoneNumber ?? ""));

  const location =
    raw.location ?? raw.address ??
    (isOrg
      ? (cd.companyAddress ?? cd.address ?? "")
      : (pd.businessLocation ?? pd.address ?? ""));

  const rawRoles = raw.roles ?? raw.requestedStaff ?? raw.staffRoles ?? raw.services ?? [];
  const roles = (Array.isArray(rawRoles) ? rawRoles : []).map((r) => {
    if (typeof r === "string") return { role: r, quantity: 1 };
    return {
      role:     r.role     ?? r.name  ?? r.title    ?? r.staffType ?? r.type ?? "Staff",
      quantity: r.quantity ?? r.count ?? r.qty       ?? r.number   ?? 1,
    };
  });

  const reviews = (raw.reviews ?? []).map((rv) => ({
    rating:        rv.rating  ?? rv.stars  ?? 0,
    comment:       rv.comment ?? rv.review ?? rv.text ?? "",
    submittedAt:   rv.submittedAt ?? rv.createdAt ?? new Date().toISOString(),
    reviewedReqId: rv.reviewedReqId ?? raw._id ?? raw.id,
    staffId:       rv.staffId ?? rv.staff ?? null,
  }));

  const assignedStaff = (raw.assignedStaff ?? raw.assignedTo ?? []).map((s) =>
    typeof s === "string"
      ? { id: s, name: s }
      : { id: String(s._id ?? s.id), name: s.name ?? s.fullName ?? s.staffName ?? "" }
  );

  const mongoId = String(raw._id ?? raw.id ?? "");

  const reviewed = raw.reviewed ?? (reviews.length > 0);

  return {
    id:            mongoId,
    backendId:     mongoId,
    clientType,
    clientName,
    email,
    phone,
    location,
    roles,
    status:        raw.status ?? "Pending",
    startDate:     raw.startDate  ?? raw.start        ?? raw.startingDate ?? "",
    endDate:       raw.endDate    ?? raw.end           ?? raw.endingDate   ?? "",
    assignedStaff,
    reviews,
    reviewed,
    submittedAt:   raw.submittedAt ?? raw.createdAt ?? raw.dateSubmitted ?? new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// normaliseUser
// ─────────────────────────────────────────────────────────────────────────────
export function normaliseUser(u) {
  if (!u || typeof u !== "object") return null;

  let surname    = u.surname    ?? u.lastName  ?? "";
  let otherNames = u.otherNames ?? u.firstName ?? u.otterName ?? "";

  if (!surname && !otherNames) {
    const full  = (u.fullName ?? u.name ?? "").trim();
    const parts = full.split(/\s+/);
    surname     = parts[0]            ?? "";
    otherNames  = parts.slice(1).join(" ");
  }

  return {
    id:           String(u._id ?? u.id ?? ""),
    surname,
    otherNames,
    email:        u.email       ?? "",
    phoneNumber:  u.phoneNumber ?? u.phone ?? u.phoneNo ?? "",
    photoUrl:     u.photoUrl    ?? u.avatar ?? u.profilePicture ?? u.photo ?? "",
    registeredAt: u.createdAt   ?? u.registeredAt ?? u.dateRegistered ?? new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// normaliseStaffProfile  (job-seeker profiles from /profile endpoint)
// ─────────────────────────────────────────────────────────────────────────────
export function normaliseStaffProfile(s) {
  if (!s || typeof s !== "object") return null;

  const user = (s.user && typeof s.user === "object") ? s.user : {};

  const surname    = user.surname    ?? s.surname    ?? "";
  const otherNames = user.otherNames ?? s.otherNames ?? "";
  const name = surname
    ? `${surname} ${otherNames}`.trim()
    : (s.name ?? s.fullName ?? "Unknown");

  const reviews = (s.reviews ?? []).map((r) => ({
    rating:      r.rating  ?? r.stars ?? 0,
    comment:     r.comment ?? r.text  ?? "",
    submittedAt: r.submittedAt ?? r.createdAt ?? new Date().toISOString(),
  }));

  const mongoId = String(s._id ?? s.id ?? "");

  return {
    id:            mongoId,
    name,
    role:          s.primarySkills ?? s.role ?? s.primaryRole ?? s.title ?? "",
    phone:         user.phoneNumber ?? user.phone ?? s.phone ?? s.phoneNo ?? "",
    email:         user.email  ?? s.email  ?? "",
    status:        s.status    ?? "Available",
    currentJobId:  s.currentJobId ?? null,
    averageRating: typeof s.averageRating === "number" ? s.averageRating : 0,
    totalReviews:  typeof s.totalReviews  === "number" ? s.totalReviews  : reviews.length,
    reviews,
    otherSkills:   s.otherSkills ?? s.alternateSkills ?? s.skills ?? [],
    experience:    s.yearsOfExperience ?? s.experience ?? 0,
    nationality:   s.nationality  ?? "",
    location:      s.homeAddress  ?? s.location ?? "",
    photoUrl:      user.photoUrl  ?? s.photoUrl ?? "",
    bio:           s.bio          ?? "",
    gender:        s.gender       ?? "",
    maritalStatus: s.maritalStatus ?? "",
    education:     s.educationalQualification ?? "",
    languages:     s.languageSkill ?? "",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// normaliseStaff  (staff registry entries from /staff endpoint)
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

  const mongoId = String(s._id ?? s.id ?? "");

  return {
    id:            mongoId,
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
    experience:    s.experience  ?? 0,
    nationality:   s.nationality ?? "",
    location:      s.location    ?? "",
    photoUrl:      s.photoUrl    ?? "",
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
    time:    m.time    ?? m.createdAt ?? "Recently",
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
// normaliseTestimonial
//
// Backend field names:  name, role, company, content, rating, avatar, isApproved
// Internal/display names: name, role, company, text, rating, image, visible
// ─────────────────────────────────────────────────────────────────────────────
export function normaliseTestimonial(t, idx) {
  if (!t || typeof t !== "object") return null;
  return {
    id:      t._id        ?? t.id         ?? `testi-${idx}`,
    name:    t.name       ?? t.author     ?? t.clientName  ?? "",
    role:    t.role       ?? t.title      ?? t.position    ?? "",
    company: t.company    ?? "",
    // content (backend) → text (internal)
    text:    t.text       ?? t.content    ?? t.testimonial ?? t.review ?? t.body ?? "",
    // avatar (backend) → image (internal)
    image:   t.image      ?? t.avatar     ?? t.photo       ?? t.photoUrl
             ?? t.imageUrl ?? t.picture   ?? t.img         ?? "",
    rating:  typeof t.rating === "number" ? t.rating : Number(t.rating ?? t.stars ?? 5),
    // isApproved (backend) → visible (internal)
    visible: t.visible    ?? t.isApproved ?? t.isVisible   ?? t.active ?? true,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// parseMasterMarketplace
// Converts the raw /admin/mastermarketplace response into store-ready data.
// ─────────────────────────────────────────────────────────────────────────────
export function parseMasterMarketplace(raw) {
  if (!raw || typeof raw !== "object") {
    return { registeredUsers: [], requests: [], messages: [], staff: [], testimonials: [], blog: [] };
  }

  const root = raw.data ?? raw.result ?? raw.payload ?? raw.response ?? raw;

  if (typeof window !== "undefined" && import.meta?.env?.MODE !== "production") {
    console.group("🛰  [parseMasterMarketplace] raw response");
    console.log("Top-level keys:", Object.keys(root));
    Object.entries(root).forEach(([k, v]) => {
      console.log(
        `  ${k}:`,
        Array.isArray(v) ? `Array(${v.length})` : typeof v,
        Array.isArray(v) && v[0]
          ? `\n    sample → ${JSON.stringify(v[0]).slice(0, 150)}`
          : ""
      );
    });
    console.groupEnd();
  }

  // Backend naming: "staff" = client requests, "profile" = job-seeker profiles
  const rawUsers    = Array.isArray(root.users)           ? root.users
                    : Array.isArray(root.registeredUsers)  ? root.registeredUsers : [];

  const rawRequests = Array.isArray(root.staff)           ? root.staff
                    : Array.isArray(root.requests)         ? root.requests
                    : Array.isArray(root.staffRequests)    ? root.staffRequests : [];

  const rawStaff    = Array.isArray(root.profile)         ? root.profile
                    : Array.isArray(root.profiles)         ? root.profiles
                    : Array.isArray(root.staffMembers)     ? root.staffMembers : [];

  const rawMessages = Array.isArray(root.messages)        ? root.messages
                    : Array.isArray(root.contacts)         ? root.contacts
                    : Array.isArray(root.enquiries)        ? root.enquiries : [];

  const rawTestimonials = Array.isArray(root.testimonials) ? root.testimonials : [];

  const registeredUsers = rawUsers.map(normaliseUser).filter(Boolean);
  const requests        = rawRequests.map(normaliseRequest).filter(Boolean);
  const staff           = rawStaff.map(normaliseStaffProfile).filter(Boolean);
  const messages        = rawMessages.map((m, i) => normaliseMessage(m, i)).filter(Boolean);
  const testimonials    = rawTestimonials.map((t, i) => normaliseTestimonial(t, i)).filter(Boolean);

  if (typeof window !== "undefined" && import.meta?.env?.MODE !== "production") {
    console.log(
      `✅ [store] Parsed → registeredUsers:${registeredUsers.length}` +
      ` requests:${requests.length} staff:${staff.length}` +
      ` messages:${messages.length} testimonials:${testimonials.length}`
    );
  }

  return {
    registeredUsers,
    requests,
    staff,
    messages,
    testimonials,
    blog: Array.isArray(root.blog) ? root.blog : [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// buildRequestPayload  (helper for UserDashboard after submitting a request)
// ─────────────────────────────────────────────────────────────────────────────
export function buildRequestPayload(apiPayload, apiResponse) {
  if (apiResponse && (apiResponse._id || apiResponse.id)) {
    return normaliseRequest({ ...apiPayload, ...apiResponse });
  }
  const isOrg = apiPayload.clientType === "Organisation";
  return {
    id:            String(apiResponse?._id ?? apiResponse?.id ?? Date.now()),
    backendId:     String(apiResponse?._id ?? ""),
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

    // ── Full marketplace sync (admin) ────────────────────────────────────────
    case "LOAD_MARKETPLACE": {
      const {
        registeredUsers = [],
        requests        = [],
        messages        = [],
        staff           = [],
        testimonials,
        blog,
      } = action.payload;

      const localReqMap    = new Map(state.requests.map((r) => [String(r.id), r]));
      const mergedRequests = requests.map((r) => {
        const local = localReqMap.get(String(r.id));
        if (!local) return r;
        return {
          ...r,
          reviews:  r.reviews?.length  ? r.reviews  : (local.reviews  ?? []),
          reviewed: r.reviewed         ? r.reviewed  : (local.reviewed ?? false),
        };
      });
      const backendReqIds = new Set(requests.map((r) => String(r.id)));
      const localOnlyReqs = state.requests.filter(
        (r) => !r.backendId && !backendReqIds.has(String(r.id))
      );

      const serverEmails   = new Set(registeredUsers.map((u) => u.email));
      const localOnlyUsers = state.registeredUsers.filter((u) => !serverEmails.has(u.email));

      const localMsgMap    = new Map(state.messages.map((m) => [String(m.id), m]));
      const mergedMessages = messages.map((m) => {
        const local = localMsgMap.get(String(m.id));
        if (!local) return m;
        return {
          ...m,
          read:    local.read || m.read,
          replies: local.replies?.length ? local.replies : m.replies,
        };
      });
      const serverMsgIds  = new Set(messages.map((m) => String(m.id)));
      const localOnlyMsgs = state.messages.filter((m) => !serverMsgIds.has(String(m.id)));

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

      const incomingTestis = Array.isArray(testimonials) && testimonials.length ? testimonials : null;
      let mergedTestis = state.testimonials;
      if (incomingTestis) {
        const backendTestiIds = new Set(incomingTestis.map((t) => String(t.id)));
        const localOnlyTestis = state.testimonials.filter((t) => !backendTestiIds.has(String(t.id)));
        mergedTestis = [...incomingTestis, ...localOnlyTestis];
      }

      next = {
        ...state,
        requests:        [...mergedRequests, ...localOnlyReqs],
        registeredUsers: [...registeredUsers, ...localOnlyUsers],
        messages:        [...mergedMessages, ...localOnlyMsgs],
        staff:           [...mergedStaff, ...brandNewStaff],
        testimonials:    mergedTestis,
        ...(Array.isArray(blog) && blog.length ? { blog } : {}),
        lastSyncedAt: new Date().toISOString(),
      };
      break;
    }

    // ── User dashboard: replace only that user's requests after a profile poll ─
    case "SYNC_USER_REQUESTS": {
      const incoming  = (action.requests ?? []).map(normaliseRequest).filter(Boolean);
      if (!incoming.length) break;

      const incomingMap = new Map(incoming.map((r) => [String(r.id), r]));
      const preserved   = state.requests.filter((r) => !incomingMap.has(String(r.id)));

      next = {
        ...state,
        requests:     [...incoming, ...preserved],
        lastSyncedAt: new Date().toISOString(),
      };
      break;
    }

    // ── Replace request list from backend (admin full sync) ──────────────────
    case "SET_REQUESTS": {
      const incoming   = (action.payload || []).map(normaliseRequest).filter(Boolean);
      const localMap   = new Map(state.requests.map((r) => [String(r.id), r]));
      const merged     = incoming.map((r) => {
        const local = localMap.get(String(r.id));
        return local
          ? { ...r, reviews: r.reviews?.length ? r.reviews : (local.reviews ?? []), reviewed: r.reviewed || local.reviewed }
          : r;
      });
      const backendIds = new Set(incoming.map((r) => String(r.id)));
      const localOnly  = state.requests.filter(
        (r) => !r.backendId && !backendIds.has(String(r.id))
      );
      next = { ...state, requests: [...merged, ...localOnly], lastSyncedAt: new Date().toISOString() };
      break;
    }

    // ── Registered users ─────────────────────────────────────────────────────
    case "SET_REGISTERED_USERS": {
      const incoming     = (action.payload || []).map(normaliseUser).filter(Boolean);
      const serverEmails = new Set(incoming.map((u) => u.email));
      const localOnly    = state.registeredUsers.filter((u) => !serverEmails.has(u.email));
      next = { ...state, registeredUsers: [...incoming, ...localOnly] };
      break;
    }

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

    // ── Request CRUD ─────────────────────────────────────────────────────────
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
          String(r.id) === String(action.id) ? { ...r, status: "Rejected" } : r
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

    // ── Dates ─────────────────────────────────────────────────────────────────
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

    // ── Assign staff ──────────────────────────────────────────────────────────
    case "ASSIGN_STAFF": {
      const { reqId, assignedStaff } = action;
      const req     = state.requests.find((r) => String(r.id) === String(reqId));
      const prevIds = req?.assignedStaff?.map((s) => String(s.id)) ?? [];
      const newIds  = assignedStaff.map((s) => String(s.id));
      next = {
        ...state,
        requests: state.requests.map((r) =>
          String(r.id) === String(reqId) ? { ...r, assignedStaff } : r
        ),
        staff: state.staff.map((s) => {
          const sid = String(s.id);
          if (prevIds.includes(sid) && !newIds.includes(sid))
            return { ...s, status: "Available", currentJobId: null };
          if (!prevIds.includes(sid) && newIds.includes(sid))
            return { ...s, status: "Active", currentJobId: String(reqId) };
          return s;
        }),
      };
      break;
    }

    // ── Review submission ─────────────────────────────────────────────────────
    case "SUBMIT_REVIEW": {
      const { reqId, staffId, rating, comment } = action;
      const review = {
        rating,
        comment:       comment ?? "",
        submittedAt:   new Date().toISOString(),
        reviewedReqId: reqId,
        staffId,
      };

      const updatedStaff = state.staff.map((s) => {
        if (String(s.id) !== String(staffId)) return s;
        const allReviews  = [...(s.reviews ?? []), review];
        const avg         = allReviews.reduce((sum, rv) => sum + rv.rating, 0) / allReviews.length;
        return {
          ...s,
          reviews:       allReviews,
          averageRating: Math.round(avg * 10) / 10,
          totalReviews:  allReviews.length,
        };
      });

      const updatedRequests = state.requests.map((r) =>
        String(r.id) === String(reqId)
          ? { ...r, reviews: [...(r.reviews ?? []), review], reviewed: true }
          : r
      );

      next = { ...state, requests: updatedRequests, staff: updatedStaff };
      break;
    }

    // ── Merge a single updated request ────────────────────────────────────────
    case "MERGE_REQUEST": {
      const incoming = normaliseRequest(action.payload);
      if (!incoming) break;
      const exists = state.requests.some((r) => String(r.id) === String(incoming.id));
      next = {
        ...state,
        requests: exists
          ? state.requests.map((r) =>
              String(r.id) === String(incoming.id) ? { ...r, ...incoming } : r
            )
          : [...state.requests, incoming],
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
        blog:       [...state.blog, { ...action.payload, id: state.nextBlogId }],
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
        testimonials: [
          ...state.testimonials,
          { visible: true, image: "", company: "", ...action.payload, id },
        ],
        nextTestiId: state.nextTestiId + 1,
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
        messages: [
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
                  ...(m.replies ?? []),
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

// ─────────────────────────────────────────────────────────────────────────────
// Context & Provider
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// Profile helpers  (for job-seeker / staff profile localStorage cache)
// ─────────────────────────────────────────────────────────────────────────────
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