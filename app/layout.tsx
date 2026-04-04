import type { Metadata } from "next";
import { AppProvider } from "@/lib/context";
import "./globals.css";

export const metadata: Metadata = {
  title: "Health Wallet",
  description: "Your portable health record",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
