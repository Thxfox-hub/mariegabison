/**
 * ProductCard.jsx - Marie Gabison Bijoux
 * Ultra-minimal Zara-style product card (image + title + price only)
 * Clicking navigates to /product/[id] dedicated page.
 */
"use client";

import Link from 'next/link';
import { useMemo } from 'react';
import { useTranslation } from '../lib/i18n/context';

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&q=80',
  'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80',
  'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600&q=80',
  'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&q=80',
  'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80',
  'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=600&q=80',
];

export default function ProductCard({ item }) {
  const { id, title, price, imageUrl } = item;
  const { lang } = useTranslation();

  const fmt = useMemo(() => new Intl.NumberFormat(lang === 'en' ? 'en-US' : lang === 'ru' ? 'ru-RU' : lang === 'it' ? 'it-IT' : 'fr-FR', { style: 'currency', currency: 'EUR' }), [lang]);

  const getPlaceholder = (str) => {
    let hash = 0;
    for (let i = 0; i < (str || '').length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return PLACEHOLDER_IMAGES[Math.abs(hash) % PLACEHOLDER_IMAGES.length];
  };

  const placeholder = getPlaceholder(title);

  const handleError = (e) => {
    if (e.currentTarget.src !== placeholder) {
      e.currentTarget.src = placeholder;
    }
  };

  const formatPrice = (p) => {
    const n = Number(p);
    return Number.isFinite(n) ? fmt.format(n) : '';
  };

  const productHref = `/product/${encodeURIComponent(id || title)}`;

  return (
    <Link href={productHref} className="product-card" style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="product-card-media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl || placeholder}
          onError={handleError}
          alt={title || ''}
          loading="lazy"
        />
      </div>
      <div className="product-card-title">{title}</div>
      <div className="product-card-price">
        {price !== undefined && price !== null && String(price) !== '' 
          ? formatPrice(price) 
          : ''}
      </div>
    </Link>
  );
}
