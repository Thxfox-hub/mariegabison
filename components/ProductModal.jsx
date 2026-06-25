"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./CartProvider";
import { useTranslation } from '../lib/i18n/context';
import { animateToCart } from '../lib/animateToCart';

export default function ProductModal({ item, onClose, instagramUrl = "https://www.instagram.com/maisonmariegabison/" }) {
  const { t, lang } = useTranslation();
  // Neutral placeholder SVG
  const placeholder =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
  <rect width="100%" height="100%" fill="#f6f6f6"/>
  <rect x="60" y="60" width="480" height="680" fill="none" stroke="#eaeaea" stroke-width="2"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="ui-sans-serif,system-ui,Segoe UI,Roboto" font-size="22" fill="#999">Image</text>
</svg>`
    );

  if (!item) return null;

  const { title, description, imageUrl, images, price, category } = item;
  const { addItem } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  const allImages = Array.isArray(images) && images.length ? images : (imageUrl ? [imageUrl] : []);
  const mainImg = allImages[activeImg] || imageUrl || placeholder;

  const fmt = useMemo(() => new Intl.NumberFormat(lang === 'en' ? 'en-US' : lang === 'ru' ? 'ru-RU' : lang === 'it' ? 'it-IT' : 'fr-FR', { style: 'currency', currency: 'EUR' }), [lang]);
  const priceText = Number.isFinite(Number(price)) ? fmt.format(Number(price)) : '—';

  const handleAdd = () => {
    const n = Math.max(1, Number(qty) || 1);
    addItem(item, n);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);

    const img = document.querySelector('.modal-media img');
    if (img) animateToCart(img);
  };
  const handleBuyNow = () => {
    const n = Math.max(1, Number(qty) || 1);
    addItem(item, n);
    router.push('/cart');
  };

  return (
    <Dialog.Root open={!!item} onOpenChange={(open) => { if (!open) onClose?.(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[200]" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border border-[var(--border)] w-[92vw] max-w-[960px] max-h-[90vh] overflow-auto p-0 shadow-[0_10px_30px_rgba(0,0,0,0.15)] z-[201]"
          aria-label={title || t('product.notFound')}
        >
          <div className="modal-header">
            <Dialog.Title className="modal-title">{title}</Dialog.Title>
            <Dialog.Close asChild>
              <button className="modal-close" aria-label={t('cart.close')}>{t('cart.close')}</button>
            </Dialog.Close>
          </div>
          <div className="modal-body">
            <div className="modal-media">
              <div style={{ position: 'relative' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={mainImg}
                  alt={title || 'Image'}
                  onError={(e) => { if (e.currentTarget.src !== placeholder) e.currentTarget.src = placeholder; }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveImg(i => (i - 1 + allImages.length) % allImages.length)}
                      aria-label="Image précédente"
                      style={{
                        position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                        width: 32, height: 32, borderRadius: '50%', border: 'none',
                        background: 'rgba(255,255,255,0.85)', cursor: 'pointer', fontSize: 16,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)', zIndex: 2,
                      }}
                    >‹</button>
                    <button
                      onClick={() => setActiveImg(i => (i + 1) % allImages.length)}
                      aria-label="Image suivante"
                      style={{
                        position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                        width: 32, height: 32, borderRadius: '50%', border: 'none',
                        background: 'rgba(255,255,255,0.85)', cursor: 'pointer', fontSize: 16,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)', zIndex: 2,
                      }}
                    >›</button>
                    <span
                      style={{
                        position: 'absolute', bottom: 8, right: 8,
                        background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 12,
                        padding: '2px 8px', borderRadius: 12, zIndex: 2,
                      }}
                    >{activeImg + 1} / {allImages.length}</span>
                  </>
                )}
              </div>
              {allImages.length > 1 && (
                <div className="modal-thumbnails" style={{ display: 'flex', gap: 6, marginTop: 8, overflowX: 'auto' }}>
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImg(idx)}
                      style={{
                        flexShrink: 0, width: 56, height: 56, border: idx === activeImg ? '2px solid #333' : '2px solid #eaeaea',
                        padding: 0, cursor: 'pointer', background: '#f6f6f6', borderRadius: 4, overflow: 'hidden',
                        opacity: idx === activeImg ? 1 : 0.6,
                        transition: 'opacity 0.2s, border-color 0.2s',
                      }}
                      aria-label={`Image ${idx + 1}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-section">
              <p style={{ marginTop: 0, color: '#555' }}>{category}</p>
              {description && <p>{description}</p>}
              <p style={{ fontWeight: 600 }}>{priceText}</p>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '8px 0' }}>
                <label className="sr-only" htmlFor="qty">{t('product.quantity')}</label>
                <input id="qty" className="input" type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value) || 1)} style={{ width: 100 }} />
                {added && <span className="status" style={{ margin: 0 }}>{t('product.added')}</span>}
              </div>

              <div className="modal-actions">
                <button className="btn primary" onClick={handleAdd}>{t('product.addToCart')}</button>
                <button className="btn" onClick={handleBuyNow}>{t('product.buyNow')}</button>
                <a className="btn" href={instagramUrl} target="_blank" rel="noreferrer noopener">{t('product.contactInstagram')}</a>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
