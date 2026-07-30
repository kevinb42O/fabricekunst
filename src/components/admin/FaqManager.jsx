import React, { useState } from 'react';
import { HelpCircle, Plus, Edit2, Trash2, ArrowUp, ArrowDown, Save, X, Globe, Sparkles, Download, Copy } from 'lucide-react';
import { copyTextToClipboard, parseAiJsonTranslation } from '../../utils/translationService';

export default function FaqManager({ faqItems = [], onSaveFaqItems = () => {}, onShowToast = () => {} }) {
  const [items, setItems] = useState(faqItems);
  const [editingItem, setEditingItem] = useState(null);
  const [formLang, setFormLang] = useState('nl');
  const [isTranslating, setIsTranslating] = useState(false);
  const [showAiImportModal, setShowAiImportModal] = useState(false);
  const [aiJsonInput, setAiJsonInput] = useState('');

  const handleCreateNew = () => {
    const newItem = {
      id: `faq-${Date.now()}`,
      question: '',
      answer: '',
      question_en: '',
      answer_en: '',
      question_fr: '',
      answer_fr: '',
      displayOrder: items.length + 1
    };
    setEditingItem(newItem);
    setFormLang('nl');
  };

  const handleEdit = (item) => {
    setEditingItem({ ...item });
    setFormLang('nl');
  };

  const handleDelete = (idToDelete) => {
    if (!window.confirm("Weet u zeker dat u deze veelgestelde vraag wilt verwijderen?")) return;
    const updated = items.filter(i => i.id !== idToDelete);
    setItems(updated);
    onSaveFaqItems(updated);
    onShowToast("Veelgestelde vraag verwijderd.");
  };

  const handleMove = (index, direction) => {
    const newItems = [...items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    // Update display orders
    const reordered = newItems.map((item, idx) => ({
      ...item,
      displayOrder: idx + 1
    }));

    setItems(reordered);
    onSaveFaqItems(reordered);
    onShowToast("FAQ volgorde bijgewerkt.");
  };

  const handleSaveModal = () => {
    if (!editingItem.question.trim() || !editingItem.answer.trim()) {
      alert("Vul a.u.b. ten minste de vraag en het antwoord in het Nederlands in.");
      return;
    }

    const existingIndex = items.findIndex(i => i.id === editingItem.id);
    let updatedList;
    if (existingIndex >= 0) {
      updatedList = [...items];
      updatedList[existingIndex] = editingItem;
    } else {
      updatedList = [...items, editingItem];
    }

    setItems(updatedList);
    onSaveFaqItems(updatedList);
    setEditingItem(null);
    onShowToast("FAQ opgeslagen!");
  };

  const handleCopyAiPrompt = async () => {
    if (!editingItem) return;

    let sourceLangName = 'Nederlands';
    let targetLangInstruction = 'Engels (en) en Frans (fr)';
    let sampleJson = { question_en: "", answer_en: "", question_fr: "", answer_fr: "" };
    let sourceQuestion = editingItem.question;
    let sourceAnswer = editingItem.answer;

    if (formLang === 'en') {
      sourceLangName = 'Engels';
      targetLangInstruction = 'Nederlands (nl) en Frans (fr)';
      sampleJson = { question: "", answer: "", question_fr: "", answer_fr: "" };
      sourceQuestion = editingItem.question_en || editingItem.question;
      sourceAnswer = editingItem.answer_en || editingItem.answer;
    } else if (formLang === 'fr') {
      sourceLangName = 'Frans';
      targetLangInstruction = 'Nederlands (nl) en Engels (en)';
      sampleJson = { question: "", answer: "", question_en: "", answer_en: "" };
      sourceQuestion = editingItem.question_fr || editingItem.question;
      sourceAnswer = editingItem.answer_fr || editingItem.answer;
    }

    let promptText = `Vertaal de onderstaande FAQ vraag & antwoord van het ${sourceLangName} naar ${targetLangInstruction}.\n`;
    promptText += `Gebruik verzorgde, professionele taal.\n`;
    promptText += `Retourneer UITSLUITEND een geldig JSON object (geen inleidende tekst of markdown opmaak):\n\n`;
    promptText += `${JSON.stringify(sampleJson, null, 2)}\n\n`;
    promptText += `BRONGEGEVENS (${sourceLangName.toUpperCase()}):\n---------------------------\n`;
    promptText += `* Vraag [question]: ${sourceQuestion || '[Niet ingevuld / Bewust leeg]'}\n`;
    promptText += `* Antwoord [answer]: ${sourceAnswer || '[Niet ingevuld / Bewust leeg]'}\n`;

    const success = await copyTextToClipboard(promptText);
    if (success && onShowToast) {
      onShowToast(`📋 AI Vertaal-prompt voor FAQ (bron: ${sourceLangName}) gekopieerd naar klembord!`);
    }
  };

  const handleImportAiTranslation = () => {
    if (!aiJsonInput || !aiJsonInput.trim()) return;

    const data = parseAiJsonTranslation(aiJsonInput);
    if (!data) {
      if (onShowToast) onShowToast("⚠️ Ongeldige JSON code. Controleer het resultaat van de AI.", "error");
      return;
    }

    setEditingItem(prev => ({
      ...prev,
      ...(data.question !== undefined ? { question: data.question } : {}),
      ...(data.answer !== undefined ? { answer: data.answer } : {}),
      ...(data.question_en !== undefined ? { question_en: data.question_en } : {}),
      ...(data.answer_en !== undefined ? { answer_en: data.answer_en } : {}),
      ...(data.question_fr !== undefined ? { question_fr: data.question_fr } : {}),
      ...(data.answer_fr !== undefined ? { answer_fr: data.answer_fr } : {})
    }));

    setShowAiImportModal(false);
    setAiJsonInput('');
    if (onShowToast) onShowToast("✨ Success! FAQ vertalingen geïmporteerd.");
  };

  return (
    <div className="space-y-8">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-white border border-[#D8CEB8] shadow-xs">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 text-[#B8860B] text-xs font-mono font-bold uppercase tracking-widest">
            <HelpCircle className="w-4 h-4" />
            <span>CMS Beheer — Veelgestelde Vragen</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#111111]">
            FAQ Beheerder
          </h2>
          <p className="text-xs sm:text-sm text-[#666666] font-serif">
            Voeg vragen toe, pas antwoorden aan en verander de volgorde voor uw bezoekers.
          </p>
        </div>

        <button
          onClick={handleCreateNew}
          className="px-5 py-3 rounded-xl bg-[#1C1A17] hover:bg-[#B8860B] text-white hover:text-[#111111] font-mono text-xs font-bold uppercase tracking-wider transition-colors shadow-sm flex items-center space-x-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nieuwe Vraag Toevoegen</span>
        </button>
      </div>

      {/* FAQ Items List */}
      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-[#D8CEB8]">
            <p className="text-gray-500 font-serif">Geen veelgestelde vragen aanwezig.</p>
          </div>
        ) : (
          items.map((item, idx) => (
            <div 
              key={item.id}
              className="p-6 rounded-2xl bg-white border border-[#D8CEB8] shadow-2xs hover:border-[#111111] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-6"
            >
              <div className="space-y-2 flex-grow">
                <div className="flex items-center space-x-3">
                  <span className="px-2.5 py-0.5 rounded bg-[#FAF7F2] border border-[#D8CEB8] text-[#B8860B] font-mono text-xs font-bold">
                    Vraag {idx + 1}
                  </span>
                  <h4 className="text-base font-serif font-bold text-[#111111]">
                    {item.question}
                  </h4>
                </div>

                <p className="text-xs text-[#555555] font-serif leading-relaxed line-clamp-2 pl-9">
                  {item.answer}
                </p>

                {(item.question_en || item.question_fr) && (
                  <div className="flex items-center space-x-2 pl-9 pt-1 text-[10px] font-mono text-[#8E7035]">
                    <Globe className="w-3 h-3" />
                    <span>Beschikbaar in NL{item.question_en ? ' • EN' : ''}{item.question_fr ? ' • FR' : ''}</span>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center space-x-2 shrink-0 border-t sm:border-t-0 pt-4 sm:pt-0 border-[#D8CEB8]/60 justify-end">
                <button
                  onClick={() => handleMove(idx, 'up')}
                  disabled={idx === 0}
                  className="p-2 rounded-lg bg-[#FAF7F2] text-[#111111] hover:bg-[#D8CEB8] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Verplaats Omhoog"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleMove(idx, 'down')}
                  disabled={idx === items.length - 1}
                  className="p-2 rounded-lg bg-[#FAF7F2] text-[#111111] hover:bg-[#D8CEB8] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Verplaats Omlaag"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleEdit(item)}
                  className="p-2 rounded-lg bg-[#1C1A17] text-white hover:bg-[#B8860B] hover:text-[#111111] transition-colors"
                  title="Bewerken"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 rounded-lg bg-[#8B2635]/10 text-[#8B2635] hover:bg-[#8B2635] hover:text-white transition-colors"
                  title="Verwijderen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit / Add Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] text-[#111111] rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 border-2 border-[#D8CEB8] shadow-2xl overflow-y-auto max-h-[90vh]">
            
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D8CEB8] pb-4">
              <div className="space-y-1">
                <span className="text-xs font-mono font-bold text-[#B8860B] uppercase">
                  {editingItem.id ? "FAQ Item Bewerken" : "Nieuwe FAQ Vraag"}
                </span>
                <h3 className="text-xl font-serif font-bold text-[#111111]">
                  Vraag &amp; Antwoord Beheren
                </h3>
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1.5 bg-white p-1 rounded-xl border border-[#D8CEB8]">
                  <button
                    type="button"
                    onClick={handleCopyAiPrompt}
                    className="px-2.5 py-1.5 rounded-lg bg-[#111111] text-white hover:bg-[#B8860B] text-xs font-mono font-bold transition-all flex items-center space-x-1 cursor-pointer"
                    title="Kopieer FAQ als AI vertaal-prompt"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Prompt ({formLang === 'nl' ? '🇳🇱 NL' : formLang === 'en' ? '🇬🇧 EN' : '🇫🇷 FR'})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAiImportModal(true)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#FAF7F2] hover:bg-stone-200 text-[#111111] border border-[#D8CEB8] text-xs font-mono font-bold transition-all flex items-center space-x-1 cursor-pointer"
                    title="Importeer AI JSON vertaling"
                  >
                    <Download className="w-3.5 h-3.5 text-[#B8860B]" />
                    <span>Importeer</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="p-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-md border border-red-700 transition-all cursor-pointer shrink-0 flex items-center justify-center hover:scale-105 active:scale-95 ml-2"
                  title="Venster sluiten"
                >
                  <X className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Language Switcher Tabs */}
            <div className="p-3 rounded-2xl bg-white border border-[#D8CEB8]">
              <div className="flex items-center space-x-2">
                {[
                  { code: 'nl', label: '🇳🇱 Nederlands' },
                  { code: 'en', label: '🇬🇧 Engels' },
                  { code: 'fr', label: '🇫🇷 Frans' }
                ].map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => setFormLang(lang.code)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      formLang === lang.code
                        ? 'bg-[#1C1A17] text-[#D4AF37]'
                        : 'bg-[#FAF7F2] text-[#555555] hover:text-[#111111]'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Form Fields for Selected Language */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-[#111111] uppercase mb-1">
                  Vraag ({formLang.toUpperCase()})
                </label>
                <input
                  type="text"
                  value={
                    formLang === 'nl' ? editingItem.question :
                    formLang === 'en' ? editingItem.question_en || '' :
                    editingItem.question_fr || ''
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (formLang === 'nl') setEditingItem({ ...editingItem, question: val });
                    else if (formLang === 'en') setEditingItem({ ...editingItem, question_en: val });
                    else setEditingItem({ ...editingItem, question_fr: val });
                  }}
                  placeholder="bijv. Hoe wordt de echtheid gegarandeerd?"
                  className="w-full px-4 py-3 rounded-xl bg-white border border-[#D8CEB8] text-sm font-serif focus:ring-2 focus:ring-[#B8860B] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-[#111111] uppercase mb-1">
                  Antwoord ({formLang.toUpperCase()})
                </label>
                <textarea
                  rows={4}
                  value={
                    formLang === 'nl' ? editingItem.answer :
                    formLang === 'en' ? editingItem.answer_en || '' :
                    editingItem.answer_fr || ''
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (formLang === 'nl') setEditingItem({ ...editingItem, answer: val });
                    else if (formLang === 'en') setEditingItem({ ...editingItem, answer_en: val });
                    else setEditingItem({ ...editingItem, answer_fr: val });
                  }}
                  placeholder="Typ het gedetailleerde antwoord..."
                  className="w-full px-4 py-3 rounded-xl bg-white border border-[#D8CEB8] text-sm font-serif leading-relaxed focus:ring-2 focus:ring-[#B8860B] focus:outline-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#D8CEB8]">
              <button
                onClick={() => setEditingItem(null)}
                className="px-5 py-2.5 rounded-xl bg-white border border-[#D8CEB8] text-xs font-mono font-bold uppercase hover:bg-gray-100 transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleSaveModal}
                className="px-6 py-2.5 rounded-xl bg-[#1C1A17] hover:bg-[#B8860B] text-white hover:text-[#111111] text-xs font-mono font-bold uppercase tracking-wider transition-colors flex items-center space-x-2 cursor-pointer shadow-md"
              >
                <Save className="w-4 h-4" />
                <span>Opslaan</span>
              </button>
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
                    Importeer FAQ AI Vertaling (JSON)
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
                placeholder={`{\n  "question_en": "...",\n  "answer_en": "...",\n  "question_fr": "...",\n  "answer_fr": "..."\n}`}
                rows={6}
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
