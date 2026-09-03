import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: {
    default: "vowly — plan beautifully",
    template: "%s · vowly",
  },
  description:
    "The most privacy-respecting wedding planning platform. Budget, guests, RSVPs, seating and timeline in one private workspace. No data selling, ever.",
  icons: [
    { url: "/brand/05_FAVICON/favicon.svg", type: "image/svg+xml" },
    { url: "/brand/05_FAVICON/favicon-32.png", sizes: "32x32", type: "image/png" },
    { url: "/brand/05_FAVICON/favicon-16.png", sizes: "16x16", type: "image/png" },
  ],
};

export const viewport: Viewport = {
  themeColor: "#6E2F3A",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-body">
        <ToastProvider>{children}</ToastProvider>
        <Analytics />
      </body>
    </html>
  );
}
