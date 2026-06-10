import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "ColdCraft — Hyper-personalised cold outreach in seconds",
  description:
    "AI-powered sales automation. Research any company and generate personalised cold emails + follow-up sequences instantly.",
  keywords: ["sales automation", "AI email", "cold outreach", "LangChain", "Gemini"],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#0F0F0F] text-[#F0F0F0] antialiased">
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
