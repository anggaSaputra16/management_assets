'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AdminDashboard() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to main dashboard - admin features are integrated there
    router.replace('/dashboard')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-medium text-gray-900">Redirecting...</h2>
        <p className="text-gray-600 mt-2">Taking you to the admin dashboard</p>
      </div>
    </div>
  )
}