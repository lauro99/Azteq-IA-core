import type { Metadata } from "next";
import { Chakra_Petch } from "next/font/google";
import { LanguageProvider } from "@/components/LanguageContext";
import CookieBanner from "@/components/CookieBanner";
import "./globals.css";

const aztecFont = Chakra_Petch({
  variable: "--font-aztec",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Azteq-IA | Sistema Inteligente",
  description: "Plataforma de IA para la gestión de la planta y conocimiento experto.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${aztecFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <LanguageProvider>
          {children}
          <CookieBanner />
        </LanguageProvider>
      </body>
    </html>
  );
}
