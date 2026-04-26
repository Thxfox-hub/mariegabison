/**
 * i18n context provider and useTranslation hook.
 * Lightweight client-side i18n: imports locale JSON directly, persists choice in localStorage.
 * Key dependencies: React context, locale JSON files.
 * Supported locales: fr, en, ru, it.
 * Usage: wrap app with <I18nProvider>, then use t() via useTranslation() in any component.
 */
"use client";

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import frMessages from '../i18n/locales/fr.json';
import enMessages from '../i18n/locales/en.json';
import ruMessages from '../i18n/locales/ru.json';
import itMessages from '../i18n/locales/it.json';

const SUPPORTED = ['fr', 'en', 'ru', 'it'];
const DEFAULT = 'fr';
const STORAGE_KEY = 'mariegabison_lang';

const LOCALES = {
  fr: frMessages,
  en: enMessages,
  ru: ruMessages,
  it: itMessages,
};

function getNestedValue(obj, path) {
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(DEFAULT);
  const [messages, setMessages] = useState(LOCALES[DEFAULT]);

  // Initialize from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && SUPPORTED.includes(stored)) {
        setLangState(stored);
        setMessages(LOCALES[stored]);
      }
    } catch {}
  }, []);

  // Sync <html lang> with current locale
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const setLang = useCallback((newLang) => {
    if (!SUPPORTED.includes(newLang)) return;
    setLangState(newLang);
    setMessages(LOCALES[newLang]);
    try { localStorage.setItem(STORAGE_KEY, newLang); } catch {}
  }, []);

  const t = useCallback((key, fallback) => {
    const val = getNestedValue(messages, key);
    if (val !== undefined) return val;
    return fallback ?? key;
  }, [messages]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t, supported: SUPPORTED }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useTranslation must be used within I18nProvider');
  return ctx;
}
