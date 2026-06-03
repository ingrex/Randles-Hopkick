// data/blogPosts.js
//
// Single source of truth for blog data on ALL pages (BlogPage, BlogPostPage,
// and the AdminPanel preview).
//
// DATA FLOW (new):
//   1. Admin panel writes posts/featured to the BACKEND via /blog/admin/* endpoints.
//   2. refreshBlogCache() fetches from the public backend endpoints and writes
//      to localStorage (rnh_blog_public_posts_v2 / rnh_blog_public_featured_v2).
//   3. loadBlogPosts() / loadFeatured() read from that cache, falling back to
//      the hardcoded static defaults when the cache is cold.
//
// The old admin-only localStorage keys (rnh_blog_posts_v1 / rnh_blog_featured_v1)
// are no longer written by the admin panel but are still read here as a
// one-time migration fallback so existing locally-saved content is not lost.

// ─────────────────────────────────────────────────────────────────────────────
// Storage keys
// ─────────────────────────────────────────────────────────────────────────────
const PUBLIC_POSTS_KEY    = "rnh_blog_public_posts_v2";
const PUBLIC_FEATURED_KEY = "rnh_blog_public_featured_v2";

// Legacy keys written by the old localStorage-only admin panel — read once for migration
const LEGACY_POSTS_KEY    = "rnh_blog_posts_v1";
const LEGACY_FEATURED_KEY = "rnh_blog_featured_v1";

const BASE_URL = "https://randnhop.onrender.com/api/v1";

// ─────────────────────────────────────────────────────────────────────────────
// Raw fetch helpers (no auth needed — public endpoints)
// ─────────────────────────────────────────────────────────────────────────────

