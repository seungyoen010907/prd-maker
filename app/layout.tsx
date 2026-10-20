import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
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
        <header className="mx-auto w-full max-w-2xl px-4 pt-8 pb-6">
          <p className="text-lg font-bold">레퍼런스 아카이브</p>
          <p className="text-sm text-muted">
            이미지를 모으고 메모를 붙여 나만의 레퍼런스를 쌓는 곳
          </p>
        </header>
        {children}
      </body>
    </html>
  );
}
