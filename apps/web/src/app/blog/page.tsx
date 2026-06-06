import Link from "next/link";

export default function BlogPage() {
  const posts = [
    { slug: "pdl-rating-explained", title: "How PDL rating actually works", tag: "PDL" },
    { slug: "eye-alertness", title: "What is eye alertness?", tag: "FACIAL" },
    { slug: "win-first-battle", title: "5 tips to win your first bark battle", tag: "STRATEGY" },
  ];
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Blog</h1>
      <div className="space-y-4">
        {posts.map((p) => (
          <Link key={p.slug} href={`/blog/${p.slug}`} className="block bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-600">
            <span className="text-xs text-amber-400">{p.tag}</span>
            <h2 className="font-semibold mt-1">{p.title}</h2>
          </Link>
        ))}
      </div>
    </div>
  );
}
