import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// ⚠️ Remplace "quiz-r1" par le nom EXACT de ton repo GitHub.
// Exemple : si ton repo est github.com/yvan/r1-trainer → base: "/r1-trainer/"
const REPO_BASE = "/quiz-r1/";

export default defineConfig(({ command }) => ({
  base: command === "build" ? REPO_BASE : "/",
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "icons/icon-180.png",
        "icons/icon-152.png",
        "icons/icon-120.png",
        "splash/splash-iphone.png",
      ],
      manifest: {
        name: "Quizz R1",
        short_name: "Quizz R1",
        description: "Entraînement personnel à la règle APSAD R1 (sprinkler).",
        theme_color: "#0A0B0F",
        background_color: "#0A0B0F",
        display: "standalone",
        orientation: "portrait",
        scope: REPO_BASE,
        start_url: REPO_BASE,
        icons: [
          { src: "icons/icon-120.png", sizes: "120x120", type: "image/png" },
          { src: "icons/icon-152.png", sizes: "152x152", type: "image/png" },
          { src: "icons/icon-180.png", sizes: "180x180", type: "image/png" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,json,woff2}"],
        navigateFallback: REPO_BASE + "index.html",
      },
    }),
  ],
  build: {
    target: "es2020",
    cssCodeSplit: true,
    sourcemap: false,
  },
}));
