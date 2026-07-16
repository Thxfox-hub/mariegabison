"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { categories as CATEGORIES } from "../../lib/landing-data";
import { useTranslation } from "../../lib/i18n/context";

export default function Categories() {
  const { t } = useTranslation();
  return (
    <section className="border-y border-ink/8 bg-blanc px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <p className="font-sans text-[10px] font-light uppercase tracking-[0.42em] text-ink-soft">
            {t('landing.categoriesLabel')}
          </p>
          <h2 className="mt-4 font-serif text-3xl font-light tracking-[0.06em] text-ink sm:text-4xl">
            {t('landing.categoriesTitle')}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-px bg-ink/10 sm:grid-cols-3">
          {CATEGORIES.map((category) => (
            <RippleLink key={category.name} href={category.href} name={category.name} description={category.description} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
}

function RippleLink({ href, name, description, t }) {
  const ref = useRef(null);
  const [ripple, setRipple] = useState({ x: 0, y: 0, visible: false });

  const handleMouseMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setRipple({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      visible: true,
    });
  };

  const handleMouseLeave = () => {
    setRipple((prev) => ({ ...prev, visible: false }));
  };

  return (
    <Link
      ref={ref}
      href={href}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group relative overflow-hidden bg-blanc px-8 py-12 text-center"
    >
      {/* Ripple overlay — cercle marron qui s'étend depuis la souris */}
      <span
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: ripple.x,
          top: ripple.y,
          width: ripple.visible ? "500px" : "0px",
          height: ripple.visible ? "500px" : "0px",
          borderRadius: "50%",
          background: "#8b7355",
          transform: "translate(-50%, -50%)",
          transition: "width 0.5s ease-out, height 0.5s ease-out, opacity 0.4s ease-out",
          opacity: ripple.visible ? 1 : 0,
        }}
      />

      {/* Contenu au-dessus du ripple */}
      <div className="relative transition-colors duration-300 group-hover:text-blanc">
        <h3 className="font-serif text-2xl font-light tracking-[0.06em] text-ink transition-colors duration-300 group-hover:text-blanc">
          {name}
        </h3>
        <p className="mt-4 font-sans text-[12px] font-light leading-relaxed text-ink-soft transition-colors duration-300 group-hover:text-blanc/80">
          {description}
        </p>
        <span className="mt-6 inline-block font-sans text-[10px] font-light uppercase tracking-[0.28em] text-ink/50 transition-colors duration-300 group-hover:text-blanc">
          {t('landing.explore')}
        </span>
      </div>
    </Link>
  );
}
