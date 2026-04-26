"use client";

import { useEffect, useMemo, useState } from "react";
// Header is rendered globally via AppShell
import { useCart } from "../../components/CartProvider";
import { useTranslation } from "../../lib/i18n/context";

export default function CartPage() {
  const { items, setQuantity, removeItem, clear, count, total, lastAddedAt, ready } = useCart();
  const { t, lang } = useTranslation();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Contact & address
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneCountry, setPhoneCountry] = useState("FR");
  const [phoneNational, setPhoneNational] = useState("");
  const [addr, setAddr] = useState({ country: "FR", postal_code: "", city: "", street: "" });

  // Address autocomplete with Geoapify API
  const [addrQuery, setAddrQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [suggesting, setSuggesting] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const GEOAPIFY_API_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_KEY || "";

  // International dialing codes for phone prefix
  const dialMap = { FR: '33', BE: '32', DE: '49', ES: '34', IT: '39', NL: '31', GB: '44', US: '1' };
  const fullPhone = useMemo(() => `+${dialMap[phoneCountry] || '33'} ${phoneNational.trim()}`.trim(), [phoneCountry, phoneNational]);

  // Shipping rates
  const [estimating, setEstimating] = useState(false);
  const [shipOptions, setShipOptions] = useState([]);
  const [selectedShipId, setSelectedShipId] = useState(null);
  const selectedShip = useMemo(() => shipOptions.find(o => o.id === selectedShipId) || null, [shipOptions, selectedShipId]);
  const [shipError, setShipError] = useState(null);

  // Payment
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState(null);

  // Load stored contact/address
  useEffect(() => {
    try {
      const c = localStorage.getItem("mariegabison_checkout_contact");
      if (c) {
        const v = JSON.parse(c);
        if (v?.name) setName(v.name);
        if (v?.email) setEmail(v.email);
        if (v?.phone) {
          const str = String(v.phone);
          if (str.startsWith('+')) {
            const sp = str.indexOf(' ');
            const prefix = (sp > 0 ? str.slice(1, sp) : str.slice(1)).trim();
            const found = Object.entries(dialMap).find(([, code]) => code === prefix);
            if (found) setPhoneCountry(found[0]);
            setPhoneNational(sp > 0 ? str.slice(sp + 1) : '');
          } else {
            setPhoneNational(str);
          }
        }
      }
      const a = localStorage.getItem("mariegabison_checkout_address");
      if (a) {
        const v = JSON.parse(a);
        setAddr({
          country: v?.country || "FR",
          postal_code: v?.postal_code || "",
          city: v?.city || "",
          street: v?.street || "",
        });
        setAddrQuery([v?.street, v?.postal_code, v?.city].filter(Boolean).join(", "))
      }
    } catch {}
  }, []);

  // Persist address as user edits
  useEffect(() => {
    try { localStorage.setItem("mariegabison_checkout_address", JSON.stringify(addr)); } catch {}
  }, [addr]);
  useEffect(() => {
    try { localStorage.setItem("mariegabison_checkout_contact", JSON.stringify({ name, email, phone: fullPhone })); } catch {}
  }, [name, email, phoneNational, phoneCountry, fullPhone]);

  const fmt = useMemo(() => new Intl.NumberFormat(lang === 'en' ? 'en-US' : lang === 'ru' ? 'ru-RU' : lang === 'it' ? 'it-IT' : 'fr-FR', { style: 'currency', currency: 'EUR' }), [lang]);
  const estimatedTotal = useMemo(() => total + (selectedShip?.price || 0), [total, selectedShip]);
  const canCheckout = Boolean(name.trim() && phoneNational.trim() && addr.country && addr.postal_code && addr.city && addr.street);

  // Compute parcels with fallbacks
  const computeParcels = () => {
    console.log("[Rates] computeParcels with items:", items);
    const missing = [];
    const parcels = items.map((it) => {
      let grams = null;
      if (it.weight_g != null) grams = Number(it.weight_g);
      else if (it.weight != null) grams = Number(it.weight);
      else if (it.weight_mg != null) grams = Number(it.weight_mg) / 1000;
      if (!Number.isFinite(grams) || grams <= 0) {
        const cat = String(it.category || '').toLowerCase();
        if (cat.includes('collier')) {
          grams = 250;
        } else if (cat.includes('bracelet')) {
          grams = 100;
        } else {
          missing.push(it.title || it.id || '(article)');
          grams = null;
        }
      }
      return { weight: grams, quantity: Number(it.quantity) || 1 };
    });
    if (missing.length) {
      console.error("[Rates] Missing weights for:", missing);
      throw new Error(`Poids manquant pour: ${missing.join(", ")}. Ajoutez weight_g (g) ou weight_mg (mg).`);
    }
    console.log("[Rates] parcels computed:", parcels);
    return parcels;
  };

  const fetchRates = async () => {
    console.log("[Rates] fetchRates called. addr=", addr, "addrQuery=", addrQuery);
    setEstimating(true);
    setShipError(null);
    setShipOptions([]);
    setSelectedShipId(null);
    try {
      // If user hasn't chosen a suggestion yet, try to resolve from addrQuery
      if ((!addr.country || !addr.postal_code || !addr.city || !addr.street) && addrQuery.trim().length >= 3) {
        try {
          const url = `/api/address/search?q=${encodeURIComponent(addrQuery)}&country=${encodeURIComponent((addr.country||'').toLowerCase())}`;
          const r = await fetch(url);
          if (r.ok) {
            const list = await r.json();
            if (Array.isArray(list) && list[0]) {
              const s = list[0];
              setAddr({
                country: s.country || 'FR',
                postal_code: s.postal_code || '',
                city: s.city || '',
                street: s.street || s.label || '',
              });
              setAddrQuery([s.street, s.postal_code, s.city].filter(Boolean).join(', '));
            }
          }
        } catch {}
      }
      const parcels = computeParcels();
      if (!addr.country || !addr.postal_code) throw new Error("Pays et code postal requis");
      const payload = { address: addr, parcels };
      console.log("[Rates] Request payload:", payload);
      const res = await fetch('/api/shop/shipping-rates', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ address: addr, parcels }),
      });
      const txt = await res.text();
      console.log("[Rates] Raw response status=", res.status, "body=", txt);
      let data = null;
      try { data = txt ? JSON.parse(txt) : null; } catch (e) { console.error("[Rates] JSON parse error:", e); }
      if (!res.ok) throw new Error(data?.error || txt || 'Erreur Sendcloud');
      const list = Array.isArray(data) ? data : [];
      console.log("[Rates] Parsed options:", list);
      setShipOptions(list);
      if (list[0]) setSelectedShipId(list[0].id);
    } catch (e) {
      console.error("[Rates] Error:", e);
      setShipError(e?.message || String(e));
    } finally {
      console.log("[Rates] fetchRates done. estimating=false");
      setEstimating(false);
    }
  };

  // Auto fetch shipping when address is filled
  useEffect(() => {
    if (!mounted) return;
    if (!items.length) return;
    if (!addr.country) return;
    const qlen = addrQuery.trim().length;
    const canByPostal = Boolean(addr.postal_code);
    const canByQuery = qlen >= 5;
    if (!canByPostal && !canByQuery) return;
    console.log("[Rates] Auto-trigger fetchRates. byPostal=", canByPostal, "byQuery=", canByQuery, "addr=", addr, "addrQuery=", addrQuery);
    const t = setTimeout(() => { fetchRates(); }, 3000); // 3s wait after address
    return () => clearTimeout(t);
  }, [mounted, items.length, addr.country, addr.postal_code, addr.city, addr.street, addrQuery]);

  // Address autocomplete with Geoapify API (like enhancedlook)
  useEffect(() => {
    const q = addrQuery.trim();
    if (!q || q.length < 3) { setSuggestions([]); return; }
    const ctrl = new AbortController();
    const id = setTimeout(async () => {
      try {
        setSuggesting(true);
        const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(q)}&apiKey=${GEOAPIFY_API_KEY}`;
        const res = await fetch(url, { signal: ctrl.signal });
        if (!res.ok) throw new Error('Search error');
        const data = await res.json();
        if (data.features) {
          const list = data.features.map((feature) => ({
            formatted: feature.properties.formatted,
            city: feature.properties.city,
            state: feature.properties.state,
            country: feature.properties.country,
            postcode: feature.properties.postcode,
            street: feature.properties.street,
          }));
          setSuggestions(list);
        } else {
          setSuggestions([]);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setSuggesting(false);
      }
    }, 300);
    return () => { clearTimeout(id); ctrl.abort(); };
  }, [addrQuery]);

  const applySuggestion = (s) => {
    setAddr({
      country: s.country || addr.country || 'FR',
      postal_code: s.postcode || '',
      city: s.city || '',
      street: s.street || s.formatted || '',
    });
    setAddrQuery(s.formatted || [s.street, s.postcode, s.city].filter(Boolean).join(', '));
    setSelectedAddress(s);
    setSuggestions([]);
  };

  const payNow = async () => {
    if (!canCheckout) return;
    setPaying(true);
    setPayError(null);
    try {
      const res = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          items,
          shippingOption: selectedShip,
          contact: { name, email, phone: fullPhone },
          address: addr,
        }),
      });
      const txt = await res.text();
      let json = null;
      try { json = txt ? JSON.parse(txt) : null; } catch {}
      if (!res.ok || !json?.url) throw new Error(json?.error || 'Paiement indisponible');
      try {
        localStorage.setItem("mariegabison_checkout_contact", JSON.stringify({ name, email, phone: fullPhone }));
        localStorage.setItem("mariegabison_checkout_address", JSON.stringify(addr));
      } catch {}
      window.location.href = json.url;
    } catch (e) {
      setPayError(e?.message || String(e));
    } finally {
      setPaying(false);
    }
  };

  if (!mounted) {
    return (
      <main className="container" style={{ paddingTop: 16 }}>
        <div className="status">{t('cart.loading')}</div>
      </main>
    );
  }

  return (
    <>
      {/* Header is provided by AppShell */}
      <main className="container" style={{ paddingTop: 16, paddingLeft: 24, paddingRight: 24 }}>
        <div className="grid" style={{ gridTemplateColumns: '1fr', gap: 24 }}>
          {/* Content layout */}
          <div className="grid" style={{ gridTemplateColumns: '1fr', gap: 24 }}>
            {/* Left: Cart items */}
            <section>
              <h2 className="title" style={{ fontSize: '1.25rem', marginBottom: 12 }}>{t('cart.title')}</h2>
              {(!mounted || !ready) ? (
                <div className="status">{t('cart.loading')}</div>
              ) : items.length === 0 ? (
                <div className="status">{t('cart.empty')}</div>
              ) : (
                <ul className="cart-list">
                  {items.map((it) => {
                    const id = it.id || it.title;
                    return (
                      <li key={id} className="cart-item">
                        <div className="cart-item-main" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {it.imageUrl && (
                            <img src={it.imageUrl} alt={it.title} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }} />
                          )}
                          <div style={{ flex: 1 }}>
                            <div className="cart-item-title">{it.title}</div>
                            <div className="cart-item-price">{fmt.format(Number(it.price) || 0)}</div>
                          </div>
                        </div>
                        <div className="cart-item-actions">
                          <label className="sr-only" htmlFor={`qty-${id}`}>Quantité</label>
                          <input id={`qty-${id}`} className="input qty-input" type="number" min={1} value={it.quantity || 1} onChange={(e) => setQuantity(id, Number(e.target.value) || 1)} />
                          <button className="btn" onClick={() => removeItem(id)}>{t('cart.remove')}</button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              {items.length > 0 && (
                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                  <button className="btn" onClick={clear}>{t('cart.clear')}</button>
                  <a className="btn" href="/">{t('checkout.continueShopping')}</a>
                </div>
              )}
            </section>

            {/* Right: Details */}
            <aside style={{ order: 0 }}>
              <div className="card" style={{ padding: 16 }}>
                <h3 className="title" style={{ fontSize: '1.1rem', marginTop: 0 }}>{t('checkout.contact')}</h3>
                <div style={{ display: 'grid', gap: 8 }}>
                  <input className="input" placeholder={t('checkout.name')} value={name} onChange={(e) => setName(e.target.value)} />
                  <input className="input" type="email" placeholder={t('checkout.email')} value={email} onChange={(e) => setEmail(e.target.value)} />
                  <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 8, alignItems: 'center' }}>
                    <select className="select" value={phoneCountry} onChange={(e) => setPhoneCountry(e.target.value)} style={{ width: 'auto' }} aria-label="Indicatif pays">
                      <option value="FR">🇫🇷 +33</option>
                      <option value="BE">🇧🇪 +32</option>
                      <option value="DE">🇩🇪 +49</option>
                      <option value="ES">🇪🇸 +34</option>
                      <option value="IT">🇮🇹 +39</option>
                      <option value="NL">🇳🇱 +31</option>
                      <option value="GB">🇬🇧 +44</option>
                      <option value="US">🇺🇸 +1</option>
                    </select>
                    <input className="input" placeholder={t('checkout.phone')} value={phoneNational} onChange={(e) => setPhoneNational(e.target.value)} style={{ width: 220 }} />
                  </div>
                </div>
                <h3 className="title" style={{ fontSize: '1.1rem', margin: '16px 0 8px' }}>{t('checkout.address')}</h3>
                <div style={{ position: 'relative' }}>
                  <input className="input address" placeholder={t('checkout.addressPlaceholder')} value={addrQuery} onChange={(e) => setAddrQuery(e.target.value)} />
                  {suggesting && (
                    <div className="status" style={{ position: 'absolute', zIndex: 10, width: '100%' }}>{t('checkout.searching')}</div>
                  )}
                  {suggestions.length > 0 && (
                    <div style={{ position: 'absolute', zIndex: 10, background: '#fff', border: '1px solid var(--border)', width: '100%', maxHeight: 220, overflow: 'auto', boxShadow: '0 10px 20px rgba(0,0,0,0.08)', borderRadius: 8, marginTop: 4 }}>
                      {suggestions.map((s, idx) => (
                        <div key={idx} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '0.875rem', borderBottom: idx < suggestions.length - 1 ? '1px solid #f0f0f0' : 'none', transition: 'background 0.15s' }} onClick={() => applySuggestion(s)} onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                          {s.formatted}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* Hidden structured fields maintained internally; single visible address field above */}

                {selectedAddress && (
                  <div style={{ borderRadius: 8, background: '#f5f5f5', padding: 12, marginTop: 8 }}>
                    <p style={{ fontSize: '0.875rem', color: '#666' }}>{t('checkout.address')}</p>
                    <p style={{ fontSize: '0.875rem' }}>{t('checkout.city')}: {selectedAddress.city}</p>
                    <p style={{ fontSize: '0.875rem' }}>{t('checkout.state')}: {selectedAddress.state}</p>
                    <p style={{ fontSize: '0.875rem' }}>{t('checkout.country')}: {selectedAddress.country}</p>
                    <p style={{ fontSize: '0.875rem' }}>{t('checkout.postalCode')}: {selectedAddress.postcode}</p>
                  </div>
                )}

                <h3 className="title" style={{ fontSize: '1.1rem', margin: '16px 0 8px' }}>{t('checkout.delivery')} {estimating && <span style={{ color: '#666', fontWeight: 400 }}>{t('checkout.calculating')}</span>}</h3>
                {selectedShip && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span>{t('checkout.estimatedTotal')}:</span>
                    <span className="price">{fmt.format(estimatedTotal)}</span>
                  </div>
                )}
                {shipError && <div className="status error" style={{ marginTop: 8 }}>{shipError}</div>}
                {shipOptions.length > 0 && (
                  <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
                    {shipOptions.map(opt => (
                      <label key={opt.id} className="cart-item" style={{ display: 'grid', gap: 6, cursor: 'pointer', borderRadius: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <input type="radio" name="ship" checked={selectedShipId === opt.id} onChange={() => setSelectedShipId(opt.id)} />
                            <div style={{ fontWeight: 600 }}>{opt.carrier} – {opt.service_name}</div>
                          </div>
                          <div className="price">{fmt.format(opt.price)}</div>
                        </div>
                        {opt.delivery_time && <div style={{ color: '#666' }}>{t('checkout.estimatedDelivery')}: {opt.delivery_time}</div>}
                      </label>
                    ))}
                  </div>
                )}

                <h3 className="title" style={{ fontSize: '1.1rem', margin: '16px 0 8px' }}>{t('checkout.summary')}</h3>
                <div className="cart-total">
                  <div>{t('checkout.subtotal')}</div>
                  <div className="price">{fmt.format(total)}</div>
                </div>
                <div className="cart-total">
                  <div>{t('checkout.shipping')}</div>
                  <div className="price">{selectedShip ? fmt.format(selectedShip.price) : '—'}</div>
                </div>
                <div className="cart-total" style={{ fontWeight: 600 }}>
                  <div>{t('cart.total')}</div>
                  <div className="price">{fmt.format(estimatedTotal)}</div>
                </div>

                <div className="modal-actions" style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                  <button className="btn primary" onClick={payNow} disabled={!canCheckout || paying || items.length === 0}>
                    {paying ? t('checkout.redirecting') : t('checkout.payNow')}
                  </button>
                </div>
                {!canCheckout && (
                  <p style={{ color: '#b20000', marginTop: 8 }}>{t('checkout.namePhoneAddrRequired')}</p>
                )}
                {payError && (
                  <p style={{ color: '#b20000', marginTop: 8 }}>{payError}</p>
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
