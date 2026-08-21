import { useCallback, useState } from 'react';
import { searchPublicProperties } from '../lib/services/buyerSearchService';
import type { PropertyListing, PropertySearchParams } from '../types/domain';

export function usePropertySearch() {
  const [results, setResults] = useState<PropertyListing[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastParams, setLastParams] = useState<PropertySearchParams>({});

  const search = useCallback(async (params: PropertySearchParams) => {
    setLoading(true);
    setError(null);
    setLastParams(params);
    try {
      const data = await searchPublicProperties(params);
      setResults(data);
    } catch {
      setError('שגיאה בחיפוש נכסים');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, loading, error, search, lastParams };
}
