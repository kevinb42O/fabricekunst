import { useSyncExternalStore } from 'react';

const MOBILE_QUERY = '(max-width: 63.999rem)';

function subscribe(callback) {
  if (typeof window === 'undefined') return () => {};
  const mediaQuery = window.matchMedia(MOBILE_QUERY);
  mediaQuery.addEventListener('change', callback);
  return () => mediaQuery.removeEventListener('change', callback);
}

function getSnapshot() {
  return typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches;
}

function getServerSnapshot() {
  return false;
}

export function useResponsiveMode() {
  const isMobile = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return {
    isMobile,
    mode: isMobile ? 'mobile' : 'desktop'
  };
}

export { MOBILE_QUERY };
