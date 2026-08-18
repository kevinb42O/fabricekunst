import React, { useEffect, useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Lock, Eye, MousePointerClick, Globe, ArrowDown, Activity, X, Monitor, Smartphone, MapPin, Clock, Filter, Flame, Timer, Link, ArrowRight, MousePointer2 } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import UpgradeModal from './UpgradeModal';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 350, damping: 25 } }
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24, delay: 0.1 } }
};

const parseDevice = (userAgent) => {
  if (!userAgent) return 'Desktop';
  const ua = userAgent.toLowerCase();
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'Tablet';
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) return 'Mobiel';
  return 'Desktop';
};

const parseOS = (userAgent) => {
  if (!userAgent) return 'Windows';
  const ua = userAgent.toLowerCase();
  if (ua.includes('mac os x') && !ua.includes('iphone') && !ua.includes('ipad')) return 'Mac';
  if (ua.includes('windows')) return 'Windows';
  if (ua.includes('android')) return 'Android';
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) return 'iOS';
  if (ua.includes('linux')) return 'GNU/Linux';
  return 'Onbekend';
};

const parseReferrer = (referrer) => {
  if (!referrer) return 'Direct';
  try {
    const url = new URL(referrer);
    let hostname = url.hostname.replace('www.', '');
    if (referrer.includes('android-app://')) {
      if (referrer.includes('com.google.android.gm')) return 'com.google.android.gm';
      if (referrer.includes('com.google.android.googlequicksearchbox')) return 'com.google.android.googlequicksearchbox';
    }
    return hostname;
  } catch (e) {
    return 'Overig';
  }
};

const VercelList = ({ title, data, valueKey, labelKey, totalValue, asPercentage }) => (
  <motion.div variants={cardVariants} initial="hidden" animate="show" style={{ backgroundColor: '#ffffff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.04)', fontSize: '11px', color: '#888', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
      <span>{title}</span>
      <span>Bezoekers</span>
    </div>
    <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ padding: '12px', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {data.map((item, i) => {
        const percent = totalValue > 0 ? (item[valueKey] / totalValue) * 100 : 0;
        return (
          <motion.div variants={itemVariants} key={i} style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', padding: '10px 14px', fontSize: '13px', color: '#111', zIndex: 1, borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ 
              position: 'absolute', left: 0, top: 0, bottom: 0, width: `${percent}%`, 
              background: 'linear-gradient(90deg, rgba(17,17,17,0.03) 0%, rgba(17,17,17,0.06) 100%)', zIndex: -1,
              transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)'
            }}></div>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '75%', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 500 }}>
              {item.flag && <span style={{ fontSize: '15px' }}>{item.flag}</span>}
              {item[labelKey]}
            </span>
            <span style={{ fontWeight: 600 }}>{asPercentage ? `${Math.round(percent)}%` : item[valueKey]}</span>
          </motion.div>
        );
      })}
    </motion.div>
  </motion.div>
);

const BASE_URL = 'https://www.atelierrembrandt.com';

const PlatformLogo = ({ id }) => {
  const logos = {
    facebook: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="#1877F2"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.791-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>
    ),
    instagram: (
      <svg viewBox="0 0 24 24" width="22" height="22"><defs><radialGradient id="ig-grad" cx="30%" cy="107%" r="120%"><stop offset="0%" stopColor="#ffd879"/><stop offset="20%" stopColor="#f9a03c"/><stop offset="45%" stopColor="#e0473d"/><stop offset="70%" stopColor="#c52b98"/><stop offset="100%" stopColor="#4b3dab"/></radialGradient></defs><rect width="24" height="24" rx="5.5" fill="url(#ig-grad)"/><rect x="6.5" y="6.5" width="11" height="11" rx="3" stroke="#fff" strokeWidth="1.5" fill="none"/><circle cx="12" cy="12" r="2.8" stroke="#fff" strokeWidth="1.5" fill="none"/><circle cx="17" cy="7" r="0.9" fill="#fff"/></svg>
    ),
    stories: (
      <svg viewBox="0 0 24 24" width="22" height="22"><defs><radialGradient id="ig-grad2" cx="30%" cy="107%" r="120%"><stop offset="0%" stopColor="#ffd879"/><stop offset="20%" stopColor="#f9a03c"/><stop offset="45%" stopColor="#e0473d"/><stop offset="70%" stopColor="#c52b98"/><stop offset="100%" stopColor="#4b3dab"/></radialGradient></defs><rect width="24" height="24" rx="5.5" fill="url(#ig-grad2)"/><rect x="6.5" y="6.5" width="11" height="11" rx="3" stroke="#fff" strokeWidth="1.5" fill="none"/><circle cx="12" cy="12" r="2.8" stroke="#fff" strokeWidth="1.5" fill="none"/><circle cx="17" cy="7" r="0.9" fill="#fff"/><rect x="2" y="2" width="20" height="20" rx="6" stroke="#fff" strokeWidth="1" fill="none" strokeDasharray="2 2"/></svg>
    ),
    whatsapp: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
    ),
    email: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none"><rect width="24" height="24" rx="5" fill="#6366F1"/><path d="M4 8l8 5 8-5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/><rect x="4" y="7" width="16" height="11" rx="2" stroke="#fff" strokeWidth="1.5" fill="none"/></svg>
    ),
  };
  return logos[id] || null;
};

