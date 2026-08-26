import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sentio — AI-Powered Audience Engagement Platform",
    short_name: "Sentio",
    description:
      "Transform presentations, live polls, lectures, and meetings into real-time interactive, data-driven experiences with AI.",
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#09090b",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
