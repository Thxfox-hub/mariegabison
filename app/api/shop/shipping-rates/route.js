export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Simple in-memory cache (per server process)
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes
const cache = new Map(); // key -> { data, ts }

const SC_KEY = process.env.SENDCLOUD_PUBLIC_KEY;
const SC_SECRET = process.env.SENDCLOUD_SECRET_KEY;
const FROM_COUNTRY = process.env.SENDCLOUD_FROM_COUNTRY;
const FROM_POSTAL_CODE = process.env.SENDCLOUD_FROM_POSTAL_CODE;

function b64(s) {
  if (typeof Buffer !== 'undefined') return Buffer.from(s).toString('base64');
  // Edge fallback (if switched later)
  if (typeof btoa !== 'undefined') return btoa(s);
  throw new Error('No base64 encoder available');
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function jsonOK(data) {
  return new Response(JSON.stringify(data), { status: 200, headers: { 'content-type': 'application/json', ...corsHeaders() } });
}
function jsonErr(status, data) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', ...corsHeaders() } });
}

function makeCacheKey(address, parcels) {
  try {
    return JSON.stringify({
      from: { country: String(FROM_COUNTRY || '').toUpperCase(), postal_code: String(FROM_POSTAL_CODE || '') },
      to: { country: String(address?.country || '').toUpperCase(), postal_code: address?.postal_code || address?.postcode || '' },
      parcels: (Array.isArray(parcels) ? parcels : []).map(p => ({ weight: Number(p?.weight) || 0, quantity: Number(p?.quantity) || 0 })),
    });
  } catch {
    return `${Date.now()}-${Math.random()}`;
  }
}

async function sendcloud(path, init = {}) {
  const url = `https://panel.sendcloud.sc/api/v2${path}`;
  const headers = {
    'Accept': 'application/json',
    'Authorization': `Basic ${b64(`${SC_KEY}:${SC_SECRET}`)}`,
    ...(init.headers || {}),
  };
  // Timeout wrapper
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 15000); // 15s timeout
  try {
    const res = await fetch(url, { ...init, headers, signal: controller.signal });
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch {}
    if (!res.ok) {
      throw new Error(json?.error || json?.message || text || `Sendcloud error ${res.status}`);
    }
    return json;
  } finally {
    clearTimeout(id);
  }
}

// Public API base (for shipping-prices endpoint)
async function sendcloudPublic(path, init = {}) {
  const url = `https://public-api.sendcloud.com/api/v2${path}`;
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': `Basic ${b64(`${SC_KEY}:${SC_SECRET}`)}`,
    ...(init.headers || {}),
  };
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, { ...init, headers, signal: controller.signal });
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch {}
    if (!res.ok) {
      throw new Error(json?.error || json?.message || text || `Sendcloud public error ${res.status}`);
    }
    return json;
  } finally {
    clearTimeout(id);
  }
}

export async function OPTIONS() {
  return jsonOK({ ok: true });
}

