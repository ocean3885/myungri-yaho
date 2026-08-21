'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ArchiveAutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh();
    }, 3000);

    return () => window.clearInterval(interval);
  }, [router]);

  return null;
}
