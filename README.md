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
- Delivery areas with minimum order and fee, coupons, VAT included or added
- Checkout in 4 steps (details, order type, time, payment), prices recalculated and validated on the server
- Language from the device (Italian, English, Arabic with right-to-left layout)
- Live order tracking for the customer; restaurant screen with sound, 4-minute answer window, accept with prep time, decline/cancel with reason, ready, handed over
- Night pre-orders wait silently until opening time

Planned next: menu & settings editor, delivery map, emails, Android order-taking app with Epson printing, partner panel, GloriaFood menu import.
