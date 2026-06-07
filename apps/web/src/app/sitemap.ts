import type { MetadataRoute } from "next";
import { BLOG_POSTS } from "@/lib/blog-posts";

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
    ...BLOG_POSTS.map((p) => `/blog/${p.slug}`),
  ];
  return routes.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
}
