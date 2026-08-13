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
  X
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
import '../../styles/admin.css';

const VALID_TABS = new Set([
  'dashboard', 'items', 'certificates', 'hero', 'provenance', 'faq',
  'inquiries', 'customers', 'settings'
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
  const toastTimer = useRef(null);

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
  const navItems = [
    { id: 'dashboard', label: 'Overzicht', icon: LayoutDashboard },
    { id: 'items', label: 'Collectie', icon: BookOpen, count: activeItems.length },
    { id: 'certificates', label: 'Certificaten', icon: Award },
    { id: 'hero', label: 'Hero', icon: ImageIcon },
    { id: 'provenance', label: 'Herkomst', icon: ShieldCheck },
    { id: 'faq', label: 'FAQ', icon: HelpCircle },
    { id: 'inquiries', label: 'Aanvragen', icon: Mail, count: newInquiriesCount || undefined },
    { id: 'customers', label: 'Klanten', icon: Users },
    { id: 'settings', label: 'Instellingen', icon: Settings }
  ];
  const tabTitles = {
    dashboard: 'Overzicht',
    items: 'Collectie',
    certificates: 'Certificaten',
    hero: 'Hero-afbeeldingen',
    provenance: 'Herkomstpagina',
    faq: 'Veelgestelde vragen',
    inquiries: 'Aanvragen',
    customers: 'Klanten',
    settings: 'Instellingen'
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
            <span>Admin</span>
          </div>
          <button type="button" className="admin-icon-button admin-sidebar__close" onClick={() => setMobileMenuOpen(false)} aria-label="Menu sluiten">
            <X aria-hidden="true" />
          </button>
        </div>

        <nav className="admin-nav">
          <p className="admin-nav__label">Werkruimte</p>
          {navItems.map(({ id, label, icon: Icon, count }) => (
            <button
              type="button"
              key={id}
              className={`admin-nav__item ${activeTab === id ? 'is-active' : ''}`}
              aria-current={activeTab === id ? 'page' : undefined}
              onClick={() => navigateTo(id)}
            >
              <Icon aria-hidden="true" />
              <span>{label}</span>
              {count !== undefined && <span className="admin-nav__count">{count}</span>}
            </button>
          ))}
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
          <div className="admin-topbar__title">
            <span>Atelier Rembrandt</span>
            <strong>{tabTitles[activeTab]}</strong>
          </div>
          {newInquiriesCount > 0 && activeTab !== 'inquiries' && (
            <button type="button" className="admin-inbox-shortcut" onClick={() => navigateTo('inquiries')}>
              <Mail aria-hidden="true" />
              <span>{newInquiriesCount} nieuw</span>
            </button>
          )}
        </header>

        <main className="admin-content" id="admin-main">
          {activeTab === 'dashboard' && (
            <DashboardOverview
              items={activeItems}
              inquiries={activeInquiries}
              onNavigateTab={navigateTo}
              onCreateNewItem={handleCreateItem}
              onOpenLiveSite={handleClose}
            />
          )}
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
          {activeTab === 'settings' && <SecuritySettings currentUser={currentUser} onShowToast={showToast} />}
        </main>
      </div>

      <ToastNotification toast={toast} onClose={() => setToast(null)} />
      <AdminTooltip />
    </div>
  );
}
