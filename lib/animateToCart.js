/**
 * animateToCart.js
 * Premium flying image animation from product image to cart icon.
 * Uses a parabolic arc trajectory with smooth scaling, rotation, and fade.
 */
export function animateToCart(sourceImageElement) {
  if (!sourceImageElement || typeof document === 'undefined') return;

  const target = document.getElementById('cart-icon-target');
  if (!target) return;

  const srcRect = sourceImageElement.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();

  // Create a wrapper for the flying image
  const wrapper = document.createElement('div');
  wrapper.style.cssText = `
    position: fixed;
    top: ${srcRect.top}px;
    left: ${srcRect.left}px;
    width: ${srcRect.width}px;
    height: ${srcRect.height}px;
    z-index: 99999;
    pointer-events: none;
    will-change: transform, opacity;
  `;

  // Clone the image inside the wrapper
  const clone = sourceImageElement.cloneNode(true);
  clone.className = '';
  clone.style.cssText = `
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: ${window.getComputedStyle(sourceImageElement).borderRadius || '0px'};
    box-shadow: 0 12px 40px rgba(0,0,0,0.25);
    will-change: transform;
  `;

  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  // Force reflow
  wrapper.getBoundingClientRect();

  // Target center
  const startX = srcRect.left;
  const startY = srcRect.top;
  const startW = srcRect.width;
  const startH = srcRect.height;

  const endX = targetRect.left + targetRect.width / 2;
  const endY = targetRect.top + targetRect.height / 2;
  const endSize = 24;

  // Parabolic arc — control point above the midpoint
  const midX = (startX + endX) / 2;
  const arcHeight = Math.min(120, Math.abs(endX - startX) * 0.3);
  const midY = Math.min(startY, endY) - arcHeight;

  const duration = 750;
  const startTime = performance.now();

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  // Quadratic bezier interpolation
  function bezier(t, p0, p1, p2) {
    const u = 1 - t;
    return u * u * p0 + 2 * u * t * p1 + t * t * p2;
  }

  function animate(now) {
    const elapsed = now - startTime;
    const t = Math.min(1, elapsed / duration);
    const eased = easeInOutCubic(t);

    // Position along parabolic arc
    const x = bezier(eased, startX, midX, endX);
    const y = bezier(eased, startY, midY, endY);

    // Scale from full size to endSize
    const scale = 1 - eased * (1 - endSize / startW);
    const w = startW * scale;
    const h = startH * scale;

    // Slight rotation for dynamism
    const rotation = eased * 15;

    // Opacity: full until 70%, then fade out
    const opacity = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;

    // Border radius: from original to 50% (circle)
    const radius = eased * 50;

    wrapper.style.left = `${x - w / 2}px`;
    wrapper.style.top = `${y - h / 2}px`;
    wrapper.style.width = `${w}px`;
    wrapper.style.height = `${h}px`;
    wrapper.style.opacity = opacity;
    wrapper.style.transform = `rotate(${rotation}deg)`;
    clone.style.borderRadius = `${radius}%`;
    clone.style.boxShadow = `0 ${12 * scale}px ${40 * scale}px rgba(0,0,0,${0.25 * opacity})`;

    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      // Bump the cart icon
      target.classList.add('cart-bump');
      target.style.transform = 'scale(1.3)';
      target.style.transition = 'transform 0.15s ease-out';
      setTimeout(() => {
        target.style.transform = 'scale(1)';
        target.style.transition = 'transform 0.3s ease-in';
      }, 150);

      // Fade out wrapper
      wrapper.style.transition = 'opacity 0.15s ease-out';
      wrapper.style.opacity = '0';

      setTimeout(() => {
        wrapper.remove();
        target.classList.remove('cart-bump');
        target.style.transition = '';
        target.style.transform = '';
      }, 200);
    }
  }

  requestAnimationFrame(animate);
}
