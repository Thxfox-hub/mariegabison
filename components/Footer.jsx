/**
 * Footer.jsx - Marie Gabison Paris
 * Editorial wedding-jewelry footer matching the landing page design.
 */
"use client";

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

const WhatsAppIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.87 1.22 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35z" />
    <path d="M12 2C6.48 2 2 6.48 2 12c0 1.77.46 3.43 1.27 4.87L2 22l5.25-1.38A9.93 9.93 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18.2c-1.55 0-3-.42-4.24-1.15l-.3-.18-3.12.82.83-3.04-.2-.31A8.17 8.17 0 013.8 12c0-4.52 3.68-8.2 8.2-8.2s8.2 3.68 8.2 8.2-3.68 8.2-8.2 8.2z" />
  </svg>
);

export default function Footer() {
  const whatsappUrl = "https://wa.me/33783882052";
  const email = "contact@mariegabison.fr";

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
          Collections
        </a>
        <a href="/#contact" className="transition hover:text-ink">
          Contact
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
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          aria-label="WhatsApp"
          className="flex h-9 w-9 items-center justify-center text-ink-soft transition hover:text-ink"
        >
          <WhatsAppIcon />
        </a>
      </div>
      <p className="mt-8 font-sans text-[10px] font-light tracking-wide text-ink-soft/60">
        © {new Date().getFullYear()} Marie Gabison Paris — Tous droits réservés
      </p>
    </footer>
  );
}