export async function POST(req) {
  if (!SC_KEY || !SC_SECRET) {
    return jsonErr(500, {
      error: 'Missing Sendcloud configuration',
      required: ['SENDCLOUD_PUBLIC_KEY','SENDCLOUD_SECRET_KEY'],
    });
  }

  let payload = null;
  try { payload = await req.json(); } catch (e) {
    return jsonErr(400, { error: 'Invalid JSON body' });
  }

  const address = payload?.address || {};
  const parcels = Array.isArray(payload?.parcels) ? payload.parcels : [];

  const toCountry = String(address?.country || '').toUpperCase();
  const toPostal = String(address?.postal_code || address?.postcode || '');
  if (!toCountry) return jsonErr(400, { error: 'address.country is required' });
  if (!toPostal) return jsonErr(400, { error: 'address.postal_code is required' });
  if (!parcels.length) return jsonErr(400, { error: 'parcels[] is required' });

  // Total weight in grams (frontend provides grams)
  const totalWeightG = parcels.reduce((sum, p) => sum + (Number(p?.weight) || 0) * (Number(p?.quantity) || 0), 0);
  if (!Number.isFinite(totalWeightG) || totalWeightG <= 0) {
    return jsonErr(400, { error: 'Total weight must be > 0 (grams)' });
  }

  // Cache
  const key = makeCacheKey({ country: toCountry, postal_code: toPostal }, parcels);
  const entry = cache.get(key);
  const now = Date.now();
  if (entry && (now - entry.ts) < CACHE_TTL_MS) {
    return jsonOK(entry.data);
  }

  try {
    // 1) Get all shipping methods
    const methods = await sendcloud('/shipping_methods');
    const list = Array.isArray(methods?.shipping_methods) ? methods.shipping_methods : [];
    if (list.length === 0) return jsonErr(502, { error: 'No shipping methods available from Sendcloud' });

    // If origin is configured, try precise pricing from FROM -> TO using shipping-prices
    if (FROM_COUNTRY && FROM_POSTAL_CODE) {
      console.log(`[RatesAPI] pricing via shipping-prices from ${String(FROM_COUNTRY).toUpperCase()}/${String(FROM_POSTAL_CODE)} to ${toCountry}/${toPostal} weight=${Math.round(totalWeightG)}g`);
      const candidates = list.slice(0, 25); // cap
      const priced = await Promise.allSettled(candidates.map(async (m) => {
        const body = {
          from_country: String(FROM_COUNTRY).toUpperCase(),
          from_postal_code: String(FROM_POSTAL_CODE),
          to_country: toCountry,
          to_postal_code: toPostal,
          weight: Math.round(totalWeightG), // grams per Sendcloud shipping-prices
          shipping_method_id: m.id,
        };
        const res = await sendcloudPublic('/shipping-prices', { method: 'POST', body: JSON.stringify(body) });
        const amount = Number(res?.price?.amount ?? res?.price ?? NaN);
        if (!Number.isFinite(amount)) throw new Error('Invalid price');
        return {
          id: String(m.id),
          service_name: m.name || m.service_name || 'Méthode',
          carrier: m.carrier || m.brand || 'Transporteur',
          price: Number(amount.toFixed(2)),
          delivery_time: m?.delivery_time || '',
          delivery_type: (m?.is_pickup === true) ? 'pickup_point' : 'home',
        };
      }));
      const options = priced
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value)
        .sort((a, b) => a.price - b.price)
        .slice(0, 5);
      if (options.length > 0) {
        console.log(`[RatesAPI] got ${options.length} priced options (shipping-prices)`);
        cache.set(key, { data: options, ts: now });
        return jsonOK(options);
      }
      console.log('[RatesAPI] shipping-prices returned no priced options, falling back');
      // else fallthrough to generic method-based pricing
    }

    // 2) Filter methods by destination and weight bounds if present
    const weightKg = totalWeightG / 1000; // Sendcloud fields are often in kg
    console.log(`[RatesAPI] fallback pricing via shipping_methods to ${toCountry}/${toPostal} weightKg=${weightKg}`);
    const filtered = list.filter((m) => {
      // Country restriction
      const countries = Array.isArray(m?.countries) ? m.countries : [];
      const countryOK = countries.length ? countries.some((c) => String(c?.iso_2 || '').toUpperCase() === toCountry) : true;
      // Weight bounds (if present on method)
      const minW = Number(m?.min_weight);
      const maxW = Number(m?.max_weight);
      const minOK = Number.isFinite(minW) ? (weightKg >= minW) : true;
      const maxOK = Number.isFinite(maxW) ? (weightKg <= maxW) : true;
      return countryOK && minOK && maxOK;
    });

    // 3) Map to simplified options and pick price for the destination if available
    const options = filtered.map((m) => {
      const countries = Array.isArray(m?.countries) ? m.countries : [];
      const forDest = countries.find((c) => String(c?.iso_2 || '').toUpperCase() === toCountry);
      const rawPrice = (forDest?.price ?? m?.price);
      const price = Number(rawPrice);
      const transit = m?.transit_time || m?.delivery_time;
      let delivery_time = '';
      if (transit && typeof transit === 'object' && (Number.isFinite(transit.min) || Number.isFinite(transit.max))) {
        const min = Number(transit.min) || undefined;
        const max = Number(transit.max) || undefined;
        if (min && max && min === max) delivery_time = `${min} jours`;
        else if (min && max) delivery_time = `${min}-${max} jours`;
        else if (min) delivery_time = `${min}+ jours`;
      }
      return {
        id: String(m.id),
        service_name: m.name || m.service_name || 'Méthode',
        carrier: m.carrier || m.brand || 'Transporteur',
        price: Number.isFinite(price) ? Number(price.toFixed(2)) : 0,
        delivery_time,
        delivery_type: (m?.is_pickup === true) ? 'pickup_point' : 'home',
      };
    })
    .filter(o => o.price > 0)
    .sort((a, b) => a.price - b.price)
    .slice(0, 5);

    if (options.length === 0) return jsonErr(404, { error: 'No shipping options available for this destination/weight' });

    cache.set(key, { data: options, ts: now });
    return jsonOK(options);
  } catch (e) {
    return jsonErr(502, { error: String(e?.message || e) });
  }
}
