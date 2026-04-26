export const dynamic = 'force-dynamic';

// Demo wedding jewelry catalog for development/preview
const DEMO_CATALOG = [
  {
    id: 'col-001',
    title: 'Collier Éternité',
    price: 289,
    description: 'Collier en or 18 carats avec pendentif en perle naturelle. Parfait pour sublimer votre robe de mariée.',
    category: 'Colliers',
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80',
  },
  {
    id: 'col-002',
    title: 'Collier Grâce',
    price: 345,
    description: 'Collier délicat en argent sterling avec cristaux Swarovski. Élégance intemporelle.',
    category: 'Colliers',
    imageUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&q=80',
  },
  {
    id: 'col-003',
    title: 'Collier Aurore',
    price: 420,
    description: 'Collier en or rose avec diamants. Une pièce unique pour un jour unique.',
    category: 'Colliers',
    imageUrl: 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=600&q=80',
  },
  {
    id: 'bra-001',
    title: 'Bracelet Harmonie',
    price: 175,
    description: 'Bracelet en or blanc avec perles de culture. Finesse et raffinement.',
    category: 'Bracelets',
    imageUrl: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600&q=80',
  },
  {
    id: 'bra-002',
    title: 'Bracelet Délice',
    price: 195,
    description: 'Bracelet jonc en or jaune. Simple et élégant pour toutes les occasions.',
    category: 'Bracelets',
    imageUrl: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=600&q=80',
  },
  {
    id: 'bra-003',
    title: 'Bracelet Sérénité',
    price: 225,
    description: 'Bracelet en argent avec zircons. Brillance et légèreté.',
    category: 'Bracelets',
    imageUrl: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=600&q=80',
  },
  {
    id: 'bou-001',
    title: 'Boucles Éclat',
    price: 165,
    description: "Boucles d'oreilles pendantes en or avec cristaux. Captez la lumière à chaque mouvement.",
    category: "Boucles d'oreille",
    imageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&q=80',
  },
  {
    id: 'bou-002',
    title: 'Boucles Pureté',
    price: 145,
    description: "Boucles d'oreilles en perles naturelles. Classiques et intemporelles.",
    category: "Boucles d'oreille",
    imageUrl: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=600&q=80',
  },
  {
    id: 'bou-003',
    title: 'Boucles Céleste',
    price: 189,
    description: "Boucles d'oreilles en or rose avec diamants. Pour briller le jour J.",
    category: "Boucles d'oreille",
    imageUrl: 'https://images.unsplash.com/photo-1589128777073-263566ae5e4d?w=600&q=80',
  },
  {
    id: 'bag-001',
    title: 'Bague Alliance',
    price: 450,
    description: 'Alliance en or blanc 18 carats avec diamants sertis. Le symbole parfait de votre union.',
    category: 'Bagues',
    imageUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80',
  },
  {
    id: 'bag-002',
    title: 'Bague Promesse',
    price: 320,
    description: 'Bague solitaire en or jaune avec diamant central. Élégance pure.',
    category: 'Bagues',
    imageUrl: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=600&q=80',
  },
  {
    id: 'bag-003',
    title: 'Bague Infini',
    price: 275,
    description: 'Bague en or rose avec motif infini. Amour éternel.',
    category: 'Bagues',
    imageUrl: 'https://images.unsplash.com/photo-1602752250015-52934bc45613?w=600&q=80',
  },
  {
    id: 'par-001',
    title: 'Parure Majesté',
    price: 750,
    description: 'Ensemble collier, bracelet et boucles en or blanc. La parure complète pour la mariée.',
    category: 'Parures',
    imageUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&q=80',
  },
  {
    id: 'par-002',
    title: 'Parure Royale',
    price: 890,
    description: 'Parure en or jaune avec perles et diamants. Luxe et raffinement.',
    category: 'Parures',
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80',
  },
];

// In-memory cache (per server process)
let CATALOG_CACHE = {
  ts: 0,
  items: null,
};

