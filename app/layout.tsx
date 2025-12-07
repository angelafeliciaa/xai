import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const gtStandard = localFont({
  src: "./fonts/GT-Standard-M-Standard-Medium-Trial.otf",
  variable: "--font-gt-standard",
  weight: "500",
  display: "swap",
});

export const metadata: Metadata = {
  title: "xCreator",
  description: "AI-powered brand-creator matchmaking platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${gtStandard.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
