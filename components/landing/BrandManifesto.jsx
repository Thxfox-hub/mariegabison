"use client";

import { useTranslation } from "../../lib/i18n/context";

export default function BrandManifesto() {
  const { t } = useTranslation();
  return (
    <section className="px-6 pb-16 pt-8 text-center animate-fade-up">
      <div className="mx-auto max-w-2xl">
        <p className="font-serif text-2xl font-light italic tracking-[0.04em] text-ink sm:text-3xl md:text-[2.05rem]">
          {t('landing.brandTagline')}
        </p>

        <div className="mx-auto my-8 h-px w-10 bg-ink/20" />

        <p className="font-serif text-lg font-light leading-[1.75] text-ink-soft sm:text-xl">
          {t('landing.manifesto1')}
        </p>

        <p className="mt-7 font-sans text-[12px] font-light leading-relaxed tracking-[0.04em] text-ink-soft">
          {t('landing.manifesto2')}
        </p>
      </div>
    </section>
  );
}
