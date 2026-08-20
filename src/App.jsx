import React, { Suspense, lazy, useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { motion, useScroll, useSpring } from 'framer-motion';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import TopstukkenShowcase from './components/TopstukkenShowcase';
import AboutProvenance from './components/AboutProvenance';
import FaqSection from './components/FaqSection';
import Footer from './components/Footer';
import MobileNavbar from './mobile/MobileNavbar';
import MobileHero from './mobile/MobileHero';
import MobileHomeSections from './mobile/MobileHomeSections';
import MobileFooter from './mobile/MobileFooter';
import CollectorListSection from './components/CollectorListSection';
import { useResponsiveMode } from './hooks/useResponsiveMode';
import { getItemSlug, itemMatchesRoute } from './utils/itemSlug';
import { useLanguage } from './context/LanguageContext';
import { applySeoToDocument, buildPageSeo, getPageKind } from './utils/seo';
import { localizePath, stripLanguagePrefix } from './utils/locales';
import { AnalyticsConsentBanner, trackEvent, trackItemCardClicked, useAnalytics } from './hooks/useAnalytics';

const AdminLoginModal = lazy(() => import('./components/admin/AdminLoginModal'));
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));
const CatalogPage = lazy(() => import('./components/CatalogPage'));
const HerkomstPage = lazy(() => import('./components/HerkomstPage'));
const ItemDetailPage = lazy(() => import('./components/ItemDetailPage'));
const PrivacyPage = lazy(() => import('./components/PrivacyPage'));
const TermsPage = lazy(() => import('./components/TermsPage'));
const MobileItemDetailPage = lazy(() => import('./mobile/MobileItemDetailPage'));
const InquiryModal = lazy(() => import('./components/InquiryModal'));

import { 
  getCatalog, 
  fetchCatalogAsync,
  saveCatalogAsync,
  saveItemAsync,
  deleteItemAsync,
  fetchInquiriesAsync,
  getCurrentAdminSessionAsync,
  signOutAdminAsync,
  getHeroImage,
  fetchHeroImageAsync,
  saveHeroImageAsync,
  getMobileHeroImage,
  fetchMobileHeroImageAsync,
  saveMobileHeroImageAsync,
  getProvenanceData,
  fetchProvenanceDataAsync,
  saveProvenanceDataAsync,
  getFaqItems,
  fetchFaqItemsAsync,
  saveFaqItemsAsync
} from './utils/storage';

