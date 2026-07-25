import React, { useState, useEffect } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import VoltaireSection from './components/VoltaireSection';
import ScarronSection from './components/ScarronSection';
import CatalogTeaser from './components/CatalogTeaser';
import CatalogPage from './components/CatalogPage';
import HerkomstPage from './components/HerkomstPage';
import ItemDetailPage from './components/ItemDetailPage';
import Footer from './components/Footer';
import InquiryModal from './components/InquiryModal';
import AdminLoginModal from './components/admin/AdminLoginModal';
import AdminDashboard from './components/admin/AdminDashboard';
import { 
  getCatalog, 
  fetchCatalogAsync, 
  saveItemAsync, 
  deleteItemAsync, 
  getInquiries, 
  fetchInquiriesAsync 
} from './utils/storage';

export default function App() {
  const [catalog, setCatalog] = useState(getCatalog());
  const [inquiries, setInquiries] = useState(getInquiries());
  
  const [currentPage, setCurrentPage] = useState('home'); // 'home' | 'catalogus' | 'herkomst' | 'item-detail'
  const [selectedDetailItemId, setSelectedDetailItemId] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  
  const [adminLoginOpen, setAdminLoginOpen] = useState(false);
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [adminUser, setAdminUser] = useState(null);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    // Initial fetch from Supabase (with fallback to local storage)
    fetchCatalogAsync().then(items => {
      if (items && items.length > 0) setCatalog(items);
    });

    fetchInquiriesAsync().then(inqs => {
      if (inqs) setInquiries(inqs);
    });

    const checkRoutes = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();

      if (path === '/admin' || hash === '#admin') {
        setAdminLoginOpen(true);
      } else if (path.startsWith('/collectie/') || path.startsWith('/item/')) {
        const itemId = path.replace('/collectie/', '').replace('/item/', '');
        if (itemId) {
          setSelectedDetailItemId(itemId);
          setCurrentPage('item-detail');
          setActiveTab('catalogus');
        } else {
          setCurrentPage('catalogus');
          setActiveTab('catalogus');
        }
      } else if (path === '/collectie' || path === '/catalogus' || hash === '#collectie' || hash === '#catalogus') {
        setCurrentPage('catalogus');
        setActiveTab('catalogus');
        setSelectedDetailItemId(null);
      } else if (path === '/herkomst' || hash === '#herkomst') {
        setCurrentPage('herkomst');
        setActiveTab('herkomst');
        setSelectedDetailItemId(null);
      } else if (path === '/topstukken' || hash === '#topstukken') {
        setCurrentPage('home');
        setActiveTab('topstukken');
        setSelectedDetailItemId(null);
        setTimeout(() => {
          const el = document.getElementById('topstukken');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      } else {
        setCurrentPage('home');
        setSelectedDetailItemId(null);
        if (hash) {
          setActiveTab(hash.replace('#', ''));
        } else {
          setActiveTab('home');
        }
      }
    };

    checkRoutes();

    window.addEventListener('popstate', checkRoutes);
    window.addEventListener('hashchange', checkRoutes);
    return () => {
      window.removeEventListener('popstate', checkRoutes);
      window.removeEventListener('hashchange', checkRoutes);
    };
  }, []);

  const handleOpenAdmin = () => {
    setAdminLoginOpen(true);
    if (window.location.pathname !== '/admin') {
      window.history.pushState({}, '', '/admin');
    }
  };

  const handleCloseAdmin = () => {
    setAdminLoginOpen(false);
    setAdminLoggedIn(false);
    if (window.location.pathname === '/admin' || window.location.hash === '#admin') {
      window.history.pushState({}, '', '/');
    }
  };

  const handleLogoutAdmin = () => {
    setAdminLoggedIn(false);
    if (window.location.pathname === '/admin' || window.location.hash === '#admin') {
      window.history.pushState({}, '', '/');
    }
  };

  const handleOpenItemDetail = (item) => {
    if (!item) return;
    setSelectedDetailItemId(item.id);
    setCurrentPage('item-detail');
    setActiveTab('catalogus');
    const newPath = `/collectie/${item.id}`;
    if (window.location.pathname !== newPath) {
      window.history.pushState({ page: 'item', id: item.id }, '', newPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (targetId) => {
    setActiveTab(targetId);
    setSelectedDetailItemId(null);

    if (targetId === 'catalogus' || targetId === 'collectie') {
      setCurrentPage('catalogus');
      if (window.location.pathname !== '/collectie') {
        window.history.pushState({ page: 'collectie' }, '', '/collectie');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (targetId === 'herkomst') {
      setCurrentPage('herkomst');
      if (window.location.pathname !== '/herkomst') {
        window.history.pushState({ page: 'herkomst' }, '', '/herkomst');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (targetId === 'home') {
      setCurrentPage('home');
      if (window.location.pathname !== '/') {
        window.history.pushState({ page: 'home' }, '', '/');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (targetId === 'topstukken') {
      const cleanPath = '/topstukken';
      if (window.location.pathname !== cleanPath) {
        window.history.pushState({ page: 'home', route: targetId }, '', cleanPath);
      }

      const scrollToTarget = () => {
        const el = document.getElementById('topstukken');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      };

      if (currentPage !== 'home') {
        setCurrentPage('home');
        setTimeout(scrollToTarget, 150);
      } else {
        scrollToTarget();
      }
      return;
    }

    // Default section fallback
    if (currentPage !== 'home') {
      setCurrentPage('home');
      setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } else {
      const el = document.getElementById(targetId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSaveItem = async (itemToSave) => {
    const updated = await saveItemAsync(itemToSave);
    if (updated) setCatalog(updated);
  };

  const handleDeleteItem = async (idToDelete) => {
    const updated = await deleteItemAsync(idToDelete);
    if (updated) setCatalog(updated);
  };

  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [inquiryTargetItem, setInquiryTargetItem] = useState(null);

  const handleOpenConsultation = (item = null) => {
    setInquiryTargetItem(item);
    setInquiryModalOpen(true);
  };

  const refreshInquiries = async () => {
    const inqs = await fetchInquiriesAsync();
    if (inqs) setInquiries(inqs);
  };

  const handleUpdateInquiries = (updatedInquiries) => {
    setInquiries(updatedInquiries);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#111111] flex flex-col font-sans selection:bg-[#B8860B]/20 selection:text-[#B8860B]">
      
      {/* High-End Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#8E7035] transform-origin-left z-[100] pointer-events-none"
        style={{ scaleX }}
      />

      {/* Navigation Header */}
      <Navbar
        onNavigate={handleNavigate}
        activeTab={currentPage}
        onRequestConsultation={() => handleOpenConsultation(null)}
      />

      {/* Main Page Layout */}
      <main className="flex-grow">
        
        {currentPage === 'item-detail' ? (
          /* Dedicated High-End Museum Item Detail Page (/collectie/:id) */
          <ItemDetailPage
            item={
              catalog.find(
                i =>
                  i.id === selectedDetailItemId ||
                  i.id?.toLowerCase() === selectedDetailItemId?.toLowerCase() ||
                  i.ref?.toLowerCase() === selectedDetailItemId?.toLowerCase()
              ) || catalog[0]
            }
            catalog={catalog}
            onOpenItemDetail={handleOpenItemDetail}
            onNavigateBack={() => handleNavigate('catalogus')}
            onRequestInquiry={(item) => handleOpenConsultation(item)}
          />
        ) : currentPage === 'catalogus' ? (
          /* Dedicated Luxury Catalog Page (/collectie) */
          <CatalogPage
            items={catalog}
            onNavigateHome={() => handleNavigate('home')}
            onOpenItemDetail={handleOpenItemDetail}
            onRequestInquiry={(item) => handleOpenConsultation(item)}
          />
        ) : currentPage === 'herkomst' ? (
          /* Dedicated Luxury Herkomst & Provenance Page (/herkomst) */
          <HerkomstPage
            onNavigateHome={() => handleNavigate('home')}
            onRequestConsultation={() => handleOpenConsultation(null)}
          />
        ) : (
          /* Pure Storytelling Homepage */
          <>
            {/* Full-Width Hero Entry */}
            <Hero
              onExploreCatalog={() => handleNavigate('catalogus')}
              onRequestConsultation={() => handleOpenConsultation(null)}
            />

            {/* Monumental Section 1: Voltaire 52-delige Reeks (1829-1833) */}
            <VoltaireSection
              item={catalog.find(i => i.id === 'voltaire-1829-52delig')}
              onInquirySuccess={refreshInquiries}
              onOpenItemDetail={handleOpenItemDetail}
              onRequestInquiry={(item) => handleOpenConsultation(item)}
            />

            {/* Monumental Section 2: Scarron 1713 Edition */}
            <ScarronSection
              item={catalog.find(i => i.id === 'scarron-1713-oeuvres')}
              onInquirySuccess={refreshInquiries}
              onOpenItemDetail={handleOpenItemDetail}
              onRequestInquiry={(item) => handleOpenConsultation(item)}
            />

            {/* Clean Editorial Homepage Teaser */}
            <CatalogTeaser
              items={catalog}
              onOpenFullCatalog={() => handleNavigate('catalogus')}
              onOpenItemDetail={handleOpenItemDetail}
              onRequestInquiry={(item) => handleOpenConsultation(item)}
            />
          </>
        )}

      </main>

      {/* Footer */}
      <Footer
        onNavigate={handleNavigate}
        onRequestConsultation={() => handleOpenConsultation(null)}
        onOpenAdmin={handleOpenAdmin}
      />

      {/* Inquiry Modal */}
      {inquiryModalOpen && (
        <InquiryModal
          item={inquiryTargetItem}
          catalog={catalog}
          onClose={() => setInquiryModalOpen(false)}
          onSuccess={refreshInquiries}
        />
      )}

      {/* CMS Admin Modals */}
      {adminLoginOpen && !adminLoggedIn && (
        <AdminLoginModal
          onClose={handleCloseAdmin}
          onLoginSuccess={(user) => {
            setAdminUser(user);
            setAdminLoggedIn(true);
            refreshInquiries();
            fetchCatalogAsync().then(items => { if (items) setCatalog(items); });
          }}
        />
      )}

      {adminLoggedIn && (
        <AdminDashboard
          items={catalog}
          catalog={catalog}
          inquiries={inquiries}
          currentUser={adminUser}
          onSaveItem={handleSaveItem}
          onDeleteItem={handleDeleteItem}
          onUpdateInquiries={handleUpdateInquiries}
          onLogout={handleLogoutAdmin}
          onCloseAdmin={handleCloseAdmin}
          onClose={handleCloseAdmin}
        />
      )}

    </div>
  );
}
