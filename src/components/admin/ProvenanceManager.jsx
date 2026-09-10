import React, { useEffect, useState } from 'react';
import { AlertCircle, Check, ChevronDown, ChevronUp, Eye, ImagePlus, Plus, Save, Send, ShieldCheck, SlidersHorizontal, Trash2 } from 'lucide-react';
import { defaultProvenance } from '../../data/defaultProvenance';
import { PROVENANCE_LANGUAGES, PROVENANCE_SECTIONS, localized, normalizeProvenance, provenanceIssues } from '../../utils/provenance';
import { fetchProvenanceAdminAsync, restoreProvenanceRevisionAsync, saveProvenanceDraftAsync, uploadProvenanceMediaAsync } from '../../utils/storage';
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

function AssetSelect({ label, value, assets = [], media = [], onChange }) {
  const selectedMedia = media.find(m => m.id === value);
  const options = assets.map(a => {
    const med = media.find(m => m.id === a.id);
    const titleStr = typeof a.title === 'string' ? a.title : a.title?.nl || a.title?.en || '';
    return {
      id: a.id,
      label: titleStr ? `${titleStr} (${med?.filename || a.category || 'beeld'})` : (med?.filename || a.id.slice(0, 8))
    };
  });
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-[#3f352d]">
        <span>{label}</span>
        <select value={value || ''} onChange={e => onChange(e.target.value)} className={inputClass}>
          <option value="">— Kies een afbeelding —</option>
          {options.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
        </select>
      </label>
      {selectedMedia?.variants?.[0]?.url && (
        <div className="flex items-center gap-2.5 rounded-lg border border-[#d8cebd] bg-white p-2 shadow-xs">
          <img src={selectedMedia.variants[0].url} alt="" className="h-12 w-12 rounded object-cover" />
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

function MediaRelationsEditor({ title, items, media, relationKey, language, update }) {
  return <section className={cardClass}><h3 className="font-serif text-xl font-semibold text-[#211b16]">{title} · beeldkoppelingen</h3><p className="mt-2 text-sm text-[#62594f]">Koppel gecontroleerde R2-beelden aan elk onderdeel. Alleen gekoppelde, goedgekeurde beelden kunnen worden gepubliceerd.</p><div className="mt-4 space-y-4">{items.map(item => <div key={item.id} className="rounded-lg border border-[#ded4c3] bg-white p-4"><p className="font-serif font-semibold text-[#4a1521]">{localized(item.title, language) || item.id}</p><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{media.map(asset => <label key={asset.id} className="flex items-center gap-2 text-xs text-[#5f554c]"><input type="checkbox" checked={item.assetIds?.includes(asset.id)} onChange={event => update(current => ({ ...current, [relationKey]: current[relationKey].map(entry => entry.id === item.id ? { ...entry, assetIds: event.target.checked ? [...new Set([...(entry.assetIds || []), asset.id])] : (entry.assetIds || []).filter(id => id !== asset.id) } : entry) }))}/><span>{asset.filename} {asset.status === 'ready' ? '· R2 klaar' : '· privé'}</span></label>)}</div></div>)}</div></section>;
}

export default function ProvenanceManager({ provenanceData, showToast }) {
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

  const load = async () => { setLoading(true); try { const body = await fetchProvenanceAdminAsync(); const next = normalizeProvenance(body.draft); setFormData(next); setVersion(body.version); setMedia(body.media || []); setRevisions(body.revisions || []); setDirty(false); setIssues([]); } catch (error) { setMessage({type:'error',text:error.message}); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const update = updater => { setFormData(current => normalizeProvenance(typeof updater === 'function' ? updater(current) : updater)); setDirty(true); setMessage(null); };
  const updateLocalized = (section, field, value) => update(current => ({...current,[section]:{...current[section],[field]:{...(current[section]?.[field]||{}),[language]:value}}}));
  const saveDraft = async () => { setBusy(true); try { const body=await saveProvenanceDraftAsync(formData,version); setVersion(body.version); setFormData(normalizeProvenance(body.draft)); setDirty(false); setIssues([]); setMessage({type:'success',text:'Concept opgeslagen. De live pagina is niet gewijzigd.'}); showToast?.('Herkomstconcept opgeslagen.','info'); } catch(error) { setMessage({type:'error',text:error.message}); if(error.message.includes('andere beheerder')) await load(); } finally { setBusy(false); } };
  const publish = async () => { const nextIssues=provenanceIssues(formData,{publishing:true}); setIssues(nextIssues); if(nextIssues.length){setActiveTab('publish');setMessage({type:'error',text:'De publicatiecontrole vond aandachtspunten.'});return;} setBusy(true); try { const saved=await saveProvenanceDraftAsync(formData,version); setVersion(saved.version); const response=await fetch('/api/save-provenance',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'publish',expectedVersion:saved.version})}); const body=await response.json().catch(()=>({})); if(!response.ok||!body.ok)throw new Error(body.issues?.join('\n')||body.error||'Publiceren is mislukt.'); setFormData(normalizeProvenance(body.provenanceData)); setDirty(false); setIssues([]); setMessage({type:'success',text:'Nieuwe herkomstversie gepubliceerd.'}); showToast?.('Herkomstpagina gepubliceerd.','info'); await load(); } catch(error) { setMessage({type:'error',text:error.message}); } finally { setBusy(false); } };
  const upload = async event => { const file=event.target.files?.[0]; event.target.value=''; if(!file)return; setBusy(true); try { const record=await uploadProvenanceMediaAsync(file); setMedia(current=>[...current,record]); setMessage({type:'success',text:'Afbeelding naar R2 geüpload en publieke varianten aangemaakt.'}); } catch(error) { setMessage({type:'error',text:error.message}); } finally { setBusy(false); } };
  if(loading) return <div className="rounded-xl border border-[#ded4c3] bg-[#fcfaf6] p-8 text-sm text-[#62594f]">Herkomsteditor laden…</div>;
  const tabs=[['overview','Overzicht'],['content','Pagina-inhoud'],['methods','Onderzoeksmethoden'],['examples','Praktijkvoorbeelden'],['comparisons','Voor/Na Sliders'],['media','Beeldbank'],['publish','Publiceren']];
  return <div className="space-y-6">
    <div className="flex flex-col gap-4 rounded-xl border border-[#d8cebd] bg-[#f8f4ed] p-5 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.16em] text-[#8e7035]"><ShieldCheck size={16}/> Herkomst & onderzoek</div><p className="mt-2 text-sm text-[#62594f]">Conceptversie {version} · {dirty ? 'niet opgeslagen' : 'opgeslagen'}</p></div><div className="flex flex-wrap gap-2"><button type="button" disabled={busy||!dirty} onClick={saveDraft} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#4a1521] bg-white px-4 text-xs font-semibold uppercase tracking-[.08em] text-[#4a1521] disabled:opacity-40"><Save size={16}/> Concept opslaan</button><button type="button" disabled={busy} onClick={publish} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#4a1521] px-4 text-xs font-semibold uppercase tracking-[.08em] text-white disabled:opacity-50"><Send size={16}/> Publiceren</button></div></div>
    {message && <div role="status" className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${message.type==='error'?'border-[#d39b9b] bg-[#fff4f4] text-[#7b2525]':'border-[#abcbb6] bg-[#f2faf4] text-[#215f35]'}`}><AlertCircle size={17} className="mt-0.5 shrink-0"/>{message.text}</div>}
    <div className="flex gap-2 overflow-x-auto border-b border-[#ded4c3] pb-2">{tabs.map(([id,label])=><button type="button" key={id} onClick={()=>setActiveTab(id)} className={`min-h-10 whitespace-nowrap rounded-lg px-3 text-xs font-semibold uppercase tracking-[.08em] ${activeTab===id?'bg-[#4a1521] text-white':'text-[#4a1521] hover:bg-[#f5eee4]'}`}>{label}</button>)}</div>
    <LanguageBar language={language} setLanguage={setLanguage}/>
    {activeTab==='overview' && <div className="grid gap-5 lg:grid-cols-3"><div className={cardClass}><p className="text-xs uppercase tracking-[.15em] text-[#8e7035]">Status</p><h2 className="mt-2 font-serif text-2xl text-[#211b16]">{dirty?'Concept heeft wijzigingen':'Concept is opgeslagen'}</h2><p className="mt-3 text-sm leading-6 text-[#62594f]">De publieke pagina verandert pas na een geslaagde publicatie. R2 bevat de originele bestanden en de publieke beeldvarianten.</p></div><div className={cardClass}><p className="text-xs uppercase tracking-[.15em] text-[#8e7035]">Beeldbank</p><h2 className="mt-2 font-serif text-2xl text-[#211b16]">{media.length} beelden</h2><p className="mt-3 text-sm leading-6 text-[#62594f]">{media.filter(item=>item.status==='ready').length} hebben een gecontroleerde publieke R2-variant.</p></div><div className={cardClass}><p className="text-xs uppercase tracking-[.15em] text-[#8e7035]">Revisies</p><h2 className="mt-2 font-serif text-2xl text-[#211b16]">{revisions.filter(item=>item.kind==='publication').length}</h2><p className="mt-3 text-sm leading-6 text-[#62594f]">Gepubliceerde versies kunnen als nieuw concept worden hersteld.</p></div></div>}
    {activeTab==='content' && <div className="space-y-8"><section className={cardClass}><h2 className="font-serif text-2xl text-[#211b16]">Introductie</h2><div className="mt-5 grid gap-4 md:grid-cols-2"><LocalizedField label="Label" value={formData.hero.eyebrow} language={language} onChange={value=>updateLocalized('hero','eyebrow',value[language])}/><LocalizedField label="Titel" value={formData.hero.title} language={language} onChange={value=>updateLocalized('hero','title',value[language])}/><LocalizedField label="Beschrijving" value={formData.hero.description} language={language} multiline onChange={value=>updateLocalized('hero','description',value[language])}/><LocalizedField label="Primaire knop" value={formData.hero.primaryLabel} language={language} onChange={value=>updateLocalized('hero','primaryLabel',value[language])}/><LocalizedField label="Secundaire knop" value={formData.hero.secondaryLabel} language={language} onChange={value=>updateLocalized('hero','secondaryLabel',value[language])}/><AssetSelect label="Hero-afbeelding" value={formData.hero.assetId} assets={formData.assets} media={media} onChange={id=>update(current=>({...current,hero:{...current.hero,assetId:id}}))}/></div></section><ListEditor title="Werkwijze" itemLabel="Stap" items={formData.steps} setItems={items=>update(current=>({...current,steps:typeof items==='function'?items(current.steps):items}))} fields={[{key:'title',label:'Titel'},{key:'description',label:'Beschrijving',multiline:true}]} language={language}/><section className={cardClass}><h2 className="font-serif text-2xl text-[#211b16]">Paginaonderdelen</h2><p className="mt-2 text-sm text-[#62594f]">Bepaal welke onderdelen zichtbaar zijn en pas hun labels, koppen en introductieteksten aan.</p><div className="mt-5 space-y-4">{formData.sections.map((item,index)=><div key={item.id} className="rounded-lg border border-[#ded4c3] bg-white p-4 space-y-3"><div className="flex items-center justify-between border-b border-[#f0eae1] pb-2"><label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.14em] text-[#8e7035]"><input type="checkbox" checked={item.enabled!==false} aria-label={`${sectionLabels[item.id] || item.id} zichtbaar`} onChange={e=>update(current=>({...current,sections:current.sections.map(x=>x.id===item.id?{...x,enabled:e.target.checked}:x)}))}/><span>{sectionLabels[item.id] || item.id}</span></label><ReorderButtons index={index} total={formData.sections.length} move={(from,to)=>update(current=>{const next=[...current.sections];[next[from],next[to]]=[next[to],next[from]];return {...current,sections:next};})}/></div><div className="grid gap-3 md:grid-cols-3"><LocalizedField label="Label (eyebrow)" value={item.eyebrow} language={language} onChange={value=>update(current=>({...current,sections:current.sections.map(x=>x.id===item.id?{...x,eyebrow:value}:x)}))}/><LocalizedField label="Titel" value={item.title} language={language} onChange={value=>update(current=>({...current,sections:current.sections.map(x=>x.id===item.id?{...x,title:value}:x)}))}/><LocalizedField label="Introductietekst" value={item.intro} language={language} multiline onChange={value=>update(current=>({...current,sections:current.sections.map(x=>x.id===item.id?{...x,intro:value}:x)}))}/></div></div>)}</div></section><section className={cardClass}><h2 className="font-serif text-2xl text-[#211b16]">Dossier en contact</h2><div className="mt-5 grid gap-4 md:grid-cols-2"><LocalizedField label="Dossiertekst" value={formData.dossier.description} language={language} multiline onChange={value=>update(current=>({...current,dossier:{...current.dossier,description:value}}))}/><LocalizedField label="CTA titel" value={formData.cta.title} language={language} onChange={value=>update(current=>({...current,cta:{...current.cta,title:value}}))}/><LocalizedField label="CTA beschrijving" value={formData.cta.description} language={language} multiline onChange={value=>update(current=>({...current,cta:{...current.cta,description:value}}))}/><LocalizedField label="CTA knop" value={formData.cta.buttonLabel} language={language} onChange={value=>update(current=>({...current,cta:{...current.cta,buttonLabel:value}}))}/></div></section></div>}
    {activeTab==='methods' && <div className="space-y-8"><ListEditor title="Onderzoeksmethoden" itemLabel="Methode" items={formData.methods} setItems={items=>update(current=>({...current,methods:typeof items==='function'?items(current.methods):items}))} fields={[{key:'title',label:'Titel'},{key:'question',label:'Onderzoeksvraag'},{key:'description',label:'Uitleg',multiline:true},{key:'findings',label:'Wat kan zichtbaar worden?',multiline:true},{key:'limitations',label:'Beperkingen',multiline:true}]} language={language}/><section className={cardClass}><h2 className="font-serif text-2xl text-[#211b16]">Bronnen</h2><div className="mt-4 space-y-4">{formData.sources.map((item,index)=><div className="grid gap-4 rounded-lg border border-[#ded4c3] bg-white p-4 md:grid-cols-2" key={item.id}><LocalizedField label="Bron" value={item.title} language={language} onChange={value=>update(current=>({...current,sources:current.sources.map((x,i)=>i===index?{...x,title:value}:x)}))}/><Field label="HTTPS-link" value={item.url} onChange={value=>update(current=>({...current,sources:current.sources.map((x,i)=>i===index?{...x,url:value}:x)}))}/></div>)}</div></section></div>}
    {activeTab==='examples' && <div className="space-y-8"><ListEditor title="Praktijkvoorbeelden" itemLabel="Voorbeeld" items={formData.examples} setItems={items=>update(current=>({...current,examples:typeof items==='function'?items(current.examples):items}))} fields={[{key:'title',label:'Titel'},{key:'question',label:'Onderzoeksvraag'},{key:'description',label:'Beschrijving',multiline:true},{key:'findings',label:'Bevindingen',multiline:true},{key:'uncertainties',label:'Onzekerheden',multiline:true}]} language={language}/><ListEditor title="Veelgestelde vragen" itemLabel="FAQ" items={formData.faq} setItems={items=>update(current=>({...current,faq:typeof items==='function'?items(current.faq):items}))} fields={[{key:'question',label:'Vraag'},{key:'answer',label:'Antwoord',multiline:true}]} language={language}/></div>}
    {activeTab==='comparisons' && <ComparisonsEditor comparisons={formData.comparisons} assets={formData.assets} media={media} language={language} update={update}/>}
    {activeTab==='media' && <div className="space-y-6"><section className={cardClass}><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="font-serif text-2xl text-[#211b16]">R2-beeldbank</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#62594f]">Originele bestanden worden afgeschermd opgeslagen in R2. Na controle worden publieke WebP-varianten in de publieke R2-bucket gemaakt.</p></div><label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#4a1521] px-4 text-xs font-semibold uppercase tracking-[.08em] text-white"><ImagePlus size={16}/> Afbeelding uploaden<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" onChange={upload}/></label></div></section><section className={cardClass}><h2 className="font-serif text-2xl text-[#211b16]">Gekoppelde beelden</h2><p className="mt-2 text-sm text-[#62594f]">Vink beelden aan voor de publieke galerij. Bijschriften en alt-teksten blijven per taal beheerbaar.</p><div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{media.map(item=>{const selected=formData.gallery.assetIds.includes(item.id);const asset=formData.assets.find(x=>x.id===item.id);return <article key={item.id} className={`overflow-hidden rounded-lg border bg-white ${selected?'border-[#4a1521] ring-2 ring-[#4a1521]/10':'border-[#ded4c3]'}`}><div className="aspect-[4/3] bg-[#eee8de]">{item.variants?.[0]?.url?<img src={item.variants[0].url} alt="" className="h-full w-full object-cover"/>:<div className="grid h-full place-items-center text-xs text-[#74695f]">Nog geen publieke variant</div>}</div><div className="space-y-3 p-3"><div className="flex items-center gap-2"><input type="checkbox" checked={selected} onChange={e=>update(current=>({...current,gallery:{...current.gallery,assetIds:e.target.checked?[...new Set([...current.gallery.assetIds,item.id])]:current.gallery.assetIds.filter(id=>id!==item.id)},assets:current.assets.some(x=>x.id===item.id)?current.assets: [...current.assets,{id:item.id,title:{},caption:{},alt:{},credit:{},category:'context',approved:false}]}))}/><span className="text-sm font-semibold text-[#211b16]">Publiek gebruiken</span></div>{asset&&<><LocalizedField label="Bijschrift" value={asset.caption} language={language} onChange={value=>update(current=>({...current,assets:current.assets.map(x=>x.id===item.id?{...x,caption:value,approved:true}:x)}))}/><LocalizedField label="Alt-tekst" value={asset.alt} language={language} onChange={value=>update(current=>({...current,assets:current.assets.map(x=>x.id===item.id?{...x,alt:value,approved:true}:x)}))}/></>}</div></article>})}</div></section></div>}
    {activeTab==='publish' && <div className="space-y-6"><section className={cardClass}><h2 className="font-serif text-2xl text-[#211b16]">Publicatiecontrole</h2><p className="mt-2 text-sm leading-6 text-[#62594f]">Alle zichtbare onderdelen, drie talen, bronverwijzingen en R2-varianten worden gecontroleerd voordat de live versie wordt vervangen.</p>{issues.length>0?<ul className="mt-5 space-y-2 text-sm text-[#7b2525]">{issues.map((issue,index)=><li key={`${issue}-${index}`} className="flex gap-2"><AlertCircle size={16} className="mt-0.5 shrink-0"/>{issue}</li>)}</ul>:<p className="mt-5 flex items-center gap-2 text-sm text-[#215f35]"><Check size={17}/> Nog geen fouten gevonden in de laatste controle.</p>}</section><section className={cardClass}><h2 className="font-serif text-2xl text-[#211b16]">SEO</h2><div className="mt-5 grid gap-4 md:grid-cols-2"><LocalizedField label="SEO-titel" value={formData.seo.title} language={language} onChange={value=>update(current=>({...current,seo:{...current.seo,title:value}}))}/><LocalizedField label="SEO-beschrijving" value={formData.seo.description} language={language} multiline onChange={value=>update(current=>({...current,seo:{...current.seo,description:value}}))}/><AssetSelect label="Social share afbeelding (SEO)" value={formData.seo.assetId} assets={formData.assets} media={media} onChange={id=>update(current=>({...current,seo:{...current.seo,assetId:id}}))}/></div></section><section className={cardClass}><h2 className="font-serif text-2xl text-[#211b16]">Gepubliceerde revisies</h2><div className="mt-4 divide-y divide-[#ded4c3]">{revisions.filter(item=>item.kind==='publication').map(item=><div key={item.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"><span className="text-sm text-[#62594f]">Versie {item.version} · {new Date(item.created_at).toLocaleString('nl-BE')}</span><button type="button" disabled={busy} onClick={async()=>{setBusy(true);try{const body=await restoreProvenanceRevisionAsync(item.id,version);setFormData(normalizeProvenance(body.draft));setVersion(body.version);setDirty(false);setIssues([]);setMessage({type:'success',text:`Revisie ${item.version} als nieuw concept hersteld.`});}catch(error){setMessage({type:'error',text:error.message});}finally{setBusy(false);}}} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#4a1521] px-3 text-xs font-semibold uppercase tracking-[.08em] text-[#4a1521] disabled:opacity-40"><Eye size={15}/> Herstellen als concept</button></div>)}{revisions.filter(item=>item.kind==='publication').length===0&&<p className="py-3 text-sm text-[#62594f]">Nog geen nieuwe revisies geregistreerd.</p>}</div></section></div>}
    {activeTab==='methods' && <MediaRelationsEditor title="Onderzoeksmethoden" items={formData.methods} media={media} relationKey="methods" language={language} update={update}/>}
    {activeTab==='examples' && <MediaRelationsEditor title="Praktijkvoorbeelden" items={formData.examples} media={media} relationKey="examples" language={language} update={update}/>}
    {activeTab==='content' && <section className={cardClass}><h2 className="font-serif text-2xl text-[#211b16]">Homepage-teaser</h2><div className="mt-5 grid gap-4 md:grid-cols-2"><LocalizedField label="Titel" value={formData.homepageTeaser.title} language={language} onChange={value=>update(current=>({...current,homepageTeaser:{...current.homepageTeaser,title:value}}))}/><LocalizedField label="Knop" value={formData.homepageTeaser.buttonLabel} language={language} onChange={value=>update(current=>({...current,homepageTeaser:{...current.homepageTeaser,buttonLabel:value}}))}/><LocalizedField label="Beschrijving" value={formData.homepageTeaser.description} language={language} multiline onChange={value=>update(current=>({...current,homepageTeaser:{...current.homepageTeaser,description:value}}))}/><AssetSelect label="Teaser-afbeelding" value={formData.homepageTeaser.assetId} assets={formData.assets} media={media} onChange={id=>update(current=>({...current,homepageTeaser:{...current.homepageTeaser,assetId:id}}))}/></div><label className="mt-4 flex items-center gap-2 text-sm text-[#5f554c]"><input type="checkbox" checked={formData.homepageTeaser.enabled!==false} onChange={e=>update(current=>({...current,homepageTeaser:{...current.homepageTeaser,enabled:e.target.checked}}))}/> Zichtbaar op de homepage</label></section>}
    {activeTab==='content' && <ListEditor title="Dossieronderdelen" itemLabel="Onderdeel" items={formData.dossier.items} setItems={items=>update(current=>({...current,dossier:{...current.dossier,items:typeof items==='function'?items(current.dossier.items):items}}))} fields={[{key:'title',label:'Titel'},{key:'description',label:'Beschrijving',multiline:true}]} language={language}/>}
  </div>;
}
