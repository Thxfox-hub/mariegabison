"use client";

import { useEffect, useState } from "react";
import { carouselPieces } from "../../lib/landing-data";
import JewelryModal from "./JewelryModal";

/**
 * Carousel.jsx - Marie Gabison Paris
 * Editorial carousel showcasing the three featured pieces from the source design.
 * Uses static images and opens the original JewelryModal on "Voir plus".
 */
export default function Carousel() {
  const [active, setActive] = useState(0);
  const [selected, setSelected] = useState(null);
  const pieces = carouselPieces;

  useEffect(() => {
    if (pieces.length <= 1) return;
    const timer = window.setInterval(() => {
      setActive((prev) => (prev + 1) % pieces.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, [pieces.length]);

  const goTo = (index) => {
    setActive((index + pieces.length) % pieces.length);
  };

  return (
    <>
      <section className="relative mx-auto max-w-6xl px-4 pb-16 sm:px-6 animate-fade-up delay-200">
        <div className="relative overflow-hidden bg-blanc">
          <div
            className="flex transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ transform: `translateX(-${active * 100}%)` }}
          >
            {pieces.map((piece) => (
              <article
                key={piece.id}
                className="relative min-w-full grid grid-cols-1 md:grid-cols-2"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-pearl md:aspect-auto md:min-h-[560px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={piece.image}
                    alt={piece.name}
                    className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out hover:scale-[1.03]"
                  />
                </div>

                <div className="flex flex-col justify-center border border-ink/8 border-t-0 px-10 py-14 sm:px-14 md:border-l-0 md:border-t md:py-20 bg-blanc">
                  <p className="font-sans text-[10px] font-light uppercase tracking-[0.4em] text-ink-soft">
                    {piece.category} · {piece.edition}
                  </p>
                  <h3 className="mt-5 font-serif text-3xl font-light tracking-[0.06em] text-ink sm:text-4xl">
                    {piece.name}
                  </h3>
                  <p className="mt-6 max-w-sm font-sans text-[13px] font-light leading-[1.85] text-ink-soft">
                    {piece.description.slice(0, 140)}…
                  </p>
                  <p className="mt-5 font-sans text-[11px] font-light uppercase tracking-[0.22em] text-ink">
                    {piece.price}
                  </p>
                  <div className="mt-10 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setSelected(piece)}
                      className="inline-flex items-center gap-3 bg-ink px-8 py-3.5 font-sans text-[10px] font-light uppercase tracking-[0.32em] text-blanc transition duration-300 hover:bg-ink/85"
                    >
                      Voir plus
                    </button>
                    <a
                      href="#contact"
                      className="inline-flex items-center gap-3 border border-ink/20 px-8 py-3.5 font-sans text-[10px] font-light uppercase tracking-[0.32em] text-ink transition duration-300 hover:border-ink"
                    >
                      Acheter
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {pieces.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => goTo(active - 1)}
                aria-label="Précédent"
                className="absolute left-3 top-[38%] z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-ink/10 bg-blanc/90 text-lg text-ink backdrop-blur-sm transition hover:border-ink/30 md:left-5 md:top-1/2"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => goTo(active + 1)}
                aria-label="Suivant"
                className="absolute right-3 top-[38%] z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-ink/10 bg-blanc/90 text-lg text-ink backdrop-blur-sm transition hover:border-ink/30 md:right-5 md:top-1/2"
              >
                ›
              </button>
            </>
          )}
        </div>

        {pieces.length > 1 && (
          <div className="mt-8 flex items-center justify-center gap-3">
            {pieces.map((piece, index) => (
              <button
                key={piece.id}
                type="button"
                onClick={() => goTo(index)}
                aria-label={`Voir ${piece.name}`}
                className={`h-px transition-all duration-500 ${
                  index === active ? "w-10 bg-ink" : "w-4 bg-ink/20 hover:bg-ink/40"
                }`}
              />
            ))}
          </div>
        )}
      </section>

      <JewelryModal piece={selected} onClose={() => setSelected(null)} />
    </>
  );
}
