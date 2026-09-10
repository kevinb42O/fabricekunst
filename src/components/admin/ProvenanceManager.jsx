import React, { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, Check, ChevronDown, ChevronUp, Eye, Filter, ImageIcon, ImagePlus, Maximize2, Plus, Save, Search, Send, ShieldCheck, SlidersHorizontal, Trash2, X } from 'lucide-react';
import { defaultProvenance } from '../../data/defaultProvenance';
import defaultAssets from '../../data/provenanceAssets.json';
import { PROVENANCE_LANGUAGES, PROVENANCE_SECTIONS, localized, normalizeProvenance, provenanceIssues } from '../../utils/provenance';
import { fetchProvenanceAdminAsync, publishProvenanceAsync, restoreProvenanceRevisionAsync, saveProvenanceDraftAsync, uploadProvenanceMediaAsync } from '../../utils/storage';
import ComparisonSlider from '../ComparisonSlider';

const labels = { nl: 'Nederlands', en: 'English', fr: 'Français' };
const sectionLabels = { workflow: 'Werkwijze', methods: 'Onderzoeksmethoden', examples: 'Praktijkvoorbeelden', gallery: 'Beeldbank & galerij', dossier: 'Dossier', faq: 'Veelgestelde vragen', contact: 'Contact & CTA' };
const inputClass = 'mt-1 w-full rounded-lg border border-[#d8cebd] bg-white px-3 py-2.5 text-sm text-[#211b16] outline-none transition focus:border-[#4a1521] focus:ring-2 focus:ring-[#4a1521]/10';
const cardClass = 'rounded-xl border border-[#ded4c3] bg-[#fcfaf6] p-5 shadow-sm';
const localizedFields = (value, language) => localized(value, language);
const clone = value => structuredClone(value);
const newId = prefix => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;

function Field({ label, value, onChange, multiline = false, hint }) {
  const props = { value: value || '', onChange: e => onChange(e.target.value), className: inputClass, 'aria-label': label };
  return <label className="block text-sm font-medium text-[#3f352d]"><span>{label}</span>{multiline ? <textarea {...props} rows={4} /> : <input {...props} />}{hint && <span className="mt-1 block text-xs font-normal text-[#74695f]">{hint}</span>}</label>;
}

function LocalizedField({ label, value, language, onChange, multiline = false, hint }) { return <Field label={`${label} · ${labels[language]}`} value={localizedFields(value, language)} onChange={next => onChange({ ...(value || {}), [language]: next })} multiline={multiline} hint={hint} />; }

function LanguageBar({ language, setLanguage }) {
  return <div className="flex flex-wrap gap-2" role="tablist" aria-label="Bewerktalen">{PROVENANCE_LANGUAGES.map(lang => <button type="button" key={lang} onClick={() => setLanguage(lang)} role="tab" aria-selected={lang === language} className={`min-h-10 rounded-full border px-4 text-xs font-semibold uppercase tracking-[.12em] transition ${lang === language ? 'border-[#4a1521] bg-[#4a1521] text-white' : 'border-[#d8cebd] bg-white text-[#4a1521] hover:border-[#4a1521]'}`}>{lang}</button>)}</div>;
}

function ReorderButtons({ index, total, move }) { return <div className="flex gap-1"><button type="button" aria-label="Omhoog" disabled={index===0} onClick={() => move(index,index-1)} className="rounded p-2 text-[#4a1521] disabled:opacity-30"><ChevronUp size={16}/></button><button type="button" aria-label="Omlaag" disabled={index===total-1} onClick={() => move(index,index+1)} className="rounded p-2 text-[#4a1521] disabled:opacity-30"><ChevronDown size={16}/></button></div>; }

