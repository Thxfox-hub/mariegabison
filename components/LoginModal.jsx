/**
 * LoginModal.jsx - Simple login modal with i18n
 */
"use client";

import { useEffect, useState } from 'react';
import { useTranslation } from '../lib/i18n/context';
import useFocusTrap from '../lib/useFocusTrap';

export default function LoginModal({ open, onClose }) {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const trapRef = useFocusTrap(isVisible && isAnimating);

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
    <div ref={trapRef} className={`modal-backdrop ${isAnimating ? 'active' : ''}`} onClick={handleClose} role="dialog" aria-modal="true" aria-label={t('login.title')}>
      <div className={`modal-panel ${isAnimating ? 'active' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{t('login.title')}</h2>
          <button className="modal-close" onClick={handleClose} aria-label={t('cart.close')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">{t('login.email')}</label>
            <input type="email" className="form-input" placeholder="email@example.com" />
          </div>
          <div className="form-group">
            <label className="form-label">{t('login.password')}</label>
            <input type="password" className="form-input" placeholder="••••••••" />
          </div>
          <button className="btn primary full-width">{t('login.submit')}</button>
          <p className="modal-footer-text">
            {t('login.noAccount')} <button className="link-btn">{t('login.createAccount')}</button>
          </p>
        </div>
      </div>
    </div>
  );
}
