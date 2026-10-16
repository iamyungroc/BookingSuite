/* ============================================================
   RocAudio Suite — DATA LAYER (localStorage, offline-first)
   Users, sessions, bookings, payments, invoices, chat,
   reviews, notifications. Demo-grade persistence: swap this
   module for a real backend (Supabase/Firebase) in production.
   ============================================================ */

const RBS = (() => {
  "use strict";

  const mem = {}; // fallback when localStorage unavailable
  const store = {
    get(k) {
      try { return localStorage.getItem(k); } catch (e) { return mem[k] ?? null; }
    },
    set(k, v) {
      try { localStorage.setItem(k, v); } catch (e) { mem[k] = v; }
    },
    del(k) {
      try { localStorage.removeItem(k); } catch (e) { delete mem[k]; }
    },
  };

  const K = {
    users: "rbs_users", session: "rbs_session", bookings: "rbs_bookings",
    payments: "rbs_payments", invoices: "rbs_invoices", chat: "rbs_chat",
    reviews: "rbs_reviews", notifs: "rbs_notifs", seeded: "rbs_seeded_v1",
    assistant: "rbs_assistant_on", studiopin: "rbs_studio_pin", pinlock: "rbs_pin_lock",
  };

  const get = (k, fb) => { try { const v = JSON.parse(store.get(k)); return v == null ? fb : v; } catch (e) { return fb; } };
  const set = (k, v) => store.set(k, JSON.stringify(v));

  const uid = (p) => p + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const now = () => new Date().toISOString();

  /* demo-only hash (NOT for production) */
  const hash = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return "h" + (h >>> 0); };

  const money = (n) => {
    const sym = CONFIG.brand.currencySymbol;
    return sym + Number(n).toFixed(2).replace(/\.00$/, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  const moneyFull = (n) => {
    const [i, d] = Number(n).toFixed(2).split(".");
    return CONFIG.brand.currencySymbol + i.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "." + d;
  };

  const dateStr = (d) => {
    const x = new Date(d);
    return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0");
  };
  const prettyDate = (s) => {
    const d = new Date(s + (s.length === 10 ? "T12:00:00" : ""));
    return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  };

  /* ---------------- AUTH ---------------- */
  const users = () => get(K.users, []);
  const saveUsers = (u) => set(K.users, u);

  function register({ name, email, phone, password }) {
    const list = users();
    email = String(email).trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "Enter a valid email address." };
    if (!name || name.trim().length < 2) return { error: "Enter your full name." };
    if (!password || password.length < 6) return { error: "Password must be at least 6 characters." };
    if (list.some((u) => u.email === email)) return { error: "An account with this email already exists. Log in instead." };
    if (email === String((CONFIG.studio || {}).email || "").toLowerCase()) return { error: "This email is reserved for admin." };
    const user = { id: uid("usr"), name: name.trim(), email, phone: phone || "", password: hash(password), createdAt: now() };
    list.push(user); saveUsers(list);
    sessStore().setItem(K.session, user.id);
    notify(user.id, "Welcome to " + CONFIG.brand.appName, "Your account is ready. Book your first session and track everything here.");
    return { user };
  }

  function login(email, password) {
    const u = users().find((x) => x.email === String(email).trim().toLowerCase());
    if (!u || u.password !== hash(password)) return { error: "Incorrect email or password." };
    sessStore().setItem(K.session, u.id);
    return { user: u };
  }

  const memSess = {
    getItem(k) { return mem[k] ?? null; },
    setItem(k, v) { mem[k] = String(v); },
    removeItem(k) { delete mem[k]; },
  };
  const sessStore = () => {
    try { return localStorage.getItem("rbs_remember") === "0" ? sessionStorage : localStorage; }
    catch (e) { return memSess; }
  };
  const setRemember = (on) => { try { localStorage.setItem("rbs_remember", on ? "1" : "0"); } catch (e) {} };
  const getRemember = () => { try { return localStorage.getItem("rbs_remember") !== "0"; } catch (e) { return true; } };
  const logout = () => {
    try { localStorage.removeItem(K.session); } catch (e) {}
    try { sessionStorage.removeItem(K.session); } catch (e) {}
    delete mem[K.session];
  };
  const isStudio = () => {
    try { return sessionStorage.getItem(K.session) === "studio" || localStorage.getItem(K.session) === "studio"; }
    catch (e) { return mem[K.session] === "studio"; }
  };
  const LOCK_MS = 5 * 60 * 1000, MAX_TRIES = 5;
  function loginAdmin(pin) {
    const L = get(K.pinlock, { n: 0, t: 0 });
    if (L.n >= MAX_TRIES && Date.now() - L.t < LOCK_MS)
      return { error: "Too many attempts. Console locked for 5 minutes." };
    const stored = store.get(K.studiopin);
    const correct = stored ? stored === hash(pin) : hash(pin) === (CONFIG.studio || {}).pinHash;
    if (!correct) {
      L.n = (Date.now() - L.t < LOCK_MS ? L.n : 0) + 1; L.t = Date.now();
      set(K.pinlock, L);
      return { error: "Wrong PIN. " + Math.max(0, MAX_TRIES - L.n) + " attempt(s) left." };
    }
    set(K.pinlock, { n: 0, t: 0 });
    sessStore().setItem(K.session, "studio");
    return { ok: true };
  }
  function changeStudioPin(current, next) {
    const stored = store.get(K.studiopin);
    const okCur = stored ? stored === hash(current) : hash(current) === (CONFIG.studio || {}).pinHash;
    if (!okCur) return { error: "Current PIN incorrect." };
    if (!/^\d{4,8}$/.test(next)) return { error: "New PIN must be 4-8 digits." };
    store.set(K.studiopin, hash(next));
    return { ok: true };
  }
  const currentUser = () => {
    let id = null;
    try { id = sessionStorage.getItem(K.session) || localStorage.getItem(K.session); } catch (e) { id = store.get(K.session); }
    return id ? users().find((u) => u.id === id) || null : null;
  };
  function updateUser(id, patch) {
    const list = users(); const u = list.find((x) => x.id === id);
    if (!u) return { error: "User not found." };
    Object.assign(u, patch);
    if (patch.password) u.password = hash(patch.password);
    saveUsers(list); return { user: u };
  }

  /* ---------------- BOOKINGS ---------------- */
  const bookings = () => get(K.bookings, []);
  function createBooking(b) {
    const list = bookings();
    const booking = Object.assign({ id: uid("bkg"), createdAt: now(), status: "awaiting_payment" }, b);
    list.push(booking); set(K.bookings, list);
    return booking;
  }
  function updateBooking(id, patch) {
    const list = bookings(); const b = list.find((x) => x.id === id);
    if (!b) return null; Object.assign(b, patch); set(K.bookings, list); return b;
  }
  const userBookings = (uid_) => bookings().filter((b) => b.userId === uid_).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  /* ---------------- PAYMENTS ---------------- */
  const payments = () => get(K.payments, []);
  function createPayment(p) {
    const list = payments();
    const pay = Object.assign({ id: uid("pay"), ref: ("RBS-" + Math.random().toString(36).slice(2, 8).toUpperCase()), createdAt: now() }, p);
    list.push(pay); set(K.payments, list);
    return pay;
  }
  const userPayments = (uid_) => payments().filter((p) => p.userId === uid_).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  /* ---------------- INVOICES ---------------- */
  const invoices = () => get(K.invoices, []);
  function createInvoice(inv) {
    const list = invoices();
    const num = "RBS-" + new Date().getFullYear() + "-" + String(list.length + 1).padStart(4, "0");
    const invoice = Object.assign({ id: uid("inv"), number: num, createdAt: now(), sentTo: [], sentAt: null }, inv);
    list.push(invoice); set(K.invoices, list);
    return invoice;
  }
  const getInvoice = (id) => invoices().find((i) => i.id === id) || null;
  const userInvoices = (uid_) => invoices().filter((i) => i.userId === uid_).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  /* simulate auto-send: client email + business copy */
  function sendInvoice(id) {
    const list = invoices(); const inv = list.find((i) => i.id === id);
    if (!inv) return null;
    const user = users().find((u) => u.id === inv.userId);
    inv.sentTo = [user ? user.email : "client", CONFIG.brand.businessEmail];
    inv.sentAt = now();
    set(K.invoices, list);
    return inv;
  }

  /* ---------------- CHAT ---------------- */
  const chatAll = () => get(K.chat, {});
  const thread = (uid_) => (chatAll()[uid_] || []);
  function sendMessage(uid_, from, text) {
    const all = chatAll();
    if (!all[uid_]) all[uid_] = [];
    const msg = { id: uid("msg"), from, text, ts: now() };
    all[uid_].push(msg); set(K.chat, all);
    return msg;
  }

  const svcFrom = (id) => CONFIG.services.find((s) => s.id === id);
  function proReply(text) {
    const t = String(text).toLowerCase();
    const B_ = CONFIG.brand;
    const list = (cat) => CONFIG.services.filter((s) => !cat || s.category === cat)
      .map((s) => "• " + s.name + " — from " + money(Math.min(...s.packages.map((p) => p.price))) + " (" + s.delivery + ")").join("\n");
    if (/(^|\s)(hi|hello|hey|good (day|morning|afternoon|evening))\b/.test(t))
      return "Good day, and welcome to the RocAudio Studio Desk.\nI can assist with: prices & packages, delivery times, bookings, payment options, invoices and training.\nType \"human\" at any time and Roc joins you personally. How may I help you today?";
    if (/price|cost|how much|rate|charge|fee/.test(t))
      return "Our current rate card:\n" + list() + "\nPayment plans: pay in full, 50% deposit, or 3 installments where offered. Shall I book you in?";
    if (/deliver|turnaround|how long|when will|eta/.test(t))
      return "Delivery commitments:\n" + CONFIG.services.map((s) => "• " + s.name + ": " + s.delivery).join("\n") + "\nRush options are available as bonuses at checkout.";
    if (/book|schedule|slot|calendar|reserve|appoint/.test(t))
      return "Booking takes under a minute:\n1. Services → choose your package & bonuses\n2. Pick a date & time on the calendar (" + CONFIG.booking.note + ", " + CONFIG.booking.timezone + ")\n3. Confirm & pay — invoice arrives by email instantly.\nWould you like me to recommend a package?";
    if (/pay|invoice|receipt|refund|deposit|installment|bank|card/.test(t))
      return "We accept: " + CONFIG.paymentMethods.map((m) => m.name).join(", ") + ".\nPlans: pay in full, 50% deposit (balance on delivery), or 3 monthly installments where offered.\nEvery payment is confirmed in-app and invoiced automatically to your email and our books.\nRefunds: " + CONFIG.refundPolicy;
    if (/train|class|course|learn|academy|bootcamp|mentor/.test(t))
      return "The Symphony Producers Academy runs:\n" + list("training") + "\nCertificates on completion. Which skill are we building first?";
    if (/beat|produce|production|instrumental/.test(t))
      return "The Beats by Roc Company Limited delivers:\n" + list("production") + "\nSend a reference track in chat and we'll match the vision.";
    if (/mix|master|stem/.test(t))
      return "RocAudio™ Studio Services:\n" + list("studio") + "\nStem-based, revision rounds included, club & streaming loudness targets honoured.";
    if (/human|roc\b|agent|manager|owner|staff|person/.test(t))
      return "Noted with care — I've escalated this to Roc personally.\nStudio desk hours: " + (CONFIG.booking.hours[0] || "09:00") + "–" + (CONFIG.booking.hours[CONFIG.booking.hours.length - 1] || "18:00") + " " + CONFIG.booking.timezone + ", Monday to Saturday. Expect a direct reply in this chat shortly.";
    if (/thank|thanks|appreciate|cheers/.test(t))
      return "Our pleasure — that's what the Studio Desk is for.\nAnything else I can arrange for you today?";
    if (/contact|email|phone|call|reach/.test(t))
      return "You can reach the business at " + B_.businessEmail + " or " + B_.phone + " — or right here in chat, which is monitored throughout studio hours.";
    return "Thank you for reaching out to the RocAudio Studio Desk.\nI can assist with: prices, delivery times, bookings, payment options, invoices, training and production enquiries — or type \"human\" for Roc directly.\nHow may I help you?";
  }
  const autoReply = (text) => proReply(text);

  /* ---------------- REVIEWS ---------------- */
  const reviews = () => get(K.reviews, []);
  function addReview(r) {
    const list = reviews();
    if (r.userId) {
      const mine = list.find((x) => x.userId === r.userId && x.serviceId === r.serviceId);
      if (mine) { mine.rating = r.rating; mine.text = r.text; mine.ts = now(); set(K.reviews, list); return mine; }
    }
    const rev = Object.assign({ id: uid("rev"), ts: now() }, r);
    list.push(rev); set(K.reviews, list);
    return rev;
  }
  function addReviewReply(reviewId, text) {
    const list = reviews(); const rev = list.find((x) => x.id === reviewId);
    if (!rev) return null;
    rev.reply = { text, ts: now() };
    set(K.reviews, list);
    if (rev.userId) notify(rev.userId, "The studio replied to your review", text.slice(0, 80), "#/service/" + rev.serviceId);
    return rev;
  }
  const canReview = (userId, serviceId) => bookings().some((b) => b.userId === userId && b.serviceId === serviceId && b.status === "delivered");
  const userReview = (userId, serviceId) => reviews().find((r) => r.userId === userId && r.serviceId === serviceId) || null;
  function serviceReviews(serviceId) {
    return reviews().filter((r) => r.serviceId === serviceId).sort((a, b) => b.ts.localeCompare(a.ts));
  }
  function serviceRating(serviceId) {
    const rs = serviceReviews(serviceId);
    if (!rs.length) return { avg: 0, count: 0 };
    return { avg: rs.reduce((s, r) => s + r.rating, 0) / rs.length, count: rs.length };
  }

  /* ---------------- NOTIFICATIONS ---------------- */
  const notifs = () => get(K.notifs, []);
  function notify(uid_, title, body, route) {
    const list = notifs();
    const n = { id: uid("ntf"), userId: uid_, title, body, ts: now(), read: false, route: route || "#/bookings" };
    list.push(n);
    set(K.notifs, list);
    /* browser notification if allowed — tappable: opens the app at the right screen */
    try {
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        const bn = new Notification(title, { body, icon: "assets/icon-192.png", tag: n.id });
        bn.onclick = (e) => {
          e.preventDefault();
          try { window.focus(); } catch (_) {}
          try { location.hash = n.route; } catch (_) {}
          try { bn.close(); } catch (_) {}
        };
      }
    } catch (e) { /* noop */ }
    return n;
  }
  const userNotifs = (uid_) => notifs().filter((n) => n.userId === uid_).sort((a, b) => b.ts.localeCompare(a.ts));
  const unreadCount = (uid_) => userNotifs(uid_).filter((n) => !n.read).length;
  function markAllRead(uid_) {
    const list = notifs();
    list.forEach((n) => { if (n.userId === uid_) n.read = true; });
    set(K.notifs, list);
  }

  /* ---------------- CLOUD SYNC MERGE ---------------- */
  function mergeRemote(name, rows) {
    if (!rows || !rows.length) return 0;
    let changed = 0;
    if (name === "chat") {
      const all = chatAll();
      rows.forEach((m) => {
        const arr = all[m.client_id] || [];
        if (!arr.some((x) => x.id === m.id)) { arr.push({ id: m.id, from: m.sender, text: m.body, ts: m.created_at }); changed++; }
        all[m.client_id] = arr;
      });
      if (changed) set(K.chat, all);
      return changed;
    }
    const KMAP = { users: K.users, bookings: K.bookings, payments: K.payments, invoices: K.invoices, reviews: K.reviews, notifs: K.notifs };
    const list = get(KMAP[name], []);
    const idx = {}; list.forEach((x, i) => idx[x.id] = i);
    rows.forEach((r) => {
      if (idx[r.id] == null) { list.push(r); changed++; }
      else if (JSON.stringify(list[idx[r.id]]) !== JSON.stringify(r)) { list[idx[r.id]] = r; changed++; }
    });
    if (changed) set(KMAP[name], list);
    return changed;
  }

  /* ---------------- STUDIO OPS ---------------- */
  const STATUS_LABEL = { awaiting_payment: "awaiting payment", confirmed: "confirmed", in_progress: "in progress", delivered: "delivered", cancelled: "cancelled" };
  function setBookingStatus(id, status) {
    const b = updateBooking(id, { status });
    if (!b) return null;
    notify(b.userId, "Booking " + STATUS_LABEL[status], b.serviceName + " (" + prettyDate(b.date) + " " + b.time + ") is now " + STATUS_LABEL[status] + ".", "#/bookings");
    sendMessage(b.userId, "studio", "Status update — " + b.serviceName + ": " + STATUS_LABEL[status] + ".");
    return b;
  }
  function markPaymentPaid(pid) {
    const list = payments(); const p = list.find((x) => x.id === pid);
    if (!p || p.status === "paid") return p;
    p.status = "paid"; p.paidAt = now(); set(K.payments, list);
    const il = invoices(); const inv = il.find((i) => i.bookingId === p.bookingId);
    if (inv) {
      inv.paid = Math.round((inv.paid + p.amount) * 100) / 100;
      if (inv.paid >= inv.total) inv.status = "paid";
      set(K.invoices, il);
    }
    notify(p.userId, "Payment confirmed ✓", moneyFull(p.amount) + " received. Thank you!", "#/payments");
    return p;
  }
  const getAssistant = () => { const v = store.get(K.assistant); return v == null ? ((CONFIG.studio || {}).assistantDefault !== false) : v === "1"; };
  const setAssistant = (on) => store.set(K.assistant, on ? "1" : "0");

  /* ---------------- SEED (first run) ---------------- */
  function seed() {
    if (store.get(K.seeded)) return;
    set(K.seeded, "1");
    (CONFIG.seedReviews || []).forEach((r) => addReview({ serviceId: r.serviceId, name: r.name, rating: r.rating, text: r.text, seeded: true }));

    /* demo account with history so the app is explorable instantly */
    const demo = { id: "usr_demo", name: "Demo Client", email: "demo@rocaudio.eu", phone: "+31 6 1234 5678", password: hash("demo1234"), createdAt: now() };
    saveUsers([demo]);

    const svc = CONFIG.services.find((s) => s.id === "mix-master");
    const pkg = svc.packages[0];
    const d1 = dateStr(Date.now() - 6 * 864e5), d2 = dateStr(Date.now() + 3 * 864e5);

    const netOf = (g) => Math.round(g / (1 + CONFIG.brand.vatRate / 100) * 100) / 100;
    const b1 = createBooking({ userId: demo.id, serviceId: svc.id, serviceName: svc.name, packageName: pkg.name, date: d1, time: "14:00", notes: "Single release — reference: warm analog.", status: "delivered", total: pkg.price, payOption: "full" });
    const p1 = createPayment({ userId: demo.id, bookingId: b1.id, amount: pkg.price, method: "card", status: "paid", paidAt: now() });
    sendInvoice(createInvoice({ userId: demo.id, bookingId: b1.id, lines: [{ label: svc.name + " — " + pkg.name, amount: pkg.price }], subtotal: netOf(pkg.price), vat: +(pkg.price - netOf(pkg.price)).toFixed(2), total: pkg.price, paid: p1.amount, status: "paid" }).id);

    const svc2 = CONFIG.services.find((s) => s.id === "beat-making");
    const pkg2 = svc2.packages[0];
    const b2 = createBooking({ userId: demo.id, serviceId: svc2.id, serviceName: svc2.name, packageName: pkg2.name, date: d2, time: "10:00", notes: "Afrobeats single, club + streaming masters.", status: "confirmed", total: pkg2.price, payOption: "full" });
    createPayment({ userId: demo.id, bookingId: b2.id, amount: pkg2.price, method: "paypal", status: "paid", paidAt: now() });
    sendInvoice(createInvoice({ userId: demo.id, bookingId: b2.id, lines: [{ label: svc2.name + " — " + pkg2.name, amount: pkg2.price }], subtotal: netOf(pkg2.price), vat: +(pkg2.price - netOf(pkg2.price)).toFixed(2), total: pkg2.price, paid: pkg2.price, status: "paid" }).id);

    sendMessage(demo.id, "studio", "Welcome to the RocAudio studio chat! Drop your references, stems questions or booking requests here — we usually reply within minutes.");
    notify(demo.id, "Booking confirmed", svc2.name + " on " + prettyDate(d2) + " at 10:00. Invoice sent to your email.");
  }

  return {
    get, set, uid, now, hash, money, moneyFull, dateStr, prettyDate,
    register, login, logout, currentUser, updateUser, users,
    bookings, createBooking, updateBooking, userBookings,
    payments, createPayment, userPayments,
    invoices, createInvoice, getInvoice, userInvoices, sendInvoice,
    chatAll, thread, sendMessage, autoReply,
    reviews, addReview, serviceReviews, serviceRating,
    notifs, notify, userNotifs, unreadCount, markAllRead,
    mergeRemote, setRemember, getRemember,
    seed, isStudio, loginAdmin, setBookingStatus, markPaymentPaid,
    getAssistant, setAssistant, canReview, userReview, addReviewReply, STATUS_LABEL,
    changeStudioPin,
  };
})();

if (typeof module !== "undefined" && module.exports) module.exports = RBS;
