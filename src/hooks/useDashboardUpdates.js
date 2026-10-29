import { useCallback, useEffect, useRef, useState } from 'react';
import { readViewedUpdates, saveViewedUpdates } from '../utils/dashboardUpdates.js';

// Import authentication only for the live loader; tests can supply isolated IO.
const loadDashboardUpdates = async () => {
  const { authenticatedAdminFetch } = await import('../utils/adminApi.js');
  const response = await authenticatedAdminFetch('/api/publish-public-content?resource=dashboard-updates');
  if (!response.ok) throw new Error('Updates unavailable');
  const data = await response.json();
  if (!Array.isArray(data.updates)) throw new Error('Invalid updates response');
  return data.updates;
};

export default function useDashboardUpdates(load = loadDashboardUpdates) {
  const [updates, setUpdates] = useState([]);
  const [viewed, setViewed] = useState(readViewedUpdates);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const generation = useRef(0);
  const reload = useCallback(async () => {
    const request = ++generation.current;
    setLoading(true);
    setError(false);
    try {
      const result = await load();
      if (request === generation.current) setUpdates(result);
    } catch {
      if (request === generation.current) setError(true);
    } finally {
      if (request === generation.current) setLoading(false);
    }
  }, [load]);
  useEffect(() => {
    void reload();
    return () => { ++generation.current; };
  }, [reload]);
  const markViewed = useCallback(ids => {
    const saved = saveViewedUpdates(ids);
    setViewed(current => saved.every(id => current.includes(id)) ? current : [...new Set([...current, ...saved])]);
  }, []);
  return { updates, viewed, loading, error, reload, markViewed };
}
