import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import { Suspense } from "react";
import Header from "@/components/Header";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "레퍼런스 아카이브",
  description: "이미지를 모으고 메모를 붙여 나만의 레퍼런스를 쌓는 곳",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${notoSansKr.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        {/* usePathname 때문에 Suspense로 감싼다 (cacheComponents, AGENTS.md) */}
        <Suspense fallback={<div className="h-24" />}>
          <Header />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
