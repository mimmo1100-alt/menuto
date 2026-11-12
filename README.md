# Menuto

Online ordering for restaurants: customer ordering page, restaurant dashboard, order-taking app and partner (reseller) panel.

## Run locally

```bash
cp .env.example .env          # point DATABASE_URL at a Postgres 16 database
npm install
npx prisma migrate dev        # create tables
npm run seed                  # demo restaurant + logins
npm run dev
```

- Customer page: http://localhost:3000/r/trattoria-da-nino
- Restaurant orders: http://localhost:3000/login — `owner@menuto.test` / `demo1234` (partner: `partner@menuto.test`)

## What's in phase 1 so far

- Menu with sizes, reusable option groups (min/max, required, preselected), half & half pizza, sold-out items/options, labels
- Opening hours per service, special days, pause, scheduled orders with time slots (restaurant time zone)
- Delivery areas drawn on a map (circle or free shape) with minimum order, fee and time; the customer drops a pin and the area is picked on the server (lowest minimum wins where areas overlap)
- Coupons (percent, fixed, free delivery), VAT included or added
- Checkout in 4 steps (details, order type, time, payment), prices recalculated and validated on the server
- Language from the device (Italian, English, Arabic with right-to-left layout)
- Live order tracking for the customer; restaurant screen with sound, 4-minute answer window, accept with prep time, decline/cancel with reason, ready, handed over
- Night pre-orders wait silently until opening time
- Emails to the customer (received, confirmed with time, declined/canceled with reason, missed, ready) and to the restaurant (new order), in the customer's language. Set RESEND_API_KEY and EMAIL_FROM to send; otherwise they are stored in the EmailLog table
- Website button (`/embed.js`), ordering link and QR code on the dashboard's Publish page

Maps use OpenStreetMap tiles and Nominatim address search. Both are fine for testing; before going live with many restaurants, switch to a paid tile/geocoding provider (their free services have strict usage limits).

Planned next: Android order-taking app with Epson printing, partner panel, GloriaFood menu import.
