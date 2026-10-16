/* ============================================================
   RocAudio Suite — CLOUD SYNC (free Supabase REST, no SDK)
   ------------------------------------------------------------
   Makes the app a true multi-device product: chats, bookings,
   payments, invoices, reviews and notifications sync between
   ANY phones/computers in the world.

   SETUP (5 min, $0):
   1. supabase.com → New project (free tier)
   2. SQL editor → paste backend/supabase-schema.sql → Run
   3. Project Settings → API → copy Project URL + anon key
   4. Paste both into js/config.js → backend { url, key }
   5. Redeploy. Done — sync polls every 6s both directions.

   Without keys configured the app stays fully functional in
   offline-first local mode (current behaviour).
   ============================================================ */
const Sync = (() => {
  "use strict";
  const cfg = () => CONFIG.backend || {};
  const on = () => !!(cfg().url && cfg().key);
  const H = () => ({
    apikey: cfg().key,
    Authorization: "Bearer " + cfg().key,
    "Content-Type": "application/json",
    Prefer: "return=minimal,resolution=merge-duplicates",
  });
  const stamp = () => new Date().toISOString();
  let last = "1970-01-01T00:00:00.000Z";
  let timer = null;
  let busy = false;

  /* local row -> table row */
  const ROW = {
    users: (u) => ({ id: u.id, full_name: u.name, email: u.email, phone: u.phone || "", role: "client", created_at: u.createdAt || stamp(), updated_at: stamp() }),
    bookings: (b) => ({ id: b.id, client_id: b.userId, service_id: b.serviceId, service_name: b.serviceName, package_name: b.packageName, bonuses: b.bonuses || [], booking_date: b.date, booking_time: b.time, notes: b.notes || "", pay_option: b.payOption || "full", total: b.total, status: b.status, created_at: b.createdAt || stamp(), updated_at: stamp() }),
    payments: (p) => ({ id: p.id, client_id: p.userId, booking_id: p.bookingId, ref: p.ref, amount: p.amount, method: p.method, status: p.status, paid_at: p.paidAt, created_at: p.createdAt || stamp(), updated_at: stamp() }),
    invoices: (i) => ({ id: i.id, client_id: i.userId, booking_id: i.bookingId, number: i.number, lines: i.lines, subtotal: i.subtotal, vat: i.vat, total: i.total, paid: i.paid, status: i.status, sent_to: i.sentTo || [], sent_at: i.sentAt, created_at: i.createdAt || stamp(), updated_at: stamp() }),
    reviews: (r) => ({ id: r.id, client_id: r.userId || null, service_id: r.serviceId, author_name: r.name, rating: r.rating, body: r.text, reply_text: r.reply ? r.reply.text : null, reply_at: r.reply ? r.reply.ts : null, created_at: r.ts || stamp(), updated_at: stamp() }),
    notifs: (n) => ({ id: n.id, client_id: n.userId, title: n.title, body: n.body, read: n.read, route: n.route || "#/bookings", created_at: n.ts || stamp(), updated_at: stamp() }),
  };
  /* table row -> local row */
  const LOC = {
    users: (r) => ({ id: r.id, name: r.full_name, email: r.email, phone: r.phone || "", password: "h0", createdAt: r.created_at }),
    bookings: (r) => ({ id: r.id, userId: r.client_id, serviceId: r.service_id, serviceName: r.service_name, packageName: r.package_name, bonuses: r.bonuses || [], date: r.booking_date, time: r.booking_time, notes: r.notes || "", payOption: r.pay_option, total: r.total, status: r.status, createdAt: r.created_at }),
    payments: (r) => ({ id: r.id, userId: r.client_id, bookingId: r.booking_id, ref: r.ref, amount: r.amount, method: r.method, status: r.status, paidAt: r.paid_at, createdAt: r.created_at }),
    invoices: (r) => ({ id: r.id, userId: r.client_id, bookingId: r.booking_id, number: r.number, lines: r.lines, subtotal: r.subtotal, vat: r.vat, total: r.total, paid: r.paid, status: r.status, sentTo: r.sent_to || [], sentAt: r.sent_at, createdAt: r.created_at }),
    reviews: (r) => ({ id: r.id, userId: r.client_id, serviceId: r.service_id, name: r.author_name, rating: r.rating, text: r.body, reply: r.reply_text ? { text: r.reply_text, ts: r.reply_at } : undefined, ts: r.created_at }),
    notifs: (r) => ({ id: r.id, userId: r.client_id, title: r.title, body: r.body, read: r.read, route: r.route, ts: r.created_at }),
  };
  const TABLE = { users: "profiles", bookings: "bookings", payments: "payments", invoices: "invoices", reviews: "reviews", notifs: "notifications" };
  const LOCAL = { users: () => RBS.users(), bookings: () => RBS.bookings(), payments: () => RBS.payments(), invoices: () => RBS.invoices(), reviews: () => RBS.reviews(), notifs: () => RBS.notifs() };

  const sent = {}; // id -> json fingerprint, to avoid re-pushing

  async function upsert(table, rows) {
    if (!rows.length) return;
    for (let i = 0; i < rows.length; i += 50) {
      await fetch(cfg().url + "/rest/v1/" + table, { method: "POST", headers: H(), body: JSON.stringify(rows.slice(i, i + 50)) });
    }
  }

  async function pushAll() {
    if (!on()) return;
    for (const name of Object.keys(TABLE)) {
      const rows = LOCAL[name]().map((x) => { const r = ROW[name](x); r._fp = JSON.stringify(r); return r; });
      const fresh = rows.filter((r) => sent[r.id] !== r._fp);
      if (fresh.length) {
        await upsert(TABLE[name], fresh.map((r) => { const c = Object.assign({}, r); delete c._fp; return c; }));
        fresh.forEach((r) => { sent[r.id] = r._fp; });
      }
    }
    /* chat messages */
    const msgs = [];
    Object.entries(RBS.chatAll()).forEach(([cid, arr]) => arr.forEach((m) => msgs.push({ id: m.id, client_id: cid, sender: m.from, body: m.text, created_at: m.ts || stamp(), updated_at: stamp() })));
    const freshM = msgs.filter((m) => sent["m" + m.id] !== m.body + m.sender);
    if (freshM.length) {
      await upsert("messages", freshM);
      freshM.forEach((m) => { sent["m" + m.id] = m.body + m.sender; });
    }
  }

  async function pull() {
    if (!on()) return 0;
    let changed = 0;
    const since = encodeURIComponent(last);
    for (const name of Object.keys(TABLE)) {
      const res = await fetch(cfg().url + "/rest/v1/" + TABLE[name] + "?select=*&updated_at=gt." + since, { headers: { apikey: cfg().key, Authorization: "Bearer " + cfg().key } });
      if (!res.ok) continue;
      const rows = await res.json();
      changed += RBS.mergeRemote(name, rows.map(LOC[name]));
    }
    const resM = await fetch(cfg().url + "/rest/v1/messages?select=*&updated_at=gt." + since, { headers: { apikey: cfg().key, Authorization: "Bearer " + cfg().key } });
    if (resM.ok) changed += RBS.mergeRemote("chat", await resM.json());
    last = stamp();
    return changed;
  }

  async function cycle() {
    if (busy || !on()) return;
    busy = true;
    try {
      await pushAll();
      const changed = await pull();
      if (changed > 0) {
        try { window.dispatchEvent(new Event("rbs-sync")); } catch (e) {}
      }
    } catch (e) { /* network dips are fine — next cycle retries */ }
    busy = false;
  }

  function start() {
    if (!on() || timer) return;
    cycle();
    timer = setInterval(cycle, 6000);
  }

  return { on, start, cycle, pushAll, pull };
})();

if (typeof module !== "undefined" && module.exports) module.exports = Sync;
