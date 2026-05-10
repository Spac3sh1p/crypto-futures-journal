import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Crypto Futures Journal",
  description: "Local-first crypto futures trading journal & analytics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${manrope.variable} h-full`}>
      <body className="h-full bg-bg-primary text-text-primary font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
