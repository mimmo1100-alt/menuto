# Menuto roadmap

Updated: 12 November 2026. Target: the 6 restaurants on Menuto in March 2027 (GloriaFood closes 30 April 2027).

## Done (phase 1)

| Area | What works | Verified |
| --- | --- | --- |
| Customer ordering | Menu, sizes, option groups (incl. per size), half & half, sold out, 4-step checkout, coupons, VAT, scheduled orders, it/en/ar | Playwright, phone size |
| Delivery | Areas drawn on a map (circle / free shape), customer pin, server picks the area | Playwright (map tiles blocked in sandbox) |
| Orders screen | Live list, sound, 4-min window, accept/decline/cancel/ready/done, test order, pause, sold-out tab, receipts, auto-print | Playwright |
| Dashboard | Menu editor, settings, publish (link, button, QR) | Playwright |
| Emails | Customer: received/confirmed/declined/canceled/missed/ready. Restaurant: new order | Logged only (no Resend key yet) |
| Partner panel | Restaurants + stats, add restaurant, all orders + CSV, branding | Playwright |
| Android app | Background watcher, alarm, Bluetooth ESC/POS printing, print queue | Builds on CI; not yet run on a phone or printer |
| GloriaFood import | Fetch Menu API v2 key or JSON file | Their public sample; not yet with a real key |
| Sales reports | `/dashboard/reports`: today / yesterday / 7 / 30 days / month / custom; sales, orders, average, new vs returning customers, trend chart, payment method, order type, best sellers, busiest hours and days, lost orders, CSV. End-of-day email every morning (Vercel Cron 05:00 UTC, on/off in Settings) | Numbers checked against the DB; Playwright it/ar, desktop/phone; email only logged (no Resend key) |
| Ordering at the table | `/dashboard/tables`: turn on, payment at the table, add/rename/disable tables, print QR cards (A4, 6 per page, save as PDF). QR opens `/r/[slug]?t=code`: straight to the menu, only the first name + payment, order arrives with the table in big type (kitchen screen, receipts, restaurant email) | API checks (fake table name ignored, unknown/disabled table refused); Playwright customer phone it/ar, kitchen, tables page, print PDF |
| Go-live essentials | Forgot password (1-hour link) + change password; Team page (owner adds/removes owners and staff; staff see only Orders and Team); rate limits (login, reset, orders, quotes); privacy notice + order terms per restaurant (`/r/[slug]/privacy`, `/terms`, it/en) with legal details in Settings; nightly encrypted DB backup (GitHub Actions, `docs/BACKUP.md`) | API + Playwright; backup dump→encrypt→restore tested locally (not yet on GitHub: needs the secrets) |
| Payment methods | Cash, card/Bancomat (at pickup, on delivery with the POS, at the table), Satispay (paid in the app on receipt), per service; "Online payment" shown in Settings as coming soon | Playwright customer checkout + kitchen; server refuses a method the restaurant turned off |
| Automatic tests | 20 Playwright end-to-end tests in `tests/e2e` + GitHub Actions on every push (type check, lint, build, tests). Found a real bug on the first run (Tables page couldn't save with 3 payment methods) | Run twice locally, all green |
| Go-live checklist | Partner → "Ready to go live?": per restaurant menu, hours, contacts, location, payments, delivery areas, order emails, legal details, owner login, test order, printing, tables, ordering on; plus system status after deploy | e2e test |
| Hosting prep | Migrations on deploy, `/setup` first run | Production build on an empty DB |

## Waiting on the owner

1. ~~Deploy~~ Done 13 Nov 2026: https://menuto-two.vercel.app (Vercel project `menuto`, Neon `menuto-db`). Still to do: the owner opens `/setup` and creates their account; connect the GitHub repo in Vercel (Settings → Git) so every push deploys by itself (today deploys are done with `npx vercel deploy --prod` from this repo); turn on 2FA on the Vercel account.
2. Install the APK from the latest GitHub release on the restaurant phone; pair the Epson printer; test print.
3. GloriaFood "Fetch Menu" key of the demo restaurant GUSTO GIUSTO, to test the import for real.
4. Later: Resend account (emails), domain, Stripe (online payments).
5. Backups: add the GitHub secrets `BACKUP_DATABASE_URL` and `BACKUP_PASSPHRASE` (steps in `docs/BACKUP.md`).
6. For each restaurant: Settings → legal details (company name, VAT number, privacy email). Have a lawyer look at the privacy/terms text once.
7. Optional, in Vercel → Settings → Environment Variables: `CRON_SECRET` (any long random text) so only Vercel can trigger the morning report.

## Next (in this order)

1. **Real-world test** once the owner has deployed: ordering page on real phones, table QR scanned with a camera, Android app + Epson printer, emails through Resend. Fix what it shows.
2. Before going live with each restaurant: import its menu from GloriaFood, fill hours, delivery areas, payments and legal details, print table QR codes.
3. After March: online payment when ordering (card via Stripe and/or Satispay Business API), as a paid add-on the restaurant turns on. The owner decided (12 Nov 2026) that for now payment happens on receipt: cash, card/Bancomat with the POS, Satispay.
4. Later, nice to have: delete/export one customer's data from the dashboard (GDPR requests are handled by hand until then).

Later (after March 2027): table reservations. The owner's 6 restaurants don't use reservations in GloriaFood (owner, 12 Nov 2026).

## Known gaps

- Visibility hours of categories/items are not imported from GloriaFood (the import reports how many had them).
- Delivery fee by distance, minimum-exposure/contactless options, Google ranking/website scanner: not planned for phase 1.
- iPhone version of the orders app: later.
