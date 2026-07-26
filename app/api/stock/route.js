/**
 * API Stock - Produits
 *
 * GET    /api/stock              → liste des produits
 * POST   /api/stock              → ajoute un produit (avec images base64)
 * DELETE /api/stock?row=N        → supprime la ligne N
 *
 * Protégé par Authorization: Bearer <STOCK_ADMIN_TOKEN>
 */
import { timingSafeEqual } from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const GAS_URL = process.env.NEXT_PUBLIC_GAS_URL || process.env.GAS_URL;
const ADMIN_TOKEN = process.env.STOCK_ADMIN_TOKEN;

function checkAuth(req) {
  if (!ADMIN_TOKEN) return false;
  const auth = req.headers.get('authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (!token) return false;
  // Timing-safe comparison to prevent timing attacks
  try {
    const a = Buffer.from(token);
    const b = Buffer.from(ADMIN_TOKEN);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

// GET: liste des produits
export async function GET(req) {
  if (!checkAuth(req)) return json({ error: 'Non autorisé' }, 401);
  if (!GAS_URL) return json({ error: 'GAS_URL non configuré' }, 500);

  try {
    const url = GAS_URL + (GAS_URL.includes('?') ? '&' : '?') + 'action=getStock';
    const res = await fetch(url, { cache: 'no-store' });
    const data = await res.json();
    if (data.error) return json({ error: data.error }, 502);
    return json({ items: data.items || [] });
  } catch (e) {
    return json({ error: String(e?.message || e) }, 502);
  }
}

// POST: ajoute un produit (avec images base64)
export async function POST(req) {
  if (!checkAuth(req)) return json({ error: 'Non autorisé' }, 401);
  if (!GAS_URL) return json({ error: 'GAS_URL non configuré' }, 500);

  try {
    const body = await req.json();
    // body: { name, type, price, description, collection, images: [{ name, mimeType, data }] }

    if (!body.name?.trim()) return json({ error: 'Le nom est obligatoire' }, 400);
    if (!body.images?.length) return json({ error: 'Au moins un média est obligatoire' }, 400);
    // Limit to 5 media files, 100MB each
    if (body.images.length > 5) return json({ error: 'Maximum 5 médias' }, 400);
    for (const img of body.images) {
      if (img.data && Buffer.byteLength(img.data, 'base64') > 100 * 1024 * 1024) {
        return json({ error: 'Média trop volumineux (100 MB max)' }, 400);
      }
    }

    const url = GAS_URL + (GAS_URL.includes('?') ? '&' : '?') + 'action=addProduct';
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.error) return json({ error: data.error }, 400);
    return json({ success: true, imageUrls: data.imageUrls, rowIndex: data.rowIndex });
  } catch (e) {
    return json({ error: String(e?.message || e) }, 500);
  }
}

// DELETE: supprime une ligne
export async function DELETE(req) {
  if (!checkAuth(req)) return json({ error: 'Non autorisé' }, 401);
  if (!GAS_URL) return json({ error: 'GAS_URL non configuré' }, 500);

  const row = req.nextUrl.searchParams.get('row');
  if (!row) return json({ error: 'Paramètre row manquant' }, 400);
  // Validate row is a positive integer
  const rowNum = parseInt(row, 10);
  if (!Number.isFinite(rowNum) || rowNum < 2) return json({ error: 'Row invalide' }, 400);

  try {
    const url = GAS_URL + (GAS_URL.includes('?') ? '&' : '?') + 'action=delete&row=' + encodeURIComponent(row);
    const res = await fetch(url, { cache: 'no-store' });
    const data = await res.json();
    if (data.error) return json({ error: data.error }, 400);
    return json({ success: true, deletedRow: rowNum });
  } catch (e) {
    return json({ error: String(e?.message || e) }, 502);
  }
}

// PATCH: modifie un produit
export async function PATCH(req) {
  if (!checkAuth(req)) return json({ error: 'Non autorisé' }, 401);
  if (!GAS_URL) return json({ error: 'GAS_URL non configuré' }, 500);

  try {
    const body = await req.json();
    if (!body.rowIndex) return json({ error: 'rowIndex manquant' }, 400);
    const rowNum = parseInt(body.rowIndex, 10);
    if (!Number.isFinite(rowNum) || rowNum < 2) return json({ error: 'rowIndex invalide' }, 400);

    const url = GAS_URL + (GAS_URL.includes('?') ? '&' : '?') + 'action=updateProduct';
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.error) return json({ error: data.error }, 400);
    return json({ success: true, updated: data.updated || [] });
  } catch (e) {
    return json({ error: String(e?.message || e) }, 500);
  }
}