const DEFAULT_TTL_MS = Number(process.env.CATALOG_TTL_SECONDS || 60) * 1000;
const FETCH_TIMEOUT_MS = Number(process.env.CATALOG_FETCH_TIMEOUT_MS || 10000);

async function fetchFromGAS(url) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { cache: 'no-store', signal: controller.signal, headers: { 'accept': 'application/json' } });
    const bodyText = await res.text();
    let data = null;
    try { data = JSON.parse(bodyText); } catch {}
    if (!res.ok) {
      throw new Error(`Upstream GAS error ${res.status}: ${bodyText?.slice(0, 180) || ''}`);
    }
    let items = [];
    if (Array.isArray(data)) items = data;
    else if (Array.isArray(data?.data)) items = data.data;
    else if (Array.isArray(data?.items)) items = data.items;
    return items;
  } finally {
    clearTimeout(t);
  }
}

export async function GET(req) {
  const url = process.env.GAS_URL || process.env.NEXT_PUBLIC_GAS_URL;
  
  // If no GAS_URL configured, return demo catalog
  if (!url) {
    return new Response(JSON.stringify(DEMO_CATALOG), {
      status: 200,
      headers: { 
        'content-type': 'application/json',
        'x-cache': 'DEMO',
      },
    });
  }

  const search = req?.nextUrl?.searchParams;
  const pretty = search?.get('debug') === '1';
  const force = search?.get('force') === '1';
  const ttlMs = Number(search?.get('ttl_ms') || DEFAULT_TTL_MS);

  const now = Date.now();
  const fresh = CATALOG_CACHE.items && now - CATALOG_CACHE.ts < ttlMs;

  // If cache is fresh and not forced, return immediately (fast path)
  if (!force && fresh) {
    return new Response(pretty ? JSON.stringify(CATALOG_CACHE.items, null, 2) : JSON.stringify(CATALOG_CACHE.items), {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'x-cache': 'HIT',
        'x-cache-age-ms': String(now - CATALOG_CACHE.ts),
      },
    });
  }

  // If stale cache exists and not force, serve stale immediately and revalidate in background
  if (!force && CATALOG_CACHE.items) {
    // Background revalidate
    fetchFromGAS(url)
      .then((items) => { CATALOG_CACHE = { ts: Date.now(), items }; })
      .catch(() => {});
    return new Response(pretty ? JSON.stringify(CATALOG_CACHE.items, null, 2) : JSON.stringify(CATALOG_CACHE.items), {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'x-cache': 'STALE',
        'x-cache-age-ms': String(now - CATALOG_CACHE.ts),
        'x-revalidate': 'background',
      },
    });
  }

  // Otherwise go fetch now (force or no cache)
  try {
    const rawItems = await fetchFromGAS(url);
    // Reduce payload: keep only needed fields, skip items without title
    const items = rawItems
      .filter((it) => (it.title ?? it.name ?? '').trim() !== '')
      .map((it) => ({
        id: it.id ?? it.ID ?? it.Id ?? it.title ?? undefined,
        title: it.title ?? it.name ?? '',
        price: it.price ?? it.Price ?? null,
        description: it.description ?? it.Description ?? '',
        category: it.category ?? it.Category ?? '',
        imageUrl: it.imageUrl ?? it.image ?? it.ImageUrl ?? '',
        weight_g: it.weight_g ?? it.weightG ?? undefined,
        weight_mg: it.weight_mg ?? it.weightMg ?? undefined,
        weight: it.weight ?? undefined,
      }));
    CATALOG_CACHE = { ts: Date.now(), items };
    return new Response(pretty ? JSON.stringify(items, null, 2) : JSON.stringify(items), {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'x-cache': 'MISS',
      },
    });
  } catch (e) {
    // If error and we had any cache, serve it as last resort fast-load
    if (CATALOG_CACHE.items) {
      return new Response(pretty ? JSON.stringify(CATALOG_CACHE.items, null, 2) : JSON.stringify(CATALOG_CACHE.items), {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'x-cache': 'STALE-ERROR',
          'x-error': String(e?.message || e),
        },
      });
    }
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    });
  }
}
