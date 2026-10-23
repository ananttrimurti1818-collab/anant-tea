"use client";

import { useState } from "react";
import { MessageCircle, Building2, IndianRupee, Car, MapPin, UserRound, Phone } from "lucide-react";

type FormState = {
  name: string;
  phone: string;
  city: string;
  business: string;
  investment: string;
  vehicles: string;
  currentCompanies: string;
  experience: string;
};

const initialState: FormState = {
  name: "",
  phone: "",
  city: "",
  business: "",
  investment: "",
  vehicles: "",
  currentCompanies: "",
  experience: "",
};

export default function PartnerForm() {
  const [form, setForm] = useState<FormState>(initialState);

  function update(key: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit() {
    const cleanPhone = form.phone.replace(/\D/g, "");
    if (!form.name.trim() || cleanPhone.length !== 10 || !form.city.trim() || !form.business.trim()) {
      alert("Please enter your name, valid 10-digit phone number, business name and city.");
      return;
    }

    const message = [
      "Hello Anant Tea,",
      "",
      "I would like to become an Anant Tea Sub Distributor.",
      "",
      `Name: ${form.name.trim()}`,
      `Phone: ${cleanPhone}`,
      `Business Name: ${form.business.trim()}`,
      `City: ${form.city.trim()}`,
      `Investment Capacity: ${form.investment.trim() || "Not specified"}`,
      `Number of Vehicles: ${form.vehicles.trim() || "Not specified"}`,
      `Currently distributing for: ${form.currentCompanies.trim() || "None / Not specified"}`,
      `Distribution Experience: ${form.experience.trim() || "Not specified"}`,
      "",
      "Please contact me regarding the partnership opportunity.",
    ].join("\n");

    window.open(`https://wa.me/917038521818?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="partner-form-card partner-detailed-form">
      <div className="partner-form-heading">
        <span className="partner-form-icon"><Building2 size={19} /></span>
        <div>
          <h3>Become a Sub Distributor</h3>
          <p>Share your business details and send your enquiry directly to Anant Tea on WhatsApp.</p>
        </div>
      </div>

      <div className="partner-form-fields partner-detailed-fields">
        <label><UserRound size={16} /><input type="text" placeholder="Full Name *" value={form.name} onChange={(e) => update("name", e.target.value)} /></label>
        <label><Phone size={16} /><input type="tel" inputMode="numeric" placeholder="Phone Number *" value={form.phone} onChange={(e) => update("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} /></label>
        <label><Building2 size={16} /><input type="text" placeholder="Business Name *" value={form.business} onChange={(e) => update("business", e.target.value)} /></label>
        <label><MapPin size={16} /><input type="text" placeholder="City *" value={form.city} onChange={(e) => update("city", e.target.value)} /></label>
        <label><IndianRupee size={16} /><input type="text" placeholder="Investment Capacity (e.g. ₹5–10 Lakh)" value={form.investment} onChange={(e) => update("investment", e.target.value)} /></label>
        <label><Car size={16} /><input type="text" placeholder="Number of Vehicles" value={form.vehicles} onChange={(e) => update("vehicles", e.target.value)} /></label>
        <label className="partner-field-full"><Building2 size={16} /><input type="text" placeholder="Which other companies do you currently distribute for?" value={form.currentCompanies} onChange={(e) => update("currentCompanies", e.target.value)} /></label>
        <label className="partner-field-full"><textarea placeholder="Tell us about your distribution experience" value={form.experience} onChange={(e) => update("experience", e.target.value)} rows={4} /></label>
        <button type="button" className="primary-btn partner-whatsapp-btn" onClick={handleSubmit}>
          <MessageCircle size={19} />
          Send Details on WhatsApp
        </button>
      </div>
    </div>
  );
}
