"use client";

import { maisonCollections } from "../../lib/landing-data";
import { useTranslation } from "../../lib/i18n/context";

export default function AllCollections() {
  const { t } = useTranslation();
  return (
    <section id="collections" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <p className="font-sans text-[10px] font-light uppercase tracking-[0.42em] text-ink-soft">
            {t('landing.theHouse')}
          </p>
          <h2 className="mt-4 font-serif text-3xl font-light tracking-[0.06em] text-ink sm:text-4xl">
            {t('landing.allCollectionsTitle')}
          </h2>
          <p className="mx-auto mt-5 max-w-xl font-sans text-[12px] font-light leading-relaxed text-ink-soft">
            {t('landing.allCollectionsDesc')}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {maisonCollections.map((collection, index) => (
            <article
              key={collection.id}
              className="group flex flex-col border border-ink/10 bg-blanc p-8 transition duration-500 hover:border-ink/30 animate-fade-up"
              style={{ animationDelay: `${0.1 * index}s` }}
            >
              <p className="font-sans text-[10px] font-light uppercase tracking-[0.35em] text-ink-soft">
                {collection.season}
              </p>
              <h3 className="mt-4 font-serif text-2xl font-light tracking-[0.05em] text-ink">
                {collection.name}
              </h3>
              <p className="mt-5 flex-1 font-sans text-[13px] font-light leading-[1.8] text-ink-soft">
                {collection.description}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {collection.categories.map((cat) => (
                  <span
                    key={cat}
                    className="border border-ink/10 px-2.5 py-1 font-sans text-[9px] font-light uppercase tracking-[0.18em] text-ink-soft"
                  >
                    {cat}
                  </span>
                ))}
              </div>
              <a
                href={collection.id === "one-day-only" ? "#collection" : "#contact"}
                className="mt-8 inline-flex w-fit items-center gap-2 font-sans text-[10px] font-light uppercase tracking-[0.28em] text-ink transition group-hover:gap-3"
              >
                {collection.id === "sur-mesure"
                  ? t('landing.parisAppointment')
                  : t('landing.discoverAcquire')}
                <span aria-hidden>→</span>
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
