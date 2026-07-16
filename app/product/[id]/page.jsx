/**
 * Product detail page — /product/[id]
 * Fetches product from catalog API, displays full details with add-to-cart.
 * Key dependencies: CartProvider, catalog API, next/navigation.
 * Critical: product ID must match catalog item id or title slug.
 * Responsive: single column mobile, 2-column desktop with sticky info.
 * Animations: fade-in on mount, slide-up for content sections.
 */
"use client";

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '../../../components/CartProvider';
import { useTranslation } from '../../../lib/i18n/context';
import { animateToCart } from '../../../lib/animateToCart';

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80',
  'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80',
  'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=800&q=80',
  'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80',
  'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80',
  'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800&q=80',
];

function getPlaceholder(str) {
  let hash = 0;
  for (let i = 0; i < (str || '').length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return PLACEHOLDER_IMAGES[Math.abs(hash) % PLACEHOLDER_IMAGES.length];
}

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const { addItem } = useCart();
  const { t, lang } = useTranslation();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [visible, setVisible] = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  useEffect(() => {
    setActiveImg(0);
    setImgLoaded(false);
  }, [params?.id]);

  useEffect(() => {
    const id = params?.id;
    if (!id) return;
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/catalog', { cache: 'no-store' });
        if (!res.ok) throw new Error('Catalog error');
        const data = await res.json();
        const arr = Array.isArray(data) ? data : data.data || data.items || [];
        const found = arr.find(it => it.id === id || it.title === decodeURIComponent(id));
        if (!cancelled) {
          setItem(found || null);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [params?.id]);

  const fmt = useMemo(() => new Intl.NumberFormat(lang === 'en' ? 'en-US' : lang === 'ru' ? 'ru-RU' : lang === 'it' ? 'it-IT' : 'fr-FR', { style: 'currency', currency: 'EUR' }), [lang]);

  const handleAdd = (e) => {
    if (!item) return;
    const n = Math.max(1, Number(qty) || 1);
    addItem(item, n);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);

    // Animate image
    const img = document.querySelector('.product-image-wrap img');
    if (img) animateToCart(img);
  };

  const handleBuyNow = () => {
    if (!item) return;
    const n = Math.max(1, Number(qty) || 1);
    addItem(item, n);
    router.push('/cart');
  };

  if (loading) {
    return (
      <main className="product-page">
        <div className="product-loading">
          <div className="loading-spinner" />
        </div>
      </main>
    );
  }

  if (!item) {
    return (
      <main className="product-page">
        <div className="product-not-found">
          <h2>{t('product.notFound')}</h2>
          <p>{t('product.notFoundDesc')}</p>
          <Link href="/" className="btn primary">{t('product.backToShop')}</Link>
        </div>
      </main>
    );
  }

  const priceText = Number.isFinite(Number(item.price)) ? fmt.format(Number(item.price)) : '—';
  const allImages = Array.isArray(item.images) && item.images.length ? item.images : (item.imageUrl ? [item.imageUrl] : []);
  const imgSrc = allImages[activeImg] || item.imageUrl || getPlaceholder(item.title);

  const goPrev = () => { setActiveImg(i => (i - 1 + allImages.length) % allImages.length); setImgLoaded(false); };
  const goNext = () => { setActiveImg(i => (i + 1) % allImages.length); setImgLoaded(false); };

  return (
    <main className={`product-page ${visible ? 'product-page--visible' : ''}`}>
      {/* Breadcrumb */}
      <nav className="product-breadcrumb">
        <Link href="/">{t('nav.home')}</Link>
        <span className="product-breadcrumb-sep">/</span>
        <span>{item.category || t('nav.home')}</span>
        <span className="product-breadcrumb-sep">/</span>
        <span className="product-breadcrumb-current">{item.title}</span>
      </nav>

      <div className="product-layout">
        {/* Image column */}
        <div className="product-image-col">
          <div className={`product-image-wrap ${imgLoaded ? 'product-image-wrap--loaded' : ''}`}>
            <div style={{ position: 'relative' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imgSrc}
                alt={item.title || ''}
                onLoad={() => setImgLoaded(true)}
                onError={(e) => {
                  const fallback = getPlaceholder(item.title);
                  if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
                }}
              />
              {!imgLoaded && <div className="product-image-skeleton" />}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={goPrev}
                    aria-label="Image précédente"
                    style={{
                      position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                      width: 36, height: 36, borderRadius: '50%', border: 'none',
                      background: 'rgba(255,255,255,0.85)', cursor: 'pointer', fontSize: 18,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)', zIndex: 2,
                    }}
                  >‹</button>
                  <button
                    onClick={goNext}
                    aria-label="Image suivante"
                    style={{
                      position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                      width: 36, height: 36, borderRadius: '50%', border: 'none',
                      background: 'rgba(255,255,255,0.85)', cursor: 'pointer', fontSize: 18,
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
              <div className="product-thumbnails" style={{ display: 'flex', gap: 8, marginTop: 12, overflowX: 'auto', paddingBottom: 4 }}>
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setActiveImg(idx); setImgLoaded(false); }}
                    style={{
                      flexShrink: 0, width: 64, height: 64,
                      border: idx === activeImg ? '2px solid #333' : '2px solid #eaeaea',
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
        </div>

        {/* Info column */}
        <div className="product-info-col">
          <div className="product-info-sticky">
            {item.category && (
              <p className="product-category">{item.category}</p>
            )}

            <h1 className="product-title">{item.title}</h1>

            <p className="product-price">{priceText}</p>

            {item.description && (
              <p className="product-description">{item.description}</p>
            )}

            {/* Quantity selector */}
            <div className="product-qty-row">
              <span className="product-qty-label">{t('product.quantity')}</span>
              <div className="product-qty-control">
                <button
                  className="product-qty-btn"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  aria-label={t('product.decrease')}
                >−</button>
                <input
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                  className="product-qty-input"
                />
                <button
                  className="product-qty-btn"
                  onClick={() => setQty(qty + 1)}
                  aria-label={t('product.increase')}
                >+</button>
              </div>
              {added && <span className="product-added-badge">{t('product.added')}</span>}
            </div>

            {/* Action buttons — horizontal layout: left=back, right=instagram */}
            <div className="product-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              {/* Left: back to shop */}
              <button
                type="button"
                onClick={() => router.push('/')}
                className="inline-flex items-center gap-2 border border-ink/20 px-6 py-3 font-sans text-[10px] font-light uppercase tracking-[0.28em] text-ink transition hover:border-ink"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
                {t('product.backToShop')}
              </button>

              {/* Right: add to cart + instagram */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <button className="btn primary product-action-btn" onClick={handleAdd} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M6 6h12l1 14H5L6 6z"/>
                    <path d="M9 6V4a3 3 0 0 1 6 0v2"/>
                  </svg>
                  {t('product.addToCart')}
                </button>
                <a
                  className="inline-flex items-center gap-2 border border-ink/20 px-6 py-3 font-sans text-[10px] font-light uppercase tracking-[0.28em] text-ink transition hover:border-ink"
                  href="https://www.instagram.com/maisonmariegabison/"
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={t('product.contactInstagram')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5"/>
                    <circle cx="12" cy="12" r="4.5"/>
                    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
                  </svg>
                  <span className="hidden sm:inline">{t('product.contactInstagram')}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
