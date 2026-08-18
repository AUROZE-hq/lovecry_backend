import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';

function loadEnv() {
  const envPath = resolve(process.cwd(), '.env');
  try {
    const text = readFileSync(envPath, 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq < 1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // Prisma will still read DATABASE_URL if already present.
  }
}

loadEnv();

const prisma = new PrismaClient();

const SIZES = ['S', 'M', 'L', 'XL', '2XL'];

async function main() {
  const product = await prisma.marketplaceProduct.upsert({
    where: { slug: 'lovecry-soul-family-tee' },
    create: {
      slug: 'lovecry-soul-family-tee',
      name: 'LoveCry Soul Family Tee',
      subtitle: 'Black LoveCry T-shirt',
      badge: 'FIRST LOVECRY DROP',
      category: 'Apparel',
      currency: 'CAD',
      priceCents: null,
      status: 'PUBLISHED',
      featured: true,
      inStock: false,
      description:
        'A simple black tee carrying the LoveCry heart on the front and the message “We are stronger than blood. We’re a SOUL FAMILY” across the back.',
      messageEyebrow: 'THE MESSAGE',
      messageTitle: 'We are stronger than blood.',
      messageSubtitle: 'We’re a SOUL FAMILY',
      messageBody:
        'The shirt keeps the front minimal and lets the back carry LoveCry’s core message in full.',
      images: {
        create: [
          {
            url: '/ProductImageFront.png',
            altText: 'LoveCry Soul Family Tee front',
            role: 'FRONT',
            sortOrder: 0,
          },
          {
            url: '/ProductImageBack.png',
            altText: 'LoveCry Soul Family Tee back',
            role: 'BACK',
            sortOrder: 1,
          },
        ],
      },
      sizes: {
        create: SIZES.map((label, sortOrder) => ({
          label,
          sortOrder,
          active: true,
        })),
      },
    },
    update: {
      name: 'LoveCry Soul Family Tee',
      subtitle: 'Black LoveCry T-shirt',
      badge: 'FIRST LOVECRY DROP',
      category: 'Apparel',
      currency: 'CAD',
      priceCents: null,
      status: 'PUBLISHED',
      featured: true,
      inStock: false,
      description:
        'A simple black tee carrying the LoveCry heart on the front and the message “We are stronger than blood. We’re a SOUL FAMILY” across the back.',
      messageEyebrow: 'THE MESSAGE',
      messageTitle: 'We are stronger than blood.',
      messageSubtitle: 'We’re a SOUL FAMILY',
      messageBody:
        'The shirt keeps the front minimal and lets the back carry LoveCry’s core message in full.',
    },
  });

  if (product.featured) {
    await prisma.marketplaceProduct.updateMany({
      where: { featured: true, id: { not: product.id } },
      data: { featured: false },
    });
  }

  await prisma.marketplaceProductImage.deleteMany({ where: { productId: product.id } });
  await prisma.marketplaceProductSize.deleteMany({ where: { productId: product.id } });

  await prisma.marketplaceProductImage.createMany({
    data: [
      {
        productId: product.id,
        url: '/ProductImageFront.png',
        altText: 'LoveCry Soul Family Tee front',
        role: 'FRONT',
        sortOrder: 0,
      },
      {
        productId: product.id,
        url: '/ProductImageBack.png',
        altText: 'LoveCry Soul Family Tee back',
        role: 'BACK',
        sortOrder: 1,
      },
    ],
  });

  await prisma.marketplaceProductSize.createMany({
    data: SIZES.map((label, sortOrder) => ({
      productId: product.id,
      label,
      sortOrder,
      active: true,
    })),
  });

  console.log(`Seeded marketplace product: ${product.slug} (${product.id})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
