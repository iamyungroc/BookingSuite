/* ============================================================
   RocAudio Suite — APP (PWA) CORE
   SPA router • auth • catalog • booking calendar • checkout
   (demo gateway) • invoices • payment tracker • live chat •
   reviews • notifications • profile
   ============================================================ */
(function () {
  "use strict";

  const B = CONFIG.brand;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------------- icons ---------------- */
  const I = {
    back: '<svg viewBox="0 0 24 24"><path d="M19 12H5m0 0l7 7m-7-7l7-7"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>',
    send: '<svg viewBox="0 0 24 24"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>',
    chevL: '<svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>',
    chevR: '<svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>',
    bell: '<svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/></svg>',
    train: '<svg viewBox="0 0 24 24"><path d="M22 10L12 5 2 10l10 5 10-5zM6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/></svg>',
    beat: '<svg viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
    faders: '<svg viewBox="0 0 24 24"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/></svg>',
    clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
    doc: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h6"/></svg>',
    dl: '<svg viewBox="0 0 24 24"><path d="M12 3v12m0 0l-4.5-4.5M12 15l4.5-4.5M4 20h16"/></svg>',
  };
  const catIcon = (c) => (c === "training" ? I.train : c === "production" ? I.beat : I.faders);

  /* ---------------- helpers ---------------- */
  function starRow(rating, cls) {
    let s = '<span class="stars ' + (cls || "") + '">';
    for (let i = 1; i <= 5; i++)
      s += '<svg viewBox="0 0 24 24" class="' + (i <= Math.round(rating) ? "" : "off") + '"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>';
    return s + "</span>";
  }
  function timeAgo(ts) {
    const d = (Date.now() - new Date(ts).getTime()) / 1000;
    if (d < 60) return "just now";
    if (d < 3600) return Math.floor(d / 60) + "m ago";
    if (d < 86400) return Math.floor(d / 3600) + "h ago";
    return Math.floor(d / 86400) + "d ago";
  }
  const STATUS = {
    awaiting_payment: "Awaiting payment", confirmed: "Confirmed", in_progress: "In progress",
    delivered: "Delivered", cancelled: "Cancelled",
    paid: "Paid", pending: "Pending", failed: "Failed", refunded: "Refunded",
  };
  const PAY_LABEL = { full: "Pay in full", deposit: "50% deposit — balance on delivery", split3: "3 monthly installments" };
  const round2 = (n) => Math.round(n * 100) / 100;
  const vatSplit = (gross) => { const net = round2(gross / (1 + B.vatRate / 100)); return { net, vat: round2(gross - net) }; };

  function toast(title, body, kind) {
    const wrap = $("#toasts");
    const el = document.createElement("div");
    el.className = "toast " + (kind || "");
    el.innerHTML = "<div><b>" + esc(title) + "</b><span>" + esc(body || "") + "</span></div>";
    wrap.appendChild(el);
    setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 260); }, 4500);
  }

  /* ---------------- modal system ---------------- */
  function openModal(html, lock) {
    const root = $("#modal-root");
    root.innerHTML = '<div class="modal-backdrop" ' + (lock ? 'data-lock="1"' : "") + '><div class="modal">' + html + "</div></div>";
    const bd = root.firstElementChild;
    bd.addEventListener("click", (e) => { if (e.target === bd && !lock) closeModal(); });
    return root.querySelector(".modal");
  }
  const closeModal = () => { $("#modal-root").innerHTML = ""; };

  /* ---------------- router ---------------- */
  function parseHash() {
    const raw = (location.hash || "#/home").slice(2);
    const [path, query] = raw.split("?");
    const seg = path.split("/").filter(Boolean);
    return { name: seg[0] || "home", param: seg[1] || null, q: new URLSearchParams(query || "") };
  }
  const TAB_OF = { home: "home", services: "services", service: "services", book: "services", bookings: "bookings", calendar: "bookings", payments: "bookings", invoice: "bookings", chat: "chat", profile: "profile", login: null };

  function render() {
    const studio = RBS.isStudio();
    const user = studio ? null : RBS.currentUser();
    const r = parseHash();
    const isSRoute = r.name.indexOf("studio") === 0;
    if (studio && !isSRoute) { location.hash = "#/studio"; return; }
    if (!studio && isSRoute) { location.hash = "#/login"; return; }
    if (!studio && !user && r.name !== "login") { location.hash = "#/login"; return; }
    if (!studio && user && r.name === "login") { location.hash = "#/home"; return; }
    if (!studio && !user) { viewLogin(); setTabbar(null); if (r.q.get("admin") === "1") openConsoleGate(); return; }
    $("#btn-bell").style.display = studio ? "none" : "grid";

    let badges = null;
    if (studio) {
      const waiting = RBS.bookings().filter((b) => b.status === "awaiting_payment").length;
      const chats = Object.values(RBS.chatAll()).filter((arr) => arr.length && arr[arr.length - 1].from === "me").length;
      badges = { "studio-book": waiting || 0, "studio-chats": chats || 0 };
    }
    const view = $("#view");
    switch (r.name) {
      case "home": view.innerHTML = vHome(user); bindHome(); break;
      case "services": view.innerHTML = vServices(); bindServices(); break;
      case "service": view.innerHTML = vService(user, r.param); bindService(r.param); break;
      case "book": view.innerHTML = vBook(user, r.param, r.q); bindBook(user, r.param, r.q); break;
      case "bookings": view.innerHTML = vBookings(user); bindBookings(user); break;
      case "calendar": view.innerHTML = vCalendar(user); bindCalendar(user); break;
      case "payments": view.innerHTML = vPayments(user); bindPayments(user); break;
      case "invoice": view.innerHTML = vInvoice(r.param); bindInvoice(r.param, user); break;
      case "chat": view.innerHTML = vChat(user); bindChat(user); break;
      case "profile": view.innerHTML = vProfile(user); bindProfile(user); break;
      case "studio": view.innerHTML = vStudio(); bindStudio(); break;
      case "studio-chats": view.innerHTML = vStudioChats(); bindStudioChats(); break;
      case "studio-book": view.innerHTML = vStudioBook(); bindStudioBook(); break;
      case "studio-pay": view.innerHTML = vStudioPay(); bindStudioPay(); break;
      case "studio-rev": view.innerHTML = vStudioRev(); bindStudioRev(); break;
      default: view.innerHTML = studio ? vStudio() : vHome(user); if (studio) bindStudio(); else bindHome();
    }
    setTabbar(studio ? "studio" : "client", studio ? r.name : (TAB_OF[r.name] || null), badges);
    updateBell(user);
    window.scrollTo(0, 0);
  }
  const TABS = {
    client: [
      ["home", "Home", '<svg viewBox="0 0 24 24"><path d="M3 10.5L12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>'],
      ["services", "Services", '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>'],
      ["bookings", "Bookings", '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>'],
      ["chat", "Chat", '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'],
      ["profile", "Profile", '<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'],
    ],
    studio: [
      ["studio", "Console", '<svg viewBox="0 0 24 24"><path d="M3 13h4l3 8 4-16 3 8h4"/></svg>'],
      ["studio-chats", "Chats", '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'],
      ["studio-book", "Queue", '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>'],
      ["studio-pay", "Payments", '<svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/></svg>'],
      ["studio-rev", "Reviews", '<svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>'],
    ],
  };
  function setTabbar(mode, active, badges) {
    const tb = $("#tabbar");
    if (!mode) { tb.style.display = "none"; return; }
    tb.style.display = "flex";
    tb.innerHTML = TABS[mode].map((t) =>
      '<button data-t="' + t[0] + '" class="' + (t[0] === active ? "on" : "") + '"><span class="tdot">' + t[2] + "</span>" + t[1] +
      (badges && badges[t[0]] ? '<span class="bcount">' + badges[t[0]] + "</span>" : "") + "</button>").join("");
  }
  function updateBell(user) {
    const n = user ? RBS.unreadCount(user.id) : 0;
    const dot = $("#bell-dot");
    dot.textContent = n;
    dot.classList.toggle("hide", n === 0);
  }
  window.addEventListener("hashchange", render);

  /* ================= LOGIN / REGISTER ================= */
  function viewLogin() {
    $("#view").innerHTML =
      '<div class="auth-wrap"><div class="card auth-card">' +
      '<div class="logo-row"><img src="assets/icon-192.png" style="width:64px;height:64px;border-radius:17px" alt="RocAudio"></div>' +
      '<div class="center" style="margin-bottom:18px"><h1 style="font-size:22px;font-weight:800;letter-spacing:-.02em">' + esc(B.appName) + "</h1>" +
      '<p class="small muted">' + esc(B.tagline) + "</p></div>" +
      '<div class="auth-tabs"><button id="t-login" class="on">Log in</button><button id="t-reg">Create account</button></div>' +
      '<form id="auth-form" novalidate>' +
      '<div class="field hide" id="f-name"><label>Full name</label><input id="in-name" autocomplete="name" placeholder="Jane Artist"><div class="err"></div></div>' +
      '<div class="field" id="f-email"><label>Email</label><input id="in-email" type="email" autocomplete="email" inputmode="email" placeholder="you@email.com"><div class="err"></div></div>' +
      '<div class="field hide" id="f-phone"><label>Phone <span class="muted">(optional)</span></label><input id="in-phone" type="tel" placeholder="+31 6 ..."></div>' +
      '<div class="field" id="f-pass"><label>Password</label><input id="in-pass" type="password" autocomplete="current-password" placeholder="••••••••"><div class="err"></div></div>' +
      '<label class="remember"><input type="checkbox" id="remember" checked><span>Keep me logged in on this device</span></label>' +
      '<div class="row between" style="margin:2px 0 12px"><span></span><button type="button" class="linkish" id="forgot">Forgot password?</button></div>' +
      '<button class="btn btn-primary btn-block" id="auth-go" type="button">Log in</button>' +
      "</form>" +
      '<p class="demo-hint">Demo account: <code>demo@rocaudio.eu</code> / <code>demo1234</code></p>' +
      '<p class="demo-hint" style="margin-top:8px">Client data is required to use the app and is stored on this device.</p>' +
      '<p class="demo-hint" style="margin-top:6px">By continuing you agree to our <a href="legal.html#terms">Terms</a> & <a href="legal.html#privacy">Privacy Policy</a>.</p>' +
      '<p class="demo-hint" style="margin-top:4px;opacity:.6">build 1.5.2</p>' +
      '<p class="small muted center" style="margin-top:18px;opacity:.7">' + poweredLineWithGate() + "</p>" +
      "</div></div>";

    let mode = "login";
    const setMode = (m) => {
      mode = m;
      $("#t-login").classList.toggle("on", m === "login");
      $("#t-reg").classList.toggle("on", m === "reg");
      $("#f-name").classList.toggle("hide", m === "login");
      $("#f-phone").classList.toggle("hide", m === "login");
      $("#auth-go").textContent = m === "login" ? "Log in" : "Create account";
      $("#in-pass").autocomplete = m === "login" ? "current-password" : "new-password";
    };
    $("#forgot").onclick = () => {
      const m = openModal('<h3>Reset password</h3><p class="modal-sub">For accounts on this device. Cross-device email reset activates automatically once cloud sync (Supabase) is enabled.</p>' +
        '<div class="field"><label>Account email</label><input id="fp-mail" type="email" autocomplete="email" placeholder="you@email.com"></div>' +
        '<div class="field"><label>New password</label><input id="fp-pass" type="password" autocomplete="new-password" placeholder="min 6 characters"></div>' +
        '<div class="field"><label>Confirm new password</label><input id="fp-conf" type="password" autocomplete="new-password"></div>' +
        '<button class="btn btn-primary btn-block" id="fp-go" type="button">Reset password</button>');
      m.querySelector("#fp-go").onclick = () => {
        const em = m.querySelector("#fp-mail").value.trim().toLowerCase();
        const np = m.querySelector("#fp-pass").value, cf = m.querySelector("#fp-conf").value;
        const u = RBS.users().find((x) => x.email === em);
        if (!u) { toast("Not found", "No account with that email exists on this device.", "err"); return; }
        if (np.length < 6) { toast("Too short", "Password must be at least 6 characters.", "warn"); return; }
        if (np !== cf) { toast("Mismatch", "The two passwords differ.", "err"); return; }
        RBS.updateUser(u.id, { password: np });
        closeModal(); toast("Password updated", "Log in with your new password.", "ok");
      };
    };
    $("#t-login").onclick = () => setMode("login");
    $("#t-reg").onclick = () => setMode("reg");
    const doLogin = () => {
      const email = $("#in-email").value, pass = $("#in-pass").value;
      RBS.setRemember($("#remember") ? $("#remember").checked : true);
      const res = mode === "login"
        ? RBS.login(email, pass)
        : RBS.register({ name: $("#in-name").value, email, phone: $("#in-phone").value, password: pass });
      if (res.error) {
        const f = mode === "login" ? $("#f-pass") : $("#f-name");
        toast("Couldn't continue", res.error, "err");
        f.classList.add("invalid"); f.querySelector(".err").textContent = res.error;
        return;
      }
      toast(mode === "login" ? "Welcome back" : "Account created", "You're logged in to " + B.appName + ".", "ok");
      location.hash = "#/home";
    };
    $("#auth-go").addEventListener("click", doLogin);
    $("#auth-form").onsubmit = (e) => { e.preventDefault(); doLogin(); };
    ["#in-email", "#in-pass", "#in-name", "#in-phone"].forEach((sel) => {
      const el = $(sel);
      if (el) el.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); doLogin(); } });
    });
    const gate = $("#admin-gate");
    if (gate) gate.addEventListener("click", openConsoleGate);
  }

  function poweredLineWithGate() {
    const parts = String(B.footerLine).split("Tech");
    if (parts.length < 2) return esc(B.footerLine);
    return esc(parts[0]) + '<span id="admin-gate" class="secret-tap">Tech</span>' + esc(parts.slice(1).join("Tech"));
  }
  function openConsoleGate() {
    const m = openModal('<h3>Console</h3><p class="modal-sub">Enter your admin PIN.</p>' +
      '<div class="field"><label>Admin PIN</label><input id="pin-in" type="password" inputmode="numeric" placeholder="••••" autocomplete="off"></div>' +
      '<button class="btn btn-primary btn-block" id="pin-go" type="button">Enter Console</button>');
    const go = () => {
      const adm = RBS.loginAdmin(m.querySelector("#pin-in").value.replace(/\s/g, ""));
      if (adm.error) {
        toast("Access denied", adm.error, "err");
        m.querySelector("#pin-in").value = "";
        return;
      }
      closeModal(); toast("Console", "Welcome back, Roc. Your queue is live.", "ok");
      location.hash = "#/studio";
    };
    m.querySelector("#pin-go").addEventListener("click", go);
    m.querySelector("#pin-in").addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
  }

  /* ================= HOME ================= */
  function vHome(user) {
    const bs = RBS.userBookings(user.id);
    const active = bs.filter((b) => ["awaiting_payment", "confirmed", "in_progress"].includes(b.status));
    const paidSum = RBS.userPayments(user.id).filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
    const nowTs = Date.now();
    const next = bs.filter((b) => ["confirmed", "in_progress"].includes(b.status) && new Date(b.date + "T" + b.time).getTime() >= nowTs - 3600e3)
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0];
    const featured = CONFIG.services.slice().sort((a, b) => b.rating - a.rating).slice(0, 3);

    return '<div class="view">' +
      '<div class="hero-card">' +
      '<span class="chip" style="background:rgba(7,11,18,.4);border-color:rgba(255,255,255,.14)">' + esc(B.techCompany) + " • " + esc(B.techCompanyTag) + "</span>" +
      '<h1 style="font-size:24px;font-weight:800;letter-spacing:-.02em;margin-top:12px">Hello, ' + esc(user.name.split(" ")[0]) + "</h1>" +
      '<p class="small muted" style="margin-top:4px;max-width:40ch">' +
      (next ? "Next up: <b style='color:var(--text)'>" + esc(next.serviceName) + "</b> on " + RBS.prettyDate(next.date) + " at " + next.time + "."
            : "No upcoming sessions yet — book your next move below.") + "</p>" +
      '<div class="wave" style="height:38px;margin-top:14px">' + [12, 26, 18, 32, 14, 28, 22, 34, 16, 24, 12, 30].map((h, i) => '<i style="height:' + h + 'px;animation-delay:' + (i * .08).toFixed(2) + 's"></i>').join("") + "</div>" +
      "</div>" +
      '<div class="stat-row">' +
      '<div class="stat"><b>' + active.length + "</b><span>Active projects</span></div>" +
      '<div class="stat"><b>' + RBS.money(paidSum) + "</b><span>Total paid</span></div>" +
      '<div class="stat"><b>' + RBS.userInvoices(user.id).length + "</b><span>Invoices</span></div>" +
      "</div>" +
      '<div class="row" style="gap:10px;margin-top:4px">' +
      '<a class="btn btn-primary" style="flex:1" href="#/services">Book a service</a>' +
      '<a class="btn btn-ghost" style="flex:1" href="#/chat">Chat with studio</a>' +
      "</div>" +
      '<div class="sec-title">Featured services <a href="#/services">See all →</a></div>' +
      '<div class="svc-list">' + featured.map((s) => svcItem(s)).join("") + "</div>" +
      '<div class="sec-title">Recent payments <a href="#/payments">Tracker →</a></div>' +
      (RBS.userPayments(user.id).slice(0, 3).map((p) => payRow(p)).join("") || '<p class="small muted">No payments yet.</p>') +
      "</div>";
  }
  function bindHome() {
    document.querySelectorAll("[data-svc]").forEach((el) => el.addEventListener("click", () => { location.hash = "#/service/" + el.dataset.svc; }));
  }
  function svcItem(s) {
    const from = Math.min(...s.packages.map((p) => p.price));
    const r = RBS.serviceRating(s.id);
    return '<div class="card card-hover svc-item" data-svc="' + s.id + '">' +
      '<span class="ic">' + catIcon(s.category) + "</span>" +
      '<span class="info"><b>' + esc(s.name) + "</b><span>" + esc(s.delivery) + " • " + starRow(r.count ? r.avg : s.rating) + "</span></span>" +
      '<span class="pr"><b>' + RBS.money(from) + "</b><span>from</span></span></div>";
  }
  function payRow(p) {
    const bk = RBS.bookings().find((b) => b.id === p.bookingId);
    return '<div class="card bkg" style="cursor:default">' +
      '<span class="ic" style="width:42px;height:42px;flex:none;border-radius:12px;display:grid;place-items:center;background:rgba(53,208,186,.09);border:1px solid rgba(53,208,186,.25)">' + I.doc.replace("<svg", '<svg style="width:18px;height:18px;stroke:var(--teal);fill:none;stroke-width:2"') + "</span>" +
      '<span class="info"><b>' + esc(p.ref) + " • " + esc(bk ? bk.serviceName : "Payment") + '</span><span class="small muted">' + timeAgo(p.createdAt) + " • " + esc(methodName(p.method)) + "</span></span>" +
      '<span class="rt"><b>' + RBS.moneyFull(p.amount) + '</b><span class="badge ' + p.status + '">' + STATUS[p.status] + "</span></span></div>";
  }
  const methodName = (id) => (CONFIG.paymentMethods.find((m) => m.id === id) || { name: id }).name;

  /* ================= SERVICES ================= */
  let curCat = "all";
  function vServices() {
    const cats = [{ id: "all", l: "All" }, { id: "training", l: "Training" }, { id: "production", l: "Production" }, { id: "studio", l: "Mix & Master" }];
    const list = CONFIG.services.filter((s) => curCat === "all" || s.category === curCat);
    return '<div class="view">' +
      '<div class="view-head"><div><h1>Services</h1><div class="sub">All prices, delivery times & payment plans</div></div></div>' +
      '<div class="cat-pills">' + cats.map((c) => '<button data-cat="' + c.id + '" class="' + (c.id === curCat ? "on" : "") + '">' + c.l + "</button>").join("") + "</div>" +
      '<div class="svc-list">' + list.map((s) => svcItem(s)).join("") + "</div></div>";
  }
  function bindServices() {
    document.querySelectorAll("[data-cat]").forEach((b) => b.addEventListener("click", () => { curCat = b.dataset.cat; $("#view").innerHTML = vServices(); bindServices(); }));
    bindHome();
  }

  /* ================= SERVICE DETAIL ================= */
  function vService(user, id) {
    const s = CONFIG.services.find((x) => x.id === id);
    if (!s) return '<div class="view"><p>Service not found.</p></div>';
    const r = RBS.serviceRating(id);
    const revs = RBS.serviceReviews(id);
    return '<div class="view">' +
      '<button class="back-btn" onclick="history.back()">' + I.back + " Back</button>" +
      '<div class="card detail-hero">' +
      '<span class="brandtag">' + esc(s.brand) + "</span>" +
      '<h1 style="font-size:23px;font-weight:800;letter-spacing:-.02em;margin:8px 0 6px">' + esc(s.name) + "</h1>" +
      '<div class="row" style="gap:8px;flex-wrap:wrap">' + starRow(r.count ? r.avg : s.rating) +
      '<span class="small muted">' + (r.count ? r.avg.toFixed(1) : s.rating.toFixed(1)) + " • " + (r.count || "verified") + " reviews</span></div>" +
      '<p class="small muted" style="margin-top:10px">' + esc(s.blurb) + "</p>" +
      '<div class="row" style="gap:7px;flex-wrap:wrap;margin-top:14px">' +
      '<span class="chip">' + esc(s.delivery) + "</span>" +
      s.payOptions.map((o) => '<span class="chip">' + PAY_LABEL[o] + "</span>").join("") +
      "</div></div>" +
      '<div class="sec-title">Packages</div>' +
      '<p class="small muted" style="margin:-4px 0 10px">Choose one, add bonuses, then continue to the booking calendar.</p>' +
      '<div class="pk-list" id="pk-list">' + s.packages.map((p, i) =>
        '<div class="pk ' + (i === 0 ? "on" : "") + '" data-pk="' + p.id + '" data-price="' + p.price + '"><span class="rad"></span><span class="nm"><b>' + esc(p.name) + "</b><span>" + esc(p.note) + "</span></span><span class=\"pr\">" + RBS.money(p.price) + "</span></div>").join("") + "</div>" +
      (s.bonuses.length ? '<div class="sec-title">Bonus options</div><div id="bonus-list" style="display:flex;flex-direction:column;gap:9px">' +
        s.bonuses.map((b) => '<div class="bonus-row" data-bonus="' + b.id + '" data-price="' + b.price + '"><span class="cb"></span><span class="nm">' + esc(b.name) + '</span><span class="pr">+' + RBS.money(b.price) + "</span></div>").join("") + "</div>" : "") +
      '<div class="sec-title">Reviews (' + revs.length + ") " +
      (RBS.canReview(user.id, id) ? '<button class="btn btn-ghost btn-sm" id="add-rev">' + (RBS.userReview(user.id, id) ? "Update your review" : "Write review") + "</button>" : '<span class="chip">Reviews open after delivery</span>') + "</div>" +
      '<div id="rev-list" style="display:flex;flex-direction:column;gap:11px">' +
      (revs.length ? revs.map((rv) => '<div class="card" style="padding:16px">' + starRow(rv.rating) + '<p class="small" style="margin:8px 0 10px;color:var(--muted)">“' + esc(rv.text) + '”</p>' +
        (rv.reply ? '<div class="rev-reply"><b>Studio reply:</b> ' + esc(rv.reply.text) + '<span class="small muted"> — ' + timeAgo(rv.reply.ts) + "</span></div>" : "") +
        '<div class="row between"><b class="small">' + esc(rv.name) + '</b><span class="small muted">' + timeAgo(rv.ts) + "</span></div></div>").join("")
        : '<p class="small muted">No reviews yet — be the first.</p>') + "</div>" +
      '<div style="height:14px"></div>' +
      '<button class="btn btn-primary btn-block" id="go-book" style="padding:16px">Continue — <span id="cta-total"></span></button>' +
      "</div>";
  }
  function bindService(id) {
    const s = CONFIG.services.find((x) => x.id === id);
    let pk = s.packages[0].id, bonuses = [];
    const recalc = () => {
      const p = s.packages.find((x) => x.id === pk).price;
      const bt = s.bonuses.filter((b) => bonuses.includes(b.id)).reduce((t, b) => t + b.price, 0);
      $("#cta-total").textContent = RBS.moneyFull(p + bt);
    };
    document.querySelectorAll("#pk-list .pk").forEach((el) => el.addEventListener("click", () => {
      pk = el.dataset.pk;
      document.querySelectorAll("#pk-list .pk").forEach((x) => x.classList.toggle("on", x === el));
      recalc();
    }));
    document.querySelectorAll("#bonus-list .bonus-row").forEach((el) => el.addEventListener("click", () => {
      const b = el.dataset.bonus;
      bonuses = bonuses.includes(b) ? bonuses.filter((x) => x !== b) : bonuses.concat(b);
      el.classList.toggle("on");
      recalc();
    }));
    recalc();
    $("#go-book").addEventListener("click", () => { location.hash = "#/book/" + id + "?pkg=" + pk + (bonuses.length ? "&b=" + bonuses.join(",") : ""); });
    const ar = $("#add-rev");
    if (ar) ar.addEventListener("click", () => reviewModal(id));
  }
  function reviewModal(serviceId) {
    const user = RBS.currentUser();
    const existing = RBS.userReview(user.id, serviceId);
    let rating = existing ? existing.rating : 5;
    const m = openModal('<h3>Write a review</h3><p class="modal-sub">' + esc(CONFIG.services.find((s) => s.id === serviceId).name) + "</p>" +
      '<div class="center" style="margin:8px 0 16px"><span class="stars pick big" id="pick"></span></div>' +
      '<div class="field"><label>Your experience</label><textarea id="rev-text" placeholder="What stood out? Delivery, sound, communication…">' + (existing ? esc(existing.text) : "") + "</textarea></div>" +
      '<button class="btn btn-primary btn-block" id="rev-go">Publish review</button>');
    const draw = () => { m.querySelector("#pick").innerHTML = [1, 2, 3, 4, 5].map((i) => '<svg viewBox="0 0 24 24" data-v="' + i + '" class="' + (i <= rating ? "" : "off") + '"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>').join(""); };
    draw();
    m.querySelector("#pick").addEventListener("click", (e) => { const t = e.target.closest("svg"); if (!t) return; rating = +t.dataset.v; draw(); });
    m.querySelector("#rev-go").addEventListener("click", () => {
      const text = m.querySelector("#rev-text").value.trim();
      if (text.length < 4) { toast("Review too short", "Tell us a little more about your experience.", "warn"); return; }
      RBS.addReview({ serviceId, name: user.name, rating, text });
      closeModal();
      toast("Review published", "Thank you! Your " + rating + "★ review is live.", "ok");
      render();
    });
  }

  /* ================= BOOKING FLOW ================= */
  let calCursor = new Date();
  function vBook(user, id, q) {
    const s = CONFIG.services.find((x) => x.id === id);
    if (!s) return '<div class="view"><p>Service not found.</p></div>';
    const pkgId = q.get("pkg") || s.packages[0].id;
    const pkg = s.packages.find((p) => p.id === pkgId) || s.packages[0];
    const bonusIds = (q.get("b") || "").split(",").filter(Boolean);
    const bonuses = s.bonuses.filter((b) => bonusIds.includes(b.id));
    const gross = pkg.price + bonuses.reduce((t, b) => t + b.price, 0);
    const { net, vat } = vatSplit(gross);

    return '<div class="view">' +
      '<button class="back-btn" onclick="history.back()">' + I.back + " Back to " + esc(s.name) + "</button>" +
      '<div class="view-head"><div><h1>Book & schedule</h1><div class="sub">' + esc(s.name) + " — " + esc(pkg.name) + "</div></div></div>" +
      '<div class="card" style="padding:16px;margin-bottom:14px">' +
      '<div class="row between"><span class="small muted">Package</span><b class="small">' + esc(pkg.name) + " • " + RBS.money(pkg.price) + "</b></div>" +
      bonuses.map((b) => '<div class="row between" style="margin-top:6px"><span class="small muted">Bonus: ' + esc(b.name) + "</span><b class=\"small\">" + RBS.money(b.price) + "</b></div>").join("") +
      '<div class="divider" style="margin:12px 0"></div>' +
      '<div class="row between"><span class="small muted">Subtotal (net)</span><span class="small">' + RBS.moneyFull(net) + "</span></div>" +
      '<div class="row between" style="margin-top:4px"><span class="small muted">VAT (' + B.vatRate + "%)</span><span class=\"small\">" + RBS.moneyFull(vat) + "</span></div>" +
      '<div class="row between" style="margin-top:8px"><b>Total</b><b style="font-size:17px">' + RBS.moneyFull(gross) + "</b></div>" +
      "</div>" +
      '<div class="sec-title">1 • Pick a date</div>' +
      '<div class="cal" id="cal"></div>' +
      '<div class="sec-title">2 • Pick a time</div>' +
      '<div class="slots" id="slots">' + CONFIG.booking.hours.map((t, i) => '<button data-t="' + t + '" class="' + (i === 1 ? "on" : "") + '">' + t + "</button>").join("") + "</div>" +
      '<p class="small muted" style="margin-top:9px">' + esc(CONFIG.booking.note) + " • " + esc(CONFIG.booking.timezone) + " • closed " + [0,1,2,3,4,5,6].filter((d) => !CONFIG.booking.workDays.includes(d)).map((d) => new Date(2026, 0, 4 + d).toLocaleDateString(undefined, { weekday: "long" })).join("/") + "</p>" +
      '<div class="sec-title">3 • Project details</div>' +
      '<div class="field"><label>Notes, references, links <span class="muted">(optional)</span></label><textarea id="notes" placeholder="Reference tracks, stem count, deadlines, goals…"></textarea></div>' +
      '<div class="sec-title">4 • Payment option</div>' +
      '<div id="payopts">' + s.payOptions.map((o, i) => {
        const due = o === "full" ? gross : o === "deposit" ? round2(gross / 2) : round2(gross / 3);
        return '<div class="pay-meth ' + (i === 0 ? "on" : "") + '" data-opt="' + o + '" data-due="' + due + '"><span class="rad"></span><span style="flex:1"><b>' + PAY_LABEL[o] + '</b><span>Due today: ' + RBS.moneyFull(due) + "</span></span></div>";
      }).join("") + "</div>" +
      '<button class="btn btn-primary btn-block" id="confirm-book" style="padding:16px;margin-top:18px">Confirm booking & pay <span id="due-label"></span></button>' +
      '<p class="small muted center" style="margin-top:10px">Demo payment gateway — no real charge is made.</p>' +
      "</div>";
  }
  function bindBook(user, id, q) {
    const s = CONFIG.services.find((x) => x.id === id);
    const pkgId = q.get("pkg") || s.packages[0].id;
    const pkg = s.packages.find((p) => p.id === pkgId) || s.packages[0];
    const bonusIds = (q.get("b") || "").split(",").filter(Boolean);
    const bonuses = s.bonuses.filter((b) => bonusIds.includes(b.id));
    const gross = round2(pkg.price + bonuses.reduce((t, b) => t + b.price, 0));

    let selDate = null, selTime = CONFIG.booking.hours[1] || "10:00", selOpt = s.payOptions[0];
    const dueOf = (o) => (o === "full" ? gross : o === "deposit" ? round2(gross / 2) : round2(gross / 3));
    const syncDue = () => { $("#due-label").textContent = RBS.moneyFull(dueOf(selOpt)); };

    drawCal(); syncDue();

    function drawCal() {
      const y = calCursor.getFullYear(), mo = calCursor.getMonth();
      const first = new Date(y, mo, 1);
      const startDow = (first.getDay() + 6) % 7; // Mon=0
      const days = new Date(y, mo + 1, 0).getDate();
      const today = RBS.dateStr(new Date());
      const mine = RBS.userBookings(user.id).map((b) => b.date);
      let cells = "";
      for (let i = 0; i < startDow; i++) cells += '<span class="day empty"></span>';
      for (let d = 1; d <= days; d++) {
        const ds = y + "-" + String(mo + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
        const dow = new Date(ds + "T12:00:00").getDay();
        const off = ds < today || !CONFIG.booking.workDays.includes(dow);
        cells += '<button class="day ' + (off ? "off" : "") + (ds === today ? " today" : "") + (ds === selDate ? " sel" : "") + '" data-d="' + ds + '">' + d + (mine.includes(ds) ? '<span class="ev"></span>' : "") + "</button>";
      }
      $("#cal").innerHTML =
        '<div class="head"><button class="nav-b" id="cal-p">' + I.chevL + '</button><b>' + first.toLocaleDateString(undefined, { month: "long", year: "numeric" }) + '</b><button class="nav-b" id="cal-n">' + I.chevR + "</button></div>" +
        '<div class="grid7">' + ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => '<span class="dow">' + d + "</span>").join("") + cells + "</div>";
      $("#cal-p").onclick = () => { calCursor = new Date(y, mo - 1, 1); drawCal(); };
      $("#cal-n").onclick = () => { calCursor = new Date(y, mo + 1, 1); drawCal(); };
      $("#cal").querySelectorAll(".day[data-d]").forEach((el) => el.addEventListener("click", () => {
        selDate = el.dataset.d; drawCal();
      }));
    }

    $("#slots").querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
      selTime = b.dataset.t;
      $("#slots").querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
    }));
    $("#payopts").querySelectorAll(".pay-meth").forEach((el) => el.addEventListener("click", () => {
      selOpt = el.dataset.opt;
      $("#payopts").querySelectorAll(".pay-meth").forEach((x) => x.classList.toggle("on", x === el));
      syncDue();
    }));

    $("#confirm-book").addEventListener("click", () => {
      if (!selDate) { toast("Pick a date", "Choose a day on the calendar to continue.", "warn"); return; }
      const booking = RBS.createBooking({
        userId: user.id, serviceId: s.id, serviceName: s.name, packageName: pkg.name,
        bonuses: bonuses.map((b) => ({ name: b.name, price: b.price })),
        date: selDate, time: selTime, notes: $("#notes").value.trim(),
        payOption: selOpt, total: gross, status: "awaiting_payment",
      });
      startCheckout(user, booking, dueOf(selOpt));
    });
  }

  /* ================= CHECKOUT (demo gateway) ================= */
  function startCheckout(user, booking, amountDue, isBalance) {
    let method = "card";
    const m = openModal(
      '<h3>' + (isBalance ? "Pay remaining balance" : "Secure checkout") + "</h3>" +
      '<p class="modal-sub">' + esc(booking.serviceName) + " • " + esc(booking.packageName) + "</p>" +
      '<div class="sum-row"><span>Amount due now</span><b>' + RBS.moneyFull(amountDue) + "</b></div>" +
      '<div class="divider"></div>' +
      '<div id="meth-list">' + CONFIG.paymentMethods.map((pm, i) =>
        '<div class="pay-meth ' + (i === 0 ? "on" : "") + '" data-m="' + pm.id + '"><span class="rad"></span><span><b>' + esc(pm.name) + "</b><span>" + esc(pm.note) + "</span></span></div>").join("") + "</div>" +
      '<div id="card-form">' +
      '<div class="field"><label>Card number</label><input id="cc-num" inputmode="numeric" placeholder="4242 4242 4242 4242" maxlength="19"><div class="err">Enter a 16-digit card number (demo: 4242…)</div></div>' +
      '<div class="row"><div class="field" style="flex:1"><label>Expiry</label><input id="cc-exp" placeholder="MM/YY" maxlength="5"><div class="err">MM/YY</div></div>' +
      '<div class="field" style="flex:1"><label>CVC</label><input id="cc-cvc" inputmode="numeric" placeholder="123" maxlength="4"><div class="err">3–4 digits</div></div></div>' +
      "</div>" +
      '<div id="bank-info" class="hide card" style="padding:14px;margin-bottom:12px"><b class="small">Bank transfer details</b><p class="small muted" style="margin-top:5px">Account: ' + esc(B.bankAccount) + "<br>Reference: your payment ref (shown after confirm). Clears in 1–2 business days.</p></div>" +
      '<button class="btn btn-primary btn-block" id="pay-go" style="padding:15px">Pay ' + RBS.moneyFull(amountDue) + "</button>" +
      '<p class="small muted center" style="margin-top:10px">Demo gateway • encrypted in production • invoice auto-sent on success</p>',
      true);

    const syncMeth = () => {
      m.querySelector("#card-form").classList.toggle("hide", method !== "card");
      m.querySelector("#bank-info").classList.toggle("hide", method !== "bank");
    };
    m.querySelectorAll("[data-m]").forEach((el) => el.addEventListener("click", () => {
      method = el.dataset.m;
      m.querySelectorAll("[data-m]").forEach((x) => x.classList.toggle("on", x === el));
      syncMeth();
    }));
    syncMeth();
    m.querySelector("#cc-num").addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
    });
    m.querySelector("#cc-exp").addEventListener("input", (e) => {
      let v = e.target.value.replace(/\D/g, "").slice(0, 4);
      e.target.value = v.length > 2 ? v.slice(0, 2) + "/" + v.slice(2) : v;
    });

    m.querySelector("#pay-go").addEventListener("click", () => {
      /* validate */
      if (method === "card") {
        const num = m.querySelector("#cc-num").value.replace(/\s/g, "");
        const exp = m.querySelector("#cc-exp").value;
        const cvc = m.querySelector("#cc-cvc").value;
        let ok = true;
        const bad = (sel, cond) => { const f = m.querySelector(sel).closest(".field"); f.classList.toggle("invalid", cond); if (cond) ok = false; };
        bad("#cc-num", !/^\d{16}$/.test(num));
        bad("#cc-exp", !/^(0[1-9]|1[0-2])\/\d{2}$/.test(exp));
        bad("#cc-cvc", !/^\d{3,4}$/.test(cvc));
        if (!ok) return;
      }
      const btn = m.querySelector("#pay-go");
      btn.disabled = true;
      btn.innerHTML = '<span class="spin"></span> Processing…';
      setTimeout(() => finalize(method), 1400);
    });

    function finalize(methodId) {
      const isBank = methodId === "bank";
      const pay = RBS.createPayment({
        userId: user.id, bookingId: booking.id, amount: amountDue, method: methodId,
        status: isBank ? "pending" : "paid", paidAt: isBank ? null : RBS.now(),
      });
      RBS.updateBooking(booking.id, { status: "confirmed", payRef: pay.ref });

      /* invoice: create or top-up */
      let inv = RBS.userInvoices(user.id).find((i) => i.bookingId === booking.id);
      if (!inv) {
        const lines = [{ label: booking.serviceName + " — " + booking.packageName, amount: round2(booking.total - (booking.bonuses || []).reduce((t, b) => t + b.price, 0)) }]
          .concat((booking.bonuses || []).map((b) => ({ label: "Bonus: " + b.name, amount: b.price })));
        const { net, vat } = vatSplit(booking.total);
        inv = RBS.createInvoice({
          userId: user.id, bookingId: booking.id, lines,
          subtotal: net, vat, total: booking.total,
          paid: isBank ? 0 : amountDue, status: (!isBank && amountDue >= booking.total) ? "paid" : "pending",
        });
      } else {
        const list = RBS.invoices();
        const cur = list.find((i) => i.id === inv.id);
        cur.paid = round2(cur.paid + (isBank ? 0 : amountDue));
        if (cur.paid >= cur.total) cur.status = "paid";
        RBS.set("rbs_invoices", list);
        inv = cur;
      }
      RBS.sendInvoice(inv.id); // auto-email client + business copy (simulated)

      RBS.notify(user.id, isBank ? "Booking received — payment pending" : "Payment confirmed ✓",
        (isBank ? "Bank transfer registered for " : RBS.moneyFull(amountDue) + " received for ") + booking.serviceName + ". Invoice " + inv.number + " emailed to you and " + B.businessEmail + ".");

      m.innerHTML =
        '<div class="success-anim">' +
        (isBank
          ? '<div class="ring" style="border-color:var(--warn);background:rgba(255,180,84,.1)"><svg style="stroke:var(--warn)" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg></div><h3>Payment pending</h3><p class="modal-sub">Complete the bank transfer to ' + esc(B.bankAccount) + ". Your slot is reserved; status flips to Paid automatically once cleared.</p>"
          : '<div class="ring"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg></div><h3>Payment confirmed</h3><p class="modal-sub">' + RBS.moneyFull(amountDue) + " via " + esc(methodName(methodId)) + ". Your booking is confirmed and the invoice is on its way.</p>") +
        '<span class="ref">REF ' + esc(pay.ref) + " • INV " + esc(inv.number) + "</span>" +
        '<p class="small muted" style="margin-top:12px">Invoice auto-sent to <b>' + esc(user.email) + "</b><br>Copy sent to <b>" + esc(B.businessEmail) + "</b></p>" +
        '<div class="row" style="gap:10px;margin-top:20px">' +
        '<button class="btn btn-ghost" style="flex:1" id="ck-done">Done</button>' +
        '<button class="btn btn-primary" style="flex:1" id="ck-inv">View invoice</button>' +
        "</div></div>";
      m.querySelector("#ck-done").onclick = () => { closeModal(); location.hash = "#/bookings"; render(); };
      m.querySelector("#ck-inv").onclick = () => { closeModal(); location.hash = "#/invoice/" + inv.id; render(); };
      toast(isBank ? "Booking reserved" : "Payment confirmed", "Invoice " + inv.number + " sent to " + user.email + " + " + B.businessEmail, isBank ? "warn" : "ok");
    }
  }

  /* ================= BOOKINGS LIST ================= */
  function vBookings(user) {
    const bs = RBS.userBookings(user.id);
    return '<div class="view">' +
      '<div class="view-head"><div><h1>Bookings</h1><div class="sub">Sessions, projects & status</div></div>' +
      '<a class="btn btn-ghost btn-sm" href="#/calendar">Calendar</a></div>' +
      '<div class="svc-list">' + (bs.length ? bs.map((b) => {
        const d = new Date(b.date + "T12:00:00");
        return '<div class="card bkg" data-b="' + b.id + '">' +
          '<span class="datebox"><b>' + d.getDate() + "</b><span>" + d.toLocaleDateString(undefined, { month: "short" }) + "</span></span>" +
          '<span class="info"><b>' + esc(b.serviceName) + "</b><span>" + esc(b.packageName) + " • " + b.time + " • " + RBS.prettyDate(b.date) + "</span></span>" +
          '<span class="rt"><b>' + RBS.money(b.total) + '</b><span class="badge ' + b.status + '">' + STATUS[b.status] + "</span></span></div>";
      }).join("") : '<div class="card center" style="padding:34px"><p class="muted">No bookings yet.</p><a class="btn btn-primary" style="margin-top:14px" href="#/services">Browse services</a></div>') +
      "</div>" +
      '<div class="sec-title">Money <a href="#/payments">Payment tracker →</a></div>' +
      '<div class="row" style="gap:10px"><a class="btn btn-ghost" style="flex:1" href="#/payments">Payments & invoices</a></div>' +
      "</div>";
  }
  function bindBookings(user) {
    document.querySelectorAll("[data-b]").forEach((el) => el.addEventListener("click", () => bookingModal(user, el.dataset.b)));
  }
  function bookingModal(user, id) {
    const b = RBS.bookings().find((x) => x.id === id);
    const inv = RBS.userInvoices(user.id).find((i) => i.bookingId === id);
    const pay = RBS.userPayments(user.id).find((p) => p.bookingId === id);
    openModal(
      '<h3>' + esc(b.serviceName) + "</h3>" +
      '<p class="modal-sub">' + esc(b.packageName) + " • " + RBS.prettyDate(b.date) + " at " + b.time + "</p>" +
      '<div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:14px"><span class="badge ' + b.status + '">' + STATUS[b.status] + "</span>" +
      (pay ? '<span class="badge ' + pay.status + '">Payment: ' + STATUS[pay.status] + "</span>" : "") + "</div>" +
      (b.notes ? '<p class="small muted" style="margin-bottom:12px">“' + esc(b.notes) + '”</p>' : "") +
      '<div class="sum-row"><span>Total</span><b>' + RBS.moneyFull(b.total) + "</b></div>" +
      (pay ? '<div class="sum-row"><span>Paid (' + esc(methodName(pay.method)) + ")</span><b>" + RBS.moneyFull(pay.amount) + "</b></div>" : "") +
      (inv ? '<div class="sum-row"><span>Balance</span><b>' + RBS.moneyFull(Math.max(0, inv.total - inv.paid)) + "</b></div>" : "") +
      '<div class="divider"></div>' +
      '<div style="display:flex;flex-direction:column;gap:9px">' +
      (b.status === "awaiting_payment" ? '<button class="btn btn-primary btn-block" id="bm-pay">Pay now</button>' : "") +
      (inv && inv.total - inv.paid > 0.005 && b.status !== "awaiting_payment" ? '<button class="btn btn-primary btn-block" id="bm-bal">Pay balance ' + RBS.moneyFull(inv.total - inv.paid) + "</button>" : "") +
      (inv ? '<button class="btn btn-ghost btn-block" id="bm-inv">View invoice ' + esc(inv.number) + "</button>" : "") +
      '<a class="btn btn-ghost btn-block" href="#/chat" onclick="document.getElementById(\'modal-root\').innerHTML=\'\'">Message the studio</a>' +
      (["confirmed", "awaiting_payment"].includes(b.status) ? '<button class="btn btn-danger btn-block" id="bm-cancel">Cancel booking</button>' : "") +
      "</div>");
    const mp = $("#modal-root");
    if (mp.querySelector("#bm-pay")) mp.querySelector("#bm-pay").onclick = () => { closeModal(); startCheckout(user, b, b.total); };
    if (mp.querySelector("#bm-bal")) mp.querySelector("#bm-bal").onclick = () => {
      const balance = round2(inv.total - inv.paid); closeModal(); startCheckout(user, b, balance, true);
    };
    if (mp.querySelector("#bm-inv")) mp.querySelector("#bm-inv").onclick = () => { closeModal(); location.hash = "#/invoice/" + inv.id; };
    if (mp.querySelector("#bm-cancel")) mp.querySelector("#bm-cancel").onclick = () => {
      RBS.updateBooking(id, { status: "cancelled" });
      RBS.notify(user.id, "Booking cancelled", b.serviceName + " on " + RBS.prettyDate(b.date) + " was cancelled.");
      closeModal(); toast("Booking cancelled", "Any paid amount will be refunded per policy.", "warn"); render();
    };
  }

  /* ================= CALENDAR ================= */
  function vCalendar(user) {
    return '<div class="view">' +
      '<button class="back-btn" onclick="history.back()">' + I.back + " Back</button>" +
      '<div class="view-head"><div><h1>Booking calendar</h1><div class="sub">Your sessions at a glance</div></div></div>' +
      '<div class="cal" id="cal"></div>' +
      '<div class="sec-title" id="day-title">Select a day</div>' +
      '<div class="svc-list" id="day-list"></div></div>';
  }
  function bindCalendar(user) {
    let sel = null;
    const draw = () => {
      const y = calCursor.getFullYear(), mo = calCursor.getMonth();
      const first = new Date(y, mo, 1);
      const startDow = (first.getDay() + 6) % 7;
      const days = new Date(y, mo + 1, 0).getDate();
      const today = RBS.dateStr(new Date());
      const mine = RBS.userBookings(user.id).map((b) => b.date);
      let cells = "";
      for (let i = 0; i < startDow; i++) cells += '<span class="day empty"></span>';
      for (let d = 1; d <= days; d++) {
        const ds = y + "-" + String(mo + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
        cells += '<button class="day ' + (ds === today ? " today" : "") + (ds === sel ? " sel" : "") + '" data-d="' + ds + '">' + d + (mine.includes(ds) ? '<span class="ev"></span>' : "") + "</button>";
      }
      $("#cal").innerHTML =
        '<div class="head"><button class="nav-b" id="cal-p">' + I.chevL + '</button><b>' + first.toLocaleDateString(undefined, { month: "long", year: "numeric" }) + '</b><button class="nav-b" id="cal-n">' + I.chevR + "</button></div>" +
        '<div class="grid7">' + ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => '<span class="dow">' + d + "</span>").join("") + cells + "</div>";
      $("#cal-p").onclick = () => { calCursor = new Date(y, mo - 1, 1); draw(); };
      $("#cal-n").onclick = () => { calCursor = new Date(y, mo + 1, 1); draw(); };
      $("#cal").querySelectorAll(".day[data-d]").forEach((el) => el.addEventListener("click", () => { sel = el.dataset.d; draw(); showDay(); }));
    };
    const showDay = () => {
      const list = RBS.userBookings(user.id).filter((b) => b.date === sel);
      $("#day-title").textContent = RBS.prettyDate(sel) + " — " + (list.length ? list.length + " booking(s)" : "free day");
      $("#day-list").innerHTML = list.length ? list.map((b) =>
        '<div class="card bkg" data-b="' + b.id + '"><span class="datebox" style="width:46px"><b style="font-size:13px">' + b.time + "</b><span>slot</span></span>" +
        '<span class="info"><b>' + esc(b.serviceName) + "</b><span>" + esc(b.packageName) + "</span></span>" +
        '<span class="badge ' + b.status + '">' + STATUS[b.status] + "</span></div>").join("")
        : '<p class="small muted">Nothing booked this day. <a href="#/services">Book something →</a></p>';
      bindBookings(user);
    };
    draw();
  }

  /* ================= PAYMENTS TRACKER ================= */
  function vPayments(user) {
    const ps = RBS.userPayments(user.id);
    const paid = ps.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
    const pend = ps.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);
    const invs = RBS.userInvoices(user.id);
    return '<div class="view">' +
      '<button class="back-btn" onclick="history.back()">' + I.back + " Back</button>" +
      '<div class="view-head"><div><h1>Payment tracker</h1><div class="sub">Every euro, accounted for</div></div></div>' +
      '<div class="stat-row">' +
      '<div class="stat"><b>' + RBS.money(paid) + "</b><span>Paid</span></div>" +
      '<div class="stat"><b>' + RBS.money(pend) + "</b><span>Pending</span></div>" +
      '<div class="stat"><b>' + invs.length + "</b><span>Invoices</span></div></div>" +
      '<div class="sec-title">Transactions</div>' +
      '<div class="svc-list">' + (ps.length ? ps.map((p) => payRow(p) +
        '<div style="height:0"></div>').join("") : '<p class="small muted">No transactions yet.</p>') + "</div>" +
      '<div class="sec-title">Invoices</div>' +
      '<div class="svc-list">' + (invs.length ? invs.map((i) =>
        '<div class="card bkg" data-inv="' + i.id + '"><span class="ic" style="width:42px;height:42px;flex:none;border-radius:12px;display:grid;place-items:center;background:rgba(90,200,250,.09);border:1px solid rgba(90,200,250,.25)">' + I.doc.replace("<svg", '<svg style="width:18px;height:18px;stroke:var(--ice);fill:none;stroke-width:2"') + "</span>" +
        '<span class="info"><b>' + esc(i.number) + '</b><span class="small muted">Issued ' + timeAgo(i.createdAt) + " • sent " + (i.sentAt ? timeAgo(i.sentAt) : "—") + "</span></span>" +
        '<span class="rt"><b>' + RBS.money(i.total) + '</b><span class="badge ' + i.status + '">' + STATUS[i.status] + "</span></span></div>").join("")
        : '<p class="small muted">No invoices yet.</p>') + "</div></div>";
  }
  function bindPayments(user) {
    document.querySelectorAll("[data-inv]").forEach((el) => el.addEventListener("click", () => { location.hash = "#/invoice/" + el.dataset.inv; }));
  }

  /* ================= INVOICE ================= */
  function vInvoice(id) {
    const inv = RBS.getInvoice(id);
    if (!inv) return '<div class="view"><p>Invoice not found.</p></div>';
    const user = RBS.users().find((u) => u.id === inv.userId) || {};
    const balance = round2(inv.total - inv.paid);
    return '<div class="view" style="max-width:760px">' +
      '<div class="no-print"><button class="back-btn" onclick="history.back()">' + I.back + " Back</button>" +
      '<div class="row between" style="margin-bottom:14px"><div><h1 style="font-size:22px;font-weight:800">Invoice</h1><div class="sub small muted">' + esc(inv.number) + "</div></div>" +
      '<button class="btn btn-ghost btn-sm" id="inv-print">' + I.dl.replace("<svg", '<svg style="width:15px;height:15px;stroke:currentColor;fill:none;stroke-width:2"') + " Download / Print</button></div></div>" +
      '<div class="invoice" id="invoice-print">' +
      '<div class="top"><div>' +
      '<div style="display:flex;align-items:center;gap:10px"><img src="assets/icon-192.png" style="width:40px;height:40px;border-radius:10px" alt="">' +
      '<div><b style="font-size:16px">' + esc(B.techCompany) + "</b><br><span style='font-size:11.5px;color:#5d6c7d'>" + esc(B.techCompanyTag) + "</span></div></div>" +
      '<div style="margin-top:12px;font-size:12.5px;color:#5d6c7d">' + esc(B.address) + "<br>" + esc(B.businessEmail) + "<br>VAT " + esc(B.vatNumber) + "</div>" +
      "</div>" +
      '<div style="text-align:right"><h2 style="font-size:26px;letter-spacing:-.02em">INVOICE</h2>' +
      '<div style="font-size:13px;color:#5d6c7d;margin-top:4px">' + esc(inv.number) + "<br>Issued " + new Date(inv.createdAt).toLocaleDateString() + "</div>" +
      '<div class="stamp ' + (inv.status === "paid" ? "paid" : "pending") + '" style="margin-top:10px;display:inline-block">' + (inv.status === "paid" ? "Paid" : "Balance due") + "</div></div></div>" +
      '<div style="margin-top:22px;display:grid;grid-template-columns:1fr 1fr;gap:18px;font-size:13px">' +
      '<div><b>Billed to</b><br>' + esc(user.name || "Client") + "<br>" + esc(user.email || "") + "<br>" + esc(user.phone || "") + "</div>" +
      '<div><b>Payment</b><br>Method: ' + esc(methodName((RBS.userPayments(inv.userId).find((p) => p.bookingId === inv.bookingId) || {}).method || "card")) + "<br>Terms: due on receipt<br>Account: " + esc(B.bankAccount) + "</div></div>" +
      "<table><thead><tr><th>Description</th><th class='r'>Amount</th></tr></thead><tbody>" +
      inv.lines.map((l) => "<tr><td>" + esc(l.label) + "</td><td class='r'>" + RBS.moneyFull(l.amount) + "</td></tr>").join("") +
      "</tbody></table>" +
      '<div class="totals">' +
      "<div><span>Subtotal (net)</span><span>" + RBS.moneyFull(inv.subtotal) + "</span></div>" +
      "<div><span>VAT (" + B.vatRate + "%)</span><span>" + RBS.moneyFull(inv.vat) + "</span></div>" +
      "<div class='grand'><span>Total</span><span>" + RBS.moneyFull(inv.total) + "</span></div>" +
      "<div><span>Paid</span><span>" + RBS.moneyFull(inv.paid) + "</span></div>" +
      "<div><span>Balance due</span><span>" + RBS.moneyFull(balance) + "</span></div>" +
      "</div>" +
      '<div class="sentlog">Auto-sent ' + (inv.sentAt ? new Date(inv.sentAt).toLocaleString() : "—") + " → <b>" + esc((inv.sentTo || [])[0] || user.email || "") + "</b> (client) • copy to <b>" + esc((inv.sentTo || [])[1] || B.businessEmail) + "</b> (business confirmation)</div>" +
      '<p style="margin-top:16px;font-size:11.5px;color:#5d6c7d">Thank you for your business. ' + esc(B.footerLine) + " • " + esc(B.academy) + " × " + esc(B.productionCo) + "</p>" +
      "</div>" +
      (balance > 0.005 ? '<div class="no-print" style="margin-top:14px"><button class="btn btn-primary btn-block" id="inv-pay">Pay balance ' + RBS.moneyFull(balance) + "</button></div>" : "") +
      "</div>";
  }
  function bindInvoice(id, user) {
    const p = $("#inv-print");
    if (p) p.addEventListener("click", () => window.print());
    const pb = $("#inv-pay");
    if (pb) pb.addEventListener("click", () => {
      const inv = RBS.getInvoice(id);
      const b = RBS.bookings().find((x) => x.id === inv.bookingId);
      startCheckout(user, b, round2(inv.total - inv.paid), true);
    });
  }

  /* ================= CHAT ================= */
  function vChat(user) {
    const msgs = RBS.thread(user.id);
    return '<div class="view" style="padding-bottom:12px">' +
      '<div class="chat-wrap">' +
      '<div class="chat-head"><span class="av">R</span><div style="flex:1"><b style="font-size:14.5px">RocAudio Studio</b><div class="st"><i></i>Online • replies in minutes</div></div>' +
      '<span class="chip">Direct chat</span></div>' +
      '<div class="chat-body" id="chat-body">' + msgs.map((m) => msgBubble(m)).join("") + "</div>" +
      '<div class="chat-input"><input id="chat-in" placeholder="Message the studio…" autocomplete="off"><button id="chat-send">' + I.send + "</button></div>" +
      "</div></div>";
  }
  const msgBubble = (m) => '<div class="msg ' + (m.from === "me" ? "out" : "in") + '">' +
    (m.from !== "me" ? '<span class="sender">' + (m.from === "assistant" ? "Studio Assistant • auto" : "Roc • studio") + "</span>" : "") +
    esc(m.text) + '<span class="tm">' + new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + "</span></div>";
  function bindChat(user) {
    const body = $("#chat-body");
    body.scrollTop = body.scrollHeight;
    RBS.set("rbs_chatread_" + user.id, RBS.now());
    const send = () => {
      const inp = $("#chat-in");
      const text = inp.value.trim();
      if (!text) return;
      inp.value = "";
      const msg = RBS.sendMessage(user.id, "me", text);
      body.insertAdjacentHTML("beforeend", msgBubble(msg));
      body.scrollTop = body.scrollHeight;
      body.insertAdjacentHTML("beforeend", '<div class="typing" id="typing"><i></i><i></i><i></i></div>');
      body.scrollTop = body.scrollHeight;
      if (!RBS.getAssistant()) { setTimeout(() => { const t = $("#typing"); if (t) t.remove(); }, 700); return; }
      setTimeout(() => {
        const t = $("#typing"); if (t) t.remove();
        const rep = RBS.sendMessage(user.id, "assistant", RBS.autoReply(text));
        body.insertAdjacentHTML("beforeend", msgBubble(rep));
        body.scrollTop = body.scrollHeight;
        RBS.notify(user.id, "New message from the studio", rep.text.slice(0, 80), "#/chat");
        updateBell(user);
      }, 1100);
    };
    $("#chat-send").addEventListener("click", send);
    $("#chat-in").addEventListener("keydown", (e) => { if (e.key === "Enter") send(); });
    document.querySelectorAll(".qchip").forEach((c) => c.addEventListener("click", () => { $("#chat-in").value = c.dataset.q; send(); }));
  }

  /* ================= PROFILE ================= */
  function vProfile(user) {
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    return '<div class="view">' +
      '<div class="view-head"><div><h1>Profile</h1><div class="sub">Your client account</div></div></div>' +
      '<div class="card" style="padding:20px"><div class="prof-head"><span class="av">' + esc(user.name.charAt(0).toUpperCase()) + "</span>" +
      '<div><b style="font-size:17px">' + esc(user.name) + '</b><br><span class="small muted">' + esc(user.email) + (user.phone ? " • " + esc(user.phone) : "") + "</span></div>" +
      '<button class="btn btn-ghost btn-sm" id="edit-prof" style="margin-left:auto">Edit</button></div></div>' +
      '<div class="card" style="padding:8px 20px;margin-top:14px">' +
      '<div class="setting-row"><div><b>Push notifications</b><span>Booking & payment alerts on this device</span></div><span class="switch ' + (typeof Notification !== "undefined" && Notification.permission === "granted" ? "on" : "") + '" id="sw-notif"></span></div>' +
      '<div class="setting-row"><div><b>Install on this device</b><span>' + (standalone ? "Installed ✓ running as app" : "Add to home screen for the full app") + '</span></div><button class="btn btn-ghost btn-sm" id="pf-install">' + (standalone ? "Done" : "Install") + "</button></div>" +
      '<div class="setting-row"><div><b>Business contact</b><span>' + esc(B.businessEmail) + " • " + esc(B.phone) + '</span></div><a class="btn btn-ghost btn-sm" href="mailto:' + esc(B.businessEmail) + '">Email</a></div>' +
      '<div class="setting-row"><div><b>Legal</b><span>Terms of service & privacy (GDPR)</span></div><a class="btn btn-ghost btn-sm" href="legal.html">View</a></div>' +
      "</div>" +
      '<div class="card" style="padding:8px 20px;margin-top:14px">' +
      '<div class="setting-row"><div><b>' + esc(B.appName) + "</b><span>Version 1.0.0 • " + esc(B.techCompany) + "</span></div><span class=\"chip\">PWA</span></div>" +
      '<div class="setting-row"><div><b>Log out</b><span>Ends this session on this device</span></div><button class="btn btn-ghost btn-sm" id="pf-out">Log out</button></div>' +
      '<div class="setting-row"><div><b style="color:var(--danger)">Delete account</b><span>Removes your data from this device</span></div><button class="btn btn-danger btn-sm" id="pf-del">Delete</button></div>' +
      "</div>" +
      '<p class="small muted center" style="margin:20px 0 8px">' + esc(B.footerLine) + "</p></div>";
  }
  function bindProfile(user) {
    $("#edit-prof").addEventListener("click", () => {
      const m = openModal('<h3>Edit profile</h3><p class="modal-sub">Client data stays on this device (demo).</p>' +
        '<div class="field"><label>Full name</label><input id="ep-name" value="' + esc(user.name) + '"></div>' +
        '<div class="field"><label>Phone</label><input id="ep-phone" value="' + esc(user.phone || "") + '"></div>' +
        '<div class="field"><label>New password <span class="muted">(optional)</span></label><input id="ep-pass" type="password" placeholder="Leave blank to keep"></div>' +
        '<button class="btn btn-primary btn-block" id="ep-go">Save changes</button>');
      m.querySelector("#ep-go").onclick = () => {
        const patch = { name: m.querySelector("#ep-name").value.trim() || user.name, phone: m.querySelector("#ep-phone").value.trim() };
        const np = m.querySelector("#ep-pass").value;
        if (np) patch.password = np;
        RBS.updateUser(user.id, patch);
        closeModal(); toast("Profile updated", "Your details were saved.", "ok"); render();
      };
    });
    $("#sw-notif").addEventListener("click", async (e) => {
      if (typeof Notification === "undefined") { toast("Not supported", "This browser doesn't support notifications.", "warn"); return; }
      if (Notification.permission === "granted") { toast("Already on", "Notifications are enabled on this device.", "ok"); return; }
      const res = await Notification.requestPermission();
      e.target.classList.toggle("on", res === "granted");
      toast(res === "granted" ? "Notifications on" : "Notifications off", res === "granted" ? "You'll get booking & payment alerts." : "You can enable them anytime.", res === "granted" ? "ok" : "warn");
    });
    $("#pf-install").addEventListener("click", () => triggerInstall());
    $("#pf-out").addEventListener("click", () => { RBS.logout(); location.hash = "#/login"; render(); });
    $("#pf-del").addEventListener("click", () => {
      openModal('<h3>Delete account?</h3><p class="modal-sub">This removes your profile, bookings, payments, invoices and chats from this device. Invoices already emailed remain valid.</p>' +
        '<div class="row" style="gap:10px"><button class="btn btn-ghost" style="flex:1" id="del-no">Keep account</button><button class="btn btn-danger" style="flex:1" id="del-yes">Delete everything</button></div>');
      $("#del-no").onclick = closeModal;
      $("#del-yes").onclick = () => {
        const id = user.id;
        ["rbs_users", "rbs_bookings", "rbs_payments", "rbs_invoices", "rbs_chat", "rbs_notifs"].forEach((k) => {
          const list = RBS.get(k, []);
          if (Array.isArray(list)) RBS.set(k, list.filter((x) => x.userId !== id && x.id !== id));
        });
        RBS.logout(); closeModal(); location.hash = "#/login"; render();
        toast("Account deleted", "All local data removed. Sorry to see you go.", "warn");
      };
    });
  }


  /* ================= STUDIO CONSOLE (producer side) ================= */
  let studioThread = null;
  function vStudio() {
    const bs = RBS.bookings();
    const active = bs.filter((b) => ["confirmed", "in_progress"].includes(b.status));
    const waiting = bs.filter((b) => b.status === "awaiting_payment");
    const pendingSum = RBS.payments().filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);
    const rs = RBS.reviews();
    const avg = rs.length ? rs.reduce((s, r) => s + r.rating, 0) / rs.length : 0;
    const today = RBS.dateStr(new Date());
    const todays = bs.filter((b) => b.date === today);
    const threads = Object.values(RBS.chatAll()).filter((a) => a.length && a[a.length - 1].from === "me").length;
    return '<div class="view">' +
      '<div class="view-head"><div><h1>Console</h1><div class="sub">Admin • ' + esc(B.productionCo) + '</div></div>' +
      '<button class="btn btn-ghost btn-sm" id="st-exit">Exit studio</button></div>' +
      '<div class="hero-card"><span class="chip">' + (RBS.getAssistant() ? "Assistant: ON — answers when you're busy" : "Assistant: OFF — you reply personally") + "</span>" +
      '<h1 style="font-size:22px;font-weight:850;letter-spacing:-.02em;margin-top:10px">Good day, Roc</h1>' +
      '<p class="small muted" style="margin-top:4px">' + (threads ? threads + " client thread(s) waiting on you." : "Inbox zero. Clean like a fresh session.") + "</p></div>" +
      '<div class="stat-row"><div class="stat"><b>' + active.length + "</b><span>Active jobs</span></div>" +
      '<div class="stat"><b>' + waiting.length + "</b><span>Awaiting pay</span></div>" +
      '<div class="stat"><b>' + RBS.money(pendingSum) + "</b><span>Pending bank</span></div></div>" +
      '<div class="stat-row"><div class="stat"><b>' + avg.toFixed(1) + "★</b><span>Avg rating</span></div>" +
      '<div class="stat"><b>' + rs.length + "</b><span>Reviews</span></div>" +
      '<div class="stat"><b>' + todays.length + "</b><span>Today</span></div></div>" +
      '<div class="sec-title">Today’s schedule</div>' +
      (todays.length ? '<div class="svc-list">' + todays.map((b) => bkgRowStudio(b)).join("") + "</div>" : '<p class="small muted">No sessions today.</p>') +
      '<div class="sec-title">Needs your attention</div>' +
      '<div class="row" style="gap:10px;flex-wrap:wrap">' +
      '<a class="btn btn-ghost" style="flex:1" href="#/studio-book">Booking queue' + (waiting.length ? " (" + waiting.length + ")" : "") + "</a>" +
      '<a class="btn btn-ghost" style="flex:1" href="#/studio-chats">Chat inbox' + (threads ? " (" + threads + ")" : "") + "</a>" +
      '<a class="btn btn-ghost" style="flex:1" href="#/studio-pay">Payments</a></div>' +
      '<div class="card" style="padding:8px 20px;margin-top:16px"><div class="setting-row">' +
      '<div><b>Console PIN</b><span>Admin-only • never displayed in the app • 5-try lockout</span></div>' +
      '<button class="btn btn-ghost btn-sm" id="st-pin">Change PIN</button></div></div></div>';
  }
  function bindStudio() {
    $("#st-exit").addEventListener("click", () => { RBS.logout(); location.hash = "#/login"; render(); });
    $("#st-pin").addEventListener("click", () => {
      const m = openModal('<h3>Change Console PIN</h3><p class="modal-sub">Admin credential. Stored hashed on this device only.</p>' +
        '<div class="field"><label>Current PIN</label><input id="np-cur" type="password" inputmode="numeric" autocomplete="off"></div>' +
        '<div class="field"><label>New PIN (4-8 digits)</label><input id="np-new" type="password" inputmode="numeric" autocomplete="off"></div>' +
        '<div class="field"><label>Confirm new PIN</label><input id="np-conf" type="password" inputmode="numeric" autocomplete="off"></div>' +
        '<button class="btn btn-primary btn-block" id="np-go">Update PIN</button>');
      m.querySelector("#np-go").onclick = () => {
        const nw = m.querySelector("#np-new").value, cf = m.querySelector("#np-conf").value;
        if (nw !== cf) { toast("Mismatch", "New PIN and confirmation differ.", "err"); return; }
        const res = RBS.changeStudioPin(m.querySelector("#np-cur").value, nw);
        if (res.error) { toast("Not changed", res.error, "err"); return; }
        closeModal(); toast("PIN updated", "Use your new PIN next time you open the Console.", "ok");
      };
    });
    bindStudioBookActions();
  }
  function bkgRowStudio(b, extra) {
    const d = new Date(b.date + "T12:00:00");
    const client = RBS.users().find((u) => u.id === b.userId);
    return '<div class="card bkg" style="cursor:default;flex-wrap:wrap">' +
      '<span class="datebox"><b>' + d.getDate() + "</b><span>" + d.toLocaleDateString(undefined, { month: "short" }) + "</span></span>" +
      '<span class="info"><b>' + esc(b.serviceName) + "</b><span>" + esc(client ? client.name : "Client") + " • " + esc(b.packageName) + " • " + b.time + "</span></span>" +
      '<span class="rt"><b>' + RBS.money(b.total) + '</b><span class="badge ' + b.status + '">' + STATUS[b.status] + "</span></span>" +
      (extra || "") + "</div>";
  }

  /* ---- queue ---- */
  function vStudioBook() {
    const bs = RBS.bookings().sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    const groups = [["awaiting_payment", "Awaiting payment"], ["confirmed", "Confirmed — schedule"], ["in_progress", "In progress"], ["delivered", "Delivered"], ["cancelled", "Cancelled"]];
    return '<div class="view">' +
      '<div class="view-head"><div><h1>Booking queue</h1><div class="sub">Move jobs through the pipeline — clients get notified + a chat update automatically</div></div></div>' +
      groups.map((g) => {
        const list = bs.filter((b) => b.status === g[0]);
        if (!list.length) return "";
        return '<div class="sec-title">' + g[1] + " (" + list.length + ')</div><div class="svc-list">' + list.map((b) => {
          const acts =
            (b.status === "awaiting_payment" ? '<button class="btn btn-primary btn-sm" data-act="paid" data-id="' + b.id + '">Mark paid & confirm</button>' : "") +
            (b.status === "confirmed" ? '<button class="btn btn-primary btn-sm" data-act="start" data-id="' + b.id + '">Start work</button>' : "") +
            (b.status === "in_progress" ? '<button class="btn btn-primary btn-sm" data-act="deliver" data-id="' + b.id + '">Deliver</button>' : "") +
            (["confirmed", "awaiting_payment"].includes(b.status) ? '<button class="btn btn-danger btn-sm" data-act="cancel" data-id="' + b.id + '">Cancel</button>' : "");
          return bkgRowStudio(b, acts ? '<div class="row" style="gap:7px;margin-top:10px;width:100%">' + acts + "</div>" : "");
        }).join("") + "</div>";
      }).join("") + "</div>";
  }
  function bindStudioBook() { bindStudioBookActions(); }
  function bindStudioBookActions() {
    document.querySelectorAll("[data-act]").forEach((btn) => btn.addEventListener("click", () => {
      const id = btn.dataset.id, act = btn.dataset.act;
      const b = RBS.bookings().find((x) => x.id === id);
      if (act === "paid") {
        const pend = RBS.payments().find((p) => p.bookingId === id && p.status === "pending");
        if (pend) RBS.markPaymentPaid(pend.id);
        RBS.setBookingStatus(id, "confirmed");
        toast("Booking confirmed", (b ? b.serviceName : "") + " — client notified + invoice updated.", "ok");
      }
      if (act === "start") { RBS.setBookingStatus(id, "in_progress"); toast("Work started", "Client sees “In progress” and got a chat update.", "ok"); }
      if (act === "deliver") { RBS.setBookingStatus(id, "delivered"); toast("Delivered", "Client notified — they can now leave a review.", "ok"); }
      if (act === "cancel") { RBS.setBookingStatus(id, "cancelled"); toast("Booking cancelled", "Client notified per refund policy.", "warn"); }
      render();
    }));
  }

  function studioBubble(m) {
    const mine = m.from === "studio" || m.from === "assistant" || m.from === "out-studio";
    return '<div class="msg ' + (mine ? "out" : "in") + '">' +
      (mine && m.from === "assistant" ? '<span class="sender">Assistant • auto</span>' : "") +
      (!mine ? '<span class="sender">Client</span>' : "") +
      esc(m.text) + '<span class="tm">' + new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + "</span></div>";
  }

  /* ---- chat inbox ---- */
  function vStudioChats() {
    const all = RBS.chatAll();
    if (studioThread) {
      const client = RBS.users().find((u) => u.id === studioThread);
      const msgs = RBS.thread(studioThread);
      return '<div class="view" style="padding-bottom:12px"><div class="chat-wrap">' +
        '<div class="chat-head"><button class="back-btn" style="margin:0" id="th-back">' + I.back + '</button><span class="av">' + esc((client ? client.name : "C").charAt(0)) + '</span>' +
        '<div style="flex:1"><b style="font-size:14.5px">' + esc(client ? client.name : "Client") + '</b><div class="st"><i></i>you reply as the studio</div></div>' +
        '<span class="switch ' + (RBS.getAssistant() ? "on" : "") + '" id="th-asst" title="Studio assistant auto-replies"></span></div>' +
        '<div class="chat-body" id="chat-body">' + msgs.map(studioBubble).join("") + "</div>" +
        '<div class="chat-input"><input id="chat-in" placeholder="Reply as RocAudio studio…" autocomplete="off"><button id="chat-send">' + I.send + "</button></div>" +
        "</div></div>";
    }
    const entries = Object.entries(all).filter(([, a]) => a.length);
    return '<div class="view">' +
      '<div class="view-head"><div><h1>Chat inbox</h1><div class="sub">Every client thread • reply from your phone</div></div>' +
      '<span class="chip">' + (RBS.getAssistant() ? "assistant ON" : "assistant OFF") + "</span></div>" +
      '<div class="svc-list">' + (entries.length ? entries.map(([uid, arr]) => {
        const u = RBS.users().find((x) => x.id === uid);
        const last = arr[arr.length - 1];
        return '<div class="card bkg" data-th="' + uid + '"><span class="datebox" style="width:42px"><b style="font-size:15px">' + esc((u ? u.name : "C").charAt(0)) + '</b><span>client</span></span>' +
          '<span class="info"><b>' + esc(u ? u.name : "Client") + '</b><span>' + (last.from === "me" ? '<b style="color:var(--warn)">new</b> ' : "") + esc(last.text.slice(0, 44)) + "…</span></span>" +
          '<span class="small muted">' + timeAgo(last.ts) + "</span></div>";
      }).join("") : '<p class="small muted">No conversations yet.</p>') + "</div></div>";
  }
  function bindStudioChats() {
    const back = $("#th-back");
    if (back) back.addEventListener("click", () => { studioThread = null; render(); });
    const asst = $("#th-asst");
    if (asst) asst.addEventListener("click", () => { RBS.setAssistant(!RBS.getAssistant()); toast("Assistant " + (RBS.getAssistant() ? "ON" : "OFF"), RBS.getAssistant() ? "It answers instantly when you're busy." : "Clients wait for your personal reply.", "ok"); render(); });
    document.querySelectorAll("[data-th]").forEach((el) => el.addEventListener("click", () => { studioThread = el.dataset.th; render(); }));
    const sendBtn = $("#chat-send");
    if (sendBtn) {
      const body = $("#chat-body");
      body.scrollTop = body.scrollHeight;
      const send = () => {
        const inp = $("#chat-in"); const text = inp.value.trim(); if (!text) return;
        inp.value = "";
        const msg = RBS.sendMessage(studioThread, "studio", text);
        body.insertAdjacentHTML("beforeend", studioBubble(msg));
        body.scrollTop = body.scrollHeight;
        RBS.notify(studioThread, "New message from the studio", text.slice(0, 80), "#/chat");
      };
      sendBtn.addEventListener("click", send);
      $("#chat-in").addEventListener("keydown", (e) => { if (e.key === "Enter") send(); });
    }
  }

  /* ---- payments ---- */
  function vStudioPay() {
    const ps = RBS.payments().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const paid = ps.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
    const pend = ps.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);
    return '<div class="view">' +
      '<div class="view-head"><div><h1>Payments</h1><div class="sub">Approve bank transfers • track everything</div></div></div>' +
      '<div class="stat-row"><div class="stat"><b>' + RBS.money(paid) + "</b><span>Received</span></div>" +
      '<div class="stat"><b>' + RBS.money(pend) + "</b><span>Pending</span></div>" +
      '<div class="stat"><b>' + ps.length + "</b><span>Transactions</span></div></div>" +
      '<div class="svc-list">' + ps.map((p) => {
        const bk = RBS.bookings().find((b) => b.id === p.bookingId);
        const cl = RBS.users().find((u) => u.id === p.userId);
        return '<div class="card bkg" style="cursor:default"><span class="info"><b>' + esc(p.ref) + " • " + esc(cl ? cl.name : "Client") + "</b><span>" + esc(bk ? bk.serviceName : "") + " • " + esc(methodName(p.method)) + " • " + timeAgo(p.createdAt) + '</span></span>' +
          '<span class="rt"><b>' + RBS.moneyFull(p.amount) + '</b><span class="badge ' + p.status + '">' + STATUS[p.status] + "</span></span>" +
          (p.status === "pending" ? '<button class="btn btn-primary btn-sm" data-pay="' + p.id + '">Mark paid</button>' : "") + "</div>";
      }).join("") + "</div></div>";
  }
  function bindStudioPay() {
    document.querySelectorAll("[data-pay]").forEach((b) => b.addEventListener("click", () => {
      RBS.markPaymentPaid(b.dataset.pay);
      toast("Payment approved", "Client notified, invoice flipped to Paid.", "ok");
      render();
    }));
  }

  /* ---- reviews ---- */
  function vStudioRev() {
    const rs = RBS.reviews().sort((a, b) => b.ts.localeCompare(a.ts));
    return '<div class="view">' +
      '<div class="view-head"><div><h1>Reviews</h1><div class="sub">Reply publicly — clients see your response in-app</div></div>' +
      '<span class="chip">★ ' + (rs.length ? (rs.reduce((s, r) => s + r.rating, 0) / rs.length).toFixed(1) : "—") + " avg</span></div>" +
      '<div class="svc-list">' + rs.map((r) => {
        const svc = CONFIG.services.find((s) => s.id === r.serviceId);
        return '<div class="card" style="padding:16px">' + starRow(r.rating) +
          '<p class="small" style="margin:8px 0 8px;color:var(--muted)">“' + esc(r.text) + '”</p>' +
          (r.reply ? '<div class="rev-reply"><b>Your reply:</b> ' + esc(r.reply.text) + "</div>" : "") +
          '<div class="row between"><b class="small">' + esc(r.name) + ' <span class="muted">• ' + esc(svc ? svc.name : r.serviceId) + '</span></b>' +
          (r.reply ? '<span class="small muted">' + timeAgo(r.reply.ts) + "</span>" : '<button class="btn btn-ghost btn-sm" data-rep="' + r.id + '">Reply</button>') +
          "</div></div>";
      }).join("") + "</div></div>";
  }
  function bindStudioRev() {
    document.querySelectorAll("[data-rep]").forEach((b) => b.addEventListener("click", () => {
      const m = openModal('<h3>Reply to review</h3><p class="modal-sub">Public response shown under the client’s review.</p>' +
        '<div class="field"><label>Your reply</label><textarea id="rep-text" placeholder="Thank them, add context, invite them back…"></textarea></div>' +
        '<button class="btn btn-primary btn-block" id="rep-go">Publish reply</button>');
      m.querySelector("#rep-go").onclick = () => {
        const t = m.querySelector("#rep-text").value.trim();
        if (t.length < 3) { toast("Too short", "Write a sentence or two.", "warn"); return; }
        RBS.addReviewReply(b.dataset.rep, t);
        closeModal(); toast("Reply published", "The client was notified too.", "ok"); render();
      };
    }));
  }

  /* ================= NOTIFICATIONS PANEL ================= */
  function notifPanel(user) {
    const root = $("#notif-root");
    if (root.firstChild) { root.innerHTML = ""; return; }
    const ns = RBS.userNotifs(user.id);
    root.innerHTML = '<div class="notif-panel"><div class="hd">Notifications <button class="btn btn-ghost btn-sm" id="ntf-read">Mark all read</button></div>' +
      '<div class="list">' + (ns.length ? ns.map((n) =>
        '<div class="notif ' + (n.read ? "" : "unread") + '" data-route="' + esc(n.route || "#/bookings") + '"><span class="ic">' + I.bell + "</span><div><b>" + esc(n.title) + "</b><span>" + esc(n.body) + '</span><time>' + timeAgo(n.ts) + "</time></div></div>").join("")
        : '<p class="small muted" style="padding:20px">No notifications yet.</p>') + "</div></div>";
    $("#ntf-read").addEventListener("click", () => { RBS.markAllRead(user.id); root.innerHTML = ""; updateBell(user); });
    root.querySelectorAll(".notif[data-route]").forEach((el) => el.addEventListener("click", () => {
      RBS.markAllRead(user.id); root.innerHTML = ""; updateBell(user);
      location.hash = el.dataset.route;
    }));
    setTimeout(() => {
      const close = (e) => { if (!root.contains(e.target) && e.target.closest("#btn-bell") === null) { root.innerHTML = ""; document.removeEventListener("click", close); } };
      document.addEventListener("click", close);
    }, 0);
  }

  /* ================= INSTALL ================= */
  let deferredInstall = null;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); deferredInstall = e;
    $("#btn-install").style.display = "grid";
  });
  function triggerInstall() {
    if (deferredInstall) { deferredInstall.prompt(); deferredInstall = null; return; }
    if (window.matchMedia("(display-mode: standalone)").matches) { toast("Already installed", "You're using the installed app.", "ok"); return; }
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    toast("Install " + B.appName, ios ? "Safari → Share □↑ → Add to Home Screen." : "Browser menu ⋮ → Install app / Add to Home screen.", "ok");
  }

  /* ================= BOOT ================= */
  $("#top-tag").textContent = B.techCompanyTag;
  $("#btn-bell").addEventListener("click", (e) => { e.stopPropagation(); const u = RBS.currentUser(); if (u) notifPanel(u); });
  $("#btn-install").addEventListener("click", triggerInstall);
  $("#tabbar").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b && b.dataset.t) location.hash = "#/" + b.dataset.t; });
  RBS.seed();
  Sync.start();
  window.addEventListener("rbs-sync", () => { if (RBS.currentUser() || RBS.isStudio()) render(); });
  if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  if (!location.hash) location.hash = "#/home";
  render();
})();
