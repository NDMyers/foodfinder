import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import PwaRegister from "@/components/revamp/PwaRegister";
import "./globals.css";

const vulfSans = localFont({
  src: [
    { path: "../../public/fonts/Vulf-Sans/VulfSansDemo-Regular.otf", weight: "400", style: "normal" },
    { path: "../../public/fonts/Vulf-Sans/VulfSansDemo-Medium.otf", weight: "500", style: "normal" },
    { path: "../../public/fonts/Vulf-Sans/VulfSansDemo-Bold.otf", weight: "700", style: "normal" },
  ],
  variable: "--font-display",
});

const vulfMono = localFont({
  src: [
    { path: "../../public/fonts/Vulf-Mono/VulfMonoDemo-Regular.otf", weight: "400", style: "normal" },
    { path: "../../public/fonts/Vulf-Mono/VulfMonoDemo-Bold.otf", weight: "700", style: "normal" },
  ],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "FoodFinder",
  description: "Find nearby restaurants, filter quickly, and let the app pick your winner.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
  },
  appleWebApp: {
    title: "FoodFinder",
    capable: true,
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f4f1e8",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${vulfSans.variable} ${vulfMono.variable}`}>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
