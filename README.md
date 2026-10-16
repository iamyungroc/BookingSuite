# RocAudio Suite  — PWA + Landing Page

**The Symphony Producers Academy × RocAudio™ × The Beats by Roc Company**

One installable app (Android + iOS) + a professional landing page with install/store links.
Cold, minimal, professional. Built as a **PWA** — installs to the home screen like a native app,
works offline, no app-store approval required to start using it today.

---

##  Run it right now (local)

```bash
cd roc-suite
python3 -m http.server 8080      # or: npx serve .
```

Open **http://localhost:8080** → landing page
Open **http://localhost:8080/app.html** → the app (or click “Open App”)

**Demo login:** `demo@rocaudio.eu` / `demo1234` (pre-loaded with bookings, payments, invoices & chat)
Or create a fresh account from the login screen.

> Any static host works. For phone testing on your local network: `python3 -m http.server 8080 --bind 0.0.0.0`
> then open `http://YOUR-PC-IP:8080` from your phone (same Wi-Fi).

##  Deploy (free, 5 minutes) — required for install + notifications on phones

Drag-and-drop the `roc-suite` folder to **Netlify Drop** (app.netlify.com/drop), or:

- **Netlify:** new site → deploy folder `roc-suite`
- **Vercel:** `vercel deploy` inside `roc-suite` (framework: Other/Static)
- **GitHub Pages:** push folder → Settings → Pages → branch/root
- **Cloudflare Pages:** create → upload `roc-suite`

You get an HTTPS URL (e.g. `https://rocaudio-suite.netlify.app`). HTTPS is required by phones for
PWA install + push notifications. Put your own domain (e.g. `rocaudio.eu`) in front in the host’s
domain settings.

##  Install on phones

- **Android / Chrome:** open your URL → the app shows an Install button, or browser menu ⋮ → “Install app”.
- **iPhone / Safari:** open your URL → Share □↑ → “Add to Home Screen”.
- The app then launches full-screen with its own icon, offline cache and notifications.
- **App Store / Google Play badges** on the landing page point to `CONFIG.storeLinks` — paste your
  real store URLs there once listed (see “Store listing” below).

---

##  Edit EVERYTHING in one file: `js/config.js`

| What | Where in config |
|---|---|
| Brand names, tagline, footer line | `brand.*` |
| **Your business email (invoice CC)**, support email | `brand.businessEmail`, `brand.supportEmail` |
| Phone, address, reg. number (RC/TIN), bank account (NUBAN) | `brand.phone / address / vatNumber / bankAccount` |
| Currency + symbol + VAT % | `brand.currency / currencySymbol / vatRate` |
| **All services, packages, prices, delivery times** | `services[]` |
| **Bonus options per service** | `services[].bonuses` |
| Payment plans offered (full / deposit / 3× installments) | `services[].payOptions` |
| **Studio availability: timezone, working days, bookable hours** | `booking` |
| **Refund / cancellation policy text** (Terms + FAQ) | `refundPolicy` |
| Payment methods shown at checkout | `paymentMethods[]` |
| App Store / Play Store URLs | `storeLinks` |
| Starter reviews | `seedReviews` |

Change a price → it updates everywhere (landing, app, checkout, invoices). No other file needs touching.

---

##  What’s inside (mapped to your brief)

- **Booking page** for training classes, beat production, mix & master projects — package + bonus + date + time + notes
- **Booking calendar** (month view, booked-day dots, day detail) + **notifications** (in-app center + device push when permitted)
- **Direct live chat in-app** with instant studio assistant replies (demo mode — see “Go live” below)
- **Client payment tracker** (paid / pending / refunded, totals, per-booking balances)
- **Payment gateways, location based**: Card, PayPal, Apple Pay, Google Pay, local bank transfer (NUBAN) — currently a **simulated gateway** (you chose demo mode); swap-in points documented below
- **Powerful, cold, minimal professional UI** + great-looking landing page for anyone without the app
- **Invoice auto-send**: detailed VAT invoice generated on payment, marked sent to the client’s email **and** copied to your business email, with a send-log on the invoice + printable/PDF download
- **Payment confirmations**: animated confirmation screen, reference codes, status badges, bell notifications
- **All offers with prices, delivery times, payment options** — everywhere, from one config
- **In-app reviews + star ratings** (clients can publish reviews per service)
- **Bonus options** per service (rush delivery, extra revisions, alternative masters…)
- **Client data + login required** (registration with validation, session, profile editing, delete-account)
- **Footer: “Powered By RocAudio™ Tech Company Europe”** on landing, app profile and every invoice

### Added on top (expert extras)

VAT-compliant invoice breakdown • deposit & 3-installment plans with automatic “due today” math •
pay-balance flow for unpaid remainders • cancellation + refund-policy states • offline mode (service
worker) • home-screen icons + maskable icon • demo account with realistic history • OG/social meta
tags • print-perfect invoice stylesheet • automated end-to-end test suite (`tests/smoke.test.js`).

---

##  Console — the producer side (behind the app)

The app has **two faces**: the client app + a PIN-protected **Console** for you:

