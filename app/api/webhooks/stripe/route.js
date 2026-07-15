/**
 * Stripe webhook handler.
 * Verifies the event signature, then persists the order to Supabase.
 *
 * Handles:
 *  - checkout.session.completed  → insert order as PAID
 *  - checkout.session.expired     → mark order as CANCELED
 *  - payment_intent.payment_failed → mark order as FAILED
 */
export const runtime = 'nodejs';

import Stripe from 'stripe';
import { supabaseAdmin } from '../../../../lib/supabase/admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req) {
  if (!endpointSecret) {
    return new Response(JSON.stringify({ error: 'Missing STRIPE_WEBHOOK_SECRET' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  const body = await req.text();
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response(JSON.stringify({ error: 'Missing Stripe signature' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err?.message || err);
    return new Response(JSON.stringify({ error: 'Webhook signature verification failed' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      case 'checkout.session.expired':
        await handleCheckoutExpired(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }
  } catch (err) {
    console.error('Error processing Stripe webhook:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

/**
 * Insert a completed order into Supabase.
 */
async function handleCheckoutCompleted(session) {
  const meta = session.metadata || {};

  // Retrieve line items to store product details
  let lineItems = [];
  try {
    const li = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });
    lineItems = li.data || [];
  } catch (e) {
    console.error('Could not retrieve line items:', e?.message);
  }

  const order = {
    stripe_session_id: session.id,
    stripe_payment_intent_id: session.payment_intent || null,
    customer_email: session.customer_email || session.customer_details?.email || null,
    customer_name: meta.name || session.customer_details?.name || null,
    customer_phone: meta.phone || session.customer_details?.phone || null,
    shipping_street: meta.addr_street || session.shipping_details?.address?.line1 || null,
    shipping_postal_code: meta.addr_postal_code || session.shipping_details?.address?.postal_code || null,
    shipping_city: meta.addr_city || session.shipping_details?.address?.city || null,
    shipping_country: meta.addr_country || session.shipping_details?.address?.country || null,
    amount_total: session.amount_total,
    currency: session.currency,
    payment_status: session.payment_status,
    status: 'paid',
    items: lineItems.map((it) => ({
      name: it.description,
      quantity: it.quantity,
      amount: it.amount_total,
    })),
    created_at: new Date(session.created * 1000).toISOString(),
    paid_at: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin.from('orders').insert(order);
  if (error) {
    console.error('Failed to insert order into Supabase:', error.message);
  } else {
    console.log(`Order saved: ${session.id}`);
  }
}

async function handleCheckoutExpired(session) {
  const { error } = await supabaseAdmin
    .from('orders')
    .update({ status: 'canceled', updated_at: new Date().toISOString() })
    .eq('stripe_session_id', session.id);
  if (error) console.error('Failed to mark order canceled:', error.message);
}

async function handlePaymentFailed(paymentIntent) {
  // PaymentIntent doesn't have the session id directly; try metadata
  const sessionId = paymentIntent.metadata?.order_id;
  if (!sessionId) return;
  const { error } = await supabaseAdmin
    .from('orders')
    .update({ status: 'failed', updated_at: new Date().toISOString() })
    .eq('stripe_session_id', sessionId);
  if (error) console.error('Failed to mark order failed:', error.message);
}
