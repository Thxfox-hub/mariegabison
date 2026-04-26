export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;

export async function GET(req) {
  if (!stripe) {
    return new Response(JSON.stringify({ error: 'Missing STRIPE_SECRET_KEY' }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
  const sessionId = req.nextUrl.searchParams.get('session_id');
  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'session_id is required' }), { status: 400, headers: { 'content-type': 'application/json' } });
  }
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['payment_intent'] });
    let status = 'failure';
    if (session.payment_status === 'paid') status = 'success';
    else if (session.status === 'open' || session.payment_status === 'no_payment_required') status = 'processing';
    else if (session.payment_intent && typeof session.payment_intent === 'object') {
      const pi = session.payment_intent;
      if (pi.status === 'succeeded') status = 'success';
      else if (pi.status === 'processing' || pi.status === 'requires_action' || pi.status === 'requires_confirmation') status = 'processing';
      else status = 'failure';
    }
    return new Response(JSON.stringify({ status }), { status: 200, headers: { 'content-type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 502, headers: { 'content-type': 'application/json' } });
  }
}
