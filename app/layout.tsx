import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "公众号自动化运营系统",
  description: "选题、写作、标题、发布包、日历、复盘与素材库工作台"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
