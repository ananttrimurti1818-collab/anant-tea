"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";

export default function BulkOrderForm() {
  const [business, setBusiness] = useState("");
  const [quantity, setQuantity] = useState("");
  const [businessType, setBusinessType] = useState("Hotel / Café / Restaurant");
  const [city, setCity] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [requirement, setRequirement] = useState("");

  function submit() {
    const cleanPhone = phone.replace(/\D/g, "");
    if (!business.trim() || !quantity.trim() || !city.trim() || cleanPhone.length !== 10) {
      alert("Please enter business name, quantity, city and a valid 10-digit phone number.");
      return;
    }
    const message = [
      "Hello Anant Tea,", "", "I have a bulk order enquiry for my business.", "",
      `Business Name: ${business.trim()}`,
      `Contact Name: ${name.trim() || "Not specified"}`,
      `Phone: ${cleanPhone}`,
      `City: ${city.trim()}`,
      `Business Type: ${businessType}`,
      `Required Quantity: ${quantity.trim()}`,
      `Requirement: ${requirement.trim() || "Not specified"}`,
      "", "Please contact me with bulk order details."
    ].join("\n");
    window.open(`https://wa.me/917038521818?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="partner-form-card partner-bulk-form">
      <div className="partner-form-heading">
        <span className="partner-form-icon"><MessageCircle size={19} /></span>
        <div>
          <h3>Bulk Order Enquiry</h3>
          <p>For hotels, cafés, restaurants and other business requirements.</p>
        </div>
      </div>
      <div className="partner-form-fields partner-detailed-fields">
        <input type="text" placeholder="Business Name *" value={business} onChange={(e) => setBusiness(e.target.value)} />
        <select value={businessType} onChange={(e) => setBusinessType(e.target.value)}><option>Hotel / Café / Restaurant</option><option>Office / Corporate</option><option>Retail / Other Business</option></select>
        <input type="text" placeholder="Contact Person" value={name} onChange={(e) => setName(e.target.value)} />
        <input type="tel" inputMode="numeric" placeholder="Phone Number *" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} />
        <input type="text" placeholder="City *" value={city} onChange={(e) => setCity(e.target.value)} />
        <input type="text" placeholder="Required Quantity * (e.g. 50 kg / 100 packs)" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        <textarea rows={4} placeholder="Tell us about your requirement" value={requirement} onChange={(e) => setRequirement(e.target.value)} />
        <button type="button" className="primary-btn partner-whatsapp-btn" onClick={submit}>
          <MessageCircle size={19} /> Send Bulk Enquiry on WhatsApp
        </button>
      </div>
    </div>
  );
}
