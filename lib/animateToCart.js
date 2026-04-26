/**
 * animateToCart.js
 * Creates a flying image animation from the product image to the cart icon.
 */
export function animateToCart(sourceImageElement) {
  if (!sourceImageElement || typeof document === 'undefined') return;

  const target = document.getElementById('cart-icon-target');
  if (!target) return;

  const srcRect = sourceImageElement.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();

  const clone = sourceImageElement.cloneNode(true);
  
  // Reset conflicting styles
  clone.className = '';
  clone.style.position = 'fixed';
  clone.style.top = `${srcRect.top}px`;
  clone.style.left = `${srcRect.left}px`;
  clone.style.width = `${srcRect.width}px`;
  clone.style.height = `${srcRect.height}px`;
  clone.style.objectFit = 'cover';
  clone.style.zIndex = '99999';
  clone.style.transition = 'all 0.8s cubic-bezier(0.25, 1, 0.5, 1)';
  clone.style.pointerEvents = 'none';
  clone.style.borderRadius = window.getComputedStyle(sourceImageElement).borderRadius;
  clone.style.boxShadow = '0 10px 30px rgba(0,0,0,0.15)';

  document.body.appendChild(clone);

  // Force reflow
  clone.getBoundingClientRect();

  // Target position (center of the cart icon)
  const targetX = targetRect.left + targetRect.width / 2;
  const targetY = targetRect.top + targetRect.height / 2;
  
  const endSize = 20;

  // Animate
  clone.style.top = `${targetY - endSize / 2}px`;
  clone.style.left = `${targetX - endSize / 2}px`;
  clone.style.width = `${endSize}px`;
  clone.style.height = `${endSize}px`;
  clone.style.opacity = '0.2';
  clone.style.borderRadius = '50%';
  clone.style.transform = 'scale(0.5)';

  // Add bump animation to the target
  setTimeout(() => {
    target.classList.add('cart-bump');
  }, 600);

  // Clean up
  setTimeout(() => {
    clone.remove();
    target.classList.remove('cart-bump');
  }, 800);
}
