"use client";
import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api/client";
export function useResource<T>(
  fetchItems: (signal?: AbortSignal) => Promise<T[]>,
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unauthorized, setUnauthorized] = useState(false);
  const [revision, setRevision] = useState(0);
  const handleError = useCallback((cause: unknown) => {
    if (cause instanceof ApiError && cause.status === 401) {
      setItems([]);
      setUnauthorized(true);
    }
    setError(
      cause instanceof Error
        ? cause.message
        : "Something went wrong. Please try again.",
    );
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    fetchItems(controller.signal)
      .then((data) => {
        setItems(data);
        setError("");
        setUnauthorized(false);
      })
      .catch((cause) => {
        if (!controller.signal.aborted) handleError(cause);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [fetchItems, revision, handleError]);
  const refresh = () => {
    setLoading(true);
    setError("");
    setRevision((value) => value + 1);
  };
  return {
    items,
    setItems,
    loading,
    error,
    setError,
    unauthorized,
    handleError,
    refresh,
  };
}