async function fetchPublicPosts() {
  const res = await fetch(`${BASE_URL}/blog`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Blog fetch failed: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : (data?.posts ?? data?.data ?? []);
}

async function fetchPublicFeatured() {
  const res = await fetch(`${BASE_URL}/blog/featured`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Featured fetch failed: ${res.status}`);
  const data = await res.json();
  return data?.featured ?? data?.data ?? data ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Normalise a raw backend post into the UI shape
// ─────────────────────────────────────────────────────────────────────────────

function normalisePost(raw) {
  if (!raw || typeof raw !== "object") return null;
  return {
    id:        raw._id      ?? raw.id      ?? String(Date.now()),
    slug:      raw.slug     ?? "",
    title:     raw.title    ?? "",
    excerpt:   raw.excerpt  ?? "",
    author:    raw.author   ?? "R&H Editorial",
    authorBio: raw.authorBio ?? "",
    date:      raw.date     ?? "",
    readTime:  raw.readTime ?? "5 min",
    accent:    raw.accent   ?? "#2385cd",
    category:  raw.category ?? "Hiring Tips",
    trending:  raw.trending ?? false,
    status:    raw.status   ?? "Published",
    image:     raw.image    ?? "",
    content:   Array.isArray(raw.content) ? raw.content : [],
  };
}

function normaliseFeatured(raw) {
  if (!raw || typeof raw !== "object") return null;
  return {
    id:        raw._id      ?? raw.id      ?? "featured",
    slug:      raw.slug     ?? "",
    title:     raw.title    ?? "",
    excerpt:   raw.excerpt  ?? "",
    author:    raw.author   ?? "R&H Editorial",
    authorBio: raw.authorBio ?? "",
    date:      raw.date     ?? "",
    readTime:  raw.readTime ?? "10 min",
    accent:    raw.accent   ?? "#2385cd",
    category:  raw.category ?? "Workforce Insights",
    image:     raw.image    ?? "",
    content:   Array.isArray(raw.content) ? raw.content : [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// localStorage cache helpers
// ─────────────────────────────────────────────────────────────────────────────

function writePosts(posts) {
  try { localStorage.setItem(PUBLIC_POSTS_KEY, JSON.stringify(posts)); } catch {}
}

function writeFeatured(featured) {
  try { localStorage.setItem(PUBLIC_FEATURED_KEY, JSON.stringify(featured)); } catch {}
}

function readPublicPosts() {
  try {
    const raw = localStorage.getItem(PUBLIC_POSTS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function readPublicFeatured() {
  try {
    const raw = localStorage.getItem(PUBLIC_FEATURED_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// One-time migration: if the new public cache is empty but the old admin
// localStorage cache has data (from before the backend was wired up), use it.
function readLegacyPosts() {
  try {
    const raw = localStorage.getItem(LEGACY_POSTS_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw);
    return Array.isArray(stored) && stored.length > 0 ? stored : null;
  } catch { return null; }
}

function readLegacyFeatured() {
  try {
    const raw = localStorage.getItem(LEGACY_FEATURED_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw);
    return stored && typeof stored === "object" && stored.title ? stored : null;
  } catch { return null; }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API — used by BlogPage / BlogPostPage
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns all PUBLISHED posts.
 * Priority: backend cache → legacy admin cache → static defaults.
 *
 * Pass { includeDrafts: true } to include Draft posts (used by AdminPanel preview).
 */
export function loadBlogPosts({ includeDrafts = false } = {}) {
  const cached = readPublicPosts() ?? readLegacyPosts();
  const source = cached
    ? cached.map((p) => ({ status: "Published", ...p })) // ensure status field
    : staticPosts.map((p) => ({ status: "Published", ...p }));

  return includeDrafts ? source : source.filter((p) => p.status !== "Draft");
}

/**
 * Returns the featured article.
 * Priority: backend cache → legacy admin cache → static default.
 */
export function loadFeatured() {
  return readPublicFeatured() ?? readLegacyFeatured() ?? staticFeatured;
}

/**
 * Hit the backend, normalise the data, write to localStorage cache.
 * Call once per page visit (e.g. in a useEffect at the top of BlogPage).
 * Returns { posts, featured } so callers can update state immediately.
 */
export async function refreshBlogCache() {
  let posts    = [];
  let featured = null;

  try {
    const raw = await fetchPublicPosts();
    posts = raw.map(normalisePost).filter(Boolean);
    writePosts(posts);
  } catch (err) {
    console.warn("[blogPosts] Could not fetch public posts:", err.message);
    // Keep existing cache; don't overwrite with nothing
    const existing = readPublicPosts() ?? readLegacyPosts();
    posts = existing ?? staticPosts.map((p) => ({ status: "Published", ...p }));
  }

  try {
    const raw = await fetchPublicFeatured();
    featured  = normaliseFeatured(raw);
    if (featured) writeFeatured(featured);
  } catch (err) {
    console.warn("[blogPosts] Could not fetch featured post:", err.message);
    featured = readPublicFeatured() ?? readLegacyFeatured() ?? staticFeatured;
  }

  return {
    posts:    posts.filter((p) => p.status !== "Draft"),
    featured: featured ?? staticFeatured,
  };
}

/**
 * Bust the public cache after any admin write (create / update / delete / set-featured).
 * The next visitor's refreshBlogCache() call will pull fresh data from the server.
 */
export function invalidateBlogCache() {
  try { localStorage.removeItem(PUBLIC_POSTS_KEY);    } catch {}
  try { localStorage.removeItem(PUBLIC_FEATURED_KEY); } catch {}
}

// ─────────────────────────────────────────────────────────────────────────────
// Static defaults — used when cache is cold AND backend is unreachable
// ─────────────────────────────────────────────────────────────────────────────

export const staticPosts = [
  {
    id: 1,
    slug: "how-to-choose-domestic-staff",
    category: "Hiring Tips",
    title: "How to Choose the Right Domestic Staff for Your Home",
    excerpt:
      "From nannies to chefs, discover what to look for when bringing trusted professionals into your household.",
    author: "R&H Editorial",
    authorBio:
      "The editorial team at Randle & Hopkick; specialists in domestic and corporate workforce solutions across Nigeria.",
    date: "May 22, 2026",
    readTime: "6 min",
    accent: "#c8a96e",
    trending: true,
    status: "Published",
    image:
      "https://res.cloudinary.com/dotvnclej/image/upload/v1778601551/Untitled_design_15_kvzz9a.jpg",
    content: [
      {
        type: "paragraph",
        text: "Hiring domestic staff is one of the most personal decisions a household can make. Unlike corporate recruitment, the people you bring into your home become part of your daily rhythm; they interact with your children, prepare your meals, and maintain the sanctuary you've built. Getting it right matters enormously.",
      },
      { type: "heading", text: "1. Define the Role Before You Recruit" },
      {
        type: "paragraph",
        text: "Clarity is everything. Before speaking to a single candidate, write down exactly what you need. A nanny's responsibilities differ vastly from a housekeeper's. Do you need someone who can cook? Drive? Speak a second language? The more specific your brief, the easier it is to match the right professional to your household.",
      },
      { type: "heading", text: "2. Verify, Verify, Verify" },
      {
        type: "paragraph",
        text: "Background checks are non-negotiable. At Randle & Hopkick, every candidate goes through identity verification, reference checks with previous employers, and a structured interview process. Never skip this step; a shortcut here can cost far more than the time saved.",
      },
      {
        type: "quote",
        text: "Trust is the foundation of every great household. It cannot be assumed — it must be earned and verified.",
      },
      { type: "heading", text: "3. Assess Temperament, Not Just Skills" },
      {
        type: "paragraph",
        text: "A cook who can produce restaurant-quality food but clashes with your household culture will cause more stress than a less skilled cook who fits naturally. During the interview process, pay close attention to how candidates communicate, how they handle hypothetical conflict scenarios, and whether they demonstrate genuine warmth or merely perform it.",
      },
      { type: "heading", text: "4. Set Clear Expectations from Day One" },
      {
        type: "paragraph",
        text: "A detailed employment agreement protects both parties. Cover working hours, days off, salary, responsibilities, and conduct expectations. Ambiguity breeds resentment. When both sides understand the terms clearly, the working relationship starts on solid ground.",
      },
      { type: "heading", text: "5. Trial Periods Are Your Friend" },
      {
        type: "paragraph",
        text: "Even the most impressive CV doesn't guarantee a good fit. Build a one- to three-month trial period into your arrangement. Use this time to assess reliability, professionalism, and compatibility. A reputable placement agency will support both parties through this transition.",
      },
      {
        type: "paragraph",
        text: "At Randle & Hopkick, we don't just place staff; we partner with families to ensure every placement holds. From initial briefing to post-placement check-ins, our team remains available to support a smooth, lasting match.",
      },
    ],
  },
  {
    id: 2,
    slug: "corporate-outsourcing-west-africa",
    category: "Workforce Insights",
    title: "The Growing Demand for Corporate Outsourcing in West Africa",
    excerpt:
      "Businesses are increasingly turning to specialist firms to handle staffing. Here's what the data reveals.",
    author: "R&H Editorial",
    authorBio:
      "The editorial team at Randle & Hopkick; specialists in domestic and corporate workforce solutions across Nigeria.",
    date: "May 19, 2026",
    readTime: "8 min",
    accent: "#2385cd",
    trending: true,
    status: "Published",
    image:
      "https://res.cloudinary.com/dotvnclej/image/upload/v1778601888/Untitled_design_16_szvtnk.jpg",
    content: [
      {
        type: "paragraph",
        text: "The outsourcing landscape in West Africa has shifted dramatically over the past decade. What was once viewed as a cost-cutting measure has evolved into a sophisticated strategic tool; a way for businesses to access specialised talent, reduce administrative burden, and stay agile in fast-moving markets.",
      },
      { type: "heading", text: "The Numbers Behind the Trend" },
      {
        type: "paragraph",
        text: "Nigeria alone accounts for a significant share of West Africa's outsourcing activity, driven by a young, educated workforce and a business environment that rewards efficiency. Sectors from financial services to hospitality are increasingly choosing specialist staffing firms over in-house HR departments for non-core roles.",
      },
      {
        type: "quote",
        text: "The businesses that scale fastest are those that stay focused on what they do best — and outsource everything else with discipline.",
      },
      { type: "heading", text: "What Businesses Are Outsourcing" },
      {
        type: "paragraph",
        text: "Facility management, security, cleaning, catering, and administrative support are the most commonly outsourced functions. But the trend is expanding upward; executive assistants, drivers with corporate protocol training, and even on-site welfare officers are now routinely placed through specialist firms like Randle & Hopkick.",
      },
      { type: "heading", text: "The Risk of Getting It Wrong" },
      {
        type: "paragraph",
        text: "Outsourcing without rigorous vetting is a liability. A poorly trained cleaner who damages equipment, or a driver who doesn't understand confidentiality, reflects on the business. The quality of your outsourced staff is indistinguishable from the quality of your brand to the clients and visitors who encounter them.",
      },
      { type: "heading", text: "How to Choose the Right Partner" },
      {
        type: "paragraph",
        text: "Look for a firm with a structured vetting process, clear SLAs, and post-placement support. Ask how they handle performance issues, replacements, and complaints. A good outsourcing partner takes accountability seriously; they don't disappear after the contract is signed.",
      },
    ],
  },
  {
    id: 3,
    slug: "what-makes-a-world-class-caregiver",
    category: "Caregiver Spotlight",
    title: "What Makes a World-Class Caregiver? We Asked Our Top Placements",
    excerpt:
      "Patience, presence, and professionalism; the three pillars our caregivers embody every single day.",
    author: "R&H Editorial",
    authorBio:
      "The editorial team at Randle & Hopkick; specialists in domestic and corporate workforce solutions across Nigeria.",
    date: "May 15, 2026",
    readTime: "5 min",
    accent: "#4a7c6f",
    trending: false,
    status: "Published",
    image:
      "https://res.cloudinary.com/dotvnclej/image/upload/v1779733903/who_we_are_wejxdr.png",
    content: [
      {
        type: "paragraph",
        text: "We sat down with five of our highest-rated caregiver placements to ask a simple question: what separates a good caregiver from a great one? Their answers were revealing and deeply human.",
      },
      { type: "heading", text: "Patience Is a Practice, Not a Personality" },
      {
        type: "paragraph",
        text: "Every caregiver we spoke with mentioned patience in the first sixty seconds. But they were careful to distinguish between passive tolerance and active, practised patience. 'You have to choose it every morning,' one caregiver told us. 'Especially when the person you're caring for is having a difficult day. You remind yourself: this is not about you.'",
      },
      {
        type: "quote",
        text: "The best caregivers don't just look after the body — they protect the dignity of the person in their care.",
      },
      { type: "heading", text: "Presence Over Performance" },
      {
        type: "paragraph",
        text: "World-class caregivers are fully present. Not distracted by phones, not going through the motions. Families can feel the difference immediately. Genuine attentiveness; noticing a change in mood, anticipating a need before it's expressed is the mark of someone who treats caregiving as a vocation, not a job.",
      },
      { type: "heading", text: "Professional Boundaries Matter" },
      {
        type: "paragraph",
        text: "Paradoxically, the best caregivers are also the most professionally boundaried. They understand the difference between warmth and over-familiarity, between advocacy and overreach. They communicate issues to family members calmly and factually, rather than emotionally or reactively.",
      },
      { type: "heading", text: "Our Commitment" },
      {
        type: "paragraph",
        text: "At Randle & Hopkick, every caregiver placement is preceded by a detailed briefing about the individual being cared for; their history, preferences, triggers, and routines. We don't match skills alone; we match character. Because the person in your home deserves nothing less.",
      },
    ],
  },
  {
    id: 4,
    slug: "art-of-a-perfect-household",
    category: "Domestic Staffing",
    title: "The Art of a Perfect Household: Staffing Beyond the Job Description",
    excerpt:
      "Great domestic staff don't just complete tasks; they become part of the fabric of a well-run home.",
    author: "R&H Editorial",
    authorBio:
      "The editorial team at Randle & Hopkick; specialists in domestic and corporate workforce solutions across Nigeria.",
    date: "May 12, 2026",
    readTime: "7 min",
    accent: "#c8a96e",
    trending: false,
    status: "Published",
    image:
      "https://res.cloudinary.com/dotvnclej/image/upload/v1778602221/Untitled_design_17_o8eevf.jpg",
    content: [
      {
        type: "paragraph",
        text: "There is a version of domestic staffing that is purely transactional — tasks completed, hours logged, salary paid. And then there is the version that transforms a house into a home. The difference lies not in the job description, but in the person filling it.",
      },
      { type: "heading", text: "The Invisible Work of Great Domestic Staff" },
      {
        type: "paragraph",
        text: "A truly exceptional housekeeper doesn't wait to be told that the flowers need replacing or that the guest bedroom should be freshened before a visitor arrives. They notice. They anticipate. They take quiet pride in the seamless running of a household that makes the family's life feel effortless.",
      },
      {
        type: "quote",
        text: "The measure of a great home is not its size or its decor — it's the invisible effort that makes every day run without friction.",
      },
      { type: "heading", text: "Discretion as a Professional Virtue" },
      {
        type: "paragraph",
        text: "In high-profile households, discretion isn't optional; it's foundational. The best domestic staff understand that what happens inside a private home stays there. This isn't merely contractual; it's a matter of professional honour. At Randle & Hopkick, we screen explicitly for this quality during our placement process.",
      },
      { type: "heading", text: "Building Long-Term Relationships" },
      {
        type: "paragraph",
        text: "The most satisfied families are those who think of their domestic staff as long-term partners, not interchangeable hires. Investing in fair pay, genuine respect, and clear communication builds loyalty and loyalty produces the consistency that truly elevates a household.",
      },
      { type: "heading", text: "What Randle & Hopkick Looks For" },
      {
        type: "paragraph",
        text: "Beyond technical skills, we assess initiative, emotional intelligence, and the quiet professionalism that can't be taught in a training course. We look for people who bring pride to their work; because that pride is exactly what your home deserves.",
      },
    ],
  },
  {
    id: 5,
    slug: "5-questions-before-hiring-a-driver",
    category: "Hiring Tips",
    title: "5 Questions Every Employer Should Ask Before Hiring a Driver",
    excerpt:
      "Safety, discretion, and reliability matter most. Use this guide to find someone you can truly trust.",
    author: "R&H Editorial",
    authorBio:
      "The editorial team at Randle & Hopkick; specialists in domestic and corporate workforce solutions across Nigeria.",
    date: "May 8, 2026",
    readTime: "4 min",
    accent: "#2385cd",
    trending: false,
    status: "Published",
    image:
      "https://res.cloudinary.com/dotvnclej/image/upload/v1777915998/Workers_jkh5ha.jpg",
    content: [
      {
        type: "paragraph",
        text: "A personal or corporate driver is one of the most trust-intensive hires you'll make. This person will know your schedule, your routes, and often your most private conversations. Getting the hire right is not optional; it's essential.",
      },
      { type: "heading", text: "Question 1: Can You Walk Me Through Your Driving History?" },
      {
        type: "paragraph",
        text: "Don't just ask for a licence; ask for a story. How long have they been driving professionally? What kinds of vehicles? Have they driven principals with security requirements? Gaps and inconsistencies in the narrative are as informative as the facts themselves.",
      },
      { type: "heading", text: "Question 2: How Do You Handle a Difficult Traffic Situation?" },
      {
        type: "paragraph",
        text: "Listen for composure. The right answer involves calmness, planning, and consideration for the passenger's time; not aggression, speed, or risk-taking. Lagos traffic is a stress test. You need someone who passes it daily.",
      },
      {
        type: "quote",
        text: "The best drivers don't just get you there; they get you there calmly, safely, and on time, every single time.",
      },
      { type: "heading", text: "Question 3: Have You Ever Been in an Accident? What Happened?" },
      {
        type: "paragraph",
        text: "Honesty here is more valuable than a clean record. Someone who has had a minor incident but takes clear responsibility and describes what they learned is often more trustworthy than someone who claims a perfect record with a defensive posture. Look for accountability.",
      },
      { type: "heading", text: "Question 4: How Do You Define Discretion?" },
      {
        type: "paragraph",
        text: "Ask this directly. A driver who understands discretion will give you a thoughtful, specific answer; not a vague one. They should be able to explain what it means practically: not discussing the principal's movements, not using mobile phones when passengers are in the vehicle, not sharing professional information socially.",
      },
      { type: "heading", text: "Question 5: What Would You Do If Instructed to Do Something Unsafe?" },
      {
        type: "paragraph",
        text: "This question reveals character. The right answer is polite, firm refusal — and an ability to explain why without escalating. A driver who cannot say no to an unsafe instruction when under social pressure is a liability.",
      },
    ],
  },
  {
    id: 6,
    slug: "randle-hopkick-expands-nationwide",
    category: "Company News",
    title: "Randle & Hopkick Expands Premium Placement Services Nationwide",
    excerpt:
      "We're proud to announce a new wave of vetted professionals now available across major cities in Nigeria.",
    author: "R&H Editorial",
    authorBio:
      "The editorial team at Randle & Hopkick; specialists in domestic and corporate workforce solutions across Nigeria.",
    date: "May 5, 2026",
    readTime: "3 min",
    accent: "#1c1a16",
    trending: false,
    status: "Published",
    image:
      "https://res.cloudinary.com/dotvnclej/image/upload/v1778602685/Untitled_design_18_rl7zlb.jpg",
    content: [
      {
        type: "paragraph",
        text: "We are proud to announce that Randle & Hopkick has formally expanded its premium placement services to cover additional cities across Nigeria. What began as a Lagos-focused operation has grown; driven by client demand and our commitment to bringing world-class staffing standards to every home and business that needs them.",
      },
      { type: "heading", text: "Why Expansion, Why Now" },
      {
        type: "paragraph",
        text: "The demand for professionally vetted domestic and corporate staff is not unique to Lagos. Families and businesses in Abuja, Port Harcourt, and beyond have long needed what we provide: rigorous screening, professional training, and post-placement support. We're here now.",
      },
      {
        type: "quote",
        text: "Excellence in staffing should not be a Lagos privilege. Every Nigerian home and business deserves access to professionals they can trust.",
      },
      { type: "heading", text: "What's New" },
      {
        type: "paragraph",
        text: "Our expanded operations include a newly trained cohort of placement specialists, a refreshed digital intake process for employers, and a dedicated support line for placed staff. We've also deepened our training curriculum to reflect the specific demands of multi-city corporate clients.",
      },
      { type: "heading", text: "A Message from Leadership" },
      {
        type: "paragraph",
        text: "Mrs. Peace Obieke, Head of Operations, notes: 'This expansion is the result of trust; the trust our clients place in us, and the trust we place in every professional we deploy. We don't take either lightly. We're growing because our standards hold, and we intend to keep it that way.'",
      },
      {
        type: "paragraph",
        text: "If you'd like to hire staff in any of our new coverage areas, or if you're a professional interested in joining our vetted network, reach out to us today. We'd love to hear from you.",
      },
    ],
  },
];

export const staticFeatured = {
  slug: "premium-staffing-smartest-investment",
  title:
    "Why Premium Staffing Is the Smartest Investment Your Business Can Make This Year",
  excerpt:
    "In a competitive landscape, the quality of your team — from executive assistants to janitorial staff — defines your brand. Randle & Hopkick explores why getting staffing right is non-negotiable.",
  author: "R&H Editorial",
  authorBio:
    "The editorial team at Randle & Hopkick, led by Mrs. Peace Obieke; 15+ years in HR consulting and workforce strategy.",
  date: "May 26, 2026",
  readTime: "10 min",
  accent: "#2385cd",
  category: "Workforce Insights",
  image:
    "https://res.cloudinary.com/dotvnclej/image/upload/v1778599560/Untitled_design_14_ecewzo.jpg",
  content: [
    {
      type: "paragraph",
      text: "In a business environment where margins are tighter and expectations are higher than ever, leaders are rightly focused on optimising every line of expenditure. Staffing, however, is not a line to cut; it's a lever to pull.",
    },
    { type: "heading", text: "The Hidden Cost of Cheap Staffing" },
    {
      type: "paragraph",
      text: "The temptation to fill roles with the lowest-cost option is understandable. But the downstream costs of poor staffing; turnover, retraining, reputational damage, and lost productivity; consistently outweigh the upfront savings. Premium staffing is not a luxury: it's a risk management strategy.",
    },
    {
      type: "quote",
      text: "The businesses that thrive long-term are those that understand: the quality of your staff is the quality of your brand.",
    },
    { type: "heading", text: "What 'Premium' Actually Means" },
    {
      type: "paragraph",
      text: "Premium staffing is not about paying more for the same service. It's about accessing professionals who have been rigorously vetted, properly trained, and thoughtfully matched to your specific context. It means a driver who understands corporate protocol, a receptionist who represents your brand with confidence, a facility manager who takes ownership.",
    },
    { type: "heading", text: "The ROI of Getting It Right" },
    {
      type: "paragraph",
      text: "Consider what a well-placed executive assistant delivers: fewer missed details, better-prepared meetings, smoother client interactions, and a principal who can focus entirely on high-value work. That multiplier effect compounds across every role in your organisation. The businesses that invest in staffing quality consistently outperform those that don't.",
    },
    { type: "heading", text: "Our Approach at Randle & Hopkick" },
    {
      type: "paragraph",
      text: "We begin every engagement with a discovery conversation — not a form. We want to understand your culture, your expectations, and your non-negotiables. From there, we match from our vetted network of professionals, present a shortlist, and remain engaged through placement and beyond. We don't disappear after the contract is signed.",
    },
    {
      type: "paragraph",
      text: "If 2026 is the year you decide to raise the bar on staffing, we'd welcome the conversation. Reach out to our team today.",
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Legacy named exports — kept for any file still using the old direct imports.
// Prefer loadBlogPosts() / loadFeatured() everywhere going forward.
// ─────────────────────────────────────────────────────────────────────────────
export const posts    = staticPosts;
export const featured = staticFeatured;