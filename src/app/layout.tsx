import type { Metadata } from "next";
import { Cinzel, Outfit, Space_Mono } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AREF — AI-Powered Learning",
  description:
    "Unlock mastery with personalized AI learning paths. AREF generates structured learning plans with curated books, videos, and AI-powered courses.",
  keywords: ["learning", "AI", "education", "courses", "personalized learning"],
  openGraph: {
    title: "AREF — AI-Powered Learning",
    description: "Unlock mastery with personalized AI learning paths.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${cinzel.variable} ${outfit.variable} ${spaceMono.variable} antialiased bg-background text-text-primary font-outfit`}
      >
        {children}
      </body>
    </html>
  );
}
