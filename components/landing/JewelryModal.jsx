"use client";

import { useEffect } from "react";

/**
 * JewelryModal.jsx - Marie Gabison Paris
 * Editorial modal for static landing carousel pieces.
 * Mirrors the design from wedding-jewelry-landing-page.
 */
export default function JewelryModal({ piece, onClose }) {
  useEffect(() => {
    if (!piece) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [piece, onClose]);

  if (!piece) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="jewelry-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-ink/55 backdrop-blur-[2px]"
        aria-label="Fermer"
        onClick={onClose}
      />

      <div className="relative z-10 grid max-h-[92vh] w-full max-w-4xl overflow-y-auto bg-blanc shadow-2xl animate-scale-in md:grid-cols-2 md:overflow-hidden">
        <div className="relative aspect-[3/4] md:aspect-auto md:min-h-[560px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={piece.image}
            alt={piece.name}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="relative flex flex-col justify-center px-8 py-12 sm:px-12">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center text-ink-soft transition hover:text-ink"
            aria-label="Fermer"
          >
            ✕
          </button>

          <p className="font-sans text-[10px] font-light uppercase tracking-[0.38em] text-ink-soft">
            {piece.category}
          </p>
          <h3
            id="jewelry-title"
            className="mt-3 font-serif text-3xl font-light tracking-[0.05em] text-ink"
          >
            {piece.name}
          </h3>
          <div className="mt-5 h-px w-8 bg-ink/20" />
          <p className="mt-6 font-sans text-[13px] font-light leading-[1.85] text-ink-soft">
            {piece.description}
          </p>
          <p className="mt-5 font-sans text-[11px] font-light uppercase tracking-[0.18em] text-ink">
            {piece.material}
          </p>
          <p className="mt-2 font-sans text-[12px] font-light tracking-[0.08em] text-ink-soft">
            {piece.price} — {piece.edition}
          </p>

          <ul className="mt-7 space-y-2.5">
            {piece.details.map((detail) => (
              <li
                key={detail}
                className="flex items-start gap-3 font-sans text-[12px] font-light text-ink-soft"
              >
                <span className="mt-2 h-px w-3 shrink-0 bg-ink/30" />
                {detail}
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-wrap gap-3">
            <a
              href="#contact"
              onClick={onClose}
              className="inline-flex bg-ink px-7 py-3.5 font-sans text-[10px] font-light uppercase tracking-[0.28em] text-blanc transition hover:bg-ink/85"
            >
              Acheter
            </a>
            <a
              href="#contact"
              onClick={onClose}
              className="inline-flex border border-ink/20 px-7 py-3.5 font-sans text-[10px] font-light uppercase tracking-[0.28em] text-ink transition hover:border-ink"
            >
              Contacter un conseiller
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
