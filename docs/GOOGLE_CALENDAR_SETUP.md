# Google Calendar setup (LoveCry Counselling) — OAuth 2.0

## Goal

Dedicated counselling calendar synchronized via **server-side OAuth 2.0** (not service accounts, not public iCal).

## One-time Google Cloud setup

1. Create/select a Google Cloud project.
2. Enable **Google Calendar API**.
3. Configure the OAuth consent screen (Internal for Workspace, or External as required).
4. Create **OAuth client ID** → Application type **Web application**.
5. Add authorized redirect URIs:
   - Local: `http://localhost:3000/api/integrations/google-calendar/callback`
   - Production: `https://www.lovecry.ca/api/integrations/google-calendar/callback`
6. Copy Client ID + Client Secret into Hostinger / `.env` (never commit secrets).

## Environment

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://www.lovecry.ca/api/integrations/google-calendar/callback
GOOGLE_CALENDAR_ID=
GOOGLE_CALENDAR_TIMEZONE=America/Toronto
GOOGLE_TOKEN_ENCRYPTION_KEY=
AUTH_SECRET=
```

## Scopes (minimum)

- `https://www.googleapis.com/auth/calendar.events`
- `https://www.googleapis.com/auth/calendar.readonly`

Do **not** request Gmail, Contacts, or Drive scopes in this flow.

## Admin connection

1. Sign in to `/admin` with an AdminUser account.
2. Open **Counselling → Google Calendar**.
3. Click **Connect** → approve offline access → refresh token is encrypted and stored in MySQL.
4. Use **Test Connection** to verify free/busy + calendar metadata.

## Event rules

- Summary: `LoveCry Counselling Appointment`
- Time zone: `America/Toronto`
- Private visibility; no clinical/intake content
- LoveCry email system sends branded confirmations (do not auto-add Google attendees)

## Drive

Consent Drive folders remain a **separate** incomplete integration (`GOOGLE_SIGNED_CONSENT_FOLDER_ID`). They are not authorized through Calendar OAuth.
