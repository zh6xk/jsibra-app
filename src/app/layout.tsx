import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ibra Farawowan · 3D Room Portfolio",
  description: "Portofolio 3D interaktif dan ruang kerja digital Ibra Farawowan.",
  openGraph: {
    title: "Ibra Farawowan · 3D Room Portfolio",
    description: "Portofolio 3D interaktif dan ruang kerja digital Ibra Farawowan.",
    type: "website",
    url: "https://jsibra.me",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ibra Farawowan · 3D Room Portfolio",
    description: "Portofolio 3D interaktif dan ruang kerja digital Ibra Farawowan.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark">
      <body className="bg-[#111] text-white antialiased overflow-hidden">
        {children}
      </body>
    </html>
  );
}
