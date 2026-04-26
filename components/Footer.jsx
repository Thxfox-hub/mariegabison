/**
 * Footer.jsx - Marie Gabison Bijoux
 * Minimalist Zara-style footer with i18n
 */
"use client";

import { useTranslation } from '../lib/i18n/context';

export default function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="title">Marie Gabison</div>
            <p>{t('footer.brand')}</p>
          </div>

          <div className="footer-section">
            <h4>{t('footer.contact')}</h4>
            <ul>
              <li><a href="mailto:contact@mariegabison.fr">contact@mariegabison.fr</a></li>
              <li>Paris, France</li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>{t('footer.followUs')}</h4>
            <ul>
              <li><a href="https://www.instagram.com/maisonmariegabison/" target="_blank" rel="noreferrer">Instagram</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          © {currentYear} {t('footer.rights')}
        </div>
      </div>
    </footer>
  );
}
