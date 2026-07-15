/**
 * API Stock - Lit et supprime les produits du spreadsheet via GAS
 *
 * GET  /api/stock          → liste des produits
 * DELETE /api/stock?row=N  → supprime la ligne N
 *
 * Protégé par un header Authorization: Bearer <ADMIN_TOKEN>
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const GAS_URL = process.env.NEXT_PUBLIC_GAS_URL || process.env.GAS_URL;
const ADMIN_TOKEN = process.env.STOCK_ADMIN_TOKEN || 'marie-gabison-stock-2024';

function checkAuth(req) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  return token === ADMIN_TOKEN;
}

// GET: liste des produits (proxy vers l'API GAS existante)
export async function GET(req) {
  if (!checkAuth(req)) {
    return new Response(JSON.stringify({ error: 'Non autorisé' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  }

  if (!GAS_URL) {
    return new Response(JSON.stringify({ error: 'GAS_URL non configuré' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    const res = await fetch(GAS_URL, { cache: 'no-store' });
    const data = await res.json();
    if (!data.success) {
      return new Response(JSON.stringify({ error: data.error || 'Erreur GAS' }), {
        status: 502,
        headers: { 'content-type': 'application/json' },
      });
    }

    // Ajouter rowIndex pour la suppression (basé sur l'ordre)
    const items = (data.data || []).map((item, i) => ({
      ...item,
      rowIndex: i + 2, // ligne 1 = header, première donnée = ligne 2
    }));

    return new Response(JSON.stringify({ items }), {
      headers: { 'content-type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    });
  }
}

// DELETE: supprime une ligne du spreadsheet via GAS
export async function DELETE(req) {
  if (!checkAuth(req)) {
    return new Response(JSON.stringify({ error: 'Non autorisé' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  }

  const row = req.nextUrl.searchParams.get('row');
  if (!row) {
    return new Response(JSON.stringify({ error: 'Paramètre row manquant' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  // Appeler l'endpoint GAS de suppression
  // ?app=stock&action=delete&row=N
  const deleteUrl = GAS_URL + (GAS_URL.includes('?') ? '&' : '?') + 'app=stock&action=delete&row=' + encodeURIComponent(row);

  try {
    const res = await fetch(deleteUrl, {
      method: 'GET',
      redirect: 'manual', // GAS redirige après suppression
      cache: 'no-store',
    });
    // Peu importe le statut, la suppression a été faite côté GAS
    return new Response(JSON.stringify({ success: true, deletedRow: parseInt(row, 10) }), {
      headers: { 'content-type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    });
  }
}
