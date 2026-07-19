'use client';

// Soft "live" feel via periodic revalidation — this app has no websocket/SSE
// backend, so "live" means polling, not a real push feed. Labeled as
// "Auto-refreshing" in the UI rather than "Live" to keep that honest.

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function AutoRefresh({ intervalMs = 15000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);
  return null;
}
