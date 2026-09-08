import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Rental Scraper Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-zinc-950 text-zinc-100 min-h-screen font-sans antialiased">
        <nav className="border-b border-zinc-800 px-6 py-3 flex items-center gap-6">
          <span className="font-bold text-white tracking-tight">🏠 Rental Scraper</span>
          <Link href="/" className="text-sm text-zinc-400 hover:text-white transition-colors">
            Dashboard
          </Link>
          <Link href="/listings" className="text-sm text-zinc-400 hover:text-white transition-colors">
            Annonces
          </Link>
        </nav>
        <main className="px-6 py-8 max-w-7xl mx-auto">{children}</main>
      </body>
    </html>
  );
}