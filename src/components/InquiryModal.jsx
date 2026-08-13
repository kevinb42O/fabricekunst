import React, { useState, useEffect, useId, useRef } from 'react';
import { X, ChevronDown, Check, AlertCircle, CheckCircle2 } from 'lucide-react';
import { saveInquiryAsync } from '../utils/storage';
import { useLanguage } from '../context/LanguageContext';
import { getItemField, getLocalizedPrice } from '../utils/translationService';
import { useResponsiveMode } from '../hooks/useResponsiveMode';

export default function InquiryModal({ item, catalog = [], initialRequestType = 'general_query', onClose, onSuccess }) {
  const { t, language } = useLanguage();
  const { isMobile } = useResponsiveMode();
  const dialogRef = useRef(null);
  const previouslyFocusedRef = useRef(null);
  const titleId = useId();

  const allRequestTypes = [
    { key: 'private_viewing', label: t('inquiry.tabViewing'), fullTitle: t('inquiry.optPrivateViewing') },
    { key: 'make_offer', label: t('inquiry.tabOffer'), fullTitle: t('inquiry.optMakeOffer') },
    { key: 'request_photos', label: t('inquiry.tabPhotos'), fullTitle: t('inquiry.optPhotos') },
    { key: 'general_query', label: t('inquiry.tabGeneral'), fullTitle: t('inquiry.optGeneral') },
  ];
  const REQUEST_TYPES = isMobile
    ? allRequestTypes.filter(({ key }) => key !== 'request_photos')
    : allRequestTypes;

  const [activeTabKey, setActiveTabKey] = useState(initialRequestType);
  const [selectedItemId, setSelectedItemId] = useState(item ? item.id : 'none');
  const [selectedItem, setSelectedItem] = useState(item || null);
  const [itemDropdownOpen, setItemDropdownOpen] = useState(false);
  const [itemSearchQuery, setItemSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    contactPref: 'email',
    message: ''
  });

  const [contactPref, setContactPref] = useState('email');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (item) {
      setSelectedItemId(item.id);
      setSelectedItem(item);
    }
  }, [item]);

  useEffect(() => {
    const originalStyle = document.body.style.overflow;
    previouslyFocusedRef.current = document.activeElement;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key !== 'Tab' || !dialogRef.current) return;

      const focusable = [...dialogRef.current.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
      )];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const focusTimer = window.setTimeout(() => {
      dialogRef.current?.querySelector('button')?.focus();
    }, 0);
    return () => {
      document.body.style.overflow = originalStyle;
      window.removeEventListener('keydown', handleKeyDown);
      window.clearTimeout(focusTimer);
      previouslyFocusedRef.current?.focus?.();
    };
  }, [onClose]);

  const handleItemSelect = (catItem) => {
    if (!catItem || catItem.id === 'none') {
      setSelectedItemId('none');
      setSelectedItem(null);
    } else {
      setSelectedItemId(catItem.id);
      setSelectedItem(catItem);
    }
    setItemDropdownOpen(false);
    setItemSearchQuery('');
  };

  const isEmailValid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isNameValid = (name) => name.trim().length >= 2;
  const isMessageValid = (msg) => msg.trim().length >= 3;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!isNameValid(formData.name)) {
      setErrorMessage(t('inquiry.errNameRequired'));
      return;
    }
    if (!isEmailValid(formData.email)) {
      setErrorMessage(t('inquiry.errEmailInvalid'));
      return;
    }
    if ((contactPref === 'phone' || contactPref === 'whatsapp') && (!formData.phone || formData.phone.trim().length < 6)) {
      setErrorMessage(t('inquiry.errPhoneRequired'));
      return;
    }
    if (!isMessageValid(formData.message)) {
      setErrorMessage(t('inquiry.errMessageRequired'));
      return;
    }

    setLoading(true);

    const activeTab = REQUEST_TYPES.find(t => t.key === activeTabKey);
    const typeTitle = activeTab ? activeTab.fullTitle : t('inquiry.modalTitle');

    const payload = {
      itemTitle: selectedItem ? getItemField(selectedItem, 'title', language) : "Algemene Consultatie & Herkomstonderzoek",
      itemRef: selectedItem ? selectedItem.ref : "FB-CONSULT",
      name: formData.name,
      email: formData.email,
      phone: formData.phone || '',
      type: `${typeTitle} (Voorkeur: ${contactPref.toUpperCase()})`,
      message: formData.message
    };

    try {
      await saveInquiryAsync(payload);
      setSubmitted(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Fout bij opslaan aanvraag:", err);
      setErrorMessage(t('inquiry.errSubmit'));
    } finally {
      setLoading(false);
    }
  };

  const filteredCatalog = catalog.filter(catItem => {
    if (!itemSearchQuery.trim()) return true;
    const query = itemSearchQuery.toLowerCase();
    const title = getItemField(catItem, 'title', language).toLowerCase();
    const ref = (catItem.ref || '').toLowerCase();
    const author = (catItem.author || '').toLowerCase();
    return title.includes(query) || ref.includes(query) || author.includes(query);
  });

  return (
    <div 
      className="fixed inset-0 z-[90] overflow-hidden bg-[#FAF8F5]/90 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 lg:p-6 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Brede container geoptimaliseerd voor desktop zonder scrollen */}
      <div 
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full h-[100dvh] sm:h-auto max-w-3xl bg-white border-0 sm:border border-[#C5BCAE] rounded-none sm:rounded-2xl shadow-[0_20px_60px_-15px_rgba(184,134,11,0.12)] overflow-hidden flex flex-col text-[#111111] max-h-none sm:max-h-[96vh] lg:max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between min-h-16 px-4 sm:px-6 py-2.5 sm:py-3.5 border-b border-[#E5E0D5] bg-[#FCFBF9] shrink-0">
          <div className="flex flex-col items-start">
            <img 
              src="/images/Atelier Rembrandt.png" 
              alt="Atelier Rembrandt" 
              className="h-7 sm:h-8 w-auto object-contain filter contrast-[1.05]"
            />
            <span id={titleId} className="text-[11px] tracking-[0.20em] text-[#8E7035] uppercase font-serif font-bold mt-0.5">
              {t('inquiry.modalTitle')}
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label={t('inquiry.closeBtn')}
            className="w-11 h-11 sm:w-8 sm:h-8 rounded-full border border-[#C5BCAE] hover:border-[#111111] text-[#111111] flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto overscroll-contain flex-1 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:p-6 lg:p-7">
          {submitted ? (
            /* Post-Submission Reception Screen */
            <div className="py-8 px-4 max-w-md mx-auto text-center space-y-5 animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-[#FAF7F0] border-2 border-[#B8860B] text-[#B8860B] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-2xl font-serif font-bold text-[#111111]">
                  {t('inquiry.successTitle')}
                </h3>
              </div>

              <p className="text-sm text-[#333333] font-serif leading-relaxed italic">
                {t('inquiry.successDesc')}
              </p>

              <button
                onClick={onClose}
                className="px-8 py-3 rounded-lg bg-[#FAF7F0] hover:bg-[#111111] text-[#111111] hover:text-white font-sans text-xs sm:text-sm uppercase tracking-[0.2em] font-bold border-2 border-[#B8860B] transition-all duration-300 cursor-pointer"
              >
                {t('inquiry.close')}
              </button>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto">
              <div className="space-y-3.5">
                {item && (
                  <div className="border-b border-[#D8CEB8] pb-3">
                    <strong className="mt-1 block line-clamp-2 font-serif text-base leading-snug text-[#111111]">
                      {getItemField(item, 'title', language)}
                    </strong>
                    <span className="mt-1 block font-serif text-sm text-[#655B50]">
                      {[item.author, item.year].filter(Boolean).join(' · ')}
                    </span>
                  </div>
                )}
                
                {/* Type Aanvraag Tabs */}
                <div>
                  <label className="block text-[#111111] uppercase tracking-[0.16em] text-xs font-sans font-bold mb-1.5">
                    {t('inquiry.typeLabel')} *
                  </label>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 border-b-2 border-[#E5E0D5]">
                    {REQUEST_TYPES.map((typeObj) => {
                      const isActive = activeTabKey === typeObj.key;
                      return (
                        <button
                          key={typeObj.key}
                          type="button"
                          onClick={() => setActiveTabKey(typeObj.key)}
                          className={`min-h-12 py-2 px-1 text-[11px] sm:text-xs uppercase tracking-wider font-sans transition-all duration-200 cursor-pointer text-center border-b-2 -mb-[2px] ${
                            isActive
                              ? 'border-[#B8860B] text-[#111111] font-extrabold'
                              : 'border-transparent text-[#555555] hover:text-[#111111] font-semibold'
                          }`}
                        >
                          {typeObj.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Topstuk Selector Dropdown */}
                {!item && <div className="relative">
                  <label className="block text-[#111111] uppercase tracking-[0.16em] text-xs font-sans font-bold mb-1">
                    {t('inquiry.selectItemLabel')}
                  </label>

                  <button
                    type="button"
                    aria-expanded={itemDropdownOpen}
                    onClick={() => setItemDropdownOpen(!itemDropdownOpen)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF9F6] hover:bg-white border border-[#C5BCAE] rounded-lg text-xs sm:text-sm font-serif flex items-center justify-between cursor-pointer transition-colors min-h-12"
                  >
                    {selectedItem ? (
                      <span className="font-bold text-[#111111] truncate">
                        [{selectedItem.ref}] {getItemField(selectedItem, 'title', language)}
                      </span>
                    ) : (
                      <span className="text-[#555555] italic font-medium">{t('inquiry.noSpecificItem')}</span>
                    )}
                    <ChevronDown className={`w-4 h-4 text-[#333333] transition-transform duration-200 ${itemDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {itemDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#C5BCAE] rounded-lg shadow-lg z-20 overflow-hidden animate-fade-in">
                      <div className="p-2 border-b border-[#E5E0D5] bg-[#FCFBF9]">
                        <input
                          type="text"
                          value={itemSearchQuery}
                          onChange={(e) => setItemSearchQuery(e.target.value)}
                          placeholder={t('inquiry.searchItemPlaceholder')}
                          className="w-full min-h-12 px-3 py-2 bg-white border border-[#C5BCAE] rounded text-sm text-[#111111] font-medium focus:outline-none focus:border-[#B8860B]"
                        />
                      </div>

                      <div className="max-h-48 overflow-y-auto divide-y divide-[#F5F2EB]">
                        <button
                          type="button"
                          onClick={() => handleItemSelect({ id: 'none' })}
                          className={`w-full min-h-12 p-2.5 text-left text-xs font-serif hover:bg-[#FAF7F0] transition-colors flex items-center justify-between ${
                            !selectedItem ? 'bg-[#FAF7F0] text-[#B8860B] font-bold' : 'text-[#333333] font-medium'
                          }`}
                        >
                          <span>{t('inquiry.noSpecificItem')}</span>
                          {!selectedItem && <Check className="w-4 h-4 text-[#B8860B]" />}
                        </button>

                        {filteredCatalog.map((catItem) => {
                          const isSelected = selectedItem && selectedItem.id === catItem.id;
                          return (
                            <button
                              key={catItem.id}
                              type="button"
                              onClick={() => handleItemSelect(catItem)}
                              className={`w-full min-h-12 p-2.5 text-left text-xs font-serif hover:bg-[#FAF7F0] transition-colors flex items-center justify-between ${
                                isSelected ? 'bg-[#FAF7F0] text-[#B8860B] font-bold' : 'text-[#111111] font-medium'
                              }`}
                            >
                              <span className="truncate pr-2">
                                <span className="font-mono text-xs text-[#B8860B] mr-2">[{catItem.ref}]</span>
                                {getItemField(catItem, 'title', language)}
                              </span>
                              {isSelected && <Check className="w-4 h-4 text-[#B8860B] shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>}

                {/* Form Controls */}
                <form onSubmit={handleSubmit} className="space-y-3">
                  
                  {/* Name & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#111111] uppercase tracking-[0.15em] text-xs font-sans font-bold mb-1">
                        {t('inquiry.formName')} *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder={t('inquiry.formNamePlaceholder')}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAF9F6] focus:bg-white border border-[#C5BCAE] focus:border-[#B8860B] text-sm text-[#111111] font-medium placeholder-[#777777] transition-all focus:outline-none min-h-12 sm:min-h-[40px]"
                      />
                    </div>

                    <div>
                      <label className="block text-[#111111] uppercase tracking-[0.15em] text-xs font-sans font-bold mb-1">
                        {t('inquiry.formEmail')} *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder={t('inquiry.formEmailPlaceholder')}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAF9F6] focus:bg-white border border-[#C5BCAE] focus:border-[#B8860B] text-sm text-[#111111] font-medium placeholder-[#777777] transition-all focus:outline-none min-h-12 sm:min-h-[40px]"
                      />
                    </div>
                  </div>

                  {/* Phone & Contact Preference */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#111111] uppercase tracking-[0.15em] text-xs font-sans font-bold mb-1">
                        {t('inquiry.formPhone')}{(contactPref === 'phone' || contactPref === 'whatsapp') ? ' *' : ''}
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder={t('inquiry.formPhonePlaceholder')}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAF9F6] focus:bg-white border border-[#C5BCAE] focus:border-[#B8860B] text-sm text-[#111111] font-medium placeholder-[#777777] transition-all focus:outline-none min-h-12 sm:min-h-[40px]"
                      />
                    </div>

                    <div>
                      <label className="block text-[#111111] uppercase tracking-[0.15em] text-xs font-sans font-bold mb-1">
                        {t('inquiry.formContactPref')}
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setContactPref('email');
                            setFormData(prev => ({ ...prev, contactPref: 'email' }));
                          }}
                          className={`py-2 text-[11px] font-bold uppercase tracking-wide font-sans border rounded-lg transition-all cursor-pointer text-center min-h-12 sm:min-h-[40px] ${
                            contactPref === 'email'
                              ? 'bg-[#FAF7F0] border-2 border-[#B8860B] text-[#B8860B]'
                              : 'bg-[#FAF9F6] border border-[#C5BCAE] text-[#333333] hover:text-[#111111]'
                          }`}
                        >
                          {t('inquiry.prefEmail')}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setContactPref('phone');
                            setFormData(prev => ({ ...prev, contactPref: 'phone' }));
                          }}
                          className={`py-2 text-[11px] font-bold uppercase tracking-wide font-sans border rounded-lg transition-all cursor-pointer text-center min-h-12 sm:min-h-[40px] ${
                            contactPref === 'phone'
                              ? 'bg-[#FAF7F0] border-2 border-[#B8860B] text-[#B8860B]'
                              : 'bg-[#FAF9F6] border border-[#C5BCAE] text-[#333333] hover:text-[#111111]'
                          }`}
                        >
                          {t('inquiry.prefPhone')}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setContactPref('whatsapp');
                            setFormData(prev => ({ ...prev, contactPref: 'whatsapp' }));
                          }}
                          className={`py-2 text-[11px] font-bold uppercase tracking-wide font-sans border rounded-lg transition-all cursor-pointer text-center min-h-12 sm:min-h-[40px] ${
                            contactPref === 'whatsapp'
                              ? 'bg-[#FAF7F0] border-2 border-[#B8860B] text-[#B8860B]'
                              : 'bg-[#FAF9F6] border border-[#C5BCAE] text-[#333333] hover:text-[#111111]'
                          }`}
                        >
                          {t('inquiry.prefWhatsapp')}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-[#111111] uppercase tracking-[0.15em] text-xs font-sans font-bold mb-1">
                      {t('inquiry.formMessage')} *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder={t('inquiry.formMessagePlaceholder')}
                      className="w-full min-h-24 p-3 rounded-lg bg-[#FAF9F6] focus:bg-white border border-[#C5BCAE] focus:border-[#B8860B] text-sm text-[#111111] font-medium placeholder-[#777777] transition-all focus:outline-none"
                    />
                  </div>

                  {errorMessage && (
                    <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-lg bg-[#FAF7F0] hover:bg-[#111111] text-[#111111] hover:text-white border-2 border-[#B8860B] hover:border-[#111111] text-xs sm:text-sm font-sans uppercase tracking-[0.16em] sm:tracking-[0.2em] font-bold transition-all duration-300 shadow-md cursor-pointer text-center min-h-12"
                  >
                    {loading ? t('inquiry.submitting') : t('inquiry.confidentialSubmit')}
                  </button>

                </form>

              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
