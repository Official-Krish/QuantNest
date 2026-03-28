import { apiPreviewWorkflowMetrics } from "@/http";
import type { WorkflowLivePreview, WorkflowPreviewRequest } from "@/types/api";
import { useEffect, useState } from "react";

export function useWorkflowLivePreview(
  request: WorkflowPreviewRequest | null,
  intervalMs = 15000,
) {
  const [preview, setPreview] = useState<WorkflowLivePreview | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!request) {
      setPreview(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchPreview = async () => {
      try {
        setLoading(true);
        const next = await apiPreviewWorkflowMetrics(request);
        if (!cancelled) {
          setPreview(next);
        }
      } catch {
        if (!cancelled) {
          setPreview(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchPreview();
    const interval = window.setInterval(() => {
      void fetchPreview();
    }, intervalMs);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [intervalMs, request ? JSON.stringify(request) : ""]);

  return {
    preview,
    loading,
  };
}
