"use client";

import { useEffect, useRef } from "react";
import BackButton from "../BackButton";
import { useTranslation } from "../../lib/i18n/context";

/**
 * JewelryModal.jsx - Marie Gabison Paris
 * Fullscreen modal for static landing carousel pieces.
 * No scrollbar — content scrolls naturally with a subtle blur gradient
 * at the bottom to indicate more content below.
 */
export default function JewelryModal({ piece, onClose }) {
  const { t } = useTranslation();
  const scrollRef = useRef(null);

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
      className="fixed inset-0 z-50 bg-blanc animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="jewelry-title"
    >
      {/* Back button — top right */}
      <div className="fixed right-6 top-6 z-20">
        <BackButton onClick={onClose} label="Retour" />
      </div>

      {/* Scrollable content — no visible scrollbar */}
      <div
        ref={scrollRef}
        className="h-screen w-screen overflow-y-auto"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <style>{`div::-webkit-scrollbar{display:none}`}</style>

        <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
          {/* Image side */}
          <div className="relative min-h-[50vh] md:min-h-screen">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={piece.image}
              alt={piece.name}
              className="h-full w-full object-cover"
            />
          </div>

          {/* Text side */}
          <div className="flex flex-col justify-center px-8 py-20 sm:px-12 md:py-24">
            <p className="font-sans text-[10px] font-light uppercase tracking-[0.38em] text-ink-soft">
              {piece.category}
            </p>
            <h3
              id="jewelry-title"
              className="mt-3 font-serif text-3xl font-light tracking-[0.05em] text-ink sm:text-4xl"
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
                {t('landing.buy')}
              </a>
              <a
                href="#contact"
                onClick={onClose}
                className="inline-flex border border-ink/20 px-7 py-3.5 font-sans text-[10px] font-light uppercase tracking-[0.28em] text-ink transition hover:border-ink"
              >
                {t('landing.contactAdvisor')}
              </a>
            </div>
          </div>
        </div>

        {/* Subtle blur gradient at bottom to indicate scroll continues */}
        <div className="pointer-events-none fixed inset-x-0 bottom-0 h-16 bg-gradient-to-t from-blanc/80 to-transparent backdrop-blur-[1px]" />
      </div>
    </div>
  );
}
