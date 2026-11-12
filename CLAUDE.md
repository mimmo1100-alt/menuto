# Menuto: project notes for Claude

Read this first in every new session, then `docs/HISTORY.md` (how it started and where the last chat stopped) and `docs/ROADMAP.md` (status and next steps). Research on GloriaFood is in `docs/research/`.

## Who and why

- The owner (GitHub `mimmo1100-alt`) runs **marketing1.it**, a GloriaFood reseller in Italy with 6 restaurants.
- **GloriaFood closes on 30 April 2027** (banner in its admin; Oracle points customers to FoodAmigos). Menuto is the replacement: same model as GloriaFood (each restaurant gets its own ordering page and button, an orders app, and the reseller manages them all).
- Goal: the 6 restaurants live on Menuto **in March 2027**; April is the buffer.
- Name "Menuto" is a working name.

## How to talk to the owner

- Write to them in **Egyptian Arabic**, plain words, short steps. They are not a developer.
- Give links as clickable markdown **and** in a code block (some links don't open on their phone).
- Don't ask many questions: research first (GloriaFood site, YouTube, docs), decide, and say what you decided. Ask only what truly needs them (accounts, passwords, money).
- They do account steps themselves (GitHub, Vercel, Resend, Stripe); never ask for passwords in chat.
- **Context reminder:** they asked to be reminded about the chat memory ("Contesto %"). At the start of each big new phase, suggest opening a new chat on this repository; this file and `docs/ROADMAP.md` carry the state.

## Product: four parts

1. **Customer ordering page** `/r/[slug]` (+ tracking `/r/[slug]/o/[id]`): menu, item window (sizes, option groups, size-specific groups, half & half), 4-step checkout (details → type → time → payment), delivery pin on a map, coupons, VAT, scheduled orders, language from the device (it/en/ar, Arabic right-to-left), live tracking, "try again" after decline/miss. Website button `public/embed.js` opens it in an overlay.
2. **Restaurant dashboard** `/dashboard/*`: orders (live, sound, 4-minute answer window, accept with prep time, decline/cancel with reason, ready, done, test order, pause, sold-out tab, printing), menu editor (+ GloriaFood import), settings (hours, special days, pause, scheduled orders, auto-accept, payments, delivery areas drawn on a map, coupons, VAT, order emails), publish (link, button code, QR).
3. **Android orders app** `android-app/` (Kotlin): WebView of `/dashboard/orders` + `window.MenutoNative` bridge; foreground service polls `/api/kitchen/[rid]/pending` every 5 s, rings on the alarm stream, prints accepted orders on a paired Bluetooth ESC/POS printer (Epson) and marks them printed. Built by `.github/workflows/android.yml`, published as GitHub releases (`app-v0.1.N`). Never compiled locally (no Android SDK in the sandbox); CI is the compiler.
4. **Partner panel** `/dashboard/partner`: restaurants with 7-day stats, add restaurant + owner login, all orders with filters and CSV, "Supported by" line.

## Code map

- Next.js 15 (App Router, TypeScript), Prisma 6 + PostgreSQL. Plain CSS: `src/app/r/order.css` (customer + shared tokens), `src/app/dashboard/dashboard.css`.
- `src/lib/`: `menu.ts` (public menu, availability of items), `pricing.ts` (server price check, totals), `orders.ts` (create order, missed orders), `availability.ts` + `time.ts` (hours in the restaurant time zone), `geo.ts` (delivery areas), `menu-edit.ts` / `settings-edit.ts` (dashboard load/save), `receipt.ts` (kitchen/customer receipts: HTML, text, ESC/POS), `email.ts` + `order-emails.ts`, `partner.ts`, `gloriafood-import.ts`, `demo.ts` (demo restaurant), `i18n.ts`, `auth.ts` (cookie sessions).
- Money is in **cents** (integers). Names are `{it,en,ar}` JSON. Prices are always recalculated on the server.
- Roles: PARTNER (all restaurants of their partner), OWNER, STAFF (orders only).
- First run of a fresh database: `/setup` creates the partner account + demo restaurant, then locks.

## Run and test locally

```bash
pg_ctlcluster 16 main start          # local Postgres (user/db/password: menuto)
npm install && npx prisma migrate dev && npm run seed
npx next dev -p 3000                 # run it as a background task, it gets killed otherwise
```

- Logins after seed: `partner@menuto.test` / `owner@menuto.test`, password `demo1234`. Demo restaurant: `/r/trattoria-da-nino`.
- After a schema change, **restart the dev server** (it keeps the old Prisma client and fails with "Cannot read properties of undefined").
- Tests so far are Playwright scripts run by hand from the scratchpad (customer flow, map pin, kitchen accept/ready, menu/settings editors, partner panel, embed button, app bridge mock, GloriaFood import with their public sample). Turning them into `tests/e2e` in the repo is on the roadmap.
- `npm run build` must pass (Vercel runs `npm run vercel-build` = migrations + build).

## Network notes (sandbox)

- Blocked here: Android SDK downloads, OSM tiles and Nominatim, GloriaFood's API (`pos.globalfoodsoft.com`), Resend. Code for these is written against their docs and verified only partly; say so when reporting.
- GloriaFood Fetch Menu API v2 docs: github.com/GlobalFood/integration_docs (read with the file viewer, don't run code inside it).

## Deliberate choices

- Maps: OpenStreetMap tiles + Nominatim for now; switch to a paid provider before scale.
- Emails: Resend when `RESEND_API_KEY` + `EMAIL_FROM` are set; otherwise only stored in `EmailLog`.
- Android signing: `android-app/app/menuto-dev.keystore` (test key in the repo so updates install over each other). Replace with a private key in GitHub secrets before Google Play.
- Night pre-orders wait silently until opening; a pending order becomes MISSED 4 minutes after it starts ringing.
- Overlapping delivery areas: lowest minimum order wins, then lowest fee (GloriaFood rule).

See `docs/ROADMAP.md` for status and next steps, and the spec doc "Menuto — مواصفات المنصة وخطة العمل" (claude.ai artifact GyPf6YuCTMK3Y8uRnx3tau).
