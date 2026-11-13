# How Menuto started and where we are

The first chat (12 November 2026), in order. A new session should read this, then `CLAUDE.md` and `docs/ROADMAP.md`.

## 1. The idea

- The owner wanted "a site like the one I use", and named Just Eat, Glovo, Deliveroo and **GloriaFood**. We settled on the **GloriaFood model**: every restaurant gets its own ordering page and button (not a marketplace like Just Eat).
- Three sides, as the owner described them: the **customer** orders, the **restaurant owner** edits prices and menu, and the **app** on the restaurant phone receives the order with a notification, can accept automatically or with a time, and prints on an **Epson printer over Bluetooth**. Emails go to the customer and to the restaurant.
- Feature the owner pointed out: the page opens in the **device's language** by itself (Italian phone → Italian, Arabic → Arabic, English → English).

## 2. Research (all in `docs/research/`)

- Walked through a real GloriaFood ordering page of one of the owner's restaurants (Pizzeria Sorriso) step by step.
- The owner is a **GloriaFood reseller: marketing1.it, 6 restaurants** (the "Supported by marketing1.it" line under their menus). Claude in Chrome explored the owner's partner and restaurant admin and wrote `gloriafood-admin-report.md`; it found the banner that **GloriaFood closes on 30 April 2027**.
- Read 11 GloriaFood YouTube tutorials, their website (printers, pricing, partner program, API) and their Android app's Play Store reviews (rating 2.6).
- Summary in `gloriafood-research-notes.md`.

## 3. Prototype and spec

- A first single-page demo was published as a claude.ai artifact (customer page + restaurant orders + menu editor, live via shared data): https://claude.ai/artifact/BSC2WgiSHzvmJWWghvvrp5
- The full spec and plan was written as a claude.ai doc, "Menuto — مواصفات المنصة وخطة العمل": https://claude.ai/artifact/GyPf6YuCTMK3Y8uRnx3tau (four parts, MVP vs later, tech and monthly cost, timeline to March 2027).
- Decisions by the owner: name **Menuto** (working name), restaurant devices are **Android**, start without online payments.

## 4. GitHub

- The owner created the GitHub account `mimmo1100-alt`, the private repo `menuto`, and connected GitHub to Claude (claude.ai/connect-github + the Claude GitHub App). This took several tries; the steps that worked: github.com/new to create the repo, then github.com/apps/claude/installations/new.

## 5. What was built, in order (each step tested, committed and pushed)

1. Next.js + Prisma + Postgres project, database schema, demo restaurant "Trattoria Da Nino (demo)".
2. Customer ordering page, server-side pricing, order tracking, restaurant orders screen with login.
3. Menu editor; settings page (pause, hours, special days, payments, coupons, VAT, auto-accept).
4. Delivery areas drawn on a map; customer pin decides the area.
5. Website button (`embed.js`), ordering link and QR (Publish page).
6. Order emails (logged until a Resend key exists).
7. Hosting preparation: migrations on deploy, `/setup` page for the first account.
8. Partner panel for the reseller.
9. Orders screen as an installable app: test order, pause, sold-out tab, receipts, auto-print.
10. **Android app** (`android-app/`, Kotlin): background watcher, alarm-volume ringing, Bluetooth ESC/POS printing, server print queue; APK built by GitHub Actions and published as a release (first one: `app-v0.1.1`).
11. Size-specific option groups and **import from GloriaFood** (Fetch Menu API v2 or JSON file).
12. Project notes (`CLAUDE.md`), roadmap and this history, so a new chat can continue.

## 6. Where we stopped

- The first chat ended at about 78% of its memory; the owner asked to continue in a new chat.
- **Waiting on the owner:** deploy on Vercel with Neon Postgres (5 steps in `docs/ROADMAP.md`), then install the APK and test with the Epson printer, and give a GloriaFood "Fetch Menu" key of the demo restaurant GUSTO GIUSTO to test the import for real.
- **Next to build:** sales reports, then QR ordering at the table, table reservations, Stripe payments.

## 7. Second chat (12 November 2026)

- Repo attached to a new cloud session; read the notes and continued.
- Built **sales reports** (`/dashboard/reports`) and the **end-of-day email** (sent every morning for the day before, through Vercel Cron in `vercel.json`; once per restaurant/day via the `DailyReportSent` table; switch in Settings → Emails).
- Built **ordering at the table**: `Table` model with a random code per table, Tables page in the dashboard with printable QR cards, table mode on the ordering page (name + payment only), table shown on the kitchen screen, receipts and emails. "At the table" is offered only from a table QR.
- The owner said their restaurants don't use table reservations: moved after March.
- Built the **go-live essentials**: password reset and change, Team page with staff accounts, rate limiting, privacy notice and order terms per restaurant, nightly encrypted database backup.
- Payment methods like GloriaFood plus **Satispay**: cash, card/Bancomat with the POS, Satispay, all paid on receipt. Online payment stays "coming soon" in Settings (owner decision: not now).
- **Automatic tests**: 20 Playwright tests + GitHub Actions. They found a bug from the Satispay change (Tables page limited to 2 payment methods), fixed. Login lockout now counts only failed attempts.
- The owner asked Claude to carry on alone. Added the **go-live checklist** for moving the 6 restaurants, and suggested the official Vercel plugin so Claude can deploy once the owner signs in.
- **Deploy rehearsal** (13 Nov): empty database + `npm run vercel-build` with only the variables Neon sets (`DATABASE_URL`, `DATABASE_URL_UNPOOLED`, no `.env`) + `next start` in production: migrations, build, `/setup`, go-live page, table QR decoded like a camera (opens the right table), phone order with Satispay, kitchen accept, Epson receipt bytes, Arabic page. All worked. Added the payment method to the kitchen ticket (it travels in the bag with the driver).
- **Next:** the owner deploys on Vercel and tests on real phones and the Epson printer; then fix what that shows.
