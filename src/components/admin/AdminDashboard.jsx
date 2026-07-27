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
  HelpCircle
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

export default function AdminDashboard({ 
  items = [], 
  catalog = [], 
  inquiries = [], 
  heroSlides = [],
  faqItems = [],
  currentUser = null,
  onSaveItem = () => {}, 
  onDeleteItem = () => {}, 
  onUpdateInquiries = () => {}, 
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

  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'items' | 'hero' | 'provenance' | 'faq' | 'inquiries' | 'customers' | 'settings'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3500);
  };

  const newInquiriesCount = activeInquiries.filter(i => i && i.status === 'Nieuw').length;

  const navItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: LayoutGrid,
      badge: 'NIEUW'
    },
    { 
      id: 'items', 
      label: 'Collectie', 
      icon: BookOpen,
      count: activeItems.length
    },
    {
      id: 'hero',
      label: 'Hero Visuals',
      icon: ImageIcon
    },
    {
      id: 'provenance',
      label: 'Herkomst Page',
      icon: ShieldCheck
    },
    {
      id: 'faq',
      label: 'FAQ Beheer',
      icon: HelpCircle
    },
    { 
      id: 'inquiries', 
      label: 'Aanvragen', 
      icon: Mail,
      count: activeInquiries.length,
      highlight: newInquiriesCount > 0 ? `${newInquiriesCount} nieuw` : null
    },
    { 
      id: 'customers', 
      label: 'Klanten', 
      icon: Users 
    },
    { 
      id: 'settings', 
      label: 'Instellingen', 
      icon: Settings 
    }
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1C1A18] font-sans flex selection:bg-[#C5A059]/20 selection:text-[#C5A059]">
      
      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}

      {/* ========================================== */}
      {/* LEFT SIDEBAR NAVIGATION (Dark Charcoal Bronze) */}
      {/* ========================================== */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 lg:w-72 bg-[#1C1A18] text-white flex flex-col justify-between
        transition-transform duration-300 ease-in-out border-r border-[#2C2926] shadow-2xl
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        
        {/* Sidebar Top Brand Header */}
        <div className="p-6 border-b border-[#2C2926]">
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-start space-y-1">
              <img 
                src="/images/Atelier Rembrandt.png" 
                alt="Atelier Rembrandt" 
                className="h-10 sm:h-12 w-auto object-contain filter invert brightness-200 contrast-125 drop-shadow-sm"
              />
              <span className="text-[10px] font-sans font-bold text-[#A89F91] tracking-widest uppercase block mt-0.5">
                COLLECTION MANAGER
              </span>
            </div>

            {/* Mobile close menu button */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 rounded-xl bg-white/5 text-stone-400 hover:text-white md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sidebar Navigation Menu */}
        <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`
                  w-full px-4 py-3.5 rounded-xl text-sm font-sans font-medium transition-all flex items-center justify-between group relative
                  ${isActive 
                    ? 'bg-[#292622] text-white font-semibold border-l-4 border-[#C5A059] shadow-sm' 
                    : 'text-[#B0A79A] hover:bg-[#25221F] hover:text-white border-l-4 border-transparent'
                  }
                `}
              >
                <div className="flex items-center space-x-3.5">
                  <Icon className={`w-5 h-5 transition-colors ${
                    isActive ? 'text-[#C5A059]' : 'text-[#8C8478] group-hover:text-stone-200'
                  }`} />
                  <span className="tracking-wide">{item.label}</span>
                </div>

                <div className="flex items-center space-x-2">
                  {item.badge && (
                    <span className="text-[10px] font-sans font-bold uppercase px-2 py-0.5 rounded-md bg-[#C5A059] text-[#1C1A18]">
                      {item.badge}
                    </span>
                  )}

                  {item.highlight && (
                    <span className="text-xs font-sans font-bold px-2.5 py-0.5 rounded-full bg-[#C5A059] text-[#1C1A18] animate-pulse">
                      {item.highlight}
                    </span>
                  )}

                  {item.count !== undefined && !item.highlight && (
                    <span className={`text-xs font-sans font-bold px-2.5 py-0.5 rounded-full ${
                      isActive ? 'bg-white/15 text-white' : 'bg-[#25221F] text-[#8C8478]'
                    }`}>
                      {item.count}
                    </span>
                  )}

                  {isActive && !item.badge && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Sidebar Bottom Profile Snippet & Action Buttons */}
        <div className="p-4 border-t border-[#2C2926] space-y-3 bg-[#161412]">
          
          {/* User Profile Snippet */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#23201D] border border-[#332F2B]">
            <div className="flex items-center space-x-3 min-w-0">
              <img 
                src="/images/Atelier Rembrandt.png" 
                alt="Atelier Rembrandt" 
                className="h-7 w-auto object-contain shrink-0 filter invert brightness-200"
              />
              <div className="min-w-0">
                <p className="text-xs font-sans font-semibold text-stone-100 truncate">Admin Console</p>
                <p className="text-[11px] font-sans text-emerald-400 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Online</span>
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons: Neutral Website & Crimson Logout */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={handleClose}
              className="py-2.5 px-3 rounded-lg bg-[#23201D] border border-[#332F2B] hover:border-stone-500 text-stone-300 hover:text-white text-xs font-sans font-semibold transition-all flex items-center justify-center space-x-1.5"
              title="Bekijk de live website"
            >
              <ExternalLink className="w-4 h-4 text-[#C5A059]" />
              <span className="truncate">Website</span>
            </button>

            <button
              onClick={onLogout}
              className="py-2.5 px-3 rounded-lg bg-[#3A181A] border border-[#5C2326] hover:bg-[#4D1F22] text-red-200 hover:text-white text-xs font-sans font-semibold transition-all flex items-center justify-center space-x-1.5 shadow-xs"
              title="Veilig uitloggen uit beheer"
            >
              <LogOut className="w-4 h-4 text-red-400" />
              <span>Uitloggen</span>
            </button>
          </div>

        </div>

      </aside>

      {/* ========================================== */}
      {/* RIGHT MAIN CONTENT AREA */}
      {/* ========================================== */}
      <div className="flex-1 md:pl-64 lg:pl-72 flex flex-col min-w-0">
        
        {/* Top Bar Header */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#EBE7DF] py-4 px-4 sm:px-8 shadow-xs flex items-center justify-between gap-4">
          
          <div className="flex items-center space-x-3">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-xl bg-[#FDFBF7] border border-[#EBE7DF] text-[#1C1A18] md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              {/* Breadcrumbs */}
              <div className="flex items-center space-x-2 text-xs font-sans text-[#8C8478]">
                <span>Beheer</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#C5A059]" />
                <span className="text-[#1C1A18] font-semibold capitalize">{activeTab}</span>
              </div>

              {/* Main Page Title (Serif) */}
              <h2 className="text-xl font-serif font-bold text-[#1C1A18] tracking-tight mt-0.5">
                {activeTab === 'dashboard' && 'Overzicht & Statistieken'}
                {activeTab === 'items' && 'Collectie & Catalogus Beheer'}
                {activeTab === 'hero' && 'Hero Visuals & Homepage Carrousel'}
                {activeTab === 'provenance' && 'Herkomst & Provenance Pagina Beheer'}
                {activeTab === 'faq' && 'Veelgestelde Vragen (FAQ) Beheer'}
                {activeTab === 'inquiries' && 'Binnengekomen Aanvragen'}
                {activeTab === 'customers' && 'Verzamelaars & Klanten Index'}
                {activeTab === 'settings' && 'Beveiligingsinstellingen & PIN'}
              </h2>
            </div>
          </div>

          {/* Top-Right Action Button */}
          <div className="flex items-center space-x-2.5">
            <button
              onClick={handleClose}
              className="hidden sm:flex px-4 py-2.5 rounded-xl bg-white border border-[#EBE7DF] text-[#1C1A18] hover:bg-[#FDFBF7] hover:border-[#C5A059] text-xs font-sans font-semibold transition-all items-center space-x-2 shadow-xs cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 text-[#C5A059]" />
              <span>Bekijk Live Site</span>
            </button>
          </div>
        </header>

        {/* Dynamic Main Body Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-8">
          
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
            />
          )}

          {activeTab === 'hero' && (
            <HeroSlidesManager
              slides={heroSlides}
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
            <CustomersManager
              inquiries={activeInquiries}
            />
          )}

          {activeTab === 'settings' && (
            <div className="max-w-2xl bg-white border border-[#EBE7DF] rounded-xl p-6 sm:p-8 shadow-sm">
              <SecuritySettings currentUser={currentUser} onShowToast={showToast} />
            </div>
          )}

        </main>

      </div>

      {/* Floating Toast Notification */}
      <ToastNotification
        message={toastMessage}
        onClose={() => setToastMessage('')}
      />

    </div>
  );
}
