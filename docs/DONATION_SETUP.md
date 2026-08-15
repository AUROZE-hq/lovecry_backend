# LoveCry Donation Platform — Setup

## Phase status

| Phase | Status |
|------|--------|
| 0 Prep (nav, env) | Done |
| 1 Foundation (schema, admin gate) | Done |
| 2 Donate page + embed shell | Done |
| 3 Intent API + mock pay + success verify | Done |
| 4 Zeffy sync routes (stub) | Done |
| 5 Email confirmation stub | Done |
| 6 Receipt numbers + artifact files | Done |
| 7 Admin donations/donors/campaigns/receipts | Done |
| 8 Donor portal (email session stub) | Done |
| 9 Health + eligibility tests | Done |

**Still needs live credentials:** Hostinger `DATABASE_URL`, Zeffy API/embed, Resend (or other email), and optional `CHARITY_RECEIPTING_ENABLED=true`.

## Quick start

1. Copy `.env.example` → `.env`
2. `npm install`
3. `npm run test:eligibility`
4. `npm run dev`

### Try the flow today (no Zeffy yet)

1. Open `/donate`
2. Choose amount (try `$20` and `$5`)
3. Enter email + accept privacy
4. Click **Test donation flow (until Zeffy is connected)**
5. Land on `/donate/success` with server-verified status
6. Check `/admin` (password `lovecry-admin`) for the donation
7. Check `/donor` with the same email

### Hostinger MySQL

```
DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/DB_NAME"
npx prisma migrate dev --name init_donations
```

Until migrate runs, the app uses an **in-memory store** (resets when the server restarts).

### Zeffy tomorrow

```
ZEFFY_API_KEY=
ZEFFY_ORGANIZATION_ID=
ZEFFY_DEFAULT_EMBED_URL=
ZEFFY_DEFAULT_CAMPAIGN_ID=
ZEFFY_SYNC_ENABLED=true
```

### Routes

| Path | Purpose |
|------|---------|
| `/donate` | Public donation UI |
| `/donate/success` | Thank you (verifies reference server-side) |
| `/admin` | Password gate |
| `/admin/donations` | Stats, list, Zeffy sync, audit |
| `/admin/donors` | Donor emails |
| `/admin/campaigns` | Campaigns |
| `/admin/receipts` | Official receipts |
| `/donor` | Donor portal login |
| `/donor/donations` | Donor history |
| `/api/health` | Health check |

Default admin password: `lovecry-admin` (`ADMIN_TEMP_PASSWORD`).
