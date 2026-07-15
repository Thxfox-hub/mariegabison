"use client";

import Link from "next/link";
import { useTranslation } from "../../lib/i18n/context";

/**
 * JewelryGrid.jsx - Marie Gabison Paris
 * Editorial product grid showcasing pieces from the GAS catalog.
 * Replaces the static collection grid with live Google Apps Script data.
 * "Voir plus" navigates to the dedicated product page (/product/[id]).
 * "Acheter" links to the contact section.
 */
export default function JewelryGrid({ items = [], title = "Découvrir la collection One Day Only" }) {
  const { lang } = useTranslation();

  const formatPrice = (p) => {
    const n = Number(p);
    if (!Number.isFinite(n) || n === 0) return "Sur demande";
    const locale = lang === "en" ? "en-US" : lang === "ru" ? "ru-RU" : lang === "it" ? "it-IT" : "fr-FR";
    return new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(n);
  };

  return (
    <section id="collection" className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      <div className="mb-14 text-center">
        <h2 className="font-serif text-3xl font-light tracking-[0.06em] text-ink sm:text-4xl">
          {title}
        </h2>
        <p className="mx-auto mt-5 max-w-lg font-sans text-[12px] font-light leading-relaxed tracking-[0.04em] text-ink-soft">
          Des modèles uniques et des pièces signatures numérotées.
          Cliquez pour découvrir le détail et être accompagnée pour l&apos;achat
          ou une création sur-mesure à Paris.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((piece, index) => {
          const href = `/product/${encodeURIComponent(piece.id || piece.title)}`;
          return (
            <article
              key={piece.id || piece.title || index}
              className="group animate-fade-up"
              style={{ animationDelay: `${0.08 * (index % 3)}s` }}
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-pearl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={piece.imageUrl || piece.image || ""}
                  alt={piece.title || piece.name || ""}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />

                <div className="absolute inset-x-0 bottom-0 flex translate-y-2 flex-col gap-2 p-5 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 backdrop-blur-[2px] bg-gradient-to-t from-blanc/60 to-transparent">
                  <Link
                    href={href}
                    className="w-full border border-blanc/70 bg-blanc/95 px-4 py-3 text-center font-sans text-[10px] font-light uppercase tracking-[0.28em] text-ink backdrop-blur-sm transition hover:bg-blanc"
                  >
                    Voir plus
                  </Link>
                  <a
                    href="#contact"
                    className="w-full border border-blanc/40 bg-ink/90 px-4 py-3 text-center font-sans text-[10px] font-light uppercase tracking-[0.28em] text-blanc backdrop-blur-sm transition hover:bg-ink"
                  >
                    Acheter
                  </a>
                </div>

                {piece.category && (
                  <span className="absolute left-4 top-4 bg-blanc/90 px-3 py-1.5 font-sans text-[9px] font-light uppercase tracking-[0.18em] text-ink backdrop-blur-sm">
                    {piece.category}
                  </span>
                )}
              </div>

              <div className="mt-5 text-center">
                <p className="font-sans text-[10px] font-light uppercase tracking-[0.32em] text-ink-soft">
                  {piece.category || ""}
                </p>
                <h3 className="mt-2 font-serif text-[1.35rem] font-light tracking-[0.04em] text-ink">
                  {piece.title || piece.name}
                </h3>
                <p className="mt-2 font-sans text-[11px] font-light tracking-[0.12em] text-ink-soft">
                  {formatPrice(piece.price)}
                </p>
                <div className="mt-4 flex items-center justify-center gap-5">
                  <Link
                    href={href}
                    className="font-sans text-[10px] font-light uppercase tracking-[0.24em] text-ink-soft underline decoration-ink/15 underline-offset-6 transition hover:text-ink hover:decoration-ink/40"
                  >
                    Voir plus
                  </Link>
                  <a
                    href="#contact"
                    className="font-sans text-[10px] font-light uppercase tracking-[0.24em] text-ink underline decoration-ink/25 underline-offset-6 transition hover:decoration-ink"
                  >
                    Acheter
                  </a>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
