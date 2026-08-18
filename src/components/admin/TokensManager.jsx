import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle, ShoppingCart, Info, HardDrive, LayoutGrid, Activity, Check, X } from 'lucide-react';
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

  const isPro = metrics?.plan === 'pro';

  // Dynamic Limits
  const MAX_ITEMS = isPro ? 150 : 50;
  const MAX_STORAGE_BYTES = isPro ? 100 * 1024 * 1024 * 1024 : 1 * 1024 * 1024 * 1024; // 100 GB vs 1 GB
  const MAX_DB_BYTES = isPro ? 8 * 1024 * 1024 * 1024 : 0.5 * 1024 * 1024 * 1024; // 8 GB vs 0.5 GB
  const MAX_EGRESS_BYTES = isPro ? 250 * 1024 * 1024 * 1024 : 5 * 1024 * 1024 * 1024; // 250 GB vs 5 GB
  const MAX_CACHED_EGRESS_BYTES = isPro ? 500 * 1024 * 1024 * 1024 : 5 * 1024 * 1024 * 1024; // 500 GB vs 5 GB

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
      
      let plan = 'basis';
      try {
        const { supabase } = await import('../../utils/supabaseClient');
        const { data } = await supabase.from('admin_settings').select('value').eq('key', 'hosting_plan').single();
        if (data) plan = data.value;
      } catch (e) { }

      // Fallback test-data voor lokale ontwikkeling
      setMetrics({
        plan,
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
          limitStr={isPro ? "150 obj" : "50 obj"} 
          percentage={itemsPercentage} 
          overLimit={isOverItems} 
          icon={LayoutGrid} 
          tooltip={isOverItems ? "Maximum aantal kunstwerken bereikt. Upgrade uw pakket om nieuwe kunstwerken te kunnen uploaden." : "Het totale aantal kunstwerken dat momenteel in uw digitale catalogus staat."}
        />
        <UsageCard 
          title="Media Opslag" 
          usageStr={formatBytes(currentStorage)} 
          limitStr={isPro ? "100 GB" : "1 GB"} 
          percentage={storagePercentage} 
          overLimit={isOverStorage} 
          icon={HardDrive} 
          tooltip={isOverStorage ? "Opslaglimiet bereikt! U kunt geen nieuwe afbeeldingen meer uploaden totdat u uw pakket heeft geüpgraded." : "De totale opslagruimte die wordt gebruikt door al uw geüploade afbeeldingen in hoge resolutie."}
        />
        <UsageCard 
          title="Database Grootte" 
          usageStr={formatBytes(currentDb)} 
          limitStr={isPro ? "8 GB" : "0.5 GB"} 
          percentage={dbPercentage} 
          overLimit={isOverDb} 
          icon={HardDrive} 
          tooltip={isOverDb ? "Databaselimiet bereikt! Er kunnen geen nieuwe teksten of gegevens meer worden opgeslagen." : "De opslagruimte die nodig is voor de onderliggende data (teksten, aanvragen en instellingen)."}
        />
        <UsageCard 
          title="Direct Dataverkeer" 
          usageStr={formatBytes(currentEgress)} 
          limitStr={isPro ? "250 GB" : "5 GB"} 
          percentage={egressPercentage} 
          overLimit={isOverEgress} 
          icon={Activity} 
          tooltip={isOverEgress ? "Verkeerslimiet bereikt! Uw website zal vertragen of tijdelijk onbereikbaar worden." : "De standaard hoeveelheid data die direct van de server is gedownload door bezoekers."}
        />
        <UsageCard 
          title="Gecachet Verkeer" 
          usageStr={formatBytes(currentCachedEgress)} 
          limitStr={isPro ? "500 GB" : "5 GB"} 
          percentage={cachedEgressPercentage} 
          overLimit={isOverCachedEgress} 
          icon={Activity} 
          tooltip={isOverCachedEgress ? "Limiet overschreden! De website kan vertragen, tijdelijk onbereikbaar worden of afbeeldingen niet meer inladen voor uw bezoekers totdat het pakket wordt geüpgraded." : "De hoeveelheid data die via het snelle cache-netwerk naar uw bezoekers wordt verstuurd."}
        />
      </div>

      {/* Hosting Pakketten Vergelijking */}
      <div className="mb-12">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Hosting Pakketten</h2>
          <p className="text-gray-500 mt-1">Upgrade de onderliggende serverinfrastructuur van uw website voor bliksemsnelle prestaties en 100% zekerheid.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Basis Plan Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm flex flex-col">
            <h3 className="text-lg font-bold text-gray-900">Basis Plan</h3>
            <div className="mt-2 mb-4">
              <span className="text-4xl font-extrabold text-gray-900 tracking-tight">€0</span>
              <span className="text-gray-500 font-medium"> / maand</span>
            </div>
            <p className="text-sm text-gray-500 mb-6 pb-6 border-b border-gray-100">
              Standaard inbegrepen bij oplevering. Perfect voor een startende online catalogus, maar met technische limieten.
            </p>
            
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-start text-sm text-gray-600"><Check size={18} className="text-gray-400 mr-3 mt-0.5 flex-shrink-0" /> Capaciteit voor 50 Kunstwerken</li>
              <li className="flex items-start text-sm text-gray-600"><Check size={18} className="text-gray-400 mr-3 mt-0.5 flex-shrink-0" /> 500 MB Database Grootte</li>
              <li className="flex items-start text-sm text-gray-600"><Check size={18} className="text-gray-400 mr-3 mt-0.5 flex-shrink-0" /> 1 GB Media Opslag (Gecomprimeerd)</li>
              <li className="flex items-start text-sm text-gray-600"><Check size={18} className="text-gray-400 mr-3 mt-0.5 flex-shrink-0" /> 5 GB/mnd Gedeeld Dataverkeer</li>
              <li className="flex items-start text-sm text-gray-600"><Check size={18} className="text-gray-400 mr-3 mt-0.5 flex-shrink-0" /> Bezoekersstatistieken (30 dgn historie)</li>
              <li className="flex items-start text-sm text-gray-400"><X size={18} className="text-gray-300 mr-3 mt-0.5 flex-shrink-0" /> Geen Wereldwijd CDN (Tragere laadtijden)</li>
              <li className="flex items-start text-sm text-gray-400"><X size={18} className="text-gray-300 mr-3 mt-0.5 flex-shrink-0" /> Geen Gegarandeerde Uptime</li>
            </ul>

            {!isPro ? (
              <button disabled className="w-full py-3 px-4 bg-gray-50 text-gray-400 font-bold rounded-xl text-sm border border-gray-200 cursor-not-allowed">
                Uw Huidige Plan
              </button>
            ) : (
              <button disabled className="w-full py-3 px-4 bg-transparent text-gray-400 font-bold rounded-xl text-sm border border-transparent cursor-not-allowed">
                Inactief
              </button>
            )}
          </div>

          {/* Pro Plan Card */}
          <div className="bg-gradient-to-b from-blue-50/80 to-white rounded-2xl border-2 border-blue-500 p-8 shadow-md flex flex-col relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-blue-500"></div>
            <div className="absolute top-5 right-5 bg-blue-100 text-blue-700 text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full">Aanbevolen</div>
            
            <h3 className="text-lg font-bold text-gray-900">Pro Plan</h3>
            
            <div className="mt-2 mb-4">
              <span className="text-4xl font-extrabold text-gray-900 tracking-tight">€20</span>
              <span className="text-gray-500 font-medium"> / maand</span>
              <div className="text-[11px] text-gray-500 font-medium mt-1">Vanaf-prijs bij jaarlijkse facturering</div>
            </div>
            <p className="text-sm text-gray-600 mb-6 pb-6 border-b border-blue-100">
              Premium infrastructuur voor professionele kunsthandelaren. Haperingsvrije weergave van originele 4K foto's wereldwijd.
            </p>
            
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-start text-sm text-gray-900 font-medium"><Check size={18} className="text-blue-500 mr-3 mt-0.5 flex-shrink-0" /> Capaciteit voor 150 Kunstwerken <span className="ml-2 text-[10px] text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">3x Meer</span></li>
              <li className="flex items-start text-sm text-gray-900 font-medium"><Check size={18} className="text-blue-500 mr-3 mt-0.5 flex-shrink-0" /> 8 GB Database <span className="ml-2 text-[10px] text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">16x Meer</span></li>
              <li className="flex items-start text-sm text-gray-900 font-medium"><Check size={18} className="text-blue-500 mr-3 mt-0.5 flex-shrink-0" /> 100+ GB Media Opslag (4K Ready)</li>
              <li className="flex items-start text-sm text-gray-900 font-medium"><Check size={18} className="text-blue-500 mr-3 mt-0.5 flex-shrink-0" /> 250 GB Direct Dataverkeer</li>
              <li className="flex items-start text-sm text-gray-900 font-medium"><Check size={18} className="text-blue-500 mr-3 mt-0.5 flex-shrink-0" /> Geavanceerde Analytics (Volledige historie)</li>
              <li className="flex items-start text-sm text-gray-900 font-medium"><Check size={18} className="text-blue-500 mr-3 mt-0.5 flex-shrink-0" /> 500 GB Gecachet CDN Verkeer</li>
              <li className="flex items-start text-sm text-gray-900 font-medium"><Check size={18} className="text-blue-500 mr-3 mt-0.5 flex-shrink-0" /> Gegarandeerde Uptime & Back-ups</li>
            </ul>

            {isPro ? (
              <button disabled className="w-full py-3 px-4 bg-blue-50 text-blue-400 font-bold rounded-xl text-sm border border-blue-100 cursor-not-allowed">
                Uw Huidige Plan
              </button>
            ) : (
              <button 
                onClick={() => { setModalProduct('pro'); setIsUpgradeModalOpen(true); }}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-lg hover:shadow-xl transition-all active:scale-95"
              >
                Upgrade naar Pro
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Capaciteitsuitbreiding */}
      <div className="bg-white text-gray-900 p-8 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold flex items-center text-gray-900">
              Eenmalige Capaciteitsuitbreiding
            </h2>
            <p className="text-sm text-gray-500 mt-1">Verhoog de limiet van uw catalogus blijvend, zonder maandelijkse abonnementskosten.</p>
          </div>
          <ShoppingCart className="text-gray-300" size={32} />
        </div>

        <div className="flex items-center justify-between bg-gray-50 p-6 rounded-xl border border-gray-200">
          <div>
            <h4 className="font-bold text-gray-900 text-lg flex items-center">
              +50 of +150 Extra Kunstwerken
              <span className="ml-3 bg-gray-200 text-gray-800 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full">Eenmalige Aankoop</span>
            </h4>
            <p className="text-sm text-gray-500 mt-2">Ideaal wanneer uw collectie groeit, maar u de huidige serverprestaties (Basis Plan) nog voldoende vindt.</p>
          </div>
          <button 
            onClick={() => { setModalProduct('token'); setIsUpgradeModalOpen(true); }}
            className="inline-flex items-center bg-gray-900 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-md hover:bg-gray-800 hover:shadow-lg transition-all active:scale-95 whitespace-nowrap ml-6"
          >
            Capaciteit Verhogen <span className="ml-2">→</span>
          </button>
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
