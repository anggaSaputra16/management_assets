"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Sites module removed — redirect to Locations
export default function SitesPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/locations');
  }, [router]);

  return null;
}
