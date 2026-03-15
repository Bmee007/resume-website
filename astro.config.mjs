// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://borinakeo.vercel.app", // TODO: update to real Vercel URL before launch
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});