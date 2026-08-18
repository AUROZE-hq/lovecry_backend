import type { AdminSessionUser } from '@/lib/auth/admin-gate';
import { AuthError, requireAdmin } from '@/lib/auth/admin-gate';

/**
 * Permission matrix (enforced server-side):
 *
 * SUPER_ADMIN      — all mutations
 * ADMIN            — donations + counselling admin (not necessarily user mgmt)
 * COUNSELLOR_ADMIN — counselling settings/availability/appointments/consent/google
 * READ_ONLY        — no mutations
 */

export type AdminPermission =
  | 'counselling.write'
  | 'counselling.google'
  | 'donations.write'
  | 'events.write'
  | 'marketplace.write'
  | 'admin.users';

const ROLE_PERMISSIONS: Record<AdminSessionUser['role'], AdminPermission[]> = {
  SUPER_ADMIN: [
    'counselling.write',
    'counselling.google',
    'donations.write',
    'events.write',
    'marketplace.write',
    'admin.users',
  ],
  ADMIN: ['counselling.write', 'counselling.google', 'donations.write', 'events.write', 'marketplace.write'],
  COUNSELLOR_ADMIN: ['counselling.write', 'counselling.google'],
  READ_ONLY: [],
};

export function roleHasPermission(
  role: AdminSessionUser['role'],
  permission: AdminPermission
): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export async function requirePermission(permission: AdminPermission): Promise<AdminSessionUser> {
  const user = await requireAdmin();
  if (!roleHasPermission(user.role, permission)) {
    throw new AuthError('Forbidden', 403);
  }
  return user;
}

export { AuthError };
