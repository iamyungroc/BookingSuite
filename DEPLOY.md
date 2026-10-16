# DEPLOY — host RocAudio Suite for $0

Everything in this folder is **static** (HTML/CSS/JS/images). No server, no database, no build
step needed. Any free static host works. Two recommended paths:

---

## Option A — GitHub Pages (recommended: free forever, your own repo, easy updates)

Safe to publish publicly because the admin PIN is stored **hashed** in `js/config.js`
(`pinHash`), and nothing else in the repo is secret by design (bank/TIN details appear on
your invoices anyway).

1. Create a free account at **github.com** (skip if you have one).
2. Click **+ → New repository** → name it e.g. `rocaudio-suite` → **Public** → Create.
3. In the repo page click **uploading an existing file** → drag **everything inside this
   `roc-suite` folder** (files AND subfolders: `css/`, `js/`, `assets/`, `backend/`, `tests/`,
   `tools/`, plus the `.html`, `.js`, `.css`, `.webmanifest`, `.md` files at the root) →
   **Commit changes**.
4. Go to **Settings → Pages** → Source: **Deploy from a branch** → Branch: `main` / folder:
   `/ (root)` → Save.
5. Wait 1–3 minutes. Your site is live at:
   `https://YOUR-USERNAME.github.io/rocaudio-suite/`
6. Updates later: replace the changed files in the repo (upload again / commit). Bump
   `VERSION` in `sw.js` (e.g. v1.4.3) so phones pull the new build.

---

## Option B — Netlify Drop (live in 60 seconds, zero git)

1. Go to **app.netlify.com/drop** (free account).
2. Drag the whole `roc-suite` folder onto the page.
3. Done — you get `https://something.netlify.app` with free HTTPS.
   (Site settings → change the subdomain to e.g. `rocaudio.netlify.app`.)
4. Updates: drag the folder again → Deploy.

*Cloudflare Pages and Vercel work identically if you prefer them.*

---

## ✅ Post-deploy checklist (5 minutes)

- [ ] Open your URL → login card shows **build 1.4.2** at the bottom (confirms fresh deploy)
- [ ] Landing renders in Cocoa & Amber; prices in ₦; footer = your emails/phone/Lagos
- [ ] **Install on your phone:** Android/Chrome: menu ⋮ → Install app • iPhone/Safari:
      Share → Add to Home Screen. Icon = amber R on cocoa.
- [ ] Client test: `demo@rocaudio.eu` / `demo1234` → book → checkout (demo gateway) →
      invoice shows RC/TIN + Moniepoint account + send-log to your outlook
- [ ] Admin test: on the login screen tap the word **“Tech”** inside
      *Powered By RocAudio™ Tech Company Europe* → your admin PIN (set privately — never commit it) → **Console**
- [ ] **Immediately change the PIN:** Console → “Change PIN”
- [ ] Chat loop: send a message as demo client → reply from Console → client sees it
- [ ] Share the landing URL with clients. Done. You spent nothing.

## 📲 PWA verification on your phone (the “app” part)

The audit (`19/19 PWA checks`) confirms: manifest + service worker + icons + offline cache +
install prompts are all wired. On your live HTTPS URL:

- **Android / Chrome:** open the URL → tap our **Install the App** button (or menu ⋮ →
  “Install app”). The amber R icon lands on your home screen; it opens **full-screen with no
  browser bar** (that’s `display: standalone`).
- **iPhone / Safari:** open the URL → **Share □↑ → Add to Home Screen** → same result.
- **Offline test:** after one visit, switch on airplane mode and open the installed app —
  landing, app shell, catalog and your cached data all still load (service worker cache).
  New content syncs when you’re back online.
- **Updates:** when you redeploy, phones pick up the new build automatically on next launch
  (service worker version bump — already handled in `sw.js`).
- **Notifications:** the app asks permission in Profile → “Push notifications”; booking and
  payment alerts then appear on the device (Android now; iOS 16.4+ for installed PWAs).

This is exactly what a PWA is: a website that behaves like a native app — no store approval,
no $99/$25 fees, one link for every client. Store listings later (Capacitor wrap) remain
optional, as planned.

## Later (still free-tier friendly)

- **Custom domain** (e.g. `rocaudio.eu` or `.com.ng`): both hosts attach domains free;
  buy the domain only when you want one (~$10/yr, optional).
- **Store listings:** paste real URLs into `CONFIG.storeLinks` once you list on
  App Store / Google Play (wrap with Capacitor; your own dev accounts).
- **Real payments:** Paystack/Flutterwave (Nigeria-first) — swap point documented in README.
- **Cross-device chat/booking sync:** run `backend/supabase-schema.sql` on free Supabase.

## Security notes

- Admin PIN exists in the codebase **only as a hash** — publishing the repo leaks nothing.
- The gate (word “Tech”) is invisible to clients; 5 wrong PINs lock for 5 minutes.
- Bank account + RC/TIN are intentionally visible on invoices (clients need them to pay).
- Demo gateway = no real money moves until you wire Paystack/Stripe.
