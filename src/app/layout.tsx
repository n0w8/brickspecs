import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BrickSpecs - LEGO-Lexikon, Preise, Leaks & City-Ideen",
  description:
    "Das Portal für LEGO-Sammler: Set-Lexikon mit Steckbriefen, Minifiguren-Datenbank, Preisentwicklungen, EOL-Radar, Leaks & Deals und LEGO-City-Inspiration.",
  applicationName: "BrickSpecs",
  appleWebApp: { capable: true, title: "BrickSpecs", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0a0e1a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LanguageProvider>
          <Header />
          <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pb-20">
            {children}
          </main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
