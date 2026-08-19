import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getAdminSessionUser, isAdminUnlocked } from '@/lib/auth/admin-gate';
import { roleHasPermission } from '@/lib/auth/permissions';
import { AdminNav } from '@/app/admin/counselling/page';
import MarketplaceProductForm from '@/components/admin/MarketplaceProductForm';
import { getAdminProductById, MarketplaceServiceError } from '@/lib/marketplace/service';

export const metadata = { title: 'Edit Marketplace Product | LoveCry' };

export const dynamic = 'force-dynamic';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function EditMarketplaceProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}) {
  if (!(await isAdminUnlocked())) redirect('/admin');
  const { id } = await params;
  const query = await searchParams;
  const admin = await getAdminSessionUser();
  const canWrite = admin ? roleHasPermission(admin.role, 'marketplace.write') : false;

  let product;
  try {
    product = await getAdminProductById(id);
  } catch (err) {
    if (err instanceof MarketplaceServiceError && err.status === 404) notFound();
    throw err;
  }

  const error = typeof query.error === 'string' ? query.error : null;
  const saved = query.saved === '1';

  return (
    <main className="min-h-screen bg-[#050505] px-6 pb-20 pt-28 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/admin/marketplace" className="text-sm text-[#f1328b]">
              ← Marketplace
            </Link>
            <h1 className="mt-4 text-3xl font-black">Edit product</h1>
            <p className="mt-2 text-sm text-white/55">Status: {product.status}</p>
          </div>
          <AdminNav />
        </div>
        {error ? (
          <p className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-100" role="alert">
            {error}
          </p>
        ) : null}
        {saved ? (
          <p className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
            Product updated.
          </p>
        ) : null}
        {!canWrite ? (
          <p className="mt-6 text-sm text-white/50">You have read-only access to marketplace products.</p>
        ) : null}
        <MarketplaceProductForm mode="edit" canWrite={canWrite} product={product} />
      </div>
    </main>
  );
}
