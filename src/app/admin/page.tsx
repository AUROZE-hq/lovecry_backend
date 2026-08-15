import { redirect } from 'next/navigation';
import { isAdminUnlocked } from '@/lib/auth/admin-gate';
import AdminLoginForm from '@/components/admin/AdminLoginForm';

export const metadata = {
  title: 'Admin | LoveCry Donations',
};

export default async function AdminHomePage() {
  const unlocked = await isAdminUnlocked();

  if (!unlocked) {
    return (
      <main className="min-h-screen bg-[#050505] px-6 pb-20 pt-28 text-white">
        <AdminLoginForm />
      </main>
    );
  }

  redirect('/admin/donations');
}
