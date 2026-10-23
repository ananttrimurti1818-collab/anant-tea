export type CartItem = {
  productId: string;
  name: string;
  size: string;
  price: number;
  quantity: number;
  image: string;
};

const KEY = "anant-tea-cart";

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

export function saveCart(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("cart-updated"));
}

export function addToCart(item: CartItem) {
  const cart = getCart();
  const existing = cart.find(x => x.productId === item.productId && x.size === item.size);
  if (existing) existing.quantity += item.quantity;
  else cart.push(item);
  saveCart(cart);
}

export function updateCart(index: number, quantity: number) {
  const cart = getCart();
  if (quantity <= 0) cart.splice(index, 1);
  else cart[index].quantity = quantity;
  saveCart(cart);
}

export function clearCart() {
  saveCart([]);
}

export function cartTotal(items: CartItem[]) {
  return items.reduce((sum, x) => sum + x.price * x.quantity, 0);
}
