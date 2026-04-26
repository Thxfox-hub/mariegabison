"use client";

export default function SkeletonCard() {
  return (
    <article className="card skeleton-card" aria-hidden="true">
      <div className="card-media" />
      <div className="card-body">
        <div className="skeleton-line long skeleton" />
        <div className="skeleton-line medium skeleton" />
      </div>
    </article>
  );
}
