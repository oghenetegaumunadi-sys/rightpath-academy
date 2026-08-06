import type { Metadata } from "next";

import { AppProviders } from "@/components/providers/app-providers";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "RightPath Academy",
    template: "%s | RightPath Academy",
  },
  description:
    "RightPath Academy school management and academic information system.",
  icons: {
    icon: "/branding/rightpath-icon.png",
    apple: "/branding/rightpath-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
