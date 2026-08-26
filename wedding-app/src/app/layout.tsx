import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: {
    default: "Vowly — Plan your wedding, privately",
    template: "%s · Vowly",
  },
  description:
    "The most privacy-respecting wedding planning platform. Budget, guests, RSVPs, seating and timeline in one private workspace. No data selling, ever.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-body">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
