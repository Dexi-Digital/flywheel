import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Command Center | OTTO Governance",
  description: "Painel executivo de governança e performance para monitoramento de agentes autônomos de vendas",
  keywords: ["IA", "vendas", "automação", "governança", "OTTO"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${ibmPlexMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
