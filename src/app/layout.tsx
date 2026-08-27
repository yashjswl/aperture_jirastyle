import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Background3D } from "@/components/background-3d";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aperture Platform",
  description: "Internal portal for the working members of Aperture, the digital arts society.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col text-foreground font-sans bg-transparent">
        <Background3D />
        {children}
      </body>
    </html>
  );
}
