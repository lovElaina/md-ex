import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Markdown Editor",
  description: "Online Markdown Editor with file management",
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html lang="en">
      <body className={inter.className}>
        <main className="min-h-screen bg-zinc-50">{children}</main>
      </body>
    </html>
  );
};

export default RootLayout;
