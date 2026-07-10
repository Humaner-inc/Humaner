import localFont from "next/font/local";

export const fellix = localFont({
  src: "../public/fonts/Fellix-Regular.ttf",
  variable: "--font-fellix",
  display: "swap",
  weight: "400",
  fallback: ["system-ui", "sans-serif"],
});

export const theSeasons = localFont({
  src: "../public/fonts/Fontspring-DEMO-theseasons-bd.otf",
  variable: "--font-the-seasons",
  display: "swap",
  weight: "700",
});

export const humanerMono = localFont({
  src: [
    {
      path: "../public/fonts/JetBrainsMono-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/JetBrainsMono-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/JetBrainsMono-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-humaner-mono",
  display: "swap",
});
