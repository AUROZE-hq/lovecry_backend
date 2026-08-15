# Donate · Donor Portal · Member Portal

## Navbar order
1. **Donate** → `/donate` — give money (Zeffy tomorrow)
2. **Donor Portal** → `/donor` — payment history & receipts
3. **Member Portal** → `/member` — events, counselling, member profile

## Donor Portal (`/donor`)
Login with donation email (session cookie).

| Page | Features |
|------|----------|
| `/donor/donations` | Gift history, status, references |
| `/donor/monthly` | Recurring gifts + cancel instructions |
| `/donor/receipts` | Official receipt numbers when issued |
| `/donor/profile` | Name, phone, marketing preference |

## Member Portal (`/member`)
Login with member email (+ optional name). Separate from donors.

| Page | Features |
|------|----------|
| `/member/dashboard` | Snapshot + announcements |
| `/member/events` | Browse events, register / cancel |
| `/member/counselling` | View slots, request / cancel session |
| `/member/profile` | Contact + emergency contact |

## Notes
- Data is in-memory until Hostinger MySQL + Prisma migrate.
- Zeffy payment management links will be wired when you add credentials.
- Donor and Member sessions are separate cookies.
