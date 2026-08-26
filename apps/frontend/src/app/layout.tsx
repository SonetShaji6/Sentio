import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://sentio.com";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default:
      "Sentio — AI-Powered Interactive Presentations & Audience Engagement",
    template: "%s | Sentio",
  },
  description:
    "Transform presentations, live polls, lectures, and team meetings into real-time interactive, data-driven experiences with generative AI insights and document conversion.",
  keywords: [
    "AI presentation maker",
    "interactive audience engagement",
    "live polling software",
    "real-time Q&A",
    "AI slide generator",
    "convert document to presentation",
    "audience response system",
    "interactive classroom presentations",
    "live meeting engagement",
    "Sentio presentations",
  ],
  authors: [{ name: "Sentio Engineering Team", url: baseUrl }],
  creator: "Sentio Inc.",
  publisher: "Sentio Inc.",
  applicationName: "Sentio",
  category: "Productivity & Collaboration",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "Sentio",
    title:
      "Sentio — AI-Powered Interactive Presentations & Audience Engagement",
    description:
      "Transform presentations, live polls, lectures, and meetings into real-time interactive, data-driven experiences with generative AI.",
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Sentio — Interactive AI Presentation Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Sentio — AI-Powered Interactive Presentations & Audience Engagement",
    description:
      "Transform presentations, live polls, lectures, and meetings into real-time interactive, data-driven experiences with AI.",
    creator: "@sentio_app",
    images: [`${baseUrl}/og-image.png`],
  },
  alternates: {
    canonical: baseUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        url: baseUrl,
        name: "Sentio",
        description: "AI-Powered Audience Engagement Platform",
        publisher: {
          "@id": `${baseUrl}/#organization`,
        },
        potentialAction: {
          "@type": "SearchAction",
          target: `${baseUrl}/join/{search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": `${baseUrl}/#organization`,
        name: "Sentio Inc.",
        url: baseUrl,
        logo: {
          "@type": "ImageObject",
          url: `${baseUrl}/logo.png`,
          width: 512,
          height: 512,
        },
        sameAs: [
          "https://twitter.com/sentio_app",
          "https://github.com/SonetShaji6/Sentio",
          "https://linkedin.com/company/sentio-ai",
        ],
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${baseUrl}/#software`,
        name: "Sentio",
        applicationCategory: "BusinessApplication",
        operatingSystem: "All",
        description:
          "AI-driven presentation platform featuring real-time live audience response, instant document conversion, and interactive polling.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
    ],
  };

  return (
    <html
      lang="en"
      className={`${inter.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans antialiased bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
