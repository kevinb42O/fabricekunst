import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
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
  Edit3
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import FabriceSignature from './FabriceSignature';
import GallerySeal from './GallerySeal';

export default function CertificateModal({ item: initialItem, items = [], onClose }) {
  // Active selected item
  const [selectedItem, setSelectedItem] = useState(initialItem || (items.length > 0 ? items[0] : null));

  // Language state: 'nl' | 'fr' | 'en'
  const [lang, setLang] = useState('nl');

  // Certificate Base Metadata Form Fields
  const [certNumber, setCertNumber] = useState('');
  const [issuedTo, setIssuedTo] = useState('Particuliere Collectie');
  const [certDate, setCertDate] = useState('');

  // 100% Fully Editable Item Specifications
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

  // Toggles
  const [showImage, setShowImage] = useState(true);
  const [showSeal, setShowSeal] = useState(true);
  const [showSignature, setShowSignature] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Custom Uploaded Signature State (Stored in localStorage)
  const [customSignature, setCustomSignature] = useState(() => {
    try {
      return localStorage.getItem('fabrice_signature_image') || null;
    } catch (e) {
      return null;
    }
  });

  // Reference to certificate DOM node for canvas conversion
  const certRef = useRef(null);

  // Translations for COA content
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
      condition: "Staat & Inscripties",
      guaranteeHeader: "ECHTHEIDSGARANTIE",
      guaranteeText: "Ondergetekende, namens Atelier Rembrandt / Fabrice Boeken & Kunst, verklaart dat het hierboven beschreven antiquarische object grondig is onderzocht en in al zijn onderdelen 100% authentiek is bevonden. De vermelde herkomst, binding, drukgegevens en fysieke kenmerken komen overeen met de historische catalogisering.",
      expertTitle: "Expert Oude Boeken, Prenten & Kunst",
      galleryLocation: "Atelier Rembrandt — Amsterdam / Parijs",
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
      condition: "État & Particularités",
      guaranteeHeader: "GARANTIE D'AUTHENTICITÉ",
      guaranteeText: "Le soussigné, pour le compte d'Atelier Rembrandt / Fabrice Livres & Art, certifie que l'œuvre antiquaire décrite ci-dessus a fait l'objet d'un examen approfondi et est garantie 100% authentique. Les spécifications de reliure, d'impression et de provenance sont rigoureusement conformes à nos recherches bibliographiques.",
      expertTitle: "Expert en Livres Rares, Gravures & Œuvres d'Art",
      galleryLocation: "Atelier Rembrandt — Amsterdam / Paris",
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
      condition: "Condition & Specs",
      guaranteeHeader: "GUARANTEE OF AUTHENTICITY",
      guaranteeText: "The undersigned, on behalf of Atelier Rembrandt / Fabrice Books & Fine Art, hereby guarantees that the antiquarian item described above has been thoroughly examined and verified as 100% genuine and authentic in all respects, matching the cataloged provenance and binding details.",
      expertTitle: "Expert in Rare Books, Fine Art & Antiquities",
      galleryLocation: "Atelier Rembrandt — Amsterdam / Paris",
      verifyNotice: "Officially registered in the archives of Atelier Rembrandt under the unique reference code above."
    }
  };

  const t = texts[lang] || texts.nl;

  // Initialize & populate editable fields whenever selectedItem or lang changes
  useEffect(() => {
    if (!selectedItem) return;

    const refCode = selectedItem.ref ? selectedItem.ref.replace('FB-', '') : `${new Date().getFullYear()}-1042`;
    setCertNumber(`COA-FB-${refCode}`);

    const today = new Date();
    setCertDate(today.toLocaleDateString('nl-NL', { year: 'numeric', month: 'long', day: 'numeric' }));

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

  // Handle item change from dropdown
  const handleItemChange = (itemId) => {
    const found = items.find(i => i.id === itemId);
    if (found) {
      setSelectedItem(found);
    }
  };

  // Handle Custom Signature Upload File
  const handleSignatureUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (dataUrl) {
        setCustomSignature(dataUrl);
        try {
          localStorage.setItem('fabrice_signature_image', dataUrl);
        } catch (err) {
          console.warn("Could not save signature to localStorage", err);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Clear Custom Signature
  const handleClearSignature = () => {
    setCustomSignature(null);
    try {
      localStorage.removeItem('fabrice_signature_image');
    } catch (err) {
      console.warn("Could not remove signature from localStorage", err);
    }
  };

  // Handle PDF Export download
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
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const margin = 5;
      const printWidth = pdfWidth - (margin * 2);
      const printHeight = (canvas.height * printWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', margin, margin, printWidth, Math.min(printHeight, pdfHeight - margin * 2));
      pdf.save(`Echtheidscertificaat-${selectedItem?.ref || 'AtelierRembrandt'}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      alert("Er is een fout opgetreden bij het genereren van het PDF-bestand.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Handle direct print
  const handlePrint = () => {
    window.print();
  };

  if (!selectedItem) {
    return null;
  }

  const primaryImage = selectedItem.images && selectedItem.images.length > 0 ? selectedItem.images[0].url : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md p-2 sm:p-4 md:p-6 flex items-start justify-center min-h-screen print:p-0 print:bg-white print:static">
      
      {/* ALWAYS VISIBLE FLOATING CLOSE BUTTON (Top Right) */}
      <button 
        onClick={onClose}
        className="fixed top-4 right-4 z-[100] bg-stone-900/90 text-white p-3 rounded-full hover:bg-stone-800 hover:text-[#C5A059] shadow-2xl transition-all border border-[#C5A059]/40 flex items-center justify-center print:hidden cursor-pointer"
        title="Sluit Venster"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Main Modal Container Box */}
      <div className="relative w-full max-w-6xl my-auto bg-[#1C1A18] border border-[#38332E] rounded-2xl shadow-2xl overflow-hidden flex flex-col lg:flex-row print:max-h-none print:shadow-none print:border-none print:w-full print:bg-white">
        
        {/* ======================================================== */}
        {/* LEFT CONTROLS SIDEBAR (Fully Editable Input Panel)       */}
        {/* ======================================================== */}
        <div className="w-full lg:w-96 bg-[#24211D] border-b lg:border-b-0 lg:border-r border-[#38332E] p-5 flex flex-col justify-between space-y-6 max-h-[85vh] lg:max-h-[90vh] overflow-y-auto print:hidden">
          
          <div className="space-y-5">
            
            {/* Sidebar Header */}
            <div className="flex items-center justify-between border-b border-[#38332E] pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-[#C5A059]/10 text-[#C5A059]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-white tracking-wide">Certificaat Bewerken</h3>
                  <p className="text-[11px] text-[#A0988C]">Pas alle teksten &amp; opties aan</p>
                </div>
              </div>
            </div>

            {/* Item Switcher Dropdown (If multiple items passed) */}
            {items.length > 1 && (
              <div>
                <label className="block text-xs font-semibold text-[#C5A059] uppercase tracking-wider mb-1.5">
                  Selecteer Kunstwerk / Boek
                </label>
                <select
                  value={selectedItem.id}
                  onChange={(e) => handleItemChange(e.target.value)}
                  className="w-full bg-[#1C1A18] border border-[#38332E] text-stone-200 text-xs rounded-xl p-2.5 focus:border-[#C5A059] focus:outline-none"
                >
                  {items.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.ref} — {i.title.substring(0, 30)}...
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Language Selector */}
            <div>
              <label className="block text-xs font-semibold text-[#C5A059] uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Taal / Langue</span>
                <Globe className="w-3.5 h-3.5 text-[#C5A059]" />
              </label>
              <div className="grid grid-cols-3 gap-1.5 bg-[#1C1A18] p-1 rounded-xl border border-[#38332E]">
                {[
                  { code: 'nl', label: '🇳🇱 NL' },
                  { code: 'fr', label: '🇫🇷 FR' },
                  { code: 'en', label: '🇬🇧 EN' }
                ].map((l) => (
                  <button
                    key={l.code}
                    onClick={() => setLang(l.code)}
                    className={`py-1.5 px-2 text-xs font-bold rounded-lg transition-all ${
                      lang === l.code 
                        ? 'bg-[#C5A059] text-[#1C1A18] shadow-sm' 
                        : 'text-stone-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* SECTION: BASICS */}
            <div className="space-y-3 pt-2 border-t border-[#38332E]">
              <span className="block text-[11px] font-mono uppercase font-bold text-[#C5A059] tracking-wider">
                Certificaat Kenmerken
              </span>

              {/* Certificate Serial Number */}
              <div>
                <label className="block text-xs text-stone-300 mb-1">
                  Certificaat Nummer
                </label>
                <input
                  type="text"
                  value={certNumber}
                  onChange={(e) => setCertNumber(e.target.value)}
                  className="w-full bg-[#1C1A18] border border-[#38332E] text-white text-xs font-mono rounded-xl p-2 focus:border-[#C5A059] focus:outline-none"
                />
              </div>

              {/* Issued To / Owner */}
              <div>
                <label className="block text-xs text-stone-300 mb-1">
                  Gecertificeerd Voor (Klantnaam)
                </label>
                <input
                  type="text"
                  value={issuedTo}
                  onChange={(e) => setIssuedTo(e.target.value)}
                  placeholder="Bijv. Collectie J. van Dam"
                  className="w-full bg-[#1C1A18] border border-[#38332E] text-white text-xs rounded-xl p-2 focus:border-[#C5A059] focus:outline-none"
                />
              </div>

              {/* Certificate Date */}
              <div>
                <label className="block text-xs text-stone-300 mb-1">
                  Uitgiftedatum
                </label>
                <input
                  type="text"
                  value={certDate}
                  onChange={(e) => setCertDate(e.target.value)}
                  className="w-full bg-[#1C1A18] border border-[#38332E] text-white text-xs rounded-xl p-2 focus:border-[#C5A059] focus:outline-none"
                />
              </div>
            </div>

            {/* SECTION: EDITABLE OBJECT SPECIFICATIONS */}
            <div className="space-y-3 pt-2 border-t border-[#38332E]">
              <span className="block text-[11px] font-mono uppercase font-bold text-[#C5A059] tracking-wider flex items-center justify-between">
                <span>Object Specificaties Aanpassen</span>
                <Edit3 className="w-3.5 h-3.5" />
              </span>

              {/* Title */}
              <div>
                <label className="block text-[11px] text-stone-400 mb-1">Titel / Omschrijving</label>
                <textarea
                  rows={2}
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full bg-[#1C1A18] border border-[#38332E] text-white text-xs rounded-xl p-2 focus:border-[#C5A059] focus:outline-none resize-none"
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-[11px] text-stone-400 mb-1">Ondertitel (Optioneel)</label>
                <input
                  type="text"
                  value={customSubtitle}
                  onChange={(e) => setCustomSubtitle(e.target.value)}
                  className="w-full bg-[#1C1A18] border border-[#38332E] text-white text-xs rounded-xl p-2 focus:border-[#C5A059] focus:outline-none"
                />
              </div>

              {/* Author & Publisher */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-stone-400 mb-1">Auteur / Kunstenaar</label>
                  <input
                    type="text"
                    value={customAuthor}
                    onChange={(e) => setCustomAuthor(e.target.value)}
                    className="w-full bg-[#1C1A18] border border-[#38332E] text-white text-xs rounded-xl p-2 focus:border-[#C5A059] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-stone-400 mb-1">Uitgever / Drukker</label>
                  <input
                    type="text"
                    value={customPublisher}
                    onChange={(e) => setCustomPublisher(e.target.value)}
                    className="w-full bg-[#1C1A18] border border-[#38332E] text-white text-xs rounded-xl p-2 focus:border-[#C5A059] focus:outline-none"
                  />
                </div>
              </div>

              {/* Period & Dimensions */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-stone-400 mb-1">Datering / Eeuw</label>
                  <input
                    type="text"
                    value={customYear}
                    onChange={(e) => setCustomYear(e.target.value)}
                    className="w-full bg-[#1C1A18] border border-[#38332E] text-white text-xs rounded-xl p-2 focus:border-[#C5A059] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-stone-400 mb-1">Formaat / Afmetingen</label>
                  <input
                    type="text"
                    value={customDimensions}
                    onChange={(e) => setCustomDimensions(e.target.value)}
                    className="w-full bg-[#1C1A18] border border-[#38332E] text-white text-xs rounded-xl p-2 focus:border-[#C5A059] focus:outline-none"
                  />
                </div>
              </div>

              {/* Binding / Medium */}
              <div>
                <label className="block text-[11px] text-stone-400 mb-1">Band / Medium</label>
                <textarea
                  rows={2}
                  value={customBinding}
                  onChange={(e) => setCustomBinding(e.target.value)}
                  className="w-full bg-[#1C1A18] border border-[#38332E] text-white text-xs rounded-xl p-2 focus:border-[#C5A059] focus:outline-none resize-none"
                />
              </div>

              {/* Provenance */}
              <div>
                <label className="block text-[11px] text-stone-400 mb-1">Geverifieerde Herkomst (Provenance)</label>
                <textarea
                  rows={2}
                  value={customProvenance}
                  onChange={(e) => setCustomProvenance(e.target.value)}
                  className="w-full bg-[#1C1A18] border border-[#38332E] text-white text-xs rounded-xl p-2 focus:border-[#C5A059] focus:outline-none resize-none"
                />
              </div>

              {/* Guarantee Text */}
              <div>
                <label className="block text-[11px] text-stone-400 mb-1">Garantie Verklaringstekst</label>
                <textarea
                  rows={3}
                  value={customGuaranteeText}
                  onChange={(e) => setCustomGuaranteeText(e.target.value)}
                  className="w-full bg-[#1C1A18] border border-[#38332E] text-white text-xs rounded-xl p-2 focus:border-[#C5A059] focus:outline-none resize-none"
                />
              </div>
            </div>

            {/* SECTION: CUSTOM HANDTEKENING UPLOAD */}
            <div className="pt-2 border-t border-[#38332E] space-y-2">
              <label className="block text-xs font-semibold text-[#C5A059] uppercase tracking-wider flex items-center justify-between">
                <span>Eigen Handtekening Uploaden</span>
                <Upload className="w-3.5 h-3.5" />
              </label>

              <div className="flex items-center space-x-2">
                <label className="flex-1 cursor-pointer py-2 px-3 bg-[#1C1A18] border border-[#38332E] hover:border-[#C5A059] rounded-xl text-xs text-stone-300 flex items-center justify-center space-x-2 transition-colors">
                  <Upload className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span className="truncate">{customSignature ? 'Handtekening gewijzigd' : 'Upload PNG/SVG/JPG'}</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleSignatureUpload}
                    className="hidden" 
                  />
                </label>

                {customSignature && (
                  <button
                    onClick={handleClearSignature}
                    className="p-2 rounded-xl bg-red-950/40 text-red-400 hover:bg-red-900/60 border border-red-900/50"
                    title="Herstel naar Standaard Handtekening"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* SECTION: CUSTOM NOTES */}
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1 flex items-center space-x-1">
                <FileText className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>Aanvullende Notitie (Optioneel)</span>
              </label>
              <textarea
                rows={2}
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="Bijv. Inclusief beschermcassette..."
                className="w-full bg-[#1C1A18] border border-[#38332E] text-white text-xs rounded-xl p-2 focus:border-[#C5A059] focus:outline-none resize-none"
              />
            </div>

            {/* TOGGLES */}
            <div className="space-y-2 pt-2 border-t border-[#38332E]">
              <label className="flex items-center justify-between text-xs text-stone-300 cursor-pointer py-1">
                <span className="flex items-center space-x-2">
                  <ImageIcon className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Foto Toonen</span>
                </span>
                <input
                  type="checkbox"
                  checked={showImage}
                  onChange={(e) => setShowImage(e.target.checked)}
                  className="rounded accent-[#C5A059] w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-stone-300 cursor-pointer py-1">
                <span className="flex items-center space-x-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Gouden Galerij Stempel</span>
                </span>
                <input
                  type="checkbox"
                  checked={showSeal}
                  onChange={(e) => setShowSeal(e.target.checked)}
                  className="rounded accent-[#C5A059] w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-stone-300 cursor-pointer py-1">
                <span className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Handtekening Fabrice</span>
                </span>
                <input
                  type="checkbox"
                  checked={showSignature}
                  onChange={(e) => setShowSignature(e.target.checked)}
                  className="rounded accent-[#C5A059] w-4 h-4 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-4 border-t border-[#38332E]">
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="w-full bg-[#C5A059] hover:bg-[#b08b46] text-[#1C1A18] font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>PDF Bezig met genereren...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download als PDF</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="w-full bg-white/10 hover:bg-white/15 text-white font-medium py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center space-x-2 border border-white/10 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-stone-300" />
              <span>Afdrukken / Print PDF</span>
            </button>
          </div>

        </div>


        {/* ======================================================== */}
        {/* RIGHT PREVIEW CANVAS (Clean Pure Classic COA Sheet)      */}
        {/* ======================================================== */}
        <div className="flex-1 bg-[#12100E] p-4 sm:p-6 lg:p-8 max-h-[85vh] lg:max-h-[90vh] overflow-y-auto flex items-start justify-center print:p-0 print:bg-white print:overflow-visible">
          
          {/* THE CLEAN CERTIFICATE DOCUMENT */}
          <div 
            ref={certRef}
            id="printable-certificate"
            className="w-full max-w-[760px] bg-white text-[#111111] p-8 sm:p-12 shadow-2xl relative border border-[#C5A059]/40 select-none font-serif print:w-full print:max-w-none print:shadow-none print:m-0 print:border-none"
          >
            
            {/* Fine Inner Hairline Border */}
            <div className="border border-[#111111]/15 p-6 sm:p-10 relative">
              
              {/* HEADER SECTION */}
              <div className="text-center space-y-3 pb-6 border-b border-[#111111]/15">
                {/* Brand Logo Header */}
                <div className="flex justify-center mb-2">
                  <img 
                    src="/images/Atelier Rembrandt.png" 
                    alt="Atelier Rembrandt" 
                    className="h-10 sm:h-12 w-auto object-contain filter contrast-125"
                  />
                </div>

                <div className="space-y-1">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-[0.2em] text-[#111111] uppercase font-serif">
                    {t.documentTitle}
                  </h1>
                  <p className="text-[10px] sm:text-xs font-sans font-semibold tracking-widest text-[#8C6D2B] uppercase">
                    {t.subTitle}
                  </p>
                </div>

                {/* Metadata Top Bar */}
                <div className="flex items-center justify-between text-[11px] font-sans pt-4 text-[#444444] px-2">
                  <div>
                    <span className="font-semibold uppercase tracking-wider text-[#8C6D2B] mr-1.5">{t.certNo}:</span>
                    <span className="font-mono font-bold text-[#111111]">{certNumber}</span>
                  </div>
                  <div>
                    <span className="font-semibold uppercase tracking-wider text-[#8C6D2B] mr-1.5">{t.issuedFor}:</span>
                    <span className="font-bold text-[#111111]">{issuedTo}</span>
                  </div>
                  <div>
                    <span className="font-semibold uppercase tracking-wider text-[#8C6D2B] mr-1.5">{t.date}:</span>
                    <span className="font-bold text-[#111111]">{certDate}</span>
                  </div>
                </div>
              </div>

              {/* BODY SECTION — MAIN DETAILS GRID */}
              <div className="py-6 space-y-5">
                
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  
                  {/* Optional Image Thumbnail Frame */}
                  {showImage && primaryImage && (
                    <div className="w-full md:w-36 flex-shrink-0 flex flex-col items-center">
                      <div className="p-1 bg-white border border-[#111111]/20 shadow-xs">
                        <img 
                          src={primaryImage} 
                          alt={customTitle || selectedItem.title}
                          className="w-full h-32 md:h-36 object-cover"
                        />
                      </div>
                      <span className="text-[9px] font-sans text-[#8C6D2B] mt-1.5 uppercase font-bold tracking-wider">
                        {selectedItem.ref}
                      </span>
                    </div>
                  )}

                  {/* Specification Table */}
                  <div className="flex-1 space-y-3 font-sans text-xs">
                    
                    {/* Item Title */}
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-[#8C6D2B] mb-0.5">
                        {t.itemTitle}
                      </span>
                      <p className="font-serif text-sm sm:text-base font-bold text-[#111111] leading-tight">
                        {customTitle}
                      </p>
                      {customSubtitle && (
                        <p className="font-serif text-xs italic text-[#555555] mt-0.5">
                          {customSubtitle}
                        </p>
                      )}
                    </div>

                    {/* Grid of specs */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 pt-1">
                      
                      {customAuthor && (
                        <div>
                          <span className="block text-[9.5px] font-bold uppercase tracking-wider text-[#8C6D2B]">
                            {t.authorPublisher}
                          </span>
                          <span className="font-medium text-[#111111]">{customAuthor}</span>
                          {customPublisher && <span className="text-[#555555]"> ({customPublisher})</span>}
                        </div>
                      )}

                      {customYear && (
                        <div>
                          <span className="block text-[9.5px] font-bold uppercase tracking-wider text-[#8C6D2B]">
                            {t.period}
                          </span>
                          <span className="font-medium text-[#111111]">{customYear}</span>
                        </div>
                      )}

                      {customBinding && (
                        <div className="col-span-2">
                          <span className="block text-[9.5px] font-bold uppercase tracking-wider text-[#8C6D2B]">
                            {t.bindingMedium}
                          </span>
                          <span className="font-medium text-[#111111] leading-relaxed">{customBinding}</span>
                        </div>
                      )}

                      {customDimensions && (
                        <div>
                          <span className="block text-[9.5px] font-bold uppercase tracking-wider text-[#8C6D2B]">
                            {t.dimensions}
                          </span>
                          <span className="font-medium text-[#111111]">{customDimensions}</span>
                        </div>
                      )}

                      {customProvenance && (
                        <div className="col-span-2">
                          <span className="block text-[9.5px] font-bold uppercase tracking-wider text-[#8C6D2B]">
                            {t.provenance}
                          </span>
                          <span className="font-medium text-[#111111] italic">{customProvenance}</span>
                        </div>
                      )}

                      {customNotes && (
                        <div className="col-span-2 bg-[#F9F8F6] p-2.5 rounded border border-[#111111]/10">
                          <span className="block text-[9px] font-bold uppercase tracking-wider text-[#8C6D2B]">
                            Opmerking / Extra Notitie
                          </span>
                          <span className="text-xs text-[#111111]">{customNotes}</span>
                        </div>
                      )}

                    </div>

                  </div>

                </div>

                {/* FORMAL GUARANTEE CLAUSE */}
                <div className="mt-4 pt-4 border-t border-[#111111]/15 text-center space-y-1.5">
                  <span className="text-[10px] font-sans font-bold uppercase tracking-[0.25em] text-[#8C6D2B]">
                    — {t.guaranteeHeader} —
                  </span>
                  <p className="font-serif text-xs sm:text-xs leading-relaxed text-[#2A2A2A] max-w-xl mx-auto italic">
                    "{customGuaranteeText}"
                  </p>
                </div>

              </div>

              {/* FOOTER SECTION: SIGNATURE & GALLERY SEAL */}
              <div className="pt-4 border-t border-[#111111]/15 flex items-end justify-between">
                
                {/* Left: Gallery Seal */}
                <div className="flex items-center space-x-3">
                  {showSeal && (
                    <GallerySeal className="w-20 h-20 sm:w-22 sm:h-22" />
                  )}
                  <div className="text-[9px] font-sans text-[#555555] max-w-[170px] hidden sm:block">
                    <p className="font-bold text-[#111111] uppercase tracking-wider">{t.galleryLocation}</p>
                    <p className="mt-0.5 leading-tight">{t.verifyNotice}</p>
                  </div>
                </div>

                {/* Right: Signature Block */}
                <div className="text-right space-y-1">
                  <span className="block text-[9.5px] font-sans font-bold uppercase tracking-wider text-[#8C6D2B]">
                    Gevalideerd door / Signé par:
                  </span>

                  {showSignature && (
                    <div className="flex justify-end my-1">
                      {customSignature ? (
                        <img 
                          src={customSignature} 
                          alt="Handtekening Fabrice" 
                          className="h-12 sm:h-14 max-w-[180px] object-contain"
                        />
                      ) : (
                        <FabriceSignature className="h-12 sm:h-14 w-auto" color="#111111" />
                      )}
                    </div>
                  )}

                  <div className="space-y-0.5">
                    <span className="block font-serif text-sm font-bold text-[#111111]">
                      Fabrice
                    </span>
                    <span className="block font-sans text-[9px] text-[#555555] font-semibold">
                      {t.expertTitle}
                    </span>
                  </div>
                </div>

              </div>

              {/* Bottom Micro Print Verification Line */}
              <div className="mt-4 pt-2 border-t border-[#111111]/10 flex items-center justify-between text-[8.5px] font-mono text-[#777777]">
                <span>REF: {selectedItem.ref}</span>
                <span>AUTHENTICITY VERIFICATION: {selectedItem.id.toUpperCase()}-AR2026</span>
                <span>WWW.ATELIERREMBRANDT.COM</span>
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
