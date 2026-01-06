import path from "path";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@rjax\/excalidraw\/index\.css$/,
        replacement: path.resolve(
          __dirname,
          "../../packages/excalidraw/dist/dev/index.css",
        ),
      },
      {
        find: /^@excalidraw\/excalidraw$/,
        replacement: path.resolve(
          __dirname,
          "../../packages/excalidraw/index.tsx",
        ),
      },
      {
        find: /^@excalidraw\/excalidraw\/(.*?)/,
        replacement: path.resolve(
          __dirname,
          "../../packages/excalidraw/$1",
        ),
      },
      {
        find: /^@rjax\/excalidraw$/,
        replacement: path.resolve(
          __dirname,
          "../../packages/excalidraw/index.tsx",
        ),
      },
      {
        find: /^@rjax\/excalidraw\/(.*?)/,
        replacement: path.resolve(
          __dirname,
          "../../packages/excalidraw/$1",
        ),
      },
      {
        find: /^@excalidraw\/utils$/,
        replacement: path.resolve(
          __dirname,
          "../../packages/utils/index.ts",
        ),
      },
      {
        find: /^@excalidraw\/utils\/(.*?)/,
        replacement: path.resolve(
          __dirname,
          "../../packages/utils/$1",
        ),
      },
      {
        find: /^@excalidraw\/math$/,
        replacement: path.resolve(
          __dirname,
          "../../packages/math/index.ts",
        ),
      },
      {
        find: /^@excalidraw\/math\/(.*?)/,
        replacement: path.resolve(
          __dirname,
          "../../packages/math/$1",
        ),
      },
    ],
  },
  server: {
    port: 3001,
    // open the browser
    open: true,
  },
  publicDir: "public",
  optimizeDeps: {
    esbuildOptions: {
      // Bumping to 2022 due to "Arbitrary module namespace identifier names" not being
      // supported in Vite's default browser target https://github.com/vitejs/vite/issues/13556
      target: "es2022",
      treeShaking: true,
    },
  },
});
