"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cartTotal, clearCart, getCart, CartItem } from "@/lib/store";
import { formatINR } from "@/lib/data";

type AvailableCoupon = {
  id: string;
  code: string;
  type: string;
  value: number;
  minimumOrder: number;
  maximumDiscount: number | null;
  description: string;
  title: string;
  startsAt: string | null;
  expiresAt: string | null;
};

type LocationResult = { city: string; state: string; pincode: string; name: string };

export default function CheckoutPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [coupons, setCoupons] = useState<AvailableCoupon[]>([]);
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [message, setMessage] = useState("");
  const [placing, setPlacing] = useState(false);
  const [pincode, setPincode] = useState("");
  const [pinBusy, setPinBusy] = useState(false);
  const [pinResults, setPinResults] = useState<LocationResult[]>([]);
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [cityBusy, setCityBusy] = useState(false);
  const [cityResults, setCityResults] = useState<LocationResult[]>([]);

  useEffect(() => {
    setItems(getCart());
    fetch("/api/coupons", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setCoupons(Array.isArray(d.coupons) ? d.coupons : []))
      .catch(() => setCoupons([]));
  }, []);

  const subtotal = cartTotal(items);
  const shipping = subtotal >= 499 || subtotal === 0 ? 0 : 60;
  const total = Math.max(0, subtotal + shipping - discount);

  async function lookupPin(value: string) {
    const p = value.replace(/\D/g, "");
    if (p.length !== 6) {
      setPinResults([]);
      return;
    }
    setPinBusy(true);
    try {
      const r = await fetch(`/api/pincode?pincode=${p}`, { cache: "no-store" });
      const d = await r.json();
      setPinResults(d.results || []);
      if (d.results?.[0]) {
        setCity(d.results[0].city);
        setState(d.results[0].state || "");
      }
    } catch {
      setPinResults([]);
    } finally {
      setPinBusy(false);
    }
  }

  async function lookupCity(value: string) {
    if (value.trim().length < 3) {
      setCityResults([]);
      return;
    }
    setCityBusy(true);
    try {
      const r = await fetch(`/api/pincode?city=${encodeURIComponent(value.trim())}`, { cache: "no-store" });
      const d = await r.json();
      setCityResults(d.results || []);
    } catch {
      setCityResults([]);
    } finally {
      setCityBusy(false);
    }
  }

  async function applyCoupon(code = coupon) {
    const normalized = code.trim().toUpperCase();
    if (!normalized) {
      setMessage("Enter a coupon code.");
      return;
    }
    try {
      const r = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: normalized, subtotal }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setDiscount(Number(d.discount));
      setCoupon(d.code);
      setMessage(`Coupon ${d.code} applied successfully.`);
    } catch (e) {
      setDiscount(0);
      setMessage(e instanceof Error ? e.message : "Coupon is invalid.");
    }
  }


  async function placeOrder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!items.length) {
      setMessage("Your cart is empty.");
      return;
    }
    setPlacing(true);
    setMessage("");
    const form = new FormData(e.currentTarget);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: form.get("name"),
            phone: form.get("phone"),
            email: form.get("email"),
            pincode: form.get("pincode"),
            address: form.get("address"),
            city: form.get("city"),
            state: form.get("state"),
          },
          items: items.map((x) => ({ productId: x.productId, size: x.size, quantity: x.quantity })),
          paymentMethod: "COD",
          couponCode: coupon || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to place order.");
      clearCart();
      router.push(`/order-success?order=${encodeURIComponent(data.order.orderNumber)}&total=${encodeURIComponent(data.order.total)}`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to place order.");
    } finally {
      setPlacing(false);
    }
  }

  if (!items.length) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <div className="panel" style={{ textAlign: "center", padding: 70 }}>
              <h1 className="section-title serif">Your cart is empty</h1>
              <Link className="primary-btn" href="/products">Browse Products</Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main>
      <section className="page-head">
        <div className="container">
          <div className="breadcrumb">Home › Checkout</div>
          <h1 className="page-title serif">Checkout</h1>
        </div>
      </section>

      <section className="section">
        <div className="container cart-layout">
          <form className="panel" onSubmit={placeOrder}>
            <h2>Delivery Details</h2>
            <div className="form-grid" style={{ marginTop: 18 }}>
              <Field label="Full Name" name="name" />
              <Field label="Mobile Number *" name="phone" type="tel" placeholder="10-digit mobile number" inputMode="numeric" />
              <Field label="Email" name="email" type="email" />
              <div className="field">
                <label>Pincode *</label>
                <input
                  name="pincode"
                  required
                  value={pincode}
                  onChange={(e) => {
                    setPincode(e.target.value);
                    lookupPin(e.target.value);
                  }}
                  inputMode="numeric"
                  placeholder="e.g. 400001"
                />
                {pinBusy && <small>Finding city…</small>}
                {pinResults.length > 0 && (
                  <div className="suggestions">
                    {pinResults.slice(0, 5).map((r, i) => (
                      <button type="button" key={`${r.pincode}-${i}`} onClick={() => { setPincode(r.pincode); setCity(r.city); setState(r.state); setPinResults([]); }}>
                        {r.pincode} · {r.city}, {r.state}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Field label="Address" name="address" full />
              <div className="field">
                <label>City *</label>
                <input
                  name="city"
                  required
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    lookupCity(e.target.value);
                  }}
                />
                {cityBusy && <small>Finding pincodes…</small>}
                {cityResults.length > 0 && (
                  <div className="suggestions">
                    {cityResults.slice(0, 6).map((r, i) => (
                      <button type="button" key={`${r.pincode}-${i}`} onClick={() => { setCity(r.city); setState(r.state); setPincode(r.pincode); setCityResults([]); }}>
                        {r.city} · {r.pincode}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="field">
                <label>State *</label>
                <input name="state" required value={state} onChange={(e) => setState(e.target.value)} />
              </div>
            </div>

            <h2 style={{ marginTop: 28 }}>Payment</h2>
            <p style={{ color: "var(--muted)", fontSize: 13 }}>Cash on Delivery is currently available for this order flow.</p>
            {message && <div className="notice">{message}</div>}
            <button className="primary-btn" disabled={placing} style={{ width: "100%", marginTop: 15 }}>
              {placing ? "Placing Order..." : `Place Order · ${formatINR(total)}`}
            </button>
          </form>

          <aside className="panel">
            <h2>Order Summary</h2>
            {items.map((x) => (
              <div className="summary-row" key={`${x.productId}-${x.size}`}>
                <span>{x.name} · {x.size} × {x.quantity}</span>
                <b>{formatINR(x.price * x.quantity)}</b>
              </div>
            ))}
            <div className="summary-row"><span>Subtotal</span><b>{formatINR(subtotal)}</b></div>
            <div className="summary-row"><span>Shipping</span><b>{shipping === 0 ? "Free" : formatINR(shipping)}</b></div>
            <div className="summary-row"><span>Discount</span><b>- {formatINR(discount)}</b></div>
            <div className="summary-row summary-total"><span>Total</span><b>{formatINR(total)}</b></div>

            <div className="checkout-coupon-box">
              <b style={{ fontSize: 13 }}>Have a coupon?</b>
              <div className="checkout-coupon-input">
                <input
                  className="search"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                  placeholder="Enter coupon code"
                  aria-label="Coupon code"
                />
                <button type="button" className="outline-btn" onClick={() => applyCoupon()}>Apply</button>
              </div>

              {coupons.length > 0 && (
                <div className="available-coupons">
                  <div className="available-coupons-title">Available coupons</div>
                  {coupons.map((c) => {
                    const eligible = c.minimumOrder <= subtotal;
                    return (
                      <div className={`coupon-card ${eligible ? "" : "coupon-disabled"}`} key={c.id}>
                        <div className="coupon-card-main">
                          <strong>{c.code}</strong>
                          <span>{c.title || c.description || (c.type.toUpperCase().includes("PERCENT") ? `${c.value}% off` : `${formatINR(c.value)} off`)}</span>
                          {c.minimumOrder > 0 && <small>Min. order {formatINR(c.minimumOrder)}</small>}
                        </div>
                        <button type="button" className="coupon-use-btn" disabled={!eligible} onClick={() => { setCoupon(c.code); applyCoupon(c.code); }}>
                          {eligible ? "Use" : "Not eligible"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function Field({ label, name, type = "text", full = false, placeholder = "", inputMode }: { label: string; name: string; type?: string; full?: boolean; placeholder?: string; inputMode?: "text" | "numeric" | "decimal" | "tel" | "email" | "url" | "search" | undefined }) {
  return (
    <div className={`field ${full ? "full" : ""}`}>
      <label>{label}</label>
      <input name={name} type={type} required={name !== "email"} placeholder={placeholder} inputMode={inputMode} />
    </div>
  );
}
