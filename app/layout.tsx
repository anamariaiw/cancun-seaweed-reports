import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cancun Seaweed Reports",
  description: "Community-submitted Cancun and Riviera Maya beach condition reports."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
