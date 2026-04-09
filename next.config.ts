import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // @ts-expect-error - Desactivamos el aviso de TypeScript en la compilación de Vercel
    turbopack: {
      root: '../',
    },
  },
};

export default nextConfig;
