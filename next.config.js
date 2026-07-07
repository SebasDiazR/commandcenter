/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // pdfjs-dist references optional Node-only modules that aren't needed in the browser.
    config.resolve.alias = { ...config.resolve.alias, canvas: false };
    config.resolve.fallback = { ...config.resolve.fallback, canvas: false, encoding: false };
    return config;
  },
};

module.exports = nextConfig;
