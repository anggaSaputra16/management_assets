"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoansRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/loans/manage')
  }, [router])

  return null
}
