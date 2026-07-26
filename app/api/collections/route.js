/**
 * API Collections (public, no auth)
 *
 * GET /api/collections → list of visible collections from GAS
 * Used by the landing page (AllCollections, Categories).
 */
export const dynamic = 'force-dynamic';

const GAS_URL = process.env.GAS_URL || process.env.NEXT_PUBLIC_GAS_URL;

// In-memory cache (per server process)
let COLLECTIONS_CACHE = { ts: 0, items: null };
const TTL_MS = Number(process.env.CATALOG_TTL_SECONDS || 300) * 1000;

export async function GET() {
  if (!GAS_URL) {
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'content-type': 'application/json', 'x-cache': 'DEMO' },
    });
  }

  const now = Date.now();
  const fresh = COLLECTIONS_CACHE.items && now - COLLECTIONS_CACHE.ts < TTL_MS;

  if (fresh) {
    return new Response(JSON.stringify(COLLECTIONS_CACHE.items), {
      status: 200,
      headers: { 'content-type': 'application/json', 'x-cache': 'HIT' },
    });
  }

  try {
    const url = GAS_URL + (GAS_URL.includes('?') ? '&' : '?') + 'action=getCollections';
    const res = await fetch(url, { cache: 'no-store' });
    const data = await res.json();

    if (data.error) {
      throw new Error(data.error);
    }

    let items = (data.items || []).filter((c) => c.visible !== false);

    // Map to a frontend-friendly shape
    items = items.map((c) => ({
      id: c.name
        ? c.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        : '',
      name: c.name || '',
      description: c.description || '',
      season: c.createdAt ? new Date(c.createdAt).getFullYear().toString() : '',
      visible: c.visible !== false,
    }));

    COLLECTIONS_CACHE = { ts: now, items };

    return new Response(JSON.stringify(items), {
      status: 200,
      headers: { 'content-type': 'application/json', 'x-cache': 'MISS' },
    });
  } catch (e) {
    // Serve stale cache if available
    if (COLLECTIONS_CACHE.items) {
      return new Response(JSON.stringify(COLLECTIONS_CACHE.items), {
        status: 200,
        headers: { 'content-type': 'application/json', 'x-cache': 'STALE-ERROR' },
      });
    }
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'content-type': 'application/json', 'x-cache': 'ERROR' },
    });
  }
}
