"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Tags,
  TicketPercent,
  ShoppingBag,
  Users,
  BarChart3,
  MessageCircle,
  Megaphone,
  Images,
  ExternalLink,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase-client";

const navigation = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    name: "Products",
    href: "/admin/products",
    icon: Package,
  },
  {
    name: "Gallery",
    href: "/admin/gallery",
    icon: Images,
  },
  {
    name: "Categories",
    href: "/admin/categories",
    icon: Tags,
  },
  {
    name: "Coupons",
    href: "/admin/coupons",
    icon: TicketPercent,
  },
  {
    name: "Orders",
    href: "/admin/orders",
    icon: ShoppingBag,
  },
  {
    name: "Customers",
    href: "/admin/customers",
    icon: Users,
  },
  {
    name: "Sales Reports",
    href: "/admin/reports",
    icon: BarChart3,
  },
  {
    name: "WhatsApp Messages",
    href: "/admin/settings",
    icon: MessageCircle,
  },
  {
    name: "Marketing",
    href: "/admin/marketing",
    icon: Megaphone,
  },
  {
    name: "Promotional Header",
    href: "/admin/site-settings",
    icon: Megaphone,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(pathname !== "/admin/login");

  useEffect(() => {
    if (pathname === "/admin/login") return;
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (!user) {
        router.replace("/admin/login");
        return;
      }
      try {
        const idToken = await user.getIdToken();
        const response = await fetch("/api/admin/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });
        if (!response.ok) {
          await signOut(firebaseAuth);
          router.replace("/admin/login");
          return;
        }
        setAuthLoading(false);
      } catch {
        await signOut(firebaseAuth);
        router.replace("/admin/login");
      }
    });
    return () => unsubscribe();
  }, [pathname, router]);

  async function handleLogout() {
    await signOut(firebaseAuth);
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  if (pathname === "/admin/login") return <>{children}</>;
  if (authLoading) {
    return <div className="admin-auth-loading"><img src="/logo.png" alt="Anant Tea" /><span>Checking admin access…</span></div>;
  }

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }

    return pathname.startsWith(href);
  };

  return (
    <div className="admin-shell">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <button
          className="admin-sidebar-overlay"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`admin-sidebar ${
          sidebarOpen ? "admin-sidebar-open" : ""
        }`}
      >
        <div className="admin-sidebar-header">
          <Link
            href="/admin"
            className="admin-brand"
            onClick={() => setSidebarOpen(false)}
          >
            <img src="/logo.png" alt="Anant Tea" />
            <div>
              <strong>Anant Tea</strong>
              <span>Management</span>
            </div>
          </Link>

          <button
            className="admin-mobile-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={21} />
          </button>
        </div>

        <div className="admin-nav-label">MANAGEMENT</div>

        <nav className="admin-navigation">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-nav-item ${
                  active ? "admin-nav-item-active" : ""
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={19} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar-bottom">
          <Link
            href="/"
            target="_blank"
            className="admin-view-store"
          >
            <ExternalLink size={17} />
            View Store
          </Link>

          <button className="admin-logout" onClick={handleLogout}>
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="admin-main">
        <header className="admin-topbar">
          <button
            className="admin-mobile-menu"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>

          <div className="admin-topbar-title">
            <span>ANANT TEA MANAGEMENT</span>
            <strong>Admin Panel</strong>
          </div>

          <div className="admin-topbar-right">
            <span className="admin-status-dot" />
            <span>Admin</span>
          </div>
        </header>

        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}