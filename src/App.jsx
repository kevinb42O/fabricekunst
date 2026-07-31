import React, { useState, useEffect } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import TopstukkenShowcase from './components/TopstukkenShowcase';
import AboutProvenance from './components/AboutProvenance';
import FaqSection from './components/FaqSection';
import CatalogPage from './components/CatalogPage';
import HerkomstPage from './components/HerkomstPage';
import ItemDetailPage from './components/ItemDetailPage';
import PrivacyPage from './components/PrivacyPage';
import TermsPage from './components/TermsPage';
import Footer from './components/Footer';
import InquiryModal from './components/InquiryModal';
import AdminLoginModal from './components/admin/AdminLoginModal';
import AdminDashboard from './components/admin/AdminDashboard';

import { 
  getCatalog, 
  fetchCatalogAsync,
  saveCatalogAsync,
  saveItemAsync,
  deleteItemAsync,
  getInquiries, 
  fetchInquiriesAsync,
  getHeroImage,
  fetchHeroImageAsync,
  saveHeroImageAsync,
  getHeroSlides,
  fetchHeroSlidesAsync,
  saveHeroSlidesAsync,
  getProvenanceData,
  fetchProvenanceDataAsync,
  saveProvenanceDataAsync,
  getFaqItems,
  fetchFaqItemsAsync,
  saveFaqItemsAsync
} from './utils/storage';

