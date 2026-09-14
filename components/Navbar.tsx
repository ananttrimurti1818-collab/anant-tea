"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, MessageCircle, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import CartBadge from "./CartBadge";
import { useEffect, useState } from "react";

const links = [
  ["Home", "/"],
  ["Products", "/products"],
  ["About Us", "/about"],
  ["Gallery", "/gallery"],
  ["Contact", "/contact"],
] as const;

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [announcement, setAnnouncement] = useState({
    enabled: true,
    message: "🚚 Free shipping on orders above ₹499",
    items: ["Premium Assam Tea Blends", "Order on WhatsApp"],
  });

  useEffect(() => {
    fetch("/api/site-settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) =>
        setAnnouncement({
          enabled: d.enabled !== false,
          message: d.message || "",
          items: Array.isArray(d.items) ? d.items : [],
        }),
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      {announcement.enabled && (
        <div className="announcement-bar">
          <div className="announcement-inner">
            <span>{announcement.message}</span>
            {announcement.items.map((item, index) => (
              <span key={`${item}-${index}`}>
                <span className="announcement-divider">|</span> {item}
              </span>
            ))}
          </div>
        </div>
      )}

      <header className="site-navbar">
        <div className="navbar-inner">
          <Link href="/" className="navbar-logo" aria-label="Anant Tea home">
            <Image
              src="/logo.png"
              alt="Anant Tea"
              width={145}
              height={70}
              priority
            />
          </Link>

          <nav className="navbar-links" aria-label="Main navigation">
            {links.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className={pathname === href ? "active" : undefined}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="navbar-actions">
            <Link href="/cart" className="cart-button" aria-label="Shopping cart">
              <ShoppingCart size={22} />
              <CartBadge />
            </Link>

            <a
              href="https://wa.me/917038521818"
              target="_blank"
              rel="noopener noreferrer"
              className="whatsapp-button"
            >
              <MessageCircle size={19} />
              <span>Order on WhatsApp</span>
            </a>

            <button
              type="button"
              className="mobile-menu-button"
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X size={23} /> : <Menu size={23} />}
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <>
          <button
            type="button"
            className="mobile-menu-backdrop"
            aria-label="Close navigation menu"
            onClick={() => setMenuOpen(false)}
          />
          <div className="mobile-menu-panel">
            <nav aria-label="Mobile navigation">
              {links.map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  className={pathname === href ? "active" : undefined}
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </Link>
              ))}
              <Link href="/partner" className="mobile-partner-link" onClick={() => setMenuOpen(false)}>
                Join Us & Become Our Partner
              </Link>
            </nav>
            <a
              href="https://wa.me/917038521818"
              target="_blank"
              rel="noopener noreferrer"
              className="mobile-menu-whatsapp"
              aria-label="Order on WhatsApp"
            >
              <MessageCircle size={19} />
              Order on WhatsApp
            </a>
          </div>
        </>
      )}
    </>
  );
}
