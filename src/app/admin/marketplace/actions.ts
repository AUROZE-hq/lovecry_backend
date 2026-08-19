'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { AuthError, requirePermission } from '@/lib/auth/permissions';
import {
  createMarketplaceProduct,
  formDataToProductInput,
  getAdminProductById,
  MarketplaceServiceError,
  updateMarketplaceProduct,
} from '@/lib/marketplace/service';

export async function createMarketplaceProductAction(formData: FormData) {
  try {
    const admin = await requirePermission('marketplace.write');
    const product = await createMarketplaceProduct(formDataToProductInput(formData), admin.id);
    revalidatePath('/marketplace');
    revalidatePath(`/marketplace/${product.slug}`);
    revalidatePath('/admin/marketplace');
    redirect('/admin/marketplace?created=1');
  } catch (err) {
    if (err instanceof AuthError) redirect('/admin');
    if (err instanceof MarketplaceServiceError) {
      redirect(`/admin/marketplace/new?error=${encodeURIComponent(err.message)}`);
    }
    throw err;
  }
}

export async function updateMarketplaceProductAction(formData: FormData) {
  const productId = String(formData.get('productId') || '');
  try {
    await requirePermission('marketplace.write');
    if (!productId) throw new MarketplaceServiceError('Product not found', 404);
    const existing = await getAdminProductById(productId);
    const product = await updateMarketplaceProduct(productId, formDataToProductInput(formData));
    revalidatePath('/marketplace');
    revalidatePath(`/marketplace/${existing.slug}`);
    revalidatePath(`/marketplace/${product.slug}`);
    revalidatePath('/admin/marketplace');
    revalidatePath(`/admin/marketplace/${product.id}/edit`);
    redirect(`/admin/marketplace/${product.id}/edit?saved=1`);
  } catch (err) {
    if (err instanceof AuthError) redirect('/admin');
    if (err instanceof MarketplaceServiceError) {
      const fallback = productId || 'missing';
      redirect(`/admin/marketplace/${fallback}/edit?error=${encodeURIComponent(err.message)}`);
    }
    throw err;
  }
}
