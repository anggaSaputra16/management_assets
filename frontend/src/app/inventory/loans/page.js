"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoansRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirect legacy inventory loans route to new loans/manage page
    router.replace('/loans/manage')
  }, [router])

  return null
}
