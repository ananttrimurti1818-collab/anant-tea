"use client";

import Link from "next/link";
import Image from "next/image";
import { MessageCircle, Phone, Mail, MapPin } from "lucide-react";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  // Never show the public website footer inside admin.
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand">
          <Image
            src="/logo.png"
            alt="Anant Tea"
            width={150}
            height={70}
          />

          <p>
            Premium Assam tea blends crafted for rich flavour,
            freshness and an unforgettable cup of tea.
          </p>

          <a
            href="https://wa.me/917038521818"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-whatsapp"
          >
            <MessageCircle size={18} />
            Order on WhatsApp
          </a>
        </div>

        <div className="footer-column">
          <h3>Quick Links</h3>

          <Link href="/">Home</Link>
          <Link href="/products">Products</Link>
          <Link href="/about">About Us</Link>
          <Link href="/gallery">Gallery</Link>
          <Link href="/contact">Contact</Link>
        </div>

        <div className="footer-column">
          <h3>Shop</h3>

          <Link href="/products">All Products</Link>
          <Link href="/cart">Shopping Cart</Link>
          <Link href="/checkout">Checkout</Link>
        </div>

        <div className="footer-column footer-contact">
          <h3>Contact Us</h3>

          <p>
            <MapPin size={17} />
            India
          </p>

          <p>
            <Phone size={17} />
            +91 70385 21818
          </p>

          <p>
            <Mail size={17} />
            hello@ananttea.com
          </p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Anant Tea. All rights reserved.</p>

        <div className="footer-bottom-links">
          <Link href="/contact">Contact</Link>
          <Link href="/about">About</Link>
          <span>Designed and Developed by <a href="https://arvikdigital.in" target="_blank" rel="noopener noreferrer">Arvik Digital</a></span>
        </div>
      </div>
    </footer>
  );
}