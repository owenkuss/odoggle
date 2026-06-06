import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_URL ?? "https://odoggle.com";
  const routes = [
    "",
    "/lab",
    "/arena",
    "/camera-check",
    "/leaderboard",
    "/spectate",
    "/room",
    "/profile",
    "/pricing",
    "/about",
    "/blog",
    "/terms",
    "/privacy",
  ];
  return routes.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
}
