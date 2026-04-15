import { useState, useEffect, useCallback } from "react";

interface UseDataOptions {
  fetchOnMount?: boolean;
  pollingInterval?: number;
}

interface UseDataReturn<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  create: (data: Partial<T>) => Promise<T | null>;
  update: (id: string, data: Partial<T>) => Promise<T | null>;
  remove: (id: string) => Promise<boolean>;
  batchUpload: (rows: Partial<T>[]) => Promise<{ success: number; failed: number }>;
}

export function useData<T extends { id: string }>(
  endpoint: string,
  options: UseDataOptions = {}
): UseDataReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { fetchOnMount = true } = options;

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(endpoint, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    if (fetchOnMount) {
      refetch();
    }
  }, [fetchOnMount, refetch]);

  const create = useCallback(
    async (rowData: Partial<T>): Promise<T | null> => {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rowData),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Create failed");
        }
        const created = await res.json();
        setData((prev) => [created, ...prev]);
        return created;
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)));
        return null;
      }
    },
    [endpoint]
  );

  const update = useCallback(
    async (id: string, rowData: Partial<T>): Promise<T | null> => {
      try {
        const res = await fetch(`${endpoint}/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rowData),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Update failed");
        }
        const updated = await res.json();
        setData((prev) => prev.map((item) => (item.id === id ? updated : item)));
        return updated;
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)));
        return null;
      }
    },
    [endpoint]
  );

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const res = await fetch(`${endpoint}/${id}`, { method: "DELETE" });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Delete failed");
        }
        setData((prev) => prev.filter((item) => item.id !== id));
        return true;
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)));
        return false;
      }
    },
    [endpoint]
  );

  const batchUpload = useCallback(
    async (rows: Partial<T>[]): Promise<{ success: number; failed: number }> => {
      try {
        const res = await fetch(`${endpoint}/batch`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Batch upload failed");
        }
        const result = await res.json();
        await refetch();
        return result;
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)));
        return { success: 0, failed: rows.length };
      }
    },
    [endpoint, refetch]
  );

  return { data, loading, error, refetch, create, update, remove, batchUpload };
}