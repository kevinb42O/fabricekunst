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
  BookOpen
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

  // Sync state when selected item or language changes
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
          if (onShowToast) onShowToast("Nieuwe handtekening opgeslagen!");
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
      if (onShowToast) onShowToast("Standaard handtekening hersteld.");
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
      if (onShowToast) onShowToast("PDF succesvol gegenereerd!");
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
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-[#D8CEB8]">
        <Award className="w-12 h-12 text-[#C5A059] mx-auto mb-3" />
        <h3 className="text-lg font-serif font-bold text-[#111111]">Geen kunstwerk geselecteerd</h3>
        <p className="text-xs text-stone-500 mt-1 mb-4">Voeg eerst een object toe aan de collectie om certificaten te genereren.</p>
        <button 
          onClick={onBackToItems}
          className="px-5 py-2.5 rounded-xl bg-[#111111] text-white text-xs font-bold font-serif"
        >
          Naar Collectie Beheer
        </button>
      </div>
    );
  }

  const primaryImage = selectedItem.images && selectedItem.images.length > 0 ? selectedItem.images[0].url : null;

  return (
    <div className="space-y-8 animate-fade-in text-[#111111]">
      
      {/* TOP HEADER BAR */}
      <div className="p-6 rounded-3xl bg-white border border-[#D8CEB8] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3.5 rounded-2xl bg-[#111111] text-[#C5A059] shadow-md">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#111111]">
                Echtheidscertificaten Studio
              </h2>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-[#C5A059]/15 text-[#8C6D2B]">
                OFFICIAL COA GENERATOR
              </span>
            </div>
            <p className="text-xs text-stone-600 font-sans mt-0.5">
              Stel hoogwaardige echtheidscertificaten op, bewerk alle velden ruimschoots en exporteer direct als PDF.
            </p>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToItems}
            className="px-4 py-2.5 rounded-xl bg-[#FAF7F2] hover:bg-stone-200 text-[#111111] text-xs font-serif font-bold transition-all border border-[#D8CEB8] flex items-center space-x-1.5"
          >
            <ArrowLeft className="w-4 h-4 text-stone-600" />
            <span>Terug naar Collectie</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl bg-[#FAF7F2] hover:bg-stone-200 text-[#111111] text-xs font-serif font-bold transition-all border border-[#D8CEB8] flex items-center space-x-1.5"
          >
            <Printer className="w-4 h-4 text-stone-600" />
            <span>Afdrukken</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="px-6 py-2.5 rounded-xl bg-[#C5A059] hover:bg-[#b08b46] text-[#1C1A18] text-xs font-serif font-bold transition-all shadow-md flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>PDF Genereren...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ======================================================== */}
        {/* LEFT COLUMN: SPACIOUS FULL EDITING FORM (7 Cols)        */}
        {/* ======================================================== */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Card 1: Object & Language Selection */}
          <div className="p-6 rounded-3xl bg-white border border-[#D8CEB8] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAE4D8] pb-3">
              <h3 className="font-serif text-base font-bold text-[#111111] flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-[#C5A059]" />
                <span>Object &amp; Taal Keuze</span>
              </h3>

              {/* Language Switcher */}
              <div className="flex items-center space-x-1 bg-[#FAF7F2] p-1 rounded-xl border border-[#D8CEB8]">
                {[
                  { code: 'nl', label: '🇳🇱 NL' },
                  { code: 'fr', label: '🇫🇷 FR' },
                  { code: 'en', label: '🇬🇧 EN' }
                ].map((l) => (
                  <button
                    key={l.code}
                    onClick={() => setLang(l.code)}
                    className={`py-1 px-2.5 text-xs font-bold rounded-lg transition-all ${
                      lang === l.code 
                        ? 'bg-[#111111] text-white shadow-sm' 
                        : 'text-stone-600 hover:text-[#111111]'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Object Selection */}
            <div>
              <label className="block text-xs font-bold text-[#8C6D2B] uppercase tracking-wider mb-1.5">
                Geselecteerd Object uit Catalogus
              </label>
              <select
                value={selectedItem.id}
                onChange={(e) => handleItemChange(e.target.value)}
                className="w-full bg-[#FAF7F2] border border-[#D8CEB8] text-[#111111] text-sm font-serif font-bold rounded-xl p-3 focus:border-[#C5A059] focus:outline-none"
              >
                {items.map(i => (
                  <option key={i.id} value={i.id}>
                    {i.ref} — {i.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Card 2: Certificaat Kenmerken */}
          <div className="p-6 rounded-3xl bg-white border border-[#D8CEB8] shadow-sm space-y-4">
            <h3 className="font-serif text-base font-bold text-[#111111] flex items-center space-x-2 border-b border-[#EAE4D8] pb-3">
              <Hash className="w-4 h-4 text-[#C5A059]" />
              <span>Certificaat Registratie</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">Certificaat Nr.</label>
                <input
                  type="text"
                  value={certNumber}
                  onChange={(e) => setCertNumber(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#D8CEB8] text-[#111111] text-xs font-mono font-bold rounded-xl p-3 focus:border-[#C5A059] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">Gecertificeerd voor</label>
                <input
                  type="text"
                  value={issuedTo}
                  onChange={(e) => setIssuedTo(e.target.value)}
                  placeholder="Bijv. Collectie J. van Dam"
                  className="w-full bg-[#FAF7F2] border border-[#D8CEB8] text-[#111111] text-xs rounded-xl p-3 focus:border-[#C5A059] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">Uitgiftedatum</label>
                <input
                  type="text"
                  value={certDate}
                  onChange={(e) => setCertDate(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#D8CEB8] text-[#111111] text-xs rounded-xl p-3 focus:border-[#C5A059] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Ruime Object Specificaties (Alles Bewerkbaar!) */}
          <div className="p-6 rounded-3xl bg-white border border-[#D8CEB8] shadow-sm space-y-4">
            <h3 className="font-serif text-base font-bold text-[#111111] flex items-center space-x-2 border-b border-[#EAE4D8] pb-3">
              <Edit3 className="w-4 h-4 text-[#C5A059]" />
              <span>Object Specificaties (Ruim &amp; Volledig Bewerkbaar)</span>
            </h3>

            {/* Titel & Ondertitel */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Titel van het Werk</label>
                <textarea
                  rows={2}
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#D8CEB8] text-[#111111] text-sm font-serif font-bold rounded-xl p-3 focus:border-[#C5A059] focus:outline-none resize-y"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Ondertitel / Extra Beschrijving</label>
                <input
                  type="text"
                  value={customSubtitle}
                  onChange={(e) => setCustomSubtitle(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#D8CEB8] text-[#111111] text-xs font-serif rounded-xl p-3 focus:border-[#C5A059] focus:outline-none"
                />
              </div>
            </div>

            {/* Auteur & Uitgever */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Auteur / Kunstenaar</label>
                <input
                  type="text"
                  value={customAuthor}
                  onChange={(e) => setCustomAuthor(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#D8CEB8] text-[#111111] text-xs rounded-xl p-3 focus:border-[#C5A059] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Uitgever / Drukker</label>
                <input
                  type="text"
                  value={customPublisher}
                  onChange={(e) => setCustomPublisher(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#D8CEB8] text-[#111111] text-xs rounded-xl p-3 focus:border-[#C5A059] focus:outline-none"
                />
              </div>
            </div>

            {/* Datering & Formaat */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Datering / Eeuw</label>
                <input
                  type="text"
                  value={customYear}
                  onChange={(e) => setCustomYear(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#D8CEB8] text-[#111111] text-xs rounded-xl p-3 focus:border-[#C5A059] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Formaat / Afmetingen</label>
                <input
                  type="text"
                  value={customDimensions}
                  onChange={(e) => setCustomDimensions(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#D8CEB8] text-[#111111] text-xs rounded-xl p-3 focus:border-[#C5A059] focus:outline-none"
                />
              </div>
            </div>

            {/* Band / Medium */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Band / Medium / Binderij kenmerken</label>
              <textarea
                rows={3}
                value={customBinding}
                onChange={(e) => setCustomBinding(e.target.value)}
                className="w-full bg-[#FAF7F2] border border-[#D8CEB8] text-[#111111] text-xs rounded-xl p-3 focus:border-[#C5A059] focus:outline-none resize-y"
              />
            </div>

            {/* Provenance */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Geverifieerde Herkomst (Provenance)</label>
              <textarea
                rows={3}
                value={customProvenance}
                onChange={(e) => setCustomProvenance(e.target.value)}
                className="w-full bg-[#FAF7F2] border border-[#D8CEB8] text-[#111111] text-xs rounded-xl p-3 focus:border-[#C5A059] focus:outline-none resize-y"
              />
            </div>

            {/* Guarantee Text */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Garantieverklaring Tekst</label>
              <textarea
                rows={4}
                value={customGuaranteeText}
                onChange={(e) => setCustomGuaranteeText(e.target.value)}
                className="w-full bg-[#FAF7F2] border border-[#D8CEB8] text-[#111111] text-xs font-serif italic rounded-xl p-3 focus:border-[#C5A059] focus:outline-none resize-y"
              />
            </div>

            {/* Custom Notes */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Aanvullende Opmerking op Certificaat</label>
              <textarea
                rows={2}
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="Bijv. Inclusief maatwerk beschermcassette..."
                className="w-full bg-[#FAF7F2] border border-[#D8CEB8] text-[#111111] text-xs rounded-xl p-3 focus:border-[#C5A059] focus:outline-none resize-y"
              />
            </div>
          </div>

          {/* Card 4: Custom Handtekening Upload & Toggles */}
          <div className="p-6 rounded-3xl bg-white border border-[#D8CEB8] shadow-sm space-y-4">
            <h3 className="font-serif text-base font-bold text-[#111111] flex items-center space-x-2 border-b border-[#EAE4D8] pb-3">
              <Upload className="w-4 h-4 text-[#C5A059]" />
              <span>Handtekening &amp; Weergave Opties</span>
            </h3>

            {/* Signature Upload */}
            <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#D8CEB8] space-y-2">
              <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider">
                Fabrice Handtekening Afbeelding Uploaden
              </label>

              <div className="flex items-center space-x-3">
                <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-[#111111] text-white hover:bg-stone-800 transition-all flex items-center space-x-2 font-bold text-xs shadow-md">
                  <Upload className="w-4 h-4 text-[#C5A059]" />
                  <span>{customSignature ? 'Handtekening Wijzigen' : 'Upload PNG / SVG / JPG'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleSignatureUpload} />
                </label>

                {customSignature && (
                  <button
                    type="button"
                    onClick={handleClearSignature}
                    className="px-3 py-2.5 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 text-xs font-bold flex items-center space-x-1"
                    title="Herstel naar Standaard Handtekening"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Herstellen</span>
                  </button>
                )}
              </div>
            </div>

            {/* Visual Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <label className="flex items-center justify-between text-xs text-stone-800 p-3 rounded-xl bg-[#FAF7F2] border border-[#D8CEB8] cursor-pointer">
                <span className="flex items-center space-x-2">
                  <ImageIcon className="w-4 h-4 text-[#C5A059]" />
                  <span className="font-bold">Foto Tonen</span>
                </span>
                <input
                  type="checkbox"
                  checked={showImage}
                  onChange={(e) => setShowImage(e.target.checked)}
                  className="rounded accent-[#C5A059] w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-stone-800 p-3 rounded-xl bg-[#FAF7F2] border border-[#D8CEB8] cursor-pointer">
                <span className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-[#C5A059]" />
                  <span className="font-bold">Gouden Stempel</span>
                </span>
                <input
                  type="checkbox"
                  checked={showSeal}
                  onChange={(e) => setShowSeal(e.target.checked)}
                  className="rounded accent-[#C5A059] w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-stone-800 p-3 rounded-xl bg-[#FAF7F2] border border-[#D8CEB8] cursor-pointer">
                <span className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-[#C5A059]" />
                  <span className="font-bold">Handtekening</span>
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

        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: LIVE CERTIFICATE PREVIEW CARD (5 Cols)     */}
        {/* ======================================================== */}
        <div className="lg:col-span-6 sticky top-6">
          
          <div className="p-4 sm:p-6 rounded-3xl bg-[#1C1A18] border border-[#38332E] shadow-2xl flex flex-col items-center justify-center space-y-4">
            
            <div className="w-full flex items-center justify-between px-2 text-white">
              <span className="text-xs font-mono uppercase font-bold text-[#C5A059] tracking-wider">
                LIVE CERTIFICAAT PREVIEW
              </span>
              <span className="text-[11px] text-stone-400 font-sans">A4 Formaat</span>
            </div>

            {/* THE CERTIFICATE PARCHMENT DOCUMENT */}
            <div 
              ref={certRef}
              id="printable-certificate"
              className="w-full bg-white text-[#111111] p-6 sm:p-10 shadow-2xl relative border border-[#C5A059]/40 select-none font-serif print:w-full print:max-w-none print:shadow-none print:m-0 print:border-none"
            >
              
              {/* Fine Inner Hairline Border */}
              <div className="border border-[#111111]/15 p-5 sm:p-8 relative">
                
                {/* HEADER SECTION */}
                <div className="text-center space-y-3 pb-5 border-b border-[#111111]/15">
                  {/* Brand Logo Header */}
                  <div className="flex justify-center mb-2">
                    <img 
                      src="/images/Atelier Rembrandt.png" 
                      alt="Atelier Rembrandt" 
                      className="h-9 sm:h-11 w-auto object-contain filter contrast-125"
                    />
                  </div>

                  <div className="space-y-0.5">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-[0.2em] text-[#111111] uppercase font-serif">
                      {t.documentTitle}
                    </h1>
                    <p className="text-[9.5px] sm:text-xs font-sans font-semibold tracking-widest text-[#8C6D2B] uppercase">
                      {t.subTitle}
                    </p>
                  </div>

                  {/* Metadata Top Bar */}
                  <div className="flex items-center justify-between text-[10.5px] font-sans pt-3 text-[#444444] px-1">
                    <div>
                      <span className="font-semibold uppercase tracking-wider text-[#8C6D2B] mr-1">{t.certNo}:</span>
                      <span className="font-mono font-bold text-[#111111]">{certNumber}</span>
                    </div>
                    <div>
                      <span className="font-semibold uppercase tracking-wider text-[#8C6D2B] mr-1">{t.issuedFor}:</span>
                      <span className="font-bold text-[#111111]">{issuedTo}</span>
                    </div>
                    <div>
                      <span className="font-semibold uppercase tracking-wider text-[#8C6D2B] mr-1">{t.date}:</span>
                      <span className="font-bold text-[#111111]">{certDate}</span>
                    </div>
                  </div>
                </div>

                {/* BODY SECTION — MAIN DETAILS GRID */}
                <div className="py-5 space-y-4">
                  
                  <div className="flex flex-col sm:flex-row gap-5 items-start">
                    
                    {/* Optional Image Thumbnail Frame */}
                    {showImage && primaryImage && (
                      <div className="w-full sm:w-32 flex-shrink-0 flex flex-col items-center">
                        <div className="p-1 bg-white border border-[#111111]/20 shadow-xs">
                          <img 
                            src={primaryImage} 
                            alt={customTitle || selectedItem.title}
                            className="w-full h-28 sm:h-32 object-cover"
                          />
                        </div>
                        <span className="text-[8.5px] font-sans text-[#8C6D2B] mt-1 uppercase font-bold tracking-wider">
                          {selectedItem.ref}
                        </span>
                      </div>
                    )}

                    {/* Specification Table */}
                    <div className="flex-1 space-y-2.5 font-sans text-[11.5px]">
                      
                      {/* Item Title */}
                      <div>
                        <span className="block text-[9.5px] font-bold uppercase tracking-wider text-[#8C6D2B] mb-0.5">
                          {t.itemTitle}
                        </span>
                        <p className="font-serif text-sm font-bold text-[#111111] leading-tight">
                          {customTitle}
                        </p>
                        {customSubtitle && (
                          <p className="font-serif text-xs italic text-[#555555] mt-0.5">
                            {customSubtitle}
                          </p>
                        )}
                      </div>

                      {/* Grid of specs */}
                      <div className="grid grid-cols-2 gap-x-3 gap-y-2 pt-0.5">
                        
                        {customAuthor && (
                          <div>
                            <span className="block text-[9px] font-bold uppercase tracking-wider text-[#8C6D2B]">
                              {t.authorPublisher}
                            </span>
                            <span className="font-medium text-[#111111]">{customAuthor}</span>
                            {customPublisher && <span className="text-[#555555]"> ({customPublisher})</span>}
                          </div>
                        )}

                        {customYear && (
                          <div>
                            <span className="block text-[9px] font-bold uppercase tracking-wider text-[#8C6D2B]">
                              {t.period}
                            </span>
                            <span className="font-medium text-[#111111]">{customYear}</span>
                          </div>
                        )}

                        {customBinding && (
                          <div className="col-span-2">
                            <span className="block text-[9px] font-bold uppercase tracking-wider text-[#8C6D2B]">
                              {t.bindingMedium}
                            </span>
                            <span className="font-medium text-[#111111] leading-relaxed">{customBinding}</span>
                          </div>
                        )}

                        {customDimensions && (
                          <div>
                            <span className="block text-[9px] font-bold uppercase tracking-wider text-[#8C6D2B]">
                              {t.dimensions}
                            </span>
                            <span className="font-medium text-[#111111]">{customDimensions}</span>
                          </div>
                        )}

                        {customProvenance && (
                          <div className="col-span-2">
                            <span className="block text-[9px] font-bold uppercase tracking-wider text-[#8C6D2B]">
                              {t.provenance}
                            </span>
                            <span className="font-medium text-[#111111] italic">{customProvenance}</span>
                          </div>
                        )}

                        {customNotes && (
                          <div className="col-span-2 bg-[#F9F8F6] p-2 rounded border border-[#111111]/10">
                            <span className="block text-[8.5px] font-bold uppercase tracking-wider text-[#8C6D2B]">
                              Opmerking / Extra Notitie
                            </span>
                            <span className="text-[11px] text-[#111111]">{customNotes}</span>
                          </div>
                        )}

                      </div>

                    </div>

                  </div>

                  {/* FORMAL GUARANTEE CLAUSE */}
                  <div className="mt-3 pt-3 border-t border-[#111111]/15 text-center space-y-1">
                    <span className="text-[9.5px] font-sans font-bold uppercase tracking-[0.2em] text-[#8C6D2B]">
                      — {t.guaranteeHeader} —
                    </span>
                    <p className="font-serif text-[11px] leading-relaxed text-[#2A2A2A] max-w-xl mx-auto italic">
                      "{customGuaranteeText}"
                    </p>
                  </div>

                </div>

                {/* FOOTER SECTION: SIGNATURE & GALLERY SEAL */}
                <div className="pt-3 border-t border-[#111111]/15 flex items-end justify-between">
                  
                  {/* Left: Gallery Seal */}
                  <div className="flex items-center space-x-2.5">
                    {showSeal && (
                      <GallerySeal className="w-18 h-18 sm:w-20 sm:h-20" />
                    )}
                    <div className="text-[8.5px] font-sans text-[#555555] max-w-[160px] hidden sm:block">
                      <p className="font-bold text-[#111111] uppercase tracking-wider">{t.galleryLocation}</p>
                      <p className="mt-0.5 leading-tight">{t.verifyNotice}</p>
                    </div>
                  </div>

                  {/* Right: Signature Block */}
                  <div className="text-right space-y-0.5">
                    <span className="block text-[9px] font-sans font-bold uppercase tracking-wider text-[#8C6D2B]">
                      Gevalideerd door / Signé par:
                    </span>

                    {showSignature && (
                      <div className="flex justify-end my-0.5">
                        {customSignature ? (
                          <img 
                            src={customSignature} 
                            alt="Handtekening Fabrice" 
                            className="h-11 sm:h-13 max-w-[160px] object-contain"
                          />
                        ) : (
                          <FabriceSignature className="h-11 sm:h-13 w-auto" color="#111111" />
                        )}
                      </div>
                    )}

                    <div className="space-y-0.5">
                      <span className="block font-serif text-xs font-bold text-[#111111]">
                        Fabrice
                      </span>
                      <span className="block font-sans text-[8.5px] text-[#555555] font-semibold">
                        {t.expertTitle}
                      </span>
                    </div>
                  </div>

                </div>

                {/* Bottom Micro Print Verification Line */}
                <div className="mt-3 pt-2 border-t border-[#111111]/10 flex items-center justify-between text-[8px] font-mono text-[#777777]">
                  <span>REF: {selectedItem.ref}</span>
                  <span>AUTHENTICITY VERIFICATION: {selectedItem.id.toUpperCase()}-AR2026</span>
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
