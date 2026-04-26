"use client";

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [lastAddedAt, setLastAddedAt] = useState(0);
  const [ready, setReady] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("mariegabison_cart");
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  // Persist to localStorage only after initial load is done
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem("mariegabison_cart", JSON.stringify(items));
    } catch {}
  }, [items, ready]);

  const addItem = useCallback((item, qty = 1) => {
    setItems((prev) => {
      const id = item.id || item.title; // fallback
      const idx = prev.findIndex((it) => (it.id || it.title) === id);
      let next;
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: (copy[idx].quantity || 1) + qty };
        next = copy;
      } else {
        next = [...prev, { ...item, quantity: qty }];
      }
      try { localStorage.setItem("mariegabison_cart", JSON.stringify(next)); } catch {}
      return next;
    });
    setLastAddedAt(Date.now());
  }, []);

  const removeItem = useCallback((idOrTitle) => {
    setItems((prev) => {
      const next = prev.filter((it) => (it.id || it.title) !== idOrTitle);
      try { localStorage.setItem("mariegabison_cart", JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const setQuantity = useCallback((idOrTitle, qty) => {
    setItems((prev) => {
      const next = prev.map((it) => (it.id || it.title) === idOrTitle ? { ...it, quantity: Math.max(1, qty) } : it);
      try { localStorage.setItem("mariegabison_cart", JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setItems(() => {
      try { localStorage.setItem("mariegabison_cart", JSON.stringify([])); } catch {}
      return [];
    });
  }, []);

  const count = useMemo(() => items.reduce((n, it) => n + (it.quantity || 1), 0), [items]);
  const total = useMemo(() => items.reduce((sum, it) => sum + (Number(it.price) || 0) * (it.quantity || 1), 0), [items]);

  const value = useMemo(() => ({ items, addItem, removeItem, setQuantity, clear, count, total, lastAddedAt, ready }), [items, addItem, removeItem, setQuantity, clear, count, total, lastAddedAt, ready]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}

