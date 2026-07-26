/**
 * Footer.jsx - Marie Gabison Paris
 * Editorial wedding-jewelry footer matching the landing page design.
 */
"use client";

import { useTranslation } from "../lib/i18n/context";

const InstagramIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M2 7l10 7 10-7" />
  </svg>
);

export default function Footer() {
  const { t } = useTranslation();
  const email = "contact@marie-gabison.com";

  return (
    <footer className="border-t border-ink/8 px-6 py-12 text-center">
      <p className="font-serif text-lg font-light tracking-[0.28em] text-ink">
        MARIE GABISON
      </p>
      <p className="mt-2 font-sans text-[10px] font-light uppercase tracking-[0.48em] text-ink-soft">
        Paris
      </p>
      <div className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-sans text-[10px] font-light uppercase tracking-[0.22em] text-ink-soft">
        <a href="/#collection" className="transition hover:text-ink">
          One Day Only
        </a>
        <a href="/#collections" className="transition hover:text-ink">
          {t('landing.collections')}
        </a>
        <a href="/#contact" className="transition hover:text-ink">
          {t('footer.contact')}
        </a>
      </div>
      {/* Social icons */}
      <div className="mt-7 flex items-center justify-center gap-4">
        <a
          href={`mailto:${email}`}
          aria-label="Email"
          className="flex h-9 w-9 items-center justify-center text-ink-soft transition hover:text-ink"
        >
          <MailIcon />
        </a>
        <a
          href="https://www.instagram.com/maisonmariegabison/"
          target="_blank"
          rel="noreferrer"
          aria-label="Instagram"
          className="flex h-9 w-9 items-center justify-center text-ink-soft transition hover:text-ink"
        >
          <InstagramIcon />
        </a>
      </div>
      <p className="mt-8 font-sans text-[10px] font-light tracking-wide text-ink-soft/60">
        {t('landing.footerRights', { year: new Date().getFullYear() })}
      </p>
    </footer>
  );
}
