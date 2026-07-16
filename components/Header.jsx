/**
 * Header.jsx - Marie Gabison Paris
 * Editorial wedding-jewelry header with centered logo.
 * Sticky with blur backdrop on scroll.
 * On mobile: smaller logo, language/cart moved to menu overlay.
 * Language switcher uses flag emojis.
 */
"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from '../lib/i18n/context';

const FLAGS = {
  fr: '🇫🇷',
  en: '🇬🇧',
  it: '🇮🇹',
  ru: '🇷🇺',
};

export default function Header({ cartCount = 0, onCartClick, onMenuClick, onLoginClick, onHelpClick }) {
  const { t, lang, setLang, supported } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const langRef = useRef(null);
  const pathname = usePathname();
  const router = useRouter();
  const isProductPage = pathname?.startsWith('/product/');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Scroll detection for blur/transparent effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
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
    <header
      className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? 'border-ink/8 bg-blanc/80 backdrop-blur-md py-2 px-6'
          : 'border-transparent bg-transparent pt-10 pb-8 px-6'
      }`}
    >
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

        {/* Center: Logo — smaller on mobile */}
        <Link href="/" className="inline-block text-center">
          <h1 className="font-serif font-light tracking-[0.28em] text-ink text-[1.1rem] sm:text-[2.35rem] md:text-[2.6rem] leading-none">
            MARIE GABISON
          </h1>
          <p className="mt-1 font-sans text-[10px] font-light uppercase tracking-[0.55em] text-ink-soft hidden sm:block">
            Paris
          </p>
        </Link>

        {/* Right: lang + bag — hidden on mobile (moved to menu) */}
        <div className="absolute right-0 top-0 hidden sm:flex items-center gap-3">
          {/* Language switcher with flags */}
          <div className="relative" ref={langRef}>
            <button
              className="flex items-center gap-1 font-sans text-[10px] font-light uppercase tracking-[0.22em] text-ink-soft transition hover:text-ink"
              onClick={() => setLangOpen(!langOpen)}
              aria-label={t('nav.language')}
            >
              <span className="text-base leading-none">{FLAGS[lang] || '🏳️'}</span>
              <span>{lang.toUpperCase()}</span>
            </button>
            {langOpen && (
              <div className="absolute right-0 top-full mt-2 bg-blanc border border-ink/10 py-1 z-50 shadow-lg">
                {supported.map((l) => (
                  <button
                    key={l}
                    className={`flex items-center gap-2 w-full px-4 py-1.5 text-left font-sans text-[10px] font-light uppercase tracking-[0.18em] transition hover:bg-pearl ${l === lang ? 'text-ink' : 'text-ink-soft'}`}
                    onClick={() => { setLang(l); setLangOpen(false); }}
                  >
                    <span className="text-base leading-none">{FLAGS[l] || '🏳️'}</span>
                    <span>{l.toUpperCase()}</span>
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
            <span className="hidden md:inline font-sans text-[10px] font-light uppercase tracking-[0.22em]">
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

        {/* Mobile: cart icon only (compact) */}
        <div className="absolute right-0 top-0 flex sm:hidden items-center">
          <button
            id="cart-icon-target-mobile"
            className="flex items-center justify-center text-ink-soft transition hover:text-ink"
            onClick={onCartClick}
            aria-label={t('nav.bag')}
            style={{ position: 'relative' }}
          >
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
