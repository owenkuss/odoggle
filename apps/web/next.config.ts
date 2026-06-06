const nextConfig = {
  transpilePackages: ["@odoggle/shared"],
  webpack: (config: { experiments: Record<string, boolean> }) => {
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    return config;
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
