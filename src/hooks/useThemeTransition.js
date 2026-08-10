/**
 * useThemeTransition
 * Cinematic circular "reveal" animation on dark/light mode toggle.
 *
 * Strategy (REVERSE WIPE):
 *  1. Apply the new theme IMMEDIATELY — so the real UI is already in the new mode.
 *  2. Slam an overlay of the OLD theme's background colour on top (covers everything — user still sees old look).
 *  3. Animate the overlay's clip-path from full-screen circle → 0px circle originating from the button.
 *  4. As the circle shrinks, the new-theme UI underneath is progressively revealed.
 *  5. Remove overlay when done.
 *
 * Result: user sees the new theme content appearing through a shrinking circle — content is always visible,
 * and the transition feel is smooth and cinematic.
 */
import { useRef, useCallback } from 'react';

export function useThemeTransition() {
  const overlayRef = useRef(null);

  /**
   * triggerTransition(event, currentIsDark, applyThemeFn)
   * @param {MouseEvent} event        — click event, used to anchor the ripple origin
   * @param {boolean}   currentIsDark — whether the CURRENT (pre-toggle) mode is dark
   * @param {Function}  applyThemeFn  — immediately switches the real theme
   */
  const triggerTransition = useCallback((event, currentIsDark, applyThemeFn) => {
    // --- 1. Origin from button click position ---
    const rect = event?.currentTarget?.getBoundingClientRect?.();
    const originX = rect ? Math.round(rect.left + rect.width / 2) : Math.round(window.innerWidth / 2);
    const originY = rect ? Math.round(rect.top + rect.height / 2) : Math.round(window.innerHeight / 2);

    // Max radius to fully cover viewport from origin
    const maxRadius = Math.ceil(
      Math.hypot(
        Math.max(originX, window.innerWidth - originX),
        Math.max(originY, window.innerHeight - originY)
      )
    ) + 20; // small buffer

    // --- 2. Apply the real theme NOW (UI flips underneath immediately) ---
    applyThemeFn();

    // --- 3. Remove any leftover overlay ---
    if (overlayRef.current) {
      overlayRef.current.remove();
      overlayRef.current = null;
    }

    // --- 4. Create overlay coloured like the OLD theme ---
    // OLD dark mode → overlay is dark navy; OLD light mode → overlay is off-white
    const oldBg = currentIsDark ? '#0f172a' : '#f1f5f9';

    const overlay = document.createElement('div');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 99999;
      pointer-events: none;
      background: ${oldBg};
      clip-path: circle(${maxRadius}px at ${originX}px ${originY}px);
      will-change: clip-path;
    `;
    document.body.appendChild(overlay);
    overlayRef.current = overlay;

    // --- 5. Force reflow so the browser registers the starting state ---
    void overlay.getBoundingClientRect();

    // --- 6. Animate: shrink the circle from full-screen → 0 (reveals new theme) ---
    overlay.style.transition = 'clip-path 0.55s cubic-bezier(0.4, 0, 0.2, 1)';
    overlay.style.clipPath = `circle(0px at ${originX}px ${originY}px)`;

    // --- 7. Cleanup after animation ---
    const cleanup = () => {
      if (overlayRef.current === overlay) {
        overlay.remove();
        overlayRef.current = null;
      }
    };

    overlay.addEventListener('transitionend', cleanup, { once: true });

    // Safety fallback in case transitionend doesn't fire
    const fallback = setTimeout(cleanup, 700);

    return () => clearTimeout(fallback);
  }, []);

  return { triggerTransition };
}
