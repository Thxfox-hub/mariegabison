"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useMemo, useState } from "react";
import { useCart } from "./CartProvider";
import { useTranslation } from '../lib/i18n/context';

export default function AppointmentModal({ open, onClose, instagramUrl = "https://www.instagram.com/maisonmariegabison/" }) {
  const { items, total, clear } = useCart();
  const { t, lang } = useTranslation();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const [sendState, setSendState] = useState("idle"); // idle | sending | sent | error
  const [sendError, setSendError] = useState(null);

  const fmt = useMemo(() => new Intl.NumberFormat(lang === 'en' ? 'en-US' : lang === 'ru' ? 'ru-RU' : lang === 'it' ? 'it-IT' : 'fr-FR', { style: 'currency', currency: 'EUR' }), [lang]);

  const message = useMemo(() => {
    const lines = [];
    lines.push(t('appointment.greeting'));
    if (items.length === 0) {
      lines.push(t('appointment.emptyCart'));
    } else {
      for (const it of items) {
        lines.push(`- ${it.title} × ${it.quantity || 1} (${fmt.format(Number(it.price) || 0)})`);
      }
      lines.push(`${t('appointment.estimatedTotal')}: ${fmt.format(total)}`);
    }
    if (name.trim()) lines.push(`${t('appointment.name')}: ${name.trim()}`);
    if (phone.trim()) lines.push(`${t('appointment.phone')}: ${phone.trim()}`);
    if (email.trim()) lines.push(`${t('appointment.email')}: ${email.trim()}`);
    lines.push(t('appointment.thanks'));
    return lines.join("\n");
  }, [items, total, name, phone, fmt, email, t]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const goToInstagram = () => {
    window.open(instagramUrl, "_blank", "noreferrer=noopener");
  };

  const sendViaBot = async () => {
    setSendState("sending");
    setSendError(null);
    try {
      const res = await fetch('/api/notify/instagram', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const txt = await res.text();
      let data = null;
      try { data = txt ? JSON.parse(txt) : null; } catch {}
      if (!res.ok) {
        throw new Error(data?.error || txt || 'Erreur d\'envoi');
      }
      setSendState("sent");
      // Optionally clear cart or keep
    } catch (e) {
      setSendState("error");
      setSendError(e?.message || String(e));
    }
  };

  return (
    <Dialog.Root open={!!open} onOpenChange={(o) => { if (!o) onClose?.(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border border-[var(--border)] w-[92vw] max-w-[680px] max-h-[85vh] overflow-auto p-0">
          <div className="modal-header">
            <Dialog.Title className="modal-title">{t('appointment.title')}</Dialog.Title>
            <Dialog.Close asChild>
              <button className="modal-close" aria-label={t('cart.close')}>{t('cart.close')}</button>
            </Dialog.Close>
          </div>
          <div className="modal-body">
            <div className="modal-section" style={{ gridColumn: '1 / -1' }}>
              <p style={{ marginTop: 0, color: '#555' }}>{t('appointment.intro')}</p>
              <div style={{ display: 'grid', gap: 8, margin: '12px 0' }}>
                <label>
                  <div className="sr-only">{t('appointment.name')}</div>
                  <input className="input" placeholder={t('appointment.name')} value={name} onChange={(e) => setName(e.target.value)} />
                </label>
                <label>
                  <div className="sr-only">{t('appointment.phone')}</div>
                  <input className="input" placeholder={t('appointment.phone')} value={phone} onChange={(e) => setPhone(e.target.value)} />
                </label>
                <label>
                  <div className="sr-only">{t('appointment.email')}</div>
                  <input className="input" type="email" placeholder={t('appointment.email')} value={email} onChange={(e) => setEmail(e.target.value)} />
                </label>
              </div>
              <textarea className="input" style={{ width: '100%', height: 160 }} readOnly value={message} />
              <div className="modal-actions">
                <button className="btn" onClick={copyToClipboard}>{copied ? t('appointment.copyMessage') + ' ✔' : t('appointment.copyMessage')}</button>
                <button className="btn" onClick={sendViaBot} disabled={sendState === 'sending'}>
                  {sendState === 'sending' ? t('checkout.sending') : (sendState === 'sent' ? t('appointment.thanks') : t('appointment.sendBot'))}
                </button>
                <button className="btn primary" onClick={goToInstagram}>{t('appointment.openInstagram')}</button>
              </div>
              {sendState === 'error' && (
                <p style={{ color: '#b20000', marginTop: 8 }}>{t('appointment.sendFailed')}: {sendError}</p>
              )}
              <p style={{ marginTop: 12, fontSize: '.9rem', color: '#666' }}>{t('appointment.afterSend')}</p>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
