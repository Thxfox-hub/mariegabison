"use client";

/**
 * BackButton.jsx - Marie Gabison Paris
 * Reusable black pill "← Retour" button with white text.
 * Slightly rounded (not fully round). Positioned top-right by default.
 */
export default function BackButton({ onClick, label = "Retour", className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 bg-ink px-5 py-2.5 font-sans text-[10px] font-light uppercase tracking-[0.28em] text-blanc transition hover:bg-ink/85 ${className}`}
    >
      <span aria-hidden>←</span>
      {label}
    </button>
  );
}
