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

  // 浏览器插件（如沉浸式翻译）会在 React 水合前往 <html> 上加自己的属性，开发模式下会报水合不一致。
  // suppressHydrationWarning 只忽略 <html> 这一层自身属性的差异，子树里的水合问题照常报出。
  return (
    <html lang={locale === "zh" ? "zh-CN" : "en"} className="h-full" suppressHydrationWarning>
      <body className="h-full">
        <LanguageProvider initialLocale={locale}>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
