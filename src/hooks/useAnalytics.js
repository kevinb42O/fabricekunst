import { useEffect, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';

const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const trackEvent = async (eventName, eventData = {}) => {
  if (typeof window === 'undefined') return;
  if (window.location.pathname.startsWith('/admin')) return;
  if (!supabase) return;

  const visitorId = localStorage.getItem('analytics_visitor_id');
  if (!visitorId) return;

  try {
    await supabase.from('analytics_events').insert([{
      event_name: eventName,
      event_data: eventData,
      page_url: window.location.pathname,
      session_id: visitorId
    }]);
  } catch (error) {
    console.error("Failed to log analytics event:", error);
  }
};

export function useAnalytics() {
  const isFirstRender = useRef(true);
  const maxScrollRef = useRef(0);

  useEffect(() => {
    // Only run in the browser
    if (typeof window === 'undefined') return;

    // Use localStorage for a persistent visitor ID to accurately track unique visitors across tabs
    let visitorId = localStorage.getItem('analytics_visitor_id');
    if (!visitorId) {
      visitorId = generateId();
      localStorage.setItem('analytics_visitor_id', visitorId);
    }

    const guessCountry = () => {
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        // Comprehensive Timezone to Country Map
        const tzMap = {
          'Europe/Amsterdam': 'Netherlands',
          'Europe/Brussels': 'Belgium',
          'Europe/Paris': 'France',
          'Europe/Berlin': 'Germany',
          'Europe/Busingen': 'Germany',
          'Europe/London': 'United Kingdom',
          'Europe/Dublin': 'Ireland',
          'Europe/Madrid': 'Spain',
          'Europe/Rome': 'Italy',
          'Europe/Vienna': 'Austria',
          'Europe/Zurich': 'Switzerland',
          'Europe/Stockholm': 'Sweden',
          'Europe/Oslo': 'Norway',
          'Europe/Copenhagen': 'Denmark',
          'Europe/Helsinki': 'Finland',
          'Europe/Warsaw': 'Poland',
          'Europe/Prague': 'Czech Republic',
          'Europe/Budapest': 'Hungary',
          'Europe/Lisbon': 'Portugal',
          'Europe/Athens': 'Greece',
          'Europe/Istanbul': 'Turkey',
          'Europe/Moscow': 'Russia',
          'Europe/Kiev': 'Ukraine',
          'Europe/Bucharest': 'Romania',
          'Asia/Dubai': 'United Arab Emirates',
          'Asia/Tokyo': 'Japan',
          'Asia/Shanghai': 'China',
          'Asia/Seoul': 'South Korea',
          'Asia/Singapore': 'Singapore',
          'Asia/Hong_Kong': 'Hong Kong',
          'Asia/Kolkata': 'India',
          'Australia/Sydney': 'Australia',
          'Australia/Melbourne': 'Australia',
          'Australia/Brisbane': 'Australia',
          'Australia/Perth': 'Australia',
          'Pacific/Auckland': 'New Zealand',
          'America/Toronto': 'Canada',
          'America/Vancouver': 'Canada',
          'America/Montreal': 'Canada',
          'America/Mexico_City': 'Mexico',
          'America/Sao_Paulo': 'Brazil',
          'America/Buenos_Aires': 'Argentina',
          'Africa/Johannesburg': 'South Africa',
          'Africa/Cairo': 'Egypt'
        };

        if (tzMap[tz]) return tzMap[tz];
        if (tz.includes('America/')) return 'United States';
        
        // Fallback: use the city name
        return tz.split('/')[1]?.replace(/_/g, ' ') || tz;
      } catch (e) {
        return null;
      }
    };

    const trackPageView = async () => {
      // Reset scroll depth on new page view
      maxScrollRef.current = 0;

      // Don't track admin pages to avoid skewing data
      if (window.location.pathname.startsWith('/admin')) return;
      
      // If Supabase isn't configured, skip tracking quietly
      if (!supabase) return;

      try {
        await supabase.from('page_views').insert([{
          page_url: window.location.pathname,
          referrer: document.referrer || null,
          user_agent: window.navigator.userAgent,
          session_id: visitorId, // Use visitorId for unique visitor counting
          country: guessCountry()
        }]);
      } catch (error) {
        console.error("Failed to log page view:", error);
      }
    };

    // Track on initial load
    if (isFirstRender.current) {
      isFirstRender.current = false;
      trackPageView();

      // Check for UTM tags
      const params = new URLSearchParams(window.location.search);
      const utmSource = params.get('utm_source');
      const currentUtmString = window.location.search;
      
      if (utmSource && sessionStorage.getItem('last_utm') !== currentUtmString) {
        sessionStorage.setItem('last_utm', currentUtmString);
        trackEvent('utm_visit', {
          source: utmSource,
          medium: params.get('utm_medium') || 'unknown',
          campaign: params.get('utm_campaign') || 'unknown'
        });
      }
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

    // Scroll tracking
    const handleScroll = () => {
      if (window.location.pathname.startsWith('/admin')) return;
      
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) return;
      
      const scrollPercent = Math.round((window.scrollY / scrollHeight) * 100);
      
      const milestones = [25, 50, 75, 100];
      for (const milestone of milestones) {
        if (scrollPercent >= milestone && maxScrollRef.current < milestone) {
          maxScrollRef.current = milestone;
          trackEvent('scroll_depth', { depth: milestone });
        }
      }
    };

    let scrollTimeout;
    const throttledScroll = () => {
      if (scrollTimeout) return;
      scrollTimeout = setTimeout(() => {
        handleScroll();
        scrollTimeout = null;
      }, 500);
    };

    // Rage Clicks tracking
    let clickHistory = [];
    const handleGlobalClick = (e) => {
      if (window.location.pathname.startsWith('/admin')) return;
      
      const now = Date.now();
      clickHistory = clickHistory.filter(c => now - c.time < 1500); // 1.5s window
      clickHistory.push({ time: now, x: e.clientX, y: e.clientY });
      
      if (clickHistory.length >= 3) {
        // Calculate max distance between clicks
        const xs = clickHistory.map(c => c.x);
        const ys = clickHistory.map(c => c.y);
        const maxDistX = Math.max(...xs) - Math.min(...xs);
        const maxDistY = Math.max(...ys) - Math.min(...ys);
        
        if (maxDistX < 60 && maxDistY < 60) {
          let targetName = e.target.tagName;
          if (e.target.id) targetName += `#${e.target.id}`;
          else if (typeof e.target.className === 'string' && e.target.className) targetName += `.${e.target.className.split(' ')[0]}`;
          
          trackEvent('rage_click', { x: e.clientX, y: e.clientY, target: targetName });
          clickHistory = []; // Reset
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('scroll', throttledScroll, { passive: true });
    window.addEventListener('click', handleGlobalClick);

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('scroll', throttledScroll);
      window.removeEventListener('click', handleGlobalClick);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, []);
}
