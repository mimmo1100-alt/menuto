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
| Hosting prep | Migrations on deploy, `/setup` first run | Production build on an empty DB |

## Waiting on the owner

1. **Deploy**: vercel.com → import `menuto` → Storage: add Neon Postgres → Redeploy → open the site → `/setup`.
2. Install the APK from the latest GitHub release on the restaurant phone; pair the Epson printer; test print.
3. GloriaFood "Fetch Menu" key of the demo restaurant GUSTO GIUSTO, to test the import for real.
4. Later: Resend account (emails), domain, Stripe (online payments).

## Next (in this order)

1. Sales reports for restaurants (trend, by payment method, top items) and the end-of-day email.
2. QR ordering at the table (per-table codes, PDF to print).
3. Table reservations.
4. Online payments with Stripe (paid add-on).
5. Turn the Playwright scripts into `tests/e2e` + CI.
6. Before the restaurants go live: rate limiting on public APIs, password reset, staff accounts from the dashboard, privacy/terms pages (GDPR), backups.

## Known gaps

- Visibility hours of categories/items are not imported from GloriaFood (the import reports how many had them).
- Delivery fee by distance, minimum-exposure/contactless options, Google ranking/website scanner: not planned for phase 1.
- iPhone version of the orders app: later.
