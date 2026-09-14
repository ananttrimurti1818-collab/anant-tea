import Link from "next/link";
import Image from "next/image";
import ProductCard from "@/components/ProductCard";
import { getGalleryPreview, getProducts } from "@/lib/catalog";
import { Leaf, PackageCheck, Truck, Coffee, ArrowRight } from "lucide-react";
import GalleryImage from "@/components/GalleryImage";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [products, gallery] = await Promise.all([getProducts(), getGalleryPreview(5)]);

  return (
    <main>
      {/* Products — all products are shown directly on the homepage. */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <div className="eyebrow">Fresh from Anant Tea</div>
              <h1 className="page-title serif">Our Products</h1>
              <p className="section-copy">
                Discover premium Assam tea blends crafted for everyday taste, family moments and every perfect cup.
              </p>
            </div>
          </div>

          <div className="products-layout homepage-products-layout">
            <aside className="filter-card">
              <h3>Categories</h3>
              <div className="filter-list">
                {["All Products", "Black Tea", "Green Tea", "Premium Tea", "Tea Bags"].map((x) => (
                  <label className="filter-item" key={x}>
                    <input type="checkbox" defaultChecked={x === "All Products"} />
                    {x}
                  </label>
                ))}
              </div>
              <hr style={{ border: 0, borderTop: "1px solid var(--line)", margin: "22px 0" }} />
              <h3>Pack Size</h3>
              <div className="filter-list">
                {["250g", "500g", "1kg", "2kg"].map((x) => (
                  <label className="filter-item" key={x}>
                    <input type="checkbox" />
                    {x}
                  </label>
                ))}
              </div>
            </aside>

            <div className="product-grid homepage-product-grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why choose us — immediately after products. */}
      <section className="section why-section">
        <div className="container">
          <div className="section-head">
            <div>
              <div className="eyebrow">Why choose Anant Tea</div>
              <h2 className="section-title serif">Quality in every cup</h2>
              <p className="section-copy">A simple promise: premium tea, careful handling and a consistently satisfying cup.</p>
            </div>
          </div>

          <div className="why-grid">
            <Why icon={<Leaf />} title="100% Assam Tea" text="Carefully selected Assam tea leaves for an authentic, full-bodied cup." />
            <Why icon={<Coffee />} title="Fresh & Aromatic" text="Rich taste and aroma designed for a satisfying daily chai." />
            <Why icon={<PackageCheck />} title="Carefully Packed" text="Hygienic and secure packaging to preserve freshness." />
            <Why icon={<Truck />} title="Reliable Delivery" text="Reliable delivery so your favourite tea reaches you on time." />
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="section featured-bg">
        <div className="container">
          <div className="section-head">
            <div>
              <div className="eyebrow">Customer favourites</div>
              <h2 className="section-title serif">Featured Products</h2>
            </div>
          </div>
          <div className="featured-grid">
            {products.filter((product) => product.featured).length > 0
              ? products.filter((product) => product.featured).map((product) => <ProductCard key={product.id} product={product} />)
              : products.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="section about-strip">
        <div className="container about-grid">
          <div className="about-art">
            <Image src="/logo.png" alt="Anant Tea" width={250} height={125} />
          </div>
          <div>
            <div className="eyebrow">The Anant Tea story</div>
            <h2 className="section-title serif">Tea made for the moments that matter.</h2>
            <p className="section-copy">
              We bring carefully selected Assam tea leaves together with a commitment to aroma, colour and a rich, satisfying cup. From a morning chai to evening conversations, Anant Tea is made to be part of everyday life.
            </p>
            <Link className="primary-btn" href="/about">Learn More About Us</Link>
          </div>
        </div>
      </section>

      {/* Partnership CTA */}
      <section className="section partner-cta-section">
        <div className="container">
          <div className="partner-cta">
            <div>
              <div className="eyebrow">Business Partnership</div>
              <h2 className="section-title serif">Join us and become our partner.</h2>
              <p>
                Grow with Anant Tea. Become a distributor or sub-distributor and bring premium Assam tea to customers in your region.
              </p>
            </div>
            <Link className="primary-btn partner-cta-button" href="/partner">
              Join Us <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Gallery preview */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <div className="eyebrow">A glimpse of Anant Tea</div>
              <h2 className="section-title serif">Our Gallery</h2>
            </div>
            <Link className="outline-btn" href="/gallery">View Gallery</Link>
          </div>

          <div className="gallery-grid homepage-gallery-grid">
            {gallery.map((item) => (
              <div className="gallery-tile" key={item.id}>
                <GalleryImage
                  src={item.imageUrl}
                  alt={item.title || "Anant Tea"}
                  loading="lazy"
                />
                {item.title && <div className="gallery-caption">{item.title}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function Why({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="why-card">
      <div className="why-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
