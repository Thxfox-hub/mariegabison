"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./CartProvider";
import { useTranslation } from '../lib/i18n/context';
import useFocusTrap from '../lib/useFocusTrap';

export default function CartDrawer({ open, onClose, onBook }) {
  const { items, setQuantity, removeItem, clear, total } = useCart();
  const { t, lang } = useTranslation();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const trapRef = useFocusTrap(isVisible && isAnimating);

  // Prefetch /cart so navigation is instant and more reliable
  useEffect(() => {
    if (open) {
      try { router.prefetch?.('/cart'); } catch {}
    }
  }, [open, router]);

  // Entry/exit animation
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

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(onClose, 300);
  };

  const fmt = useMemo(() => new Intl.NumberFormat(lang === 'en' ? 'en-US' : lang === 'ru' ? 'ru-RU' : lang === 'it' ? 'it-IT' : 'fr-FR', { style: 'currency', currency: 'EUR' }), [lang]);

  if (!isVisible) return null;

  return (
    <div
      ref={trapRef}
      className={`drawer-backdrop ${isAnimating ? 'active' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={t('cart.title')}
      onClick={handleClose}
    >
      <div
        className={`drawer ${isAnimating ? 'active' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="drawer-header">
          <h3 className="drawer-title">{t('cart.title')}</h3>
          <button className="modal-close" onClick={handleClose} aria-label={t('cart.close')}>{t('cart.close')}</button>
        </div>
        <div className="drawer-body">
          {items.length === 0 ? (
            <div className="status">{t('cart.empty')}</div>
          ) : (
            <ul className="cart-list">
              {items.map((it) => {
                const id = it.id || it.title;
                return (
                    <li key={id} className="cart-item">
                      {it.imageUrl && (
                        <img className="cart-item-image" src={it.imageUrl} alt={it.title} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      )}
                      <div className="cart-item-details">
                        <div className="cart-item-header">
                          <div className="cart-item-title">{it.title}</div>
                          <div className="cart-item-price">{fmt.format(Number(it.price) || 0)}</div>
                        </div>
                        <div className="cart-item-actions">
                          <div className="qty-control">
                            <button className="qty-btn" aria-label={t('product.decrease')} onClick={() => setQuantity(id, Math.max(1, (it.quantity || 1) - 1))}>−</button>
                            <label className="sr-only" htmlFor={`qty-${id}`}>{t('product.quantity')}</label>
                            <input id={`qty-${id}`} className="qty-input" type="number" readOnly value={it.quantity || 1} />
                            <button className="qty-btn" aria-label={t('product.increase')} onClick={() => setQuantity(id, (it.quantity || 1) + 1)}>+</button>
                          </div>
                          <button className="remove-link" onClick={() => removeItem(id)}>{t('cart.remove')}</button>
                        </div>
                      </div>
                    </li>
                );
              })}
            </ul>
          )}
          <div className="cart-total">
            <div>{t('cart.total')}</div>
            <div className="price">{fmt.format(total)}</div>
          </div>
        </div>
        <div className="drawer-footer">
          <button className="btn" onClick={clear} disabled={!items.length}>{t('cart.clear')}</button>
          <button className="btn" onClick={() => { try { onBook?.(); } catch {} }} disabled={!items.length}>{t('cart.bookAppointment')}</button>
          <button
            type="button"
            className="btn primary"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              try { window.location.assign('/cart'); }
              catch { try { window.location.href = '/cart'; } catch {} }
            }}
            aria-label={t('cart.checkout')}
            disabled={!items.length}
          >
            {t('cart.checkout')}
          </button>
        </div>
      </div>
    </div>
  );
}

