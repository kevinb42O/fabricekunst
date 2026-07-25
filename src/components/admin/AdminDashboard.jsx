import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Mail, 
  Users, 
  Settings, 
  LogOut, 
  ExternalLink, 
  Menu, 
  X, 
  Sparkles, 
  Plus, 
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import ItemManager from './ItemManager';
import InquiriesManager from './InquiriesManager';
import SecuritySettings from './SecuritySettings';
import ToastNotification from './ToastNotification';
import DashboardOverview from './DashboardOverview';
import CustomersManager from './CustomersManager';

export default function AdminDashboard({ 
  items = [], 
  catalog = [], 
  inquiries = [], 
  currentUser = null,
  onSaveItem = () => {}, 
  onDeleteItem = () => {}, 
  onUpdateInquiries = () => {}, 
  onLogout = () => {}, 
  onCloseAdmin, 
  onClose 
}) {
  const activeItems = (items && items.length > 0) ? items : (catalog || []);
  const activeInquiries = inquiries || [];
  const handleClose = onCloseAdmin || onClose || (() => {});

  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'items' | 'inquiries' | 'customers' | 'settings'
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
      icon: LayoutDashboard,
      badge: 'Nieuw'
    },
    { 
      id: 'items', 
      label: 'Collectie', 
      icon: BookOpen,
      count: activeItems.length
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
    <div className="min-h-screen bg-[#FAF7F2] text-[#111111] font-sans flex selection:bg-[#B8860B]/20 selection:text-[#B8860B]">
      
      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}

      {/* ========================================== */}
      {/* LEFT SIDEBAR NAVIGATION (Dark Luxury Theme) */}
      {/* ========================================== */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 lg:w-72 bg-[#141414] text-white flex flex-col justify-between
        transition-transform duration-300 ease-in-out border-r border-[#2A2825] shadow-2xl
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        
        {/* Sidebar Top Header */}
        <div className="p-6 border-b border-[#262420]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3.5">
              {/* Brand Logo Avatar */}
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#1F1E1B] to-[#2E2C27] border border-[#B8860B]/40 flex items-center justify-center shadow-lg shrink-0">
                <span className="font-serif font-bold text-2xl text-[#D4AF37]">F</span>
              </div>

              <div>
                <h1 className="text-lg font-serif font-bold text-white leading-tight tracking-tight">
                  Admin Dashboard
                </h1>
                <span className="text-xs font-mono text-[#A09888] tracking-wider uppercase block mt-0.5">
                  Collection Manager
                </span>
              </div>
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

        {/* Sidebar Navigation Items */}
        <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
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
                  w-full px-4 py-3.5 rounded-2xl text-sm sm:text-base font-serif font-bold transition-all flex items-center justify-between group
                  ${isActive 
                    ? 'bg-[#24221E] text-white border border-[#B8860B]/60 shadow-md' 
                    : 'text-[#BBB5A8] hover:bg-[#1C1A17] hover:text-white border border-transparent'
                  }
                `}
              >
                <div className="flex items-center space-x-3.5">
                  <Icon className={`w-5 h-5 transition-colors ${
                    isActive ? 'text-[#D4AF37]' : 'text-[#888275] group-hover:text-stone-200'
                  }`} />
                  <span className="tracking-wide text-sm sm:text-[15px]">{item.label}</span>
                </div>

                <div className="flex items-center space-x-2">
                  {item.badge && (
                    <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-[#B8860B] text-white">
                      {item.badge}
                    </span>
                  )}

                  {item.highlight && (
                    <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#B8860B] text-white animate-pulse">
                      {item.highlight}
                    </span>
                  )}

                  {item.count !== undefined && !item.highlight && (
                    <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${
                      isActive ? 'bg-white/15 text-white' : 'bg-stone-800 text-stone-300'
                    }`}>
                      {item.count}
                    </span>
                  )}

                  {isActive && (
                    <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Sidebar Bottom Profile & Actions */}
        <div className="p-4 border-t border-[#262420] space-y-3 bg-[#111110]">
          
          {/* Admin User Badge */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#1C1A17] border border-[#2E2C27]">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#B8860B]/20 text-[#D4AF37] border border-[#B8860B]/30 flex items-center justify-center font-serif font-bold text-sm shrink-0">
                F
              </div>
              <div className="min-w-0">
                <p className="text-xs font-serif font-bold text-stone-200 truncate">Fabrice Atelier</p>
                <p className="text-[11px] font-mono text-emerald-400 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Online</span>
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={handleClose}
              className="py-2.5 px-3 rounded-xl bg-[#1C1A17] border border-[#2E2C27] hover:border-stone-500 text-stone-200 hover:text-white text-xs font-serif font-bold transition-all flex items-center justify-center space-x-1.5"
              title="Bekijk de live website"
            >
              <ExternalLink className="w-4 h-4 text-[#D4AF37]" />
              <span className="truncate">Website</span>
            </button>

            <button
              onClick={onLogout}
              className="py-2.5 px-3 rounded-xl bg-red-950/40 border border-red-900/50 hover:bg-red-900/60 text-red-300 hover:text-white text-xs font-serif font-bold transition-all flex items-center justify-center space-x-1.5"
              title="Veilig uitloggen uit beheer"
            >
              <LogOut className="w-4 h-4 text-red-400" />
              <span>Uitloggen</span>
            </button>
          </div>

        </div>

      </aside>

      {/* ========================================== */}
      {/* MAIN CONTENT AREA */}
      {/* ========================================== */}
      <div className="flex-1 md:pl-64 lg:pl-72 flex flex-col min-w-0">
        
        {/* Sticky Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#D8CEB8] py-3.5 px-4 sm:px-8 shadow-xs flex items-center justify-between gap-4">
          
          <div className="flex items-center space-x-3">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-xl bg-[#FAF7F2] border border-[#D8CEB8] text-[#111111] md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center space-x-2 text-[11px] font-mono text-[#888888]">
                <span>Beheer</span>
                <ChevronRight className="w-3 h-3 text-[#B8860B]" />
                <span className="text-[#111111] font-bold capitalize">{activeTab}</span>
              </div>
              <h2 className="text-base font-serif font-bold text-[#111111]">
                {activeTab === 'dashboard' && 'Overzicht & Statistieken'}
                {activeTab === 'items' && 'Collectie & Catalogus Beheer'}
                {activeTab === 'inquiries' && 'Binnengekomen Aanvragen'}
                {activeTab === 'customers' && 'Verzamelaars & Klanten Index'}
                {activeTab === 'settings' && 'Beveiligingsinstellingen & PIN'}
              </h2>
            </div>
          </div>

          {/* Quick Header Shortcuts */}
          <div className="flex items-center space-x-2.5">
            <button
              onClick={handleClose}
              className="hidden sm:flex px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-[#D8CEB8] text-[#111111] hover:bg-stone-200 text-xs font-bold transition-all items-center space-x-1.5 shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#B8860B]" />
              <span>Bekijk Live Site</span>
            </button>
          </div>
        </header>

        {/* Dynamic Main Body Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          
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
            <div className="max-w-2xl bg-white border border-[#D8CEB8] rounded-3xl p-6 sm:p-8 shadow-sm">
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
