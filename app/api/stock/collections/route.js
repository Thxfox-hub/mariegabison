/**
 * API Stock - Collections
 *
 * GET    /api/stock/collections          → liste des collections
 * POST   /api/stock/collections          → crée une collection
 * DELETE /api/stock/collections?row=N    → supprime la collection N
 * PATCH  /api/stock/collections          → modifie une collection
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

// GET: liste des collections
export async function GET(req) {
  if (!checkAuth(req)) return json({ error: 'Non autorisé' }, 401);
  if (!GAS_URL) return json({ error: 'GAS_URL non configuré' }, 500);

  try {
    const url = GAS_URL + (GAS_URL.includes('?') ? '&' : '?') + 'action=getCollections';
    const res = await fetch(url, { cache: 'no-store' });
    const data = await res.json();
    if (data.error) return json({ error: data.error }, 502);
    return json({ items: data.items || [] });
  } catch (e) {
    return json({ error: String(e?.message || e) }, 502);
  }
}

// POST: crée une collection
export async function POST(req) {
  if (!checkAuth(req)) return json({ error: 'Non autorisé' }, 401);
  if (!GAS_URL) return json({ error: 'GAS_URL non configuré' }, 500);

  try {
    const body = await req.json();
    if (!body.name?.trim()) return json({ error: 'Le nom est obligatoire' }, 400);
    // Limit name length
    if (body.name.length > 100) return json({ error: 'Nom trop long (100 max)' }, 400);

    const url = GAS_URL + (GAS_URL.includes('?') ? '&' : '?') + 'action=addCollection';
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.error) return json({ error: data.error }, 400);
    return json({ success: true, rowIndex: data.rowIndex });
  } catch (e) {
    return json({ error: String(e?.message || e) }, 500);
  }
}

// PATCH: modifie une collection
export async function PATCH(req) {
  if (!checkAuth(req)) return json({ error: 'Non autorisé' }, 401);
  if (!GAS_URL) return json({ error: 'GAS_URL non configuré' }, 500);

  try {
    const body = await req.json();
    if (!body.rowIndex) return json({ error: 'rowIndex manquant' }, 400);
    const rowNum = parseInt(body.rowIndex, 10);
    if (!Number.isFinite(rowNum) || rowNum < 2) return json({ error: 'rowIndex invalide' }, 400);

    const url = GAS_URL + (GAS_URL.includes('?') ? '&' : '?') + 'action=updateCollection';
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.error) return json({ error: data.error }, 400);
    return json({ success: true });
  } catch (e) {
    return json({ error: String(e?.message || e) }, 500);
  }
}

// DELETE: supprime une collection
export async function DELETE(req) {
  if (!checkAuth(req)) return json({ error: 'Non autorisé' }, 401);
  if (!GAS_URL) return json({ error: 'GAS_URL non configuré' }, 500);

  const row = req.nextUrl.searchParams.get('row');
  if (!row) return json({ error: 'Paramètre row manquant' }, 400);
  const rowNum = parseInt(row, 10);
  if (!Number.isFinite(rowNum) || rowNum < 2) return json({ error: 'Row invalide' }, 400);

  try {
    const url = GAS_URL + (GAS_URL.includes('?') ? '&' : '?') + 'action=deleteCollection&row=' + encodeURIComponent(row);
    const res = await fetch(url, { cache: 'no-store' });
    const data = await res.json();
    if (data.error) return json({ error: data.error }, 400);
    return json({ success: true, deletedRow: rowNum });
  } catch (e) {
    return json({ error: String(e?.message || e) }, 502);
  }
}
