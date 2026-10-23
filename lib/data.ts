export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  badge?: string;
  featured?: boolean;
  image: string;
  variants: { size: string; price: number; regularPrice?: number }[];
};

export type OrderStatus = "New" | "Confirmed" | "Processing" | "Packed" | "Shipped" | "Out for Delivery" | "Delivered" | "Cancelled";

export const products: Product[] = [
  {
    id: "family-pack",
    name: "Family Pack Tea",
    slug: "family-pack-tea",
    description: "A perfect everyday Assam CTC tea with strong aroma and refreshing taste.",
    category: "Premium Tea",
    badge: "Best Seller",
    featured: true,
    image: "/products/family.svg",
    variants: [
      { size: "250g", price: 350 }, { size: "500g", price: 650 }, { size: "1kg", price: 1200 }, { size: "2kg", price: 2250 }
    ]
  },
  {
    id: "gold-tea",
    name: "Premium Gold Tea",
    slug: "premium-gold-tea",
    description: "Rich aroma and strong Assam flavour for a smooth, satisfying cup.",
    category: "Premium Tea",
    badge: "Popular",
    featured: true,
    image: "/products/gold.svg",
    variants: [
      { size: "250g", price: 125 }, { size: "500g", price: 220 }, { size: "1kg", price: 420 }, { size: "2kg", price: 800 }
    ]
  },
  {
    id: "maruti-premium",
    name: "Maruti Premium Tea",
    slug: "maruti-premium-tea",
    description: "Strong, full-bodied and rich in taste, made for classic Indian chai.",
    category: "Premium Tea",
    featured: true,
    image: "/products/maruti.svg",
    variants: [
      { size: "250g", price: 55 }, { size: "500g", price: 105 }, { size: "1kg", price: 180 }, { size: "2kg", price: 340 }
    ]
  },
  {
    id: "green-tea",
    name: "Anant Green Tea",
    slug: "anant-green-tea",
    description: "Light, fresh green tea leaves with a clean and delicate finish.",
    category: "Green Tea",
    featured: true,
    image: "/products/green.svg",
    variants: [
      { size: "100g", price: 150 }, { size: "250g", price: 320 }, { size: "500g", price: 600 }
    ]
  }
];

export const categories = ["All Products", "Black Tea", "Green Tea", "Premium Tea", "Tea Bags"];

export const defaultTemplates: Record<OrderStatus, string> = {
  New: "Hi {customer_name},\n\nThank you for ordering from Anant Tea. We have received your order #{order_number} for ₹{order_total}.\n\nWe will confirm it shortly.\n\nThank you,\nAnant Tea",
  Confirmed: "Hi {customer_name},\n\nYour Anant Tea order #{order_number} has been confirmed.\n\nOrder total: ₹{order_total}\n\nThank you for choosing Anant Tea.",
  Processing: "Hi {customer_name},\n\nYour Anant Tea order #{order_number} is now being processed.\n\nThank you for shopping with Anant Tea.",
  Packed: "Hi {customer_name},\n\nYour Anant Tea order #{order_number} has been packed and is ready for dispatch.\n\nThank you for choosing Anant Tea.",
  Shipped: "Hi {customer_name},\n\nYour Anant Tea order #{order_number} has been shipped.\n\nThank you for shopping with Anant Tea.",
  "Out for Delivery": "Hi {customer_name},\n\nYour Anant Tea order #{order_number} is out for delivery.\n\nPlease keep your phone available for the delivery partner.\n\nThank you,\nAnant Tea",
  Delivered: "Hi {customer_name},\n\nYour Anant Tea order #{order_number} has been delivered.\n\nWe hope you enjoy your tea! Thank you for choosing Anant Tea.",
  Cancelled: "Hi {customer_name},\n\nYour Anant Tea order #{order_number} has been cancelled.\n\nIf you have any questions, please contact us.\n\nAnant Tea"
};

export const formatINR = (n: number) => `₹${n.toLocaleString("en-IN")}`;
