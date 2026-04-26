"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from '../lib/i18n/context';

export default function CheckoutModal({ open, onClose, items = [], total = 0, address = null, shippingOption = null }) {
  const { t, lang } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [addr, setAddr] = useState({ country: "FR", postal_code: "", city: "", street: "" });
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
                <input className="input" placeholder={t('checkout.name')} value={name} onChange={(e) => setName(e.target.value)} />
                <input className="input" type="email" placeholder={t('checkout.email')} value={email} onChange={(e) => setEmail(e.target.value)} />
                <input className="input" placeholder={t('checkout.phone')} value={phone} onChange={(e) => setPhone(e.target.value)} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
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
                  <input className="input" placeholder={t('checkout.postalCode')} value={addr.postal_code} onChange={(e) => setAddr(a => ({ ...a, postal_code: e.target.value }))} />
                </div>
                <input className="input" placeholder={t('checkout.city')} value={addr.city} onChange={(e) => setAddr(a => ({ ...a, city: e.target.value }))} />
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
