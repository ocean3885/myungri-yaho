import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "명리야호",
  description: "AI 명리 상담사 야호와 만나는 오늘의 운세",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
