import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Anant Tea | Premium Assam Tea",
  description: "Premium Assam tea blends from Anant Tea."
};

export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="en"><body><Navbar/>{children}<Footer/></body></html>;
}