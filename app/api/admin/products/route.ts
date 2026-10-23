import { requireAdmin } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function number(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function bool(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeVariants(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((variant) => ({
      id: text((variant as Record<string, unknown>)?.id),
      packSize: text((variant as Record<string, unknown>)?.packSize),
      price: number((variant as Record<string, unknown>)?.price),
      discountPrice: (variant as Record<string, unknown>)?.discountPrice === null || (variant as Record<string, unknown>)?.discountPrice === undefined || (variant as Record<string, unknown>)?.discountPrice === "" ? null : number((variant as Record<string, unknown>)?.discountPrice),
    }))
    .filter((variant) => variant.packSize && variant.price >= 0);
}

function normalizeImages(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((image, index) => ({
      id: text((image as Record<string, unknown>)?.id),
      imageUrl: text((image as Record<string, unknown>)?.imageUrl),
      isMain: bool((image as Record<string, unknown>)?.isMain, index === 0),
      sortOrder: number((image as Record<string, unknown>)?.sortOrder, index),
    }))
    .filter((image) => image.imageUrl);
}

async function getProduct(id: string) {
  const sql = db();

  const products = await sql`
    SELECT
      p."id",
      p."name",
      p."slug",
      p."description",
      p."featured",
      p."isActive",
      p."categoryId",
      c."name" AS category_name,
      c."slug" AS category_slug,
      p."createdAt",
      p."updatedAt"
    FROM "Product" p
    LEFT JOIN "Category" c ON c.id = p."categoryId"
    WHERE p."id" = ${id}
    LIMIT 1
  `;

  if (!products[0]) return null;

  const variants = await sql`
    SELECT id, "packSize", price, "discountPrice", "createdAt", "updatedAt"
    FROM "ProductVariant"
    WHERE "productId" = ${id}
    ORDER BY "createdAt" ASC
  `;

  const images = await sql`
    SELECT id, "imageUrl", "isMain", "sortOrder", "createdAt", "updatedAt"
    FROM "ProductImage"
    WHERE "productId" = ${id}
    ORDER BY "sortOrder" ASC, "createdAt" ASC
  `;

  return {
    id: String(products[0].id),
    name: String(products[0].name),
    slug: String(products[0].slug),
    description: String(products[0].description ?? ""),
    featured: Boolean(products[0].featured),
    isActive: Boolean(products[0].isActive),
    categoryId: products[0].categoryId ? String(products[0].categoryId) : "",
    category: products[0].category_name ? String(products[0].category_name) : "",
    categorySlug: products[0].category_slug ? String(products[0].category_slug) : "",
    createdAt: products[0].createdAt,
    updatedAt: products[0].updatedAt,
    variants: variants.map((variant) => ({
      id: String(variant.id),
      packSize: String(variant.packSize),
      price: Number(variant.price),
      discountPrice: variant.discountPrice === null || variant.discountPrice === undefined ? null : Number(variant.discountPrice),
    })),
    images: images.map((image) => ({
      id: String(image.id),
      imageUrl: String(image.imageUrl),
      isMain: Boolean(image.isMain),
      sortOrder: Number(image.sortOrder ?? 0),
    })),
  };
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const sql = db();

    const rows = await sql`
      SELECT
        p."id",
        p."name",
        p."slug",
        p."description",
        p."featured",
        p."isActive",
        p."categoryId",
        c."name" AS category_name,
        c."slug" AS category_slug,
        p."createdAt",
        p."updatedAt"
      FROM "Product" p
      LEFT JOIN "Category" c ON c.id = p."categoryId"
      ORDER BY p."createdAt" DESC
    `;

    const result = [];

    for (const row of rows) {
      const id = String(row.id);

      const [variants, images] = await Promise.all([
        sql`
          SELECT id, "packSize", price, "discountPrice"
          FROM "ProductVariant"
          WHERE "productId" = ${id}
          ORDER BY "createdAt" ASC
        `,
        sql`
          SELECT id, "imageUrl", "isMain", "sortOrder"
          FROM "ProductImage"
          WHERE "productId" = ${id}
          ORDER BY "sortOrder" ASC, "createdAt" ASC
        `,
      ]);

      result.push({
        id,
        name: String(row.name),
        slug: String(row.slug),
        description: String(row.description ?? ""),
        featured: Boolean(row.featured),
        isActive: Boolean(row.isActive),
        categoryId: row.categoryId ? String(row.categoryId) : "",
        category: row.category_name ? String(row.category_name) : "Uncategorized",
        categorySlug: row.category_slug ? String(row.category_slug) : "",
        variants: variants.map((variant) => ({
          id: String(variant.id),
          packSize: String(variant.packSize),
          price: Number(variant.price),
          discountPrice: variant.discountPrice === null || variant.discountPrice === undefined ? null : Number(variant.discountPrice),
        })),
        images: images.map((image) => ({
          id: String(image.id),
          imageUrl: String(image.imageUrl),
          isMain: Boolean(image.isMain),
          sortOrder: Number(image.sortOrder ?? 0),
        })),
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      });
    }

    return NextResponse.json({ products: result });
  } catch (error) {
    console.error("GET /api/admin/products failed", error);
    return NextResponse.json({ error: "Unable to load products." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const body = await request.json();
    const name = text(body.name);
    const description = text(body.description);
    const categoryId = text(body.categoryId);
    const requestedSlug = text(body.slug);
    const featured = bool(body.featured);
    const isActive = body.isActive === undefined ? true : bool(body.isActive, true);
    const variants = normalizeVariants(body.variants);
    const images = normalizeImages(body.images);

    if (!name) {
      return NextResponse.json({ error: "Product name is required." }, { status: 400 });
    }

    if (!categoryId) {
      return NextResponse.json({ error: "Category is required." }, { status: 400 });
    }

    if (variants.length === 0) {
      return NextResponse.json({ error: "Add at least one pack-size variant." }, { status: 400 });
    }

    const sql = db();
    const slugBase = slugify(requestedSlug || name);
    if (!slugBase) {
      return NextResponse.json({ error: "A valid product slug could not be generated." }, { status: 400 });
    }

    const category = await sql`
      SELECT id FROM "Category" WHERE id = ${categoryId} LIMIT 1
    `;

    if (!category[0]) {
      return NextResponse.json({ error: "Selected category does not exist." }, { status: 400 });
    }

    const existingSlug = await sql`
      SELECT id FROM "Product" WHERE slug = ${slugBase} LIMIT 1
    `;

    const slug = existingSlug[0] ? `${slugBase}-${crypto.randomUUID().slice(0, 6)}` : slugBase;
    const productId = crypto.randomUUID();

    await sql.begin(async (transaction) => {
      await transaction`
        INSERT INTO "Product" ("id", "name", "slug", "description", "featured", "categoryId", "createdAt", "updatedAt", "isActive")
        VALUES (${productId}, ${name}, ${slug}, ${description}, ${featured}, ${categoryId}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ${isActive})
      `;

      for (let index = 0; index < variants.length; index += 1) {
        const variant = variants[index];
        await transaction`
          INSERT INTO "ProductVariant" ("id", "price", "discountPrice", "stock", "productId", "createdAt", "updatedAt", "packSize")
          VALUES (${crypto.randomUUID()}, ${variant.price}, ${variant.discountPrice !== null && variant.discountPrice < variant.price ? variant.discountPrice : null}, 0, ${productId}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ${variant.packSize})
        `;
      }

      const mainIndex = images.findIndex((image) => image.isMain);
      const normalizedImages = images.map((image, index) => ({ ...image, isMain: mainIndex >= 0 ? index === mainIndex : index === 0 }));

      for (let index = 0; index < normalizedImages.length; index += 1) {
        const image = normalizedImages[index];
        await transaction`
          INSERT INTO "ProductImage" ("id", "imageUrl", "isMain", "sortOrder", "productId", "createdAt", "updatedAt")
          VALUES (${crypto.randomUUID()}, ${image.imageUrl}, ${image.isMain}, ${index}, ${productId}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `;
      }
    });

    return NextResponse.json({ product: await getProduct(productId) }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/products failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create product." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const body = await request.json();
    const id = text(body.id);

    if (!id) {
      return NextResponse.json({ error: "Product ID is required." }, { status: 400 });
    }

    const name = text(body.name);
    const description = text(body.description);
    const categoryId = text(body.categoryId);
    const requestedSlug = text(body.slug);
    const featured = bool(body.featured);
    const isActive = bool(body.isActive, true);
    const variants = normalizeVariants(body.variants);
    const images = normalizeImages(body.images);

    if (!name || !categoryId || variants.length === 0) {
      return NextResponse.json({ error: "Name, category and at least one variant are required." }, { status: 400 });
    }

    const sql = db();
    const current = await sql`SELECT id, slug FROM "Product" WHERE id = ${id} LIMIT 1`;
    if (!current[0]) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const category = await sql`SELECT id FROM "Category" WHERE id = ${categoryId} LIMIT 1`;
    if (!category[0]) {
      return NextResponse.json({ error: "Selected category does not exist." }, { status: 400 });
    }

    const slugBase = slugify(requestedSlug || name);
    const conflictingSlug = await sql`
      SELECT id FROM "Product" WHERE slug = ${slugBase} AND id <> ${id} LIMIT 1
    `;
    const slug = conflictingSlug[0] ? `${slugBase}-${crypto.randomUUID().slice(0, 6)}` : slugBase;

    await sql.begin(async (transaction) => {
      await transaction`
        UPDATE "Product"
        SET "name" = ${name},
            "slug" = ${slug},
            "description" = ${description},
            "featured" = ${featured},
            "categoryId" = ${categoryId},
            "isActive" = ${isActive},
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = ${id}
      `;

      const existingVariants = await transaction`
        SELECT id
        FROM "ProductVariant"
        WHERE "productId" = ${id}
      `;
      const incomingVariantIds = new Set(variants.map((variant) => variant.id).filter(Boolean));

      for (const existingVariant of existingVariants) {
        const existingId = String(existingVariant.id);
        if (!incomingVariantIds.has(existingId)) {
          const referenced = await transaction`
            SELECT COUNT(*)::bigint AS count
            FROM "OrderItem"
            WHERE "variantId" = ${existingId}
          `;
          if (Number(referenced[0].count) > 0) {
            throw new Error(`Pack size ${existingId} is referenced by an existing order. Keep it in the product instead of removing it.`);
          }
          await transaction`DELETE FROM "ProductVariant" WHERE id = ${existingId}`;
        }
      }

      for (const variant of variants) {
        if (variant.id) {
          const existing = await transaction`
            SELECT id
            FROM "ProductVariant"
            WHERE id = ${variant.id} AND "productId" = ${id}
            LIMIT 1
          `;

          if (existing[0]) {
            await transaction`
              UPDATE "ProductVariant"
              SET "packSize" = ${variant.packSize},
                  "price" = ${variant.price},
                  "discountPrice" = ${variant.discountPrice !== null && variant.discountPrice < variant.price ? variant.discountPrice : null},
                  "updatedAt" = CURRENT_TIMESTAMP
              WHERE id = ${variant.id} AND "productId" = ${id}
            `;
            continue;
          }
        }

        await transaction`
          INSERT INTO "ProductVariant" ("id", "price", "discountPrice", "stock", "productId", "createdAt", "updatedAt", "packSize")
          VALUES (${crypto.randomUUID()}, ${variant.price}, ${variant.discountPrice !== null && variant.discountPrice < variant.price ? variant.discountPrice : null}, 0, ${id}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ${variant.packSize})
        `;
      }

      await transaction`DELETE FROM "ProductImage" WHERE "productId" = ${id}`;
      const mainIndex = images.findIndex((image) => image.isMain);
      const normalizedImages = images.map((image, index) => ({ ...image, isMain: mainIndex >= 0 ? index === mainIndex : index === 0 }));

      for (let index = 0; index < normalizedImages.length; index += 1) {
        const image = normalizedImages[index];
        await transaction`
          INSERT INTO "ProductImage" ("id", "imageUrl", "isMain", "sortOrder", "productId", "createdAt", "updatedAt")
          VALUES (${crypto.randomUUID()}, ${image.imageUrl}, ${image.isMain}, ${index}, ${id}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `;
      }
    });

    return NextResponse.json({ product: await getProduct(id) });
  } catch (error) {
    console.error("PATCH /api/admin/products failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update product." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const body = await request.json();
    const id = text(body.id);

    if (!id) {
      return NextResponse.json({ error: "Product ID is required." }, { status: 400 });
    }

    const sql = db();
    const product = await sql`SELECT id, name FROM "Product" WHERE id = ${id} LIMIT 1`;
    if (!product[0]) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const orderItems = await sql`
      SELECT COUNT(*)::bigint AS count
      FROM "OrderItem"
      WHERE "productId" = ${id}
    `;

    if (Number(orderItems[0].count) > 0) {
      return NextResponse.json(
        { error: "This product is referenced by existing orders and cannot be deleted. Deactivate it instead." },
        { status: 409 }
      );
    }

    await sql.begin(async (transaction) => {
      await transaction`DELETE FROM "ProductImage" WHERE "productId" = ${id}`;
      await transaction`DELETE FROM "ProductVariant" WHERE "productId" = ${id}`;
      await transaction`DELETE FROM "Product" WHERE id = ${id}`;
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/products failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to delete product." }, { status: 500 });
  }
}
