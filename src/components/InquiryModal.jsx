import React, { useState, useEffect } from 'react';
import { X, Send, ShieldCheck, CheckCircle2, Phone, Mail, User, ChevronDown, BookOpen } from 'lucide-react';
import { saveInquiryAsync } from '../utils/storage';
import { useLanguage } from '../context/LanguageContext';
import { getItemField, getLocalizedPrice } from '../utils/translationService';

export default function InquiryModal({ item, catalog = [], onClose, onSuccess }) {
  const { t, language } = useLanguage();
  const [selectedItemId, setSelectedItemId] = useState(item ? item.id : 'none');
  const [selectedItem, setSelectedItem] = useState(item || null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    type: t('inquiry.modalTitle'),
    message: ''
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sync selectedItem if item prop changes
  useEffect(() => {
    if (item) {
      setSelectedItemId(item.id);
      setSelectedItem(item);
    }
  }, [item]);

  const handleItemSelect = (e) => {
    const id = e.target.value;
    setSelectedItemId(id);
    if (!id || id === 'none' || id === 'general') {
      setSelectedItem(null);
    } else {
      const found = catalog.find(i => i.id === id);
      setSelectedItem(found || null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      itemTitle: selectedItem ? selectedItem.title : "Algemene Consultatie & Herkomstonderzoek",
      itemRef: selectedItem ? selectedItem.ref : "FB-CONSULT",
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      type: formData.type,
      message: formData.message
    };

    await saveInquiryAsync(payload);
    setLoading(false);
    setSubmitted(true);
    if (onSuccess) onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="relative w-full sm:max-w-xl bg-white border-t-2 sm:border-2 border-[#D8CEB8] rounded-t-2xl sm:rounded-3xl shadow-strong overflow-y-auto max-h-[92vh] sm:max-h-[90vh] my-auto p-5 sm:p-6 lg:p-8 text-[#111111]">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-[#FAF7F2] text-[#111111] hover:bg-stone-200 transition-colors border border-[#D8CEB8] cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#FAF7F2] border-2 border-[#B8860B] text-[#B8860B] flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-[#111111]">{t('inquiry.successTitle')}</h3>
            <p className="text-sm text-[#333333] max-w-md mx-auto leading-relaxed font-serif">
              {t('inquiry.successDesc')}
            </p>
            <div className="pt-4">
              <button
                onClick={onClose}
                className="px-8 py-3 rounded-xl bg-[#111111] hover:bg-[#B8860B] hover:text-[#111111] text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
              >
                {t('inquiry.close')}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Header */}
            <div>
              <div className="inline-flex items-center space-x-2 text-[#B8860B] text-xs font-bold uppercase tracking-wider mb-2 font-mono">
                <ShieldCheck className="w-4 h-4 text-[#B8860B]" />
                <span>{t('inquiry.modalTitle')}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#111111]">
                {t('inquiry.subtitle')}
              </h2>
            </div>


            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              {/* Field 1: Type Aanvraag (AT THE TOP) */}
              <div>
                <label className="block text-[#111111] font-bold mb-1.5 uppercase tracking-wider text-[10px] font-mono">
                  {t('inquiry.typeLabel')} *
                </label>
                <div className="relative">
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full py-3 px-3.5 pr-10 rounded-md bg-[#FAF7F2] border border-[#D8CEB8] text-[#111111] font-medium text-xs focus:outline-none focus:border-[#111111] appearance-none shadow-xs cursor-pointer"
                  >
                    <option value="Privé-bezichtiging aanvragen">{t('inquiry.optPrivateViewing')}</option>
                    <option value="Doe een bod">{t('inquiry.optMakeOffer')}</option>
                    <option value="Aanvullende foto's">{t('inquiry.optPhotos')}</option>
                    <option value="Algemene vraag">{t('inquiry.optGeneral')}</option>
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555555] pointer-events-none" />
                </div>
              </div>

              {/* Field 2: Select Specific Catalog Piece (OPTIONAL, BELOW TYPE AANVRAAG) */}
              <div>
                <label className="block text-[#111111] font-bold mb-1.5 uppercase tracking-wider text-[10px] font-mono">
                  {t('inquiry.selectItemLabel')}
                </label>
                <div className="relative">
                  <select
                    value={selectedItemId || 'none'}
                    onChange={handleItemSelect}
                    className="w-full py-3 px-3.5 pr-10 rounded-md bg-[#FAF7F2] border border-[#D8CEB8] text-[#111111] font-serif font-semibold text-xs focus:outline-none focus:border-[#111111] appearance-none shadow-xs cursor-pointer"
                  >
                    <option value="none">{t('inquiry.noSpecificItem')}</option>
                    {catalog.map((catItem) => (
                      <option key={catItem.id} value={catItem.id}>
                        📖 [{catItem.ref}] {getItemField(catItem, 'title', language)} ({catItem.year || catItem.author})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555555] pointer-events-none" />
                </div>
              </div>

              {/* Selected Item Summary Card (renders dynamically when a specific book is selected) */}
              {selectedItem && (
                <div className="flex items-center space-x-4 p-3.5 rounded-md bg-[#FAF7F2] border border-[#D8CEB8] animate-fade-in shadow-xs">
                  <img
                    src={selectedItem.images[0]?.url || "/images/voltaire-lit-bookcase-desk.jpg"}
                    alt={getItemField(selectedItem, 'title', language)}
                    className="w-14 h-14 rounded-md object-cover border border-[#D8CEB8] shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-[#B8860B] uppercase font-bold">{selectedItem.ref}</span>
                      <span className="text-xs font-serif font-bold text-[#111111]">{getLocalizedPrice(selectedItem.price, language)}</span>
                    </div>
                    <h4 className="text-xs font-bold text-[#111111] truncate font-serif">{getItemField(selectedItem, 'title', language)}</h4>
                    <p className="text-[10px] text-[#555555] truncate">{selectedItem.author} ({selectedItem.year})</p>
                  </div>
                </div>
              )}

              {/* Name & Email Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#111111] font-bold mb-1.5 uppercase tracking-wider text-[10px] font-mono">
                    {t('inquiry.formName')} *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555555]" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={t('inquiry.formNamePlaceholder')}
                      className="w-full pl-9 pr-3 py-3 rounded-md bg-[#FAF7F2] border border-[#D8CEB8] text-[#111111] font-medium placeholder-[#888888] focus:outline-none focus:border-[#111111] text-base sm:text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#111111] font-bold mb-1.5 uppercase tracking-wider text-[10px] font-mono">
                    {t('inquiry.formEmail')} *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555555]" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder={t('inquiry.formEmailPlaceholder')}
                      className="w-full pl-9 pr-3 py-3 rounded-md bg-[#FAF7F2] border border-[#D8CEB8] text-[#111111] font-medium placeholder-[#888888] focus:outline-none focus:border-[#111111] text-base sm:text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[#111111] font-bold mb-1.5 uppercase tracking-wider text-[10px] font-mono">
                  {t('inquiry.formPhone')}
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555555]" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder={t('inquiry.formPhonePlaceholder')}
                    className="w-full pl-9 pr-3 py-3 rounded-md bg-[#FAF7F2] border border-[#D8CEB8] text-[#111111] font-medium placeholder-[#888888] focus:outline-none focus:border-[#111111] text-base sm:text-xs"
                  />
                </div>
              </div>

              {/* Message — Completely empty by default! */}
              <div>
                <label className="block text-[#111111] font-bold mb-1.5 uppercase tracking-wider text-[10px] font-mono">
                  {t('inquiry.formMessage')} *
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder={t('inquiry.formMessagePlaceholder')}
                  className="w-full p-3 rounded-md bg-[#FAF7F2] border border-[#D8CEB8] text-[#111111] font-medium placeholder-[#888888] focus:outline-none focus:border-[#111111]"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-sm bg-[#1C1A17] hover:bg-[#B8860B] text-[#FAF7F2] hover:text-[#111111] font-semibold text-xs uppercase tracking-widest border border-[#B8860B]/40 hover:border-[#B8860B] transition-all duration-300 shadow-xs cursor-pointer min-h-[48px]"
              >
                <span>{loading ? t('inquiry.submitting') : t('inquiry.confidentialSubmit')}</span>
              </button>

            </form>

          </div>
        )}

      </div>
    </div>
  );
}
