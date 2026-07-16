/**
 * Header.jsx - Marie Gabison Paris
 * Fixed header: tall at top, compact + glassmorphism on scroll.
 * Always visible, never retracts. Language switcher with flags.
 */
"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from '../lib/i18n/context';
import { FLAGS } from './FlagIcons';

export default function Header({ cartCount = 0, onCartClick, onMenuClick, onLoginClick, onHelpClick }) {
  const { t, lang, setLang, supported } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(80);
  const headerRef = useRef(null);
  const langRef = useRef(null);
  const pathname = usePathname();
  const router = useRouter();
  const isProductPage = pathname?.startsWith('/product/');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Scroll detection — changes header state
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Measure header height to set spacer
  useEffect(() => {
    if (!headerRef.current) return;
    const measure = () => {
      if (headerRef.current) setHeaderHeight(headerRef.current.offsetHeight);
    };
    measure();
    window.addEventListener('resize', measure);
    // Re-measure after scroll state change
    setTimeout(measure, 350);
    return () => window.removeEventListener('resize', measure);
  }, [scrolled]);

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
    <>
      {/* Fixed header — always on top, never retracts */}
      <header
        ref={headerRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          borderBottom: '1px solid rgba(12,12,12,0.08)',
          background: scrolled ? 'rgba(255,255,255,0.72)' : '#ffffff',
          backdropFilter: scrolled ? 'blur(16px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
          paddingTop: scrolled ? 8 : 32,
          paddingBottom: scrolled ? 8 : 24,
          paddingLeft: 16,
          paddingRight: 16,
          boxShadow: scrolled ? '0 1px 8px rgba(0,0,0,0.04)' : 'none',
          transition: 'padding 0.3s ease, background 0.3s ease, box-shadow 0.3s ease',
        }}
      >
        <div className="mx-auto max-w-3xl relative flex items-center justify-between gap-2">
          {/* Left: Back arrow on product pages, Menu icon otherwise */}
          <div className="flex items-center shrink-0">
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

          {/* Center: Logo — shrinks on scroll, Paris hidden when scrolled */}
          <Link href="/" className="flex-1 text-center min-w-0">
            <h1 className={`font-serif font-light tracking-[0.28em] text-ink leading-none transition-all duration-300 truncate ${
              scrolled
                ? 'text-[0.85rem] sm:text-[1.4rem] md:text-[1.6rem]'
                : 'text-[1.1rem] sm:text-[2.35rem] md:text-[2.6rem]'
            }`}>
              MARIE GABISON
            </h1>
            <p className={`font-sans text-[10px] font-light uppercase tracking-[0.55em] text-ink-soft overflow-hidden transition-all duration-300 ${
              scrolled ? 'max-h-0 opacity-0 mt-0' : 'max-h-6 opacity-100 mt-1'
            }`}>
              Paris
            </p>
          </Link>

          {/* Right: lang + cart — always visible (mobile + desktop) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Language switcher with flags */}
            <div className="relative" ref={langRef}>
              <button
                className="flex items-center gap-1 font-sans text-[10px] font-light uppercase tracking-[0.22em] text-ink-soft transition hover:text-ink"
                onClick={() => setLangOpen(!langOpen)}
                aria-label={t('nav.language')}
              >
                <span className="leading-none">{FLAGS[lang]}</span>
                <span className="hidden sm:inline">{lang.toUpperCase()}</span>
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full mt-2 bg-blanc border border-ink/10 py-1 z-50 shadow-lg min-w-[100px]">
                  {supported.map((l) => (
                    <button
                      key={l}
                      className={`flex items-center gap-2 w-full px-3 py-1.5 text-left font-sans text-[10px] font-light uppercase tracking-[0.18em] transition hover:bg-pearl ${l === lang ? 'text-ink' : 'text-ink-soft'}`}
                      onClick={() => { setLang(l); setLangOpen(false); }}
                    >
                      <span className="leading-none">{FLAGS[l]}</span>
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
        </div>
      </header>

      {/* Spacer — compensates for fixed header height so content isn't hidden */}
      <div style={{ height: headerHeight, flexShrink: 0 }} aria-hidden />
    </>
  );
}
