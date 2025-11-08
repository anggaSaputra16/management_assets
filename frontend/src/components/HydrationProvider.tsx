'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'

export default function HydrationProvider({ children }) {
  const { setHydrated, isHydrated } = useAuthStore()

  useEffect(() => {
    // Trigger hydration
    setHydrated()
  }, [setHydrated])

  // Show loading until hydrated
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
          <p className="text-[#333]">Loading application...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}