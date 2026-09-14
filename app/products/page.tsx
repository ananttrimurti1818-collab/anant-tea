import ProductCard from "@/components/ProductCard";
import { getCategories, getProducts } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);

  return (
    <main>
      <section className="page-head">
        <div className="container">
          <div className="breadcrumb">Home &nbsp;›&nbsp; Products</div>
          <h1 className="page-title serif">Our Products</h1>
          <p className="section-copy">
            Explore our complete range of premium Assam tea blends.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container products-layout">
          <aside className="filter-card">
            <h3>Categories</h3>
            <div className="filter-list">
              <label className="filter-item">
                <input type="checkbox" defaultChecked />
                All Products
              </label>
              {categories.map((category) => (
                <label className="filter-item" key={category.id}>
                  <input type="checkbox" />
                  {category.name}
                </label>
              ))}
            </div>

            <hr
              style={{
                border: 0,
                borderTop: "1px solid var(--line)",
                margin: "22px 0",
              }}
            />

            <h3>Pack Size</h3>
            <div className="filter-list">
              {["250g", "500g", "1kg", "2kg"].map((size) => (
                <label className="filter-item" key={size}>
                  <input type="checkbox" />
                  {size}
                </label>
              ))}
            </div>
          </aside>

          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
