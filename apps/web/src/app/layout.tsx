import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { Nav, Footer } from "@/components/ui";
import "./globals.css";

export const metadata: Metadata = {
  title: "Odoggle — 1v1 Dog Battle Game · Live PDL Rating",
  description: "Random 1v1 dog face battle arena. Scan your dog's PDL, win the bark off, climb the global top dog ladder.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Nav />
          <main className="min-h-screen px-6 py-8">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
