const nextConfig = {
  transpilePackages: ["@odoggle/shared"],
  webpack: (config: { experiments: Record<string, boolean> }) => {
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    return config;
  },
  async redirects() {
    return [{ source: "/camera-check", destination: "/arena", permanent: true }];
  },
  async rewrites() {
    const target = process.env.API_PROXY_TARGET ?? "http://localhost:3001";
    return [
      {
        source: "/api/backend/:path*",
        destination: `${target}/api/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/models/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
