/**
 * Donor/member portal authentication status.
 *
 * Current email-cookie gates are NOT production-safe for sensitive data.
 * Magic-link session auth is the intended next step (hash + expiry + HttpOnly session).
 * Portals remain available for UX shell only; do not treat cookie-email as verified identity.
 */
export const PORTAL_AUTH_STATUS = {
  member: 'INSECURE_EMAIL_COOKIE' as const,
  donor: 'INSECURE_EMAIL_COOKIE' as const,
  planned: 'MAGIC_LINK_SESSION' as const,
};
