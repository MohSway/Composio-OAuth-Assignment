import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AuthPilot — OAuth setup guides",
  description: "Clear, actionable guides for registering and getting approved to use OAuth apps.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
