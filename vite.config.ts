import devServer from "@hono/vite-dev-server"
import path from "path"
const __dirname = import.meta.dirname
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    devServer({ entry: "api/boot.ts", exclude: [/^\/(?!api\/).*$/] }),
    inspectAttr(),
    react()],
  base: "./",
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@contracts": path.resolve(__dirname, "./contracts"),
      "@db": path.resolve(__dirname, "./db"),
      "db": path.resolve(__dirname, "./db"),
    },
  },
  envDir: path.resolve(__dirname),
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks — third-party libraries
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('scheduler')) return 'vendor-react';
            if (id.includes('react-router') || id.includes('@remix-run')) return 'vendor-router';
            if (id.includes('framer-motion')) return 'vendor-motion';
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('@radix-ui') || id.includes('cmdk') || id.includes('embla-carousel') || id.includes('vaul') || id.includes('sonner')) return 'vendor-ui';
            if (id.includes('@tanstack') || id.includes('@trpc') || id.includes('superjson')) return 'vendor-data';
            if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) return 'vendor-forms';
            if (id.includes('@aws-sdk') || id.includes('@smithy')) return 'vendor-aws';
            if (id.includes('openai') || id.includes('@google/genai')) return 'vendor-ai';
            if (id.includes('recharts')) return 'charts';
            if (id.includes('jspdf') || id.includes('autotable')) return 'pdf';
            if (id.includes('html2canvas')) return 'html2canvas';
            if (id.includes('stripe')) return 'stripe';
            return 'vendor'; // catch-all for remaining node_modules
          }
          // App chunks — pages
          if (id.includes('/src/pages/')) {
            const match = id.match(/\/src\/pages\/([^/]+)\.tsx/);
            if (match) return `page-${match[1].toLowerCase()}`;
          }
          // Hooks chunk
          if (id.includes('/src/hooks/')) return 'hooks';
        },
      },
    },
  },
});
