import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { Providers } from "@/components/providers";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/ui";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Odoggle — 1v1 Dog Battle Game · Live PDL Rating",
  description:
    "Random 1v1 arena. Scan your PDL, win ranked matches, climb the global ladder.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "Odoggle — The 1v1 Dog Battle Game",
    description: "On-device PDL rating. Live ranked matches. Climb the global ladder.",
    siteName: "Odoggle",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "Odoggle", description: "1v1 face-off arena · Live PDL rating" },
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={outfit.variable}>
      <body className="theme-body antialiased">
        <div className="theme-ambient" aria-hidden />
        <Providers>
          <Nav />
          <main className="min-h-screen px-6 py-8">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
