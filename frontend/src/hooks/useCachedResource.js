import { useEffect, useState } from "react";
import { peek } from "../api/cache";

export function useCachedResource(key, loader, enabled = true) {
  const active = Boolean(enabled && key != null && key !== "");
  const [data, setData] = useState(() => (active ? peek(key) : undefined));
  const [loading, setLoading] = useState(
    () => active && peek(key) === undefined
  );
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!active) {
      setData(undefined);
      setLoading(false);
      return;
    }

    const hit = peek(key);
    if (hit !== undefined) {
      setData(hit);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    loader()
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // loader is keyed by `key`; callers close over the same id
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, active]);

  return { data, setData, loading, error };
}
