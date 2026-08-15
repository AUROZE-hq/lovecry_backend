# Privacy and security (counselling)

- Treat bookings/consent as highly sensitive.
- Tokens hashed at rest; appointment IDs not in public URLs.
- No public Drive links for signed forms.
- No clinical reasons in Calendar titles or email subjects.
- Audit every create/view/sign/cancel/admin action.
- HTTPS only in production; field encryption + Redis workers planned with Hostinger production hardening.

## Legal / privacy review flags

- Final PDF consent template wording.
- Whether signed PDFs may be emailed as attachments.
- Retention periods for signatures and IP logs.
- SMS provider terms (Canada) when SMS is enabled.
