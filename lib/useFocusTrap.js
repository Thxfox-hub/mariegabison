/**
 * useFocusTrap.js - Marie Gabison Bijoux
 * Traps keyboard focus within a container when active (Tab / Shift+Tab cycle).
 * Essential for modal/dialog accessibility.
 * Usage: const ref = useFocusTrap(isActive);
 */
import { useEffect, useRef } from 'react';

export default function useFocusTrap(active) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;
    const focusableSelector = [
      'a[href]', 'button:not([disabled])', 'input:not([disabled])',
      'select:not([disabled])', 'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return;

      const focusable = [...container.querySelectorAll(focusableSelector)];
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    // Auto-focus first focusable element
    const focusable = container.querySelectorAll(focusableSelector);
    if (focusable.length > 0) {
      requestAnimationFrame(() => focusable[0].focus());
    }

    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [active]);

  return containerRef;
}
