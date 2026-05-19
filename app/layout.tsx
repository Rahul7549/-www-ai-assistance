import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";
import Header from "./_components/Header";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "AI Assistant",
  description: "Modern AI Assistant UI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        {/* <Header/> */}
        {children}
      </body>
    </html>
  );
}