"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslation } from "../../lib/i18n/context";

export default function Categories() {
  const { t } = useTranslation();
  const [cats, setCats] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/catalog', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const arr = Array.isArray(data) ? data : data.data || data.items || [];
        // Derive unique categories from products
        const catSet = {};
        arr.forEach((it) => {
          const c = it.category || '';
          if (c) catSet[c] = (catSet[c] || 0) + 1;
        });
        // Always show all known categories, even without products
        const ALL_CATS = ['Collier', 'Bracelet', "Boucles d'oreille", 'Bague', 'Parure'];
        const derived = ALL_CATS.map((name) => ({
          name,
          description: catSet[name] ? '' : t('landing.comingSoon'),
          href: `/?cat=${encodeURIComponent(name)}`,
          hasProducts: !!catSet[name],
        }));
        setCats(derived);
      } catch {}
    }
    load();
  }, [t]);

  if (cats.length === 0) return null;

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
          {cats.map((category) => (
            <RippleLink key={category.name} href={category.href} name={category.name} description={category.description} t={t} hasProducts={category.hasProducts} />
          ))}
        </div>
      </div>
    </section>
  );
}

function RippleLink({ href, name, description, t, hasProducts }) {
  const ref = useRef(null);
  const [ripple, setRipple] = useState({ x: 0, y: 0, visible: false });
  const [touched, setTouched] = useState(false);

  // On mouse enter: show ripple from center immediately
  const handleMouseEnter = (e) => {
    if (touched) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setRipple({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      visible: true,
    });
  };

  // On mouse move: update ripple position
  const handleMouseMove = (e) => {
    if (touched) return;
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

  // On mobile: touch shows ripple, touch end hides it
  const handleTouchStart = (e) => {
    setTouched(true);
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const touch = e.touches?.[0];
    const x = touch ? touch.clientX - rect.left : rect.width / 2;
    const y = touch ? touch.clientY - rect.top : rect.height / 2;
    setRipple({ x, y, visible: true });
  };

  const handleTouchEnd = () => {
    setRipple((prev) => ({ ...prev, visible: false }));
    setTimeout(() => setTouched(false), 500);
  };

  return (
    <Link
      ref={ref}
      href={href}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className="group relative overflow-hidden bg-blanc px-8 py-12 text-center"
    >
      {/* Ripple overlay — cercle marron foncé qui s'étend depuis la souris/doigt */}
      <span
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: ripple.x,
          top: ripple.y,
          width: ripple.visible ? "800px" : "0px",
          height: ripple.visible ? "800px" : "0px",
          borderRadius: "50%",
          background: "#5c4a35",
          transform: "translate(-50%, -50%)",
          transition: "width 0.6s ease-out, height 0.6s ease-out, opacity 0.4s ease-out",
          opacity: ripple.visible ? 1 : 0,
        }}
      />

      {/* Contenu — texte devient blanc quand le ripple est visible */}
      <div className="relative transition-colors duration-300" style={{ color: ripple.visible ? '#fff' : undefined }}>
        <h3 className="font-serif text-2xl font-light tracking-[0.06em] text-ink transition-colors duration-300" style={{ color: ripple.visible ? '#fff' : undefined }}>
          {name}
        </h3>
        <p className="mt-4 font-sans text-[12px] font-light leading-relaxed text-ink-soft transition-colors duration-300" style={{ color: ripple.visible ? 'rgba(255,255,255,0.8)' : undefined }}>
          {description}
        </p>
        <span className="mt-6 inline-block font-sans text-[10px] font-light uppercase tracking-[0.28em] text-ink/50 transition-colors duration-300" style={{ color: ripple.visible ? '#fff' : undefined }}>
          {hasProducts ? t('landing.explore') : t('landing.comingSoon')}
        </span>
      </div>
    </Link>
  );
}
