import React, { useEffect, useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../../utils/supabaseClient';

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

const VercelList = ({ title, data, valueKey, labelKey, totalValue }) => (
  <div style={{ backgroundColor: '#ffffff', border: '1px solid #eaeaea', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #eaeaea', fontSize: '12px', color: '#666', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
      <span>{title}</span>
      <span>Bezoekers</span>
    </div>
    <div style={{ padding: '8px', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {data.map((item, i) => {
        const percent = totalValue > 0 ? (item[valueKey] / totalValue) * 100 : 0;
        return (
          <div key={i} style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', padding: '8px 12px', fontSize: '13px', color: '#111', zIndex: 1 }}>
            <div style={{ 
              position: 'absolute', left: 0, top: 0, bottom: 0, width: `${percent}%`, 
              backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: '4px', zIndex: -1 
            }}></div>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '75%' }}>{item[labelKey]}</span>
            <span>{item[valueKey]}</span>
          </div>
        );
      })}
    </div>
  </div>
);

export default function AnalyticsManager() {
  const [loading, setLoading] = useState(true);
  const [pageViews, setPageViews] = useState([]);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('7d'); // '24u', '7d', '30d'

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!supabase) {
        setError('Supabase is niet verbonden.');
        setLoading(false);
        return;
      }
      try {
        const { data, fetchError } = await supabase
          .from('page_views')
          .select('*')
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

  const filteredViews = useMemo(() => {
    const now = new Date();
    let cutoff = new Date();
    if (timeRange === '24u') cutoff.setHours(now.getHours() - 24);
    if (timeRange === '7d') cutoff.setDate(now.getDate() - 7);
    if (timeRange === '30d') cutoff.setDate(now.getDate() - 30);
    
    return pageViews.filter(v => new Date(v.created_at) >= cutoff);
  }, [pageViews, timeRange]);

  const metrics = useMemo(() => {
    const uniqueSessions = new Set(filteredViews.map(v => v.session_id)).size;
    return {
      visitors: uniqueSessions,
      pageViews: filteredViews.length
    };
  }, [filteredViews]);

  const chartData = useMemo(() => {
    const dailyData = {};
    filteredViews.forEach(view => {
      const dateObj = new Date(view.created_at);
      let dateKey;
      if (timeRange === '24u') {
        dateKey = dateObj.toLocaleTimeString('nl-NL', { hour: 'numeric' }) + 'u';
      } else {
        dateKey = dateObj.toLocaleDateString('nl-NL', { month: 'short', day: 'numeric' });
      }
      
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = { date: dateKey, visitors: new Set(), sortKey: timeRange === '24u' ? dateObj.getHours() : dateObj.getTime() };
      }
      dailyData[dateKey].visitors.add(view.session_id);
    });

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
      if (!pages[path]) pages[path] = { path, visitors: 0 };
      pages[path].visitors += 1;
    });
    return Object.values(pages).sort((a, b) => b.visitors - a.visitors).slice(0, 7);
  }, [pageViews]);

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

  if (loading) return <div style={{ color: '#111', padding: '2rem' }}>Laden...</div>;

  return (
    <div style={{ backgroundColor: '#fafafa', minHeight: '100vh', padding: '2rem', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      
      {/* Top Filter & Metrics */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1px', backgroundColor: '#eaeaea', border: '1px solid #eaeaea', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ backgroundColor: '#fff', padding: '16px 24px', minWidth: '150px' }}>
            <div style={{ color: '#666', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>Bezoekers</div>
            <div style={{ color: '#111', fontSize: '32px', fontWeight: 600, letterSpacing: '-0.02em' }}>{metrics.visitors}</div>
          </div>
          <div style={{ backgroundColor: '#fff', padding: '16px 24px', minWidth: '150px' }}>
            <div style={{ color: '#666', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>Weergaven</div>
            <div style={{ color: '#111', fontSize: '32px', fontWeight: 600, letterSpacing: '-0.02em' }}>{metrics.pageViews}</div>
          </div>
        </div>

        {/* Time Range Selector */}
        <div style={{ display: 'flex', backgroundColor: '#eaeaea', border: '1px solid #eaeaea', borderRadius: '6px', padding: '4px' }}>
          {['24u', '7d', '30d'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              style={{
                background: timeRange === range ? '#fff' : 'transparent',
                color: timeRange === range ? '#111' : '#666',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: timeRange === range ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div style={{ border: '1px solid #eaeaea', borderRadius: '8px', padding: '24px 0', marginBottom: '2rem', backgroundColor: '#fff' }}>
        <div style={{ height: '300px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0070F3" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#0070F3" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                axisLine={{ stroke: '#eaeaea' }}
                tickLine={false}
                tick={{ fill: '#666', fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#666', fontSize: 12 }}
                dx={-10}
              />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: '#fff', borderColor: '#eaeaea', borderRadius: '6px', color: '#111', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                itemStyle={{ color: '#111', fontSize: '14px', fontWeight: 500 }}
                labelStyle={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}
                cursor={{ stroke: '#ccc', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area 
                type="linear" 
                dataKey="Bezoekers" 
                stroke="#0070F3" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorBlue)" 
                activeDot={{ r: 4, fill: '#0070F3', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Lists Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        <VercelList title="Pagina's" data={pagesData} valueKey="visitors" labelKey="path" totalValue={metrics.pageViews} />
        <VercelList title="Verkeersbronnen" data={referrersData} valueKey="visitors" labelKey="source" totalValue={metrics.visitors} />
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <VercelList title="Apparaten" data={devicesData} valueKey="visitors" labelKey="device" totalValue={metrics.visitors} />
          <VercelList title="Besturingssystemen" data={osData} valueKey="visitors" labelKey="os" totalValue={metrics.visitors} />
        </div>
      </div>

    </div>
  );
}
