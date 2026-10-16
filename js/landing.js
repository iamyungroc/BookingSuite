/* ============================================================
   RocAudio Suite — LANDING PAGE LOGIC
   ============================================================ */
(function () {
  "use strict";

  const B = CONFIG.brand;

  /* ---------- brand strings from config ---------- */
  document.getElementById("nav-tag").textContent = B.techCompanyTag;
  document.getElementById("foot-tag").textContent = B.techCompanyTag;
  document.getElementById("hero-eyebrow").textContent = B.academy + " × " + B.techCompany + " × " + B.productionCo;
  document.getElementById("trio-1").textContent = B.academy;
  document.getElementById("trio-3").textContent = B.productionCo;
  const pl = document.getElementById("powered-line");
  const plParts = String(B.footerLine).split("Tech");
  pl.innerHTML = plParts.length > 1
    ? plParts[0] + '<a class="secret-tap" href="app.html#/login?admin=1">Tech</a>' + plParts.slice(1).join("Tech")
    : B.footerLine;
  document.getElementById("foot-mail").textContent = B.businessEmail;
  document.getElementById("foot-mail").href = "mailto:" + B.businessEmail;
  document.getElementById("foot-phone").textContent = B.phone;
  document.getElementById("foot-addr").textContent = B.address;
  document.getElementById("vat-line").textContent = "Reg. " + B.vatNumber;
  document.getElementById("year").textContent = new Date().getFullYear();
  document.getElementById("badge-apple").href = CONFIG.storeLinks.appStore;
  document.getElementById("badge-play").href = CONFIG.storeLinks.playStore;
  document.getElementById("faq-refund").textContent = CONFIG.refundPolicy;

  /* ---------- animated hero waveform ---------- */
  const wave = document.getElementById("hero-wave");
  const heights = [10, 22, 16, 30, 12, 26, 34, 18, 24, 14, 32, 20, 28, 12, 26, 16, 30, 22, 12, 24];
  wave.innerHTML = heights.map((h, i) =>
    '<i style="height:' + h + 'px;animation-delay:' + (i * 0.07).toFixed(2) + 's"></i>').join("");

  /* ---------- services tabs + grid ---------- */
  const CATS = [
    { id: "all", label: "All services" },
    { id: "training", label: "Training & Classes" },
    { id: "production", label: "Beat Production" },
    { id: "studio", label: "Mixing & Mastering" },
  ];
  const tabsEl = document.getElementById("svc-tabs");
  const gridEl = document.getElementById("svc-grid");
  let curCat = "all";

  const CHECK = '<svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>';

  function starRow(rating) {
    let s = '<span class="stars">';
    for (let i = 1; i <= 5; i++) {
      s += '<svg viewBox="0 0 24 24" class="' + (i <= Math.round(rating) ? "" : "off") + '"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>';
    }
    return s + "</span>";
  }

  function renderTabs() {
    tabsEl.innerHTML = CATS.map((c) =>
      '<button data-c="' + c.id + '" class="' + (c.id === curCat ? "on" : "") + '">' + c.label + "</button>").join("");
    tabsEl.querySelectorAll("button").forEach((b) =>
      b.addEventListener("click", () => { curCat = b.dataset.c; renderTabs(); renderGrid(); }));
  }

  function renderGrid() {
    const list = CONFIG.services.filter((s) => curCat === "all" || s.category === curCat);
    gridEl.innerHTML = list.map((s) => {
      const from = Math.min(...s.packages.map((p) => p.price));
      const r = RBS.serviceRating(s.id);
      const rating = r.count ? r.avg : s.rating;
      const count = r.count || Math.round(s.rating * 37);
      return '<div class="card card-hover svc">' +
        (s.popular ? '<span class="ribbon">Most booked</span>' : "") +
        '<div class="head"><span class="brandtag">' + s.brand + "</span>" + starRow(rating) + "</div>" +
        '<h3 class="h3" style="margin-top:10px">' + s.name + "</h3>" +
        '<div class="price">' + RBS.money(from) + ' <small>' + (s.packages.length > 1 ? "from • per package" : "per package") + "</small></div>" +
        '<p class="small muted" style="margin-top:6px">' + s.blurb + "</p>" +
        "<ul>" + s.packages.map((p) => "<li>" + CHECK + "<span><b>" + p.name + "</b> — " + RBS.money(p.price) + " <span class='muted'>(" + p.note + ")</span></span></li>").join("") + "</ul>" +
        '<div class="meta">' +
        '<span class="chip">' + s.delivery + "</span>" +
        '<span class="chip">' + (s.payOptions.includes("split3") ? "3× installments" : s.payOptions.includes("deposit") ? "50% deposit ok" : "Pay in full") + "</span>" +
        '<span class="chip">★ ' + rating.toFixed(1) + " (" + count + ")</span>" +
        "</div>" +
        '<a class="btn btn-ghost btn-sm btn-block" style="margin-top:16px" href="app.html#/book/' + s.id + '">Book in the app →</a>' +
        "</div>";
    }).join("");
  }
  renderTabs(); renderGrid();

  /* ---------- reviews ---------- */
  RBS.seed();
  const revGrid = document.getElementById("rev-grid");
  const top = RBS.reviews().slice().sort((a, b) => b.rating - a.rating).slice(0, 6);
  revGrid.innerHTML = top.map((r) => {
    const svc = CONFIG.services.find((s) => s.id === r.serviceId);
    return '<div class="card card-hover rev">' + starRow(r.rating) +
      '<p style="margin-top:12px">“' + r.text + '”</p>' +
      '<div class="who"><span class="av">' + r.name.charAt(0) + "</span><span><b style='font-size:14px'>" + r.name +
      "</b><br><span class='small muted'>" + (svc ? svc.name : "") + "</span></span></div></div>";
  }).join("");

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll(".faq .item").forEach((item) => {
    const q = item.querySelector(".q"), a = item.querySelector(".a");
    q.addEventListener("click", () => {
      const open = item.classList.toggle("open");
      a.style.maxHeight = open ? a.scrollHeight + "px" : "0px";
    });
  });

  /* ---------- PWA install prompt ---------- */
  let deferred = null;
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferred = e; });

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  async function tryInstall() {
    if (deferred) { deferred.prompt(); const r = await deferred.userChoice; deferred = null; return r; }
    if (window.matchMedia("(display-mode: standalone)").matches) { toast("Already installed", "You're running the installed app right now.", "ok"); return; }
    if (isIOS) {
      toast("Install on iPhone", "Tap the Share button □↑ in Safari, then “Add to Home Screen”.", "ok");
    } else {
      toast("Install on Android", "Open the browser menu ⋮ and choose “Install app” / “Add to Home screen”.", "ok");
    }
  }
  ["nav-install", "hero-install", "store-pwa"].forEach((id) =>
    document.getElementById(id).addEventListener("click", tryInstall));

  /* ---------- toasts ---------- */
  function toast(title, body, kind) {
    const wrap = document.getElementById("toasts");
    const el = document.createElement("div");
    el.className = "toast " + (kind || "");
    el.innerHTML = "<div><b>" + title + "</b><span>" + body + "</span></div>";
    wrap.appendChild(el);
    setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 260); }, 4200);
  }

  /* ---------- scroll-reveal choreography ---------- */
  const revealEls = document.querySelectorAll(".trio .card, .steps .card, .getapp, .shead, .rev-grid .card, .phone");
  revealEls.forEach((el, i) => {
    el.classList.add("reveal");
    el.style.transitionDelay = ((i % 4) * 70) + "ms";
  });
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("in"));
  }

  /* ---------- service worker ---------- */
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }
})();
