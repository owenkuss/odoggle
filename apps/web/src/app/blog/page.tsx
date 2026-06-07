import Link from "next/link";
import { BLOG_POSTS } from "@/lib/blog-posts";

export default function BlogPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Blog</h1>
      <p className="text-zinc-500 mb-8">PDL science, bark battle strategy, and product updates.</p>
      <div className="space-y-4">
        {BLOG_POSTS.map((p) => (
          <Link
            key={p.slug}
            href={`/blog/${p.slug}`}
            className="block bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-600"
          >
            <span className="text-xs text-amber-400">{p.tag}</span>
            <h2 className="font-semibold mt-1">{p.title}</h2>
            <p className="text-sm text-zinc-500 mt-2">{p.excerpt}</p>
            <p className="text-xs text-zinc-600 mt-2">{p.date}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
