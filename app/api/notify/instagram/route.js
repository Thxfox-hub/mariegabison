export const dynamic = 'force-dynamic';

// This route attempts to send an Instagram DM via the Meta Graph API.
// IMPORTANT: It only works if:
// - Your Instagram account is Professional and connected to a Facebook Page
// - You have a Page Access Token with instagram_manage_messages + pages_messaging permissions
// - The recipient (creator) has an open conversation (PSID) with your Page (user-initiated within policy)
// Required env vars:
//   META_IG_PAGE_ACCESS_TOKEN   (Page Access Token)
//   META_IG_RECIPIENT_PSID      (PSID of the recipient user)
//   META_GRAPH_API_VERSION      (e.g. v20.0; optional, defaults v20.0)

export async function POST(req) {
  const token = process.env.META_IG_PAGE_ACCESS_TOKEN;
  const recipientId = process.env.META_IG_RECIPIENT_PSID;
  const version = process.env.META_GRAPH_API_VERSION || 'v20.0';

  if (!token || !recipientId) {
    return new Response(JSON.stringify({
      error: 'Missing META_IG_PAGE_ACCESS_TOKEN or META_IG_RECIPIENT_PSID',
    }), { status: 500, headers: { 'content-type': 'application/json' } });
  }

  let body = null;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: { 'content-type': 'application/json' } });
  }

  const text = String(body?.message || '').slice(0, 1900); // keep under typical message size limits
  if (!text) {
    return new Response(JSON.stringify({ error: 'message is required' }), { status: 400, headers: { 'content-type': 'application/json' } });
  }

  const url = `https://graph.facebook.com/${version}/me/messages?access_token=${encodeURIComponent(token)}`;
  const payload = {
    recipient: { id: recipientId },
    message: { text },
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const txt = await res.text();
    let json = null;
    try { json = txt ? JSON.parse(txt) : null; } catch {}

    if (!res.ok) {
      return new Response(JSON.stringify({ error: json?.error || txt || `Meta API error ${res.status}` }), { status: 502, headers: { 'content-type': 'application/json' } });
    }

    return new Response(JSON.stringify({ ok: true, result: json }), { status: 200, headers: { 'content-type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 502, headers: { 'content-type': 'application/json' } });
  }
}
