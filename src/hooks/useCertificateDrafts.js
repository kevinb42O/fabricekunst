import { useEffect, useRef, useState } from 'react';
import { certificateDraftKey, createCertificateDraft } from '../utils/certificateDrafts.js';
import { loadCertificateDraft, saveCertificateDraft } from '../utils/certificateStorage.js';

export default function useCertificateDrafts(item, language, { load = loadCertificateDraft, save = saveCertificateDraft } = {}) {
  const [records, setRecords] = useState({});
  const recordsRef = useRef({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [retry, setRetry] = useState(0);
  const key = item ? certificateDraftKey(item.id, language) : '';
  const replaceRecord = (recordKey, entry) => {
    recordsRef.current = { ...recordsRef.current, [recordKey]: entry };
    setRecords(recordsRef.current);
  };
  useEffect(() => {
    if (!item || recordsRef.current[key]) return;
    let active = true;
    setErrors(current => ({ ...current, [key]: '' }));
    load(item.id, language).then(result => {
      if (!active) return;
      const draft = result.draft || createCertificateDraft(item, language);
      replaceRecord(key, { itemId: item.id, language, draft, version: result.version, saved: JSON.stringify(draft) });
    }).catch(error => {
      if (active) setErrors(current => ({ ...current, [key]: error.message }));
    });
    return () => { active = false; };
  }, [key, item, language, retry]);

  const dirtyEntries = Object.entries(records).filter(([, entry]) => JSON.stringify(entry.draft) !== entry.saved);
  const dirty = dirtyEntries.length > 0;
  useEffect(() => {
    if (!dirty) return;
    const warn = event => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const updateField = (field, value) => {
    const entry = recordsRef.current[key];
    if (!entry || savingRef.current) return;
    replaceRecord(key, { ...entry, draft: { ...entry.draft, [field]: value } });
  };
  const saveAll = async () => {
    if (savingRef.current || !recordsRef.current[key]) return false;
    savingRef.current = true;
    setSaving(true);
    try {
      // Also save edits in languages/objects that the user has switched away
      // from. Successful entries remain saved if a later entry fails.
      for (const [recordKey, entry] of Object.entries(recordsRef.current)) {
        if (JSON.stringify(entry.draft) === entry.saved) continue;
        try {
          const result = await save(entry.itemId, entry.language, entry.draft, entry.version);
          replaceRecord(recordKey, { ...entry, draft: result.draft, version: result.version, saved: JSON.stringify(result.draft) });
          setErrors(current => ({ ...current, [recordKey]: '' }));
        } catch (error) {
          setErrors(current => ({ ...current, [recordKey]: error.message }));
          throw error;
        }
      }
      return true;
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };
  const errorKey = errors[key] ? key : Object.keys(errors).find(recordKey => errors[recordKey] && records[recordKey]);
  const reload = () => {
    if (savingRef.current) return;
    const recordKey = errorKey || key;
    const entry = recordsRef.current[recordKey];
    if (entry && JSON.stringify(entry.draft) !== entry.saved
      && !window.confirm(`Uw niet-opgeslagen invoer voor ${entry.language.toUpperCase()} vervangen door de opgeslagen versie?`)) return;
    const next = { ...recordsRef.current };
    delete next[recordKey];
    recordsRef.current = next;
    setRecords(next);
    setErrors(current => ({ ...current, [recordKey]: '' }));
    setRetry(value => value + 1);
  };
  return {
    draft: records[key]?.draft || createCertificateDraft(item, language),
    loading: Boolean(item && !records[key] && !errors[key]),
    ready: Boolean(records[key]), saving, dirty,
    error: errors[key] || Object.entries(errors).filter(([recordKey, error]) => error && records[recordKey])
      .map(([recordKey, error]) => `${records[recordKey].language.toUpperCase()}: ${error}`).join(' ') || '',
    updateField, saveAll, reload,
  };
}
