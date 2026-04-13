import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Invoice Velosi Pro",
  description: "Unified Multi-Client Invoice & SES Tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#111827] text-[#e4e4e7]`}>
        <Sidebar />
        <main className="ml-64 p-8 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
