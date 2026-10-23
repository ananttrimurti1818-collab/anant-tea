"use client";
import { useEffect, useState } from "react";
import MediaUploader from "@/components/admin/MediaUploader";

type Settings = {
  aboutTitle: string; aboutSubtitle: string; aboutStoryHeading: string;
  aboutStoryP1: string; aboutStoryP2: string; aboutStoryImageUrl: string;
  aboutPromiseHeading: string; aboutPromiseBody: string;
};
const defaults: Settings = {
  aboutTitle: "About Anant Tea",
  aboutSubtitle: "A tea brand built around the simple joy of a great cup.",
  aboutStoryHeading: "From Assam leaves to your daily chai.",
  aboutStoryP1: "Anant Tea is focused on delivering quality tea blends with the aroma, colour and strength that Indian tea lovers expect. We believe good tea is not only a product; it is part of conversations, family time and daily rituals.",
  aboutStoryP2: "Our goal is simple: offer dependable, flavourful Assam tea with thoughtful packaging and a modern buying experience.",
  aboutStoryImageUrl: "/about-story-reference.png",
  aboutPromiseHeading: "Better Tea for a Brighter Tomorrow",
  aboutPromiseBody: "We are committed to bringing the richness of Assam tea to more homes, building long-term relationships with our customers, partners and tea-loving communities.",
};
export default function AdminAboutPage() {
  const [form, setForm] = useState<Settings>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    fetch("/api/admin/store-settings", { cache: "no-store" })
      .then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error); setForm({ ...defaults, ...d.settings }); })
      .catch(e => setNotice(e instanceof Error ? e.message : "Unable to load content."))
      .finally(() => setLoading(false));
  }, []);
  function update(key: keyof Settings, value: string) { setForm(prev => ({ ...prev, [key]: value })); }
  async function save() {
    setSaving(true); setNotice("");
    try {
      const r = await fetch("/api/admin/store-settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error || "Unable to save.");
      setNotice("About Us content saved successfully.");
    } catch (e) { setNotice(e instanceof Error ? e.message : "Unable to save content."); }
    finally { setSaving(false); }
  }
  const field = (label: string, key: keyof Settings, multiline = false) => <div className="field" key={key}><label>{label}</label>{multiline ? <textarea rows={4} value={form[key]} onChange={e => update(key, e.target.value)} /> : <input value={form[key]} onChange={e => update(key, e.target.value)} />}</div>;
  return <><div className="admin-top"><div><div className="eyebrow">Storefront Content</div><h1>About Us Page</h1><p className="admin-muted">Edit the public About Us page and upload its story photo. Image URL entry is not required.</p></div></div>
    {loading ? <div className="admin-card">Loading About Us content…</div> : <div className="admin-card">
      {field("Page title", "aboutTitle")}{field("Intro description", "aboutSubtitle", true)}
      {field("Story heading", "aboutStoryHeading")}{field("Story paragraph 1", "aboutStoryP1", true)}{field("Story paragraph 2", "aboutStoryP2", true)}
      <div className="field"><label>About story photo</label><MediaUploader folder="anant-tea/about" multiple={false} onUploaded={items => { if (items[0]) update("aboutStoryImageUrl", items[0].url); }} />{form.aboutStoryImageUrl && <div style={{ marginTop: 12 }}><img src={form.aboutStoryImageUrl} alt="About story preview" style={{ display: "block", width: "100%", maxWidth: 440, maxHeight: 260, objectFit: "contain", borderRadius: 12, background: "#f5f7f4" }} /><button type="button" className="outline-btn" style={{ marginTop: 8 }} onClick={() => update("aboutStoryImageUrl", "/about-story-reference.png")}>Restore default image</button></div>}</div>
      {field("Our promise heading", "aboutPromiseHeading")}{field("Our promise description", "aboutPromiseBody", true)}
      {notice && <div className="notice" style={{ marginTop: 12 }}>{notice}</div>}
      <button className="primary-btn" style={{ marginTop: 18 }} disabled={saving} onClick={save}>{saving ? "Saving…" : "Save About Us Page"}</button>
    </div>}
  </>;
}
