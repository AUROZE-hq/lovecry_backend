/**
 * Donor portal authentication status.
 * Production donor portal uses HttpOnly DonorSession cookies + hashed auth tokens.
 */
export const PORTAL_AUTH_STATUS = {
  member: 'INSECURE_EMAIL_COOKIE' as const,
  donor: 'DONOR_SESSION' as const,
  planned: 'MAGIC_LINK_SESSION' as const,
};
