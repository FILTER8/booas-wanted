import "./globals.css";
import localFont from "next/font/local";
import type { Metadata } from "next";

import { Header } from "@/components/layouts/Header";
import { Footer } from "@/components/layouts/Footer";

const departureMono = localFont({
  src: "./fonts/DepartureMono-Regular.woff",
  variable: "--font-departure-mono"
});

export const metadata: Metadata = {
  metadataBase: new URL("https://1-bitoas.com"),
  title: "BOOAS WANTED",
  description:
    "CC0 open-source Booas Wanted Poster Maker",
  keywords: [
    "BOOA",
    "Shape",
    "CC0",
    "open-source",
    "Next.js",
    "visual poster maker",
    "generative art",
    "on-chain"
  ],
  icons: {
    icon: "/favicon.ico"
  },
  openGraph: {
    title: "BOOAS WANTED",
    description:
      "CC0 open-source Booas Wanted Poster Maker",
    url: "https://1-bitoas.com",
    siteName: "BOOAS WANTED",
    images: [{ url: "/og-banner.png", width: 1200, height: 630 }],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "BOOAS WANTED",
    description:
      "CC0 open-source Booas Wanted Poster Maker",
    images: ["/og-banner.png"]
  }
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${departureMono.variable} font-mono min-h-screen flex flex-col bg-background text-foreground`}
      >
        {/* HEADER */}
        <Header />

        {/* PAGE CONTENT */}
        <main className="flex-1">{children}</main>

        {/* FOOTER */}
        <Footer />
      </body>
    </html>
  );
}