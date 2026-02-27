import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/components/providers/convex-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SiteLearn — AI Chat for Your Website",
    template: "%s | SiteLearn",
  },
  description:
    "Turn your website into an intelligent AI assistant. Crawl, index, and deploy a chat widget trained on your content — in minutes.",
  keywords: ["AI chatbot", "website chat", "site search", "knowledge base"],
  openGraph: {
    title: "SiteLearn — AI Chat for Your Website",
    description:
      "Turn your website into an intelligent AI assistant in minutes.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ConvexClientProvider>
          <TooltipProvider delayDuration={300}>
            {children}
            <Toaster position="bottom-right" />
          </TooltipProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
