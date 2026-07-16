import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sentio — AI-Powered Audience Engagement",
  description:
    "Transform presentations, lectures, and meetings into interactive, data-driven experiences with AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Sentio",
              url: "https://sentio.com",
              description: "AI-Powered Audience Engagement Platform",
              publisher: {
                "@type": "Organization",
                name: "Sentio Inc.",
                logo: {
                  "@type": "ImageObject",
                  url: "https://sentio.com/logo.png",
                },
              },
            }),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
