import type { MarketplaceProduct, MarketplaceProductImage, MarketplaceProductSize, Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { marketplaceProductWriteSchema, parsePriceToCents, type MarketplaceProductWriteInput } from './schemas';
import type { MarketplaceProductView } from './types';

export class MarketplaceServiceError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

const productInclude = {
  images: { orderBy: { sortOrder: 'asc' as const } },
  sizes: { orderBy: { sortOrder: 'asc' as const } },
} satisfies Prisma.MarketplaceProductInclude;

type ProductRow = MarketplaceProduct & {
  images: MarketplaceProductImage[];
  sizes: MarketplaceProductSize[];
};

function toView(row: ProductRow, publicOnlySizes = false): MarketplaceProductView {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    subtitle: row.subtitle,
    description: row.description,
    badge: row.badge,
    category: row.category,
    currency: row.currency,
    priceCents: row.priceCents,
    status: row.status,
    featured: row.featured,
    inStock: row.inStock,
    messageEyebrow: row.messageEyebrow,
    messageTitle: row.messageTitle,
    messageSubtitle: row.messageSubtitle,
    messageBody: row.messageBody,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    images: row.images,
    sizes: publicOnlySizes ? row.sizes.filter((size) => size.active) : row.sizes,
  };
}

function parseWriteInput(raw: unknown): MarketplaceProductWriteInput {
  const parsed = marketplaceProductWriteSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new MarketplaceServiceError(first?.message || 'Invalid product details', 400);
  }
  return parsed.data;
}

export function formDataToProductInput(formData: FormData): Record<string, unknown> {
  const sizes = formData
    .getAll('sizes')
    .map((value) => String(value))
    .filter(Boolean);
  const priceCents = parsePriceToCents(formData.get('price'));
  if (Number.isNaN(priceCents)) {
    throw new MarketplaceServiceError('Enter a valid price, or leave it blank.', 400);
  }

  return {
    name: String(formData.get('name') || ''),
    slug: String(formData.get('slug') || ''),
    subtitle: String(formData.get('subtitle') || ''),
    description: String(formData.get('description') || ''),
    category: String(formData.get('category') || ''),
    badge: String(formData.get('badge') || ''),
    currency: String(formData.get('currency') || 'CAD'),
    priceCents,
    frontImageUrl: String(formData.get('frontImageUrl') || ''),
    frontImageAlt: String(formData.get('frontImageAlt') || ''),
    backImageUrl: String(formData.get('backImageUrl') || ''),
    backImageAlt: String(formData.get('backImageAlt') || ''),
    sizes,
    status: String(formData.get('status') || 'DRAFT'),
    featured: formData.get('featured') === 'on' || formData.get('featured') === 'true',
    inStock: formData.get('inStock') === 'on' || formData.get('inStock') === 'true',
    messageEyebrow: String(formData.get('messageEyebrow') || ''),
    messageTitle: String(formData.get('messageTitle') || ''),
    messageSubtitle: String(formData.get('messageSubtitle') || ''),
    messageBody: String(formData.get('messageBody') || ''),
  };
}

export async function getPublishedProducts(): Promise<MarketplaceProductView[]> {
  const rows = await prisma.marketplaceProduct.findMany({
    where: { status: 'PUBLISHED' },
    include: productInclude,
    orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
  });
  return rows.map((row) => toView(row, true));
}

export async function getFeaturedProduct(): Promise<MarketplaceProductView | null> {
  const featured = await prisma.marketplaceProduct.findFirst({
    where: { status: 'PUBLISHED', featured: true },
    include: productInclude,
    orderBy: { updatedAt: 'desc' },
  });
  if (featured) return toView(featured, true);

  const first = await prisma.marketplaceProduct.findFirst({
    where: { status: 'PUBLISHED' },
    include: productInclude,
    orderBy: { createdAt: 'desc' },
  });
  return first ? toView(first, true) : null;
}

export async function getPublishedProductBySlug(slug: string): Promise<MarketplaceProductView | null> {
  const row = await prisma.marketplaceProduct.findFirst({
    where: { slug, status: 'PUBLISHED' },
    include: productInclude,
  });
  return row ? toView(row, true) : null;
}

export async function getAdminProducts(): Promise<MarketplaceProductView[]> {
  const rows = await prisma.marketplaceProduct.findMany({
    include: productInclude,
    orderBy: { updatedAt: 'desc' },
  });
  return rows.map((row) => toView(row));
}

