/**
 * useThemeTransition
 * Creates a cinematic circular ripple reveal animation when toggling dark/light mode.
 * The circle expands from the clicked button's position, covering the entire viewport.
 */
import { useRef, useCallback } from 'react';

export function useThemeTransition() {
  const overlayRef = useRef(null);

  /**
   * triggerTransition(event, newIsDark, applyThemeFn)
   * @param {MouseEvent} event - The click event (used to get origin position)
   * @param {boolean} newIsDark - Whether the NEW mode is dark
   * @param {Function} applyThemeFn - Called at peak of animation to actually switch theme
   */
  const triggerTransition = useCallback((event, newIsDark, applyThemeFn) => {
    // Get origin position from button click
    const rect = event?.currentTarget?.getBoundingClientRect?.();
    const originX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const originY = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;

    // Compute max radius needed to cover entire viewport from origin
    const maxRadius = Math.ceil(
      Math.hypot(
        Math.max(originX, window.innerWidth - originX),
        Math.max(originY, window.innerHeight - originY)
      )
    );

    // Remove any previous overlay
    if (overlayRef.current) {
      overlayRef.current.remove();
      overlayRef.current = null;
    }

    // Create the overlay element
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 99999;
      pointer-events: none;
      background: ${newIsDark ? '#0f172a' : '#f8fafc'};
      clip-path: circle(0px at ${originX}px ${originY}px);
      will-change: clip-path;
      transition: clip-path 0.55s cubic-bezier(0.45, 0, 0.15, 1);
    `;
    document.body.appendChild(overlay);
    overlayRef.current = overlay;

    // Force reflow before animating
    overlay.getBoundingClientRect();

    // Expand the circle
    overlay.style.clipPath = `circle(${maxRadius}px at ${originX}px ${originY}px)`;

    // At ~60% through the animation, apply the real theme
    const applyDelay = 330;
    const applyTimer = setTimeout(() => {
      applyThemeFn();
    }, applyDelay);

    // After animation ends, remove the overlay
    const cleanupTimer = setTimeout(() => {
      if (overlayRef.current === overlay) {
        overlay.remove();
        overlayRef.current = null;
      }
    }, 700);

    // Also listen to transitionend as a safety net
    overlay.addEventListener('transitionend', () => {
      setTimeout(() => {
        if (overlayRef.current === overlay) {
          overlay.remove();
          overlayRef.current = null;
        }
      }, 80);
    }, { once: true });

    return () => {
      clearTimeout(applyTimer);
      clearTimeout(cleanupTimer);
    };
  }, []);

  return { triggerTransition };
}
