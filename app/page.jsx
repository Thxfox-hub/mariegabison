/**
 * page.jsx - Marie Gabison Paris
 * Editorial wedding-jewelry homepage with GAS-powered product catalog.
 * Layout: CollectionIntro → Carousel → BrandManifesto → JewelryGrid →
 *         Categories → AllCollections → BrandStory → Contact
 * Products are fetched from /api/catalog (Google Apps Script backend).
 */
"use client";

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import SkeletonCard from '../components/SkeletonCard';
import { useTranslation } from '../lib/i18n/context';
import CollectionIntro from '../components/landing/CollectionIntro';
import Carousel from '../components/landing/Carousel';
import BrandManifesto from '../components/landing/BrandManifesto';
import JewelryGrid from '../components/landing/JewelryGrid';
import Categories from '../components/landing/Categories';
import AllCollections from '../components/landing/AllCollections';
import BrandStory from '../components/landing/BrandStory';
import Contact from '../components/landing/Contact';

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const rawCat = searchParams?.get('cat') || null;
  const catParam = rawCat && rawCat.toLowerCase() !== 'all' ? rawCat : null;

  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('loading');

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

        // Fetch from API (Google Apps Script)
        const res = await fetch('/api/catalog', { signal: controller.signal, cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const arr = Array.isArray(data) ? data : data.data || data.items || [];
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

  // Filter by category when ?cat= is present (from Categories links)
  const filteredItems = useMemo(() => {
    if (!catParam) return items;
    return items.filter(it => {
      const cat = (it.category || '').toLowerCase();
      const target = catParam.toLowerCase();
      return cat === target || cat.includes(target) || target.includes(cat);
    });
  }, [items, catParam]);

  const isDefaultView = !catParam;

  return (
    <>
      {/* ===== Full landing experience (default view) ===== */}
      {isDefaultView && (
        <>
          <CollectionIntro />
          <Carousel items={items} />
          <BrandManifesto />
        </>
      )}

      {/* ===== Category-filtered view (from ?cat=) ===== */}
      {!isDefaultView && (
        <section className="px-6 pt-14 pb-8 text-center animate-fade-up">
          <Link
            href="/"
            className="inline-block font-sans text-[10px] font-light uppercase tracking-[0.32em] text-ink-soft underline decoration-ink/15 underline-offset-6 transition hover:text-ink hover:decoration-ink/40"
          >
            ← {t('nav.back')}
          </Link>
          <p className="mt-6 font-sans text-[10px] font-light uppercase tracking-[0.48em] text-ink-soft">
            {t('search.sectionTitle')}
          </p>
          <h2 className="mt-5 font-serif text-4xl font-light tracking-[0.08em] text-ink sm:text-5xl">
            {catParam}
          </h2>
          <div className="mx-auto mt-7 h-px w-10 bg-ink/25" />
        </section>
      )}

      {/* ===== Product Grid (GAS catalog) ===== */}
      {status === 'loading' && (
        <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
          <div className="grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </section>
      )}

      {status === 'error' && (
        <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 text-center">
          <div className="status error" style={{ textAlign: 'center', padding: '40px 0' }}>
            <p>{t('errors.loadItems')}</p>
            <button className="btn" style={{ marginTop: 12 }} onClick={() => { setStatus('loading'); window.location.reload(); }}>
              ↻
            </button>
          </div>
        </section>
      )}

      {status === 'ready' && (
        filteredItems.length > 0 ? (
          <JewelryGrid
            items={filteredItems}
            title={isDefaultView ? t('landing.discoverCollection') : catParam}
          />
        ) : (
          <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 text-center">
            <div className="status" style={{ textAlign: 'center', padding: '40px 0' }}>
              {t('search.noResults')}
            </div>
          </section>
        )
      )}

      {/* ===== Landing bottom sections (default view only) ===== */}
      {isDefaultView && (
        <>
          <Categories />
          <AllCollections />
          <BrandStory />
          <Contact />
        </>
      )}
    </>
  );
}
