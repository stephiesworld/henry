import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HENRY — your local fulfillment center",
  description:
    "A repository of Amazon knowledge to help 1P vendors and 3P sellers grow. Buy box, pricing, featured offers, and an Amazonian who answers anything.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
