import type { Metadata } from "next";
import { Exo_2, JetBrains_Mono, Orbitron } from "next/font/google";
import "./globals.css";

const exo2 = Exo_2({
  variable: "--font-exo2",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
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
    <html lang="en" className={`${exo2.variable} ${jetbrainsMono.variable} ${orbitron.variable} h-full`}>
      <body className="h-full bg-bg-primary text-text-primary font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
