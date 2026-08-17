import React, { useEffect, useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '../../utils/supabaseClient';
import { Activity } from 'lucide-react';

const COLORS = ['#171717', '#B8860B', '#737373', '#e5e5e5'];

const parseDevice = (userAgent) => {
  if (!userAgent) return 'Onbekend';
  const ua = userAgent.toLowerCase();
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'Tablet';
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) return 'Mobiel';
  return 'Desktop';
};

const parseReferrer = (referrer) => {
  if (!referrer) return 'Direct';
  try {
    const url = new URL(referrer);
    const hostname = url.hostname.replace('www.', '');
    if (hostname.includes('google')) return 'Google';
    if (hostname.includes('facebook') || hostname.includes('fb.com')) return 'Facebook';
    if (hostname.includes('instagram')) return 'Instagram';
    if (hostname.includes('linkedin')) return 'LinkedIn';
    if (hostname.includes('twitter') || hostname.includes('t.co')) return 'X (Twitter)';
    return hostname;
  } catch (e) {
    return 'Overig';
  }
};

export default function AnalyticsManager() {
  const [loading, setLoading] = useState(true);
  const [pageViews, setPageViews] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!supabase) {
        setError('Supabase is niet verbonden.');
        setLoading(false);
        return;
      }
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const { data, error: fetchError } = await supabase
          .from('page_views')
          .select('*')
          .gte('created_at', thirtyDaysAgo.toISOString())
          .order('created_at', { ascending: true });

        if (fetchError) throw fetchError;
        setPageViews(data || []);
      } catch (err) {
        console.error("Fout bij ophalen analytics:", err);
        setError('Fout bij het ophalen van analytics data.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const metrics = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const fifteenMinsAgo = new Date();
    fifteenMinsAgo.setMinutes(fifteenMinsAgo.getMinutes() - 15);
    
    const last7DaysViews = pageViews.filter(v => new Date(v.created_at) >= sevenDaysAgo);
    const activeNowViews = pageViews.filter(v => new Date(v.created_at) >= fifteenMinsAgo);
    
    const uniqueSessions7Days = new Set(last7DaysViews.map(v => v.session_id)).size;
    const uniqueSessions30Days = new Set(pageViews.map(v => v.session_id)).size;
    const activeNowUnique = new Set(activeNowViews.map(v => v.session_id)).size;

    return {
      activeNow: activeNowUnique,
      totalViews30Days: pageViews.length,
      totalViews7Days: last7DaysViews.length,
      uniqueSessions7Days,
      uniqueSessions30Days,
    };
  }, [pageViews]);

  const chartData = useMemo(() => {
    const dailyData = {};
    pageViews.forEach(view => {
      const date = new Date(view.created_at).toLocaleDateString('nl-NL', { month: 'short', day: 'numeric' });
      if (!dailyData[date]) {
        dailyData[date] = { date, weergaven: 0, uniekeBezoekers: new Set() };
      }
      dailyData[date].weergaven += 1;
      dailyData[date].uniekeBezoekers.add(view.session_id);
    });

    return Object.values(dailyData).map(d => ({
      ...d,
      uniekeBezoekers: d.uniekeBezoekers.size
    }));
  }, [pageViews]);

  const topPagesData = useMemo(() => {
    const pages = {};
    pageViews.forEach(view => {
      let path = view.page_url;
      if (path === '/') path = 'Home';
      else if (path.startsWith('/collectie/') || path.startsWith('/item/')) return; // Filter uit artworks
      
      if (!pages[path]) pages[path] = { path, weergaven: 0 };
      pages[path].weergaven += 1;
    });
    
    return Object.values(pages)
      .sort((a, b) => b.weergaven - a.weergaven)
      .slice(0, 5);
  }, [pageViews]);

  const topArtworksData = useMemo(() => {
    const artworks = {};
    pageViews.forEach(view => {
      let path = view.page_url;
      if (path.startsWith('/collectie/') || path.startsWith('/item/')) {
        const itemSlug = path.replace('/collectie/', '').replace('/item/', '');
        if (!artworks[itemSlug]) artworks[itemSlug] = { path: itemSlug, weergaven: 0 };
        artworks[itemSlug].weergaven += 1;
      }
    });
    
    return Object.values(artworks)
      .sort((a, b) => b.weergaven - a.weergaven)
      .slice(0, 5);
  }, [pageViews]);

  const deviceData = useMemo(() => {
    const devices = {};
    // Use unique sessions for device metrics so 1 person refreshing doesn't skew it
    const uniqueSessions = new Map();
    pageViews.forEach(view => {
      if (!uniqueSessions.has(view.session_id)) {
        uniqueSessions.set(view.session_id, view);
      }
    });

    Array.from(uniqueSessions.values()).forEach(view => {
      const device = parseDevice(view.user_agent);
      if (!devices[device]) devices[device] = { name: device, value: 0 };
      devices[device].value += 1;
    });

    return Object.values(devices).sort((a, b) => b.value - a.value);
  }, [pageViews]);

  const referrerData = useMemo(() => {
    const referrers = {};
    const uniqueSessions = new Map();
    pageViews.forEach(view => {
      if (!uniqueSessions.has(view.session_id)) {
        uniqueSessions.set(view.session_id, view);
      }
    });

    Array.from(uniqueSessions.values()).forEach(view => {
      const ref = parseReferrer(view.referrer);
      if (!referrers[ref]) referrers[ref] = { source: ref, visitors: 0 };
      referrers[ref].visitors += 1;
    });

    return Object.values(referrers).sort((a, b) => b.visitors - a.visitors).slice(0, 5);
  }, [pageViews]);

  if (loading) {
    return (
      <div className="admin-analytics" style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Analytics laden...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-analytics" style={{ padding: '2rem' }}>
        <div style={{ backgroundColor: 'var(--admin-danger)', color: 'white', padding: '1rem', borderRadius: '4px' }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-analytics" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>Bezoekers Analytics</h2>
          <p style={{ color: 'var(--admin-muted)' }}>Geavanceerde inzichten in websiteverkeer en paginaweergaven (30 dagen).</p>
        </div>
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--admin-surface)', 
          padding: '0.75rem 1.25rem', borderRadius: '50px', border: '1px solid var(--admin-border)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
        }}>
          <Activity size={18} color="#067647" className="pulse-animation" />
          <span style={{ fontWeight: 600, color: '#067647' }}>{metrics.activeNow}</span>
          <span style={{ color: 'var(--admin-muted)', fontSize: '0.875rem' }}>actief nu (15m)</span>
        </div>
      </div>

      {/* Top Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <div style={{ backgroundColor: 'var(--admin-surface)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
          <p style={{ color: 'var(--admin-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Paginaweergaven (30d)</p>
          <p style={{ fontSize: '2rem', fontWeight: 700 }}>{metrics.totalViews30Days}</p>
        </div>
        <div style={{ backgroundColor: 'var(--admin-surface)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
          <p style={{ color: 'var(--admin-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Unieke Sessies (30d)</p>
          <p style={{ fontSize: '2rem', fontWeight: 700 }}>{metrics.uniqueSessions30Days}</p>
        </div>
        <div style={{ backgroundColor: 'var(--admin-surface)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
          <p style={{ color: 'var(--admin-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Paginaweergaven (7d)</p>
          <p style={{ fontSize: '2rem', fontWeight: 700 }}>{metrics.totalViews7Days}</p>
        </div>
        <div style={{ backgroundColor: 'var(--admin-surface)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
          <p style={{ color: 'var(--admin-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Unieke Sessies (7d)</p>
          <p style={{ fontSize: '2rem', fontWeight: 700 }}>{metrics.uniqueSessions7Days}</p>
        </div>
      </div>

      {/* Trend Chart (Full Width) */}
      <div style={{ backgroundColor: 'var(--admin-surface)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--admin-border)', marginBottom: '3rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>Bezoekers Trend (30d)</h3>
        <div style={{ height: '300px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#B8860B" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#B8860B" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--admin-border)" />
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--admin-muted)', fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--admin-muted)', fontSize: 12 }}
              />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: 'var(--admin-surface)', borderColor: 'var(--admin-border)', borderRadius: '4px', color: 'var(--admin-text)' }}
                itemStyle={{ color: 'var(--admin-text)' }}
              />
              <Area type="monotone" dataKey="weergaven" stroke="#B8860B" fillOpacity={1} fill="url(#colorViews)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Advanced Insights Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        
        {/* Most Viewed Artworks */}
        <div style={{ backgroundColor: 'var(--admin-surface)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>Populairste Collectie Items</h3>
          <div style={{ height: '250px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topArtworksData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--admin-border)" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: 'var(--admin-muted)', fontSize: 12 }} />
                <YAxis dataKey="path" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--admin-text)', fontSize: 12 }} width={100} />
                <RechartsTooltip cursor={{fill: 'var(--admin-subtle)'}} contentStyle={{ backgroundColor: 'var(--admin-surface)', borderColor: 'var(--admin-border)', borderRadius: '4px', color: 'var(--admin-text)' }} />
                <Bar dataKey="weergaven" fill="#B8860B" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Traffic Sources */}
        <div style={{ backgroundColor: 'var(--admin-surface)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>Verkeersbronnen (Sessies)</h3>
          <div style={{ height: '250px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={referrerData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--admin-border)" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: 'var(--admin-muted)', fontSize: 12 }} />
                <YAxis dataKey="source" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--admin-text)', fontSize: 12 }} width={100} />
                <RechartsTooltip cursor={{fill: 'var(--admin-subtle)'}} contentStyle={{ backgroundColor: 'var(--admin-surface)', borderColor: 'var(--admin-border)', borderRadius: '4px', color: 'var(--admin-text)' }} />
                <Bar dataKey="visitors" fill="#171717" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Device Breakdown */}
        <div style={{ backgroundColor: 'var(--admin-surface)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>Apparaten (Sessies)</h3>
          <div style={{ height: '250px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deviceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {deviceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: 'var(--admin-surface)', borderColor: 'var(--admin-border)', borderRadius: '4px', color: 'var(--admin-text)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '-1rem' }}>
              {deviceData.map((entry, index) => (
                <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span style={{ fontSize: '0.875rem', color: 'var(--admin-text)' }}>{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
      
      {/* CSS for the pulse animation */}
      <style>{`
        @keyframes pulse-green {
          0% { transform: scale(0.95); opacity: 1; }
          70% { transform: scale(1.1); opacity: 0.5; }
          100% { transform: scale(0.95); opacity: 1; }
        }
        .pulse-animation {
          animation: pulse-green 2s infinite;
        }
      `}</style>
    </div>
  );
}
