import React, { useState, useEffect } from 'react';
import { X, Send, ShieldCheck, CheckCircle2, Phone, Mail, User, ChevronDown, BookOpen } from 'lucide-react';
import { saveInquiryAsync } from '../utils/storage';

export default function InquiryModal({ item, catalog = [], onClose, onSuccess }) {
  const [selectedItemId, setSelectedItemId] = useState(item ? item.id : 'none');
  const [selectedItem, setSelectedItem] = useState(item || null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    type: 'Privé-bezichtiging aanvragen',
    message: '' // Empty by default! User must type or select.
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="relative w-full max-w-xl bg-white border-2 border-[#D8CEB8] rounded-3xl shadow-strong overflow-hidden my-auto p-6 sm:p-8 text-[#111111]">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-[#FAF7F2] text-[#111111] hover:bg-stone-200 transition-colors border border-[#D8CEB8] cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#FAF7F2] border-2 border-[#B8860B] text-[#B8860B] flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-[#111111]">Aanvraag Succesvol Ontvangen</h3>
            <p className="text-sm text-[#333333] max-w-md mx-auto leading-relaxed font-serif">
              Hartelijk dank voor je bericht, <span className="text-[#B8860B] font-bold">{formData.name}</span>. Fabrice heeft je aanvraag in goede orde ontvangen en neemt zo spoedig mogelijk persoonlijk contact met je op.
            </p>
            <div className="pt-4">
              <button
                onClick={onClose}
                className="px-8 py-3 rounded-xl bg-[#111111] hover:bg-[#B8860B] hover:text-[#111111] text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
              >
                Sluiten
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Header */}
            <div>
              <div className="inline-flex items-center space-x-2 text-[#B8860B] text-xs font-bold uppercase tracking-wider mb-2 font-mono">
                <ShieldCheck className="w-4 h-4 text-[#B8860B]" />
                <span>Privé Consultatie & Informatie</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#111111]">
                Vraag Informatie of Afspraak
              </h2>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              {/* Field 1: Type Aanvraag (AT THE TOP) */}
              <div>
                <label className="block text-[#111111] font-bold mb-1.5 uppercase tracking-wider text-[10px] font-mono">
                  Type Aanvraag *
                </label>
                <div className="relative">
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full py-3 px-3.5 pr-10 rounded-md bg-[#FAF7F2] border border-[#D8CEB8] text-[#111111] font-medium text-xs focus:outline-none focus:border-[#111111] appearance-none shadow-xs cursor-pointer"
                  >
                    <option value="Privé-bezichtiging aanvragen">Privé-bezichtiging op afspraak aanvragen</option>
                    <option value="Doe een bod">Een formeel bod uitbrengen</option>
                    <option value="Aanvullende foto's">Aanvullende detailfoto's & provenancedocumentatie opvragen</option>
                    <option value="Algemene vraag">Algemene vraag aan de verzamelaar</option>
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555555] pointer-events-none" />
                </div>
              </div>

              {/* Field 2: Select Specific Catalog Piece (OPTIONAL, BELOW TYPE AANVRAAG) */}
              <div>
                <label className="block text-[#111111] font-bold mb-1.5 uppercase tracking-wider text-[10px] font-mono">
                  Selecteer Topstuk uit de Collectie (Optioneel)
                </label>
                <div className="relative">
                  <select
                    value={selectedItemId || 'none'}
                    onChange={handleItemSelect}
                    className="w-full py-3 px-3.5 pr-10 rounded-md bg-[#FAF7F2] border border-[#D8CEB8] text-[#111111] font-serif font-semibold text-xs focus:outline-none focus:border-[#111111] appearance-none shadow-xs cursor-pointer"
                  >
                    <option value="none">— Geen specifiek topstuk (Algemene aanvraag) —</option>
                    {catalog.map((catItem) => (
                      <option key={catItem.id} value={catItem.id}>
                        📖 [{catItem.ref}] {catItem.title} ({catItem.year || catItem.author})
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
                    alt={selectedItem.title}
                    className="w-14 h-14 rounded-md object-cover border border-[#D8CEB8] shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-[#B8860B] uppercase font-bold">{selectedItem.ref}</span>
                      <span className="text-xs font-serif font-bold text-[#111111]">{selectedItem.price}</span>
                    </div>
                    <h4 className="text-xs font-bold text-[#111111] truncate font-serif">{selectedItem.title}</h4>
                    <p className="text-[10px] text-[#555555] truncate">{selectedItem.author} ({selectedItem.year})</p>
                  </div>
                </div>
              )}

              {/* Name & Email Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#111111] font-bold mb-1.5 uppercase tracking-wider text-[10px] font-mono">
                    Uw Naam *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555555]" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Uw Naam"
                      className="w-full pl-9 pr-3 py-2.5 rounded-md bg-[#FAF7F2] border border-[#D8CEB8] text-[#111111] font-medium placeholder-[#888888] focus:outline-none focus:border-[#111111]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#111111] font-bold mb-1.5 uppercase tracking-wider text-[10px] font-mono">
                    E-mailadres *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555555]" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="uw.naam@domein.be"
                      className="w-full pl-9 pr-3 py-2.5 rounded-md bg-[#FAF7F2] border border-[#D8CEB8] text-[#111111] font-medium placeholder-[#888888] focus:outline-none focus:border-[#111111]"
                    />
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[#111111] font-bold mb-1.5 uppercase tracking-wider text-[10px] font-mono">
                  Telefoonnummer (Optioneel)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555555]" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+32 475 00 00 00"
                    className="w-full pl-9 pr-3 py-2.5 rounded-md bg-[#FAF7F2] border border-[#D8CEB8] text-[#111111] font-medium placeholder-[#888888] focus:outline-none focus:border-[#111111]"
                  />
                </div>
              </div>

              {/* Message — Completely empty by default! */}
              <div>
                <label className="block text-[#111111] font-bold mb-1.5 uppercase tracking-wider text-[10px] font-mono">
                  Uw Bericht of Vraag *
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Typ hier uw bericht, specifieke vraag of gewenste datum voor een privé-consultatie..."
                  className="w-full p-3 rounded-md bg-[#FAF7F2] border border-[#D8CEB8] text-[#111111] font-medium placeholder-[#888888] focus:outline-none focus:border-[#111111]"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-sm bg-[#1C1A17] hover:bg-[#B8860B] text-[#FAF7F2] hover:text-[#111111] font-semibold text-xs uppercase tracking-widest border border-[#B8860B]/40 hover:border-[#B8860B] transition-all duration-300 shadow-xs cursor-pointer"
              >
                <span>{loading ? "Verzenden..." : "Verstuur Aanvraag Vertrouwelijk"}</span>
              </button>

            </form>

          </div>
        )}

      </div>
    </div>
  );
}
