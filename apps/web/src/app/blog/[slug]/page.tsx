import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BLOG_POSTS, getPost } from "@/lib/blog-posts";

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: `${post.title} · Odoggle Blog`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <article className="max-w-2xl mx-auto">
      <Link href="/blog" className="text-sm text-zinc-500 hover:text-amber-400">
        ← Blog
      </Link>
      <p className="text-xs text-amber-400 mt-4">
        {post.tag} · {post.date}
      </p>
      <h1 className="text-3xl font-bold mb-6 mt-2">{post.title}</h1>
      <div className="space-y-4 text-zinc-400 leading-relaxed">
        {post.body.map((para) => (
          <p key={para.slice(0, 24)}>{para}</p>
        ))}
      </div>
    </article>
  );
}
