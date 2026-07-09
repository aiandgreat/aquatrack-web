import React from "react";
import "./globals.css";

export const metadata = {
  title: "AquaTrack",
  description: "Municipal Water District Command Center",
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
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
