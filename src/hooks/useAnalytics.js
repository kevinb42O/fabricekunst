import { useEffect, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';

const generateSessionId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export function useAnalytics() {
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Only run in the browser
    if (typeof window === 'undefined') return;

    // Get or create session ID
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = generateSessionId();
      sessionStorage.setItem('analytics_session_id', sessionId);
    }

    const trackPageView = async () => {
      // Don't track admin pages to avoid skewing data
      if (window.location.pathname.startsWith('/admin')) return;
      
      // If Supabase isn't configured, skip tracking quietly
      if (!supabase) return;

      try {
        await supabase.from('page_views').insert([{
          page_url: window.location.pathname,
          referrer: document.referrer || null,
          user_agent: window.navigator.userAgent,
          session_id: sessionId
        }]);
      } catch (error) {
        console.error("Failed to log page view:", error);
      }
    };

    // Track on initial load
    if (isFirstRender.current) {
      isFirstRender.current = false;
      trackPageView();
    }

    // Intercept pushState and replaceState to track SPA navigation
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function() {
      originalPushState.apply(this, arguments);
      trackPageView();
    };

    window.history.replaceState = function() {
      originalReplaceState.apply(this, arguments);
      trackPageView();
    };

    const handlePopState = () => {
      trackPageView();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);
}
