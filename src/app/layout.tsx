import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";
import { getServerLocale } from "@/lib/i18n-server";

export const metadata: Metadata = {
  title: "合约交易复盘",
  description: "面向合约交易者的交易复盘与数据分析工具",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getServerLocale();

  return (
    <html lang={locale === "zh" ? "zh-CN" : "en"} className="h-full">
      <body className="h-full">
        <LanguageProvider initialLocale={locale}>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
