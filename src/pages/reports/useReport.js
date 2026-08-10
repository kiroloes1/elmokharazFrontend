import { useCallback, useEffect, useState } from 'react';
import { fetchReport } from './reportApi';

/**
 * Manages filters + fetch lifecycle for a single /api/reports/:endpoint view.
 * Refetches whenever the filters object changes (including page changes).
 */
export function useReport(endpoint, initialFilters = {}) {
  const [filters, setFilters] = useState(initialFilters);
  const [data, setData] = useState({ summary: null, detail: [], pagination: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchReport(endpoint, filters);
      setData(result);
    } catch (err) {
      setError(err.message || 'حدث خطأ غير متوقع أثناء تحميل التقرير');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, JSON.stringify(filters)]);

  useEffect(() => {
    load();
  }, [load]);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: key === 'page' ? value : 1 }));
  };

  const resetFilters = () => setFilters(initialFilters);

  return { filters, updateFilter, resetFilters, data, loading, error, reload: load };
}
