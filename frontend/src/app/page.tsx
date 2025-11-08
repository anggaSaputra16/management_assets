'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'

export default function Home() {
  const router = useRouter()
  const { user, isHydrated } = useAuthStore()

  useEffect(() => {
    if (isHydrated) {
      if (user) {
        // User is logged in, redirect to dashboard
        router.push('/dashboard')
      } else {
        // User is not logged in, redirect to login
        router.push('/login')
      }
    }
  }, [user, isHydrated, router])

  // Show loading spinner while checking auth
  return (
    <div className="min-h-screen flex items-center justify-center bg-white/60">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black/10 mx-auto"></div>
        <p className="mt-4 text-[#333]">Loading Asset Management System...</p>
      </div>
    </div>
  )
}
