import Image from "next/image";
import Link from "next/link";
import { Leaf, Users, ShieldCheck } from "lucide-react";

export default function AboutPage() {
  return (
    <main className="about-page">
      <section className="about-hero">
        <div className="container about-hero-inner">
          <div className="about-hero-copy">
            <div className="breadcrumb">Home › About Us</div>
            <div className="eyebrow">Our Story</div>
            <h1 className="serif">About Anant Tea</h1>
            <p>A tea brand built around the simple joy of a great cup.</p>
            <span className="about-accent" />
          </div>
          <div className="about-hero-art" aria-hidden="true" />
        </div>
      </section>

      <section className="section about-story-section">
        <div className="container about-story-grid">
          <div className="about-story-image">
            <Image src="/about-story-reference.png" alt="Anant Tea Assam tea story" width={740} height={500} priority />
          </div>
          <div className="about-story-copy">
            <div className="eyebrow">Our Story</div>
            <h2 className="section-title serif">From Assam leaves to your daily chai.</h2>
            <p className="section-copy">Anant Tea is focused on delivering quality tea blends with the aroma, colour and strength that Indian tea lovers expect. We believe good tea is not only a product; it is part of conversations, family time and daily rituals.</p>
            <p className="section-copy">Our goal is simple: offer dependable, flavourful Assam tea with thoughtful packaging and a modern buying experience.</p>
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
          <div>
            <div className="eyebrow">Our Promise</div>
            <h2 className="serif">Better Tea<br />for a Brighter Tomorrow</h2>
          </div>
          <p>We are committed to bringing the richness of Assam tea to more homes, building long-term relationships with our customers, partners and tea-loving communities.</p>
          <div className="about-promise-art" aria-hidden="true" />
        </div>
      </section>

      <section className="section about-join-section">
        <div className="container about-join-card">
          <div>
            <div className="eyebrow">Grow Together</div>
            <h2 className="section-title serif">Sip. Share. Stay Connected.</h2>
            <p className="section-copy">From everyday chai to growing a tea business, Anant Tea is here to build lasting relationships.</p>
          </div>
          <Link href="/partner" className="primary-btn">Join Us & Become Our Partner</Link>
        </div>
      </section>
    </main>
  );
}
