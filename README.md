# LoveCry website

Next.js site for LoveCry The Street Kids Organization.

## Features

- Marketing site (home, about, contact, donate)
- Donation platform (+ Donor Portal) — Zeffy keys tomorrow
- Member Portal
- **Counselling Book Now** (`/book-now`) — Calendar/Drive Google keys tomorrow

## Counselling (Book Now)

- Public flow: `/book-now` (stays on lovecry.ca)
- Manage / reschedule / cancel / sign: `/bookings/*`, `/consent/sign/*`
- Admin: `/admin/counselling` (same password gate as donations)
- Docs: `docs/BOOKING_ARCHITECTURE.md`, `docs/GOOGLE_CALENDAR_SETUP.md`, `docs/GOOGLE_DRIVE_SETUP.md`

Copy `.env.example` → `.env.local`. Google and Zeffy vars can stay empty until tomorrow.

```bash
npm install
npm run dev
```

Prisma (Hostinger MySQL when ready):

```bash
npm run db:generate
npm run db:push
```
