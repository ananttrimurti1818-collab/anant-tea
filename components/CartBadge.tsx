"use client";

import { useEffect, useState } from "react";
import { getCart } from "@/lib/store";

export default function CartBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const update = () => {
      setCount(getCart().reduce((total, item) => total + item.quantity, 0));
    };

    update();
    window.addEventListener("cart-updated", update);
    return () => window.removeEventListener("cart-updated", update);
  }, []);

  if (count === 0) return null;

  return <span className="badge-count">{count}</span>;
}
