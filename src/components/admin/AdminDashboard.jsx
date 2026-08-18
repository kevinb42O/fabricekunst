import React, { useEffect, useRef, useState } from 'react';
import {
  Award,
  BookOpen,
  ExternalLink,
  HelpCircle,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Settings,
  ShieldCheck,
  Users,
  X,
  BarChart2,
  Activity,
  Globe,
  MousePointer2,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import ItemManager from './ItemManager';
import InquiriesManager from './InquiriesManager';
import SecuritySettings from './SecuritySettings';
import ToastNotification from './ToastNotification';
import DashboardOverview from './DashboardOverview';
import CustomersManager from './CustomersManager';
import HeroSlidesManager from './HeroSlidesManager';
import ProvenanceManager from './ProvenanceManager';
import FaqManager from './FaqManager';
import CertificateManager from './CertificateManager';
import AdminTooltip from './AdminTooltip';
import AnalyticsManager from './AnalyticsManager';
import TokensManager from './TokensManager';
import { supabase } from '../../utils/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import '../../styles/admin.css';

const VALID_TABS = new Set([
  'dashboard', 'analytics-overview', 'analytics-acquisition', 'analytics-behavior', 'items', 'certificates', 'hero', 'provenance', 'faq',
  'inquiries', 'customers', 'settings', 'tokens'
]);

const getTabFromHash = () => {
  if (typeof window === 'undefined') return 'dashboard';
  const tab = window.location.hash.replace('#', '');
  return VALID_TABS.has(tab) ? tab : 'dashboard';
};

export default function AdminDashboard({
  items = [],
  catalog = [],
  inquiries = [],
  heroImage = '',
  mobileHeroImage = '',
  faqItems = [],
  provenanceData = null,
  currentUser = null,
  onSaveItem = () => {},
  onDeleteItem = () => {},
  onUpdateInquiries = () => {},
  onSaveHeroImage = () => {},
  onSaveMobileHeroImage = () => {},
  onSaveProvenance = () => {},
  onSaveFaqItems = () => {},
  onLogout = () => {},
  onCloseAdmin,
  onClose
}) {
  const activeItems = items?.length ? items : (catalog || []);
  const activeInquiries = inquiries || [];
  const handleClose = onCloseAdmin || onClose || (() => {});

  const [activeTab, setActiveTab] = useState(getTabFromHash);
  const [certificateForItem, setCertificateForItem] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [createItemRequest, setCreateItemRequest] = useState(0);
  const [metricsData, setMetricsData] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState(() => {
    const initial = {};
    if (getTabFromHash().startsWith('analytics-')) initial.analytics = true;
    return initial;
  });
  const toastTimer = useRef(null);

  useEffect(() => {
    fetch('/api/hosting-metrics')
      .then(async res => {
        const text = await res.text();
        if (text.startsWith('<')) throw new Error('Vite fallback');
        return JSON.parse(text);
      })
      .then(data => setMetricsData(data))
      .catch(async err => {
        // Local dev fallback when Vercel API is not available
        let plan = 'basis';
        try {
          const { data } = await supabase.from('admin_settings').select('value').eq('key', 'hosting_plan').single();
          if (data) plan = data.value;
        } catch (e) { }

        setMetricsData({
          plan,
          usages: [
            { metric: 'cached_egress', usage: 6503673364, limit: 5368709120 },
            { metric: 'egress', usage: 2099157893, limit: 5368709120 },
            { metric: 'db_size', usage: 31138512, limit: 536870912 },
            { metric: 'storage_size', usage: 170724966, limit: 1073741824 }
          ]
        });
      });
  }, []);

  useEffect(() => {
    const handleHashChange = () => setActiveTab(getTabFromHash());
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const navigateTo = (tab) => {
    if (!VALID_TABS.has(tab)) return;
    setActiveTab(tab);
    setMobileMenuOpen(false);
    const nextHash = `#${tab}`;
    if (window.location.hash !== nextHash) window.history.replaceState(null, '', nextHash);
  };

  const showToast = (message, type = 'success') => {
    window.clearTimeout(toastTimer.current);
    setToast({ message: String(message || ''), type });
    toastTimer.current = window.setTimeout(() => setToast(null), 3600);
  };

  const handleCreateItem = () => {
    setCreateItemRequest((request) => request + 1);
    navigateTo('items');
  };

  const newInquiriesCount = activeInquiries.filter((item) => item?.status === 'Nieuw').length;
  
  const currentCachedEgress = metricsData?.usages?.find(m => m.metric === 'cached_egress')?.usage || 0;
  const currentEgress = metricsData?.usages?.find(m => m.metric === 'egress')?.usage || 0;
  const currentStorage = metricsData?.usages?.find(m => m.metric === 'storage_size')?.usage || 0;
  const currentDb = metricsData?.usages?.find(m => m.metric === 'db_size')?.usage || 0;

  const isPremium = metricsData?.plan === 'premium';
  const isPro = metricsData?.plan === 'pro' || isPremium;
  
  const MAX_CACHED_EGRESS_BYTES = isPremium ? 2000 * 1024 * 1024 * 1024 : (isPro ? 500 * 1024 * 1024 * 1024 : 5 * 1024 * 1024 * 1024);
  const MAX_EGRESS = isPremium ? 1000 * 1024 * 1024 * 1024 : (isPro ? 250 * 1024 * 1024 * 1024 : 5 * 1024 * 1024 * 1024);
  const MAX_STORAGE = isPremium ? 500 * 1024 * 1024 * 1024 : (isPro ? 100 * 1024 * 1024 * 1024 : 1 * 1024 * 1024 * 1024);
  const MAX_DB = isPremium ? 20 * 1024 * 1024 * 1024 : (isPro ? 8 * 1024 * 1024 * 1024 : 0.5 * 1024 * 1024 * 1024);
  const MAX_ITEMS = isPremium ? 500 : (isPro ? 150 : 50);

  const hasExceededLimits = currentCachedEgress >= MAX_CACHED_EGRESS_BYTES || 
                            currentEgress >= MAX_EGRESS || 
                            currentStorage >= MAX_STORAGE || 
                            currentDb >= MAX_DB || 
                            activeItems.length >= MAX_ITEMS;

  const navItems = [
    { id: 'dashboard', label: 'Overzicht', icon: LayoutDashboard },
    { 
      id: 'analytics', 
      label: 'Analytics', 
      icon: BarChart2,
      subItems: [
        { id: 'analytics-overview', label: 'Live Overzicht' },
        { id: 'analytics-acquisition', label: 'Verkeer & Marketing' },
        { id: 'analytics-behavior', label: 'Kliks & Gedrag' }
      ]
    },
    { id: 'items', label: 'Collectie', icon: BookOpen, count: activeItems.length },
    { id: 'certificates', label: 'Certificaten', icon: Award },
    { id: 'hero', label: 'Hero', icon: ImageIcon },
    { id: 'provenance', label: 'Herkomst', icon: ShieldCheck },
    { id: 'faq', label: 'FAQ', icon: HelpCircle },
    { id: 'inquiries', label: 'Berichten', icon: Mail, count: newInquiriesCount || undefined },
    { id: 'customers', label: 'Klanten', icon: Users },
    { id: 'tokens', label: 'Tokens', icon: Award, alert: hasExceededLimits },
    { id: 'settings', label: 'Account', icon: Settings }
  ];
  const tabTitles = {
    dashboard: 'Overzicht',
    'analytics-overview': 'Live Overzicht',
    'analytics-acquisition': 'Verkeer & Marketing',
    'analytics-behavior': 'Kliks & Gedrag',
    items: 'Collectie',
    certificates: 'Certificaten',
    hero: 'Hero-afbeeldingen',
    provenance: 'Herkomstpagina',
    faq: 'Veelgestelde vragen',
    inquiries: 'Berichten',
    customers: 'Klanten',
    tokens: 'Hosting & Tokens',
    settings: 'Account'
  };

  return (
    <div className="admin-ui">
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Navigatiemenu sluiten"
          className="admin-drawer-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside className={`admin-sidebar ${mobileMenuOpen ? 'is-open' : ''}`} aria-label="Hoofdnavigatie">
        <div className="admin-brand">
          <div className="admin-brand__identity">
            <img src="/images/Atelier Rembrandt.png" alt="Atelier Rembrandt" />
          </div>
          <button type="button" className="admin-icon-button admin-sidebar__close" onClick={() => setMobileMenuOpen(false)} aria-label="Menu sluiten">
            <X aria-hidden="true" />
          </button>
        </div>

        <nav className="admin-nav">
          <p className="admin-nav__label">Werkruimte</p>
          {navItems.map(({ id, label, icon: Icon, count, alert, subItems }) => {
            const isExpanded = !!expandedGroups[id];
            return (
            <React.Fragment key={id}>
              <button
                type="button"
                className={`admin-nav__item ${activeTab === id ? 'is-active' : ''}`}
                aria-current={activeTab === id ? 'page' : undefined}
                style={{ fontWeight: isExpanded ? '600' : undefined, color: isExpanded ? 'var(--admin-text)' : undefined }}
                onClick={() => {
                  if (subItems) {
                    setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }));
                    if (!activeTab.startsWith(id)) {
                      navigateTo(subItems[0].id);
                    }
                  } else {
                    navigateTo(id);
                  }
                }}
              >
                <Icon aria-hidden="true" />
                <span>{label}</span>
                <div className="ml-auto flex items-center gap-2">
                  {count !== undefined && <span className="admin-nav__count">{count}</span>}
                  {alert && <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>}
                  {subItems && (
                    isExpanded ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />
                  )}
                </div>
              </button>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', marginLeft: '12px', gap: '4px', marginTop: '-4px', marginBottom: '8px' }}
                  >
                    {subItems.map(sub => (
                      <button
                        key={sub.id}
                        type="button"
                        className={`admin-nav__item ${activeTab === sub.id ? 'is-active' : ''}`}
                        onClick={() => navigateTo(sub.id)}
                      >
                        <div className="w-[18px]"></div>
                        <span style={{ fontSize: '13px' }}>{sub.label}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </React.Fragment>
            );
          })}
        </nav>

        <div className="admin-sidebar__footer">
          <button type="button" onClick={handleClose}>
            <ExternalLink aria-hidden="true" />
            Website
          </button>
          <button type="button" onClick={onLogout}>
            <LogOut aria-hidden="true" />
            Uitloggen
          </button>
        </div>
      </aside>

      <div className="admin-workspace">
        <header className="admin-topbar">
          <button type="button" className="admin-icon-button admin-menu-button" onClick={() => setMobileMenuOpen(true)} aria-label="Menu openen">
            <Menu aria-hidden="true" />
          </button>
          <div className="admin-topbar__title flex items-center gap-2">
            <span>Atelier Rembrandt</span>
            <strong>{tabTitles[activeTab]}</strong>
            {isPremium ? (
              <span className="bg-gradient-to-r from-gray-900 to-black text-white text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded shadow-sm">
                Premium
              </span>
            ) : isPro ? (
              <span className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-white text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded shadow-sm">
                Pro
              </span>
            ) : null}
          </div>
          {newInquiriesCount > 0 && activeTab !== 'inquiries' && (
            <button type="button" className="admin-inbox-shortcut" onClick={() => navigateTo('inquiries')}>
              <Mail aria-hidden="true" />
              <span>{newInquiriesCount} nieuw</span>
            </button>
          )}
        </header>

        <main className="admin-content" id="admin-main">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              style={{ width: '100%', minHeight: '100%' }}
            >
              {activeTab === 'dashboard' && (
                <DashboardOverview
                  items={activeItems}
                  inquiries={activeInquiries}
                  onNavigateTab={navigateTo}
                  onCreateNewItem={handleCreateItem}
                  onOpenLiveSite={handleClose}
                />
              )}
              {activeTab.startsWith('analytics-') && <AnalyticsManager isPro={isPro} activeTab={activeTab.replace('analytics-', '')} />}
              {activeTab === 'items' && (
                <ItemManager
                  items={activeItems}
                  onSaveItem={onSaveItem}
                  onDeleteItem={onDeleteItem}
                  onShowToast={showToast}
                  createRequestKey={createItemRequest}
                  onCreateRequestHandled={() => setCreateItemRequest(0)}
                  onOpenCertificate={(item) => {
                    setCertificateForItem(item);
                    navigateTo('certificates');
                  }}
                />
              )}
              {activeTab === 'certificates' && (
                <CertificateManager
                  items={activeItems}
                  initialItem={certificateForItem}
                  onBackToItems={() => {
                    setCertificateForItem(null);
                    navigateTo('items');
                  }}
                  onShowToast={showToast}
                />
              )}
              {activeTab === 'hero' && (
                <HeroSlidesManager
                  heroImage={heroImage}
                  mobileHeroImage={mobileHeroImage}
                  onSaveHeroImage={onSaveHeroImage}
                  onSaveMobileHeroImage={onSaveMobileHeroImage}
                  onShowToast={showToast}
                />
              )}
              {activeTab === 'provenance' && (
                <ProvenanceManager provenanceData={provenanceData} onSaveProvenance={onSaveProvenance} showToast={showToast} />
              )}
              {activeTab === 'faq' && (
                <FaqManager faqItems={faqItems} onSaveFaqItems={onSaveFaqItems} onShowToast={showToast} />
              )}
              {activeTab === 'inquiries' && (
                <InquiriesManager inquiries={activeInquiries} onStatusChange={onUpdateInquiries} onShowToast={showToast} />
              )}
              {activeTab === 'customers' && <CustomersManager inquiries={activeInquiries} />}
              {activeTab === 'tokens' && <TokensManager items={activeItems} />}
              {activeTab === 'settings' && <SecuritySettings currentUser={currentUser} onShowToast={showToast} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <ToastNotification toast={toast} onClose={() => setToast(null)} />
      <AdminTooltip />
    </div>
  );
}
