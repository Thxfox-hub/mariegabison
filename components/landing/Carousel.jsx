"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { carouselPieces } from "../../lib/landing-data";
import { useTranslation } from "../../lib/i18n/context";
import JewelryModal from "./JewelryModal";

/**
 * Carousel.jsx - Marie Gabison Paris
 * Editorial carousel with touch/swipe support and auto-rotation pause.
 */
const PAUSE_DURATION = 8000; // pause after user interaction (ms)
const AUTO_INTERVAL = 5500;  // auto-rotation interval (ms)

export default function Carousel() {
  const { t } = useTranslation();
  const [active, setActive] = useState(0);
  const [selected, setSelected] = useState(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const pieces = carouselPieces;

  const pauseUntilRef = useRef(0);
  const touchStartXRef = useRef(null);
  const touchStartYRef = useRef(null);
  const isSwipingRef = useRef(false);

  // ─── Auto-rotation (pauses after user interaction) ───
  useEffect(() => {
    if (pieces.length <= 1) return;
    const timer = window.setInterval(() => {
      if (Date.now() < pauseUntilRef.current) return; // still paused
      setActive((prev) => (prev + 1) % pieces.length);
    }, AUTO_INTERVAL);
    return () => window.clearInterval(timer);
  }, [pieces.length]);

  // ─── Pause auto-rotation for PAUSE_DURATION ───
  const pauseAuto = useCallback(() => {
    pauseUntilRef.current = Date.now() + PAUSE_DURATION;
  }, []);

  const goTo = useCallback((index) => {
    setActive((index + pieces.length) % pieces.length);
    pauseAuto();
  }, [pieces.length, pauseAuto]);

  // ─── Touch handlers for swipe ───
  const onTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    isSwipingRef.current = false;
    setIsDragging(true);
  };

  const onTouchMove = (e) => {
    if (touchStartXRef.current === null || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - touchStartXRef.current;
    const dy = e.touches[0].clientY - touchStartYRef.current;

    // Determine if this is a horizontal swipe (vs vertical scroll)
    if (!isSwipingRef.current) {
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
        isSwipingRef.current = true;
        pauseAuto();
      } else if (Math.abs(dy) > 10) {
        // Vertical scroll — don't hijack
        touchStartXRef.current = null;
        return;
      }
    }

    if (isSwipingRef.current) {
      // Prevent vertical scroll while swiping horizontally
      e.preventDefault();
      // Clamp offset to prevent over-drag
      const maxDrag = window.innerWidth * 0.4;
      const clamped = Math.max(-maxDrag, Math.min(maxDrag, dx));
      setDragOffset(clamped);
    }
  };

  const onTouchEnd = () => {
    if (touchStartXRef.current === null) {
      setIsDragging(false);
      return;
    }
    const threshold = 50; // px to trigger slide change
    if (isSwipingRef.current && Math.abs(dragOffset) > threshold) {
      if (dragOffset < 0) {
        setActive((prev) => (prev + 1) % pieces.length);
      } else {
        setActive((prev) => (prev - 1 + pieces.length) % pieces.length);
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    isSwipingRef.current = false;
    setDragOffset(0);
    setIsDragging(false);
    pauseAuto();
  };

  // ─── Compute transform with drag offset ───
  const slideWidth = 100; // %
  const baseTranslate = -(active * slideWidth);
  const dragPercent = isDragging && dragOffset !== 0
    ? (dragOffset / (typeof window !== "undefined" ? window.innerWidth : 1000)) * 100
    : 0;
  const translateX = baseTranslate + dragPercent;

  return (
    <>
      <section className="relative mx-auto max-w-6xl px-4 pb-16 sm:px-6 animate-fade-up delay-200">
        <div
          className="relative overflow-hidden bg-blanc"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{ touchAction: "pan-y" }}
        >
          <div
            className="flex"
            style={{
              transform: `translateX(${translateX}%)`,
              transition: isDragging
                ? "none"
                : "transform 900ms cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            {pieces.map((piece) => (
              <article
                key={piece.id}
                className="relative min-w-full grid grid-cols-1 md:grid-cols-2"
              >
                <div className="group relative aspect-[4/5] overflow-hidden bg-pearl md:aspect-auto md:min-h-[560px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={piece.image}
                    alt={piece.name}
                    draggable={false}
                    className="h-full w-full select-none object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03]"
                    style={{ pointerEvents: "none", WebkitUserDrag: "none" }}
                  />
                  {/* Blur vignette on hover — edges slightly blurry, center stays sharp */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-0 backdrop-blur-[6px] transition-opacity duration-700 group-hover:opacity-100"
                    style={{
                      WebkitMaskImage:
                        "radial-gradient(ellipse 55% 55% at center, transparent 40%, black 100%)",
                      maskImage:
                        "radial-gradient(ellipse 55% 55% at center, transparent 40%, black 100%)",
                    }}
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
                      {t('landing.seeMore')}
                    </button>
                    <a
                      href="#contact"
                      className="inline-flex items-center gap-3 border border-ink/20 px-8 py-3.5 font-sans text-[10px] font-light uppercase tracking-[0.32em] text-ink transition duration-300 hover:border-ink"
                    >
                      {t('landing.buy')}
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
                aria-label={t('landing.prev')}
                className="absolute left-3 top-[38%] z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-ink/10 bg-blanc/90 text-lg text-ink backdrop-blur-sm transition hover:border-ink/30 md:left-5 md:top-1/2"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => goTo(active + 1)}
                aria-label={t('landing.next')}
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
