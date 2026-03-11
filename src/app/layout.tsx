import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AutoTest - Haydovchilik imtihoniga tayyorlanish",
  description: "O'zbekiston UBDD haydovchilik nazariy imtihoniga tayyorlanish platformasi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
