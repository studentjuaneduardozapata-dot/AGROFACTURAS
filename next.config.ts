import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Especificar raíz del workspace para evitar warning de múltiples lockfiles
    root: __dirname,
  },
};

export default nextConfig;
