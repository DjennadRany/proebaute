import { useState, useEffect, useCallback, useRef } from 'react';

interface UseFetchDataResult<T> {
  data: T;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook générique qui encapsule le pattern répété dans le projet :
 *   useEffect + cancelled flag + loading + error + try/catch
 *
 * Usage :
 *   const { data, loading, error, refetch } = useFetchData(
 *     () => fetchServices(),
 *     [],           // dépendances (comme useEffect)
 *     []            // valeur initiale
 *   );
 */
export function useFetchData<T>(
  fetcher: () => Promise<T>,
  deps: React.DependencyList,
  initialValue: T,
): UseFetchDataResult<T> {
  const [data, setData] = useState<T>(initialValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  // Stable ref pour le fetcher (évite les re-renders inutiles)
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetcherRef.current()
      .then((result) => {
        if (cancelled) return;
        setData(result);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Une erreur est survenue';
        setError(msg);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  return { data, loading, error, refetch };
}
