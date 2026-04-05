import type { Metadata, Viewport } from "next";
import { AppProvider } from "@/lib/context";
import ServiceWorkerRegister from "@/lib/service-worker-register";
import OfflineIndicator from "@/lib/offline-indicator";
import "./globals.css";

export const metadata: Metadata = {
  title: "Health Wallet",
  description: "Your portable health record - accessible anytime, anywhere",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Health Wallet",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "Health Wallet",
    description: "Your portable health record",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#059669" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Health Wallet" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" href="/icons/icon-192x192.png" />
      </head>
      <body className="bg-gray-50 text-gray-900">
        <ServiceWorkerRegister />
        <OfflineIndicator />
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
