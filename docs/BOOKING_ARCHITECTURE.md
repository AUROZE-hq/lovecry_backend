# Counselling booking architecture

LoveCry Book Now keeps the entire client experience on `https://www.lovecry.ca/book-now`.

## System of record

- **PostgreSQL / MySQL (Prisma)** — appointments, clients, consent status, Drive file IDs (schema in `prisma/schema.prisma`).
- **In-memory store** (`src/lib/counselling/store.ts`) — active until Hostinger `DATABASE_URL` migrate runs (same pattern as donations).
- **Google Calendar** — counsellor schedule surface (stubbed until credentials).
- **Google Drive** — signed consent storage (stubbed until credentials).

## Client flow

1. Select service → format → date → time (60m default).
2. Temporary hold (~10 minutes).
3. Client details + intake + crisis notice.
4. Consent (Policy B default: book now, sign by deadline).
5. Confirmation + secure manage / reschedule / cancel / sign links.

## Key modules

| Area | Path |
|------|------|
| Availability engine | `src/lib/counselling/availability.ts` |
| Booking service | `src/lib/counselling/service.ts` |
| Google stubs | `src/lib/google/*` |
| Public APIs | `src/app/api/public/counselling/*` |
| Book UI | `src/app/book-now` + `BookNowWizard` |
| Admin | `src/app/admin/counselling/*` |

## Double-booking protection

Holds + active appointments + Google free/busy (when live) + buffers. Hold conversion marks the hold when booking succeeds.

## Tomorrow (Google)

Paste `GOOGLE_*` env vars. Stub clients already call the same function shapes as live Calendar/Drive.
