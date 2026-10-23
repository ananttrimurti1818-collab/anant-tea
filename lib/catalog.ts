import { db } from "@/lib/db";
import type { Product } from "@/lib/data";

export type CatalogCategory = {
  id: string;
  name: string;
  slug: string;
};

function toNumber(value: unknown) {
  return Number(value ?? 0);
}

export async function getCategories(): Promise<CatalogCategory[]> {
  const sql = db();
  const rows = await sql`
    SELECT id, "name", "slug"
    FROM "Category"
    ORDER BY "name" ASC
  `;

  return rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
  }));
}

export async function getProducts(options?: {
  featuredOnly?: boolean;
  categorySlug?: string;
}): Promise<Product[]> {
  const sql = db();

  const rows = options?.categorySlug
    ? await sql`
        SELECT
          p."id",
          p."name",
          p."slug",
          p."description",
          p."featured",
          p."isActive",
          c."name" AS category_name,
          c."slug" AS category_slug,
          pi."imageUrl" AS image_url,
          pi."sortOrder" AS image_sort_order,
          pv.id AS variant_id,
          pv."packSize" AS pack_size,
          pv."price" AS regular_price,
          pv."discountPrice" AS discount_price,
          pv."createdAt" AS variant_created_at
        FROM "Product" p
        INNER JOIN "Category" c ON c.id = p."categoryId"
        LEFT JOIN "ProductImage" pi
          ON pi."productId" = p."id"
          AND pi."isMain" = true
        LEFT JOIN "ProductVariant" pv ON pv."productId" = p."id"
        WHERE p."isActive" = true
          AND c."slug" = ${options.categorySlug}
          ${options.featuredOnly ? sql`AND p."featured" = true` : sql``}
        ORDER BY p."featured" DESC, p."createdAt" ASC, pv."createdAt" ASC
      `
    : await sql`
        SELECT
          p."id",
          p."name",
          p."slug",
          p."description",
          p."featured",
          p."isActive",
          c."name" AS category_name,
          c."slug" AS category_slug,
          pi."imageUrl" AS image_url,
          pi."sortOrder" AS image_sort_order,
          pv.id AS variant_id,
          pv."packSize" AS pack_size,
          pv."price" AS regular_price,
          pv."discountPrice" AS discount_price,
          pv."createdAt" AS variant_created_at
        FROM "Product" p
        INNER JOIN "Category" c ON c.id = p."categoryId"
        LEFT JOIN "ProductImage" pi
          ON pi."productId" = p."id"
          AND pi."isMain" = true
        LEFT JOIN "ProductVariant" pv ON pv."productId" = p."id"
        WHERE p."isActive" = true
          ${options?.featuredOnly ? sql`AND p."featured" = true` : sql``}
        ORDER BY p."featured" DESC, p."createdAt" ASC, pv."createdAt" ASC
      `;

  const products = new Map<string, Product>();

  for (const row of rows) {
    const id = String(row.id);
    const existing = products.get(id);

    if (!existing) {
      products.set(id, {
        id,
        name: String(row.name),
        slug: String(row.slug),
        description: String(row.description ?? ""),
        category: String(row.category_name ?? ""),
        badge: row.featured ? "Featured" : undefined,
        featured: Boolean(row.featured),
        image: String(row.image_url ?? "/products/family.svg"),
        variants: [],
      });
    }

    if (row.variant_id) {
      const product = products.get(id)!;
      product.variants.push({
        size: String(row.pack_size),
        price: row.discount_price !== null && row.discount_price !== undefined ? toNumber(row.discount_price) : toNumber(row.regular_price),
        ...(row.discount_price !== null && row.discount_price !== undefined && toNumber(row.discount_price) < toNumber(row.regular_price) ? { regularPrice: toNumber(row.regular_price) } : {}),
      });
    }
  }

  return Array.from(products.values()).filter((product) => product.variants.length > 0);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const products = await getProducts();
  return products.find((product) => product.slug === slug) ?? null;
}


export type GalleryPreviewItem = {
  id: string;
  title: string;
  imageUrl: string;
};

export async function getGalleryPreview(limit = 5): Promise<GalleryPreviewItem[]> {
  const sql = db();
  const rows = await sql`
    SELECT gi.id, gi.title, gi."imageUrl"
    FROM "GalleryImage" gi
    INNER JOIN "GalleryCategory" gc ON gc.id = gi."galleryCategoryId"
    WHERE gi.active = true AND gc.active = true
    ORDER BY gi.featured DESC, gc."displayOrder" ASC, gi."displayOrder" ASC, gi."createdAt" ASC
    LIMIT ${limit}
  `;

  return rows.map((row) => ({
    id: String(row.id),
    title: String(row.title ?? ""),
    imageUrl: String(row.imageUrl),
  }));
}
