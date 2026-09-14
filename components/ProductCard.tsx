"use client";
import { useState } from "react";
import { Plus, Minus, CheckCircle } from "lucide-react";
import { Product, formatINR } from "@/lib/data";
import { addToCart } from "@/lib/store";

export default function ProductCard({ product }: { product: Product }) {
  const [variant, setVariant] = useState(product.variants[0]);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  function add() {
    addToCart({ productId: product.id, name: product.name, size: variant.size, price: variant.price, quantity: qty, image: product.image });
    setAdded(true); setTimeout(() => setAdded(false), 1800);
  }
  return <article className="product-card">
    <div className="product-image">
      {product.badge && <span className="product-badge">{product.badge}</span>}
      <img src={product.image || "/products/family.svg"} alt={product.name}/>
    </div>
    <div className="product-info">
      <span className="tag">{product.category}</span>
      <h3 className="product-name">{product.name}</h3>
      <div className="product-desc">{product.description}</div>
      <div className="price">{formatINR(variant.price)}</div>
      <div className="variant-row">{product.variants.map(v => <button key={v.size} className={`variant ${variant.size===v.size?"selected":""}`} onClick={()=>setVariant(v)}>{v.size}</button>)}</div>
      <div className="qty-row">
        <div className="qty-control"><button onClick={()=>setQty(Math.max(1,qty-1))}><Minus size={14}/></button><span>{qty}</span><button onClick={()=>setQty(qty+1)}><Plus size={14}/></button></div>
        <button className="card-add" onClick={add}>{added ? <><CheckCircle size={14}/> Added to cart</> : "Add to Cart"}</button>
      </div>
    </div>
  </article>;
}