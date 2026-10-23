import Link from "next/link";
import { Leaf, Users, ShieldCheck } from "lucide-react";
import { db } from "@/lib/db";

const defaults = {
  title: "About Anant Tea",
  subtitle: "A tea brand built around the simple joy of a great cup.",
  storyHeading: "From Assam leaves to your daily chai.",
  p1: "Anant Tea is focused on delivering quality tea blends with the aroma, colour and strength that Indian tea lovers expect. We believe good tea is not only a product; it is part of conversations, family time and daily rituals.",
  p2: "Our goal is simple: offer dependable, flavourful Assam tea with thoughtful packaging and a modern buying experience.",
  image: "/about-story-reference.png",
  promiseHeading: "Better Tea for a Brighter Tomorrow",
  promiseBody: "We are committed to bringing the richness of Assam tea to more homes, building long-term relationships with our customers, partners and tea-loving communities.",
};
async function getAboutContent() {
  try {
    const sql = db();
    const rows = await sql`SELECT about_title, about_subtitle, about_story_heading, about_story_p1, about_story_p2, about_story_image_url, about_promise_heading, about_promise_body FROM site_settings WHERE id='default' LIMIT 1`;
    const r = rows[0];
    if (!r) return defaults;
    return {
      title: String(r.about_title || defaults.title),
      subtitle: String(r.about_subtitle || defaults.subtitle),
      storyHeading: String(r.about_story_heading || defaults.storyHeading),
      p1: String(r.about_story_p1 || defaults.p1),
      p2: String(r.about_story_p2 || defaults.p2),
      image: String(r.about_story_image_url || defaults.image),
      promiseHeading: String(r.about_promise_heading || defaults.promiseHeading),
      promiseBody: String(r.about_promise_body || defaults.promiseBody),
    };
  } catch { return defaults; }
}
export const dynamic = "force-dynamic";
export default async function AboutPage() {
  const content = await getAboutContent();
  return (
    <main className="about-page">
      <section className="about-hero">
        <div className="container about-hero-inner">
          <div className="about-hero-copy">
            <div className="breadcrumb">Home › About Us</div>
            <div className="eyebrow">Our Story</div>
            <h1 className="serif">{content.title}</h1>
            <p>{content.subtitle}</p>
            <span className="about-accent" />
          </div>
          <div className="about-hero-art" aria-hidden="true" />
        </div>
      </section>
      <section className="section about-story-section">
        <div className="container about-story-grid">
          <div className="about-story-image">
            <img src={content.image} alt="Anant Tea Assam tea story" />
          </div>
          <div className="about-story-copy">
            <div className="eyebrow">Our Story</div>
            <h2 className="section-title serif">{content.storyHeading}</h2>
            <p className="section-copy">{content.p1}</p>
            <p className="section-copy">{content.p2}</p>
            <div className="about-values">
              <div><span><Leaf /></span><strong>Authentic<br />Assam Tea</strong></div>
              <div><span><Users /></span><strong>Loved by<br />Tea Enthusiasts</strong></div>
              <div><span><ShieldCheck /></span><strong>Committed to<br />Quality</strong></div>
            </div>
          </div>
        </div>
      </section>
      <section className="about-promise">
        <div className="container about-promise-inner">
          <div><div className="eyebrow">Our Promise</div><h2 className="serif">{content.promiseHeading}</h2></div>
          <p>{content.promiseBody}</p>
          <div className="about-promise-art" aria-hidden="true" />
        </div>
      </section>
      <section className="section about-join-section">
        <div className="container about-join-card">
          <div><div className="eyebrow">Grow Together</div><h2 className="section-title serif">Sip. Share. Stay Connected.</h2><p className="section-copy">From everyday chai to growing a tea business, Anant Tea is here to build lasting relationships.</p></div>
          <Link href="/partner" className="primary-btn">Join Us & Become Our Partner</Link>
        </div>
      </section>
    </main>
  );
}
