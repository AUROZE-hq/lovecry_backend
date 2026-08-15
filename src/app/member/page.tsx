import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { MEMBER_COOKIE } from '@/lib/auth/member-gate';
import MemberLoginForm from '@/components/member/MemberLoginForm';

export const metadata = { title: 'Member Portal | LoveCry' };

export default async function MemberHomePage() {
  const email = (await cookies()).get(MEMBER_COOKIE)?.value;
  if (email) redirect('/member/dashboard');

  return (
    <main className="min-h-screen bg-[#050505] px-6 pb-20 pt-28 text-white">
      <MemberLoginForm />
    </main>
  );
}
