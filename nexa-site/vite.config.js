import { defineConfig } from "vite";
import { resolve } from "node:path";

// base: "./" — сайт работает из любой папки на хостинге. Две страницы: русская (/) и казахская (/kz/).
export default defineConfig({
  base: "./",
  build: {
    assetsInlineLimit: 0,
    rollupOptions: { input: { main: resolve(__dirname, "index.html"), kz: resolve(__dirname, "kz/index.html") } }
  }
});
