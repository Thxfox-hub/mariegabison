/**
 * LoginModal.jsx - Supabase-powered auth modal (sign in / sign up / sign out)
 */
"use client";

import { useEffect, useState } from 'react';
import { useTranslation } from '../lib/i18n/context';
import { useUser } from './UserProvider';
import useFocusTrap from '../lib/useFocusTrap';

export default function LoginModal({ open, onClose }) {
  const { t } = useTranslation();
  const { user, loading, signIn, signUp, signOut } = useUser();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const trapRef = useFocusTrap(isVisible && isAnimating);

  useEffect(() => {
    if (open) {
      setIsVisible(true);
      setError(null);
      setInfo(null);
      requestAnimationFrame(() => setIsAnimating(true));
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!isVisible) return null;

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(onClose, 300);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (mode === 'signup' && password !== confirmPassword) {
      setError(t('login.passwordMismatch'));
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) throw error;
        handleClose();
      } else {
        const { data, error } = await signUp(email, password);
        if (error) throw error;
        if (data?.user && !data?.session) {
          setInfo(t('login.success'));
        } else {
          handleClose();
        }
      }
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    handleClose();
  };

  return (
    <div ref={trapRef} className={`modal-backdrop ${isAnimating ? 'active' : ''}`} onClick={handleClose} role="dialog" aria-modal="true" aria-label={t('login.title')}>
      <div className={`modal-panel ${isAnimating ? 'active' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{t('login.title')}</h2>
          <button className="modal-close" onClick={handleClose} aria-label={t('cart.close')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div className="modal-body">
          {loading ? (
            <p style={{ textAlign: 'center', color: '#888' }}>{t('login.loading')}</p>
          ) : user ? (
            <div>
              <p style={{ textAlign: 'center', marginBottom: 16 }}>
                {t('login.signedInAs')}: <strong>{user.email}</strong>
              </p>
              <button className="btn primary full-width" onClick={handleSignOut}>
                {t('login.signOut')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">{t('login.email')}</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('login.password')}</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  minLength={6}
                />
              </div>
              {mode === 'signup' && (
                <div className="form-group">
                  <label className="form-label">{t('login.confirmPassword')}</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    minLength={6}
                  />
                </div>
              )}
              {error && (
                <p style={{ color: '#b20000', fontSize: 14, marginBottom: 12 }}>
                  {t('login.error')}: {error}
                </p>
              )}
              {info && (
                <p style={{ color: '#16a34a', fontSize: 14, marginBottom: 12 }}>{info}</p>
              )}
              <button className="btn primary full-width" type="submit" disabled={submitting}>
                {submitting ? t('login.loading') : (mode === 'signin' ? t('login.signIn') : t('login.signUp'))}
              </button>
              <p className="modal-footer-text">
                {mode === 'signin' ? t('login.noAccount') : t('login.noAccount').replace('Pas', 'Déjà').replace('Don\'t', 'Already').replace('Non', 'Già')}
                {' '}
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); setInfo(null); }}
                >
                  {mode === 'signin' ? t('login.createAccount') : t('login.signIn')}
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