export default function App() {
  useAnalytics();
  const { isMobile } = useResponsiveMode();
  const { language } = useLanguage();
  const [catalog, setCatalog] = useState(getCatalog());
  const [inquiries, setInquiries] = useState([]);
  const [heroImage, setHeroImage] = useState(getHeroImage());
  const [mobileHeroImage, setMobileHeroImage] = useState(getMobileHeroImage());
  const [provenanceData, setProvenanceData] = useState(getProvenanceData());
  const [faqItems, setFaqItems] = useState(getFaqItems());
  
  const [currentPage, setCurrentPage] = useState('home'); // 'home' | 'catalogus' | 'herkomst' | 'item-detail'
  const [selectedDetailItemId, setSelectedDetailItemId] = useState(null);
  const [transitionItemId, setTransitionItemId] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  
  const [adminLoginOpen, setAdminLoginOpen] = useState(false);
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [adminUser, setAdminUser] = useState(null);

  const handleSaveHeroImage = async (updatedImage) => {
    await saveHeroImageAsync(updatedImage);
    setHeroImage(updatedImage);
  };

  const handleSaveMobileHeroImage = async (updatedImage) => {
    await saveMobileHeroImageAsync(updatedImage);
    setMobileHeroImage(updatedImage);
  };

  const handleSaveProvenance = async (updatedData) => {
    await saveProvenanceDataAsync(updatedData);
    setProvenanceData(updatedData);
  };

  const handleSaveFaqItems = async (updatedItems) => {
    await saveFaqItemsAsync(updatedItems);
    setFaqItems(updatedItems);
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

    fetchHeroImageAsync().then(img => {
      if (img) setHeroImage(img);
    });

    fetchMobileHeroImageAsync().then(img => {
      if (img) setMobileHeroImage(img);
    });

    fetchProvenanceDataAsync().then(pData => {
      if (pData) setProvenanceData(pData);
    });

    fetchFaqItemsAsync().then(faqs => {
      if (faqs) setFaqItems(faqs);
    });

    const checkRoutes = () => {
      const path = stripLanguagePrefix(window.location.pathname).toLowerCase();
      const hash = window.location.hash.toLowerCase().split('?')[0];

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
      } else if (path === '/') {
        setCurrentPage('home');
        setSelectedDetailItemId(null);
        if (hash) {
          setActiveTab(hash.replace('#', ''));
        } else {
          setActiveTab('home');
        }
      } else {
        setCurrentPage('not-found');
        setActiveTab('home');
        setSelectedDetailItemId(null);
      }
    };

    const handleKeyDown = (e) => {
      if ((e.altKey || e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        handleOpenAdmin();
      }
    };

    checkRoutes();

    let sessionCheckActive = true;
    getCurrentAdminSessionAsync().then(async (result) => {
      const path = stripLanguagePrefix(window.location.pathname).toLowerCase();
      const hash = window.location.hash.toLowerCase().split('?')[0];
      const isAdminRoute = path === '/admin' || hash === '#admin';
      if (!sessionCheckActive || !isAdminRoute || !result.success) return;

      setAdminUser(result.user);
      setAdminLoggedIn(true);
      setAdminLoginOpen(false);

      const inqs = await fetchInquiriesAsync();
      if (sessionCheckActive && inqs) setInquiries(inqs);
    });

    window.addEventListener('popstate', checkRoutes);
    window.addEventListener('hashchange', checkRoutes);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      sessionCheckActive = false;
      window.removeEventListener('popstate', checkRoutes);
      window.removeEventListener('hashchange', checkRoutes);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleOpenAdmin = async () => {
    if (window.location.pathname !== '/admin') {
      window.history.pushState({}, '', '/admin');
    }

    const result = await getCurrentAdminSessionAsync();
    if (result.success) {
      setAdminUser(result.user);
      setAdminLoggedIn(true);
      setAdminLoginOpen(false);
      await refreshInquiries();
      return;
    }

    setAdminLoginOpen(true);
  };

  const handleCloseAdmin = () => {
    setAdminLoginOpen(false);
    setAdminLoggedIn(false);
    setAdminUser(null);
    setInquiries([]);
    if (window.location.pathname === '/admin' || window.location.hash === '#admin') {
      window.history.pushState({}, '', localizePath('/', language));
    }
  };

  const handleLogoutAdmin = async () => {
    await signOutAdminAsync();
    setAdminLoggedIn(false);
    setAdminUser(null);
    setInquiries([]);
    if (window.location.pathname === '/admin' || window.location.hash === '#admin') {
      window.history.pushState({}, '', localizePath('/', language));
    }
  };

  const transitionPageChange = (updateStateFn) => {
    if (document.startViewTransition && typeof document.startViewTransition === 'function') {
      return document.startViewTransition(() => {
        flushSync(updateStateFn);
        window.scrollTo(0, 0);
      });
    } else {
      updateStateFn();
      window.scrollTo(0, 0);
      return null;
    }
  };

  const handleOpenItemDetail = (item, placement = 'item_link') => {
    if (!item) return;
    trackItemCardClicked(item, placement);
    const supportsViewTransitions = typeof document.startViewTransition === 'function';
    if (supportsViewTransitions) {
      flushSync(() => setTransitionItemId(item.id));
    }

    const transition = transitionPageChange(() => {
      setSelectedDetailItemId(item.id);
      setCurrentPage('item-detail');
      setActiveTab('catalogus');
    });
    transition?.finished.then(
      () => setTransitionItemId(null),
      () => setTransitionItemId(null)
    );
    const newPath = localizePath(`/collectie/${getItemSlug(item)}`, language);
    if (window.location.pathname !== newPath) {
      window.history.pushState({ page: 'item', id: item.id }, '', newPath);
    }
  };

  const handleNavigate = (targetId) => {
    const returningDetailItemId = currentPage === 'item-detail' ? selectedDetailItemId : null;
    setActiveTab(targetId);
    setSelectedDetailItemId(null);

    if (targetId === 'catalogus' || targetId === 'collectie') {
      const transition = transitionPageChange(() => {
        setCurrentPage('catalogus');
        if (returningDetailItemId) setTransitionItemId(returningDetailItemId);
      });
      transition?.finished.then(
        () => setTransitionItemId(null),
        () => setTransitionItemId(null)
      );
      const collectionPath = localizePath('/collectie', language);
      if (window.location.pathname !== collectionPath) {
        window.history.pushState({ page: 'collectie' }, '', collectionPath);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (targetId === 'herkomst') {
      transitionPageChange(() => {
        setCurrentPage('herkomst');
      });
      const provenancePath = localizePath('/herkomst', language);
      if (window.location.pathname !== provenancePath) {
        window.history.pushState({ page: 'herkomst' }, '', provenancePath);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (targetId === 'privacy') {
      transitionPageChange(() => {
        setCurrentPage('privacy');
      });
      const privacyPath = localizePath('/privacy', language);
      if (window.location.pathname !== privacyPath) {
        window.history.pushState({ page: 'privacy' }, '', privacyPath);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (targetId === 'voorwaarden' || targetId === 'algemene-voorwaarden') {
      transitionPageChange(() => {
        setCurrentPage('voorwaarden');
      });
      const termsPath = localizePath('/voorwaarden', language);
      if (window.location.pathname !== termsPath) {
        window.history.pushState({ page: 'voorwaarden' }, '', termsPath);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (targetId === 'home') {
      transitionPageChange(() => {
        setCurrentPage('home');
      });
      const homePath = localizePath('/', language);
      if (window.location.pathname !== homePath) {
        window.history.pushState({ page: 'home' }, '', homePath);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (targetId === 'topstukken') {
      const cleanPath = localizePath('/topstukken', language);
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
  const [inquiryRequestType, setInquiryRequestType] = useState('general_query');

  const handleOpenConsultation = (
    item = null,
    requestType = item ? 'purchase' : 'general_query',
    placement = 'inquiry_trigger'
  ) => {
    // A single, consistent CTA event covers every public route that opens the
    // inquiry flow. The current page path is captured by the analytics layer.
    trackEvent('cta_clicked', {
      placement,
      target: 'inquiry',
      itemId: item?.id
    });
    setInquiryTargetItem(item);
    setInquiryRequestType(requestType);
    setInquiryModalOpen(true);
  };

  useEffect(() => {
    const selectedItem = catalog.find((item) => itemMatchesRoute(item, selectedDetailItemId));
    const page = getPageKind(window.location.pathname, currentPage);
    const seo = buildPageSeo({
      page,
      item: selectedItem || null,
      language,
      pathname: window.location.pathname,
      items: catalog
    });
    applySeoToDocument(seo);
  }, [catalog, currentPage, language, selectedDetailItemId]);

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
      <Suspense fallback={<div className="min-h-screen bg-[#111111]" aria-label="Beheer laden" />}>
        <AdminDashboard
        items={catalog}
        catalog={catalog}
        inquiries={inquiries}
        heroImage={heroImage}
        mobileHeroImage={mobileHeroImage}
        provenanceData={provenanceData}
        faqItems={faqItems}
        currentUser={adminUser}
        onSaveItem={handleSaveItem}
        onDeleteItem={handleDeleteItem}
        onUpdateInquiries={handleUpdateInquiries}
        onSaveHeroImage={handleSaveHeroImage}
        onSaveMobileHeroImage={handleSaveMobileHeroImage}
        onSaveProvenance={handleSaveProvenance}
        onSaveFaqItems={handleSaveFaqItems}
        onLogout={handleLogoutAdmin}
        onCloseAdmin={handleCloseAdmin}
        onClose={handleCloseAdmin}
        />
      </Suspense>
    );
  }

  if (adminLoginOpen) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-[#111111]" aria-label="Aanmelden laden" />}>
        <AdminLoginModal
        onClose={handleCloseAdmin}
        onLoginSuccess={(user) => {
          setAdminUser(user);
          setAdminLoggedIn(true);
          refreshInquiries();
          fetchCatalogAsync().then(items => { if (items) setCatalog(items); });
        }}
        />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-[#111111] flex flex-col font-sans selection:bg-[#111111]/10 selection:text-[#111111]">
      
      {/* Navigation Header */}
      {isMobile ? (
        <MobileNavbar
          onNavigate={handleNavigate}
          activeTab={activeTab}
          onRequestConsultation={() => handleOpenConsultation(null, 'general_query', 'mobile_navigation')}
        />
      ) : (
        <Navbar
          onNavigate={handleNavigate}
          activeTab={currentPage}
          onRequestConsultation={() => handleOpenConsultation(null, 'general_query', 'navigation')}
        />
      )}

      {/* Main Page Layout */}
      <main className="flex-grow">
        <Suspense fallback={<div className="min-h-[70vh] bg-[#FFFEFC]" aria-label="Pagina laden" />}>
        {currentPage === 'item-detail' ? (
          /* Dedicated High-End Museum Item Detail Page (/collectie/:id) */
          isMobile ? (
            <MobileItemDetailPage
              item={
                catalog.find(
                  i =>
                  itemMatchesRoute(i, selectedDetailItemId)
                ) || null
              }
              catalog={catalog}
              onOpenItemDetail={handleOpenItemDetail}
              onNavigateBack={() => handleNavigate('catalogus')}
              onRequestInquiry={(item) => handleOpenConsultation(item, 'purchase', 'mobile_item_detail')}
            />
          ) : (
            <ItemDetailPage
              item={
                catalog.find(
                  i =>
                  itemMatchesRoute(i, selectedDetailItemId)
                ) || null
              }
              catalog={catalog}
              onOpenItemDetail={handleOpenItemDetail}
              onNavigateBack={() => handleNavigate('catalogus')}
              onRequestInquiry={(item) => handleOpenConsultation(item, 'purchase', 'item_detail')}
            />
          )
        ) : currentPage === 'catalogus' ? (
          /* Dedicated Luxury Catalog Page (/collectie) */
          <CatalogPage
            items={catalog}
            transitionItemId={transitionItemId}
            onNavigateHome={() => handleNavigate('home')}
            onOpenItemDetail={handleOpenItemDetail}
          />
        ) : currentPage === 'herkomst' ? (
          /* Dedicated Luxury Herkomst & Provenance Page (/herkomst) */
          <HerkomstPage
            provenanceData={provenanceData}
            faqItems={faqItems}
            onNavigateHome={() => handleNavigate('home')}
            onRequestConsultation={() => handleOpenConsultation(null, 'general_query', 'provenance')}
          />
        ) : currentPage === 'privacy' ? (
          /* Production-Ready Privacy Policy Page (/privacy) */
          <PrivacyPage
            onNavigateHome={() => handleNavigate('home')}
            onRequestConsultation={() => handleOpenConsultation(null, 'general_query', 'privacy')}
          />
        ) : currentPage === 'voorwaarden' ? (
          /* Production-Ready Terms & Conditions Page (/voorwaarden) */
          <TermsPage
            onNavigateHome={() => handleNavigate('home')}
            onRequestConsultation={() => handleOpenConsultation(null, 'general_query', 'terms')}
          />
        ) : currentPage === 'not-found' ? (
          <section className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-6 pt-28 text-center">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.24em] text-[#8A6A25]">404</p>
            <h1 className="font-serif text-4xl font-bold text-[#111111] sm:text-5xl">Pagina niet gevonden</h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-[#666666]">
              Deze pagina bestaat niet meer of het adres is niet correct.
            </p>
            <button
              type="button"
              onClick={() => handleNavigate('home')}
              className="mt-8 rounded-sm bg-[#1C1A17] px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#B8860B]"
            >
              Terug naar home
            </button>
          </section>
        ) : (
          /* Pure Storytelling Homepage */
          <>
            {/* Full-Width Hero Entry */}
            {isMobile ? (
              <MobileHero
                heroImage={heroImage}
                mobileHeroImage={mobileHeroImage}
                onExploreCatalog={() => handleNavigate('catalogus')}
                onRequestConsultation={() => handleOpenConsultation(null, 'general_query', 'mobile_hero')}
              />
            ) : (
              <Hero
                heroImage={heroImage}
                onExploreCatalog={() => handleNavigate('catalogus')}
                onRequestConsultation={() => handleOpenConsultation(null, 'general_query', 'hero')}
              />
            )}

            {isMobile ? (
              <MobileHomeSections
                items={catalog}
                faqItems={faqItems}
                onOpenFullCatalog={() => handleNavigate('catalogus')}
                onOpenItemDetail={handleOpenItemDetail}
                onNavigateProvenance={() => handleNavigate('herkomst')}
                onRequestConsultation={() => handleOpenConsultation(null, 'general_query', 'mobile_home')}
              />
            ) : (
              <>
                {/* Dynamic Recent Aanwinsten & Topstukken Showcase (CMS Controlled via 'featured' toggle) */}
                <TopstukkenShowcase
                  items={catalog}
                  transitionItemId={transitionItemId}
                  onOpenFullCatalog={() => handleNavigate('catalogus')}
                  onOpenItemDetail={handleOpenItemDetail}
                />

                <CollectorListSection source="homepage_desktop" />

                {/* Museum Herkomst & Provenance Showcase */}
                <AboutProvenance />

                {/* Interactive Collector FAQ Section */}
                <FaqSection
                  items={faqItems}
                  onRequestConsultation={() => handleOpenConsultation(null, 'general_query', 'faq')}
                />
              </>
            )}
          </>
        )}
        </Suspense>
      </main>

      {/* Footer */}
      {isMobile ? (
        <MobileFooter onNavigate={handleNavigate} />
      ) : (
        <Footer
          onNavigate={handleNavigate}
          onRequestConsultation={() => handleOpenConsultation(null, 'general_query', 'footer')}
        />
      )}

      {/* Inquiry Modal */}
      {inquiryModalOpen && (
        <Suspense fallback={null}>
          <InquiryModal
            item={inquiryTargetItem}
            catalog={catalog}
            initialRequestType={inquiryRequestType}
            onClose={() => setInquiryModalOpen(false)}
            onSuccess={refreshInquiries}
          />
        </Suspense>
      )}

      <AnalyticsConsentBanner />
    </div>
  );
}
