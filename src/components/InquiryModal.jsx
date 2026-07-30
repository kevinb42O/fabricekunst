import React, { useState, useEffect } from 'react';
import { X, ChevronDown, Check, AlertCircle, CheckCircle2 } from 'lucide-react';
import { saveInquiryAsync } from '../utils/storage';
import { useLanguage } from '../context/LanguageContext';
import { getItemField, getLocalizedPrice } from '../utils/translationService';

export default function InquiryModal({ item, catalog = [], onClose, onSuccess }) {
  const { t, language } = useLanguage();

  const REQUEST_TYPES = [
    { key: 'private_viewing', label: t('inquiry.tabViewing'), fullTitle: t('inquiry.optPrivateViewing') },
    { key: 'make_offer', label: t('inquiry.tabOffer'), fullTitle: t('inquiry.optMakeOffer') },
    { key: 'request_photos', label: t('inquiry.tabPhotos'), fullTitle: t('inquiry.optPhotos') },
    { key: 'general_query', label: t('inquiry.tabGeneral'), fullTitle: t('inquiry.optGeneral') },
  ];

  const [activeTabKey, setActiveTabKey] = useState('private_viewing');
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
  const [ticketId, setTicketId] = useState('');
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
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalStyle;
      window.removeEventListener('keydown', handleKeyDown);
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
      setTicketId(`REF: ADV-${Math.floor(100000 + Math.random() * 900000)}`);
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
      className="fixed inset-0 z-50 overflow-y-auto bg-[#FAF8F5]/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 lg:p-6 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Brede container geoptimaliseerd voor desktop zonder scrollen */}
      <div 
        className="relative w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl bg-white border border-[#C5BCAE] rounded-2xl shadow-[0_20px_60px_-15px_rgba(184,134,11,0.12)] overflow-hidden flex flex-col text-[#111111] max-h-[96vh] lg:max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#E5E0D5] bg-[#FCFBF9] shrink-0">
          <div className="flex flex-col items-start">
            <img 
              src="/images/Atelier Rembrandt.png" 
              alt="Atelier Rembrandt" 
              className="h-7 sm:h-8 w-auto object-contain filter contrast-[1.05]"
            />
            <span className="text-[11px] tracking-[0.20em] text-[#8E7035] uppercase font-serif font-bold mt-0.5">
              {t('inquiry.modalTitle')}
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label={t('inquiry.closeBtn')}
            className="w-8 h-8 rounded-full border border-[#C5BCAE] hover:border-[#111111] text-[#111111] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-6 lg:p-7">
          {submitted ? (
            /* Post-Submission Reception Screen */
            <div className="py-8 px-4 max-w-md mx-auto text-center space-y-5 animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-[#FAF7F0] border-2 border-[#B8860B] text-[#B8860B] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div>
                <span className="text-xs font-mono font-bold text-[#B8860B] uppercase tracking-widest block mb-1">
                  {ticketId}
                </span>
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
            /* Split View: Left Showcase + Right Form */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              
              {/* Left Column: Curated Item / Showcase (5 cols) */}
              <div className="lg:col-span-5 space-y-4 bg-[#FAF9F6] p-4 sm:p-5 rounded-xl border border-[#D8CEB8]">
                {selectedItem ? (
                  <div className="space-y-2.5">
                    <div className="relative h-44 sm:h-52 lg:h-48 w-full rounded-lg overflow-hidden border border-[#D8CEB8] shadow-xs">
                      <img 
                        src={selectedItem.images[0]?.url || "/images/voltaire-lit-bookcase-desk.jpg"} 
                        alt={getItemField(selectedItem, 'title', language)} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs font-mono font-bold text-[#B8860B]">
                        <span>{selectedItem.ref}</span>
                        <span className="font-serif font-bold text-sm text-[#111111]">
                          {getLocalizedPrice(selectedItem.price, language)}
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-serif font-bold text-[#111111] mt-0.5 line-clamp-2">
                        {getItemField(selectedItem, 'title', language)}
                      </h3>
                      <p className="text-xs text-[#444444] font-serif italic font-medium">
                        {selectedItem.author} ({selectedItem.year})
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5 py-1">
                    <img 
                      src="/images/Atelier Rembrandt.png" 
                      alt="Atelier Rembrandt" 
                      className="h-8 w-auto object-contain filter contrast-[1.05]"
                    />
                    <span className="text-xs tracking-[0.24em] text-[#8E7035] uppercase font-serif font-bold block">
                      {t('nav.brandSubtitle')}
                    </span>
                    <p className="text-xs text-[#333333] font-serif leading-relaxed font-medium">
                      Elk werk in onze collectie wordt vergezeld van een officieel certificaat van herkomst en gedetailleerd conditierapport.
                    </p>
                  </div>
                )}

                {/* Guarantees List */}
                <div className="pt-3 border-t border-[#D8CEB8] space-y-2 text-xs font-serif font-semibold text-[#222222]">
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B8860B] shrink-0" />
                    <span>{t('inquiry.guarantee1')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B8860B] shrink-0" />
                    <span>{t('inquiry.guarantee2')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B8860B] shrink-0" />
                    <span>{t('inquiry.guarantee3')}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: High-Legibility Scroll-Free Form (7 cols) */}
              <div className="lg:col-span-7 space-y-3.5">
                
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
                          className={`py-2 px-1 text-xs uppercase tracking-wider font-sans transition-all duration-200 cursor-pointer text-center border-b-2 -mb-[2px] ${
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
                <div className="relative">
                  <label className="block text-[#111111] uppercase tracking-[0.16em] text-xs font-sans font-bold mb-1">
                    {t('inquiry.selectItemLabel')}
                  </label>

                  <div 
                    onClick={() => setItemDropdownOpen(!itemDropdownOpen)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF9F6] hover:bg-white border border-[#C5BCAE] rounded-lg text-xs sm:text-sm font-serif flex items-center justify-between cursor-pointer transition-colors min-h-[40px]"
                  >
                    {selectedItem ? (
                      <span className="font-bold text-[#111111] truncate">
                        [{selectedItem.ref}] {getItemField(selectedItem, 'title', language)}
                      </span>
                    ) : (
                      <span className="text-[#555555] italic font-medium">{t('inquiry.noSpecificItem')}</span>
                    )}
                    <ChevronDown className={`w-4 h-4 text-[#333333] transition-transform duration-200 ${itemDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>

                  {itemDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#C5BCAE] rounded-lg shadow-lg z-20 overflow-hidden animate-fade-in">
                      <div className="p-2 border-b border-[#E5E0D5] bg-[#FCFBF9]">
                        <input
                          type="text"
                          value={itemSearchQuery}
                          onChange={(e) => setItemSearchQuery(e.target.value)}
                          placeholder={t('inquiry.searchItemPlaceholder')}
                          className="w-full px-3 py-1.5 bg-white border border-[#C5BCAE] rounded text-xs text-[#111111] font-medium focus:outline-none focus:border-[#B8860B]"
                        />
                      </div>

                      <div className="max-h-48 overflow-y-auto divide-y divide-[#F5F2EB]">
                        <button
                          type="button"
                          onClick={() => handleItemSelect({ id: 'none' })}
                          className={`w-full p-2.5 text-left text-xs font-serif hover:bg-[#FAF7F0] transition-colors flex items-center justify-between ${
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
                              className={`w-full p-2.5 text-left text-xs font-serif hover:bg-[#FAF7F0] transition-colors flex items-center justify-between ${
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
                </div>

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
                        className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAF9F6] focus:bg-white border border-[#C5BCAE] focus:border-[#B8860B] text-xs sm:text-sm text-[#111111] font-medium placeholder-[#777777] transition-all focus:outline-none min-h-[40px]"
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
                        className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAF9F6] focus:bg-white border border-[#C5BCAE] focus:border-[#B8860B] text-xs sm:text-sm text-[#111111] font-medium placeholder-[#777777] transition-all focus:outline-none min-h-[40px]"
                      />
                    </div>
                  </div>

                  {/* Phone & Contact Preference */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#111111] uppercase tracking-[0.15em] text-xs font-sans font-bold mb-1">
                        {t('inquiry.formPhone')}
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder={t('inquiry.formPhonePlaceholder')}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAF9F6] focus:bg-white border border-[#C5BCAE] focus:border-[#B8860B] text-xs sm:text-sm text-[#111111] font-medium placeholder-[#777777] transition-all focus:outline-none min-h-[40px]"
                      />
                    </div>

                    <div>
                      <label className="block text-[#111111] uppercase tracking-[0.15em] text-xs font-sans font-bold mb-1">
                        {t('inquiry.formContactPref')}
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setContactPref('email')}
                          className={`py-2 text-xs font-bold uppercase tracking-wider font-sans border rounded-lg transition-all cursor-pointer text-center min-h-[40px] ${
                            contactPref === 'email'
                              ? 'bg-[#FAF7F0] border-2 border-[#B8860B] text-[#B8860B]'
                              : 'bg-[#FAF9F6] border border-[#C5BCAE] text-[#333333] hover:text-[#111111]'
                          }`}
                        >
                          {t('inquiry.prefEmail')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setContactPref('phone')}
                          className={`py-2 text-xs font-bold uppercase tracking-wider font-sans border rounded-lg transition-all cursor-pointer text-center min-h-[40px] ${
                            contactPref === 'phone'
                              ? 'bg-[#FAF7F0] border-2 border-[#B8860B] text-[#B8860B]'
                              : 'bg-[#FAF9F6] border border-[#C5BCAE] text-[#333333] hover:text-[#111111]'
                          }`}
                        >
                          {t('inquiry.prefPhone')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setContactPref('whatsapp')}
                          className={`py-2 text-xs font-bold uppercase tracking-wider font-sans border rounded-lg transition-all cursor-pointer text-center min-h-[40px] ${
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
                      className="w-full p-3 rounded-lg bg-[#FAF9F6] focus:bg-white border border-[#C5BCAE] focus:border-[#B8860B] text-xs sm:text-sm text-[#111111] font-medium placeholder-[#777777] transition-all focus:outline-none"
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
                    className="w-full py-3.5 rounded-lg bg-[#FAF7F0] hover:bg-[#111111] text-[#111111] hover:text-white border-2 border-[#B8860B] hover:border-[#111111] text-xs sm:text-sm font-sans uppercase tracking-[0.2em] font-bold transition-all duration-300 shadow-md cursor-pointer text-center min-h-[46px]"
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
