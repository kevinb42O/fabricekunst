import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Loader2 } from 'lucide-react';
import { getFeaturedItems, withFeaturedOrder } from '../../utils/featuredOrder.js';
import { isCatalogItemPublished } from '../../utils/catalogPublication.js';

export default function FeaturedOrderManager({ items, onSave, onShowToast }) {
  const [order, setOrder] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const featured = getFeaturedItems(items, { includeDrafts: true });
  const signature = JSON.stringify(featured.map((item) => [item.id, item.featuredOrder]));
  useEffect(() => { setOrder(null); setError(''); }, [signature]);
  const ordered = order
    ? order.map((id) => featured.find((item) => item.id === id)).filter(Boolean)
    : featured;

  const move = (index, direction) => {
    const ids = ordered.map((item) => item.id);
    [ids[index], ids[index + direction]] = [ids[index + direction], ids[index]];
    setOrder(ids);
    setError('');
  };
  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const result = await onSave(withFeaturedOrder(ordered));
      if (!result || result.success === false || result.error) throw new Error(result?.error || 'Opslaan mislukt. Probeer opnieuw.');
      setOrder(null);
      onShowToast?.('De volgorde van de topstukken is opgeslagen en gepubliceerd.');
    } catch (failure) {
      setError(failure.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section aria-labelledby="featured-order-title" className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 id="featured-order-title" className="text-lg font-semibold text-gray-900">Volgorde topstukken</h2>
          <p className="text-sm text-gray-600 mt-1">Zet de werken in de gewenste volgorde. Het eerste gepubliceerde werk staat vooraan op de website, ook op mobiel.</p>
        </div>
        <button type="button" onClick={save} disabled={!order || saving} className="min-h-11 shrink-0 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900">
          {saving ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />Opslaan…</span> : 'Volgorde opslaan'}
        </button>
      </div>
      {ordered.length === 0 ? <p className="text-sm text-gray-600">Markeer een object met het sterretje als topstuk om het hier te rangschikken.</p> : (
        <ol className="divide-y divide-gray-100">
          {ordered.map((item, index) => (
            <li key={item.id} className="flex items-center gap-3 py-2">
              <span className="w-6 shrink-0 text-sm text-gray-600 tabular-nums">{index + 1}.</span>
              <div className="min-w-0 flex-1"><p className="text-sm font-medium text-gray-900 break-words">{item.title}</p><p className="text-xs text-gray-600">{item.ref}{!isCatalogItemPublished(item) && ' · Concept — blijft offline'}</p></div>
              <div className="flex shrink-0 gap-1">
                <button type="button" aria-label={`${item.title} omhoog`} disabled={saving || index === 0} onClick={() => move(index, -1)} className="flex items-center justify-center w-11 h-11 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-gray-900"><ArrowUp className="w-4 h-4" aria-hidden="true" /></button>
                <button type="button" aria-label={`${item.title} omlaag`} disabled={saving || index === ordered.length - 1} onClick={() => move(index, 1)} className="flex items-center justify-center w-11 h-11 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-gray-900"><ArrowDown className="w-4 h-4" aria-hidden="true" /></button>
              </div>
            </li>
          ))}
        </ol>
      )}
      <div aria-live="polite" className="text-sm">{error ? <p role="alert" className="text-red-700">{error}</p> : order && <p className="text-gray-700">Er zijn wijzigingen. Sla de volgorde op om ze op de website toe te passen.</p>}</div>
    </section>
  );
}
