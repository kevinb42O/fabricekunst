import React, { useState } from 'react';
import { LogOut, BookOpen, Mail, ExternalLink, Settings, X } from 'lucide-react';
import ItemManager from './ItemManager';
import InquiriesManager from './InquiriesManager';
import SecuritySettings from './SecuritySettings';
import ToastNotification from './ToastNotification';

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

  const [activeTab, setActiveTab] = useState('items'); // 'items' | 'inquiries'
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3500);
  };

  const newInquiriesCount = activeInquiries.filter(i => i && i.status === 'Nieuw').length;

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF7F2] overflow-y-auto text-[#111111] font-sans selection:bg-[#B8860B]/20 selection:text-[#B8860B]">
      
      {/* Sleek Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#D8CEB8] py-3.5 px-4 sm:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo & Portal Title */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-[#111111] flex items-center justify-center shadow-md">
              <span className="font-serif font-bold text-lg text-white">F</span>
            </div>
            <div>
              <h1 className="text-base font-serif font-bold text-[#111111] leading-tight">
                Fabrice Atelier
              </h1>
              <span className="text-[10px] font-mono text-[#666666] tracking-wider block">
                Beheersysteem
              </span>
            </div>
          </div>

          {/* Center Navigation Switcher (Minimal & Clean) */}
          <div className="flex items-center space-x-1.5 p-1 rounded-2xl bg-[#FAF7F2] border border-[#D8CEB8]">
            <button
              onClick={() => setActiveTab('items')}
              className={`px-5 py-2 rounded-xl text-xs font-serif font-bold transition-all flex items-center space-x-2 ${
                activeTab === 'items'
                  ? 'bg-[#111111] text-white shadow-md'
                  : 'text-[#555555] hover:text-[#111111]'
              }`}
            >
              <BookOpen className="w-4 h-4 text-[#D4AF37]" />
              <span>Collectie</span>
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === 'items' ? 'bg-white/20 text-white' : 'bg-stone-200 text-[#555555]'
              }`}>
                {activeItems.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('inquiries')}
              className={`px-5 py-2 rounded-xl text-xs font-serif font-bold transition-all flex items-center space-x-2 relative ${
                activeTab === 'inquiries'
                  ? 'bg-[#111111] text-white shadow-md'
                  : 'text-[#555555] hover:text-[#111111]'
              }`}
            >
              <Mail className="w-4 h-4 text-[#D4AF37]" />
              <span>Aanvragen</span>
              {newInquiriesCount > 0 ? (
                <span className="px-1.5 py-0.5 rounded-full bg-[#B8860B] text-white text-[10px] font-mono font-bold animate-pulse">
                  {newInquiriesCount} nieuw
                </span>
              ) : (
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === 'inquiries' ? 'bg-white/20 text-white' : 'bg-stone-200 text-[#555555]'
                }`}>
                  {activeInquiries.length}
                </span>
              )}
            </button>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#D8CEB8] text-[#111111] hover:bg-stone-200 transition-colors"
              title="PIN & Beveiligingsinstellingen"
            >
              <Settings className="w-4 h-4 text-[#B8860B]" />
            </button>

            <button
              onClick={handleClose}
              className="px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-[#D8CEB8] text-[#111111] hover:bg-stone-200 text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm"
              title="Sluit beheer en bekijk live site"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#B8860B]" />
              <span className="hidden sm:inline">Bekijk Website</span>
            </button>

            <button
              onClick={onLogout}
              className="px-3.5 py-2 rounded-xl bg-[#111111] text-white hover:bg-stone-800 text-xs font-bold transition-colors flex items-center space-x-1.5 shadow-md"
            >
              <LogOut className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Uitloggen</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Content Area (Clean, uncluttered) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
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

      </main>

      {/* Settings Modal (PIN Management) */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-white border-2 border-[#D8CEB8] rounded-3xl p-6 sm:p-8 shadow-strong space-y-6">
            <div className="flex items-center justify-between border-b border-[#D8CEB8] pb-4">
              <h3 className="text-lg font-serif font-bold text-[#111111]">Beveiliging & PIN Instellingen</h3>
              <button
                onClick={() => setSettingsOpen(false)}
                className="p-2 rounded-full bg-[#FAF7F2] text-[#111111] hover:bg-stone-200 border border-[#D8CEB8]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <SecuritySettings currentUser={currentUser} onShowToast={showToast} />
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      <ToastNotification
        message={toastMessage}
        onClose={() => setToastMessage('')}
      />

    </div>
  );
}
