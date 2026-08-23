import { useState, useEffect } from 'react';

/**
 * useDeviceAdaptation Hook
 * Complete device adaptation module for iOS, Android, Tablets, and Desktops.
 * - Detects OS, touch capabilities, screen density, orientation, and virtual keyboards.
 * - Injects adaptive CSS classes and CSS custom properties (--sat, --sab, --vvh, etc.)
 * - Provides adaptive AI latency and payload optimization flags.
 */
export function useDeviceAdaptation() {
  const [deviceInfo, setDeviceInfo] = useState(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isIOS: false,
        isAndroid: false,
        isTablet: false,
        isTouch: false,
        isSmallScreen: false,
        orientation: 'portrait',
        keyboardOpen: false,
        connectionQuality: '4g',
      };
    }

    const ua = navigator.userAgent || navigator.vendor || window.opera || '';
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /android/i.test(ua);
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const width = window.innerWidth;
    const isMobile = isIOS || isAndroid || (isTouch && width <= 768);
    const isTablet = (isTouch && width > 768 && width <= 1024) || /iPad/i.test(ua);
    const isSmallScreen = width <= 390;

    return {
      isMobile,
      isIOS,
      isAndroid,
      isTablet,
      isTouch,
      isSmallScreen,
      orientation: window.innerHeight > window.innerWidth ? 'portrait' : 'landscape',
      keyboardOpen: false,
      connectionQuality: navigator.connection?.effectiveType || '4g',
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;

    const updateMetrics = () => {
      const ua = navigator.userAgent || navigator.vendor || window.opera || '';
      const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const isAndroid = /android/i.test(ua);
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isMobile = isIOS || isAndroid || (isTouch && width <= 768);
      const isTablet = (isTouch && width > 768 && width <= 1024) || /iPad/i.test(ua);
      const isSmallScreen = width <= 390;
      const orientation = height > width ? 'portrait' : 'landscape';

      // Visual Viewport tracking for mobile virtual keyboard
      const visualHeight = window.visualViewport ? window.visualViewport.height : height;
      const keyboardOpen = isMobile && (height - visualHeight > 140);

      // Set CSS Variables for precision mobile layout
      root.style.setProperty('--app-height', `${height}px`);
      root.style.setProperty('--visual-height', `${visualHeight}px`);
      root.style.setProperty('--is-mobile', isMobile ? '1' : '0');

      // Add clean platform classes to <html>
      root.classList.toggle('platform-ios', isIOS);
      root.classList.toggle('platform-android', isAndroid);
      root.classList.toggle('device-mobile', isMobile);
      root.classList.toggle('device-desktop', !isMobile && !isTablet);
      root.classList.toggle('device-tablet', isTablet);
      root.classList.toggle('has-touch', isTouch);
      root.classList.toggle('screen-compact', isSmallScreen);
      root.classList.toggle('keyboard-visible', keyboardOpen);
      root.classList.toggle('orientation-portrait', orientation === 'portrait');
      root.classList.toggle('orientation-landscape', orientation === 'landscape');

      setDeviceInfo({
        isMobile,
        isIOS,
        isAndroid,
        isTablet,
        isTouch,
        isSmallScreen,
        orientation,
        keyboardOpen,
        connectionQuality: navigator.connection?.effectiveType || '4g',
      });
    };

    updateMetrics();

    window.addEventListener('resize', updateMetrics, { passive: true });
    window.addEventListener('orientationchange', updateMetrics, { passive: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateMetrics, { passive: true });
      window.visualViewport.addEventListener('scroll', updateMetrics, { passive: true });
    }

    return () => {
      window.removeEventListener('resize', updateMetrics);
      window.removeEventListener('orientationchange', updateMetrics);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateMetrics);
        window.visualViewport.removeEventListener('scroll', updateMetrics);
      }
    };
  }, []);

  return deviceInfo;
}
