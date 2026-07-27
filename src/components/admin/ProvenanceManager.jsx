import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Save, 
  RotateCcw, 
  Upload, 
  Image as ImageIcon, 
  FileText, 
  CheckCircle2, 
  HelpCircle,
  Feather,
  Layers,
  Sparkles
} from 'lucide-react';
import { uploadCatalogImage, DEFAULT_PROVENANCE_DATA } from '../../utils/storage';

export default function ProvenanceManager({ provenanceData, onSaveProvenance, showToast }) {
  const [formData, setFormData] = useState(provenanceData || DEFAULT_PROVENANCE_DATA);
  const [activeSection, setActiveSection] = useState('hero'); // 'hero' | 'protocol' | 'story' | 'cta'
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingStory, setUploadingStory] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleHeroChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      hero: { ...prev.hero, [field]: value }
    }));
  };

  const handleProtocolChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      protocol: { ...prev.protocol, [field]: value }
    }));
  };

  const handleStepChange = (index, field, value) => {
    setFormData(prev => {
      const newSteps = [...(prev.protocol?.steps || [])];
      newSteps[index] = { ...newSteps[index], [field]: value };
      return {
        ...prev,
        protocol: { ...prev.protocol, steps: newSteps }
      };
    });
  };

  const handleStoryChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      story: { ...prev.story, [field]: value }
    }));
  };

  const handleBulletChange = (index, value) => {
    setFormData(prev => {
      const newBullets = [...(prev.story?.bullets || [])];
      newBullets[index] = value;
      return {
        ...prev,
        story: { ...prev.story, bullets: newBullets }
      };
    });
  };

  const handleCtaChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      cta: { ...prev.cta, [field]: value }
    }));
  };

  const handleHeroImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingHero(true);
    try {
      const url = await uploadCatalogImage(file);
      if (url) {
        handleHeroChange('bgImage', url);
        if (showToast) showToast('Hero achtergrondafbeelding geüpload!');
      }
    } catch (err) {
      console.error("Hero image upload error", err);
      if (showToast) showToast('Upload mislukt.');
    } finally {
      setUploadingHero(false);
    }
  };

  const handleStoryImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingStory(true);
    try {
      const url = await uploadCatalogImage(file);
      if (url) {
        handleStoryChange('image', url);
        if (showToast) showToast('Story afbeelding geüpload!');
      }
    } catch (err) {
      console.error("Story image upload error", err);
      if (showToast) showToast('Upload mislukt.');
    } finally {
      setUploadingStory(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveProvenance(formData);
      if (showToast) showToast('Herkomst & Provenance pagina succesvol opgeslagen!');
    } catch (err) {
      console.error("Save error:", err);
      if (showToast) showToast('Fout bij opslaan.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm("Weet u zeker dat u alle Herkomst-teksten wilt herstellen naar de oorspronkelijke standaardwaarden?")) {
      setFormData(DEFAULT_PROVENANCE_DATA);
      if (showToast) showToast('Standaardwaarden hersteld. Vergeet niet op Opslaan te klikken.');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E8E2D6] shadow-xs">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono font-bold uppercase tracking-[0.2em] text-[#C5A059]">
            <ShieldCheck className="w-4 h-4" />
            <span>CMS Pagina Beheer</span>
          </div>
          <h2 className="text-2xl font-serif font-bold text-[#1C1A18] mt-1">
            Herkomst &amp; Provenance Pagina
          </h2>
          <p className="text-xs text-[#78736B] mt-0.5">
            Beheer alle redactionele teksten, verificatiestappen en sfeerbeelden live in de database.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={handleReset}
            className="px-4 py-2.5 bg-[#FAF7F2] hover:bg-[#F3EDE2] text-[#555555] rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-colors border border-[#E8E2D6] flex items-center space-x-2 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Herstellen</span>
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-[#1C1A18] hover:bg-[#C5A059] text-white hover:text-[#1C1A18] rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all duration-300 shadow-md flex items-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-[#C5A059] group-hover:text-[#1C1A18]" />
            <span>{saving ? 'Opslaan...' : 'Wijzigingen Opslaan'}</span>
          </button>
        </div>
      </div>

      {/* Section Selector Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#E8E2D6] pb-2">
        <button
          onClick={() => setActiveSection('hero')}
          className={`px-5 py-2.5 rounded-t-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer border-t border-x ${
            activeSection === 'hero'
              ? 'bg-white text-[#1C1A18] border-[#E8E2D6] border-b-white -mb-px shadow-xs'
              : 'bg-[#FAF7F2] text-[#78736B] border-transparent hover:text-[#1C1A18]'
          }`}
        >
          1. Hero &amp; Header
        </button>
        <button
          onClick={() => setActiveSection('protocol')}
          className={`px-5 py-2.5 rounded-t-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer border-t border-x ${
            activeSection === 'protocol'
              ? 'bg-white text-[#1C1A18] border-[#E8E2D6] border-b-white -mb-px shadow-xs'
              : 'bg-[#FAF7F2] text-[#78736B] border-transparent hover:text-[#1C1A18]'
          }`}
        >
          2. Verificatieprotocol (4 Stappen)
        </button>
        <button
          onClick={() => setActiveSection('story')}
          className={`px-5 py-2.5 rounded-t-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer border-t border-x ${
            activeSection === 'story'
              ? 'bg-white text-[#1C1A18] border-[#E8E2D6] border-b-white -mb-px shadow-xs'
              : 'bg-[#FAF7F2] text-[#78736B] border-transparent hover:text-[#1C1A18]'
          }`}
        >
          3. Ex-Libris Storytelling
        </button>
        <button
          onClick={() => setActiveSection('cta')}
          className={`px-5 py-2.5 rounded-t-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer border-t border-x ${
            activeSection === 'cta'
              ? 'bg-white text-[#1C1A18] border-[#E8E2D6] border-b-white -mb-px shadow-xs'
              : 'bg-[#FAF7F2] text-[#78736B] border-transparent hover:text-[#1C1A18]'
          }`}
        >
          4. Consultatie CTA
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. HERO SECTION EDITOR                                        */}
      {/* ------------------------------------------------------------- */}
      {activeSection === 'hero' && (
        <div className="bg-white p-8 rounded-2xl border border-[#E8E2D6] shadow-xs space-y-6">
          <div className="border-b border-[#E8E2D6] pb-4 mb-6">
            <h3 className="text-lg font-serif font-bold text-[#1C1A18]">
              Hero Header &amp; Achtergrondfoto
            </h3>
            <p className="text-xs text-[#78736B]">
              De bovenzijde van de herkomstpagina met titel, subtitel en visual.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#555555]">
                Badge Label (Boven Titel)
              </label>
              <input
                type="text"
                value={formData.hero?.badge || ''}
                onChange={(e) => handleHeroChange('badge', e.target.value)}
                className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#E8E2D6] rounded-xl text-sm font-sans text-[#1C1A18] focus:outline-none focus:border-[#C5A059]"
                placeholder="Herkomst & Expertise"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#555555]">
                Hoofdtitel (H1)
              </label>
              <input
                type="text"
                value={formData.hero?.title || ''}
                onChange={(e) => handleHeroChange('title', e.target.value)}
                className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#E8E2D6] rounded-xl text-base font-serif font-bold text-[#1C1A18] focus:outline-none focus:border-[#C5A059]"
                placeholder="Gecertificeerde Provenance & Wetenschappelijk Onderzoek"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#555555]">
                Subtitel / Introductietekst
              </label>
              <textarea
                rows={3}
                value={formData.hero?.subtitle || ''}
                onChange={(e) => handleHeroChange('subtitle', e.target.value)}
                className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#E8E2D6] rounded-xl text-sm font-sans text-[#1C1A18] focus:outline-none focus:border-[#C5A059]"
                placeholder="Elk zeldzaam meesterwerk..."
              />
            </div>

            <div className="space-y-3 md:col-span-2 pt-2">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#555555]">
                Hero Achtergrondafbeelding
              </label>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="relative w-40 h-24 rounded-xl overflow-hidden border border-[#E8E2D6] bg-[#FAF7F2] shrink-0">
                  {formData.hero?.bgImage ? (
                    <img src={formData.hero.bgImage} alt="Hero bg preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#999999] text-xs">Geen afbeelding</div>
                  )}
                </div>

                <div className="space-y-2 grow">
                  <input
                    type="text"
                    value={formData.hero?.bgImage || ''}
                    onChange={(e) => handleHeroChange('bgImage', e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#FAF7F2] border border-[#E8E2D6] rounded-xl text-xs font-mono text-[#1C1A18] focus:outline-none focus:border-[#C5A059]"
                    placeholder="/images/hero/hero-voltaire-exlibris.jpg of Supabase URL"
                  />

                  <label className="inline-flex items-center space-x-2 px-4 py-2 bg-[#1C1A18] hover:bg-[#C5A059] text-white hover:text-[#1C1A18] text-xs font-mono uppercase font-bold tracking-wider rounded-lg transition-colors cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingHero ? 'Uploaden...' : 'Nieuwe Foto Uploaden'}</span>
                    <input type="file" accept="image/*" onChange={handleHeroImageUpload} className="hidden" />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. VERIFICATIEPROTOCOL EDITOR                                  */}
      {/* ------------------------------------------------------------- */}
      {activeSection === 'protocol' && (
        <div className="bg-white p-8 rounded-2xl border border-[#E8E2D6] shadow-xs space-y-6">
          <div className="border-b border-[#E8E2D6] pb-4 mb-6">
            <h3 className="text-lg font-serif font-bold text-[#1C1A18]">
              Het 4-Stappen Protocol van Authenticiteit
            </h3>
            <p className="text-xs text-[#78736B]">
              Bewerk de koppen en beschrijvingen van de 4 stappen uit het authenticiteitsonderzoek.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4 border-b border-[#E8E2D6]">
            <div className="space-y-2">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#555555]">
                Sectie Badge
              </label>
              <input
                type="text"
                value={formData.protocol?.badge || ''}
                onChange={(e) => handleProtocolChange('badge', e.target.value)}
                className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#E8E2D6] rounded-xl text-sm font-sans text-[#1C1A18] focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#555555]">
                Sectie Titel (H2)
              </label>
              <input
                type="text"
                value={formData.protocol?.title || ''}
                onChange={(e) => handleProtocolChange('title', e.target.value)}
                className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#E8E2D6] rounded-xl text-base font-serif font-bold text-[#1C1A18] focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#555555]">
                Sectie Subtitel
              </label>
              <textarea
                rows={2}
                value={formData.protocol?.subtitle || ''}
                onChange={(e) => handleProtocolChange('subtitle', e.target.value)}
                className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#E8E2D6] rounded-xl text-sm font-sans text-[#1C1A18] focus:outline-none focus:border-[#C5A059]"
              />
            </div>
          </div>

          {/* 4 Steps Grid */}
          <div className="space-y-4 pt-2">
            <h4 className="text-sm font-serif font-bold text-[#1C1A18] uppercase tracking-wider">
              De 4 Verificatiestappen
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(formData.protocol?.steps || []).map((step, idx) => (
                <div key={idx} className="p-5 bg-[#FAF7F2] border border-[#E8E2D6] rounded-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E8E2D6] pb-2">
                    <span className="text-base font-serif font-bold text-[#C5A059]">
                      Stap {step.step || `0${idx + 1}`}
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase text-[#888888]">
                      Fase 0{idx + 1}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#555555]">
                      Titel van Stap 0{idx + 1}
                    </label>
                    <input
                      type="text"
                      value={step.title || ''}
                      onChange={(e) => handleStepChange(idx, 'title', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#E8E2D6] rounded-lg text-sm font-serif font-bold text-[#1C1A18] focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#555555]">
                      Beschrijving
                    </label>
                    <textarea
                      rows={3}
                      value={step.description || ''}
                      onChange={(e) => handleStepChange(idx, 'description', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#E8E2D6] rounded-lg text-xs font-sans text-[#333333] focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. EX-LIBRIS STORYTELLING EDITOR                              */}
      {/* ------------------------------------------------------------- */}
      {activeSection === 'story' && (
        <div className="bg-white p-8 rounded-2xl border border-[#E8E2D6] shadow-xs space-y-6">
          <div className="border-b border-[#E8E2D6] pb-4 mb-6">
            <h3 className="text-lg font-serif font-bold text-[#1C1A18]">
              Ex-Libris &amp; Historie Verhaallijn
            </h3>
            <p className="text-xs text-[#78736B]">
              Bewerk de uitgelichte verhaallijn over Franse verzamelaars, het citaat en de foto-showcase.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#555555]">
                Sectie Badge
              </label>
              <input
                type="text"
                value={formData.story?.badge || ''}
                onChange={(e) => handleStoryChange('badge', e.target.value)}
                className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#E8E2D6] rounded-xl text-sm font-sans text-[#1C1A18] focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#555555]">
                Hoofdtitel Verhaallijn
              </label>
              <input
                type="text"
                value={formData.story?.title || ''}
                onChange={(e) => handleStoryChange('title', e.target.value)}
                className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#E8E2D6] rounded-xl text-base font-serif font-bold text-[#1C1A18] focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#555555]">
                Geïnspireerd Citaat (Quote)
              </label>
              <textarea
                rows={2}
                value={formData.story?.quote || ''}
                onChange={(e) => handleStoryChange('quote', e.target.value)}
                className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#E8E2D6] rounded-xl text-sm font-serif italic text-[#1C1A18] focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#555555]">
                Auteur van Citaat
              </label>
              <input
                type="text"
                value={formData.story?.quoteAuthor || ''}
                onChange={(e) => handleStoryChange('quoteAuthor', e.target.value)}
                className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#E8E2D6] rounded-xl text-sm font-mono text-[#1C1A18] focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#555555]">
                Redactionele Beschrijving (Narrative)
              </label>
              <textarea
                rows={3}
                value={formData.story?.narrative || ''}
                onChange={(e) => handleStoryChange('narrative', e.target.value)}
                className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#E8E2D6] rounded-xl text-sm font-sans text-[#1C1A18] focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            {/* Bullets */}
            <div className="space-y-3 md:col-span-2 pt-2">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#555555]">
                Belangrijkste Kenmerken / Bullets
              </label>
              {(formData.story?.bullets || []).map((bullet, idx) => (
                <div key={idx} className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-[#C5A059]" />
                  <input
                    type="text"
                    value={bullet || ''}
                    onChange={(e) => handleBulletChange(idx, e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#FAF7F2] border border-[#E8E2D6] rounded-xl text-xs font-mono text-[#1C1A18] focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
              ))}
            </div>

            {/* Story Showcase Image */}
            <div className="space-y-3 md:col-span-2 pt-4 border-t border-[#E8E2D6]">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#555555]">
                Showcase Fotografie (Ex-Libris voorbeeld)
              </label>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="relative w-40 h-28 rounded-xl overflow-hidden border border-[#E8E2D6] bg-[#FAF7F2] shrink-0">
                  {formData.story?.image ? (
                    <img src={formData.story.image} alt="Story preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#999999] text-xs">Geen afbeelding</div>
                  )}
                </div>

                <div className="space-y-2 grow">
                  <input
                    type="text"
                    value={formData.story?.image || ''}
                    onChange={(e) => handleStoryChange('image', e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#FAF7F2] border border-[#E8E2D6] rounded-xl text-xs font-mono text-[#1C1A18] focus:outline-none focus:border-[#C5A059]"
                    placeholder="/images/voltaire-marbled-endpaper-exlibris.jpg of Supabase URL"
                  />

                  <input
                    type="text"
                    value={formData.story?.imageCaption || ''}
                    onChange={(e) => handleStoryChange('imageCaption', e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#FAF7F2] border border-[#E8E2D6] rounded-xl text-xs font-serif italic text-[#555555] focus:outline-none focus:border-[#C5A059]"
                    placeholder="Fotobijschrift..."
                  />

                  <label className="inline-flex items-center space-x-2 px-4 py-2 bg-[#1C1A18] hover:bg-[#C5A059] text-white hover:text-[#1C1A18] text-xs font-mono uppercase font-bold tracking-wider rounded-lg transition-colors cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingStory ? 'Uploaden...' : 'Showcase Foto Uploaden'}</span>
                    <input type="file" accept="image/*" onChange={handleStoryImageUpload} className="hidden" />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. PRIVÉ CONSULTATIE CTA EDITOR                               */}
      {/* ------------------------------------------------------------- */}
      {activeSection === 'cta' && (
        <div className="bg-white p-8 rounded-2xl border border-[#E8E2D6] shadow-xs space-y-6">
          <div className="border-b border-[#E8E2D6] pb-4 mb-6">
            <h3 className="text-lg font-serif font-bold text-[#1C1A18]">
              Privé Consultatie Call-to-Action
            </h3>
            <p className="text-xs text-[#78736B]">
              De uitnodiging onderaan de herkomstpagina voor particuliere expertise en verificatie.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#555555]">
                CTA Badge
              </label>
              <input
                type="text"
                value={formData.cta?.badge || ''}
                onChange={(e) => handleCtaChange('badge', e.target.value)}
                className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#E8E2D6] rounded-xl text-sm font-sans text-[#1C1A18] focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#555555]">
                CTA Hoofdtitel
              </label>
              <input
                type="text"
                value={formData.cta?.title || ''}
                onChange={(e) => handleCtaChange('title', e.target.value)}
                className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#E8E2D6] rounded-xl text-base font-serif font-bold text-[#1C1A18] focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#555555]">
                CTA Beschrijving
              </label>
              <textarea
                rows={3}
                value={formData.cta?.subtitle || ''}
                onChange={(e) => handleCtaChange('subtitle', e.target.value)}
                className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#E8E2D6] rounded-xl text-sm font-sans text-[#1C1A18] focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#555555]">
                Knop Tekst
              </label>
              <input
                type="text"
                value={formData.cta?.buttonText || ''}
                onChange={(e) => handleCtaChange('buttonText', e.target.value)}
                className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#E8E2D6] rounded-xl text-sm font-mono font-bold uppercase text-[#1C1A18] focus:outline-none focus:border-[#C5A059]"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
