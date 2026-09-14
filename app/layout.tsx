import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "./components/navbar";
import { Footer } from "./components/footer";
// Navbar is rendered once here so cart/login/checkout are available on every
// route — previously only "/" rendered a Navbar and every other page (men,
// women, kids, sale, new-arrivals) had no header at all.
// 1. Import your CartProvider
import { CartProvider } from "./components/context/CartContext"; 
import { CartDrawer } from "./components/cart-drawer";
import { AuthProvider } from "./components/context/AuthContext";
import { AuthModalGate } from "./components/login";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fashion",
  description: "Fashion e-commerce website built with Next.js 13 and Tailwind CSS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* 2. Wrap everything inside the AuthProvider + CartProvider */}
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <CartDrawer />
            <AuthModalGate />
            <main className="grow">{children}</main>
            <Footer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}