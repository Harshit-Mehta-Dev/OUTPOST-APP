/**
 * useThemeTransition
 * Cinematic circular EXPAND animation on dark/light mode toggle.
 *
 * Strategy:
 *  1. Overlay of the NEW theme colour starts at 0px circle at the button origin.
 *  2. Overlay expands to cover the full viewport.
 *  3. Theme is applied WHILE the overlay is fully covering the screen (instant, invisible to user).
 *  4. Overlay then QUICKLY fades out (opacity 0) so the now-matching real UI is revealed.
 *
 * Net effect: a satisfying colour ripple sweeps from the button outward.
 * Content is never visibly "hidden" because the overlay colour matches the new theme exactly.
 */
import { useRef, useCallback } from 'react';

export function useThemeTransition() {
  const overlayRef = useRef(null);

  /**
   * triggerTransition(event, currentIsDark, applyThemeFn)
   * @param {MouseEvent} event        — click event, anchors the circle origin
   * @param {boolean}   currentIsDark — current (pre-toggle) dark mode state
   * @param {Function}  applyThemeFn  — flips the real theme
   */
  const triggerTransition = useCallback((event, currentIsDark, applyThemeFn) => {
    const rect = event?.currentTarget?.getBoundingClientRect?.();
    const originX = rect ? Math.round(rect.left + rect.width / 2) : Math.round(window.innerWidth / 2);
    const originY = rect ? Math.round(rect.top + rect.height / 2) : Math.round(window.innerHeight / 2);

    const maxRadius = Math.ceil(
      Math.hypot(
        Math.max(originX, window.innerWidth - originX),
        Math.max(originY, window.innerHeight - originY)
      )
    ) + 20;

    // Remove any leftover overlay
    if (overlayRef.current) {
      overlayRef.current.remove();
      overlayRef.current = null;
    }

    // New theme colour (what we're transitioning TO)
    const newBg = currentIsDark ? '#f1f5f9' : '#0f172a';

    // --- Phase 1: Expand circle from 0 → full screen ---
    const overlay = document.createElement('div');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 99999;
      pointer-events: none;
      background: ${newBg};
      clip-path: circle(0px at ${originX}px ${originY}px);
      will-change: clip-path, opacity;
      transition: clip-path 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      opacity: 1;
    `;
    document.body.appendChild(overlay);
    overlayRef.current = overlay;

    // Force reflow
    void overlay.getBoundingClientRect();

    // Start expanding
    overlay.style.clipPath = `circle(${maxRadius}px at ${originX}px ${originY}px)`;

    // When expand finishes: switch the real theme, then fade overlay away
    const onExpandDone = () => {
      // Apply real theme (UI now matches overlay colour — seamless)
      applyThemeFn();

      // Small tick to let React re-render with new theme
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Phase 2: Fade out overlay to reveal matching new-theme UI
          overlay.style.transition = 'opacity 0.18s ease';
          overlay.style.opacity = '0';

          const cleanup = () => {
            if (overlayRef.current === overlay) {
              overlay.remove();
              overlayRef.current = null;
            }
          };

          overlay.addEventListener('transitionend', cleanup, { once: true });
          setTimeout(cleanup, 300); // safety fallback
        });
      });
    };

    overlay.addEventListener('transitionend', onExpandDone, { once: true });
    // Safety: if transitionend never fires
    setTimeout(onExpandDone, 600);
  }, []);

  return { triggerTransition };
}
