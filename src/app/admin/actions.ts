'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_SESSION_COOKIE, destroyAdminSession } from '@/lib/auth/admin-gate';

export async function logoutAdmin() {
  const jar = await cookies();
  const token = jar.get(ADMIN_SESSION_COOKIE)?.value;
  await destroyAdminSession(token);
  jar.delete(ADMIN_SESSION_COOKIE);
  jar.delete('lovecry_admin_gate');
  redirect('/admin');
}
