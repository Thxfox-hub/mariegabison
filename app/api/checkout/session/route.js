export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;

export async function POST(req) {
  if (!stripe) {
    return new Response(JSON.stringify({ error: 'Missing STRIPE_SECRET_KEY' }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
  let payload = null;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: { 'content-type': 'application/json' } });
  }

  const items = Array.isArray(payload?.items) ? payload.items : [];
  const shippingOption = payload?.shippingOption || null; // { price, carrier, service_name }
  const contact = payload?.contact || {}; // { name, email, phone }
  const address = payload?.address || {}; // { street, postal_code, city, country }

  if (!items.length) {
    return new Response(JSON.stringify({ error: 'No items' }), { status: 400, headers: { 'content-type': 'application/json' } });
  }

  const currency = 'eur';

  // Build line items from simple data (amount in cents)
  const line_items = [];
  for (const it of items) {
    const name = String(it.title || it.name || 'Produit');
    const unit = Math.round(Number(it.price) * 100);
    const qty = Number(it.quantity) || 1;
    if (!Number.isFinite(unit) || unit <= 0 || !Number.isFinite(qty) || qty <= 0) continue;
    line_items.push({
      price_data: {
        currency,
        product_data: { name },
        unit_amount: unit,
      },
      quantity: qty,
    });
  }

  if (shippingOption && Number.isFinite(Number(shippingOption.price))) {
    const shipCents = Math.round(Number(shippingOption.price) * 100);
    line_items.push({
      price_data: {
        currency,
        product_data: { name: `Livraison: ${shippingOption.carrier || ''} ${shippingOption.service_name || ''}`.trim() },
        unit_amount: shipCents,
      },
      quantity: 1,
    });
  }

  if (line_items.length === 0) {
    return new Response(JSON.stringify({ error: 'No billable items' }), { status: 400, headers: { 'content-type': 'application/json' } });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items,
      customer_email: contact?.email || undefined,
      phone_number_collection: { enabled: true },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/checkout/completion?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/checkout/canceled`,
      metadata: {
        name: contact?.name || '',
        phone: contact?.phone || '',
        addr_street: address?.street || '',
        addr_postal_code: address?.postal_code || '',
        addr_city: address?.city || '',
        addr_country: address?.country || '',
      },
    });

    return new Response(JSON.stringify({ id: session.id, url: session.url }), { status: 200, headers: { 'content-type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 502, headers: { 'content-type': 'application/json' } });
  }
}
