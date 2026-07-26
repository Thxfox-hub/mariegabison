"use client";

import { useTranslation } from "../../lib/i18n/context";

const InstagramIcon = ({ className = "" }) => (
  <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const MailIcon = ({ className = "" }) => (
  <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M2 7l10 7 10-7" />
  </svg>
);


export default function Contact() {
  const { t } = useTranslation();
  const instagramUrl = "https://www.instagram.com/maisonmariegabison/";
  const email = "contact@marie-gabison.com";

  return (
    <section id="contact" className="px-6 py-24 text-center">
      <div className="mx-auto max-w-xl animate-fade-up">
        <p className="font-sans text-[10px] font-light uppercase tracking-[0.42em] text-ink-soft">
          {t('landing.contactLabel')}
        </p>
        <h2 className="mt-4 font-serif text-3xl font-light tracking-[0.06em] text-ink sm:text-4xl">
          {t('landing.contactTitle')}
        </h2>
        <div className="mx-auto mt-6 h-px w-10 bg-ink/20" />

        <p className="mt-9 font-sans text-[13px] font-light leading-[1.9] text-ink-soft">
          {t('landing.contactDesc1')}{" "}
          <a
            href={`mailto:${email}`}
            className="text-ink underline decoration-ink/20 underline-offset-4 transition hover:decoration-ink"
          >
            {email}
          </a>{" "}
          {t('landing.contactDesc2')}{" "}
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink underline decoration-ink/20 underline-offset-4 transition hover:decoration-ink"
          >
            Instagram
          </a>
          .
        </p>

        <p className="mt-5 font-sans text-[11px] font-light leading-relaxed tracking-[0.04em] text-ink-soft/80">
          {t('landing.contactNote')}
        </p>

        {/* Social icons */}
        <div className="mt-10 flex items-center justify-center gap-5">
          <a
            href={`mailto:${email}`}
            aria-label="Email"
            className="flex h-11 w-11 items-center justify-center border border-ink/15 text-ink-soft transition hover:border-ink hover:text-ink"
          >
            <MailIcon />
          </a>
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="flex h-11 w-11 items-center justify-center border border-ink/15 text-ink-soft transition hover:border-ink hover:text-ink"
          >
            <InstagramIcon />
          </a>
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href={`mailto:${email}`}
            className="inline-flex min-w-[230px] items-center justify-center gap-2.5 bg-ink px-8 py-3.5 font-sans text-[10px] font-light uppercase tracking-[0.28em] text-blanc transition hover:bg-ink/85"
          >
            <MailIcon className="!w-4 !h-4" />
            {t('landing.writeEmail')}
          </a>
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-w-[230px] items-center justify-center gap-2.5 border border-ink/20 px-8 py-3.5 font-sans text-[10px] font-light uppercase tracking-[0.28em] text-ink transition hover:border-ink"
          >
            <InstagramIcon className="!w-4 !h-4" />
            Instagram
          </a>
        </div>
      </div>
    </section>
  );
}
