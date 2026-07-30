import React, { useState } from 'react';
import {
  LayoutGrid,
  BookOpen,
  Mail,
  Users,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Image as ImageIcon,
  ChevronRight,
  ShieldCheck,
  HelpCircle,
  Award
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

export default function AdminDashboard({
  items = [],
  catalog = [],
  inquiries = [],
  heroImage = '',
  heroSlides = [],
  faqItems = [],
  provenanceData = null,
  currentUser = null,
  onSaveItem = () => {},
  onDeleteItem = () => {},
  onUpdateInquiries = () => {},
  onSaveHeroImage = () => {},
  onSaveHeroSlides = () => {},
  onSaveProvenance = () => {},
  onSaveFaqItems = () => {},
  onLogout = () => {},
  onCloseAdmin,
  onClose
}) {
  const activeItems = (items && items.length > 0) ? items : (catalog || []);
  const activeInquiries = inquiries || [];
  const handleClose = onCloseAdmin || onClose || (() => {});

  const [activeTab, setActiveTab] = useState('dashboard');
  const [certificateForItem, setCertificateForItem] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const newInquiriesCount = activeInquiries.filter(i => i && i.status === 'Nieuw').length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid, badge: 'NIEUW' },
    { id: 'items', label: 'Collectie', icon: BookOpen, count: activeItems.length },
    { id: 'certificates', label: 'Certificaten', icon: Award },
    { id: 'hero', label: 'Hero Visuals', icon: ImageIcon },
    { id: 'provenance', label: 'Herkomst', icon: ShieldCheck },
    { id: 'faq', label: 'FAQ', icon: HelpCircle },
    {
      id: 'inquiries', label: 'Aanvragen', icon: Mail,
      count: activeInquiries.length,
      highlight: newInquiriesCount > 0 ? `${newInquiriesCount} nieuw` : null
    },
    { id: 'customers', label: 'Klanten', icon: Users },
    { id: 'settings', label: 'Instellingen', icon: Settings }
  ];

  const tabTitles = {
    dashboard: 'Dashboard',
    items: 'Collectie Beheer',
    certificates: 'Certificaten',
    hero: 'Hero Visuals',
    provenance: 'Herkomst Pagina',
    faq: 'FAQ Beheer',
    inquiries: 'Aanvragen',
    customers: 'Klanten',
    settings: 'Instellingen'
  };

  return (
    <div className="min-h-[100dvh] bg-[#FDFBF7] text-[#1C1A18] font-sans flex selection:bg-[#C5A059]/20 selection:text-[#C5A059]">

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
        />
      )}

      {/* =============================== */}
      {/* SIDEBAR */}
      {/* =============================== */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50
        w-[280px] sm:w-64 lg:w-72
        bg-[#1C1A18] text-white flex flex-col
        transition-transform duration-300 ease-in-out
        border-r border-[#2C2926] shadow-2xl
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>

        {/* Brand Header */}
        <div className="px-4 py-3 border-b border-[#2C2926] flex items-center justify-between shrink-0">
          <div className="flex flex-col items-start min-w-0">
            <img
              src="/images/Atelier Rembrandt.png"
              alt="Atelier Rembrandt"
              className="h-8 w-auto object-contain filter brightness-0 invert"
            />
            <span className="text-[9px] font-bold text-[#A89F91] tracking-widest uppercase mt-0.5">
              COLLECTION MANAGER
            </span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="ml-3 p-2.5 rounded-xl bg-white/5 text-stone-400 hover:text-white md:hidden shrink-0 min-w-[40px] min-h-[40px] flex items-center justify-center"
            aria-label="Sluit menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Items — scrollable */}
        <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                className={`
                  w-full px-3 py-3 rounded-xl text-sm font-medium transition-all
                  flex items-center justify-between group min-h-[48px]
                  ${isActive
                    ? 'bg-[#292622] text-white font-semibold border-l-4 border-[#C5A059]'
                    : 'text-[#B0A79A] hover:bg-[#25221F] hover:text-white border-l-4 border-transparent'
                  }
                `}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#C5A059]' : 'text-[#8C8478] group-hover:text-stone-200'}`} />
                  <span className="truncate text-left">{item.label}</span>
                </div>
                <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                  {item.badge && (
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#C5A059] text-[#1C1A18]">
                      {item.badge}
                    </span>
                  )}
                  {item.highlight && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#C5A059] text-[#1C1A18] animate-pulse">
                      {item.highlight}
                    </span>
                  )}
                  {item.count !== undefined && !item.highlight && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-white/15 text-white' : 'bg-[#25221F] text-[#8C8478]'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Bottom Buttons */}
        <div className="p-3 border-t border-[#2C2926] bg-[#161412] shrink-0">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleClose}
              className="py-3 px-2 rounded-xl bg-[#23201D] border border-[#332F2B] hover:border-stone-500 text-stone-300 hover:text-white text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 min-h-[44px]"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
              <span>Website</span>
            </button>
            <button
              onClick={onLogout}
              className="py-3 px-2 rounded-xl bg-[#3A181A] border border-[#5C2326] hover:bg-[#4D1F22] text-red-200 hover:text-white text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 min-h-[44px]"
            >
              <LogOut className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span>Uitloggen</span>
            </button>
          </div>
        </div>

      </aside>

      {/* =============================== */}
      {/* MAIN CONTENT AREA */}
      {/* =============================== */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-64 lg:pl-72">

        {/* Sticky Top Header */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#EBE7DF] shrink-0">
          <div className="flex items-center gap-2 px-3 sm:px-5 py-2.5">

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2.5 rounded-xl bg-[#FDFBF7] border border-[#EBE7DF] text-[#1C1A18] md:hidden shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb + Title */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-1.5 text-[10px] text-[#8C8478] leading-none">
                <span>Beheer</span>
                <ChevronRight className="w-3 h-3 text-[#C5A059] shrink-0" />
                <span className="text-[#1C1A18] font-semibold truncate">{tabTitles[activeTab] || activeTab}</span>
              </div>
              <h1 className="text-sm sm:text-base font-serif font-bold text-[#1C1A18] tracking-tight leading-tight mt-0.5 truncate">
                {tabTitles[activeTab] || activeTab}
              </h1>
            </div>

            {/* New inquiry badge — mobile quick-tap shortcut */}
            {newInquiriesCount > 0 && activeTab !== 'inquiries' && (
              <button
                onClick={() => setActiveTab('inquiries')}
                className="shrink-0 flex items-center space-x-1.5 px-2.5 py-2 rounded-xl bg-[#C5A059] text-[#1C1A18] text-[10px] font-bold min-h-[44px] min-w-[44px]"
              >
                <Mail className="w-4 h-4 shrink-0" />
                <span className="tabular-nums">{newInquiriesCount}</span>
              </button>
            )}

          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-3 sm:p-5 lg:p-8 max-w-7xl mx-auto w-full space-y-5">

            {activeTab === 'dashboard' && (
              <DashboardOverview
                items={activeItems}
                inquiries={activeInquiries}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onCreateNewItem={() => setActiveTab('items')}
                onOpenLiveSite={handleClose}
              />
            )}

            {activeTab === 'items' && (
              <ItemManager
                items={activeItems}
                onSaveItem={onSaveItem}
                onDeleteItem={onDeleteItem}
                onShowToast={showToast}
                onOpenCertificate={(item) => {
                  setCertificateForItem(item);
                  setActiveTab('certificates');
                }}
              />
            )}

            {activeTab === 'certificates' && (
              <CertificateManager
                items={activeItems}
                initialItem={certificateForItem}
                onBackToItems={() => { setCertificateForItem(null); setActiveTab('items'); }}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'hero' && (
              <HeroSlidesManager
                heroImage={heroImage}
                slides={heroSlides}
                onSaveHeroImage={onSaveHeroImage || onSaveHeroSlides}
                onSaveSlides={onSaveHeroSlides}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'provenance' && (
              <ProvenanceManager
                provenanceData={provenanceData}
                onSaveProvenance={onSaveProvenance}
                showToast={showToast}
              />
            )}

            {activeTab === 'faq' && (
              <FaqManager
                faqItems={faqItems}
                onSaveFaqItems={onSaveFaqItems}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'inquiries' && (
              <InquiriesManager
                inquiries={activeInquiries}
                onStatusChange={onUpdateInquiries}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'customers' && (
              <CustomersManager inquiries={activeInquiries} />
            )}

            {activeTab === 'settings' && (
              <SecuritySettings currentUser={currentUser} onShowToast={showToast} />
            )}

          </div>
        </main>

      </div>

      {/* Toast */}
      <ToastNotification message={toastMessage} onClose={() => setToastMessage('')} />

    </div>
  );
}
