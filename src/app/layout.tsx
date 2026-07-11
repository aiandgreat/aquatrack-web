import React from "react";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap"
});

export const metadata = {
  title: "AquaTrack - Water District Operations Command",
  description: "Municipal Water District Command Center and Resident Service Portal",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body className="antialiased bg-[#EEF4FA]">
        {children}
      </body>
    </html>
  );
}
