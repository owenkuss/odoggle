export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <article className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 capitalize">{slug.replace(/-/g, " ")}</h1>
      <p className="text-zinc-400 leading-relaxed">
        Odoggle&apos;s PDL rating uses 46 DogFLW facial landmarks computed entirely in your browser.
        Five sub-scores — symmetry, harmony, muzzle, coat, and eye alertness — combine into a 1–10 composite.
        Nothing is uploaded. The bark battle is audience-judged; PDL is a starting point, not the verdict.
      </p>
    </article>
  );
}
