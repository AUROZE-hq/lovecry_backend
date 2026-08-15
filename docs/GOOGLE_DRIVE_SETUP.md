# Google Drive setup (signed consents)

## Folder layout

```
LoveCry Counselling Records/
  Consent Form Templates/Active|Retired
  Signed Consent Forms/YYYY/MM - Month
  Cancelled Appointments/
  Exports/
```

## Permissions

- Never “Anyone with the link”.
- Restrict to authorized LoveCry staff Shared Drive.
- Clients download only via short-lived app-controlled links (not raw Drive URLs).

## Env

- `GOOGLE_SIGNED_CONSENT_FOLDER_ID`
- `GOOGLE_CONSENT_TEMPLATE_FOLDER_ID`
- Prefer `drive.file` scope; broaden only if required.

## File naming

`LC-CONSENT-2026-000001.pdf` — client names stay in the database, not the filename.

Upload is stubbed in `src/lib/google/drive.ts` until credentials arrive.