- **Login screen**: clients use email + password; the PIN gate is hidden in plain sight: tap the word **“Tech”** inside the “Powered By RocAudio™ Tech Company Europe” footer line on the login screen — it looks like ordinary text (your admin PIN, hashed in `CONFIG.studio.pinHash`) into the same form and lands directly in the Console. No visible admin button, PIN never shown, 5 wrong tries lock for 5 min, changeable inside Console → “Change PIN” (stored hashed). Clients cannot register the admin email.
- **Console dashboard:** active jobs, awaiting-payment count, pending bank sums, avg rating, today's schedule, threads waiting on you
- **Queue:** move bookings through `awaiting payment → confirmed → in progress → delivered` — the client is notified **and** gets an automatic chat status-update on every move; delivering unlocks the client's review
- **Chat inbox:** every client thread; you reply as the studio from your phone. The **studio assistant** (auto-replies) can be toggled ON/OFF per thread — when OFF, clients wait for your personal reply
- **Payments:** approve bank transfers (pending → paid flips the invoice + notifies the client)
- **Reviews:** reply publicly; your reply shows under the client's review in-app and the client is notified
- Clients can only review **delivered** projects (verified reviews), one per service, editable

**Honest architecture note:** today all data lives per-device (offline-first PWA), so the
client↔studio loop demos perfectly on one device. For cross-phone sync in production, run
`backend/supabase-schema.sql` on a free Supabase project and swap the storage calls in
`js/data.js` (signatures unchanged → zero UI rewrites). Realtime chat = subscribe to `messages`.

##  Going live (production swaps, in order of value)

1. **Real payments (Stripe recommended, EU):** create a Stripe account → in `js/app.js` function
   `startCheckout → finalize()`, replace the simulation with a Stripe Payment Intent (or use Stripe
   Payment Links per package — zero code: paste link into `CONFIG.services[].payOptions`). PayPal
   Business works the same way with PayPal buttons. Keep `paymentMethods` labels in sync.
2. **Real invoice emailing:** the app already builds + logs the send. To actually dispatch email,
   connect a tiny backend or a no-code service: e.g. **Supabase Edge Function**, **Firebase
   Function**, or an email API like **Resend / Postmark / SendGrid** called from `finalize()` right after
   `RBS.sendInvoice(inv.id)` (send PDF to `user.email` + CC `CONFIG.brand.businessEmail`).
   `RBS.sendInvoice()` already records both recipients and timestamp.
3. **Real live chat across devices:** swap `js/data.js` chat functions for **Supabase Realtime** or
   **Firebase Firestore** listeners (same message shape: `{from, text, ts}`), or embed
   **Tawk.to / Crisp** widget in `app.html` for a hosted inbox on your phone.
4. **Cloud sync of bookings/payments:** move the `RBS` storage layer from localStorage to
   Supabase/Firebase tables (the function signatures stay, so UI code doesn’t change).
5. **Store listing (App Store / Google Play):** wrap this exact PWA with **Capacitor**
   (`npm i @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios`, `npx cap init`,
   `npx cap add android/ios`, set web dir to the project root). You’ll upload builds with your own
   Apple ($99/yr) / Google ($25) developer accounts. Paste the resulting URLs into `CONFIG.storeLinks`.

##  In-app viewer / quick preview

- **`showcase.html`** — the FULL visual design tour: every app screen rendered in phone
  frames + the desktop landing frame, using the production design system. Best first look.
- **`preview-landing.html`** / **`preview-app.html`** — self-contained interactive builds
  (all CSS/JS inlined, icons as data-URIs; they even survive sandboxed viewers without
  localStorage). Demo login: `demo@rocaudio.eu` / `demo1234`.

The workspace viewer renders files in a sandbox with no network access, so the multi-file
`index.html` can't load its linked CSS/JS there — use the files above for quick looks.
Regenerate the interactive previews after editing sources:

```bash
node tools/build-preview.js
```

Deploy the **original multi-file build** (`index.html` / `app.html`) — that's the production
version with service-worker offline caching. The preview builds are for quick looks only.

##  Tests

```bash
cd roc-suite && python3 -m http.server 8123 &   # serve first
npm i jsdom && node tests/smoke.test.js          # 50 end-to-end assertions
              node tests/preview.test.js         # sandbox-safe preview builds
```

Covers: landing render/filter/FAQ/install-toast • login + registration • catalog filters •
package/bonus math • review publishing • calendar + slots + deposit math • checkout validation,
card success, bank-transfer pending • invoice render + send-log + balance pay • tracker •
calendar dots • bookings modal • chat auto-reply • notifications badge/read • profile edit.

##  Structure

```
roc-suite/
├── index.html            landing page (public website)
├── app.html              the PWA app (client portal)
├── manifest.webmanifest  install manifest (name, icons, theme)
├── sw.js                 service worker (offline cache)
├── css/  base.css · landing.css · app.css
├── js/   config.js (EDIT ME) · data.js (storage layer) · landing.js · app.js
├── assets/  logo + app icons (192/512/maskable/apple/32)
└── tests/smoke.test.js
```

---

**Powered By RocAudio™ Tech Company Europe**
