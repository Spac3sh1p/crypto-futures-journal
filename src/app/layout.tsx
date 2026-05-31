import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en" className="h-full">
      <body className="h-full bg-bg-primary text-text-primary font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
