import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  server: { port: 4173, host: "127.0.0.1" },
  preview: { port: 4173, host: "127.0.0.1" },
  build: { target: "es2022" },
});
