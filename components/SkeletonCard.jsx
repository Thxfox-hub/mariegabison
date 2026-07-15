"use client";

export default function SkeletonCard() {
  return (
    <article aria-hidden="true" className="animate-fade-up">
      <div className="relative aspect-[3/4] overflow-hidden bg-pearl">
        <div className="h-full w-full animate-pulse bg-ink/5" />
      </div>
      <div className="mt-5 text-center">
        <div className="mx-auto h-2.5 w-16 animate-pulse bg-ink/10" />
        <div className="mx-auto mt-3 h-4 w-32 animate-pulse bg-ink/10" />
        <div className="mx-auto mt-2 h-2.5 w-20 animate-pulse bg-ink/10" />
      </div>
    </article>
  );
}
