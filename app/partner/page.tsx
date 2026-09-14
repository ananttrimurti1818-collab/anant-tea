import PartnerForm from "@/components/partner/PartnerForm";
import { CheckCircle2, Hotel, Users, Handshake } from "lucide-react";
import BulkOrderForm from "@/components/partner/BulkOrderForm";

function PartnershipIntro() {
  return (
    <div className="partner-benefits partner-benefits-light">
      <div className="eyebrow">Business Partnership</div>
      <h2>Become an Anant Tea Sub Distributor</h2>
      <p>Build your local tea business with Anant Tea and serve customers in your city or nearby markets.</p>
      <div className="partner-benefit-list">
        <div><CheckCircle2 size={19} /><span><b>Premium Quality Products</b><small>Trusted tea blends crafted with premium Assam leaves.</small></span></div>
        <div><CheckCircle2 size={19} /><span><b>Strong Brand Support</b><small>Marketing support and growing customer demand.</small></span></div>
        <div><CheckCircle2 size={19} /><span><b>Reliable Supply</b><small>Consistent products and dependable fulfilment.</small></span></div>
      </div>
    </div>
  );
}

export default function PartnerPage() {
  return (
    <main className="partner-page">
      <section className="partner-hero">
        <div className="container partner-hero-inner">
          <div className="partner-hero-copy">
            <div className="breadcrumb">Home › Join Us</div>
            <div className="eyebrow">Grow Together With Anant Tea</div>
            <h1 className="serif">Join Us &<br />Become Our Partner</h1>
            <p>Choose the partnership that fits your business and send your details directly to Anant Tea on WhatsApp. Let&apos;s brew a stronger tomorrow together.</p>
            <div className="partner-hero-points"><span>Premium Assam Tea</span><span>Growing Brand Support</span><span>Reliable Supply & Service</span></div>
          </div>
          <div className="partner-hero-art" aria-hidden="true" />
        </div>
      </section>

      <section className="section partner-page-section">
        <div className="container partner-page-stack">
          <div className="partner-row">
            <PartnershipIntro />
            <PartnerForm />
          </div>

          <section className="bulk-orders-section">
            <div className="bulk-orders-copy">
              <div className="eyebrow">Hotels • Cafés • Restaurants</div>
              <h2 className="serif">Bulk Orders for Your Business</h2>
              <p>Looking for regular tea supply for your hotel, café, restaurant, office or hospitality business? Tell us what you need and our team will connect with you on WhatsApp.</p>
              <div className="bulk-benefits">
                <span><Hotel size={18} /> Hospitality supply</span>
                <span><Users size={18} /> Business-friendly quantities</span>
                <span><Handshake size={18} /> Direct assistance</span>
              </div>
            </div>
            <BulkOrderForm />
          </section>

          <section className="partner-process">
            <div className="eyebrow">Our Partnership Process</div>
            <h2 className="serif">Simple Steps to Get Started</h2>
            <div className="partner-process-grid">
              <div><b>1</b><strong>Share Details</strong><span>Fill in the form and send it on WhatsApp.</span></div>
              <div><b>2</b><strong>We Connect</strong><span>Our team will get in touch with you.</span></div>
              <div><b>3</b><strong>Discuss & Guide</strong><span>We&apos;ll discuss partnership details and support.</span></div>
              <div><b>4</b><strong>Start Growing</strong><span>Begin your journey with Anant Tea.</span></div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

