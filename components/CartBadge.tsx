"use client";
import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { getCart } from "@/lib/store";

export default function CartBadge() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const update = () => setCount(getCart().reduce((s, x) => s + x.quantity, 0));
    update();
    window.addEventListener("cart-updated", update);
    return () => window.removeEventListener("cart-updated", update);
  }, []);
  return <span className="cart-btn"><ShoppingCart size={20}/>{count > 0 && <span className="badge-count">{count}</span>}</span>;
}