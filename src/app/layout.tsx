import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HENRY, your local fulfillment center",
  description:
    "A repository of Amazon knowledge to help 1P vendors and 3P sellers grow. Buy box, pricing, featured offers, and an Amazonian who answers anything.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=Spline+Sans+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
