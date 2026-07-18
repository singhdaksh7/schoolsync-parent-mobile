import { useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { JobPoller } from '@/lib/job-poller';
import type { JobStatusResponse } from '@/lib/types';

/**
 * React wrapper for JobPoller: pauses while the app is backgrounded, resumes
 * (with an immediate refetch, not a stale wait) on foreground, and stops
 * automatically on a terminal status. `fetchStatus` is undefined when no
 * live status route exists for this job yet (see Report Cards screen) — the
 * hook simply does nothing in that case rather than polling a broken URL.
 */
export function useJobPoller(fetchStatus: (() => Promise<JobStatusResponse>) | null) {
  const [result, setResult] = useState<JobStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollerRef = useRef<JobPoller | null>(null);

  useEffect(() => {
    if (!fetchStatus) return;
    const poller = new JobPoller({
      fetchStatus,
      onUpdate: (r) => {
        setResult(r);
        setError(null);
      },
      onError: (e) => setError(e instanceof Error ? e.message : 'Failed to check job status.'),
    });
    pollerRef.current = poller;
    poller.start();

    const subscription = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') poller.resume();
      else poller.pause();
    });

    return () => {
      poller.stop();
      subscription.remove();
      pollerRef.current = null;
    };
  }, [fetchStatus]);

  return { result, error, isTerminal: pollerRef.current?.isTerminal ?? false };
}
