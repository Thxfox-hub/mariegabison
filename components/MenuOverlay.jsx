/**
 * MenuOverlay.jsx - Slide-in menu panel with i18n
 * Animated menu with dynamic categories from GAS data
 */
"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '../lib/i18n/context';
import { useCart } from './CartProvider';
import useFocusTrap from '../lib/useFocusTrap';

const CATEGORY_IDS = ['all', 'femme', 'homme'];

export default function MenuOverlay({ open, onClose }) {
  const { t } = useTranslation();
  const { items } = useCart();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const trapRef = useFocusTrap(isVisible && isAnimating);

  // Extract dynamic product categories from catalog
  const productCategories = useMemo(() => {
    try {
      const cached = localStorage.getItem('mariegabison_catalog');
      if (cached) {
        const arr = JSON.parse(cached);
        if (Array.isArray(arr)) {
          const cats = [...new Set(arr.map(it => it.category).filter(Boolean))];
          return cats;
        }
      }
    } catch {}
    return ['Collier', 'Bracelet', "Boucles d'oreille", 'Bague', 'Parure'];
  }, []);

  useEffect(() => {
    if (open) {
      setIsVisible(true);
      requestAnimationFrame(() => setIsAnimating(true));
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!isVisible) return null;

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(onClose, 300);
  };

  return (
    <div
      ref={trapRef}
      className={`menu-backdrop ${isAnimating ? 'active' : ''}`}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label={t('nav.menu')}
    >
      <div className={`menu-panel ${isAnimating ? 'active' : ''}`} onClick={(e) => e.stopPropagation()}>
        {/* Header with close button */}
        <div className="menu-header">
          <button className="menu-close" onClick={handleClose} aria-label={t('cart.close')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Menu content */}
        <div className="menu-content">
          {/* Main categories */}
          <div className="menu-main">
            {CATEGORY_IDS.map((cat) => (
              <Link
                key={cat}
                href={`/?cat=${cat}`}
                className="menu-main-link"
                onClick={handleClose}
              >
                {t(`categories.${cat}`)}
              </Link>
            ))}
          </div>

          {/* Product type categories from GAS */}
          <div className="menu-collections">
            <div className="menu-section-title">{t('menu.collections')}</div>
            {productCategories.map((cat) => (
              <Link
                key={cat}
                href={`/?cat=${encodeURIComponent(cat)}`}
                className="menu-collection-link"
                onClick={handleClose}
              >
                {t(`categories.${cat}`) || cat}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