export async function createMarketplaceProduct(
  raw: unknown,
  createdByAdminId?: string | null
): Promise<MarketplaceProductView> {
  const input = parseWriteInput(raw);

  try {
    const created = await prisma.$transaction(async (tx) => {
      if (input.featured) {
        await tx.marketplaceProduct.updateMany({
          where: { featured: true },
          data: { featured: false },
        });
      }

      return tx.marketplaceProduct.create({
        data: {
          name: input.name,
          slug: input.slug,
          subtitle: input.subtitle,
          description: input.description,
          category: input.category,
          badge: input.badge,
          currency: input.currency,
          priceCents: input.priceCents,
          status: input.status,
          featured: input.featured,
          inStock: input.inStock,
          messageEyebrow: input.messageEyebrow,
          messageTitle: input.messageTitle,
          messageSubtitle: input.messageSubtitle,
          messageBody: input.messageBody,
          createdByAdminId: createdByAdminId ?? undefined,
          images: {
            create: [
              {
                url: input.frontImageUrl,
                altText: input.frontImageAlt || `${input.name} front`,
                role: 'FRONT',
                sortOrder: 0,
              },
              {
                url: input.backImageUrl,
                altText: input.backImageAlt || `${input.name} back`,
                role: 'BACK',
                sortOrder: 1,
              },
            ],
          },
          sizes: {
            create: input.sizes.map((label, index) => ({
              label,
              sortOrder: index,
              active: true,
            })),
          },
        },
        include: productInclude,
      });
    });

    return toView(created);
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code?: string }).code === 'P2002') {
      throw new MarketplaceServiceError('A product with this slug already exists.', 409);
    }
    throw err;
  }
}

export async function getAdminProductById(id: string): Promise<MarketplaceProductView> {
  const row = await prisma.marketplaceProduct.findUnique({
    where: { id },
    include: productInclude,
  });
  if (!row) throw new MarketplaceServiceError('Product not found', 404);
  return toView(row);
}

export async function updateMarketplaceProduct(id: string, raw: unknown): Promise<MarketplaceProductView> {
  const input = parseWriteInput(raw);
  const existing = await prisma.marketplaceProduct.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) throw new MarketplaceServiceError('Product not found', 404);

  try {
    const updated = await prisma.$transaction(async (tx) => {
      if (input.featured) {
        await tx.marketplaceProduct.updateMany({
          where: { featured: true, id: { not: id } },
          data: { featured: false },
        });
      }

      await tx.marketplaceProduct.update({
        where: { id },
        data: {
          name: input.name,
          slug: input.slug,
          subtitle: input.subtitle ?? null,
          description: input.description,
          category: input.category ?? null,
          badge: input.badge ?? null,
          currency: input.currency,
          priceCents: input.priceCents,
          status: input.status,
          featured: input.featured,
          inStock: input.inStock,
          messageEyebrow: input.messageEyebrow ?? null,
          messageTitle: input.messageTitle ?? null,
          messageSubtitle: input.messageSubtitle ?? null,
          messageBody: input.messageBody ?? null,
        },
      });

      await tx.marketplaceProductImage.deleteMany({
        where: { productId: id, role: { in: ['FRONT', 'BACK'] } },
      });
      await tx.marketplaceProductImage.createMany({
        data: [
          {
            productId: id,
            url: input.frontImageUrl,
            altText: input.frontImageAlt || `${input.name} front`,
            role: 'FRONT',
            sortOrder: 0,
          },
          {
            productId: id,
            url: input.backImageUrl,
            altText: input.backImageAlt || `${input.name} back`,
            role: 'BACK',
            sortOrder: 1,
          },
        ],
      });

      await tx.marketplaceProductSize.deleteMany({ where: { productId: id } });
      await tx.marketplaceProductSize.createMany({
        data: input.sizes.map((label, index) => ({
          productId: id,
          label,
          sortOrder: index,
          active: true,
        })),
      });

      return tx.marketplaceProduct.findUniqueOrThrow({
        where: { id },
        include: productInclude,
      });
    });

    return toView(updated);
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code?: string }).code === 'P2002') {
      throw new MarketplaceServiceError('A product with this slug already exists.', 409);
    }
    throw err;
  }
}
