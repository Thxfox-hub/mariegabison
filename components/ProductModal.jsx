"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./CartProvider";

export default function ProductModal({ item, onClose, instagramUrl = "https://www.instagram.com/maisonmariegabison/" }) {
  // Neutral placeholder SVG
  const placeholder =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
  <rect width="100%" height="100%" fill="#f6f6f6"/>
  <rect x="60" y="60" width="480" height="680" fill="none" stroke="#eaeaea" stroke-width="2"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="ui-sans-serif,system-ui,Segoe UI,Roboto" font-size="22" fill="#999">Image</text>
</svg>`
    );

  if (!item) return null;

  const { title, description, imageUrl, price, category } = item;
  const { addItem } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const fmt = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
  const priceText = Number.isFinite(Number(price)) ? fmt.format(Number(price)) : '—';

  const handleAdd = () => {
    const n = Math.max(1, Number(qty) || 1);
    addItem(item, n);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };
  const handleBuyNow = () => {
    const n = Math.max(1, Number(qty) || 1);
    addItem(item, n);
    router.push('/cart');
  };

  return (
    <Dialog.Root open={!!item} onOpenChange={(open) => { if (!open) onClose?.(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[200]" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border border-[var(--border)] w-[92vw] max-w-[960px] max-h-[90vh] overflow-auto p-0 shadow-[0_10px_30px_rgba(0,0,0,0.15)] z-[201]"
          aria-label={title || 'Détail du produit'}
        >
          <div className="modal-header">
            <Dialog.Title className="modal-title">{title}</Dialog.Title>
            <Dialog.Close asChild>
              <button className="modal-close" aria-label="Fermer">Fermer</button>
            </Dialog.Close>
          </div>
          <div className="modal-body">
            <div className="modal-media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl || placeholder}
                alt={title || 'Image'}
                onError={(e) => { if (e.currentTarget.src !== placeholder) e.currentTarget.src = placeholder; }}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div className="modal-section">
              <p style={{ marginTop: 0, color: '#555' }}>{category}</p>
              {description && <p>{description}</p>}
              <p style={{ fontWeight: 600 }}>{priceText}</p>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '8px 0' }}>
                <label className="sr-only" htmlFor="qty">Quantité</label>
                <input id="qty" className="input" type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value) || 1)} style={{ width: 100 }} />
                {added && <span className="status" style={{ margin: 0 }}>Ajouté ✔</span>}
              </div>

              <div className="modal-actions">
                <button className="btn primary" onClick={handleAdd}>Ajouter au panier</button>
                <button className="btn" onClick={handleBuyNow}>Acheter maintenant</button>
                <a className="btn" href={instagramUrl} target="_blank" rel="noreferrer noopener">Contacter sur Instagram</a>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
