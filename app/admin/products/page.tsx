"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import MediaUploader from "@/components/admin/MediaUploader";
import { LoaderCircle, Plus, Pencil, Trash2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Variant {
  id?: string;
  packSize: string;
  price: number;
  discountPrice: number | null;
}

interface ImageItem {
  id?: string;
  imageUrl: string;
  isMain: boolean;
  sortOrder: number;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  featured: boolean;
  isActive: boolean;
  categoryId: string;
  category: string;
  variants: Variant[];
  images: ImageItem[];
}

type FormState = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  featured: boolean;
  isActive: boolean;
  variants: Variant[];
  images: ImageItem[];
};

const emptyForm: FormState = {
  name: "",
  slug: "",
  description: "",
  categoryId: "",
  featured: false,
  isActive: true,
  variants: [{ packSize: "250g", price: 0, discountPrice: null }],
  images: [],
};

function formatINR(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [busyAction, setBusyAction] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const [productsResponse, categoriesResponse] = await Promise.all([
        fetch("/api/admin/products", { cache: "no-store" }),
        fetch("/api/categories", { cache: "no-store" }),
      ]);

      const productsData = await productsResponse.json();
      const categoriesData = await categoriesResponse.json();

      if (!productsResponse.ok) throw new Error(productsData.error || "Unable to load products.");
      if (!categoriesResponse.ok) throw new Error(categoriesData.error || "Unable to load categories.");

      setProducts(productsData.products ?? []);
      setCategories(categoriesData.categories ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load products.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch = !query || `${product.name} ${product.category} ${product.slug}`.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? product.isActive : !product.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [products, search, statusFilter]);

  function openCreate() {
    setBusyAction("create");
    setForm({ ...emptyForm, variants: [{ packSize: "250g", price: 0, discountPrice: null }], images: [] });
    setError("");
    setShowForm(true);
    window.setTimeout(() => setBusyAction(current => current === "create" ? "" : current), 350);
  }

  function openEdit(product: Product) {
    setBusyAction(`edit:${product.id}`);
    setForm({
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      categoryId: product.categoryId,
      featured: product.featured,
      isActive: product.isActive,
      variants: product.variants.map((variant) => ({ ...variant, discountPrice: variant.discountPrice ?? null })),
      images: product.images.map((image) => ({ ...image })),
    });
    setError("");
    setShowForm(true);
    window.setTimeout(() => setBusyAction(current => current === `edit:${product.id}` ? "" : current), 350);
  }

  function updateVariant(index: number, key: keyof Variant, value: string) {
    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant, variantIndex) => {
        if (variantIndex !== index) return variant;
        if (key === "packSize") return { ...variant, packSize: value };
        if (key === "discountPrice") return { ...variant, discountPrice: value === "" ? null : Number(value) };
        return { ...variant, price: value === "" ? 0 : Number(value) };
      }),
    }));
  }

  function addVariant() {
    setForm((current) => ({
      ...current,
      variants: [...current.variants, { packSize: "", price: 0, discountPrice: null }],
    }));
  }

  function removeVariant(index: number) {
    if (form.variants.length === 1) return;
    setForm((current) => ({
      ...current,
      variants: current.variants.filter((_, variantIndex) => variantIndex !== index),
    }));
  }

  function addImage() {
    setForm((current) => ({
      ...current,
      images: [
        ...current.images,
        {
          imageUrl: "",
          isMain: current.images.length === 0,
          sortOrder: current.images.length,
        },
      ],
    }));
  }

  function updateImage(index: number, value: string) {
    setForm((current) => ({
      ...current,
      images: current.images.map((image, imageIndex) => imageIndex === index ? { ...image, imageUrl: value } : image),
    }));
  }

  function setMainImage(index: number) {
    setForm((current) => ({
      ...current,
      images: current.images.map((image, imageIndex) => ({ ...image, isMain: imageIndex === index })),
    }));
  }

  function removeImage(index: number) {
    setForm((current) => {
      const images = current.images.filter((_, imageIndex) => imageIndex !== index);
      if (images.length > 0 && !images.some((image) => image.isMain)) images[0] = { ...images[0], isMain: true };
      return { ...current, images: images.map((image, imageIndex) => ({ ...image, sortOrder: imageIndex })) };
    });
  }

  async function saveProduct(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...form,
      slug: form.slug || createSlug(form.name),
      variants: form.variants.map((variant) => ({ ...variant, price: Number(variant.price), discountPrice: variant.discountPrice === null || variant.discountPrice === undefined ? null : Number(variant.discountPrice) })),
      images: form.images.filter((image) => image.imageUrl.trim()),
    };

    try {
      const response = await fetch("/api/admin/products", {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save product.");

      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save product.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(product: Product) {
    setBusyAction(`toggle:${product.id}`);
    try {
      const response = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...product,
          isActive: !product.isActive,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update status.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update status.");
    } finally {
      setBusyAction("");
    }
  }

  async function deleteProduct(product: Product) {
    if (!window.confirm(`Delete “${product.name}”? This cannot be undone.`)) return;

    setBusyAction(`delete:${product.id}`);
    try {
      const response = await fetch("/api/admin/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product.id }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to delete product.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete product.");
    } finally {
      setBusyAction("");
    }
  }

  return (
    <>
      <div className="admin-top">
        <div>
          <div className="eyebrow">Store</div>
          <h1>Products</h1>
          <p className="admin-muted">Manage products, pack sizes, pricing and catalogue visibility.</p>
        </div>
        <button className="primary-btn" onClick={openCreate} disabled={busyAction === "create"}>{busyAction === "create" ? <><LoaderCircle size={15} className="spin"/> Opening…</> : <><Plus size={15}/> Add Product</>}</button>
      </div>

      {error && <div className="admin-alert">{error}</div>}

      {showForm && (
        <form className="admin-card product-editor-enter" onSubmit={saveProduct}>
          <div className="admin-section-heading">
            <div>
              <h2>{form.id ? "Edit Product" : "Add Product"}</h2>
              <p>Changes are saved directly to the existing Neon product tables.</p>
            </div>
            <button type="button" className="outline-btn" onClick={() => setShowForm(false)}>Close</button>
          </div>

          <div className="form-grid" style={{ marginTop: 18 }}>
            <div className="field">
              <label>Product Name *</label>
              <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Anant Premium Tea" />
            </div>
            <div className="field">
              <label>Category *</label>
              <select required value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}>
                <option value="">Select category</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </div>
            <div className="field full">
              <label>Slug</label>
              <input value={form.slug} onChange={(event) => setForm({ ...form, slug: createSlug(event.target.value) })} placeholder="product-slug" />
            </div>
            <div className="field full">
              <label>Description</label>
              <textarea rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Describe the tea, taste and key details..." />
            </div>
          </div>

          <div className="admin-subsection">
            <div className="admin-section-heading compact">
              <div><h3>Pack Sizes & Pricing</h3><p>Inventory is intentionally not managed here.</p></div>
              <button type="button" className="outline-btn" onClick={addVariant}>+ Add Pack Size</button>
            </div>
            <div className="variant-editor">
              {form.variants.map((variant, index) => (
                <div className="variant-row" key={`${index}-${variant.id ?? "new"}`}>
                  <div className="field"><label>Pack Size</label><input required value={variant.packSize} onChange={(event) => updateVariant(index, "packSize", event.target.value)} placeholder="250g" /></div>
                  <div className="field"><label>Regular Price (₹)</label><input required min="0" step="0.01" type="number" value={variant.price} onChange={(event) => updateVariant(index, "price", event.target.value)} /></div>
                  <div className="field"><label>Discount Price (₹, optional)</label><input min="0" max={variant.price || undefined} step="0.01" type="number" value={variant.discountPrice ?? ""} placeholder="No discount" onChange={(event) => updateVariant(index, "discountPrice", event.target.value)} /><small>Must be lower than regular price.</small></div>
                  <button type="button" className="danger-btn" onClick={() => removeVariant(index)} disabled={form.variants.length === 1}>Remove</button>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-subsection">
            <div className="admin-section-heading compact">
              <div><h3>Product Images</h3><p>Upload product photos directly to Cloudinary. No image URLs are required.</p></div>
              <span className="admin-muted">{form.images.length} image(s)</span>
            </div>
            <MediaUploader folder="anant-tea/products" onUploaded={(uploaded) => setForm(current => ({ ...current, images: [...current.images, ...uploaded.map((item, index) => ({ imageUrl:item.url, isMain:current.images.length===0 && index===0, sortOrder:current.images.length+index }))] }))} />
            <div className="product-image-manager">
              {form.images.map((image,index)=><div className="product-image-card" key={`${index}-${image.id ?? image.imageUrl}`}>
                <img src={image.imageUrl} alt={`Product image ${index+1}`} />
                <div><b>{index===0?'Primary gallery image':''}</b><label><input type="radio" name="main-image" checked={image.isMain} onChange={()=>setMainImage(index)} /> Main image</label><button type="button" className="danger-btn" onClick={()=>removeImage(index)}>Remove</button></div>
              </div>)}
            </div>
          </div>

          <div className="admin-toggle-row">
            <label><input type="checkbox" checked={form.featured} onChange={(event) => setForm({ ...form, featured: event.target.checked })} /> Featured product</label>
            <label><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} /> Active on storefront</label>
          </div>

          <div className="admin-actions" style={{ marginTop: 20 }}>
            <button className="primary-btn" disabled={saving}>{saving ? "Saving..." : form.id ? "Save Changes" : "Create Product"}</button>
            <button type="button" className="outline-btn" onClick={() => setShowForm(false)} disabled={saving}>Cancel</button>
          </div>
        </form>
      )}

      <div className="admin-card">
        <div className="product-toolbar">
          <input className="admin-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products..." />
          <select className="admin-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {loading ? (
          <div className="admin-empty">Loading products from Neon...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="admin-empty">No products match your filters.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Product</th><th>Category</th><th>Pack Sizes</th><th>Price From</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const minimumPrice = product.variants.length ? Math.min(...product.variants.map((variant) => variant.discountPrice ?? variant.price)) : 0;
                  return (
                    <tr key={product.id}>
                      <td><div className="product-admin-name"><strong>{product.name}</strong>{product.featured && <span className="mini-badge">Featured</span>}<small>/{product.slug}</small></div></td>
                      <td>{product.category}</td>
                      <td>{product.variants.length ? product.variants.map((variant) => variant.packSize).join(", ") : "—"}</td>
                      <td>{product.variants.length ? <>{formatINR(minimumPrice)}{product.variants.some(v => v.discountPrice !== null && v.discountPrice !== undefined && v.discountPrice < v.price) && <small style={{display:"block",color:"var(--muted)"}}>Discount applied</small>}</> : "—"}</td>
                      <td><span className={product.isActive ? "status" : "status status-off"}>{product.isActive ? "Active" : "Inactive"}</span></td>
                      <td><div className="table-actions"><button className="outline-btn small-btn" disabled={busyAction !== ""} onClick={() => openEdit(product)}>{busyAction === `edit:${product.id}` ? <><LoaderCircle size={13} className="spin"/> Opening</> : <><Pencil size={13}/> Edit</>}</button><button className="outline-btn small-btn" disabled={busyAction !== ""} onClick={() => toggleActive(product)}>{busyAction === `toggle:${product.id}` ? <LoaderCircle size={13} className="spin"/> : null}{product.isActive ? " Disable" : " Enable"}</button><button className="danger-btn small-btn" disabled={busyAction !== ""} onClick={() => deleteProduct(product)}>{busyAction === `delete:${product.id}` ? <><LoaderCircle size={13} className="spin"/> Deleting…</> : <><Trash2 size={13}/> Delete</>}</button></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
