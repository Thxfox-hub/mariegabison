export const dynamic = 'force-dynamic';

export async function GET() {
  const url = process.env.GAS_URL || process.env.NEXT_PUBLIC_GAS_URL;
  if (!url) {
    return new Response(
      JSON.stringify({ ok: false, error: 'Missing GAS_URL', env: Object.keys(process.env).filter(k=>k.includes('GAS')) }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }

  try {
    const res = await fetch(url, { cache: 'no-store' });
    const headers = Object.fromEntries(res.headers.entries());
    const bodyText = await res.text();

    let parsed = null;
    try {
      parsed = JSON.parse(bodyText);
    } catch {}

    return new Response(
      JSON.stringify({
        ok: res.ok,
        status: res.status,
        url,
        headers,
        bodyText,
        parsed,
      }, null, 2),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: String(e?.message || e), url }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}
