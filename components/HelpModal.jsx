/**
 * HelpModal.jsx - Help/FAQ modal with i18n
 */
"use client";

import { useEffect, useState } from 'react';
import { useTranslation } from '../lib/i18n/context';

export default function HelpModal({ open, onClose }) {
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

  const faqItems = t('help.faq');

  return (
    <div className={`modal-backdrop ${isAnimating ? 'active' : ''}`} onClick={handleClose}>
      <div className={`modal-panel ${isAnimating ? 'active' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{t('help.title')}</h2>
          <button className="modal-close" onClick={handleClose} aria-label={t('cart.close')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div className="modal-body">
          <div className="faq-list">
            {Array.isArray(faqItems) && faqItems.map((item, i) => (
              <div key={i} className="faq-item">
                <h3 className="faq-question">{item.q}</h3>
                <p className="faq-answer">{item.a}</p>
              </div>
            ))}
          </div>
          <div className="help-contact">
            <p>{t('help.needMore')}</p>
            <a
              href="https://www.instagram.com/maisonmariegabison/"
              target="_blank"
              rel="noreferrer"
              className="btn primary full-width"
            >
              {t('help.contactInstagram')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
