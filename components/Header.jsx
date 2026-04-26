/**
 * Header.jsx - Marie Gabison Bijoux
 * Ultra-minimal Zara-style header with language switcher
 * Shows back arrow on product pages, menu icon otherwise
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
    <header className="site-header">
      <div className="header-inner">
        {/* Left: Back arrow on product pages, Menu icon otherwise */}
        <div className="header-left">
          {isProductPage ? (
            <button
              className="header-icon-btn"
              onClick={() => router.back()}
              aria-label={t('nav.back')}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
          ) : (
            <button
              className="header-icon-btn"
              onClick={onMenuClick}
              aria-label={t('nav.menu')}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 6h18M3 18h18"/>
              </svg>
            </button>
          )}
        </div>

        {/* Center: Logo */}
        <Link className="header-logo" href="/">
          Marie Gabison
        </Link>

        {/* Right: Desktop nav + lang + bag */}
        <div className="header-right">
          <nav className="header-nav desktop-only">
            <button className="header-nav-link" onClick={onLoginClick}>{t('nav.login')}</button>
            <button className="header-nav-link" onClick={onHelpClick}>{t('nav.help')}</button>
          </nav>

          {/* Language switcher */}
          <div className="lang-switcher" ref={langRef}>
            <button
              className="header-nav-link lang-btn"
              onClick={() => setLangOpen(!langOpen)}
              aria-label={t('nav.language')}
            >
              {lang.toUpperCase()}
            </button>
            {langOpen && (
              <div className="lang-dropdown">
                {supported.map((l) => (
                  <button
                    key={l}
                    className={`lang-option ${l === lang ? 'active' : ''}`}
                    onClick={() => { setLang(l); setLangOpen(false); }}
                  >
                    {t(`lang.${l}`)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            className="header-nav-link header-bag"
            onClick={onCartClick}
            aria-label={t('nav.bag')}
          >
            <span className="desktop-only">{t('nav.bag')} ({mounted ? cartCount : 0})</span>
            <svg className="mobile-only" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 6h12l1 14H5L6 6z"/>
              <path d="M9 6V4a3 3 0 0 1 6 0v2"/>
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}

