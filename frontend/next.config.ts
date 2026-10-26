import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* Desactivar cacheComponents estricto para compatibilidad con RTK Query (Date.now() interno) */
  cacheComponents: false,
  turbopack: {
    root: path.resolve(__dirname),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
