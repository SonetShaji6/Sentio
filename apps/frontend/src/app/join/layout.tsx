import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Join Live Presentation Session — Sentio",
  description:
    "Enter a 6-character room code or scan a QR code to participate in live audience interactive presentations, polls, and Q&A with Sentio.",
  keywords: [
    "join live presentation",
    "Sentio session code",
    "interactive audience participation",
    "live voting room",
  ],
  alternates: {
    canonical: "/join",
  },
};

export default function JoinLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
