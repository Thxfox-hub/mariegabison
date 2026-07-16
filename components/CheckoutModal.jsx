"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from '../lib/i18n/context';

/**
 * AddressAutocomplete — single address field with live suggestions.
 * Uses /api/address/search (Nominatim proxy) to fetch suggestions as you type.
 * On select, auto-fills street, city, postal_code, country.
 */
function AddressAutocomplete({ value, onSelect, country, placeholder }) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);
  const blurTimerRef = useRef(null);

  // Sync external value changes
  useEffect(() => {
    if (value !== query) setQuery(value || '');
  }, [value]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query || query.trim().length < 3) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: query.trim() });
        if (country) params.set('country', country);
        const res = await fetch(`/api/address/search?${params}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setSuggestions(data);
          setOpen(true);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, country]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSelect = (s) => {
    setQuery(s.label || `${s.street}, ${s.postal_code} ${s.city}, ${s.country}`);
    setOpen(false);
    setHighlightIdx(-1);
    onSelect({
      street: s.street || '',
      city: s.city || '',
      postal_code: s.postal_code || '',
      country: s.country || country || 'FR',
    });
  };

  const handleKeyDown = (e) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && highlightIdx >= 0) {
      e.preventDefault();
      handleSelect(suggestions[highlightIdx]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <input
        className="input"
        placeholder={placeholder}
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); setHighlightIdx(-1); }}
        onKeyDown={handleKeyDown}
        onFocus={() => { if (suggestions.length) setOpen(true); }}
        onBlur={() => { blurTimerRef.current = setTimeout(() => setOpen(false), 150); }}
        aria-expanded={open}
        role="combobox"
        aria-autocomplete="list"
      />
      {loading && (
        <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: '#999' }}>
          ⌛
        </div>
      )}
      {open && suggestions.length > 0 && (
        <ul
          role="listbox"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 100,
            background: '#fff',
            border: '1px solid #e5e0d8',
            borderTop: 'none',
            maxHeight: 200,
            overflowY: 'auto',
            margin: 0,
            padding: 0,
            listStyle: 'none',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          }}
        >
          {suggestions.map((s, i) => (
            <li
              key={i}
              role="option"
              aria-selected={i === highlightIdx}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(s); }}
              onMouseEnter={() => setHighlightIdx(i)}
              style={{
                padding: '10px 14px',
                cursor: 'pointer',
                fontSize: 13,
                lineHeight: 1.4,
                background: i === highlightIdx ? '#f4f1ea' : '#fff',
                borderBottom: i < suggestions.length - 1 ? '1px solid #f0ede8' : 'none',
                color: '#2a2520',
                fontFamily: 'Jost, sans-serif',
              }}
            >
              {s.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function CheckoutModal({ open, onClose, items = [], total = 0, address = null, shippingOption = null }) {
  const { t, lang } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [addr, setAddr] = useState({ country: "FR", postal_code: "", city: "", street: "" });
  const [addrQuery, setAddrQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [sendState, setSendState] = useState("idle"); // idle | sending | sent | error
  const [sendError, setSendError] = useState(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState(null);

  const fmt = useMemo(() => new Intl.NumberFormat(lang === 'en' ? 'en-US' : lang === 'ru' ? 'ru-RU' : lang === 'it' ? 'it-IT' : 'fr-FR', { style: 'currency', currency: 'EUR' }), [lang]);

  // Prefill from localStorage and provided address when opening
  useEffect(() => {
    if (!open) return;
    try {
      const c = localStorage.getItem("mariegabison_checkout_contact");
      if (c) {
        const v = JSON.parse(c);
        if (v?.name) setName(v.name);
        if (v?.email) setEmail(v.email);
        if (v?.phone) setPhone(v.phone);
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
        if (v?.street) {
          setAddrQuery(`${v.street}, ${v.postal_code || ''} ${v.city || ''}, ${v.country || 'FR'}`.trim());
        }
      } else if (address) {
        setAddr({
          country: address.country || "FR",
          postal_code: address.postal_code || "",
          city: address.city || "",
          street: address.street || "",
        });
      }
    } catch {}
  }, [open, address]);

  const summary = useMemo(() => {
    const lines = [];
    lines.push(t('checkout.title'));
    lines.push("");
    if (items.length) {
      lines.push(t('checkout.subtotal') + ":");
      for (const it of items) {
        const qty = Number(it.quantity) || 1;
        const price = Number(it.price) || 0;
        lines.push(`- ${it.title} × ${qty} (${fmt.format(price)})`);
      }
      lines.push("");
      lines.push(`Sous-total: ${fmt.format(items.reduce((s, it) => s + (Number(it.price)||0) * (Number(it.quantity)||1), 0))}`);
    }
    if (shippingOption) {
      lines.push(`${t('checkout.shipping')}: ${shippingOption.carrier} – ${shippingOption.service_name} (${fmt.format(Number(shippingOption.price)||0)})`);
      lines.push("");
      lines.push(`${t('checkout.estimatedTotal')}: ${fmt.format(total)}`);
    } else {
      lines.push(`${t('cart.total')}: ${fmt.format(total)}`);
    }
    lines.push("");
    lines.push(`${t('checkout.contact')}:`);
    if (name) lines.push(`${t('checkout.name')}: ${name}`);
    if (email) lines.push(`${t('checkout.email')}: ${email}`);
    if (phone) lines.push(`${t('checkout.phone')}: ${phone}`);
    lines.push(`${t('checkout.address')}: ${addr.street || ''}, ${addr.postal_code || ''} ${addr.city || ''}, ${addr.country || ''}`);
    return lines.join("\n");
  }, [items, fmt, shippingOption, total, name, email, phone, addr, t]);

  const canConfirm = name.trim() && phone.trim();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  const saveAndClose = () => {
    try {
      localStorage.setItem("mariegabison_checkout_contact", JSON.stringify({ name, email, phone }));
      localStorage.setItem("mariegabison_checkout_address", JSON.stringify(addr));
    } catch {}
    onClose?.();
  };

  const sendViaBot = async () => {
    if (!canConfirm) return;
    setSendState("sending");
    setSendError(null);
    try {
      const res = await fetch('/api/notify/instagram', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: summary }),
      });
      const txt = await res.text();
      let json = null;
      try { json = txt ? JSON.parse(txt) : null; } catch {}
      if (!res.ok) {
        throw new Error(json?.error || txt || 'Erreur d\'envoi');
      }
      setSendState("sent");
    } catch (e) {
      setSendState("error");
      setSendError(e?.message || String(e));
    }
  };

  const payNow = async () => {
    if (!canConfirm) return;
    setPaying(true);
    setPayError(null);
    try {
      const res = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          items,
          shippingOption,
          contact: { name, email, phone },
          address: addr,
        }),
      });
      const txt = await res.text();
      let json = null;
      try { json = txt ? JSON.parse(txt) : null; } catch {}
      if (!res.ok || !json?.url) {
        throw new Error(json?.error || 'Impossible de créer la session de paiement');
      }
      // Save contact+address for next time
      try {
        localStorage.setItem("mariegabison_checkout_contact", JSON.stringify({ name, email, phone }));
        localStorage.setItem("mariegabison_checkout_address", JSON.stringify(addr));
      } catch {}
      window.location.href = json.url;
    } catch (e) {
      setPayError(e?.message || String(e));
    } finally {
      setPaying(false);
    }
  };

  return (
    <Dialog.Root open={!!open} onOpenChange={(o) => { if (!o) onClose?.(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border border-[var(--border)] w-[92vw] max-w-[720px] max-h-[85vh] overflow-auto p-0">
          <div className="modal-header">
            <Dialog.Title className="modal-title">{t('checkout.title')}</Dialog.Title>
            <Dialog.Close asChild>
              <button className="modal-close" aria-label={t('cart.close')}>{t('cart.close')}</button>
            </Dialog.Close>
          </div>
          <div className="modal-body">
            <div className="modal-section" style={{ gridColumn: '1 / -1' }}>
              <p style={{ marginTop: 0, color: '#555' }}>{t('checkout.noAccountNeeded')}</p>
              <div style={{ display: 'grid', gap: 8, margin: '12px 0' }}>
                {/* Nom + prénom — champ unique */}
                <input className="input" placeholder={t('checkout.name')} value={name} onChange={(e) => setName(e.target.value)} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <input className="input" type="email" placeholder={t('checkout.email')} value={email} onChange={(e) => setEmail(e.target.value)} />
                  <input className="input" placeholder={t('checkout.phone')} value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>

                {/* Pays — sélecteur en haut, l'autocomplete filtre par pays */}
                <select className="select" value={addr.country} onChange={(e) => setAddr(a => ({ ...a, country: e.target.value }))}>
                  <option value="FR">{t('countries.FR')}</option>
                  <option value="BE">{t('countries.BE')}</option>
                  <option value="DE">{t('countries.DE')}</option>
                  <option value="ES">{t('countries.ES')}</option>
                  <option value="IT">{t('countries.IT')}</option>
                  <option value="NL">{t('countries.NL')}</option>
                  <option value="GB">{t('countries.GB')}</option>
                  <option value="US">{t('countries.US')}</option>
                </select>

                {/* Adresse avec autocomplete — suggestions en temps réel */}
                <AddressAutocomplete
                  value={addrQuery}
                  country={addr.country}
                  placeholder={t('checkout.addressPlaceholder')}
                  onSelect={(selected) => {
                    setAddr(selected);
                    setAddrQuery(`${selected.street}, ${selected.postal_code} ${selected.city}, ${selected.country}`.trim());
                  }}
                />

                {/* Champs pré-remplis par l'autocomplete, éditables */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8 }}>
                  <input className="input" placeholder={t('checkout.postalCode')} value={addr.postal_code} onChange={(e) => setAddr(a => ({ ...a, postal_code: e.target.value }))} />
                  <input className="input" placeholder={t('checkout.city')} value={addr.city} onChange={(e) => setAddr(a => ({ ...a, city: e.target.value }))} />
                </div>
                <input className="input" placeholder={t('checkout.address')} value={addr.street} onChange={(e) => setAddr(a => ({ ...a, street: e.target.value }))} />
              </div>

              {shippingOption && (
                <div className="status" style={{ background: '#fafafa' }}>
                  {t('checkout.selectedShipping')}: <strong>{shippingOption.carrier} – {shippingOption.service_name}</strong> ({fmt.format(Number(shippingOption.price)||0)})
                </div>
              )}

              <textarea className="input" style={{ width: '100%', height: 160, marginTop: 12 }} readOnly value={summary} />
              <div className="modal-actions">
                <button className="btn" onClick={copy}>{copied ? t('checkout.copied') : t('checkout.copySummary')}</button>
                <button className="btn primary" disabled={!canConfirm} onClick={saveAndClose}>{t('checkout.confirm')}</button>
                <button className="btn" disabled={!canConfirm || sendState === 'sending'} onClick={sendViaBot}>
                  {sendState === 'sending' ? t('checkout.sending') : (sendState === 'sent' ? t('checkout.sent') : t('checkout.sendBot'))}
                </button>
                <button className="btn" disabled={!canConfirm || paying} onClick={payNow}>
                  {paying ? t('checkout.redirecting') : t('checkout.payNow')}
                </button>
              </div>
              {sendState === 'error' && (
                <p style={{ color: '#b20000', marginTop: 8 }}>{t('appointment.sendFailed')}: {sendError}</p>
              )}
              {payError && (
                <p style={{ color: '#b20000', marginTop: 8 }}>{payError}</p>
              )}
              {!canConfirm && (<p style={{ color: '#b20000', marginTop: 8 }}>{t('checkout.namePhoneRequired')}</p>)}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
