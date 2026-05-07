import type { Metadata } from "next";
import { Sofia_Sans, Cormorant_Garamond, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { CookieBanner } from "@/components/layout/CookieBanner";
import "./globals.css";

const sofia = Sofia_Sans({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Old Timer's — Части за класически автомобили",
    template: "%s | Old Timer's",
  },
  description:
    "Намираме оригинални и качествени части за ретро автомобили. От морги в Западна Европа, от проверени производители и от мрежа от ентусиасти.",
  metadataBase: new URL(process.env.BETTER_AUTH_URL ?? "http://localhost:3000"),
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="bg"
      className={`${sofia.variable} ${cormorant.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <CookieBanner />
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
