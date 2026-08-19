import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAdminSessionUser, isAdminUnlocked } from '@/lib/auth/admin-gate';
import { roleHasPermission } from '@/lib/auth/permissions';
import { getAdminProducts } from '@/lib/marketplace/service';
import { formatMarketplacePrice } from '@/lib/marketplace/display';
import { AdminNav } from '@/app/admin/counselling/page';
import { isUnreachableDatabase } from '@/lib/db/prisma';
import type { MarketplaceProductView } from '@/lib/marketplace/types';

export const metadata = { title: 'Marketplace Admin | LoveCry' };

export const dynamic = 'force-dynamic';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminMarketplacePage({ searchParams }: { searchParams: SearchParams }) {
  if (!(await isAdminUnlocked())) redirect('/admin');
  const admin = await getAdminSessionUser();
  const canWrite = admin ? roleHasPermission(admin.role, 'marketplace.write') : false;
  let products: MarketplaceProductView[] = [];
  try {
    products = await getAdminProducts();
  } catch (err) {
    if (!isUnreachableDatabase(err)) throw err;
  }
  const params = await searchParams;
  const created = params.created === '1';
  const error = typeof params.error === 'string' ? params.error : null;

  return (
    <main className="min-h-screen bg-[#050505] px-6 pb-20 pt-28 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black">Marketplace</h1>
            <p className="mt-2 text-sm text-white/55">Create and review LoveCry merchandise products.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canWrite ? (
              <Link
                href="/admin/marketplace/new"
                className="rounded-full bg-gradient-to-r from-[#693492] to-[#f1328b] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white"
              >
                + Add Product
              </Link>
            ) : null}
            <AdminNav />
          </div>
        </div>

        {created ? (
          <p className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
            Product created.
          </p>
        ) : null}
        {error ? (
          <p className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-100">{error}</p>
        ) : null}

        <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/[0.04] text-[11px] uppercase tracking-wider text-white/45">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Featured</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-t border-white/10">
                  <td className="px-4 py-3">
                    <div className="font-semibold">{product.name}</div>
                    <div className="text-xs text-white/40">{product.slug}</div>
                  </td>
                  <td className="px-4 py-3">{product.status}</td>
                  <td className="px-4 py-3">{product.category || '—'}</td>
                  <td className="px-4 py-3">{formatMarketplacePrice(product.priceCents, product.currency)}</td>
                  <td className="px-4 py-3">{product.featured ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3 text-xs text-white/45">{product.updatedAt.toISOString().slice(0, 10)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <Link href={`/admin/marketplace/${product.id}/edit`} className="text-[#f1328b] hover:underline">
                        Edit
                      </Link>
                      {product.status === 'PUBLISHED' ? (
                        <Link href={`/marketplace/${product.slug}`} className="text-white/70 hover:underline" target="_blank">
                          Preview
                        </Link>
                      ) : (
                        <span className="text-white/35">Draft</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!products.length ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-white/40">
                    No marketplace products yet. Add a product to publish it on /marketplace.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
