import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

/**
 * GitHub Pages serves a project site from /<repo>, so the app has to know its own
 * subpath. Set NEXT_PUBLIC_BASE_PATH at build time (the deploy workflow does this);
 * leave it unset for local dev and root-domain hosts.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  images: {
    unoptimized: true
  },
  trailingSlash: true,
  turbopack: {
    root: projectRoot
  }
};

export default nextConfig;