export default function App() {
  const [catalog, setCatalog] = useState(getCatalog());
  const [inquiries, setInquiries] = useState(getInquiries());
  const [heroImage, setHeroImage] = useState(getHeroImage());
  const [heroSlides, setHeroSlides] = useState(getHeroSlides());
  const [provenanceData, setProvenanceData] = useState(getProvenanceData());
  const [faqItems, setFaqItems] = useState(getFaqItems());
  
  const [currentPage, setCurrentPage] = useState('home'); // 'home' | 'catalogus' | 'herkomst' | 'item-detail'
  const [selectedDetailItemId, setSelectedDetailItemId] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  
  const [adminLoginOpen, setAdminLoginOpen] = useState(false);
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [adminUser, setAdminUser] = useState(null);

  const handleSaveHeroImage = async (updatedImage) => {
    setHeroImage(updatedImage);
    await saveHeroImageAsync(updatedImage);
  };

  const handleSaveHeroSlides = async (updatedSlides) => {
    if (typeof updatedSlides === 'string') {
      await handleSaveHeroImage(updatedSlides);
    } else {
      setHeroSlides(updatedSlides);
      await saveHeroSlidesAsync(updatedSlides);
    }
  };

  const handleSaveProvenance = async (updatedData) => {
    setProvenanceData(updatedData);
    await saveProvenanceDataAsync(updatedData);
  };

  const handleSaveFaqItems = async (updatedItems) => {
    setFaqItems(updatedItems);
    await saveFaqItemsAsync(updatedItems);
  };

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

    fetchHeroImageAsync().then(img => {
      if (img) setHeroImage(img);
    });

    fetchHeroSlidesAsync().then(slides => {
      if (slides) setHeroSlides(slides);
    });

    fetchProvenanceDataAsync().then(pData => {
      if (pData) setProvenanceData(pData);
    });

    fetchFaqItemsAsync().then(faqs => {
      if (faqs) setFaqItems(faqs);
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
      } else if (path === '/privacy' || hash === '#privacy') {
        setCurrentPage('privacy');
        setActiveTab('privacy');
        setSelectedDetailItemId(null);
      } else if (path === '/voorwaarden' || path === '/algemene-voorwaarden' || hash === '#voorwaarden' || hash === '#algemene-voorwaarden') {
        setCurrentPage('voorwaarden');
        setActiveTab('voorwaarden');
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

    const handleKeyDown = (e) => {
      if ((e.altKey || e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        handleOpenAdmin();
      }
    };

    checkRoutes();

    window.addEventListener('popstate', checkRoutes);
    window.addEventListener('hashchange', checkRoutes);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('popstate', checkRoutes);
      window.removeEventListener('hashchange', checkRoutes);
      window.removeEventListener('keydown', handleKeyDown);
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

  const transitionPageChange = (updateStateFn) => {
    if (document.startViewTransition && typeof document.startViewTransition === 'function') {
      document.startViewTransition(() => {
        updateStateFn();
        window.scrollTo(0, 0);
      });
    } else {
      updateStateFn();
      window.scrollTo(0, 0);
    }
  };

  const handleOpenItemDetail = (item) => {
    if (!item) return;
    transitionPageChange(() => {
      setSelectedDetailItemId(item.id);
      setCurrentPage('item-detail');
      setActiveTab('catalogus');
    });
    const newPath = `/collectie/${item.id}`;
    if (window.location.pathname !== newPath) {
      window.history.pushState({ page: 'item', id: item.id }, '', newPath);
    }
  };

  const handleNavigate = (targetId) => {
    setActiveTab(targetId);
    setSelectedDetailItemId(null);

    if (targetId === 'catalogus' || targetId === 'collectie') {
      transitionPageChange(() => {
        setCurrentPage('catalogus');
      });
      if (window.location.pathname !== '/collectie') {
        window.history.pushState({ page: 'collectie' }, '', '/collectie');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (targetId === 'herkomst') {
      transitionPageChange(() => {
        setCurrentPage('herkomst');
      });
      if (window.location.pathname !== '/herkomst') {
        window.history.pushState({ page: 'herkomst' }, '', '/herkomst');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (targetId === 'privacy') {
      transitionPageChange(() => {
        setCurrentPage('privacy');
      });
      if (window.location.pathname !== '/privacy') {
        window.history.pushState({ page: 'privacy' }, '', '/privacy');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (targetId === 'voorwaarden' || targetId === 'algemene-voorwaarden') {
      transitionPageChange(() => {
        setCurrentPage('voorwaarden');
      });
      if (window.location.pathname !== '/voorwaarden') {
        window.history.pushState({ page: 'voorwaarden' }, '', '/voorwaarden');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (targetId === 'home') {
      transitionPageChange(() => {
        setCurrentPage('home');
      });
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
        transitionPageChange(() => {
          setCurrentPage('home');
        });
        setTimeout(scrollToTarget, 150);
      } else {
        scrollToTarget();
      }
      return;
    }

    // Default section fallback
    if (currentPage !== 'home') {
      transitionPageChange(() => {
        setCurrentPage('home');
      });
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
    const res = await saveItemAsync(itemToSave);
    if (res) {
      const catalogData = Array.isArray(res) ? res : (res.catalog || res);
      setCatalog(catalogData);
    }
    return res;
  };

  const handleDeleteItem = async (idToDelete) => {
    const res = await deleteItemAsync(idToDelete);
    if (res) {
      const catalogData = Array.isArray(res) ? res : (res.catalog || res);
      setCatalog(catalogData);
    }
    return res;
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

  // Dedicated Admin Screen Mode
  if (adminLoggedIn) {
    return (
      <AdminDashboard
        items={catalog}
        catalog={catalog}
        inquiries={inquiries}
        heroImage={heroImage}
        heroSlides={heroSlides}
        provenanceData={provenanceData}
        faqItems={faqItems}
        currentUser={adminUser}
        onSaveItem={handleSaveItem}
        onDeleteItem={handleDeleteItem}
        onUpdateInquiries={handleUpdateInquiries}
        onSaveHeroImage={handleSaveHeroImage}
        onSaveHeroSlides={handleSaveHeroSlides}
        onSaveProvenance={handleSaveProvenance}
        onSaveFaqItems={handleSaveFaqItems}
        onLogout={handleLogoutAdmin}
        onCloseAdmin={handleCloseAdmin}
        onClose={handleCloseAdmin}
      />
    );
  }

  if (adminLoginOpen) {
    return (
      <AdminLoginModal
        onClose={handleCloseAdmin}
        onLoginSuccess={(user) => {
          setAdminUser(user);
          setAdminLoggedIn(true);
          refreshInquiries();
          fetchCatalogAsync().then(items => { if (items) setCatalog(items); });
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-[#111111] flex flex-col font-sans selection:bg-[#111111]/10 selection:text-[#111111]">
      
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
              ) || null
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
            provenanceData={provenanceData}
            faqItems={faqItems}
            onNavigateHome={() => handleNavigate('home')}
            onRequestConsultation={() => handleOpenConsultation(null)}
          />
        ) : currentPage === 'privacy' ? (
          /* Production-Ready Privacy Policy Page (/privacy) */
          <PrivacyPage
            onNavigateHome={() => handleNavigate('home')}
            onRequestConsultation={() => handleOpenConsultation(null)}
          />
        ) : currentPage === 'voorwaarden' ? (
          /* Production-Ready Terms & Conditions Page (/voorwaarden) */
          <TermsPage
            onNavigateHome={() => handleNavigate('home')}
            onRequestConsultation={() => handleOpenConsultation(null)}
          />
        ) : (
          /* Pure Storytelling Homepage */
          <>
            {/* Full-Width Hero Entry */}
            <Hero
              heroImage={heroImage}
              slides={heroSlides}
              onExploreCatalog={() => handleNavigate('catalogus')}
              onRequestConsultation={() => handleOpenConsultation(null)}
            />

            {/* Dynamic Recent Aanwinsten & Topstukken Showcase (CMS Controlled via 'featured' toggle) */}
            <TopstukkenShowcase
              items={catalog}
              onOpenFullCatalog={() => handleNavigate('catalogus')}
              onOpenItemDetail={handleOpenItemDetail}
              onRequestInquiry={(item) => handleOpenConsultation(item)}
            />

            {/* Museum Herkomst & Provenance Showcase */}
            <AboutProvenance
              onRequestConsultation={() => handleOpenConsultation(null)}
            />

            {/* Interactive Collector FAQ Section */}
            <FaqSection
              items={faqItems}
              onRequestConsultation={() => handleOpenConsultation(null)}
            />
          </>
        )}

      </main>

      {/* Footer */}
      <Footer
        onNavigate={handleNavigate}
        onRequestConsultation={() => handleOpenConsultation(null)}
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

    </div>
  );
}
