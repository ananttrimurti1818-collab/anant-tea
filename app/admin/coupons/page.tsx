"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

type Coupon = {
  id: string;
  code: string;
  type: string;
  value: number;
  minimumOrder: number;
  maximumDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  active: boolean;
  expiresAt: string;
  startsAt: string | null;
  description: string;
  priority: number;
  title: string;
  visibleOnCheckout: boolean;
};

const empty = {
  code: "",
  type: "PERCENTAGE",
  value: 10,
  minimumOrder: 499,
  maximumDiscount: 200,
  usageLimit: 100,
  active: true,
  expiresAt: "",
  startsAt: "",
  description: "",
  priority: 0,
  title: "",
  visibleOnCheckout: true,
};

export default function Coupons() {
  const [rows, setRows] = useState<Coupon[]>([]);
  const [form, setForm] = useState<any>(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const r = await fetch("/api/admin/coupons", { cache: "no-store" });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error);
    setRows(d.coupons || []);
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  function edit(c: Coupon) {
    setEditing(c.id);
    setForm({
      ...c,
      expiresAt: c.expiresAt ? new Date(c.expiresAt).toISOString().slice(0, 16) : "",
      startsAt: c.startsAt ? new Date(c.startsAt).toISOString().slice(0, 16) : "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const r = await fetch("/api/admin/coupons", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, id: editing }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setForm(empty);
      setEditing(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save coupon.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="admin-top">
        <div>
          <div className="eyebrow">Store</div>
          <h1>Coupons</h1>
          <p className="admin-muted">Manage active store coupons and checkout offers.</p>
        </div>
        <button className="outline-btn" onClick={() => load().catch((e) => setError(e.message))}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {error && <div className="admin-alert">{error}</div>}

      <div className="admin-card">
        <h2>{editing ? "Edit Coupon" : "Create Coupon"}</h2>
        <div className="form-grid" style={{ marginTop: 15 }}>
          <div className="field"><label>Coupon Code</label><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} /></div>
          <div className="field"><label>Discount Type</label><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="PERCENTAGE">Percentage</option><option value="FIXED">Fixed</option></select></div>
          <div className="field"><label>Discount Value</label><input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} /></div>
          <div className="field"><label>Minimum Order</label><input type="number" value={form.minimumOrder} onChange={(e) => setForm({ ...form, minimumOrder: Number(e.target.value) })} /></div>
          <div className="field"><label>Maximum Discount</label><input type="number" value={form.maximumDiscount ?? ""} onChange={(e) => setForm({ ...form, maximumDiscount: e.target.value === "" ? null : Number(e.target.value) })} /></div>
          <div className="field"><label>Usage Limit</label><input type="number" value={form.usageLimit ?? ""} onChange={(e) => setForm({ ...form, usageLimit: e.target.value === "" ? null : Number(e.target.value) })} /></div>
          <div className="field"><label>Start</label><input type="datetime-local" value={form.startsAt || ""} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} /></div>
          <div className="field"><label>Expiry</label><input type="datetime-local" value={form.expiresAt || ""} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} /></div>
          <div className="field full"><label>Title</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Save on your tea order" /></div>
          <div className="field full"><label>Description</label><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        </div>
        <div className="admin-toggle-row">
          <label><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active</label>
          <label><input type="checkbox" checked={form.visibleOnCheckout} onChange={(e) => setForm({ ...form, visibleOnCheckout: e.target.checked })} /> Show at checkout</label>
        </div>
        <div className="admin-actions" style={{ marginTop: 16 }}>
          <button className="primary-btn" disabled={saving} onClick={save}>{saving ? "Saving..." : editing ? "Save Changes" : "Create Coupon"}</button>
          {editing && <button className="outline-btn" onClick={() => { setEditing(null); setForm(empty); }}>Cancel</button>}
        </div>
      </div>

      <div className="admin-card admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Minimum</th><th>Usage</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td><b>{c.code}</b></td>
                <td>{c.type}</td>
                <td>{c.type.toUpperCase().includes("PERCENT") ? `${c.value}%` : `₹${c.value}`}</td>
                <td>₹{c.minimumOrder}</td>
                <td>{c.usedCount}/{c.usageLimit ?? "∞"}</td>
                <td><span className="status">{c.active ? "Active" : "Inactive"}</span></td>
                <td><button className="outline-btn small-btn" onClick={() => edit(c)}>Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
