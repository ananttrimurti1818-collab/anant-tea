"use client";

import { useEffect, useState } from "react";
import GalleryImage from "@/components/GalleryImage";

type ImageItem = { id: string; title: string; imageUrl: string; displayOrder: number; active: boolean; categoryId: string; categoryName: string; featured: boolean };
type Category = { id: string; name: string; slug: string };

export default function GalleryPage() {
  const [cats, setCats] = useState<Category[]>([]);
  const [imgs, setImgs] = useState<ImageItem[]>([]);
  const [selected, setSelected] = useState("all");

  useEffect(() => {
    fetch("/api/admin/gallery", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setCats(d.categories || []);
        setImgs((d.images || []).filter((x: ImageItem) => x.active));
      })
      .catch(() => {});
  }, []);

  const visible = selected === "all" ? imgs : imgs.filter((x) => x.categoryId === selected);

  return (
    <main>
      <section className="page-head">
        <div className="container">
          <div className="breadcrumb">Home › Gallery</div>
          <h1 className="page-title serif">Gallery</h1>
          <p className="section-copy">A visual look at Anant Tea, our products and the world of Assam tea.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="gallery-filters">
            <button className={selected === "all" ? "active" : ""} onClick={() => setSelected("all")}>All</button>
            {cats.map((c) => (
              <button key={c.id} className={selected === c.id ? "active" : ""} onClick={() => setSelected(c.id)}>{c.name}</button>
            ))}
          </div>

          {visible.length ? (
            <div className="gallery-grid gallery-grid-full-images">
              {visible.map((x, i) => (
                <div className="gallery-tile" key={x.id}>
                  <GalleryImage
                    src={x.imageUrl}
                    alt={x.title || x.categoryName}
                    loading={i < 2 ? "eager" : "lazy"}
                    fallback={`/gallery/tea-${(i % 6) + 1}.svg`}
                  />
                  {x.title && <div className="gallery-caption">{x.title}</div>}
                </div>
              ))}
            </div>
          ) : (
            <div className="panel" style={{ textAlign: "center" }}>Gallery images coming soon.</div>
          )}
        </div>
      </section>
    </main>
  );
}
