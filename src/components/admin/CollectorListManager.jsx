import React, { useEffect, useMemo, useState } from 'react';
import { Download, Loader2, MailCheck, RefreshCw, Search } from 'lucide-react';
import { authenticatedAdminFetch } from '../../utils/adminApi';

const STATUS_LABELS = { active: 'Actief', pending: 'Te bevestigen', unsubscribed: 'Uitgeschreven' };

const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

export default function CollectorListManager({ onShowToast = () => {} }) {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const response = await authenticatedAdminFetch('/api/collector-list?admin=1');
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Laden mislukt.');
      setSubscribers(result.subscribers || []);
    } catch (error) {
      onShowToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => subscribers.filter((subscriber) => {
    if (statusFilter !== 'all' && subscriber.status !== statusFilter) return false;
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return [subscriber.email, subscriber.locale, subscriber.source, subscriber.source_path]
      .some((value) => String(value || '').toLowerCase().includes(needle));
  }), [query, statusFilter, subscribers]);

  const counts = useMemo(() => ({
    active: subscribers.filter((item) => item.status === 'active').length,
    pending: subscribers.filter((item) => item.status === 'pending').length,
    unsubscribed: subscribers.filter((item) => item.status === 'unsubscribed').length
  }), [subscribers]);

  const updateStatus = async (subscriber, status) => {
    setUpdatingId(subscriber.id);
    try {
      const response = await authenticatedAdminFetch('/api/collector-list?admin=1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: subscriber.id, status })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Bijwerken mislukt.');
      setSubscribers((items) => items.map((item) => item.id === subscriber.id ? { ...item, status, updated_at: new Date().toISOString() } : item));
      onShowToast('Inschrijfstatus bijgewerkt.');
    } catch (error) {
      onShowToast(error.message, 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const exportActive = () => {
    const active = subscribers.filter((item) => item.status === 'active');
    const rows = [
      ['email', 'language', 'source', 'consented_at', 'confirmed_at'],
      ...active.map((item) => [item.email, item.locale, item.source, item.consented_at, item.confirmed_at])
    ];
    const csv = rows.map((row) => row.map(csvCell).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `atelier-rembrandt-collectors-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="space-y-6" aria-labelledby="collector-admin-title">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8E7035]">Direct marketing met toestemming</p>
          <h1 id="collector-admin-title" className="mt-2 text-3xl font-bold text-[#111111]">Collector’s List</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">Beheer bevestigde inschrijvingen, toestemmingsstatus en herkomst. Exporteer uitsluitend actieve adressen.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={load} disabled={loading} className="admin-button admin-button--secondary inline-flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Vernieuwen
          </button>
          <button type="button" onClick={exportActive} disabled={!counts.active} className="admin-button admin-button--primary inline-flex items-center gap-2">
            <Download className="h-4 w-4" /> Exporteer actieve leden
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ['Actief', counts.active, 'text-emerald-700'],
          ['Te bevestigen', counts.pending, 'text-amber-700'],
          ['Uitgeschreven', counts.unsubscribed, 'text-gray-600']
        ].map(([label, count, tone]) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</span>
            <strong className={`mt-2 block text-3xl ${tone}`}>{count}</strong>
          </div>
        ))}
      </div>

      <div className="grid gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_220px]">
        <label className="relative block">
          <span className="sr-only">Zoeken in Collector’s List</span>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Zoek op e-mail, taal of bron…" className="min-h-11 w-full rounded-lg border border-gray-300 pl-10 pr-3 text-sm focus:border-[#8E7035] focus:outline-none focus:ring-2 focus:ring-[#8E7035]/20" />
        </label>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="min-h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-[#8E7035] focus:outline-none focus:ring-2 focus:ring-[#8E7035]/20">
          <option value="all">Alle statussen</option>
          <option value="active">Actief</option>
          <option value="pending">Te bevestigen</option>
          <option value="unsubscribed">Uitgeschreven</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-52 items-center justify-center gap-3 text-sm text-gray-500"><Loader2 className="h-5 w-5 animate-spin" /> Inschrijvingen laden…</div>
        ) : filtered.length === 0 ? (
          <div className="flex min-h-52 flex-col items-center justify-center text-center text-gray-500"><MailCheck className="mb-3 h-8 w-8 text-[#8E7035]" /><p className="text-sm">Geen inschrijvingen gevonden.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500"><tr><th className="px-5 py-3">E-mail</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Taal / bron</th><th className="px-4 py-3">Toestemming</th><th className="px-5 py-3 text-right">Beheer</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((subscriber) => (
                  <tr key={subscriber.id} className="align-top hover:bg-gray-50/70">
                    <td className="px-5 py-4"><a href={`mailto:${subscriber.email}`} className="font-semibold text-[#111111] hover:text-[#8E7035]">{subscriber.email}</a><small className="mt-1 block text-gray-500">{subscriber.source_path}</small></td>
                    <td className="px-4 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${subscriber.status === 'active' ? 'bg-emerald-50 text-emerald-700' : subscriber.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>{STATUS_LABELS[subscriber.status]}</span></td>
                    <td className="px-4 py-4"><strong className="uppercase">{subscriber.locale}</strong><small className="mt-1 block text-gray-500">{subscriber.source}</small></td>
                    <td className="px-4 py-4 text-gray-700">{new Date(subscriber.consented_at).toLocaleString('nl-BE')}<small className="mt-1 block text-gray-500">{subscriber.consent_version}</small></td>
                    <td className="px-5 py-4 text-right">
                      <select disabled={updatingId === subscriber.id} value={subscriber.status} onChange={(event) => updateStatus(subscriber, event.target.value)} aria-label={`Status van ${subscriber.email}`} className="min-h-9 rounded-lg border border-gray-300 bg-white px-2 text-xs focus:border-[#8E7035] focus:outline-none">
                        <option value="active">Actief</option><option value="pending">Te bevestigen</option><option value="unsubscribed">Uitgeschreven</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
