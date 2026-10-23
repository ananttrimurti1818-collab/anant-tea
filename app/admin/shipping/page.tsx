"use client";
import { useEffect, useState } from "react";
export default function ShippingSettingsPage() {
  const [shippingCharge, setShippingCharge] = useState("60");
  const [freeShippingAbove, setFreeShippingAbove] = useState("499");
  const [codEnabled, setCodEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    fetch("/api/admin/store-settings", { cache: "no-store" }).then(async r => {
      const d = await r.json(); if (!r.ok) throw new Error(d.error);
      setShippingCharge(String(d.settings?.shippingCharge ?? 60));
      setFreeShippingAbove(String(d.settings?.freeShippingAbove ?? 499));
      setCodEnabled(d.settings?.codEnabled !== false);
    }).catch(e => setNotice(e instanceof Error ? e.message : "Unable to load settings.")).finally(() => setLoading(false));
  }, []);
  async function save() {
    const charge = Number(shippingCharge), threshold = Number(freeShippingAbove);
    if (!Number.isFinite(charge) || charge < 0 || !Number.isFinite(threshold) || threshold < 0) { setNotice("Enter valid non-negative amounts."); return; }
    setSaving(true); setNotice("");
    try {
      const r = await fetch("/api/admin/store-settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ shippingCharge: charge, freeShippingAbove: threshold, codEnabled }) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error || "Unable to save settings.");
      setNotice("Shipping settings saved. These rules now apply at checkout and when orders are created.");
    } catch (e) { setNotice(e instanceof Error ? e.message : "Unable to save settings."); }
    finally { setSaving(false); }
  }
  return <><div className="admin-top"><div><div className="eyebrow">Checkout Configuration</div><h1>Shipping & Delivery</h1><p className="admin-muted">Control the shipping charge and free-shipping minimum for online orders.</p></div></div><div className="admin-card" style={{ maxWidth: 760 }}>
    {loading ? <p>Loading shipping settings…</p> : <>
      <div className="field"><label>Shipping charge (₹)</label><input type="number" min="0" step="0.01" value={shippingCharge} onChange={e => setShippingCharge(e.target.value)} /><small>Charged when the order subtotal is below the free-shipping threshold.</small></div>
      <div className="field" style={{ marginTop: 18 }}><label>Free shipping on orders above (₹)</label><input type="number" min="0" step="0.01" value={freeShippingAbove} onChange={e => setFreeShippingAbove(e.target.value)} /><small>Set 0 to make every order eligible for free shipping.</small></div>
      <div className="field" style={{ marginTop: 22, padding: 16, border: "1px solid var(--border, #dce5dd)", borderRadius: 12 }}>
        <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, cursor: "pointer" }}>
          <span><strong>Cash on Delivery (COD)</strong><br /><small>Allow customers to place orders and pay on delivery.</small></span>
          <input type="checkbox" checked={codEnabled} onChange={e => setCodEnabled(e.target.checked)} style={{ width: 22, height: 22 }} />
        </label>
        <small>{codEnabled ? "COD is enabled at checkout." : "COD is disabled. Customers must pay online."}</small>
      </div>
      <div className="notice" style={{ marginTop: 16 }}>Example: a ₹{freeShippingAbove || "0"} threshold means orders at or above this subtotal get free shipping; smaller orders pay ₹{shippingCharge || "0"}.</div>
      {notice && <div className="notice" style={{ marginTop: 12 }}>{notice}</div>}
      <button className="primary-btn" style={{ marginTop: 18 }} disabled={saving} onClick={save}>{saving ? "Saving…" : "Save Shipping & Payment Settings"}</button>
    </>}
  </div></>;
}
