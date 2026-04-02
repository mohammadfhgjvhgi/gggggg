import type { Metadata } from "next";
import { Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const notoArabic = Noto_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "نظام إدارة صالات الأفراح",
  description: "نظام متكامل لإدارة صالات الأفراح - تحكم بالأجهزة، الحجوزات، الزبائن، والمدفوعات",
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="dark" suppressHydrationWarning>
      <body
        className={`${notoArabic.variable} antialiased bg-background text-foreground font-[family-name:var(--font-arabic)]`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
