const nextConfig = {
  transpilePackages: ["@odoggle/shared"],
  webpack: (config: { experiments: Record<string, boolean> }) => {
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    return config;
  },
};

export default nextConfig;
