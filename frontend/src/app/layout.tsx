import React from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/contexts/ToastContext";
import ToastContainer from "@/components/ToastContainer";
import WaveBackground from "@/components/WaveBackground";
import HydrationProvider from "@/components/HydrationProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Asset Management System",
  description: "Comprehensive Asset Management System",
};

// Ensure proper mobile scaling and notch safe areas
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover" as const,
};

export default function RootLayout({ children }: React.PropsWithChildren) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen overflow-x-hidden`}
      >
        <WaveBackground opacity={0.9} speed={0.3} />
        <ToastProvider>
          <HydrationProvider>
            {children}
            <ToastContainer />
          </HydrationProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
