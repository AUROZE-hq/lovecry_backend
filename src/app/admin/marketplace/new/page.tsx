import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAdminSessionUser, isAdminUnlocked } from '@/lib/auth/admin-gate';
import { roleHasPermission } from '@/lib/auth/permissions';
import { AdminNav } from '@/app/admin/counselling/page';
import MarketplaceProductForm from '@/components/admin/MarketplaceProductForm';

export const metadata = { title: 'Add Marketplace Product | LoveCry' };

export const dynamic = 'force-dynamic';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function NewMarketplaceProductPage({ searchParams }: { searchParams: SearchParams }) {
  if (!(await isAdminUnlocked())) redirect('/admin');
  const admin = await getAdminSessionUser();
  const canWrite = admin ? roleHasPermission(admin.role, 'marketplace.write') : false;
  const params = await searchParams;
  const error = typeof params.error === 'string' ? params.error : null;

  return (
    <main className="min-h-screen bg-[#050505] px-6 pb-20 pt-28 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/admin/marketplace" className="text-sm text-[#f1328b]">
              ← Marketplace
            </Link>
            <h1 className="mt-4 text-3xl font-black">Add product</h1>
          </div>
          <AdminNav />
        </div>
        {error ? (
          <p className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-100" role="alert">
            {error}
          </p>
        ) : null}
        {!canWrite ? (
          <p className="mt-6 text-sm text-white/50">You do not have permission to add marketplace products.</p>
        ) : (
          <MarketplaceProductForm canWrite={canWrite} />
        )}
      </div>
    </main>
  );
}
