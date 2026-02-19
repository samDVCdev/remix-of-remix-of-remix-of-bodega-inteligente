const CACHE_KEY = "kiosko_query_cache";

export function persistQueryCache(queryClient: any) {
  const interval = setInterval(() => {
    try {
      const cache = queryClient.getQueryCache().getAll();
      const serializable = cache
        .filter((q: any) => q.state.data !== undefined)
        .map((q: any) => ({
          queryKey: q.queryKey,
          data: q.state.data,
          dataUpdatedAt: q.state.dataUpdatedAt,
        }));
      localStorage.setItem(CACHE_KEY, JSON.stringify(serializable));
    } catch {
      // Silently fail if storage is full
    }
  }, 10000);

  return () => clearInterval(interval);
}

export function restoreQueryCache(queryClient: any) {
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (!stored) return;
    const entries = JSON.parse(stored);
    for (const entry of entries) {
      queryClient.setQueryData(entry.queryKey, entry.data, {
        updatedAt: entry.dataUpdatedAt,
      });
    }
  } catch {
    // Silently fail
  }
}
