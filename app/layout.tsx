import type { Metadata } from "next";
import { Unbounded, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const unbounded = Unbounded({
  subsets: ["latin", "cyrillic"],
  variable: "--font-unbounded",
  weight: ["500", "600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Blik Games — киберспортивный хаб колледжа",
  description:
    "Турниры по Brawl Stars, CS2, Dota 2, Valorant и другим играм. Собирай команду и участвуй в киберспортивных турнирах колледжа.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${unbounded.variable} ${inter.variable}`}>
      <body className="font-body min-h-screen bg-[#0a0a0f] bg-noise antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
