import React, { useState } from 'react';
import { Mail, Phone, Calendar, MessageSquare, ExternalLink, Search, Check, Trash2, StickyNote, Send, X, Copy } from 'lucide-react';
import { updateInquiryStatusAsync, updateInquiryNotesAsync, deleteInquiryAsync } from '../../utils/storage';

export default function InquiriesManager({ inquiries, onStatusChange, onShowToast }) {
  const [filterQuery, setFilterQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Alle');
  const [activeNotes, setActiveNotes] = useState({});
  const [emailModalInquiry, setEmailModalInquiry] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState('invitation');
  const [customEmailBody, setCustomEmailBody] = useState('');

  const handleStatusSelect = async (id, newStatus) => {
    try {
      const updated = await updateInquiryStatusAsync(id, newStatus);
      onStatusChange(updated);
      if (onShowToast) onShowToast(`Aanvraag status gewijzigd naar ${newStatus}`);
    } catch (error) {
      console.error('Aanvraagstatus opslaan mislukt:', error);
      if (onShowToast) onShowToast('De status kon niet worden opgeslagen.', 'error');
    }
  };

  const handleSaveNotes = async (id) => {
    const noteText = activeNotes[id] || '';
    try {
      const updated = await updateInquiryNotesAsync(id, noteText);
      onStatusChange(updated);
      if (onShowToast) onShowToast('Interne notitie opgeslagen');
    } catch (error) {
      console.error('Aanvraagnotitie opslaan mislukt:', error);
      if (onShowToast) onShowToast('De notitie kon niet worden opgeslagen.', 'error');
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Weet je zeker dat je de aanvraag van ${name} wilt verwijderen?`)) {
      try {
        const updated = await deleteInquiryAsync(id);
        onStatusChange(updated);
        if (onShowToast) onShowToast('Aanvraag verwijderd.');
      } catch (error) {
        console.error('Aanvraag verwijderen mislukt:', error);
        if (onShowToast) onShowToast('De aanvraag kon niet worden verwijderd.', 'error');
      }
    }
  };

  // Pre-built email response templates for Atelier Rembrandt
  const getEmailTemplateText = (type, inq) => {
    if (!inq) return '';
    const name = inq.name || 'Geachte heer/mevrouw';
    const title = inq.itemTitle || 'het antiquarische werk';

    switch (type) {
      case 'invitation':
        return `Beste ${name},\n\nHartelijk dank voor uw interesse in "${title}".\n\nIk nodig u van harte uit voor een privé-bezichtiging van dit exemplaar. Mocht u specifieke vragen hebben over de herkomst of staat van de band, licht ik u deze graag toe.\n\nWanneer zou een afspraak voor u schikken?\n\nMet vriendelijke groet,\n\nAtelier Rembrandt`;
      case 'accept_bid':
        return `Beste ${name},\n\nHartelijk dank voor uw bod op "${title}".\n\nIk ga met genoegen akkoord met uw voorstel. Ik zorg voor een uiterst geconditioneerde en verzekerde verpakking van het werk.\n\nZullen we de logistieke afhandeling en betalingsdetails telefonisch of per e-mail verder afstemmen?\n\nMet vriendelijke groet,\n\nAtelier Rembrandt`;
      case 'counter_offer':
        return `Beste ${name},\n\nHartelijk dank voor uw bericht inzake "${title}".\n\nGezien de uitzonderlijke zeldzaamheid, de originele band en de bewezen provenance van dit exemplaar, kan ik uw bod niet geheel honoreren. Wel wil ik u graag een tegemoetkomend voorstel doen.\n\nLaat mij gerust weten of we hierover telefonisch van gedachten kunnen wisselen.\n\nMet vriendelijke groet,\n\nAtelier Rembrandt`;
      default:
        return `Beste ${name},\n\nHartelijk dank voor uw aanvraag inzake "${title}".\n\nIk sta ter uwer beschikking voor alle bijkomende informatie omtrent de staat, illustraties en herkomst van dit werk.\n\nMet vriendelijke groet,\n\nAtelier Rembrandt`;
    }
  };

  const handleOpenEmailModal = (inq) => {
    setEmailModalInquiry(inq);
    setSelectedTemplate('invitation');
    setCustomEmailBody(getEmailTemplateText('invitation', inq));
  };

  const handleTemplateChange = (templateKey) => {
    setSelectedTemplate(templateKey);
    setCustomEmailBody(getEmailTemplateText(templateKey, emailModalInquiry));
  };

  const filteredInquiries = inquiries.filter(inq => {
    const matchesSearch =
      inq.name?.toLowerCase().includes(filterQuery.toLowerCase()) ||
      inq.email?.toLowerCase().includes(filterQuery.toLowerCase()) ||
      inq.itemTitle?.toLowerCase().includes(filterQuery.toLowerCase()) ||
      inq.itemRef?.toLowerCase().includes(filterQuery.toLowerCase());

    const matchesStatus = statusFilter === 'Alle' || inq.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="admin-module-legacy admin-inquiries space-y-6 text-[#111111] animate-fade-in">
      
      {/* Search & Status Bar */}
      <div className="p-4 sm:p-6 rounded-3xl bg-white border border-[#D8CEB8] shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Zoek op naam verzamelaar, e-mail, item ref..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#D8CEB8] text-xs text-[#111111] placeholder-[#888888] focus:outline-none focus:border-[#111111]"
          />
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center space-x-1 p-1 rounded-xl bg-[#FAF7F2] border border-[#D8CEB8] self-start md:self-auto text-xs">
          {['Alle', 'Nieuw', 'In behandeling', 'Afgerond'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                statusFilter === st
                  ? 'bg-[#111111] text-white shadow-sm'
                  : 'text-[#555555] hover:text-[#111111]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

      </div>

      {/* Inquiry List */}
      {filteredInquiries.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-[#D8CEB8] shadow-sm space-y-2">
          <Mail className="w-10 h-10 text-[#B8860B] mx-auto" />
          <p className="text-sm font-serif font-bold text-[#111111]">Geen binnengekomen aanvragen gevonden</p>
          <p className="text-xs text-[#666666]">Er zijn momenteel geen berichten die aan de criteria voldoen.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInquiries.map((inq) => (
            <div
              key={inq.id}
              className={`p-6 rounded-3xl bg-white border transition-all space-y-4 shadow-sm ${
                inq.status === 'Nieuw' ? 'border-2 border-[#111111]' : 'border-[#D8CEB8]'
              }`}
            >
              
              {/* Top Row: Ref, Type, Timestamp, Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D8CEB8] pb-3 text-xs">
                <div className="flex items-center space-x-3">
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                    inq.status === 'Nieuw' ? 'bg-[#111111] text-white shadow-sm' :
                    inq.status === 'In behandeling' ? 'bg-amber-100 text-amber-900 border border-amber-500/40' :
                    'bg-[#FAF7F2] text-[#555555] border border-[#D8CEB8]'
                  }`}>
                    {inq.status}
                  </span>
                  <span className="text-xs font-mono text-[#B8860B] font-bold">{inq.itemRef}</span>
                  <span className="text-xs font-bold text-[#111111] font-serif">{inq.type}</span>
                </div>

                <div className="flex items-center space-x-3 text-[#666666]">
                  <div className="flex items-center space-x-1 font-mono text-[11px]">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(inq.date).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <button
                    onClick={() => handleDelete(inq.id, inq.name)}
                    className="p-1 rounded text-stone-400 hover:text-red-600 transition-colors"
                    title="Aanvraag verwijderen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Detail Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Left: Collector Details */}
                <div className="md:col-span-5 space-y-3">
                  <div>
                    <h4 className="text-base font-serif font-bold text-[#111111]">{inq.name}</h4>
                    <span className="text-[10px] font-mono uppercase font-bold text-[#666666] block mt-0.5">
                      Verzamelaar / Geïnteresseerde
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-[#333333]">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-3.5 h-3.5 text-[#B8860B] shrink-0" />
                      <a href={`mailto:${inq.email}?subject=Re: ${inq.itemTitle} (${inq.itemRef})`} className="hover:text-[#B8860B] underline font-semibold">
                        {inq.email}
                      </a>
                    </div>
                    {inq.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-3.5 h-3.5 text-[#B8860B] shrink-0" />
                        <a href={`tel:${inq.phone}`} className="hover:text-[#B8860B] font-mono">
                          {inq.phone}
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#D8CEB8] space-y-1">
                    <span className="text-[10px] text-[#666666] uppercase font-bold block font-mono">Betreft Kunstwerk</span>
                    <span className="text-xs font-serif text-[#111111] font-bold block">{inq.itemTitle}</span>
                  </div>
                </div>

                {/* Right: Message & Notes */}
                <div className="md:col-span-7 space-y-4 flex flex-col justify-between">
                  
                  <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#D8CEB8] space-y-2">
                    <div className="flex items-center space-x-2 text-xs font-bold text-[#111111]">
                      <MessageSquare className="w-4 h-4 text-[#B8860B] shrink-0" />
                      <span>Bericht van Verzamelaar:</span>
                    </div>
                    <p className="italic text-xs text-[#111111] leading-relaxed font-sans pl-6">
                      "{inq.message}"
                    </p>
                  </div>

                  {/* Interne Notities Form */}
                  <div className="space-y-2 pt-2 border-t border-[#D8CEB8]/60">
                    <div className="flex items-center justify-between text-xs font-mono font-bold text-[#666666]">
                      <span className="flex items-center space-x-1">
                        <StickyNote className="w-3.5 h-3.5 text-[#B8860B]" />
                        <span>Interne Notitie:</span>
                      </span>
                      <button
                        onClick={() => handleSaveNotes(inq.id)}
                        className="text-[10px] font-bold text-[#111111] hover:underline"
                      >
                        Opslaan
                      </button>
                    </div>

                    <input
                      type="text"
                      value={activeNotes[inq.id] !== undefined ? activeNotes[inq.id] : (inq.notes || '')}
                      onChange={(e) => setActiveNotes({ ...activeNotes, [inq.id]: e.target.value })}
                      placeholder="Notitie toevoegen (bijv. 'Bellen op vrijdag 14:00')..."
                      className="w-full p-2 rounded-xl bg-white border border-[#D8CEB8] text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
                    />
                  </div>

                  {/* Bottom Row Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-[#D8CEB8] text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] text-[#666666] uppercase font-bold font-mono">Status:</span>
                      <select
                        value={inq.status}
                        onChange={(e) => handleStatusSelect(inq.id, e.target.value)}
                        className="py-1 px-2.5 rounded-xl bg-white border border-[#D8CEB8] text-xs font-bold text-[#111111] focus:outline-none"
                      >
                        <option value="Nieuw">Nieuw</option>
                        <option value="In behandeling">In behandeling</option>
                        <option value="Afgerond">Afgerond</option>
                      </select>
                    </div>

                    <button
                      onClick={() => handleOpenEmailModal(inq)}
                      className="px-4 py-2 rounded-xl bg-[#111111] text-white hover:bg-stone-800 text-xs font-bold transition-colors flex items-center space-x-1.5 shadow-sm"
                    >
                      <Send className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Beantwoorden Via Mail</span>
                    </button>
                  </div>

                </div>

              </div>

            </div>
          ))}
        </div>
      )}

      {/* Pre-filled Email Assistant Modal */}
      {emailModalInquiry && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-white border-2 border-[#D8CEB8] rounded-3xl p-6 sm:p-8 shadow-strong space-y-6">
            
            <div className="flex items-center justify-between border-b border-[#D8CEB8] pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-[#111111] text-white flex items-center justify-center">
                  <Mail className="w-4 h-4 text-[#D4AF37]" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-[#B8860B] uppercase">Mail Assistent</span>
                  <h3 className="text-lg font-serif font-bold text-[#111111]">
                    Beantwoord Aanvraag ({emailModalInquiry.name})
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setEmailModalInquiry(null)}
                className="p-2 rounded-full bg-[#FAF7F2] text-[#111111] border border-[#D8CEB8]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Template Selector Buttons */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-[#111111] block">Kies Sjabloon:</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleTemplateChange('invitation')}
                  className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                    selectedTemplate === 'invitation' ? 'bg-[#111111] text-white border-[#111111]' : 'bg-[#FAF7F2] text-[#111111] border-[#D8CEB8]'
                  }`}
                >
                   Privé-Bezichtiging Uitnodiging
                </button>
                <button
                  type="button"
                  onClick={() => handleTemplateChange('accept_bid')}
                  className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                    selectedTemplate === 'accept_bid' ? 'bg-[#111111] text-white border-[#111111]' : 'bg-[#FAF7F2] text-[#111111] border-[#D8CEB8]'
                  }`}
                >
                   Bod Geaccepteerd
                </button>
                <button
                  type="button"
                  onClick={() => handleTemplateChange('counter_offer')}
                  className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                    selectedTemplate === 'counter_offer' ? 'bg-[#111111] text-white border-[#111111]' : 'bg-[#FAF7F2] text-[#111111] border-[#D8CEB8]'
                  }`}
                >
                   Tegenbod Voorstel
                </button>
                <button
                  type="button"
                  onClick={() => handleTemplateChange('general')}
                  className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                    selectedTemplate === 'general' ? 'bg-[#111111] text-white border-[#111111]' : 'bg-[#FAF7F2] text-[#111111] border-[#D8CEB8]'
                  }`}
                >
                   Algemene Informatie
                </button>
              </div>
            </div>

            {/* Editable Mail Text */}
            <div>
              <label className="text-xs font-mono font-bold text-[#111111] block mb-1">E-mail Inhoud:</label>
              <textarea
                rows={8}
                value={customEmailBody}
                onChange={(e) => setCustomEmailBody(e.target.value)}
                className="w-full p-3 rounded-xl bg-[#FAF7F2] border border-[#D8CEB8] text-xs text-[#111111] font-sans leading-relaxed"
              />
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-[#D8CEB8]">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(customEmailBody);
                  if (onShowToast) onShowToast('E-mail tekst gekopieerd naar klembord!');
                }}
                className="px-4 py-2 rounded-xl bg-[#FAF7F2] border border-[#D8CEB8] text-xs font-bold text-[#111111] hover:bg-stone-200 transition-colors flex items-center space-x-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Kopieer Tekst</span>
              </button>

              <a
                href={`mailto:${emailModalInquiry.email}?subject=Re: ${emailModalInquiry.itemTitle} (${emailModalInquiry.itemRef})&body=${encodeURIComponent(customEmailBody)}`}
                onClick={() => setEmailModalInquiry(null)}
                className="px-6 py-2.5 rounded-xl bg-[#111111] text-white hover:bg-stone-800 text-xs font-bold uppercase tracking-wider transition-colors flex items-center space-x-2 shadow-md"
              >
                <ExternalLink className="w-4 h-4 text-[#D4AF37]" />
                <span>Open in Mail App</span>
              </a>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
