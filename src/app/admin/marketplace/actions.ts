'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { AuthError, requirePermission } from '@/lib/auth/permissions';
import {
  createMarketplaceProduct,
  formDataToProductInput,
  MarketplaceServiceError,
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
