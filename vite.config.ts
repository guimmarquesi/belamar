import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import path from "node:path";

// Official Vite + TanStack Start + React + Tailwind + Cloudflare configuration.
// Replaces @lovable.dev/vite-tanstack-config with the equivalent upstream plugins.
export default defineConfig(({ command, mode }) => {
  // Expose VITE_* variables through import.meta.env for both client and server bundles.
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const define: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    define[`import.meta.env.${key}`] = JSON.stringify(value);
  }

  return {
    define,
    css: { transformer: "lightningcss" as const },
    resolve: {
      alias: { "@": path.resolve(process.cwd(), "src") },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
      ],
    },
    server: {
      host: "::",
      port: 8080,
      strictPort: true,
    },
    plugins: [
      tailwindcss(),
      tsConfigPaths({ projects: ["./tsconfig.json"] }),
      // Keep src/server.ts as the SSR entry (our error-wrapping Worker handler).
      tanstackStart({
        server: { entry: "server" },
      }),
      react(),
      // Cloudflare Workers output is only needed for builds; dev runs on Vite's server.
      ...(command === "build" ? [cloudflare({ viteEnvironment: { name: "ssr" } })] : []),
    ],
  };
});
