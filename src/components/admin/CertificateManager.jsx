import React, { useState, useEffect, useRef } from 'react';
import { 
  Download, 
  Printer, 
  CheckCircle2, 
  ShieldCheck, 
  Globe, 
  Sparkles, 
  FileText, 
  User, 
  Calendar, 
  Hash, 
  Image as ImageIcon,
  Loader2,
  Upload,
  RotateCcw,
  Edit3,
  ArrowLeft,
  Award,
  BookOpen,
  ChevronLeft
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import FabriceSignature from './FabriceSignature';
import GallerySeal from './GallerySeal';

export default function CertificateManager({ 
  items = [], 
  initialItem = null, 
  onBackToItems = () => {},
  onShowToast = () => {} 
}) {
  const [selectedItem, setSelectedItem] = useState(initialItem || (items.length > 0 ? items[0] : null));
  const [lang, setLang] = useState('nl');

  const [certNumber, setCertNumber] = useState('');
  const [issuedTo, setIssuedTo] = useState('Particuliere Collectie');
  const [certDate, setCertDate] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customSubtitle, setCustomSubtitle] = useState('');
  const [customAuthor, setCustomAuthor] = useState('');
  const [customPublisher, setCustomPublisher] = useState('');
  const [customYear, setCustomYear] = useState('');
  const [customBinding, setCustomBinding] = useState('');
  const [customDimensions, setCustomDimensions] = useState('');
  const [customProvenance, setCustomProvenance] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [customGuaranteeText, setCustomGuaranteeText] = useState('');

  const [showImage, setShowImage] = useState(true);
  const [showSeal, setShowSeal] = useState(true);
  const [showSignature, setShowSignature] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const [customSignature, setCustomSignature] = useState(() => {
    try { return localStorage.getItem('fabrice_signature_image') || null; }
    catch { return null; }
  });

  const certRef = useRef(null);
  const previewContainerRef = useRef(null);
  const [previewScale, setPreviewScale] = useState(1);

  // Scale the certificate preview to fit its container
  useEffect(() => {
    const updateScale = () => {
      if (!previewContainerRef.current) return;
      const containerWidth = previewContainerRef.current.offsetWidth - 48;
      const certNativeWidth = 760;
      const scale = Math.min(1, containerWidth / certNativeWidth);
      setPreviewScale(scale);
    };
    updateScale();
    const ro = new ResizeObserver(updateScale);
    if (previewContainerRef.current) ro.observe(previewContainerRef.current);
    return () => ro.disconnect();
  }, []);

  const texts = {
    nl: {
      documentTitle: "CERTIFICAAT VAN ECHTHEID",
      subTitle: "Gewaarborgde Echtheidsverklaring & Historisch Herkomstdocument",
      issuedFor: "Gecertificeerd voor",
      certNo: "Certificaat Nr.",
      date: "Datum van uitgifte",
      itemTitle: "Titel / Omschrijving",
      authorPublisher: "Auteur / Drukker / Uitgever",
      period: "Datering / Eeuw",
      bindingMedium: "Band / Medium",
      dimensions: "Formaat & Afmetingen",
      provenance: "Geverifieerde Herkomst (Provenance)",
      guaranteeHeader: "ECHTHEIDSGARANTIE",
      guaranteeText: "Ondergetekende, namens Atelier Rembrandt, verklaart dat het hierboven beschreven antiquarische object grondig is onderzocht en in al zijn onderdelen 100% authentiek is bevonden. De vermelde herkomst, binding, drukgegevens en fysieke kenmerken komen overeen met de historische catalogisering.",
      expertTitle: "Expert Oude Boeken, Prenten & Kunst",
      galleryLocation: "ATELIER REMBRANDT",
      verifyNotice: "Geregistreerd in het archief van Atelier Rembrandt onder de bovenstaande unieke referentie."
    },
    fr: {
      documentTitle: "CERTIFICAT D'AUTHENTICITÉ",
      subTitle: "Attestation d'Authenticité & Provenance Historique Certifiée",
      issuedFor: "Délivré à l'attention de",
      certNo: "N° de Certificat",
      date: "Date d'émission",
      itemTitle: "Titre / Description",
      authorPublisher: "Auteur / Imprimeur / Éditeur",
      period: "Datation / Époque",
      bindingMedium: "Reliure / Médium",
      dimensions: "Collation & Dimensions",
      provenance: "Provenance Historique Vérifiée",
      guaranteeHeader: "GARANTIE D'AUTHENTICITÉ",
      guaranteeText: "Le soussigné, pour le compte d'Atelier Rembrandt, certifie que l'œuvre antiquaire décrite ci-dessus a fait l'objet d'un examen approfondi et est garantie 100% authentique. Les spécifications de reliure, d'impression et de provenance sont rigoureusement conformes à nos recherches bibliographiques.",
      expertTitle: "Expert en Livres Rares, Gravures & Œuvres d'Art",
      galleryLocation: "ATELIER REMBRANDT",
      verifyNotice: "Ce certificat est immatriculé dans les archives de l'Atelier Rembrandt sous la référence unique ci-dessus."
    },
    en: {
      documentTitle: "CERTIFICATE OF AUTHENTICITY",
      subTitle: "Official Statement of Authenticity & Historical Provenance",
      issuedFor: "Issued to",
      certNo: "Certificate No.",
      date: "Date of Issue",
      itemTitle: "Title / Description",
      authorPublisher: "Author / Publisher / Artist",
      period: "Date / Period",
      bindingMedium: "Binding / Medium",
      dimensions: "Collation & Dimensions",
      provenance: "Verified Provenance",
      guaranteeHeader: "GUARANTEE OF AUTHENTICITY",
      guaranteeText: "The undersigned, on behalf of Atelier Rembrandt, hereby guarantees that the antiquarian item described above has been thoroughly examined and verified as 100% genuine and authentic in all respects, matching the cataloged provenance and binding details.",
      expertTitle: "Expert in Rare Books, Fine Art & Antiquities",
      galleryLocation: "ATELIER REMBRANDT",
      verifyNotice: "Officially registered in the archives of Atelier Rembrandt under the unique reference code above."
    }
  };

  const t = texts[lang] || texts.nl;

  useEffect(() => {
    if (!selectedItem) return;
    const refCode = selectedItem.ref ? selectedItem.ref.replace('FB-', '') : `${new Date().getFullYear()}-1042`;
    setCertNumber(`COA-FB-${refCode}`);
    setCertDate(new Date().toLocaleDateString('nl-NL', { year: 'numeric', month: 'long', day: 'numeric' }));
    setCustomTitle(selectedItem.title || '');
    setCustomSubtitle(selectedItem.subtitle || '');
    setCustomAuthor(selectedItem.author || '');
    setCustomPublisher(selectedItem.publisher || '');
    setCustomYear(selectedItem.year || selectedItem.century || '');
    setCustomBinding(selectedItem.binding || '');
    setCustomDimensions(selectedItem.dimensions || '');
    setCustomProvenance(selectedItem.provenance || '');
    setCustomGuaranteeText(t.guaranteeText);
  }, [selectedItem, lang]);

  const handleItemChange = (itemId) => {
    const found = items.find(i => i.id === itemId);
    if (found) setSelectedItem(found);
  };

  const handleSignatureUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result;
      if (dataUrl) {
        setCustomSignature(dataUrl);
        try { localStorage.setItem('fabrice_signature_image', dataUrl); } catch {}
        if (onShowToast) onShowToast("Handtekening opgeslagen!");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClearSignature = () => {
    setCustomSignature(null);
    try { localStorage.removeItem('fabrice_signature_image'); } catch {}
    if (onShowToast) onShowToast("Standaard handtekening hersteld.");
  };

  const handleDownloadPdf = async () => {
    if (!certRef.current) return;
    setIsGeneratingPdf(true);
    try {
      const canvas = await html2canvas(certRef.current, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF'
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const margin = 5;
      const printWidth = pdfWidth - (margin * 2);
      const printHeight = (canvas.height * printWidth) / canvas.width;
      const pdfHeight = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, 'JPEG', margin, margin, printWidth, Math.min(printHeight, pdfHeight - margin * 2));
      pdf.save(`Echtheidscertificaat-${selectedItem?.ref || 'AtelierRembrandt'}.pdf`);
      if (onShowToast) onShowToast("PDF succesvol gegenereerd!");
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      alert("Er is een fout opgetreden bij het genereren van het PDF-bestand.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (!selectedItem) return null;

  const primaryImage = selectedItem.images?.[0]?.url || null;

  // Input class (shared)
  const inputClass = "w-full bg-white border border-[#D8CEB8] text-[#111111] rounded-xl p-3 focus:border-[#B8860B] focus:outline-none focus:ring-1 focus:ring-[#B8860B]/20 transition-all text-sm";
  const textareaClass = `${inputClass} resize-y`;
  const labelClass = "block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5";

  return (
    /* Fixed full-viewport overlay — covers the sidebar completely */
    <div className="fixed inset-0 z-[60] bg-[#F8F6F2] flex flex-col overflow-hidden print:static print:overflow-visible">

      {/* ============================================================ */}
      {/* TOP HEADER BAR                                               */}
      {/* ============================================================ */}
      <div className="flex-none bg-white border-b border-[#D8CEB8] shadow-sm px-6 py-3.5 flex items-center justify-between gap-4 print:hidden">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBackToItems}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#F4F0E8] hover:bg-[#EBE4D4] text-[#111111] text-sm font-bold transition-all border border-[#D8CEB8]"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Terug naar CMS</span>
          </button>

          <div className="h-5 w-px bg-[#D8CEB8]" />

          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-[#111111]">
              <Award className="w-4 h-4 text-[#C5A059]" />
            </div>
            <h1 className="text-sm font-serif font-bold text-[#111111]">Echtheidscertificaat Genereren</h1>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* Language */}
          <div className="flex items-center space-x-1 bg-[#F4F0E8] p-1 rounded-xl border border-[#D8CEB8]">
            {[{ code: 'nl', label: '🇳🇱 NL' }, { code: 'fr', label: '🇫🇷 FR' }, { code: 'en', label: '🇬🇧 EN' }].map(l => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={`py-1 px-2.5 text-xs font-bold rounded-lg transition-all ${lang === l.code ? 'bg-[#111111] text-white shadow-sm' : 'text-stone-500 hover:text-[#111111]'}`}
              >
                {l.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-[#F4F0E8] hover:bg-[#EBE4D4] text-[#111111] text-sm font-bold transition-all border border-[#D8CEB8] flex items-center space-x-2"
          >
            <Printer className="w-4 h-4" />
            <span>Afdrukken</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="px-5 py-2 rounded-xl bg-[#C5A059] hover:bg-[#b08b46] text-[#1C1A18] text-sm font-bold transition-all shadow-md flex items-center space-x-2 disabled:opacity-50"
          >
            {isGeneratingPdf ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Genereren...</span></> : <><Download className="w-4 h-4" /><span>Download PDF</span></>}
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* BODY: LEFT FORM + RIGHT PREVIEW                              */}
      {/* ============================================================ */}
      <div className="flex-1 flex overflow-hidden">

        {/* ---------------------------------------------------------- */}
        {/* LEFT: SPACIOUS EDITING FORM (Scrollable)                   */}
        {/* ---------------------------------------------------------- */}
        <div className="w-[460px] flex-none bg-white border-r border-[#D8CEB8] overflow-y-auto p-7 space-y-7 print:hidden">
          
          {/* Object Selector */}
          <div className="space-y-2">
            <label className={labelClass}>Geselecteerd Object</label>
            <select
              value={selectedItem.id}
              onChange={(e) => handleItemChange(e.target.value)}
              className={inputClass + " font-bold"}
            >
              {items.map(i => (
                <option key={i.id} value={i.id}>{i.ref} — {i.title}</option>
              ))}
            </select>
          </div>

          {/* ── Certificaat Registratie ── */}
          <div className="space-y-4 pt-5 border-t border-[#E8E2D8]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#B8860B] flex items-center space-x-2">
              <Hash className="w-3.5 h-3.5" />
              <span>Certificaat Registratie</span>
            </h3>
            <div>
              <label className={labelClass}>Certificaat Nummer</label>
              <input type="text" value={certNumber} onChange={e => setCertNumber(e.target.value)} className={inputClass + " font-mono"} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Gecertificeerd Voor</label>
                <input type="text" value={issuedTo} onChange={e => setIssuedTo(e.target.value)} placeholder="Bijv. Collectie J. van Dam" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Uitgiftedatum</label>
                <input type="text" value={certDate} onChange={e => setCertDate(e.target.value)} className={inputClass} />
              </div>
            </div>
          </div>

          {/* ── Object Specificaties ── */}
          <div className="space-y-4 pt-5 border-t border-[#E8E2D8]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#B8860B] flex items-center space-x-2">
              <Edit3 className="w-3.5 h-3.5" />
              <span>Object Specificaties</span>
            </h3>

            <div>
              <label className={labelClass}>Titel van het Werk</label>
              <textarea rows={2} value={customTitle} onChange={e => setCustomTitle(e.target.value)} className={textareaClass + " font-bold"} />
            </div>

            <div>
              <label className={labelClass}>Ondertitel / Extra Beschrijving</label>
              <input type="text" value={customSubtitle} onChange={e => setCustomSubtitle(e.target.value)} className={inputClass} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Auteur / Kunstenaar</label>
                <input type="text" value={customAuthor} onChange={e => setCustomAuthor(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Uitgever / Drukker</label>
                <input type="text" value={customPublisher} onChange={e => setCustomPublisher(e.target.value)} className={inputClass} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Datering / Eeuw</label>
                <input type="text" value={customYear} onChange={e => setCustomYear(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Formaat / Afmetingen</label>
                <input type="text" value={customDimensions} onChange={e => setCustomDimensions(e.target.value)} className={inputClass} />
              </div>
            </div>

            <div>
              <label className={labelClass}>Band / Medium</label>
              <textarea rows={3} value={customBinding} onChange={e => setCustomBinding(e.target.value)} className={textareaClass} />
            </div>

            <div>
              <label className={labelClass}>Geverifieerde Herkomst (Provenance)</label>
              <textarea rows={3} value={customProvenance} onChange={e => setCustomProvenance(e.target.value)} className={textareaClass} />
            </div>

            <div>
              <label className={labelClass}>Garantieverklaring Tekst</label>
              <textarea rows={4} value={customGuaranteeText} onChange={e => setCustomGuaranteeText(e.target.value)} className={textareaClass + " italic"} />
            </div>

            <div>
              <label className={labelClass}>Aanvullende Opmerking (Optioneel)</label>
              <textarea rows={2} value={customNotes} onChange={e => setCustomNotes(e.target.value)} placeholder="Bijv. Inclusief beschermcassette..." className={textareaClass} />
            </div>
          </div>

          {/* ── Handtekening & Opties ── */}
          <div className="space-y-4 pt-5 border-t border-[#E8E2D8]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#B8860B] flex items-center space-x-2">
              <Upload className="w-3.5 h-3.5" />
              <span>Handtekening &amp; Weergave</span>
            </h3>

            <div className="flex items-center space-x-3">
              <label className="flex-1 cursor-pointer flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#111111] text-white hover:bg-stone-800 transition-all font-bold text-sm shadow-md">
                <Upload className="w-4 h-4 text-[#C5A059]" />
                <span>{customSignature ? 'Handtekening Wijzigen' : 'Upload Handtekening (PNG/SVG/JPG)'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleSignatureUpload} />
              </label>
              {customSignature && (
                <button onClick={handleClearSignature} className="p-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors" title="Herstellen">
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: ImageIcon, label: 'Foto Tonen', checked: showImage, set: setShowImage },
                { icon: Sparkles, label: 'Galerij Stempel', checked: showSeal, set: setShowSeal },
                { icon: CheckCircle2, label: 'Handtekening', checked: showSignature, set: setShowSignature },
              ].map(({ icon: Icon, label, checked, set }) => (
                <label key={label} className="flex flex-col items-center space-y-1.5 p-3 rounded-xl bg-[#F4F0E8] border border-[#D8CEB8] cursor-pointer text-center hover:border-[#B8860B] transition-colors">
                  <Icon className={`w-4 h-4 ${checked ? 'text-[#B8860B]' : 'text-stone-400'}`} />
                  <span className="text-[10px] font-bold text-stone-700">{label}</span>
                  <input type="checkbox" checked={checked} onChange={e => set(e.target.checked)} className="rounded accent-[#B8860B]" />
                </label>
              ))}
            </div>
          </div>

        </div>

        {/* ---------------------------------------------------------- */}
        {/* RIGHT: LIVE CERTIFICATE PREVIEW (Full remaining width)     */}
        {/* ---------------------------------------------------------- */}
        <div ref={previewContainerRef} className="flex-1 bg-[#1C1A18] overflow-y-auto flex flex-col items-center py-8 px-6 print:p-0 print:bg-white">
          
          <div className="w-full flex items-center justify-between mb-4 print:hidden">
            <span className="text-xs font-mono uppercase font-bold text-[#C5A059] tracking-wider">
              LIVE CERTIFICAAT PREVIEW
            </span>
            <span className="text-[11px] text-stone-400">
              A4 Portrait — schaal {Math.round(previewScale * 100)}%
            </span>
          </div>

          {/* Certificate at native 760px width, scaled to container */}
          <div
            style={{
              width: 760,
              transformOrigin: 'top center',
              transform: `scale(${previewScale})`,
              marginBottom: previewScale < 1 ? `${(760 * previewScale - 760) * 0.5 + (760 * (1 - previewScale))}px` : 0
            }}
          >
            {/* THE ACTUAL CERTIFICATE DOCUMENT */}
            <div
              ref={certRef}
              id="printable-certificate"
              className="w-full bg-white text-[#111111] p-14 relative border border-[#C5A059]/30 font-serif shadow-2xl print:shadow-none print:border-none"
            >
              {/* Inner hairline border */}
              <div className="border border-[#111111]/15 p-10">

                {/* HEADER */}
                <div className="text-center space-y-4 pb-7 border-b border-[#111111]/15">
                  <div className="flex justify-center">
                    <img src="/images/Atelier Rembrandt.png" alt="Atelier Rembrandt" className="h-12 w-auto object-contain contrast-125" />
                  </div>
                  <div>
                    <h1 className="text-[28px] font-bold tracking-[0.22em] text-[#111111] uppercase font-serif leading-tight">
                      {t.documentTitle}
                    </h1>
                    <p className="text-[11px] font-sans font-semibold tracking-[0.18em] text-[#8C6D2B] uppercase mt-1">
                      {t.subTitle}
                    </p>
                  </div>

                  {/* Meta row */}
                  <div className="flex items-start justify-between text-[12px] font-sans pt-3 gap-4">
                    <div className="flex flex-col min-w-0">
                      <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#8C6D2B] whitespace-nowrap">{t.certNo}</span>
                      <span className="font-mono font-bold text-[#111111] whitespace-nowrap">{certNumber}</span>
                    </div>
                    <div className="flex flex-col items-center min-w-0">
                      <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#8C6D2B] whitespace-nowrap">{t.issuedFor}</span>
                      <span className="font-bold text-[#111111] whitespace-nowrap">{issuedTo}</span>
                    </div>
                    <div className="flex flex-col items-end min-w-0">
                      <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#8C6D2B] whitespace-nowrap">{t.date}</span>
                      <span className="font-bold text-[#111111] whitespace-nowrap">{certDate}</span>
                    </div>
                  </div>
                </div>

                {/* BODY */}
                <div className="py-7 space-y-6">
                  <div className="flex gap-7 items-start">

                    {/* Photo */}
                    {showImage && primaryImage && (
                      <div className="flex-none flex flex-col items-center">
                        <div className="border border-[#111111]/20 p-1 shadow-sm">
                          <img src={primaryImage} alt={customTitle} className="w-36 h-44 object-cover" />
                        </div>
                        <span className="text-[9px] font-sans font-bold text-[#8C6D2B] mt-2 uppercase tracking-wider">
                          {selectedItem.ref}
                        </span>
                      </div>
                    )}

                    {/* Specs */}
                    <div className="flex-1 space-y-4 font-sans text-[12.5px]">
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-[#8C6D2B] mb-1">
                          {t.itemTitle}
                        </span>
                        <p className="font-serif text-[17px] font-bold text-[#111111] leading-snug">{customTitle}</p>
                        {customSubtitle && <p className="font-serif text-sm italic text-[#555555] mt-1">{customSubtitle}</p>}
                      </div>

                      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                        {customAuthor && (
                          <div>
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#8C6D2B]">{t.authorPublisher}</span>
                            <span className="font-medium text-[#111111]">{customAuthor}</span>
                            {customPublisher && <span className="text-[#666666]"> ({customPublisher})</span>}
                          </div>
                        )}
                        {customYear && (
                          <div>
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#8C6D2B]">{t.period}</span>
                            <span className="font-medium text-[#111111]">{customYear}</span>
                          </div>
                        )}
                        {customDimensions && (
                          <div>
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#8C6D2B]">{t.dimensions}</span>
                            <span className="font-medium text-[#111111]">{customDimensions}</span>
                          </div>
                        )}
                        {customBinding && (
                          <div className="col-span-2">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#8C6D2B]">{t.bindingMedium}</span>
                            <span className="font-medium text-[#111111] leading-relaxed">{customBinding}</span>
                          </div>
                        )}
                        {customProvenance && (
                          <div className="col-span-2">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#8C6D2B]">{t.provenance}</span>
                            <span className="font-medium text-[#111111] italic leading-relaxed">{customProvenance}</span>
                          </div>
                        )}
                        {customNotes && (
                          <div className="col-span-2 bg-[#F9F8F6] p-3 border border-[#111111]/10 rounded">
                            <span className="block text-[9px] font-bold uppercase tracking-wider text-[#8C6D2B]">Notitie</span>
                            <span className="text-[12px] text-[#111111]">{customNotes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Guarantee */}
                  <div className="pt-5 border-t border-[#111111]/12 text-center space-y-2">
                    <span className="text-[10.5px] font-sans font-bold uppercase tracking-[0.22em] text-[#8C6D2B]">
                      — {t.guaranteeHeader} —
                    </span>
                    <p className="font-serif text-[13px] leading-relaxed text-[#2A2A2A] italic max-w-lg mx-auto">
                      "{customGuaranteeText}"
                    </p>
                  </div>
                </div>

                {/* FOOTER */}
                <div className="pt-5 border-t border-[#111111]/12 flex items-end justify-between">
                  
                  {/* Seal */}
                  <div className="flex items-center space-x-4">
                    {showSeal && <GallerySeal className="w-24 h-24" />}
                    <div className="text-[10px] font-sans text-[#555555] max-w-[200px]">
                      <p className="font-bold text-[#111111] uppercase tracking-wider text-[11px]">{t.galleryLocation}</p>
                      <p className="mt-1 leading-tight">{t.verifyNotice}</p>
                    </div>
                  </div>

                  {/* Signature block */}
                  <div className="text-right">
                    <span className="block text-[10px] font-sans font-bold uppercase tracking-wider text-[#8C6D2B] mb-1">
                      Gevalideerd door / Signé par:
                    </span>
                    {showSignature && (
                      <div className="flex justify-end mb-1">
                        {customSignature
                          ? <img src={customSignature} alt="Handtekening" className="h-16 max-w-[200px] object-contain" />
                          : <FabriceSignature className="h-16 w-auto" color="#111111" />
                        }
                      </div>
                    )}
                    <span className="block font-serif text-[15px] font-bold text-[#111111]">Atelier Rembrandt</span>
                    <span className="block font-sans text-[10px] text-[#555555] font-semibold">{t.expertTitle}</span>
                  </div>
                </div>

                {/* Micro footer line */}
                <div className="mt-5 pt-3 border-t border-[#111111]/8 flex items-center justify-between text-[9px] font-mono text-[#888888]">
                  <span>COA REF: {certNumber}</span>
                  <span>WWW.ATELIERREMBRANDT.COM</span>
                </div>

              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
