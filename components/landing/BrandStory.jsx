"use client";

import { useTranslation } from "../../lib/i18n/context";

export default function BrandStory() {
  const { t } = useTranslation();
  return (
    <section className="border-y border-ink/8 bg-noir px-6 py-24 text-center text-blanc">
      <div className="mx-auto max-w-2xl animate-fade-up">
        <p className="font-sans text-[10px] font-light uppercase tracking-[0.42em] text-blanc/45">
          {t('landing.theHouse')}
        </p>
        <h2 className="mt-4 font-serif text-3xl font-light tracking-[0.06em] sm:text-4xl">
          {t('landing.artOfUnique')}
        </h2>
        <div className="mx-auto my-9 h-px w-10 bg-blanc/25" />

        <p className="font-serif text-lg font-light leading-[1.75] text-blanc/85 sm:text-xl">
          {t('landing.brandStoryDesc')}
        </p>
      </div>
    </section>
  );
}