function ListEditor({ title, itemLabel, items, setItems, fields, language, canAdd = true }) {
  const move = (from,to) => setItems(current => { const next=[...current]; [next[from],next[to]]=[next[to],next[from]]; return next; });
  return <section className="space-y-4"><div className="flex items-center justify-between"><h3 className="font-serif text-xl font-semibold text-[#211b16]">{title}</h3>{canAdd && <button type="button" onClick={() => setItems(current => [...current, { id:newId(itemLabel.toLowerCase()), enabled:true, ...Object.fromEntries(fields.map(f => [f.key, {}])) }])} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#4a1521] px-3 text-xs font-semibold uppercase tracking-[.08em] text-[#4a1521]"><Plus size={15}/> Toevoegen</button>}</div>{items.length===0 && <p className="rounded-lg border border-dashed border-[#d8cebd] p-4 text-sm text-[#74695f]">Nog geen onderdelen.</p>}{items.map((item,index) => <article key={item.id} className={cardClass}><div className="flex items-start justify-between gap-3"><div><span className="text-[10px] font-semibold uppercase tracking-[.16em] text-[#8e7035]">{itemLabel} {String(index+1).padStart(2,'0')}</span><label className="mt-2 flex items-center gap-2 text-xs text-[#5f554c]"><input type="checkbox" checked={item.enabled !== false} onChange={e => setItems(current => current.map((x,i)=>i===index?{...x,enabled:e.target.checked}:x))}/> Zichtbaar op de publieke pagina</label></div><div className="flex items-center gap-1"><ReorderButtons index={index} total={items.length} move={move}/><button type="button" aria-label={`${itemLabel} verwijderen`} onClick={() => setItems(current => current.filter((_,i)=>i!==index))} className="rounded p-2 text-[#8d2b2b]"><Trash2 size={16}/></button></div></div><div className="mt-4 grid gap-4 md:grid-cols-2">{fields.map(field => <LocalizedField key={field.key} label={field.label} value={item[field.key]} language={language} multiline={field.multiline} hint={field.hint} onChange={value => setItems(current => current.map((x,i)=>i===index?{...x,[field.key]:value}:x))}/>)}</div></article>)}</section>;
}

function AssetSelect({ label, value, assets = [], media = [], onChange, onUpload, uploadBusy = false }) {
  const selectedMedia = media.find(m => m.id === value);
  const assetIds = new Set(assets.map(a => a.id));
  const options = [
    ...assets.map(a => {
      const med = media.find(m => m.id === a.id);
      const titleStr = typeof a.title === 'string' ? a.title : a.title?.nl || a.title?.en || '';
      return {
        id: a.id,
        label: titleStr ? `${titleStr} (${med?.filename || a.category || 'beeld'})` : (med?.filename || a.id.slice(0, 8))
      };
    }),
    ...media.filter(m => !assetIds.has(m.id)).map(m => ({
      id: m.id,
      label: `${m.filename || 'Beeld'} (${m.width || '?'} × ${m.height || '?'}px)`
    }))
  ];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-[#3f352d]">{label}</label>
        {onUpload && (
          <label className={`inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-[#8e7035] hover:text-[#4a1521] ${uploadBusy ? 'pointer-events-none opacity-50' : ''}`}>
            <ImagePlus size={13} />
            <span>Nieuw bestand</span>
            <input type="file" accept="image/*" className="hidden" disabled={uploadBusy} onChange={onUpload} />
          </label>
        )}
      </div>
      <select value={value || ''} onChange={e => onChange(e.target.value)} className={inputClass}>
        <option value="">— Kies een afbeelding —</option>
        {options.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
      </select>
      {selectedMedia?.variants?.[0]?.url && (
        <div className="flex items-center gap-2.5 rounded-lg border border-[#d8cebd] bg-white p-2 shadow-xs">
          <img src={selectedMedia.variants.at(-1)?.url || selectedMedia.variants[0].url} alt="" className="h-14 w-20 rounded object-cover" />
          <div className="text-xs text-[#62594f]">
            <span className="font-semibold text-[#211b16]">{selectedMedia.filename}</span>
            <span className="block text-[11px] text-[#8e7035]">
              {selectedMedia.width} × {selectedMedia.height}px · {selectedMedia.status === 'ready' ? 'R2 gereed' : selectedMedia.status}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function ComparisonsEditor({ comparisons = [], assets = [], media = [], language, update }) {
  const addComparison = () => {
    update(current => ({
      ...current,
      comparisons: [
        ...(current.comparisons || []),
        {
          id: newId('comp'),
          enabled: true,
          title: { nl: 'Nieuwe optische vergelijking', en: 'New optical comparison', fr: 'Nouvelle comparaison optique' },
          leftLabel: { nl: 'Daglicht / Zichtbaar licht', en: 'Daylight / Visible light', fr: 'Lumière du jour' },
          rightLabel: { nl: 'UV-Fluorescentie', en: 'UV Fluorescence', fr: 'Fluorescence UV' },
          leftId: assets[0]?.id || '',
          rightId: assets[1]?.id || '',
          sameObjectConfirmed: false,
        }
      ]
    }));
  };

  const removeComparison = (index) => {
    update(current => ({
      ...current,
      comparisons: current.comparisons.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-8">
      <section className={cardClass}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-serif text-2xl text-[#211b16]">Interactieve Voor/Na Sliders (UV vs. Daglicht)</h2>
            <p className="mt-2 text-sm leading-6 text-[#62594f]">
              Beheer interactieve vergelijkingen tussen verschillende lichtspectra (zoals daglicht/zichtbaar licht vs. UV-fluorescentie of RX).
              Beide beelden moeten aantoonbaar hetzelfde object betreffen.
            </p>
          </div>
          <button
            type="button"
            onClick={addComparison}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#4a1521] px-3 text-xs font-semibold uppercase tracking-[.08em] text-[#4a1521] transition hover:bg-[#4a1521] hover:text-white"
          >
            <Plus size={15} /> Vergelijking toevoegen
          </button>
        </div>
      </section>

      {comparisons.length === 0 && (
        <p className="rounded-lg border border-dashed border-[#d8cebd] p-8 text-center text-sm text-[#74695f]">
          Er zijn momenteel geen vergelijkingssliders ingesteld. Klik op 'Vergelijking toevoegen' om een UV/Daglicht slider aan te maken.
        </p>
      )}

      {comparisons.map((item, index) => {
        const leftAsset = assets.find(a => a.id === item.leftId);
        const rightAsset = assets.find(a => a.id === item.rightId);
        const leftMedia = media.find(m => m.id === item.leftId);
        const rightMedia = media.find(m => m.id === item.rightId);
        const leftObj = leftAsset ? { ...leftAsset, url: leftMedia?.variants?.at(-1)?.url || leftAsset.url, srcSet: leftMedia?.variants?.map(v => `${v.url} ${v.width}w`).join(', ') } : null;
        const rightObj = rightAsset ? { ...rightAsset, url: rightMedia?.variants?.at(-1)?.url || rightAsset.url, srcSet: rightMedia?.variants?.map(v => `${v.url} ${v.width}w`).join(', ') } : null;

        return (
          <article key={item.id} className={cardClass}>
            <div className="flex items-start justify-between gap-3 border-b border-[#ded4c3] pb-3">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-[.16em] text-[#8e7035]">
                  Slider {String(index + 1).padStart(2, '0')}
                </span>
                <label className="mt-2 flex items-center gap-2 text-xs text-[#5f554c]">
                  <input
                    type="checkbox"
                    checked={item.enabled !== false}
                    onChange={e => update(current => ({
                      ...current,
                      comparisons: current.comparisons.map((c, i) => i === index ? { ...c, enabled: e.target.checked } : c)
                    }))}
                  />
                  Zichtbaar op de publieke pagina
                </label>
              </div>
              <button
                type="button"
                onClick={() => removeComparison(index)}
                className="rounded p-2 text-[#8d2b2b] transition hover:bg-[#8d2b2b]/10"
                aria-label="Vergelijking verwijderen"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <LocalizedField
                label="Titel van de vergelijking"
                value={item.title}
                language={language}
                onChange={val => update(current => ({
                  ...current,
                  comparisons: current.comparisons.map((c, i) => i === index ? { ...c, title: val } : c)
                }))}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <LocalizedField
                  label="Label Linkerzijde (bijv. Daglicht)"
                  value={item.leftLabel}
                  language={language}
                  onChange={val => update(current => ({
                    ...current,
                    comparisons: current.comparisons.map((c, i) => i === index ? { ...c, leftLabel: val } : c)
                  }))}
                />
                <LocalizedField
                  label="Label Rechterzijde (bijv. UV-Fluorescentie)"
                  value={item.rightLabel}
                  language={language}
                  onChange={val => update(current => ({
                    ...current,
                    comparisons: current.comparisons.map((c, i) => i === index ? { ...c, rightLabel: val } : c)
                  }))}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <AssetSelect
                  label="Beeld Linkerzijde (Daglicht)"
                  value={item.leftId}
                  assets={assets}
                  media={media}
                  onChange={id => update(current => ({
                    ...current,
                    comparisons: current.comparisons.map((c, i) => i === index ? { ...c, leftId: id } : c)
                  }))}
                />
                <AssetSelect
                  label="Beeld Rechterzijde (UV-Fluorescentie)"
                  value={item.rightId}
                  assets={assets}
                  media={media}
                  onChange={id => update(current => ({
                    ...current,
                    comparisons: current.comparisons.map((c, i) => i === index ? { ...c, rightId: id } : c)
                  }))}
                />
              </div>

              <div className="rounded-lg border border-[#e2d7c7] bg-[#f5ede0] p-3.5">
                <label className="flex items-center gap-2 text-xs font-semibold text-[#4a1521]">
                  <input
                    type="checkbox"
                    checked={item.sameObjectConfirmed === true}
                    onChange={e => update(current => ({
                      ...current,
                      comparisons: current.comparisons.map((c, i) => i === index ? { ...c, sameObjectConfirmed: e.target.checked } : c)
                    }))}
                  />
                  <span>Ik bevestig dat beide opnamen hetzelfde kunstwerk of object betreffen (vereist voor publicatie).</span>
                </label>
                {item.leftId && item.rightId && item.leftId === item.rightId && (
                  <p className="mt-1 text-xs text-[#8d2b2b]">Let op: kies twee verschillende beelden (bijv. daglicht vs. UV).</p>
                )}
              </div>

              {/* Direct Live Preview */}
              {leftObj?.url && rightObj?.url && (
                <div className="mt-6 border-t border-[#ded4c3] pt-5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#8e7035]">
                    Directe Voorvertoning van de slider
                  </p>
                  <div className="max-w-2xl">
                    <ComparisonSlider
                      comparison={item}
                      leftAsset={leftObj}
                      rightAsset={rightObj}
                      language={language}
                    />
                  </div>
                </div>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function MediaRelationsEditor({
  title,
  items,
  media = [],
  relationKey,
  language,
  update,
  getAsset,
  categoryLabels = {},
  onPreview,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [openPickers, setOpenPickers] = useState(() => {
    const initial = {};
    if (items && items.length > 0) {
      items.forEach((it, idx) => {
        if (!it.assetIds || it.assetIds.length === 0 || idx === 0) {
          initial[it.id] = true;
        }
      });
    }
    return initial;
  });

  const togglePicker = itemId => {
    setOpenPickers(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const toggleAsset = (itemId, assetId) => {
    update(current => {
      const med = media.find(m => m.id === assetId);
      let updatedAssets = current.assets || [];
      const assetExists = updatedAssets.some(a => a.id === assetId);
      if (!assetExists) {
        const def = defaultAssets.find(a => a.id === assetId);
        const newAsset = def
          ? { ...def, approved: true }
          : {
              id: assetId,
              title: { nl: med?.filename || 'Afbeelding', en: med?.filename || 'Image', fr: med?.filename || 'Image' },
              caption: { nl: '', en: '', fr: '' },
              alt: { nl: med?.filename || 'Afbeelding', en: med?.filename || 'Image', fr: med?.filename || 'Image' },
              credit: { nl: '', en: '', fr: '' },
              objectLabel: { nl: '', en: '', fr: '' },
              category: 'context',
              approved: true,
              url: med?.variants?.at(-1)?.url || '',
              width: med?.width || 0,
              height: med?.height || 0,
              variants: med?.variants || [],
            };
        updatedAssets = [...updatedAssets, newAsset];
      } else {
        updatedAssets = updatedAssets.map(a =>
          a.id === assetId ? { ...a, approved: true } : a
        );
      }

      const updatedItems = current[relationKey].map(entry => {
        if (entry.id !== itemId) return entry;
        const currentIds = entry.assetIds || [];
        const isLinked = currentIds.includes(assetId);
        const newIds = isLinked
          ? currentIds.filter(id => id !== assetId)
          : [...currentIds, assetId];
        return { ...entry, assetIds: newIds };
      });

      return { ...current, assets: updatedAssets, [relationKey]: updatedItems };
    });
  };

  const unlinkAsset = (itemId, assetId) => {
    update(current => ({
      ...current,
      [relationKey]: current[relationKey].map(entry => {
        if (entry.id !== itemId) return entry;
        return {
          ...entry,
          assetIds: (entry.assetIds || []).filter(id => id !== assetId),
        };
      }),
    }));
  };

  const moveAsset = (itemId, fromIndex, toIndex) => {
    update(current => ({
      ...current,
      [relationKey]: current[relationKey].map(entry => {
        if (entry.id !== itemId) return entry;
        const ids = [...(entry.assetIds || [])];
        if (toIndex < 0 || toIndex >= ids.length) return entry;
        const [moved] = ids.splice(fromIndex, 1);
        ids.splice(toIndex, 0, moved);
        return { ...entry, assetIds: ids };
      }),
    }));
  };

  const filteredPickerMedia = media.filter(med => {
    const asset = getAsset ? getAsset(med) : {};
    if (categoryFilter !== 'all' && asset.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const titleStr = (localized(asset.title, language) || '').toLowerCase();
      const filename = (med.filename || '').toLowerCase();
      const captionStr = (localized(asset.caption, language) || '').toLowerCase();
      if (!titleStr.includes(q) && !filename.includes(q) && !captionStr.includes(q)) return false;
    }
    return true;
  });

  return (
    <section className={cardClass}>
      <div className="border-b border-[#ded4c3] pb-4">
        <h3 className="font-serif text-2xl font-semibold text-[#211b16]">
          {title} · Beeldkoppelingen
        </h3>
        <p className="mt-1.5 text-sm text-[#62594f]">
          Koppel visuele R2-beelden aan elk onderdeel. Zie direct de actuele foto's, pas de volgorde aan en kies nieuwe beelden uit de visuele beeldbank.
        </p>
      </div>

      <div className="mt-6 space-y-8">
        {items.map((item, itemIndex) => {
          const linkedIds = item.assetIds || [];
          const isPickerOpen = openPickers[item.id] ?? (linkedIds.length === 0);

          return (
            <div
              key={item.id}
              className="overflow-hidden rounded-xl border border-[#ded4c3] bg-white shadow-xs"
            >
              {/* Item Header */}
              <div className="flex flex-col gap-3 border-b border-[#ded4c3] bg-[#fbf9f5] p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-[#8e7035]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#8e7035]">
                      {relationKey === 'examples' ? `Praktijkvoorbeeld ${String(itemIndex + 1).padStart(2, '0')}` : `Methode ${String(itemIndex + 1).padStart(2, '0')}`}
                    </span>
                    <span className="text-xs font-semibold text-[#74695f]">
                      {linkedIds.length} {linkedIds.length === 1 ? 'afbeelding gekoppeld' : 'afbeeldingen gekoppeld'}
                    </span>
                  </div>
                  <h4 className="mt-1 font-serif text-xl font-bold text-[#4a1521]">
                    {localized(item.title, language) || item.id}
                  </h4>
                  {item.question && (
                    <p className="mt-1 text-xs italic text-[#695a49]">
                      {localized(item.question, language)}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => togglePicker(item.id)}
                  className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-xs font-semibold uppercase tracking-wider transition ${
                    isPickerOpen
                      ? 'border border-[#4a1521] bg-[#4a1521] text-white hover:bg-[#381019]'
                      : 'border border-[#4a1521] bg-white text-[#4a1521] hover:bg-[#fbf7f0]'
                  }`}
                >
                  <SlidersHorizontal size={14} />
                  {isPickerOpen ? 'Beeldbank sluiten' : `Beelden kiezen (${media.length})`}
                </button>
              </div>

              {/* Body: Linked Images */}
              <div className="p-5">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#8e7035]">
                    Actief gekoppelde afbeeldingen ({linkedIds.length})
                  </span>
                  {relationKey === 'examples' && linkedIds.length > 0 && (
                    <span className="text-[11px] font-medium text-[#74695f]">
                      ℹ️ De eerste 2 beelden (#1 en #2) worden getoond op de publieke website.
                    </span>
                  )}
                </div>

                {linkedIds.length > 0 ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {linkedIds.map((assetId, idx) => {
                      const med = media.find(m => m.id === assetId);
                      const ast = getAsset ? getAsset(med || { id: assetId }) : {};
                      const imgUrl =
                        med?.variants?.find(v => v.size === 400 || v.size === 800)?.url ||
                        med?.variants?.[0]?.url ||
                        ast?.url;
                      const isPrimaryCover = relationKey === 'examples' && idx < 2;

                      return (
                        <div
                          key={assetId}
                          className={`group relative flex flex-col overflow-hidden rounded-lg border bg-[#faf7f2] transition ${
                            isPrimaryCover
                              ? 'border-[#4a1521] shadow-xs ring-1 ring-[#4a1521]/20'
                              : 'border-[#ded4c3]'
                          }`}
                        >
                          {/* Image preview with overlays */}
                          <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#211b16]">
                            {imgUrl ? (
                              <img
                                src={imgUrl}
                                alt={localized(ast?.alt, language) || ''}
                                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                              />
                            ) : (
                              <div className="grid h-full place-items-center text-xs text-[#a39789]">
                                Geen afbeelding
                              </div>
                            )}

                            {/* Position Badge */}
                            <div className="absolute left-2 top-2 flex items-center gap-1.5">
                              <span
                                className={`rounded px-1.5 py-0.5 text-[11px] font-bold shadow-sm ${
                                  isPrimaryCover
                                    ? 'bg-[#4a1521] text-white'
                                    : 'bg-black/70 text-white'
                                }`}
                              >
                                #{idx + 1}
                              </span>
                              {isPrimaryCover && (
                                <span className="rounded bg-[#8e7035] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm">
                                  Cover #{idx + 1}
                                </span>
                              )}
                            </div>

                            {/* Top Right Quick Actions */}
                            <div className="absolute right-2 top-2 flex items-center gap-1">
                              {onPreview && med && (
                                <button
                                  type="button"
                                  title="Grote voorvertoning"
                                  onClick={() => onPreview(med)}
                                  className="rounded-full bg-black/70 p-1.5 text-white shadow-sm transition hover:bg-black"
                                >
                                  <Eye size={13} />
                                </button>
                              )}
                              <button
                                type="button"
                                title="Ontkoppelen"
                                onClick={() => unlinkAsset(item.id, assetId)}
                                className="rounded-full bg-red-700/80 p-1.5 text-white shadow-sm transition hover:bg-red-800"
                              >
                                <X size={13} />
                              </button>
                            </div>

                            {/* Reorder Arrows in bottom overlay */}
                            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => moveAsset(item.id, idx, idx - 1)}
                                className="rounded bg-black/70 px-2 py-1 text-[11px] font-bold text-white shadow-sm transition hover:bg-black disabled:opacity-20"
                                title="Naar voren / links verplaatsen"
                              >
                                ←
                              </button>
                              <span className="text-[10px] font-medium text-white/90 drop-shadow">
                                Positie {idx + 1}
                              </span>
                              <button
                                type="button"
                                disabled={idx === linkedIds.length - 1}
                                onClick={() => moveAsset(item.id, idx, idx + 1)}
                                className="rounded bg-black/70 px-2 py-1 text-[11px] font-bold text-white shadow-sm transition hover:bg-black disabled:opacity-20"
                                title="Naar achteren / rechts verplaatsen"
                              >
                                →
                              </button>
                            </div>
                          </div>

                          {/* Card Text & Unlink */}
                          <div className="flex flex-1 flex-col justify-between p-3">
                            <div>
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8e7035]">
                                  {categoryLabels[ast?.category] || ast?.category || 'Beeld'}
                                </span>
                                <span className="font-mono text-[10px] text-[#74695f]">
                                  {med?.filename || `foto-${idx + 1}`}
                                </span>
                              </div>
                              <p className="mt-1 line-clamp-2 text-xs font-semibold text-[#211b16]">
                                {localized(ast?.title, language) || med?.filename}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => unlinkAsset(item.id, assetId)}
                              className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-[#8d2b2b] hover:underline"
                            >
                              <Trash2 size={12} /> Ontkoppelen
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-3 rounded-lg border border-dashed border-[#ded4c3] bg-[#faf7f2] p-5 text-center">
                    <p className="text-xs text-[#74695f]">
                      Nog geen afbeeldingen gekoppeld aan dit onderdeel. Klik hieronder op "Beelden kiezen" om foto's uit de beeldbank te selecteren.
                    </p>
                  </div>
                )}

                {/* Visual Picker Drawer */}
                {isPickerOpen && (
                  <div className="mt-6 rounded-xl border border-[#ded4c3] bg-[#faf8f4] p-4">
                    <div className="flex flex-col gap-3 border-b border-[#ded4c3] pb-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h5 className="font-serif text-base font-bold text-[#211b16]">
                          Kies afbeeldingen uit de beeldbank ({filteredPickerMedia.length} beschikbaar)
                        </h5>
                        <p className="text-xs text-[#74695f]">
                          Klik op een foto om deze te koppelen of ontkoppelen.
                        </p>
                      </div>

                      {/* Filter Bar */}
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={categoryFilter}
                          onChange={e => setCategoryFilter(e.target.value)}
                          className="h-9 rounded-lg border border-[#d8cebd] bg-white px-2.5 text-xs text-[#211b16] outline-none focus:border-[#4a1521]"
                        >
                          {Object.entries(categoryLabels).map(([key, label]) => (
                            <option key={key} value={key}>
                              {label}
                            </option>
                          ))}
                        </select>

                        <div className="relative">
                          <Search size={13} className="pointer-events-none absolute left-2.5 top-2.5 text-[#8e7035]" />
                          <input
                            type="text"
                            placeholder="Zoek beeld…"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="h-9 rounded-lg border border-[#d8cebd] bg-white pl-8 pr-7 text-xs text-[#211b16] outline-none focus:border-[#4a1521]"
                          />
                          {searchQuery && (
                            <button
                              type="button"
                              onClick={() => setSearchQuery('')}
                              className="absolute right-2 top-2 text-[#74695f] hover:text-[#211b16]"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Grid of thumbnails */}
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                      {filteredPickerMedia.map(med => {
                        const isLinked = linkedIds.includes(med.id);
                        const linkIndex = linkedIds.indexOf(med.id);
                        const ast = getAsset ? getAsset(med) : {};
                        const imgUrl =
                          med?.variants?.find(v => v.size === 400 || v.size === 800)?.url ||
                          med?.variants?.[0]?.url ||
                          ast?.url;

                        return (
                          <div
                            key={med.id}
                            onClick={() => toggleAsset(item.id, med.id)}
                            className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-lg border transition-all ${
                              isLinked
                                ? 'border-[#4a1521] bg-[#fbf6f0] ring-2 ring-[#4a1521]'
                                : 'border-[#ded4c3] bg-white hover:border-[#8e7035] hover:shadow-xs'
                            }`}
                          >
                            {/* Thumbnail Area */}
                            <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#211b16]">
                              {imgUrl ? (
                                <img
                                  src={imgUrl}
                                  alt={localized(ast?.alt, language) || ''}
                                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="grid h-full place-items-center text-[10px] text-[#a39789]">
                                  Geen beeld
                                </div>
                              )}

                              {/* Selection Badge / Checkbox */}
                              <div className="absolute left-1.5 top-1.5">
                                {isLinked ? (
                                  <span className="inline-flex items-center gap-0.5 rounded bg-[#4a1521] px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                                    <Check size={11} /> #{linkIndex + 1}
                                  </span>
                                ) : (
                                  <span className="inline-block h-4 w-4 rounded border border-white/80 bg-black/40 shadow-xs backdrop-blur-xs transition group-hover:border-white group-hover:bg-black/60" />
                                )}
                              </div>

                              {/* Eye icon for fullscreen zoom */}
                              {onPreview && (
                                <button
                                  type="button"
                                  title="Voorvertoning bekijken"
                                  onClick={e => {
                                    e.stopPropagation();
                                    onPreview(med);
                                  }}
                                  className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100 hover:bg-black"
                                >
                                  <Eye size={12} />
                                </button>
                              )}
                            </div>

                            {/* Caption / Title */}
                            <div className="p-2">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-mono text-[9px] text-[#74695f]">
                                  {med.filename}
                                </span>
                                <span className="text-[9px] font-semibold uppercase tracking-wider text-[#8e7035]">
                                  {categoryLabels[ast?.category] || ast?.category}
                                </span>
                              </div>
                              <p className="mt-1 line-clamp-2 text-[11px] font-semibold leading-tight text-[#211b16]">
                                {localized(ast?.title, language) || med.filename}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function ProvenanceManager({ provenanceData, onSaveProvenance, showToast }) {
  const [formData, setFormData] = useState(() => normalizeProvenance(provenanceData?.schemaVersion === 3 ? provenanceData : defaultProvenance()));
  const [version, setVersion] = useState(0);
  const [media, setMedia] = useState([]);
  const [revisions, setRevisions] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [language, setLanguage] = useState('nl');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [issues, setIssues] = useState([]);
  const [message, setMessage] = useState(null);
  const [dirty, setDirty] = useState(false);

  // Beeldbank filter & preview states
  const [mediaSearch, setMediaSearch] = useState('');
  const [mediaCategory, setMediaCategory] = useState('all');
  const [mediaStatus, setMediaStatus] = useState('all'); // 'all', 'public', 'reference'
  const [previewItem, setPreviewItem] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const body = await fetchProvenanceAdminAsync();
      const next = normalizeProvenance(body.draft);
      // Ensure all 40 assets from defaultAssets are merged if missing or empty
      const assetMap = new Map((next.assets || []).map(a => [a.id, a]));
      for (const def of defaultAssets) {
        if (!assetMap.has(def.id)) {
          assetMap.set(def.id, { ...def, credit: { nl: '', en: '', fr: '' } });
        } else {
          const cur = assetMap.get(def.id);
          assetMap.set(def.id, {
            ...def,
            ...cur,
            title: {
              nl: cur.title?.nl || def.title.nl,
              en: cur.title?.en || def.title.en,
              fr: cur.title?.fr || def.title.fr,
            },
            caption: {
              nl: cur.caption?.nl || def.caption.nl,
              en: cur.caption?.en || def.caption.en,
              fr: cur.caption?.fr || def.caption.fr,
            },
            alt: {
              nl: cur.alt?.nl || def.alt.nl,
              en: cur.alt?.en || def.alt.en,
              fr: cur.alt?.fr || def.alt.fr,
            },
          });
        }
      }
      next.assets = Array.from(assetMap.values());
      setFormData(next);
      setVersion(body.version);
      setMedia(body.media || []);
      setRevisions(body.revisions || []);
      setDirty(false);
      setIssues([]);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  const update = updater => { setFormData(current => normalizeProvenance(typeof updater === 'function' ? updater(current) : updater)); setDirty(true); setMessage(null); };
  const updateLocalized = (section, field, value) => update(current => ({ ...current, [section]: { ...current[section], [field]: { ...(current[section]?.[field] || {}), [language]: value } } }));
  const saveDraft = async () => { setBusy(true); try { const body = await saveProvenanceDraftAsync(formData, version); setVersion(body.version); setFormData(normalizeProvenance(body.draft)); setDirty(false); setIssues([]); setMessage({ type: 'success', text: 'Concept opgeslagen. De live pagina is niet gewijzigd.' }); showToast?.('Herkomstconcept opgeslagen.', 'info'); } catch (error) { setMessage({ type: 'error', text: error.message }); if (error.message.includes('andere beheerder')) await load(); } finally { setBusy(false); } };
  const publish = async () => { const nextIssues = provenanceIssues(formData, { publishing: true }); setIssues(nextIssues); if (nextIssues.length) { setActiveTab('publish'); setMessage({ type: 'error', text: 'De publicatiecontrole vond aandachtspunten.' }); return; } setBusy(true); try { const saved = await saveProvenanceDraftAsync(formData, version); setVersion(saved.version); const body = await publishProvenanceAsync(saved.version); const published = normalizeProvenance(body.provenanceData); setFormData(published); setDirty(false); setIssues([]); if (onSaveProvenance) { onSaveProvenance(published); } setMessage({ type: 'success', text: 'Nieuwe herkomstversie gepubliceerd.' }); showToast?.('Herkomstpagina gepubliceerd.', 'info'); await load(); } catch (error) { setMessage({ type: 'error', text: error.message }); } finally { setBusy(false); } };
  const handleHeroSelect = id => {
    update(current => {
      if (!id) return { ...current, hero: { ...current.hero, assetId: '' } };
      const exists = current.assets.some(a => a.id === id);
      if (exists) return { ...current, hero: { ...current.hero, assetId: id } };
      const med = media.find(m => m.id === id);
      const newAsset = {
        id,
        title: { nl: med?.filename || 'Hero-afbeelding', en: med?.filename || 'Hero image', fr: med?.filename || 'Image hero' },
        caption: { nl: '', en: '', fr: '' },
        alt: { nl: med?.filename || 'Hero-afbeelding', en: med?.filename || 'Hero image', fr: med?.filename || 'Image hero' },
        credit: { nl: '', en: '', fr: '' },
        objectLabel: { nl: '', en: '', fr: '' },
        category: 'context',
        approved: true,
        url: med?.variants?.at(-1)?.url || '',
        width: med?.width || 0,
        height: med?.height || 0,
        variants: med?.variants || []
      };
      return { ...current, assets: [...current.assets, newAsset], hero: { ...current.hero, assetId: id } };
    });
  };
  const uploadHeroImage = async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const record = await uploadProvenanceMediaAsync(file);
      setMedia(current => [...current, record]);
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      const newAsset = {
        id: record.id,
        title: { nl: baseName, en: baseName, fr: baseName },
        caption: { nl: 'Hero achtergrondafbeelding.', en: 'Hero background image.', fr: 'Image de fond hero.' },
        alt: { nl: baseName, en: baseName, fr: baseName },
        credit: { nl: '', en: '', fr: '' },
        objectLabel: { nl: '', en: '', fr: '' },
        category: 'context',
        approved: true,
        url: record.variants?.at(-1)?.url || '',
        width: record.width || 0,
        height: record.height || 0,
        variants: record.variants || []
      };
      update(current => ({
        ...current,
        assets: [...current.assets.filter(a => a.id !== record.id), newAsset],
        hero: { ...current.hero, assetId: record.id }
      }));
      setMessage({ type: 'success', text: 'Nieuwe hero-afbeelding geüpload en gekoppeld. Klik op Publiceren om live te zetten.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setBusy(false);
    }
  };
  const upload = async event => { const file = event.target.files?.[0]; event.target.value = ''; if (!file) return; setBusy(true); try { const record = await uploadProvenanceMediaAsync(file); setMedia(current => [...current, record]); setMessage({ type: 'success', text: 'Afbeelding naar R2 geüpload en publieke varianten aangemaakt.' }); } catch (error) { setMessage({ type: 'error', text: error.message }); } finally { setBusy(false); } };

  if (loading) return <div className="rounded-xl border border-[#ded4c3] bg-[#fcfaf6] p-8 text-sm text-[#62594f]">Herkomsteditor laden…</div>;
  const tabs = [['overview', 'Overzicht'], ['content', 'Pagina-inhoud'], ['methods', 'Onderzoeksmethoden'], ['examples', 'Praktijkvoorbeelden'], ['comparisons', 'Voor/Na Sliders'], ['media', 'Beeldbank'], ['publish', 'Publiceren']];

  const categoryLabels = {
    all: 'Alle categorieën',
    rx: 'Röntgen (RX)',
    microscopy: 'Microscopie',
    surface: 'Oppervlak & UV',
    support: 'Drager & Achterzijde',
    documents: 'Inscripties & Archief',
    methods: 'Materiaalanalyse (XRF)',
    context: 'Atelier & Context',
  };

  const getAsset = item => {
    const existing = formData.assets.find(x => x.id === item.id);
    if (existing) return existing;
    const def = defaultAssets.find(x => x.id === item.id);
    if (def) return def;
    return { id: item.id, title: {}, caption: {}, alt: {}, category: 'context', approved: false };
  };

  const publicGalleryCount = media.filter(m => formData.gallery.assetIds.includes(m.id)).length;
  const referenceCount = media.length - publicGalleryCount;

  const filteredMedia = media.filter(item => {
    const asset = getAsset(item);
    const isSelected = formData.gallery.assetIds.includes(item.id);
    if (mediaStatus === 'public' && !isSelected) return false;
    if (mediaStatus === 'reference' && isSelected) return false;
    if (mediaCategory !== 'all' && asset.category !== mediaCategory) return false;
    if (mediaSearch.trim()) {
      const q = mediaSearch.toLowerCase().trim();
      const titleNL = (asset.title?.nl || '').toLowerCase();
      const captionNL = (asset.caption?.nl || '').toLowerCase();
      const filename = (item.filename || '').toLowerCase();
      if (!titleNL.includes(q) && !captionNL.includes(q) && !filename.includes(q)) return false;
    }
    return true;
  });

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 rounded-xl border border-[#d8cebd] bg-[#f8f4ed] p-5 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.16em] text-[#8e7035]"><ShieldCheck size={16}/> Herkomst & onderzoek</div><p className="mt-2 text-sm text-[#62594f]">Conceptversie {version} · {dirty ? 'niet opgeslagen' : 'opgeslagen'}</p></div><div className="flex flex-wrap gap-2"><button type="button" disabled={busy||!dirty} onClick={saveDraft} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#4a1521] bg-white px-4 text-xs font-semibold uppercase tracking-[.08em] text-[#4a1521] disabled:opacity-40"><Save size={16}/> Concept opslaan</button><button type="button" disabled={busy} onClick={publish} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#4a1521] px-4 text-xs font-semibold uppercase tracking-[.08em] text-white disabled:opacity-50"><Send size={16}/> Publiceren</button></div></div>
    {message && <div role="status" className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${message.type==='error'?'border-[#d39b9b] bg-[#fff4f4] text-[#7b2525]':'border-[#abcbb6] bg-[#f2faf4] text-[#215f35]'}`}><AlertCircle size={17} className="mt-0.5 shrink-0"/>{message.text}</div>}
    <div className="flex gap-2 overflow-x-auto border-b border-[#ded4c3] pb-2">{tabs.map(([id,label])=><button type="button" key={id} onClick={()=>setActiveTab(id)} className={`min-h-10 whitespace-nowrap rounded-lg px-3 text-xs font-semibold uppercase tracking-[.08em] ${activeTab===id?'bg-[#4a1521] text-white':'text-[#4a1521] hover:bg-[#f5eee4]'}`}>{label}</button>)}</div>
    <LanguageBar language={language} setLanguage={setLanguage}/>
    {activeTab==='overview' && <div className="grid gap-5 lg:grid-cols-3"><div className={cardClass}><p className="text-xs uppercase tracking-[.15em] text-[#8e7035]">Status</p><h2 className="mt-2 font-serif text-2xl text-[#211b16]">{dirty?'Concept heeft wijzigingen':'Concept is opgeslagen'}</h2><p className="mt-3 text-sm leading-6 text-[#62594f]">De publieke pagina verandert pas na een geslaagde publicatie. R2 bevat de originele bestanden en de publieke beeldvarianten.</p></div><div className={cardClass}><p className="text-xs uppercase tracking-[.15em] text-[#8e7035]">Beeldbank</p><h2 className="mt-2 font-serif text-2xl text-[#211b16]">{media.length} beelden</h2><p className="mt-3 text-sm leading-6 text-[#62594f]">{media.filter(item=>item.status==='ready').length} hebben een gecontroleerde publieke R2-variant.</p></div><div className={cardClass}><p className="text-xs uppercase tracking-[.15em] text-[#8e7035]">Revisies</p><h2 className="mt-2 font-serif text-2xl text-[#211b16]">{revisions.filter(item=>item.kind==='publication').length}</h2><p className="mt-3 text-sm leading-6 text-[#62594f]">Gepubliceerde versies kunnen als nieuw concept worden hersteld.</p></div></div>}
    {activeTab==='content' && <div className="space-y-8"><section className={cardClass}><h2 className="font-serif text-2xl text-[#211b16]">Introductie</h2><div className="mt-5 grid gap-4 md:grid-cols-2"><LocalizedField label="Label" value={formData.hero.eyebrow} language={language} onChange={value=>updateLocalized('hero','eyebrow',value[language])}/><LocalizedField label="Titel" value={formData.hero.title} language={language} onChange={value=>updateLocalized('hero','title',value[language])}/><LocalizedField label="Beschrijving" value={formData.hero.description} language={language} multiline onChange={value=>updateLocalized('hero','description',value[language])}/><LocalizedField label="Primaire knop" value={formData.hero.primaryLabel} language={language} onChange={value=>updateLocalized('hero','primaryLabel',value[language])}/><LocalizedField label="Secundaire knop" value={formData.hero.secondaryLabel} language={language} onChange={value=>updateLocalized('hero','secondaryLabel',value[language])}/><AssetSelect label="Hero-afbeelding" value={formData.hero.assetId} assets={formData.assets} media={media} uploadBusy={busy} onUpload={uploadHeroImage} onChange={handleHeroSelect}/></div></section><ListEditor title="Werkwijze" itemLabel="Stap" items={formData.steps} setItems={items=>update(current=>({...current,steps:typeof items==='function'?items(current.steps):items}))} fields={[{key:'title',label:'Titel'},{key:'description',label:'Beschrijving',multiline:true}]} language={language}/><section className={cardClass}><h2 className="font-serif text-2xl text-[#211b16]">Paginaonderdelen</h2><p className="mt-2 text-sm text-[#62594f]">Bepaal welke onderdelen zichtbaar zijn en pas hun labels, koppen en introductieteksten aan.</p><div className="mt-5 space-y-4">{formData.sections.map((item,index)=><div key={item.id} className="rounded-lg border border-[#ded4c3] bg-white p-4 space-y-3"><div className="flex items-center justify-between border-b border-[#f0eae1] pb-2"><label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.14em] text-[#8e7035]"><input type="checkbox" checked={item.enabled!==false} aria-label={`${sectionLabels[item.id] || item.id} zichtbaar`} onChange={e=>update(current=>({...current,sections:current.sections.map(x=>x.id===item.id?{...x,enabled:e.target.checked}:x)}))}/><span>{sectionLabels[item.id] || item.id}</span></label><ReorderButtons index={index} total={formData.sections.length} move={(from,to)=>update(current=>{const next=[...current.sections];[next[from],next[to]]=[next[to],next[from]];return {...current,sections:next};})}/></div><div className="grid gap-3 md:grid-cols-3"><LocalizedField label="Label (eyebrow)" value={item.eyebrow} language={language} onChange={value=>update(current=>({...current,sections:current.sections.map(x=>x.id===item.id?{...x,eyebrow:value}:x)}))}/><LocalizedField label="Titel" value={item.title} language={language} onChange={value=>update(current=>({...current,sections:current.sections.map(x=>x.id===item.id?{...x,title:value}:x)}))}/><LocalizedField label="Introductietekst" value={item.intro} language={language} multiline onChange={value=>update(current=>({...current,sections:current.sections.map(x=>x.id===item.id?{...x,intro:value}:x)}))}/></div></div>)}</div></section><section className={cardClass}><h2 className="font-serif text-2xl text-[#211b16]">Dossier en contact</h2><div className="mt-5 grid gap-4 md:grid-cols-2"><LocalizedField label="Dossiertekst" value={formData.dossier.description} language={language} multiline onChange={value=>update(current=>({...current,dossier:{...current.dossier,description:value}}))}/><LocalizedField label="CTA titel" value={formData.cta.title} language={language} onChange={value=>update(current=>({...current,cta:{...current.cta,title:value}}))}/><LocalizedField label="CTA beschrijving" value={formData.cta.description} language={language} multiline onChange={value=>update(current=>({...current,cta:{...current.cta,description:value}}))}/><LocalizedField label="CTA knop" value={formData.cta.buttonLabel} language={language} onChange={value=>update(current=>({...current,cta:{...current.cta,buttonLabel:value}}))}/></div></section></div>}
    {activeTab==='methods' && (
      <div className="space-y-8">
        <ListEditor title="Onderzoeksmethoden" itemLabel="Methode" items={formData.methods} setItems={items=>update(current=>({...current,methods:typeof items==='function'?items(current.methods):items}))} fields={[{key:'title',label:'Titel'},{key:'question',label:'Onderzoeksvraag'},{key:'description',label:'Uitleg',multiline:true},{key:'findings',label:'Wat kan zichtbaar worden?',multiline:true},{key:'limitations',label:'Beperkingen',multiline:true}]} language={language}/>
        <MediaRelationsEditor title="Onderzoeksmethoden" items={formData.methods} media={media} relationKey="methods" language={language} update={update} getAsset={getAsset} categoryLabels={categoryLabels} onPreview={setPreviewItem} />
        <section className={cardClass}><h2 className="font-serif text-2xl text-[#211b16]">Bronnen</h2><div className="mt-4 space-y-4">{formData.sources.map((item,index)=><div className="grid gap-4 rounded-lg border border-[#ded4c3] bg-white p-4 md:grid-cols-2" key={item.id}><LocalizedField label="Bron" value={item.title} language={language} onChange={value=>update(current=>({...current,sources:current.sources.map((x,i)=>i===index?{...x,title:value}:x)}))}/><Field label="HTTPS-link" value={item.url} onChange={value=>update(current=>({...current,sources:current.sources.map((x,i)=>i===index?{...x,url:value}:x)}))}/></div>)}</div></section>
      </div>
    )}
    {activeTab==='examples' && (
      <div className="space-y-8">
        <ListEditor title="Praktijkvoorbeelden" itemLabel="Voorbeeld" items={formData.examples} setItems={items=>update(current=>({...current,examples:typeof items==='function'?items(current.examples):items}))} fields={[{key:'title',label:'Titel'},{key:'question',label:'Onderzoeksvraag'},{key:'description',label:'Beschrijving',multiline:true},{key:'findings',label:'Bevindingen',multiline:true},{key:'uncertainties',label:'Onzekerheden',multiline:true}]} language={language}/>
        <MediaRelationsEditor title="Praktijkvoorbeelden" items={formData.examples} media={media} relationKey="examples" language={language} update={update} getAsset={getAsset} categoryLabels={categoryLabels} onPreview={setPreviewItem} />
        <ListEditor title="Veelgestelde vragen" itemLabel="FAQ" items={formData.faq} setItems={items=>update(current=>({...current,faq:typeof items==='function'?items(current.faq):items}))} fields={[{key:'question',label:'Vraag'},{key:'answer',label:'Antwoord',multiline:true}]} language={language}/>
      </div>
    )}
    {activeTab==='comparisons' && <ComparisonsEditor comparisons={formData.comparisons} assets={formData.assets} media={media} language={language} update={update}/>}
    {activeTab==='media' && (
      <div className="space-y-6">
        {/* Beeldbank Top Bar */}
        <section className={cardClass}>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-serif text-2xl text-[#211b16]">R2-beeldbank ({media.length} afbeeldingen)</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#62594f]">
                Alle 40 geoptimaliseerde beelden zijn gereed in de Cloudflare R2-opslag. Klik op een foto voor een grote voorvertoning. Beschrijvingen en alt-teksten zijn per taal beheerbaar en worden nooit blanco getoond.
              </p>
            </div>
            <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#4a1521] px-4 text-xs font-semibold uppercase tracking-[.08em] text-white transition hover:bg-[#381019]">
              <ImagePlus size={16} /> Afbeelding uploaden
              <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" onChange={upload} />
            </label>
          </div>

          {/* Search and Filters Bar */}
          <div className="mt-6 flex flex-col gap-3 border-t border-[#ded4c3] pt-5 lg:flex-row lg:items-center lg:justify-between">
            {/* Status Pills */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setMediaStatus('all')}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${mediaStatus === 'all' ? 'bg-[#4a1521] text-white' : 'border border-[#d8cebd] bg-white text-[#4a1521] hover:bg-[#f5ede0]'}`}
              >
                Alle ({media.length})
              </button>
              <button
                type="button"
                onClick={() => setMediaStatus('public')}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${mediaStatus === 'public' ? 'bg-[#4a1521] text-white' : 'border border-[#d8cebd] bg-white text-[#4a1521] hover:bg-[#f5ede0]'}`}
              >
                In publieke galerij ({publicGalleryCount})
              </button>
              <button
                type="button"
                onClick={() => setMediaStatus('reference')}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${mediaStatus === 'reference' ? 'bg-[#4a1521] text-white' : 'border border-[#d8cebd] bg-white text-[#4a1521] hover:bg-[#f5ede0]'}`}
              >
                Referentie / Archief ({referenceCount})
              </button>
            </div>

            {/* Category Dropdown & Search Input */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <select
                value={mediaCategory}
                onChange={e => setMediaCategory(e.target.value)}
                className="h-10 rounded-lg border border-[#d8cebd] bg-white px-3 text-xs text-[#211b16] outline-none transition focus:border-[#4a1521]"
              >
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>

              <div className="relative">
                <Search size={14} className="pointer-events-none absolute left-3 top-3 text-[#8e7035]" />
                <input
                  type="text"
                  placeholder="Zoek op titel of bestandsnaam…"
                  value={mediaSearch}
                  onChange={e => setMediaSearch(e.target.value)}
                  className="h-10 w-full rounded-lg border border-[#d8cebd] bg-white pl-9 pr-8 text-xs text-[#211b16] outline-none transition focus:border-[#4a1521] sm:w-60"
                />
                {mediaSearch && (
                  <button
                    type="button"
                    onClick={() => setMediaSearch('')}
                    className="absolute right-2.5 top-2.5 text-[#74695f] hover:text-[#211b16]"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Media Grid */}
        <section className={cardClass}>
          <div className="flex items-center justify-between border-b border-[#ded4c3] pb-3">
            <h3 className="font-serif text-xl font-semibold text-[#211b16]">
              Afbeeldingen ({filteredMedia.length} van {media.length})
            </h3>
            <span className="text-xs text-[#74695f]">
              Klik op een foto voor een schermbrede voorvertoning
            </span>
          </div>

          {filteredMedia.length === 0 ? (
            <p className="py-12 text-center text-sm text-[#74695f]">
              Geen beelden gevonden voor deze zoekopdracht of filter.
            </p>
          ) : (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredMedia.map(item => {
                const selected = formData.gallery.assetIds.includes(item.id);
                const asset = getAsset(item);

                return (
                  <article
                    key={item.id}
                    className={`overflow-hidden rounded-xl border bg-white transition duration-200 ${
                      selected ? 'border-[#4a1521] ring-2 ring-[#4a1521]/15 shadow-sm' : 'border-[#ded4c3] shadow-xs'
                    }`}
                  >
                    {/* Card Header */}
                    <div className="flex items-center justify-between border-b border-[#f0eae1] bg-[#faf7f2] px-3.5 py-2.5">
                      <div className="flex items-center gap-2 truncate">
                        <span className="inline-flex items-center rounded-full bg-[#4a1521]/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#4a1521]">
                          {categoryLabels[asset.category] || asset.category || 'Beeld'}
                        </span>
                        <span className="truncate text-xs font-semibold text-[#211b16]">
                          {localized(asset.title, language) || item.filename}
                        </span>
                      </div>
                      <span className="shrink-0 font-mono text-[11px] text-[#8e7035]">
                        {item.filename}
                      </span>
                    </div>

                    {/* Thumbnail Area with Click-to-Preview */}
                    <div
                      className="group relative aspect-[4/3] cursor-pointer overflow-hidden bg-[#211b16]"
                      onClick={() => setPreviewItem(item)}
                      title="Klik om te vergroten en alle details te bekijken"
                    >
                      {item.variants?.[0]?.url ? (
                        <img
                          src={item.variants[0].url}
                          alt={localized(asset.alt, language) || ''}
                          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="grid h-full place-items-center text-xs text-[#a39789]">
                          Nog geen publieke variant
                        </div>
                      )}

                      {/* Hover Action Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#211b16] shadow-md backdrop-blur-xs">
                          <Eye size={14} className="text-[#4a1521]" /> Voorvertoning bekijken
                        </span>
                      </div>

                      {/* Resolution Badge */}
                      <div className="absolute bottom-2 left-2 flex gap-1">
                        <span className="rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-xs">
                          {item.width} × {item.height}px
                        </span>
                        {item.status === 'ready' && (
                          <span className="rounded bg-[#215f35]/85 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs">
                            R2 gereed
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Form Content */}
                    <div className="space-y-3.5 p-4">
                      <div className="flex items-center justify-between border-b border-[#f0eae1] pb-2.5">
                        <label className="flex items-center gap-2 text-xs font-semibold text-[#211b16] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={e => {
                              const checked = e.target.checked;
                              update(current => {
                                const galleryIds = checked
                                  ? [...new Set([...current.gallery.assetIds, item.id])]
                                  : current.gallery.assetIds.filter(id => id !== item.id);
                                const exists = current.assets.some(x => x.id === item.id);
                                const baseAsset = getAsset(item);
                                const nextAssets = exists
                                  ? current.assets.map(x => x.id === item.id ? { ...x, approved: checked ? true : x.approved } : x)
                                  : [...current.assets, { ...baseAsset, approved: checked }];
                                return { ...current, gallery: { ...current.gallery, assetIds: galleryIds }, assets: nextAssets };
                              });
                            }}
                          />
                          <span>In publieke galerij tonen</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setPreviewItem(item)}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-[#4a1521] hover:underline"
                        >
                          <Maximize2 size={12} /> Details
                        </button>
                      </div>

                      <LocalizedField
                        label="Bijschrift / Beschrijving"
                        value={asset.caption}
                        language={language}
                        multiline
                        onChange={value => update(current => {
                          const exists = current.assets.some(x => x.id === item.id);
                          const base = getAsset(item);
                          return {
                            ...current,
                            assets: exists
                              ? current.assets.map(x => x.id === item.id ? { ...x, caption: value, approved: true } : x)
                              : [...current.assets, { ...base, caption: value, approved: true }]
                          };
                        })}
                      />

                      <LocalizedField
                        label="Alt-tekst (Toegankelijkheid)"
                        value={asset.alt}
                        language={language}
                        onChange={value => update(current => {
                          const exists = current.assets.some(x => x.id === item.id);
                          const base = getAsset(item);
                          return {
                            ...current,
                            assets: exists
                              ? current.assets.map(x => x.id === item.id ? { ...x, alt: value, approved: true } : x)
                              : [...current.assets, { ...base, alt: value, approved: true }]
                          };
                        })}
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    )}
    {activeTab==='publish' && <div className="space-y-6"><section className={cardClass}><h2 className="font-serif text-2xl text-[#211b16]">Publicatiecontrole</h2><p className="mt-2 text-sm leading-6 text-[#62594f]">Alle zichtbare onderdelen, drie talen, bronverwijzingen en R2-varianten worden gecontroleerd voordat de live versie wordt vervangen.</p>{issues.length>0?<ul className="mt-5 space-y-2 text-sm text-[#7b2525]">{issues.map((issue,index)=><li key={`${issue}-${index}`} className="flex gap-2"><AlertCircle size={16} className="mt-0.5 shrink-0"/>{issue}</li>)}</ul>:<p className="mt-5 flex items-center gap-2 text-sm text-[#215f35]"><Check size={17}/> Nog geen fouten gevonden in de laatste controle.</p>}</section><section className={cardClass}><h2 className="font-serif text-2xl text-[#211b16]">SEO</h2><div className="mt-5 grid gap-4 md:grid-cols-2"><LocalizedField label="SEO-titel" value={formData.seo.title} language={language} onChange={value=>update(current=>({...current,seo:{...current.seo,title:value}}))}/><LocalizedField label="SEO-beschrijving" value={formData.seo.description} language={language} multiline onChange={value=>update(current=>({...current,seo:{...current.seo,description:value}}))}/><AssetSelect label="Social share afbeelding (SEO)" value={formData.seo.assetId} assets={formData.assets} media={media} onChange={id=>update(current=>({...current,seo:{...current.seo,assetId:id}}))}/></div></section><section className={cardClass}><h2 className="font-serif text-2xl text-[#211b16]">Gepubliceerde revisies</h2><div className="mt-4 divide-y divide-[#ded4c3]">{revisions.filter(item=>item.kind==='publication').map(item=><div key={item.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"><span className="text-sm text-[#62594f]">Versie {item.version} · {new Date(item.created_at).toLocaleString('nl-BE')}</span><button type="button" disabled={busy} onClick={async()=>{setBusy(true);try{const body=await restoreProvenanceRevisionAsync(item.id,version);setFormData(normalizeProvenance(body.draft));setVersion(body.version);setDirty(false);setIssues([]);setMessage({type:'success',text:`Revisie ${item.version} als nieuw concept hersteld.`});}catch(error){setMessage({type:'error',text:error.message});}finally{setBusy(false);}}} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#4a1521] px-3 text-xs font-semibold uppercase tracking-[.08em] text-[#4a1521] disabled:opacity-40"><Eye size={15}/> Herstellen als concept</button></div>)}{revisions.filter(item=>item.kind==='publication').length===0&&<p className="py-3 text-sm text-[#62594f]">Nog geen nieuwe revisies geregistreerd.</p>}</div></section></div>}
    {activeTab==='content' && <section className={cardClass}><h2 className="font-serif text-2xl text-[#211b16]">Homepage-teaser</h2><div className="mt-5 grid gap-4 md:grid-cols-2"><LocalizedField label="Titel" value={formData.homepageTeaser.title} language={language} onChange={value=>update(current=>({...current,homepageTeaser:{...current.homepageTeaser,title:value}}))}/><LocalizedField label="Knop" value={formData.homepageTeaser.buttonLabel} language={language} onChange={value=>update(current=>({...current,homepageTeaser:{...current.homepageTeaser,buttonLabel:value}}))}/><LocalizedField label="Beschrijving" value={formData.homepageTeaser.description} language={language} multiline onChange={value=>update(current=>({...current,homepageTeaser:{...current.homepageTeaser,description:value}}))}/><AssetSelect label="Teaser-afbeelding" value={formData.homepageTeaser.assetId} assets={formData.assets} media={media} onChange={id=>update(current=>({...current,homepageTeaser:{...current.homepageTeaser,assetId:id}}))}/></div><label className="mt-4 flex items-center gap-2 text-sm text-[#5f554c]"><input type="checkbox" checked={formData.homepageTeaser.enabled!==false} onChange={e=>update(current=>({...current,homepageTeaser:{...current.homepageTeaser,enabled:e.target.checked}}))}/> Zichtbaar op de homepage</label></section>}
    {activeTab==='content' && <ListEditor title="Dossieronderdelen" itemLabel="Onderdeel" items={formData.dossier.items} setItems={items=>update(current=>({...current,dossier:{...current.dossier,items:typeof items==='function'?items(current.dossier.items):items}}))} fields={[{key:'title',label:'Titel'},{key:'description',label:'Beschrijving',multiline:true}]} language={language}/>}

    {/* Full Image Preview Modal (Lightbox) accessible everywhere */}
    {previewItem && (() => {
      const pAsset = getAsset(previewItem);
      const pSelected = formData.gallery.assetIds.includes(previewItem.id);
      const pVariants = previewItem.variants || [];
      const pUrl = pVariants.at(-1)?.url || pVariants[0]?.url;
      const previewList = (activeTab === 'media' && filteredMedia.length > 0) ? filteredMedia : media;
      const currentIndex = previewList.findIndex(m => m.id === previewItem.id);

      return (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setPreviewItem(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-[#fcfaf6] shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#ded4c3] bg-[#f8f4ed] px-6 py-4">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8e7035]">
                  {categoryLabels[pAsset.category] || pAsset.category} · {previewItem.filename}
                </span>
                <h3 className="font-serif text-xl font-semibold text-[#211b16]">
                  {localized(pAsset.title, language) || previewItem.filename}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="rounded-full p-2 text-[#62594f] transition hover:bg-[#ded4c3] hover:text-[#211b16]"
                aria-label="Sluiten"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body: Image & Info */}
            <div className="grid flex-1 overflow-y-auto md:grid-cols-12">
              {/* Large Image Preview */}
              <div className="flex items-center justify-center bg-[#181310] p-4 md:col-span-7">
                {pUrl ? (
                  <img
                    src={pUrl}
                    alt={localized(pAsset.alt, language) || ''}
                    className="max-h-[60vh] w-auto max-w-full rounded object-contain shadow-lg"
                  />
                ) : (
                  <p className="text-sm text-neutral-400">Geen voorvertoning beschikbaar.</p>
                )}
              </div>

              {/* Metadata & Details */}
              <div className="space-y-4 p-6 md:col-span-5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-[#74695f]">
                    {previewItem.width} × {previewItem.height}px · {previewItem.status === 'ready' ? 'R2 gereed' : previewItem.status}
                  </span>
                  <label className="flex items-center gap-2 text-xs font-semibold text-[#4a1521]">
                    <input
                      type="checkbox"
                      checked={pSelected}
                      onChange={e => {
                        const checked = e.target.checked;
                        update(current => {
                          const gIds = checked
                            ? [...new Set([...current.gallery.assetIds, previewItem.id])]
                            : current.gallery.assetIds.filter(id => id !== previewItem.id);
                          return { ...current, gallery: { ...current.gallery, assetIds: gIds } };
                        });
                      }}
                    />
                    In publieke galerij
                  </label>
                </div>

                <div className="space-y-3 rounded-lg border border-[#ded4c3] bg-white p-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8e7035]">
                    Beschrijving / Bijschrift ({labels[language]})
                  </p>
                  <p className="text-sm leading-relaxed text-[#211b16]">
                    {localized(pAsset.caption, language) || 'Geen bijschrift ingevuld.'}
                  </p>

                  <div className="border-t border-[#f0eae1] pt-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8e7035]">
                      Alt-tekst ({labels[language]})
                    </p>
                    <p className="text-xs leading-relaxed text-[#5f554c]">
                      {localized(pAsset.alt, language) || 'Geen alt-tekst ingevuld.'}
                    </p>
                  </div>
                </div>

                {/* Navigation buttons */}
                <div className="flex items-center justify-between border-t border-[#ded4c3] pt-4">
                  <button
                    type="button"
                    disabled={currentIndex <= 0}
                    onClick={() => setPreviewItem(previewList[currentIndex - 1])}
                    className="rounded-lg border border-[#d8cebd] bg-white px-3 py-1.5 text-xs font-medium text-[#4a1521] disabled:opacity-30"
                  >
                    ← Vorige
                  </button>
                  <span className="text-xs text-[#74695f]">
                    {currentIndex >= 0 ? currentIndex + 1 : 1} van {previewList.length}
                  </span>
                  <button
                    type="button"
                    disabled={currentIndex < 0 || currentIndex >= previewList.length - 1}
                    onClick={() => setPreviewItem(previewList[currentIndex + 1])}
                    className="rounded-lg border border-[#d8cebd] bg-white px-3 py-1.5 text-xs font-medium text-[#4a1521] disabled:opacity-30"
                  >
                    Volgende →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    })()}
  </div>;
}
