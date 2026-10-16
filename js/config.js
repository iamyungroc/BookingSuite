/* ============================================================
   RocAudio Suite — MASTER CONFIG  (EDIT EVERYTHING HERE)
   ------------------------------------------------------------
   This is the ONLY file you need to touch to change:
   brand names, emails, currency, VAT, prices, delivery times,
   payment options, bonuses, store links, seed reviews.
   No other code changes required.
   ============================================================ */

const CONFIG = {
  /* ---------- BRAND ---------- */
  brand: {
    appName:        "RocAudio Suite",
    tagline:        "Book. Learn. Produce. Master.",
    academy:        "The Symphony Producers Academy",
    techCompany:    "RocAudio™",
    techCompanyTag: "Tech Company • Europe",
    productionCo:   "The Beats by Roc Company Limited",
    footerLine:     "Powered By RocAudio™ Tech Company Europe",
    businessEmail:  "thebbrgroupllc@outlook.com",   // invoices CC here
    supportEmail:   "iamyungroc@yahoo.com",
    invoiceEmail:   "thebbrgroupllc@outlook.com",  // sender shown on invoices
    phone:          "+234 902 778 9054",
    address:        "RocAudio HQ, Victoria Island, Lagos, Nigeria",
    vatNumber:      "RC 2021653 • TIN 18897945-0001",
    bankAccount:    "8247847726 • Moniepoint MFB — The Beats By Roc Company Limited",
    currency:       "NGN",
    currencySymbol: "₦",
    vatRate:        7.5,                     // Nigeria standard VAT
  },

  /* ---------- CLOUD SYNC (free Supabase — makes chat/bookings global) ----------
     1. supabase.com → New project (free)   2. run backend/supabase-schema.sql
     3. paste Project URL + anon key below  4. redeploy. Sync polls every 6s. */
  backend: {
    url: "https://myhawqjzpgxxadqjtzim.supabase.co",
    key: "sb_publishable_GOE4MhrusrrnKmhMYB6ILA_cvHxzItZ",   // publishable (browser-safe) key
  },

  /* ---------- STUDIO CONSOLE (producer side) ---------- */
  studio: {
    email: "iamyungroc@yahoo.com",       // <-- reserved admin contact (clients cannot register it)
    pinHash: "h2119354466",    // <-- hashed admin PIN. Plaintext never stored — safe for public repos.
    // Rotate: node tools/pin-hash.js <new-pin> → paste result here → redeploy. Per-device: Console → Change PIN.
    assistantDefault: true,    // studio assistant auto-replies when you're busy
  },

  /* ---------- BOOKING AVAILABILITY (studio calendar rules) ---------- */
  booking: {
    timezone: "Africa/Lagos",
    workDays: [1, 2, 3, 4, 5, 6],   // 0=Sun … 6=Sat  (Sundays closed)
    hours: ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"],
    note: "All times in studio time (WAT)",
  },

  /* ---------- REFUND / CANCELLATION POLICY (shown in Terms + FAQ) ---------- */
  refundPolicy: "Deposits are refundable within 48 hours of booking if work has not started. Completed mixes and masters include free revision rounds until client sign-off. Beat leases are non-refundable once untagged files have been delivered. Bookings can be cancelled in-app from the booking detail screen.",

  /* ---------- APP STORE LINKS (replace once listed) ---------- */
  storeLinks: {
    appStore:  "#",   // e.g. https://apps.apple.com/app/idXXXXXXXXX
    playStore: "#",   // e.g. https://play.google.com/store/apps/details?id=eu.rocaudio.suite
  },

  /* ---------- SERVICES CATALOG — YOUR REAL RATE CARD ----------
     category: "training" | "production" | "studio"              */
  services: [
    {
      id: "beat-making",
      category: "production",
      brand: "The Beats by Roc Company Limited",
      name: "Custom Beat Making (All Genres)",
      blurb: "A custom beat built from scratch in ANY genre — Afrobeats, amapiano, hip-hop, R&B, gospel, drill. Built around your reference and voice.",
      delivery: "3–5 business days",
      rating: 4.9,
      packages: [
        { id: "std", name: "Custom Beat — All Genres", price: 120000, note: "MP3 + WAV + stems • 3 revisions" },
      ],
      bonuses: [
        { id: "rush",  name: "24h rush delivery", price: 40000 },
        { id: "extra", name: "Extra revision round", price: 15000 },
      ],
      payOptions: ["full", "deposit"],
    },
    {
      id: "mix-master",
      category: "studio",
      brand: "RocAudio™ Studio Services",
      name: "Mixing & Mastering (Stem-Based)",
      popular: true,
      blurb: "Stem-based hybrid mix + master: balance, depth, width and club/streaming-ready loudness that translates on every system.",
      delivery: "48–96 hours (stem-count dependent)",
      rating: 5.0,
      packages: [
        { id: "s20", name: "Up to 20 stems", price: 200000, note: "Mix + master • 2 revision rounds" },
        { id: "s40", name: "Up to 40 stems", price: 275000, note: "Mix + master • 3 revision rounds" },
        { id: "s60", name: "40+ stems",      price: 350000, note: "Mix + master • revisions until sign-off" },
      ],
      bonuses: [
        { id: "rush",  name: "24h rush mix + master", price: 60000 },
        { id: "alt",   name: "Alternative master (radio / club)", price: 25000 },
        { id: "instr", name: "Instrumental + a cappella passes", price: 20000 },
      ],
      payOptions: ["full", "deposit", "split3"],
    },
    {
      id: "ep-beats",
      category: "production",
      brand: "The Beats by Roc Company Limited",
      name: "EP Production — 5 Tracks (Beats Only)",
      blurb: "Five cohesive custom beats engineered as one body of work — same sonic world, track-to-track flow, ready for your EP.",
      delivery: "7–10 business days",
      rating: 5.0,
      packages: [
        { id: "ep5", name: "5-Track EP — Beats Only", price: 480000, note: "WAV + stems per beat • saves ₦120,000 vs singles" },
      ],
      bonuses: [
        { id: "sixth", name: "Add a 6th beat", price: 90000 },
        { id: "rush",  name: "5-day rush delivery", price: 100000 },
      ],
      payOptions: ["full", "deposit", "split3"],
    },
    {
      id: "mm-training",
      category: "training",
      brand: "The Symphony Producers Academy",
      name: "Mixing & Mastering Training (6 Weeks)",
      blurb: "Six-week intensive: gain staging, EQ, compression, loudness, release-ready masters — taught live on YOUR mixes, with critique.",
      delivery: "6 weeks • 2 live sessions / week",
      rating: 4.9,
      packages: [
        { id: "six", name: "6-Week Programme", price: 200000, note: "Live classes + critique • certificate on completion" },
      ],
      bonuses: [
        { id: "rec",  name: "Session recordings + notes", price: 15000 },
        { id: "crit", name: "Private mix critique (30 min)", price: 25000 },
      ],
      payOptions: ["full", "split3"],
    },
  ],

  /* ---------- PAYMENT METHODS (demo gateway in this build) ---------- */
  paymentMethods: [
    { id: "card",   name: "Credit / Debit Card", note: "Visa • Mastercard • Verve" },
    { id: "paypal", name: "PayPal",              note: "Redirect checkout" },
    { id: "apple",  name: "Apple Pay",           note: "On iPhone & Mac" },
    { id: "google", name: "Google Pay",          note: "On Android & Chrome" },
    { id: "bank",   name: "Bank Transfer (NUBAN)", note: "Moniepoint • 1–2 business days" },
  ],

  /* ---------- SEED REVIEWS (shown until real ones arrive) ---------- */
  seedReviews: [
    { serviceId: "mix-master", name: "Malik T.", rating: 5, text: "My EP finally sounds like the records I reference. Depth and width I could never get myself. Delivered in 2 days." },
    { serviceId: "mix-master", name: "Sena K.",  rating: 5, text: "Communication in the app chat was instant. Revisions came back same day. Insane value for stem mixing." },
    { serviceId: "mix-master", name: "K. Mensah", rating: 5, text: "One engineer, one vision, finished record in 3 days. The invoice and booking flow in the app made it effortless." },
    { serviceId: "beat-making", name: "Aylin R.", rating: 5, text: "Sent one reference song and a voice note. The beat that came back was EXACTLY my vision. Worth every naira." },
    { serviceId: "beat-making", name: "Tunde B.", rating: 5, text: "Afrobeats to amapiano to drill — he switches genres like outfits and still keeps it knocking. 3 days, done." },
    { serviceId: "ep-beats", name: "Blaq Ivy", rating: 5, text: "Five beats that feel like one world. My EP finally flows track to track. The bundle price beat buying singles by far." },
    { serviceId: "mm-training", name: "Bram D.", rating: 5, text: "The live critique format changed how I hear my own mixes. Two weeks in and my low end is finally clean." },
    { serviceId: "mm-training", name: "Noor E.", rating: 5, text: "Six weeks, zero fluff. I released my first single the week after graduating. The certificate actually opened doors." },
  ],
};

/* Expose for Node-based tests / tooling (harmless in browser) */
if (typeof module !== "undefined" && module.exports) module.exports = CONFIG;
