import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Save, 
  RotateCcw, 
  Upload, 
  Image as ImageIcon, 
  Globe,
  Sparkles,
  Download,
  Copy,
  X
} from 'lucide-react';
import { uploadCatalogImage, DEFAULT_PROVENANCE_DATA } from '../../utils/storage';
import { copyTextToClipboard, parseAiJsonTranslation } from '../../utils/translationService';

export default function ProvenanceManager({ provenanceData, onSaveProvenance, showToast }) {
  const [formData, setFormData] = useState(provenanceData || DEFAULT_PROVENANCE_DATA);
  const [activeSection, setActiveSection] = useState('hero'); // 'hero' | 'protocol' | 'story' | 'cta'
  const [formLang, setFormLang] = useState('nl'); // 'nl' | 'en' | 'fr'
  const [uploadingStory, setUploadingStory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAiImportModal, setShowAiImportModal] = useState(false);
  const [aiJsonInput, setAiJsonInput] = useState('');

  const getFieldValue = (section, field) => {
    if (!formData[section]) return '';
    if (formLang === 'nl') {
      return formData[section][field] || '';
    }
    const langKey = `${field}_${formLang}`;
    return formData[section][langKey] !== undefined ? formData[section][langKey] : '';
  };

  const updateFieldValue = (section, field, value) => {
    setFormData(prev => {
      const sectionData = { ...(prev[section] || {}) };
      if (formLang === 'nl') {
        sectionData[field] = value;
      } else {
        const langKey = `${field}_${formLang}`;
        sectionData[langKey] = value;
      }
      return {
        ...prev,
        [section]: sectionData
      };
    });
  };

  const getStepField = (index, field) => {
    const step = formData.protocol?.steps?.[index];
    if (!step) return '';
    if (formLang === 'nl') return step[field] || '';
    const langKey = `${field}_${formLang}`;
    return step[langKey] !== undefined ? step[langKey] : '';
  };

  const updateStepField = (index, field, value) => {
    setFormData(prev => {
      const newSteps = [...(prev.protocol?.steps || [])];
      const targetStep = { ...(newSteps[index] || {}) };
      if (formLang === 'nl') {
        targetStep[field] = value;
      } else {
        const langKey = `${field}_${formLang}`;
        targetStep[langKey] = value;
      }
      newSteps[index] = targetStep;
      return {
        ...prev,
        protocol: { ...(prev.protocol || {}), steps: newSteps }
      };
    });
  };

  const getBulletValue = (index) => {
    const story = formData.story || {};
    if (formLang === 'nl') return story.bullets?.[index] || '';
    const langKey = `bullets_${formLang}`;
    const localizedBullets = story[langKey];
    if (Array.isArray(localizedBullets) && localizedBullets[index] !== undefined) {
      return localizedBullets[index];
    }
    return '';
  };

  const updateBulletValue = (index, value) => {
    setFormData(prev => {
      const story = { ...(prev.story || {}) };
      if (formLang === 'nl') {
        const newBullets = [...(story.bullets || [])];
        newBullets[index] = value;
        story.bullets = newBullets;
      } else {
        const langKey = `bullets_${formLang}`;
        const existing = story[langKey] || [];
        const newBullets = [...existing];
        newBullets[index] = value;
        story[langKey] = newBullets;
      }
      return {
        ...prev,
        story
      };
    });
  };

  const handleStoryImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingStory(true);
    try {
      const url = await uploadCatalogImage(file);
      if (url) {
        setFormData(prev => ({
          ...prev,
          story: { ...(prev.story || {}), image: url }
        }));
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

  const handleCopyAiPrompt = async () => {
    let sourceLangName = 'Nederlands';
    let targetLangInstruction = 'Engels (en) en Frans (fr)';
    let sampleJson = {
      hero_title_en: "", hero_title_fr: "",
      hero_subtitle_en: "", hero_subtitle_fr: "",
      story_title_en: "", story_title_fr: "",
      story_quote_en: "", story_quote_fr: "",
      story_narrative_en: "", story_narrative_fr: "",
      cta_title_en: "", cta_title_fr: "",
      cta_subtitle_en: "", cta_subtitle_fr: ""
    };

    if (formLang === 'en') {
      sourceLangName = 'Engels';
      targetLangInstruction = 'Nederlands (nl) en Frans (fr)';
      sampleJson = {
        hero_title: "", hero_title_fr: "",
        hero_subtitle: "", hero_subtitle_fr: "",
        story_title: "", story_title_fr: "",
        story_quote: "", story_quote_fr: "",
        story_narrative: "", story_narrative_fr: "",
        cta_title: "", cta_title_fr: "",
        cta_subtitle: "", cta_subtitle_fr: ""
      };
    } else if (formLang === 'fr') {
      sourceLangName = 'Frans';
      targetLangInstruction = 'Nederlands (nl) en Engels (en)';
      sampleJson = {
        hero_title: "", hero_title_en: "",
        hero_subtitle: "", hero_subtitle_en: "",
        story_title: "", story_title_en: "",
        story_quote: "", story_quote_en: "",
        story_narrative: "", story_narrative_en: "",
        cta_title: "", cta_title_en: "",
        cta_subtitle: "", cta_subtitle_en: ""
      };
    }

    let promptText = `Vertaal de onderstaande teksten van de Herkomst & Provenance pagina van het ${sourceLangName} naar ${targetLangInstruction}.\n`;
    promptText += `Gebruik hoogwaardige, elegante museum en antiquariaat terminologie.\n`;
    promptText += `Als een veld leeg is, vul dan in de JSON een lege string "" in.\n\n`;
    promptText += `Retourneer UITSLUITEND een geldig JSON object (geen inleidende tekst of markdown opmaak):\n\n`;
    promptText += `${JSON.stringify(sampleJson, null, 2)}\n\n`;
    promptText += `BRONGEGEVENS (${sourceLangName.toUpperCase()}):\n---------------------------\n`;
    promptText += `* Hero Titel: ${getFieldValue('hero', 'title') || '[Niet ingevuld / Bewust leeg]'}\n`;
    promptText += `* Hero Subtitel: ${getFieldValue('hero', 'subtitle') || '[Niet ingevuld / Bewust leeg]'}\n`;
    promptText += `* Story Titel: ${getFieldValue('story', 'title') || '[Niet ingevuld / Bewust leeg]'}\n`;
    promptText += `* Story Quote: ${getFieldValue('story', 'quote') || '[Niet ingevuld / Bewust leeg]'}\n`;
    promptText += `* Story Narrative: ${getFieldValue('story', 'narrative') || '[Niet ingevuld / Bewust leeg]'}\n`;
    promptText += `* CTA Titel: ${getFieldValue('cta', 'title') || '[Niet ingevuld / Bewust leeg]'}\n`;
    promptText += `* CTA Beschrijving: ${getFieldValue('cta', 'subtitle') || '[Niet ingevuld / Bewust leeg]'}\n`;

    const success = await copyTextToClipboard(promptText);
    if (success && showToast) {
      showToast(`📋 AI Vertaal-prompt voor Herkomst (bron: ${sourceLangName}) gekopieerd naar klembord!`);
    }
  };

  const handleImportAiTranslation = () => {
    if (!aiJsonInput || !aiJsonInput.trim()) return;

    const data = parseAiJsonTranslation(aiJsonInput);
    if (!data) {
      if (showToast) showToast("⚠️ Ongeldige JSON code. Controleer het resultaat van de AI.");
      return;
    }

    setFormData(prev => {
      const next = { ...prev };
      Object.keys(data).forEach(fullKey => {
        const val = data[fullKey];
        if (typeof val !== 'string' || !val.trim()) return;

        const parts = fullKey.split('_');
        const section = parts[0];
        if (['hero', 'story', 'cta'].includes(section)) {
          const prop = fullKey.substring(section.length + 1);
          if (prop) {
            next[section] = { ...(next[section] || {}), [prop]: val };
          }
        }
      });

      return next;
    });

    setShowAiImportModal(false);
    setAiJsonInput('');
    if (showToast) showToast("✨ Success! Herkomst pagina vertalingen geïmporteerd.");
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
            Beheer zelf uw teksten in het Nederlands, Engels en Frans.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex items-center space-x-1.5 bg-[#FAF7F2] p-1 rounded-xl border border-[#E8E2D6]">
            <button
              type="button"
              onClick={handleCopyAiPrompt}
              className="px-3 py-2 rounded-lg bg-[#1C1A18] text-[#FAF7F2] hover:bg-[#C5A059] hover:text-[#1C1A18] text-xs font-mono font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs"
              title="Kopieer herkomst-teksten als AI vertaal-prompt"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Prompt</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAiImportModal(true)}
              className="px-3 py-2 rounded-lg bg-white hover:bg-[#F3EDE2] text-[#1C1A18] border border-[#E8E2D6] text-xs font-mono font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs"
              title="Importeer AI JSON vertaling"
            >
              <Download className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Importeer</span>
            </button>
          </div>

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

      {/* Language Selection Tabs (NL / EN / FR) */}
      <div className="p-4 bg-white rounded-2xl border border-[#E8E2D6] flex items-center justify-between flex-wrap gap-4 shadow-xs">
        <div className="flex items-center space-x-2">
          <Globe className="w-4 h-4 text-[#C5A059]" />
          <span className="text-xs font-serif font-bold text-[#1C1A18]">Invoertaal bewerken:</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setFormLang('nl')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center space-x-2 transition-all cursor-pointer border ${
              formLang === 'nl'
                ? 'bg-[#1C1A18] text-white border-[#1C1A18] shadow-sm'
                : 'bg-[#FAF7F2] text-[#555555] border-[#E8E2D6] hover:text-[#1C1A18]'
            }`}
          >
            <span>🇳🇱</span>
            <span>Nederlands (NL)</span>
          </button>

          <button
            type="button"
            onClick={() => setFormLang('en')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center space-x-2 transition-all cursor-pointer border ${
              formLang === 'en'
                ? 'bg-[#1C1A18] text-white border-[#1C1A18] shadow-sm'
                : 'bg-[#FAF7F2] text-[#555555] border-[#E8E2D6] hover:text-[#1C1A18]'
            }`}
          >
            <span>🇬🇧</span>
            <span>English (EN)</span>
          </button>

          <button
            type="button"
            onClick={() => setFormLang('fr')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center space-x-2 transition-all cursor-pointer border ${
              formLang === 'fr'
                ? 'bg-[#1C1A18] text-white border-[#1C1A18] shadow-sm'
                : 'bg-[#FAF7F2] text-[#555555] border-[#E8E2D6] hover:text-[#1C1A18]'
            }`}
          >
            <span>🇫🇷</span>
            <span>Français (FR)</span>
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
          <div className="border-b border-[#E8E2D6] pb-4 mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-serif font-bold text-[#1C1A18]">
                Hero Header Teksten
              </h3>
              <p className="text-xs text-[#78736B]">
                De bovenzijde van de herkomstpagina met titel, subtitel en badges.
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#FAF7F2] text-[#B8860B] border border-[#D8CEB8]">
              {formLang === 'nl' ? '🇳🇱 Nederlands' : formLang === 'en' ? '🇬🇧 English' : '🇫🇷 Français'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#555555]">
                Badge Label ({formLang.toUpperCase()})
              </label>
              <input
                type="text"
                value={getFieldValue('hero', 'badge')}
                onChange={(e) => updateFieldValue('hero', 'badge', e.target.value)}
                className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#E8E2D6] rounded-xl text-sm font-sans text-[#1C1A18] focus:outline-none focus:border-[#C5A059]"
                placeholder="Herkomst & Expertise"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#555555]">
                Hoofdtitel H1 ({formLang.toUpperCase()})
              </label>
              <input
                type="text"
                value={getFieldValue('hero', 'title')}
                onChange={(e) => updateFieldValue('hero', 'title', e.target.value)}
                className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#E8E2D6] rounded-xl text-base font-serif font-bold text-[#1C1A18] focus:outline-none focus:border-[#C5A059]"
                placeholder="Gecertificeerde Provenance & Wetenschappelijk Onderzoek"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#555555]">
                Subtitel / Introductietekst ({formLang.toUpperCase()})
              </label>
              <textarea
                rows={3}
                value={getFieldValue('hero', 'subtitle')}
                onChange={(e) => updateFieldValue('hero', 'subtitle', e.target.value)}
                className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#E8E2D6] rounded-xl text-sm font-sans text-[#1C1A18] focus:outline-none focus:border-[#C5A059]"
                placeholder="Elk zeldzaam meesterwerk..."
              />
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. VERIFICATIEPROTOCOL EDITOR                                  */}
      {/* ------------------------------------------------------------- */}
      {activeSection === 'protocol' && (
        <div className="bg-white p-8 rounded-2xl border border-[#E8E2D6] shadow-xs space-y-6">
          <div className="border-b border-[#E8E2D6] pb-4 mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-serif font-bold text-[#1C1A18]">
                Het 4-Stappen Protocol van Authenticiteit
              </h3>
              <p className="text-xs text-[#78736B]">
                Bewerk de koppen en beschrijvingen van de 4 stappen uit het authenticiteitsonderzoek.
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#FAF7F2] text-[#B8860B] border border-[#D8CEB8]">
              {formLang === 'nl' ? '🇳🇱 Nederlands' : formLang === 'en' ? '🇬🇧 English' : '🇫🇷 Français'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4 border-b border-[#E8E2D6]">
            <div className="space-y-2">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#555555]">
                Sectie Badge ({formLang.toUpperCase()})
              </label>
              <input
                type="text"
                value={getFieldValue('protocol', 'badge')}
                onChange={(e) => updateFieldValue('protocol', 'badge', e.target.value)}
                className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#E8E2D6] rounded-xl text-sm font-sans text-[#1C1A18] focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#555555]">
                Sectie Titel H2 ({formLang.toUpperCase()})
              </label>
              <input
                type="text"
                value={getFieldValue('protocol', 'title')}
                onChange={(e) => updateFieldValue('protocol', 'title', e.target.value)}
                className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#E8E2D6] rounded-xl text-base font-serif font-bold text-[#1C1A18] focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#555555]">
                Sectie Subtitel ({formLang.toUpperCase()})
              </label>
              <textarea
                rows={2}
                value={getFieldValue('protocol', 'subtitle')}
                onChange={(e) => updateFieldValue('protocol', 'subtitle', e.target.value)}
                className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#E8E2D6] rounded-xl text-sm font-sans text-[#1C1A18] focus:outline-none focus:border-[#C5A059]"
              />
            </div>
          </div>

          {/* 4 Steps Grid */}
          <div className="space-y-4 pt-2">
            <h4 className="text-sm font-serif font-bold text-[#1C1A18] uppercase tracking-wider">
              De 4 Verificatiestappen ({formLang.toUpperCase()})
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(formData.protocol?.steps || []).map((step, idx) => (
                <div key={idx} className="p-5 bg-[#FAF7F2] border border-[#E8E2D6] rounded-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E8E2D6] pb-2">
                    <span className="text-base font-serif font-bold text-[#C5A059]">
                      Stap {step.step || `0${idx + 1}`}
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase text-[#888888]">
                      Fase 0{idx + 1} ({formLang.toUpperCase()})
                    </span>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#555555]">
                      Titel van Stap 0{idx + 1}
                    </label>
                    <input
                      type="text"
                      value={getStepField(idx, 'title')}
                      onChange={(e) => updateStepField(idx, 'title', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#E8E2D6] rounded-lg text-sm font-serif font-bold text-[#1C1A18] focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#555555]">
                      Beschrijving
                    </label>
                    <textarea
                      rows={3}
                      value={getStepField(idx, 'description')}
                      onChange={(e) => updateStepField(idx, 'description', e.target.value)}
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
          <div className="border-b border-[#E8E2D6] pb-4 mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-serif font-bold text-[#1C1A18]">
                Ex-Libris &amp; Historie Verhaallijn
              </h3>
              <p className="text-xs text-[#78736B]">
                Bewerk de uitgelichte verhaallijn over Franse verzamelaars, het citaat en de foto-showcase.
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#FAF7F2] text-[#B8860B] border border-[#D8CEB8]">
              {formLang === 'nl' ? '🇳🇱 Nederlands' : formLang === 'en' ? '🇬🇧 English' : '🇫🇷 Français'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#555555]">
                Sectie Badge ({formLang.toUpperCase()})
              </label>
              <input
                type="text"
                value={getFieldValue('story', 'badge')}
                onChange={(e) => updateFieldValue('story', 'badge', e.target.value)}
                className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#E8E2D6] rounded-xl text-sm font-sans text-[#1C1A18] focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#555555]">
                Hoofdtitel Verhaallijn ({formLang.toUpperCase()})
              </label>
              <input
                type="text"
                value={getFieldValue('story', 'title')}
                onChange={(e) => updateFieldValue('story', 'title', e.target.value)}
                className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#E8E2D6] rounded-xl text-base font-serif font-bold text-[#1C1A18] focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#555555]">
                Geïnspireerd Citaat (Quote) ({formLang.toUpperCase()})
              </label>
              <textarea
                rows={2}
                value={getFieldValue('story', 'quote')}
                onChange={(e) => updateFieldValue('story', 'quote', e.target.value)}
                className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#E8E2D6] rounded-xl text-sm font-serif italic text-[#1C1A18] focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#555555]">
                Auteur van Citaat ({formLang.toUpperCase()})
              </label>
              <input
                type="text"
                value={getFieldValue('story', 'quoteAuthor')}
                onChange={(e) => updateFieldValue('story', 'quoteAuthor', e.target.value)}
                className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#E8E2D6] rounded-xl text-sm font-mono text-[#1C1A18] focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#555555]">
                Redactionele Beschrijving (Narrative) ({formLang.toUpperCase()})
              </label>
              <textarea
                rows={3}
                value={getFieldValue('story', 'narrative')}
                onChange={(e) => updateFieldValue('story', 'narrative', e.target.value)}
                className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#E8E2D6] rounded-xl text-sm font-sans text-[#1C1A18] focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            {/* Bullets */}
            <div className="space-y-3 md:col-span-2 pt-2">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#555555]">
                Belangrijkste Kenmerken / Bullets ({formLang.toUpperCase()})
              </label>
              {(formData.story?.bullets || []).map((_, idx) => (
                <div key={idx} className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-[#C5A059]" />
                  <input
                    type="text"
                    value={getBulletValue(idx)}
                    onChange={(e) => updateBulletValue(idx, e.target.value)}
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
                    onChange={(e) => setFormData(prev => ({ ...prev, story: { ...prev.story, image: e.target.value } }))}
                    className="w-full px-4 py-2.5 bg-[#FAF7F2] border border-[#E8E2D6] rounded-xl text-xs font-mono text-[#1C1A18] focus:outline-none focus:border-[#C5A059]"
                    placeholder="/images/voltaire-marbled-endpaper-exlibris.jpg of Supabase URL"
                  />

                  <input
                    type="text"
                    value={getFieldValue('story', 'imageCaption')}
                    onChange={(e) => updateFieldValue('story', 'imageCaption', e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#FAF7F2] border border-[#E8E2D6] rounded-xl text-xs font-serif italic text-[#555555] focus:outline-none focus:border-[#C5A059]"
                    placeholder={`Fotobijschrift (${formLang.toUpperCase()})...`}
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
          <div className="border-b border-[#E8E2D6] pb-4 mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-serif font-bold text-[#1C1A18]">
                Privé Consultatie Call-to-Action
              </h3>
              <p className="text-xs text-[#78736B]">
                De uitnodiging onderaan de herkomstpagina voor particuliere expertise en verificatie.
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#FAF7F2] text-[#B8860B] border border-[#D8CEB8]">
              {formLang === 'nl' ? '🇳🇱 Nederlands' : formLang === 'en' ? '🇬🇧 English' : '🇫🇷 Français'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#555555]">
                CTA Badge ({formLang.toUpperCase()})
              </label>
              <input
                type="text"
                value={getFieldValue('cta', 'badge')}
                onChange={(e) => updateFieldValue('cta', 'badge', e.target.value)}
                className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#E8E2D6] rounded-xl text-sm font-sans text-[#1C1A18] focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#555555]">
                CTA Hoofdtitel ({formLang.toUpperCase()})
              </label>
              <input
                type="text"
                value={getFieldValue('cta', 'title')}
                onChange={(e) => updateFieldValue('cta', 'title', e.target.value)}
                className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#E8E2D6] rounded-xl text-base font-serif font-bold text-[#1C1A18] focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#555555]">
                CTA Beschrijving ({formLang.toUpperCase()})
              </label>
              <textarea
                rows={3}
                value={getFieldValue('cta', 'subtitle')}
                onChange={(e) => updateFieldValue('cta', 'subtitle', e.target.value)}
                className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#E8E2D6] rounded-xl text-sm font-sans text-[#1C1A18] focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#555555]">
                Knop Tekst ({formLang.toUpperCase()})
              </label>
              <input
                type="text"
                value={getFieldValue('cta', 'buttonText')}
                onChange={(e) => updateFieldValue('cta', 'buttonText', e.target.value)}
                className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#E8E2D6] rounded-xl text-sm font-mono font-bold uppercase text-[#1C1A18] focus:outline-none focus:border-[#C5A059]"
              />
            </div>
          </div>
        </div>
      )}

      {/* AI TRANSLATION IMPORT POPUP MODAL */}
      {showAiImportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#FAF7F2] text-[#111111] rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 border border-[#D8CEB8] shadow-strong">
            <div className="flex items-center justify-between border-b border-[#D8CEB8] pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-[#111111] text-[#C5A059] flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-[#111111]">
                    Importeer Herkomst AI Vertaling (JSON)
                  </h3>
                  <p className="text-xs text-stone-600 font-sans">
                    Plak hieronder het JSON antwoord van ChatGPT of Claude.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAiImportModal(false)}
                className="p-2 rounded-full bg-white hover:bg-[#111111] hover:text-white border border-[#D8CEB8] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-stone-700">
                  Plak JSON Resultaat:
                </label>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      if (text) setAiJsonInput(text);
                    } catch (e) {
                      // Clipboard blocked
                    }
                  }}
                  className="text-xs font-mono font-bold text-[#B8860B] hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>Plak van Klembord</span>
                </button>
              </div>

              <textarea
                value={aiJsonInput}
                onChange={(e) => setAiJsonInput(e.target.value)}
                placeholder={`{\n  "hero_title_en": "...",\n  "hero_title_fr": "...",\n  ...\n}`}
                rows={8}
                className="w-full p-4 font-mono text-xs bg-white text-[#111111] border border-[#D8CEB8] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#B8860B] resize-y"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAiImportModal(false)}
                className="px-4 py-2.5 rounded-xl border border-[#D8CEB8] text-xs font-mono font-bold text-stone-700 hover:bg-stone-200 cursor-pointer"
              >
                Annuleren
              </button>
              <button
                type="button"
                onClick={handleImportAiTranslation}
                disabled={!aiJsonInput || !aiJsonInput.trim()}
                className="px-5 py-2.5 rounded-xl bg-[#111111] text-[#FAF7F2] hover:bg-[#B8860B] hover:text-black font-mono text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-2 cursor-pointer shadow-md"
              >
                <Download className="w-4 h-4 text-[#C5A059]" />
                <span>Toepassen &amp; Vul In</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
