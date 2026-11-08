import { defineConfig } from "vite";

// base: "./" — сайт работает из любой папки на хостинге
export default defineConfig({
  base: "./",
  build: { assetsInlineLimit: 0 }
});
