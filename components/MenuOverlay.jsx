/**
 * MenuOverlay.jsx - Slide-in menu panel with i18n
 * Animated menu with categories and collections
 */
"use client";

import { useEffect, useState } from 'react';
import { useTranslation } from '../lib/i18n/context';

const CATEGORY_IDS = ['femme', 'homme', 'collection'];
const COLLECTION_IDS = ['NOUVEAUTÉS', 'COLLIERS', "BOUCLES D'OREILLES", 'BRACELETS', 'BAGUES', 'PARURES'];

export default function MenuOverlay({ open, onClose, onSelectCategory }) {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

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
    <div className={`menu-backdrop ${isAnimating ? 'active' : ''}`} onClick={handleClose}>
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
              <button
                key={cat}
                className="menu-main-link"
                onClick={() => { onSelectCategory?.(cat); handleClose(); }}
              >
                {t(`categories.${cat}`)}
              </button>
            ))}
          </div>

          {/* Collections */}
          <div className="menu-collections">
            <div className="menu-section-title">COLLECTIONS</div>
            {COLLECTION_IDS.map((col) => (
              <button
                key={col}
                className="menu-collection-link"
                onClick={() => { onSelectCategory?.(col); handleClose(); }}
              >
                {col}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
