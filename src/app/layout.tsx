import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JSIBRA - Digital Workspace & Store",
  description: "Interactive 3D Room Portfolio & Store",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#111] text-white antialiased overflow-hidden">
        {children}
      </body>
    </html>
  );
}
