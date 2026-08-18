import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle, ShoppingCart, Info, HardDrive, LayoutGrid, Activity } from 'lucide-react';
import UpgradeModal from './UpgradeModal';

const CircularProgress = ({ percentage, color = '#24b47e' }) => {
  const radius = 9;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <svg className="w-6 h-6 transform -rotate-90">
      <circle cx="12" cy="12" r={radius} stroke="#2E2E2E" strokeWidth="2.5" fill="transparent" />
      <circle
        cx="12"
        cy="12"
        r={radius}
        stroke={color}
        strokeWidth="2.5"
        fill="transparent"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        className="transition-all duration-1000 ease-out"
        strokeLinecap="round"
      />
    </svg>
  );
};

const UsageCard = ({ title, usageStr, limitStr, percentage, overLimit, icon: Icon, tooltip }) => {
  const fillWidth = Math.min(percentage, 100);
  const barColor = overLimit ? 'bg-red-500' : (percentage > 80 ? 'bg-amber-500' : 'bg-gray-900');
  const textColor = overLimit ? 'text-red-600' : (percentage > 80 ? 'text-amber-600' : 'text-gray-900');

  return (
    <div className="relative group bg-white border border-gray-200 hover:border-gray-300 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-gray-500 text-[11px] uppercase tracking-wider font-bold flex items-center cursor-help">
          {title}
        </h3>
        <div className="text-gray-400 bg-gray-50 p-2 rounded-lg">
          <Icon size={18} strokeWidth={2.5} />
        </div>
      </div>
      
      {/* Values */}
      <div className="flex items-end gap-2 mb-6">
        <div className="text-4xl font-extrabold tracking-tight text-gray-900 leading-none">
          {usageStr}
        </div>
        <div className="text-sm font-medium text-gray-400 mb-1">
          / {limitStr}
        </div>
      </div>

      {/* Progress Bar & Status */}
      <div className="w-full">
        <div className="flex justify-between items-baseline mb-2">
          <span className={`text-xs font-bold ${textColor}`}>
            {overLimit ? 'Limiet bereikt' : `${Math.round(percentage)}% gebruikt`}
          </span>
          {overLimit && (
            <span className="bg-red-100 text-red-700 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded">Vol</span>
          )}
        </div>
        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ease-out ${barColor}`} 
            style={{ width: `${fillWidth}%` }}
          />
        </div>
      </div>
      
      {/* Tooltip */}
      {tooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 bg-gray-900 text-white text-xs p-3 rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 shadow-2xl pointer-events-none after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-gray-900">
          {tooltip}
        </div>
      )}
    </div>
  );
};

export default function TokensManager({ items = [] }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [modalProduct, setModalProduct] = useState('pro'); // 'pro' or 'token'

  // Virtual Limits (Base Plan)
  const MAX_ITEMS = 50;
  const MAX_STORAGE_BYTES = 1 * 1024 * 1024 * 1024; // 1 GB
  const MAX_DB_BYTES = 0.5 * 1024 * 1024 * 1024; // 0.5 GB
  const MAX_EGRESS_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB
  const MAX_CACHED_EGRESS_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/hosting-metrics');
      if (!res.ok) {
        throw new Error('Failed to load metrics');
      }
      
      const text = await res.text();
      // Handle Vite serving index.html for unknown routes in dev
      if (text.startsWith('<')) {
        throw new Error('API route not found (running in Vite)');
      }
      
      const data = JSON.parse(text);
      setMetrics(data);
    } catch (err) {
      console.warn("API failed (waarschijnlijk omdat je lokaal via Vite draait in plaats van Vercel). Terugvallen op test-data.", err);
      
      // Fallback test-data voor lokale ontwikkeling
      setMetrics({
        usages: [
          { metric: 'cached_egress', usage: 6503673364, limit: 5368709120, unit: 'bytes' },
          { metric: 'egress', usage: 2099157893, limit: 5368709120, unit: 'bytes' },
          { metric: 'db_size', usage: 31138512, limit: 536870912, unit: 'bytes' },
          { metric: 'storage_size', usage: 170724966, limit: 1073741824, unit: 'bytes' }
        ],
        is_mock: true
      });
      setError('Er konden geen live statistieken worden opgehaald.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const formatBytes = (bytes) => {
    if (bytes === 0 || !bytes) return '0 GB';
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(3)} GB`;
  };

  const usages = metrics?.usages?.reduce((acc, curr) => {
    acc[curr.metric] = curr;
    return acc;
  }, {}) || {};

  // Objecten (Local count)
  const currentItems = items.length;
  const itemsPercentage = (currentItems / MAX_ITEMS) * 100;
  
  // Storage (From API)
  const currentStorage = usages['storage_size']?.usage || 0;
  const storagePercentage = (currentStorage / MAX_STORAGE_BYTES) * 100;

  // Database (From API)
  const currentDb = usages['db_size']?.usage || 0;
  const dbPercentage = (currentDb / MAX_DB_BYTES) * 100;

  // Direct Egress (From API)
  const currentEgress = usages['egress']?.usage || 0;
  const egressPercentage = (currentEgress / MAX_EGRESS_BYTES) * 100;

  // Cached Egress (From API)
  const currentCachedEgress = usages['cached_egress']?.usage || 0;
  const cachedEgressPercentage = (currentCachedEgress / MAX_CACHED_EGRESS_BYTES) * 100;

  const isOverCachedEgress = currentCachedEgress >= MAX_CACHED_EGRESS_BYTES;
  const isOverEgress = currentEgress >= MAX_EGRESS_BYTES;
  const isOverStorage = currentStorage >= MAX_STORAGE_BYTES;
  const isOverDb = currentDb >= MAX_DB_BYTES;
  const isOverItems = currentItems >= MAX_ITEMS;

  const hasExceeded = isOverCachedEgress || isOverEgress || isOverStorage || isOverItems || isOverDb;

  return (
    <div className="max-w-4xl mx-auto p-2 pb-12">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold mb-2">Hosting & Tokens</h1>
        <p className="text-gray-500">Beheer de opslag, het dataverkeer en de capaciteit van uw website.</p>
      </header>

      {hasExceeded && (
        <div className="bg-red-50 text-red-900 p-4 rounded-lg mb-8 border border-red-200 flex items-start">
          <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5 text-red-600" />
          <div>
            <h3 className="font-semibold text-red-800">Hostinglimiet bereikt</h3>
            <p className="text-sm mt-1">
              Uw website trekt enorm veel bezoekers of uw collectie is dusdanig groot dat uw huidige hostingpakket de limiet heeft bereikt. Om de website snel en online te houden voor uw bezoekers, dient u uw plan te upgraden.
            </p>
            <button className="mt-3 bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors">
              Upgrade Hosting Pakket
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <UsageCard 
          title="Collectie Grootte" 
          usageStr={currentItems} 
          limitStr="50 obj" 
          percentage={itemsPercentage} 
          overLimit={isOverItems} 
          icon={LayoutGrid} 
          tooltip={isOverItems ? "Maximum aantal kunstwerken bereikt. Upgrade uw pakket om nieuwe kunstwerken te kunnen uploaden." : "Het totale aantal kunstwerken dat momenteel in uw digitale catalogus staat."}
        />
        <UsageCard 
          title="Media Opslag" 
          usageStr={formatBytes(currentStorage)} 
          limitStr="1 GB" 
          percentage={storagePercentage} 
          overLimit={isOverStorage} 
          icon={HardDrive} 
          tooltip={isOverStorage ? "Opslaglimiet bereikt! U kunt geen nieuwe afbeeldingen meer uploaden totdat u uw pakket heeft geüpgraded." : "De totale opslagruimte die wordt gebruikt door al uw geüploade afbeeldingen in hoge resolutie."}
        />
        <UsageCard 
          title="Database Grootte" 
          usageStr={formatBytes(currentDb)} 
          limitStr="0.5 GB" 
          percentage={dbPercentage} 
          overLimit={isOverDb} 
          icon={HardDrive} 
          tooltip={isOverDb ? "Databaselimiet bereikt! Er kunnen geen nieuwe teksten of gegevens meer worden opgeslagen." : "De opslagruimte die nodig is voor de onderliggende data (teksten, aanvragen en instellingen)."}
        />
        <UsageCard 
          title="Direct Dataverkeer" 
          usageStr={formatBytes(currentEgress)} 
          limitStr="5 GB" 
          percentage={egressPercentage} 
          overLimit={isOverEgress} 
          icon={Activity} 
          tooltip={isOverEgress ? "Verkeerslimiet bereikt! Uw website zal vertragen of tijdelijk onbereikbaar worden." : "De standaard hoeveelheid data die direct van de server is gedownload door bezoekers."}
        />
        <UsageCard 
          title="Gecachet Verkeer" 
          usageStr={formatBytes(currentCachedEgress)} 
          limitStr="5 GB" 
          percentage={cachedEgressPercentage} 
          overLimit={isOverCachedEgress} 
          icon={Activity} 
          tooltip={isOverCachedEgress ? "Limiet overschreden! De website kan vertragen, tijdelijk onbereikbaar worden of afbeeldingen niet meer inladen voor uw bezoekers totdat het pakket wordt geüpgraded." : "De hoeveelheid data die via het snelle cache-netwerk naar uw bezoekers wordt verstuurd."}
        />
      </div>

      {/* Plan Vergelijking Table */}
      <div className="bg-white text-gray-900 rounded-xl border border-gray-200 shadow-sm mb-8 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Capaciteit Vergelijking</h2>
          <p className="text-sm text-gray-500 mt-1">Zie exact hoeveel extra capaciteit uw website krijgt bij een upgrade naar het Pro Plan.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-[11px] uppercase tracking-wider text-gray-500 font-bold">
                <th className="py-4 px-6">Middelen</th>
                <th className="py-4 px-6">Huidig (Basis)</th>
                <th className="py-4 px-6 text-blue-600">Pro Plan</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="py-4 px-6 font-medium text-gray-900 flex items-center gap-2"><HardDrive size={16} className="text-gray-400"/> Database Grootte</td>
                <td className="py-4 px-6">500 MB</td>
                <td className="py-4 px-6 font-semibold text-gray-900">8 GB <span className="text-green-600 text-[11px] uppercase tracking-wider font-bold ml-2 bg-green-50 px-2 py-1 rounded">16x Meer</span></td>
              </tr>
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="py-4 px-6 font-medium text-gray-900 flex items-center gap-2"><HardDrive size={16} className="text-gray-400"/> Media Opslag</td>
                <td className="py-4 px-6">1 GB</td>
                <td className="py-4 px-6 font-semibold text-gray-900">100 GB <span className="text-green-600 text-[11px] uppercase tracking-wider font-bold ml-2 bg-green-50 px-2 py-1 rounded">100x Meer</span></td>
              </tr>
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="py-4 px-6 font-medium text-gray-900 flex items-center gap-2"><Activity size={16} className="text-gray-400"/> Direct Dataverkeer</td>
                <td className="py-4 px-6">5 GB / mnd</td>
                <td className="py-4 px-6 font-semibold text-gray-900">250 GB / mnd <span className="text-green-600 text-[11px] uppercase tracking-wider font-bold ml-2 bg-green-50 px-2 py-1 rounded">50x Meer</span></td>
              </tr>
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="py-4 px-6 font-medium text-gray-900 flex items-center gap-2"><Activity size={16} className="text-gray-400"/> Gecachet Verkeer</td>
                <td className="py-4 px-6">5 GB / mnd</td>
                <td className="py-4 px-6 font-semibold text-gray-900 flex items-center gap-2">Ongelimiteerd ✨</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white text-gray-900 p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
          <h2 className="text-lg font-semibold flex items-center text-gray-800">
            <ShoppingCart className="mr-2 text-gray-500" size={20} /> Tokens & Upgrades
          </h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div>
              <h4 className="font-medium text-gray-900 flex items-center">
                Uitbreiding: Extra Kunstwerken
                <span className="ml-3 bg-gray-200 text-gray-800 text-xs font-semibold px-2.5 py-0.5 rounded">Eenmalig</span>
              </h4>
              <p className="text-sm text-gray-500 mt-1">Verhoog de capaciteit van uw digitale catalogus blijvend. Geen maandelijkse kosten.</p>
            </div>
            <button 
              onClick={() => { setModalProduct('token'); setIsUpgradeModalOpen(true); }}
              className="inline-flex items-center bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-md hover:bg-gray-800 hover:shadow-lg transition-all active:scale-95"
            >
              Koop Tokens <span className="ml-2">→</span>
            </button>
          </div>

          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div>
              <h4 className="font-medium text-gray-900 flex items-center">
                Pro Plan Hosting
                <span className="ml-3 bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">Vanaf €39 / maand</span>
              </h4>
              <p className="text-sm text-gray-500 mt-1">
                Zorg voor een bliksemsnelle, haperingsvrije weergave van uw hoge resolutie afbeeldingen voor élke bezoeker. (Inclusief 50GB extra opslag).
              </p>
            </div>
            <button 
              onClick={() => { setModalProduct('pro'); setIsUpgradeModalOpen(true); }}
              className="inline-flex items-center bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-md hover:bg-blue-700 hover:shadow-lg transition-all active:scale-95"
            >
              Upgrade Plan <span className="ml-2">→</span>
            </button>
          </div>
        </div>
      </div>
      
      <UpgradeModal 
        isOpen={isUpgradeModalOpen} 
        onClose={() => setIsUpgradeModalOpen(false)} 
        product={modalProduct}
      />
    </div>
  );
}
