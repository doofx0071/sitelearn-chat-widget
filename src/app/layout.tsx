import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/components/providers/convex-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

const fontSans = Geist_Mono({
  variable: "--font-sans",
  subsets: ["latin"],
});

const fontSerif = Geist_Mono({
  variable: "--font-serif",
  subsets: ["latin"],
});

const fontMono = Geist_Mono({
  variable: "--font-mono",
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
  icons: {
    icon: [
      {
        url: "/logo/lightmode-sitelearn.svg",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/logo/darkmode-sitelearn.svg",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    shortcut: "/logo/lightmode-sitelearn.svg",
    apple: "/logo/lightmode-sitelearn.svg",
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
        className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable} antialiased`}
      >
        <ConvexClientProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <TooltipProvider delayDuration={300}>
              {children}
              <Toaster position="top-right" />
            </TooltipProvider>
          </ThemeProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