const UTM_PLATFORMS = [
  { id: 'facebook',   label: 'Facebook Post',          source: 'facebook',   medium: 'social',      campaign: 'organisch' },
  { id: 'instagram',  label: 'Instagram Post',          source: 'instagram',  medium: 'social',      campaign: 'organisch' },
  { id: 'stories',    label: 'Instagram Stories',       source: 'instagram',  medium: 'stories',     campaign: 'organisch' },
  { id: 'whatsapp',   label: 'WhatsApp / Directe link', source: 'whatsapp',   medium: 'chat',        campaign: 'organisch' },
  { id: 'email',      label: 'E-mail Nieuwsbrief',      source: 'email',      medium: 'newsletter',  campaign: 'nieuwsbrief' },
];

function UtmLinkBuilder() {
  const [copied, setCopied] = React.useState(null);
  const [customPage, setCustomPage] = React.useState('/');

  const pages = [
    { label: 'Homepagina', value: '/' },
    { label: 'Catalogus', value: '/catalogus' },
    { label: 'Contact', value: '/#contact' },
  ];

  const buildUrl = (platform) => {
    const params = new URLSearchParams({
      utm_source: platform.source,
      utm_medium: platform.medium,
      utm_campaign: platform.campaign,
    });
    return `${BASE_URL}${customPage}?${params.toString()}`;
  };

  const handleCopy = (platform) => {
    navigator.clipboard.writeText(buildUrl(platform));
    setCopied(platform.id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <motion.div variants={cardVariants} initial="hidden" animate="show" style={{ backgroundColor: '#ffffff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '12px', padding: '28px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#888', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Link size={14} color="#111" /> UTM Tracking Links — voor Posts &amp; Campagnes
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#555', lineHeight: 1.6, maxWidth: '560px' }}>
            Plak één van deze links in je social media post in plaats van de gewone website-URL. Zo zie je in het dashboard <strong style={{ color: '#111' }}>exact hoeveel bezoekers</strong> via welk kanaal komen.
          </p>
        </div>
        {/* Page selector */}
        <select
          value={customPage}
          onChange={e => setCustomPage(e.target.value)}
          style={{ fontSize: '13px', padding: '8px 12px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px', backgroundColor: '#fafafa', color: '#111', cursor: 'pointer', outline: 'none' }}
        >
          {pages.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>

      {/* Platform rows */}
      <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {UTM_PLATFORMS.map(platform => {
          const url = buildUrl(platform);
          const isCopied = copied === platform.id;
          return (
            <motion.div variants={itemVariants} key={platform.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', backgroundColor: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '10px' }}>
              <div style={{ flexShrink: 0, width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5', borderRadius: '8px' }}><PlatformLogo id={platform.id} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#111', marginBottom: '2px' }}>{platform.label}</div>
                <code style={{ fontSize: '11px', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: '100%' }}>{url}</code>
              </div>
              <button
                onClick={() => handleCopy(platform)}
                style={{
                  flexShrink: 0,
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 14px',
                  backgroundColor: isCopied ? '#10B981' : '#111',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  whiteSpace: 'nowrap'
                }}
              >
                {isCopied ? '✓ Gekopieerd!' : 'Kopieer Link'}
              </button>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Tip */}
      <div style={{ marginTop: '16px', padding: '12px 16px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', fontSize: '12px', color: '#92400e' }}>
        💡 <strong>Tip:</strong> Gebruik altijd deze links ipv je gewone URL als je iets post op social media of verstuurt via e-mail. Na een week zie je hier de resultaten per kanaal verschijnen.
      </div>
    </motion.div>
  );
}

export default function AnalyticsManager({ isPro = false, activeTab = 'overview' }) {
  const [loading, setLoading] = useState(true);
  const [pageViews, setPageViews] = useState([]);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [showAllTimeRanges, setShowAllTimeRanges] = useState(false);
  const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!supabase) {
        setError('Supabase is niet verbonden.');
        setLoading(false);
        return;
      }
      try {
        const { data: pageData, error: pageError } = await supabase
          .from('page_views')
          .select('*')
          .order('created_at', { ascending: true });

        if (pageError) throw pageError;
        setPageViews(pageData || []);

        // Fetch events if the table exists
        try {
          const { data: eventData } = await supabase
            .from('analytics_events')
            .select('*')
            .order('created_at', { ascending: true });
          if (eventData) setEvents(eventData);
        } catch (e) {
          // Table might not exist yet, ignore
          console.log("Analytics events table not yet available");
        }
      } catch (err) {
        console.error("Fout bij ophalen analytics:", err);
        setError('Fout bij het ophalen van analytics data.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();

    // Set up Real-time subscription for live visitor updates
    let channel;
    let eventChannel;
    if (supabase) {
      channel = supabase
        .channel('public:page_views')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'page_views' },
          (payload) => {
            setPageViews((prev) => [...prev, payload.new]);
          }
        )
        .subscribe();
        
      eventChannel = supabase
        .channel('public:analytics_events')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'analytics_events' },
          (payload) => {
            setEvents((prev) => [...prev, payload.new]);
          }
        )
        .subscribe();
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
      if (eventChannel) supabase.removeChannel(eventChannel);
    };
  }, []);

  const cutoffDate = useMemo(() => {
    const now = new Date();
    let cutoff = new Date();
    if (timeRange === '24u') {
      cutoff.setHours(now.getHours() - 24);
      cutoff.setMinutes(0, 0, 0);
    } else if (timeRange === '7d') {
      cutoff.setDate(now.getDate() - 7);
      cutoff.setHours(0, 0, 0, 0);
    } else if (timeRange === '30d') {
      if (now.getDate() >= 8) {
        cutoff.setDate(8);
      } else {
        cutoff.setMonth(cutoff.getMonth() - 1);
        cutoff.setDate(8);
      }
      cutoff.setHours(0, 0, 0, 0);
    } else if (timeRange === '3m') {
      cutoff.setMonth(now.getMonth() - 3);
      cutoff.setHours(0, 0, 0, 0);
    } else if (timeRange === '12m') {
      cutoff.setFullYear(now.getFullYear() - 1);
      cutoff.setHours(0, 0, 0, 0);
    } else if (timeRange === 'YTD') {
      cutoff = new Date(now.getFullYear(), 0, 1);
    } else if (timeRange === 'All') {
      cutoff = new Date(0);
    }
    return cutoff;
  }, [timeRange]);

  const filteredViews = useMemo(() => {
    return pageViews.filter(v => new Date(v.created_at) >= cutoffDate);
  }, [pageViews, cutoffDate]);

  const metrics = useMemo(() => {
    const sessionCounts = {};
    filteredViews.forEach(view => {
      sessionCounts[view.session_id] = (sessionCounts[view.session_id] || 0) + 1;
    });

    const uniqueSessions = Object.keys(sessionCounts).length;
    const pagesPerSession = uniqueSessions > 0 ? (filteredViews.length / uniqueSessions).toFixed(1) : 0;

    return {
      visitors: uniqueSessions,
      pageViews: filteredViews.length,
      pagesPerSession
    };
  }, [filteredViews]);

  const chartData = useMemo(() => {
    const dailyData = {};
    const now = new Date();
    
    // 1. Pre-fill the dictionary with all expected intervals so we get 0-drops
    if (timeRange === '24u') {
      let d = new Date(cutoffDate.getTime());
      while (d <= now) {
        const dateKey = d.toLocaleTimeString('nl-NL', { hour: 'numeric' }) + 'u';
        dailyData[dateKey] = { date: dateKey, visitors: new Set(), sortKey: d.getTime() };
        d.setHours(d.getHours() + 1);
      }
    } else if (timeRange === '12m' || timeRange === 'All' || timeRange === 'YTD') {
      let d = new Date(cutoffDate.getTime());
      if (timeRange === 'All' && filteredViews.length > 0) {
        d = new Date(filteredViews[0].created_at);
        d.setDate(1); d.setHours(0,0,0,0);
      }
      while (d <= now) {
        const dateKey = d.toLocaleDateString('nl-NL', { month: 'short', year: 'numeric' });
        dailyData[dateKey] = { date: dateKey, visitors: new Set(), sortKey: d.getTime() };
        d.setMonth(d.getMonth() + 1);
      }
    } else {
      let d = new Date(cutoffDate.getTime());
      while (d <= now) {
        const dateKey = d.toLocaleDateString('nl-NL', { month: 'short', day: 'numeric' });
        dailyData[dateKey] = { date: dateKey, visitors: new Set(), sortKey: d.getTime() };
        d.setDate(d.getDate() + 1);
      }
    }

    // 2. Populate with actual data
    filteredViews.forEach(view => {
      const dateObj = new Date(view.created_at);
      let dateKey;
      let sortKey;
      
      if (timeRange === '24u') {
        dateKey = dateObj.toLocaleTimeString('nl-NL', { hour: 'numeric' }) + 'u';
        const hourDate = new Date(dateObj);
        hourDate.setMinutes(0, 0, 0);
        sortKey = hourDate.getTime();
      } else if (timeRange === '12m' || timeRange === 'All' || timeRange === 'YTD') {
        dateKey = dateObj.toLocaleDateString('nl-NL', { month: 'short', year: 'numeric' });
        const monthDate = new Date(dateObj);
        monthDate.setDate(1); monthDate.setHours(0,0,0,0);
        sortKey = monthDate.getTime();
      } else {
        dateKey = dateObj.toLocaleDateString('nl-NL', { month: 'short', day: 'numeric' });
        const dayDate = new Date(dateObj);
        dayDate.setHours(0, 0, 0, 0);
        sortKey = dayDate.getTime();
      }
      
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = { date: dateKey, visitors: new Set(), sortKey };
      }
      dailyData[dateKey].visitors.add(view.session_id);
    });

    // 3. Sort chronologically
    const sorted = Object.values(dailyData).sort((a, b) => a.sortKey - b.sortKey);
    return sorted.map(d => ({
      date: d.date,
      Bezoekers: d.visitors.size
    }));
  }, [filteredViews, timeRange]);

  const uniqueSessionsMap = useMemo(() => {
    const map = new Map();
    filteredViews.forEach(view => {
      if (!map.has(view.session_id)) {
        map.set(view.session_id, view);
      }
    });
    return Array.from(map.values());
  }, [filteredViews]);

  const pagesData = useMemo(() => {
    const pages = {};
    filteredViews.forEach(view => {
      const path = view.page_url;
      if (!pages[path]) pages[path] = { path, visitors: new Set(), totalViews: 0 };
      pages[path].visitors.add(view.session_id);
      pages[path].totalViews += 1;
    });
    return Object.values(pages)
      .map(p => ({ path: p.path, visitors: p.visitors.size, totalViews: p.totalViews }))
      .sort((a, b) => b.visitors - a.visitors).slice(0, 7);
  }, [filteredViews]);

  const referrersData = useMemo(() => {
    const refs = {};
    uniqueSessionsMap.forEach(view => {
      const ref = parseReferrer(view.referrer);
      if (!refs[ref]) refs[ref] = { source: ref, visitors: 0 };
      refs[ref].visitors += 1;
    });
    return Object.values(refs).sort((a, b) => b.visitors - a.visitors).slice(0, 6);
  }, [uniqueSessionsMap]);

  const devicesData = useMemo(() => {
    const devs = {};
    uniqueSessionsMap.forEach(view => {
      const dev = parseDevice(view.user_agent);
      if (!devs[dev]) devs[dev] = { device: dev, visitors: 0 };
      devs[dev].visitors += 1;
    });
    return Object.values(devs).sort((a, b) => b.visitors - a.visitors);
  }, [uniqueSessionsMap]);

  const osData = useMemo(() => {
    const oses = {};
    uniqueSessionsMap.forEach(view => {
      const os = parseOS(view.user_agent);
      if (!oses[os]) oses[os] = { os: os, visitors: 0 };
      oses[os].visitors += 1;
    });
    return Object.values(oses).sort((a, b) => b.visitors - a.visitors);
  }, [uniqueSessionsMap]);

  const countriesData = useMemo(() => {
    const countries = {};
    const flags = { 'Belgium': '🇧🇪', 'United States of America': '🇺🇸', 'France': '🇫🇷', 'Netherlands': '🇳🇱', 'Canada': '🇨🇦' };
    uniqueSessionsMap.forEach(view => {
      const country = view.country || 'Unknown';
      if (!countries[country]) countries[country] = { country, visitors: 0, flag: flags[country] || '🌍' };
      countries[country].visitors += 1;
    });
    return Object.values(countries).sort((a, b) => b.visitors - a.visitors).slice(0, 5);
  }, [uniqueSessionsMap]);

  // --- NEW FEATURES COMPUTATIONS ---

  const activeNow = useMemo(() => {
    const fiveMinsAgo = new Date(Date.now() - 5 * 60000);
    const activeSessions = new Set();
    pageViews.forEach(v => {
      if (new Date(v.created_at) > fiveMinsAgo) activeSessions.add(v.session_id);
    });
    events.forEach(e => {
      if (new Date(e.created_at) > fiveMinsAgo) activeSessions.add(e.session_id);
    });
    return activeSessions.size;
  }, [pageViews, events]);

  const liveActivity = useMemo(() => {
    const combined = [
      ...pageViews.map(v => ({ type: 'view', ...v })),
      ...events.map(e => {
        let parsedData = e.event_data;
        if (typeof parsedData === 'string') {
          try { parsedData = JSON.parse(parsedData); } catch(err) {}
        }
        return { type: 'event', ...e, event_data: parsedData };
      })
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 50);
    return combined;
  }, [pageViews, events]);

  const filteredEvents = useMemo(() => {
    return events.filter(e => new Date(e.created_at) >= cutoffDate).map(e => {
      let parsedData = e.event_data;
      if (typeof parsedData === 'string') {
        try { parsedData = JSON.parse(parsedData); } catch(err) {}
      }
      return { ...e, event_data: parsedData };
    });
  }, [events, cutoffDate]);

  const conversionData = useMemo(() => {
    const totalVisitors = metrics.visitors || 1;
    let ctaClicks = 0;
    
    filteredEvents.forEach(e => {
      if (e.event_name === 'cta_click') ctaClicks++;
    });

    const ctaRate = (ctaClicks / totalVisitors) * 100;

    return {
      clicks: ctaClicks,
      rate: ctaRate.toFixed(1)
    };
  }, [filteredEvents, metrics.visitors]);

  const scrollDepthData = useMemo(() => {
    const depths = { 25: 0, 50: 0, 75: 0, 100: 0 };
    filteredEvents.forEach(e => {
      if (e.event_name === 'scroll_depth' && e.event_data?.depth) {
        depths[e.event_data.depth]++;
      }
    });
    return [
      { name: '25%', value: depths[25] },
      { name: '50%', value: depths[50] },
      { name: '75%', value: depths[75] },
      { name: '100%', value: depths[100] }
    ];
  }, [filteredEvents]);

  const selectedSessionTimeline = useMemo(() => {
    if (!selectedSessionId) return null;
    const sViews = pageViews.filter(v => v.session_id === selectedSessionId).map(v => ({ type: 'view', ...v }));
    const sEvents = events.filter(e => e.session_id === selectedSessionId).map(e => ({ type: 'event', ...e }));
    return [...sViews, ...sEvents].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }, [selectedSessionId, pageViews, events]);

  const selectedSessionInfo = useMemo(() => {
    if (!selectedSessionTimeline || selectedSessionTimeline.length === 0) return null;
    
    // Fallback to searching the timeline since 'analytics_events' don't store user_agent/country/referrer
    const firstEvent = selectedSessionTimeline[0];
    const countryData = selectedSessionTimeline.find(e => e.country)?.country;
    const userAgentData = selectedSessionTimeline.find(e => e.user_agent)?.user_agent;
    const referrerData = selectedSessionTimeline.find(e => e.referrer)?.referrer;

    return {
      os: parseOS(userAgentData || ''),
      device: parseDevice(userAgentData || ''),
      referrer: parseReferrer(referrerData || ''),
      country: countryData || 'Onbekend (geen IP tracking)',
      startTime: firstEvent.created_at,
      totalInteractions: selectedSessionTimeline.length
    };
  }, [selectedSessionTimeline]);

  const advancedAnalytics = useMemo(() => {
    // 1. Average Session Duration
    let totalDurationMs = 0;
    let validSessions = 0;
    
    // Group all by session
    const sessions = {};
    [...filteredViews, ...filteredEvents].forEach(item => {
      if (!sessions[item.session_id]) sessions[item.session_id] = { start: item.created_at, end: item.created_at, hasCatalog: false, hasDetail: false, hasContact: false };
      
      const t = new Date(item.created_at).getTime();
      const s = sessions[item.session_id];
      if (t < new Date(s.start).getTime()) s.start = item.created_at;
      if (t > new Date(s.end).getTime()) s.end = item.created_at;
      
      if (item.page_url && (item.page_url.includes('/catalogus') || item.page_url.includes('/topstukken'))) s.hasCatalog = true;
      if (item.page_url && item.page_url.includes('/collectie/')) s.hasDetail = true;
      if (item.event_name === 'scroll_depth' && item.event_data?.depth >= 75) s.hasDetail = true;
      if (item.event_name === 'cta_click') s.hasContact = true;
    });

    Object.values(sessions).forEach(s => {
      const dur = new Date(s.end).getTime() - new Date(s.start).getTime();
      if (dur > 0 && dur < 3600000) { // Max 1 uur meerekenen voor gemiddelde
        totalDurationMs += dur;
        validSessions++;
      }
    });

    const avgSeconds = validSessions > 0 ? Math.round(totalDurationMs / validSessions / 1000) : 0;
    const avgMinutes = Math.floor(avgSeconds / 60);
    const avgRemSeconds = avgSeconds % 60;
    const avgDurationStr = avgMinutes > 0 ? `${avgMinutes}m ${avgRemSeconds}s` : `${avgRemSeconds}s`;

    // 2. User Journey Funnel
    let step1 = 0, step2 = 0, step3 = 0, step4 = 0;
    Object.values(sessions).forEach(s => {
      step1++;
      if (s.hasCatalog || s.hasDetail || s.hasContact) step2++;
      if (s.hasDetail || s.hasContact) step3++;
      if (s.hasContact) step4++;
    });

    // 3. UTM Campaigns
    const campaignsMap = {};
    filteredEvents.forEach(e => {
      if (e.event_name === 'utm_visit') {
        const cId = `${e.event_data.source}-${e.event_data.campaign}`;
        if (!campaignsMap[cId]) campaignsMap[cId] = { source: e.event_data.source, campaign: e.event_data.campaign, medium: e.event_data.medium, sessions: new Set(), conversions: 0 };
        campaignsMap[cId].sessions.add(e.session_id);
      }
    });
    
    Object.values(campaignsMap).forEach(camp => {
      camp.sessions.forEach(sid => {
        if (sessions[sid]?.hasContact) camp.conversions++;
      });
      camp.visitors = camp.sessions.size;
    });

    const campaigns = Object.values(campaignsMap).sort((a, b) => b.visitors - a.visitors);

    return {
      avgDurationStr,
      funnel: [
        { name: 'Bezocht website', count: step1 },
        { name: 'Keek in catalogus', count: step2 },
        { name: 'Toonde diepe interesse', count: step3 },
        { name: 'Nam contact op', count: step4 }
      ],
      campaigns
    };
  }, [filteredViews, filteredEvents]);

  if (loading) return <div style={{ color: '#111', padding: '2rem' }}>Laden...</div>;

  return (
    <div style={{ backgroundColor: '#fafafa', minHeight: '100vh', padding: '2rem', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      
      {/* Top Header & Time Range Selector (Always Visible) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#111', letterSpacing: '-0.02em' }}>Analytics Command Center</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#666' }}>Inzichten, conversies en bezoekersgedrag.</p>
        </div>
        
        {/* Time Range Selector */}
        <div style={{ display: 'flex', backgroundColor: '#eaeaea', border: '1px solid #eaeaea', borderRadius: '6px', padding: '4px', overflowX: 'auto', transition: 'all 0.3s ease' }}>
          {[
            { id: '24u', label: '24u' },
            { id: '7d', label: '7d' },
            { id: '30d', label: '30d' },
            { id: '3m', label: '3M', isProFeature: true },
            { id: '12m', label: '1 Jaar', isProFeature: true },
            { id: 'YTD', label: 'Dit Jaar', isProFeature: true },
            { id: 'All', label: 'Alles', isProFeature: true }
          ].filter((_, idx) => showAllTimeRanges || idx < 3).map((range, idx) => (
            <button
              key={range.id}
              onClick={() => {
                if (range.isProFeature && !isPro) {
                  setUpgradeModalOpen(true);
                } else {
                  setTimeRange(range.id);
                }
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                background: timeRange === range.id ? '#fff' : 'transparent',
                color: timeRange === range.id ? '#111' : (range.isProFeature && !isPro ? '#999' : '#666'),
                border: 'none', padding: '6px 12px', borderRadius: '4px',
                fontSize: '13px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: timeRange === range.id ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                whiteSpace: 'nowrap',
                animation: idx >= 3 ? 'fadeIn 0.3s ease-out' : 'none'
              }}
            >
              {range.label}
              {range.isProFeature && !isPro && <Lock size={12} />}
            </button>
          ))}

          <button
            onClick={() => setShowAllTimeRanges(!showAllTimeRanges)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
              background: 'transparent',
              color: '#666',
              border: 'none', padding: '6px 8px', borderRadius: '4px',
              cursor: 'pointer', transition: 'all 0.2s',
              marginLeft: '4px'
            }}
            title={showAllTimeRanges ? "Minder tonen" : "Meer opties tonen"}
          >
            <div style={{ transform: showAllTimeRanges ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease', display: 'flex' }}>
              <ArrowRight size={14} />
            </div>
          </button>
          
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: translateX(-10px); }
              to { opacity: 1; transform: translateX(0); }
            }
          `}</style>
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Top Metrics */}
          <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'flex', gap: '1px', backgroundColor: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            <motion.div variants={itemVariants} style={{ backgroundColor: '#fff', padding: '20px 24px', flex: 1 }}>
              <div style={{ color: '#888', fontSize: '11px', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Bezoekers</div>
              <div style={{ color: '#111', fontSize: '32px', fontWeight: 600, letterSpacing: '-0.02em' }}>{metrics.visitors}</div>
            </motion.div>
            <motion.div variants={itemVariants} style={{ backgroundColor: '#fff', padding: '20px 24px', flex: 1 }}>
              <div style={{ color: '#888', fontSize: '11px', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Weergaven</div>
              <div style={{ color: '#111', fontSize: '32px', fontWeight: 600, letterSpacing: '-0.02em' }}>{metrics.pageViews}</div>
            </motion.div>
            <motion.div variants={itemVariants} style={{ backgroundColor: '#fff', padding: '20px 24px', flex: 1 }}>
              <div style={{ color: '#888', fontSize: '11px', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Gem. Sessieduur <Timer size={14} /></div>
              <div style={{ color: '#111', fontSize: '32px', fontWeight: 600, letterSpacing: '-0.02em' }}>{advancedAnalytics.avgDurationStr}</div>
            </motion.div>
            <motion.div variants={itemVariants} style={{ backgroundColor: '#fff', padding: '20px 24px', flex: 1, position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#888', fontSize: '11px', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                <div style={{ width: '8px', height: '8px', backgroundColor: '#10B981', borderRadius: '50%', animation: 'pulse 2s infinite' }}></div>
                Nu Online
                <style>{`
                  @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
                    70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
                  }
                `}</style>
              </div>
              <div style={{ color: '#10B981', fontSize: '32px', fontWeight: 600, letterSpacing: '-0.02em' }}>{activeNow}</div>
            </motion.div>
          </motion.div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Chart */}
            <motion.div variants={cardVariants} initial="hidden" animate="show" style={{ border: '1px solid rgba(0,0,0,0.06)', borderRadius: '12px', padding: '24px 0', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
              <div style={{ padding: '0 24px', marginBottom: '16px', fontSize: '11px', color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Eye size={16} color="#111" /> Bezoekers over tijd
              </div>
              <div style={{ height: '300px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorBlue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0070F3" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#0070F3" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" axisLine={{ stroke: '#eaeaea' }} tickLine={false} tick={{ fill: '#666', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 12 }} dx={-10} allowDecimals={false} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#eaeaea', borderRadius: '6px', color: '#111', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} itemStyle={{ color: '#111', fontSize: '14px', fontWeight: 500 }} labelStyle={{ color: '#666', fontSize: '12px', marginBottom: '4px' }} cursor={{ stroke: '#ccc', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    <Area type="linear" dataKey="Bezoekers" stroke="#0070F3" strokeWidth={2} fillOpacity={1} fill="url(#colorBlue)" activeDot={{ r: 4, fill: '#0070F3', stroke: '#fff', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Live Activity Ticker */}
            <motion.div variants={cardVariants} initial="hidden" animate="show" style={{ backgroundColor: '#ffffff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 24px', borderBottom: '1px solid rgba(0,0,0,0.04)', fontSize: '11px', color: '#888', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                <Activity size={16} color="#111" /> Live Activity Ticker
              </div>
              <div style={{ overflowY: 'auto', flexGrow: 1, padding: '0' }}>
                {liveActivity.length === 0 ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: '#999', fontSize: '13px' }}>Geen recente activiteit</div>
                ) : (
                  <motion.div variants={containerVariants} initial="hidden" animate="show">
                    {liveActivity.map((act, idx) => (
                      <motion.div variants={itemVariants} key={idx} onClick={() => setSelectedSessionId(act.session_id)} style={{ display: 'flex', gap: '14px', padding: '14px 24px', borderBottom: '1px solid rgba(0,0,0,0.03)', alignItems: 'flex-start', cursor: 'pointer', transition: 'background-color 0.2s', backgroundColor: 'transparent' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.01)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <div style={{ color: '#888', marginTop: '2px', backgroundColor: 'rgba(0,0,0,0.03)', padding: '6px', borderRadius: '6px' }}>
                          {act.type === 'view' ? <Eye size={14} /> : act.event_name === 'cta_click' ? <MousePointerClick size={14} color="#171717" /> : act.event_name === 'scroll_depth' ? <ArrowDown size={14} /> : act.event_name === 'rage_click' ? <Flame size={14} color="#ef4444" /> : act.event_name === 'utm_visit' ? <Link size={14} color="#b87333" /> : <Globe size={14} />}
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', color: '#111', marginBottom: '4px' }}>
                            {act.type === 'view' ? (<>Bezoeker bekeek <strong style={{ fontWeight: 600 }}>{act.page_url === '/' ? 'Home' : act.page_url}</strong></>) : act.event_name === 'cta_click' ? (<>Bezoeker klikte op <strong style={{ fontWeight: 600 }}>{act.event_data?.button || 'Knop'}</strong></>) : act.event_name === 'scroll_depth' ? (<>Bezoeker scrolde naar <strong style={{ fontWeight: 600 }}>{act.event_data?.depth}%</strong> op {act.page_url}</>) : act.event_name === 'rage_click' ? (<span style={{ color: '#ef4444' }}>Bezoeker raakte gefrustreerd: <strong style={{ fontWeight: 600 }}>klikte razendsnel op "{act.event_data?.target || 'iets'}"</strong></span>) : act.event_name === 'utm_visit' ? (<span style={{ color: '#b87333' }}>Kwam binnen via campagne <strong style={{ fontWeight: 600 }}>{act.event_data?.campaign} ({act.event_data?.source})</strong></span>) : (<>Bezoeker deed actie: <strong style={{ fontWeight: 600 }}>{act.event_name}</strong></>)}
                          </div>
                          <div style={{ fontSize: '11px', color: '#888', fontWeight: 500 }}>{new Date(act.created_at).toLocaleTimeString('nl-NL')} • {act.type === 'view' ? parseDevice(act.user_agent) : 'Interactie'}</div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* TAB 2: ACQUISITION & CAMPAIGNS */}
      {activeTab === 'acquisition' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem' }}>
            {/* Marketing Campaigns (UTM) */}
            <motion.div variants={cardVariants} initial="hidden" animate="show" style={{ backgroundColor: '#ffffff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ fontSize: '11px', color: '#888', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Link size={16} color="#111" /> Marketing Campagnes
                </div>
              </div>
              
              {advancedAnalytics.campaigns.length === 0 ? (
                <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center', color: '#888' }}>
                  <Link size={32} color="rgba(0,0,0,0.1)" style={{ marginBottom: '12px' }} />
                  <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#111' }}>Nog geen campagnes gemeten</div>
                  <div style={{ fontSize: '12px' }}>Deel links met <code style={{ backgroundColor: 'rgba(0,0,0,0.03)', padding: '2px 4px', borderRadius: '4px' }}>?utm_source=facebook</code> eraan vastgeplakt om hier resultaten te zien.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 12px 8px', fontSize: '11px', color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <span style={{ flex: 2 }}>Campagne / Bron</span>
                    <span style={{ flex: 1, textAlign: 'center' }}>Sessies</span>
                    <span style={{ flex: 1, textAlign: 'right' }}>Conversies</span>
                  </div>
                  <motion.div variants={containerVariants} initial="hidden" animate="show">
                    {advancedAnalytics.campaigns.map((camp, idx) => (
                      <motion.div variants={itemVariants} key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', backgroundColor: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.04)', borderRadius: '8px', marginBottom: '8px' }}>
                        <div style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#111' }}>{camp.campaign}</span>
                          <span style={{ fontSize: '11px', color: '#888', fontWeight: 500 }}>Bron: {camp.source}</span>
                        </div>
                        <div style={{ flex: 1, textAlign: 'center', fontSize: '14px', fontWeight: 600, color: '#111' }}>{camp.visitors}</div>
                        <div style={{ flex: 1, textAlign: 'right', fontSize: '14px', fontWeight: 600, color: camp.conversions > 0 ? '#10B981' : '#888' }}>{camp.conversions}</div>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              )}
            </motion.div>

            <VercelList title="Verkeersbronnen" data={referrersData} valueKey="visitors" labelKey="source" totalValue={metrics.visitors} />
          </div>

          {/* UTM Link Builder */}
          <UtmLinkBuilder />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            <VercelList title="Landen" data={countriesData} valueKey="visitors" labelKey="country" totalValue={metrics.visitors} asPercentage />
            <VercelList title="Apparaten" data={devicesData} valueKey="visitors" labelKey="device" totalValue={metrics.visitors} asPercentage />
            <VercelList title="OS" data={osData} valueKey="visitors" labelKey="os" totalValue={metrics.visitors} asPercentage />
          </div>
        </div>
      )}

      {/* TAB 3: BEHAVIOR & ENGAGEMENT */}
      {activeTab === 'behavior' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem' }}>
            {/* User Journey Funnel */}
            {/* User Journey Funnel */}
            <motion.div variants={cardVariants} initial="hidden" animate="show" style={{ backgroundColor: '#ffffff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ fontSize: '11px', color: '#888', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Filter size={16} color="#111" /> User Journey (Sales Funnel)
                </div>
              </div>
              
              <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 0' }}>
                {(() => {
                  const maxCount = Math.max(advancedAnalytics.funnel[0].count, 1);
                  return advancedAnalytics.funnel.map((step, index) => {
                    const percentTotal = Math.round((step.count / maxCount) * 100);
                    const prevCount = index === 0 ? maxCount : advancedAnalytics.funnel[index-1].count;
                    const dropOff = prevCount > 0 ? 100 - Math.round((step.count / prevCount) * 100) : 0;

                    return (
                      <motion.div variants={itemVariants} key={index} style={{ position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.04)', borderRadius: '8px', zIndex: 2, position: 'relative' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#111', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>{index + 1}</div>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: '#111' }}>{step.name}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            {index > 0 && dropOff > 0 && (
                              <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600, padding: '4px 8px', backgroundColor: '#fee2e2', borderRadius: '12px' }}>-{dropOff}% drop-off</span>
                            )}
                            <span style={{ fontSize: '16px', fontWeight: 700, color: '#111', minWidth: '40px', textAlign: 'right' }}>{step.count}</span>
                          </div>
                        </div>
                        {index < advancedAnalytics.funnel.length - 1 && (
                          <div style={{ width: '2px', height: '16px', backgroundColor: 'rgba(0,0,0,0.06)', margin: '0 28px' }}></div>
                        )}
                      </motion.div>
                    );
                  });
                })()}
              </motion.div>
            </motion.div>

            {/* Conversions & Scroll Depth */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'flex', gap: '1px', backgroundColor: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                <motion.div variants={itemVariants} style={{ backgroundColor: '#fff', padding: '20px 24px', flex: 1 }}>
                  <div style={{ color: '#888', fontSize: '11px', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>CTA Kliks (Aanvragen)</div>
                  <div style={{ color: '#111', fontSize: '32px', fontWeight: 600, letterSpacing: '-0.02em' }}>{conversionData.clicks}</div>
                </motion.div>
                <motion.div variants={itemVariants} style={{ backgroundColor: '#fff', padding: '20px 24px', flex: 1 }}>
                  <div style={{ color: '#888', fontSize: '11px', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Conversieratio</div>
                  <div style={{ color: '#0070F3', fontSize: '32px', fontWeight: 600, letterSpacing: '-0.02em' }}>{conversionData.rate}%</div>
                </motion.div>
              </motion.div>

              <motion.div variants={cardVariants} initial="hidden" animate="show" style={{ backgroundColor: '#ffffff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '12px', padding: '24px', flexGrow: 1, display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={{ fontSize: '11px', color: '#888', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Scroll-diepte (Betrokkenheid)</div>
                  <div style={{ fontSize: '11px', color: '#999', fontStyle: 'italic' }}>Hoe ver lezen je bezoekers naar beneden?</div>
                </div>
                
                <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1, justifyContent: 'center' }}>
                  {(() => {
                    const maxScrollValue = Math.max(...scrollDepthData.map(d => d.value), 1);
                    return scrollDepthData.map((item) => {
                      const percent = (item.value / maxScrollValue) * 100;
                      let title = '', subtitle = '';
                      if (item.name === '25%') { title = 'Tot 25% gescrold'; subtitle = '(Keken vluchtig)'; }
                      if (item.name === '50%') { title = 'Tot 50% gescrold'; subtitle = '(Lazen ongeveer de helft)'; }
                      if (item.name === '75%') { title = 'Tot 75% gescrold'; subtitle = '(Lazen bijna alles)'; }
                      if (item.name === '100%') { title = 'Tot 100% gescrold'; subtitle = '(Lazen tot het einde)'; }
                      
                      return (
                        <motion.div variants={itemVariants} key={item.name} style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', padding: '14px 16px', fontSize: '13px', color: '#111', zIndex: 1, borderRadius: '8px', border: '1px solid rgba(0,0,0,0.04)', backgroundColor: '#fff', overflow: 'hidden' }}>
                          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${percent}%`, background: 'linear-gradient(90deg, rgba(17,17,17,0.03) 0%, rgba(17,17,17,0.06) 100%)', zIndex: -1, transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)' }}></div>
                          <span style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#111', fontWeight: 600 }}>{title}</span> 
                            <span style={{ color: '#888', fontStyle: 'italic' }}>{subtitle}</span>
                          </span>
                          <span style={{ fontWeight: 600 }}>{item.value} <span style={{ color: '#888', fontWeight: 500, marginLeft: '4px' }}>x bereikt</span></span>
                        </motion.div>
                      );
                    });
                  })()}
                </motion.div>
              </motion.div>
            </div>
          </div>

          <VercelList title="Meest Bekeken Pagina's" data={pagesData} valueKey="visitors" labelKey="path" totalValue={metrics.pageViews} />
          
        </div>
      )}

      {/* Session Details Modal */}
      {selectedSessionId && selectedSessionTimeline && selectedSessionInfo && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setSelectedSessionId(null)}>
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', width: '100%', maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #eaeaea', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#111' }}>Bezoeker Detail-analyse</h3>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px', fontFamily: 'monospace' }}>Sessie ID: {selectedSessionId.substring(0, 12)}...</div>
              </div>
              <button onClick={() => setSelectedSessionId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}><X size={20} /></button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', padding: '20px 24px', backgroundColor: '#fafafa', borderBottom: '1px solid #eaeaea' }}>
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#999', fontWeight: 600, marginBottom: '6px' }}>Apparaat & OS</div>
                <div style={{ fontSize: '13px', color: '#111', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {selectedSessionInfo.device === 'Desktop' ? <Monitor size={14} color="#666" /> : <Smartphone size={14} color="#666" />}
                  {selectedSessionInfo.device} ({selectedSessionInfo.os})
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#999', fontWeight: 600, marginBottom: '6px' }}>Oorsprong</div>
                <div style={{ fontSize: '13px', color: '#111', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Globe size={14} color="#666" /> {selectedSessionInfo.referrer}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#999', fontWeight: 600, marginBottom: '6px' }}>Locatie</div>
                <div style={{ fontSize: '13px', color: '#111', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={14} color="#666" /> {selectedSessionInfo.country}
                </div>
              </div>
            </div>

            <div style={{ flexGrow: 1, overflowY: 'auto', padding: '24px' }}>
              <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#111', fontWeight: 700, marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Clock size={14} /> Chronologische Tijdlijn ({selectedSessionInfo.totalInteractions} acties)
              </div>
              <div style={{ borderLeft: '2px solid #eaeaea', marginLeft: '6px', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {selectedSessionTimeline.map((act, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '-27px', top: '2px', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: act.type === 'event' ? '#0070F3' : '#ccc', border: '2px solid #fff' }}></div>
                    <div style={{ fontSize: '11px', color: '#999', marginBottom: '2px' }}>{new Date(act.created_at).toLocaleTimeString('nl-NL')}</div>
                    <div style={{ fontSize: '13px', color: '#111', fontWeight: 500 }}>
                      {act.type === 'view' ? (
                        <>Bezocht pagina <span style={{ color: '#0070F3' }}>{act.page_url}</span></>
                      ) : act.event_name === 'cta_click' ? (
                        <>Klikte op <span style={{ fontWeight: 700 }}>{act.event_data?.button || 'Knop'}</span></>
                      ) : act.event_name === 'scroll_depth' ? (
                        <>Scrolde naar <span style={{ fontWeight: 700 }}>{act.event_data?.depth}%</span> op {act.page_url}</>
                      ) : act.event_name === 'utm_visit' ? (
                        <>Kwam binnen via campagne <span style={{ fontWeight: 700, color: '#d97706' }}>{act.event_data?.campaign} ({act.event_data?.source})</span></>
                      ) : act.event_name === 'rage_click' ? (
                        <span style={{ color: '#ef4444' }}>Bezoeker gefrustreerd: klikte razendsnel op <strong>"{act.event_data?.target || 'iets'}"</strong></span>
                      ) : (
                        <>Actie: {act.event_name}</>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <UpgradeModal 
        isOpen={isUpgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        product="pro"
      />
    </div>
  );
}
