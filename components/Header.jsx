/**
 * Header.jsx - Marie Gabison Paris
 * Editorial wedding-jewelry header with centered logo.
 * Keeps e-commerce functionality: cart, menu, language switcher.
 * Shows back arrow on product pages, menu icon otherwise.
 */
"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from '../lib/i18n/context';

export default function Header({ cartCount = 0, onCartClick, onMenuClick, onLoginClick, onHelpClick }) {
  const { t, lang, setLang, supported } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef(null);
  const pathname = usePathname();
  const router = useRouter();
  const isProductPage = pathname?.startsWith('/product/');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close lang dropdown on outside click
  useEffect(() => {
    if (!langOpen) return;
    const handler = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [langOpen]);

  return (
    <header className="border-b border-ink/8 pt-10 pb-8 px-6 text-center animate-fade-up relative">
      <div className="mx-auto max-w-3xl relative">
        {/* Left: Back arrow on product pages, Menu icon otherwise */}
        <div className="absolute left-0 top-0 flex items-center">
          {isProductPage ? (
            <button
              className="flex h-9 w-9 items-center justify-center text-ink-soft transition hover:text-ink"
              onClick={() => router.back()}
              aria-label={t('nav.back')}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
          ) : (
            <button
              className="flex h-9 w-9 items-center justify-center text-ink-soft transition hover:text-ink"
              onClick={onMenuClick}
              aria-label={t('nav.menu')}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 6h18M3 18h18"/>
              </svg>
            </button>
          )}
        </div>

        {/* Center: Logo */}
        <Link href="/" className="inline-block">
          <h1 className="font-serif text-[1.6rem] font-light tracking-[0.28em] text-ink sm:text-[2.35rem] md:text-[2.6rem]">
            MARIE GABISON
          </h1>
          <p className="mt-1 font-sans text-[10px] font-light uppercase tracking-[0.55em] text-ink-soft">
            Paris
          </p>
        </Link>

        {/* Right: lang + bag */}
        <div className="absolute right-0 top-0 flex items-center gap-3">
          {/* Language switcher */}
          <div className="relative" ref={langRef}>
            <button
              className="font-sans text-[10px] font-light uppercase tracking-[0.22em] text-ink-soft transition hover:text-ink"
              onClick={() => setLangOpen(!langOpen)}
              aria-label={t('nav.language')}
            >
              {lang.toUpperCase()}
            </button>
            {langOpen && (
              <div className="absolute right-0 top-full mt-2 bg-blanc border border-ink/10 py-1 z-50">
                {supported.map((l) => (
                  <button
                    key={l}
                    className={`block w-full px-4 py-1.5 text-left font-sans text-[10px] font-light uppercase tracking-[0.18em] transition hover:bg-pearl ${l === lang ? 'text-ink' : 'text-ink-soft'}`}
                    onClick={() => { setLang(l); setLangOpen(false); }}
                  >
                    {t(`lang.${l}`)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cart */}
          <button
            id="cart-icon-target"
            className="flex items-center gap-1.5 text-ink-soft transition hover:text-ink"
            onClick={onCartClick}
            aria-label={t('nav.bag')}
            style={{ position: 'relative' }}
          >
            <span className="hidden sm:inline font-sans text-[10px] font-light uppercase tracking-[0.22em]">
              {t('nav.bag')}
            </span>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M6 6h12l1 14H5L6 6z"/>
                <path d="M9 6V4a3 3 0 0 1 6 0v2"/>
              </svg>
              {mounted && cartCount > 0 && (
                <span className="cart-badge">{cartCount > 99 ? '99+' : cartCount}</span>
              )}
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
