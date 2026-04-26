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

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  useEffect(() => {
    const id = params?.id;
    if (!id) return;
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/catalog', { cache: 'no-store' });
        if (!res.ok) throw new Error('Catalog error');
        const data = await res.json();
        const arr = Array.isArray(data) ? data : data.items || [];
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

  const handleAdd = () => {
    if (!item) return;
    const n = Math.max(1, Number(qty) || 1);
    addItem(item, n);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
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
  const imgSrc = item.imageUrl || getPlaceholder(item.title);

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

            {/* Action buttons */}
            <div className="product-actions">
              <button className="btn primary product-action-btn" onClick={handleAdd}>
                {t('product.addToCart')}
              </button>
              <button className="btn product-action-btn" onClick={handleBuyNow}>
                {t('product.buyNow')}
              </button>
              <a
                className="btn product-action-btn"
                href="https://www.instagram.com/maisonmariegabison/"
                target="_blank"
                rel="noreferrer noopener"
              >
                {t('product.contactInstagram')}
              </a>
            </div>

            <Link href="/" className="product-back-link">
              {t('product.backToShop')}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
