/**
 * page.jsx - Marie Gabison Bijoux
 * Ultra-minimal Zara-style homepage with i18n
 */
"use client";

import { useEffect, useMemo, useState } from 'react';
import ProductCard from '../components/ProductCard';
import { useTranslation } from '../lib/i18n/context';

const CATEGORY_KEYS = ['femme', 'homme', 'collection'];

export default function HomePage() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('loading');
  const [selectedCategory, setSelectedCategory] = useState('femme');
  const [sortBy, setSortBy] = useState('alpha');

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        setStatus('loading');
        // Try cache first
        try {
          const cached = localStorage.getItem('mariegabison_catalog');
          if (cached) {
            const arr = JSON.parse(cached);
            if (Array.isArray(arr) && arr.length > 0) {
              setItems(arr);
              setStatus('ready');
            }
          }
        } catch {}
        
        // Fetch from API
        const res = await fetch('/api/catalog', { signal: controller.signal, cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const arr = Array.isArray(data) ? data : data.items || [];
          setItems(arr);
          setStatus('ready');
          try { localStorage.setItem('mariegabison_catalog', JSON.stringify(arr)); } catch {}
        } else {
          throw new Error('API error');
        }
      } catch (e) {
        if (e.name !== 'AbortError') {
          console.error(e);
          if (items.length === 0) setStatus('error');
        }
      }
    }
    load();
    return () => controller.abort();
  }, []);

  // Sort items
  const sortedItems = useMemo(() => {
    const arr = [...items];
    if (sortBy === 'alpha') {
      arr.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'fr'));
    } else if (sortBy === 'price-asc') {
      arr.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sortBy === 'price-desc') {
      arr.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    }
    return arr;
  }, [items, sortBy]);

  return (
    <>
      {/* Category Bar */}
      <div className="category-bar">
        {CATEGORY_KEYS.map((cat) => (
          <button
            key={cat}
            className={`category-link ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {t(`categories.${cat}`)}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="search-bar">
        <input 
          type="text" 
          className="search-input" 
          placeholder={t('search.placeholder')}
          readOnly
        />
      </div>

      {/* Section Header with filters */}
      <div className="section-header">
        <div className="section-label">{t('search.sectionTitle')}</div>
        <div className="section-filters">
          <button 
            className={`filter-btn ${sortBy === 'alpha' ? 'active' : ''}`}
            onClick={() => setSortBy('alpha')}
          >
            {t('sort.az')}
          </button>
          <button 
            className={`filter-btn ${sortBy === 'price-asc' ? 'active' : ''}`}
            onClick={() => setSortBy('price-asc')}
          >
            {t('sort.priceAsc')}
          </button>
          <button 
            className={`filter-btn ${sortBy === 'price-desc' ? 'active' : ''}`}
            onClick={() => setSortBy('price-desc')}
          >
            {t('sort.priceDesc')}
          </button>
        </div>
      </div>

      <main>
        {/* Loading State */}
        {status === 'loading' && (
          <div className="loading-container">
            <div className="loading-spinner" />
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="status error">
            {t('errors.loadItems')}
          </div>
        )}

        {/* Products Grid */}
        {status === 'ready' && (
          <div className="product-grid">
            {sortedItems.map((it) => (
              <ProductCard 
                key={it.id || it.title} 
                item={it} 
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
