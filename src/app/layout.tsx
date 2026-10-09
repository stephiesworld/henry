import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HENRY: your local fulfillment center",
  description:
    "The first place Amazon 1P vendors go for Vendor Central questions: margins, chargebacks, cost increases, buy box, and Amazon's latest changes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;0,6..72,500;1,6..72,300;1,6..72,400&family=Space+Grotesk:wght@400;500&family=Spline+Sans+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
