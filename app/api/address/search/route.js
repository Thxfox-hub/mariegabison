export const dynamic = 'force-dynamic';

// Simple address search proxy using OpenStreetMap Nominatim
// Query params: ?q=...&country=FR
export async function GET(req) {
  const q = req.nextUrl.searchParams.get('q') || '';
  const country = (req.nextUrl.searchParams.get('country') || '').toLowerCase();
  if (!q || q.trim().length < 3) {
    return new Response(JSON.stringify([]), { status: 200, headers: { 'content-type': 'application/json' } });
  }

  const params = new URLSearchParams({
    format: 'json',
    addressdetails: '1',
    limit: '5',
    q,
  });
  if (country) params.set('countrycodes', country);

  const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;

  try {
    const res = await fetch(url, {
      headers: {
        // Provide a UA per Nominatim policy; replace with your domain/email for production
        'User-Agent': 'MarieGabison/1.0 (contact@exemple.com)',
        'Accept': 'application/json',
      },
    });
    const list = await res.json();
    if (!Array.isArray(list)) {
      return new Response(JSON.stringify([]), { status: 200, headers: { 'content-type': 'application/json' } });
    }

    const out = list.map((it) => {
      const a = it.address || {};
      const streetParts = [a.house_number, a.road, a.neighbourhood, a.suburb].filter(Boolean);
      const street = streetParts.join(' ').trim();
      const city = a.city || a.town || a.village || a.hamlet || '';
      const postal_code = a.postcode || '';
      const country_code = (a.country_code || '').toUpperCase();
      return {
        label: it.display_name,
        street,
        city,
        postal_code,
        country: country_code,
        lat: it.lat,
        lon: it.lon,
      };
    });

    return new Response(JSON.stringify(out), { status: 200, headers: { 'content-type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 502, headers: { 'content-type': 'application/json' } });
  }
}
