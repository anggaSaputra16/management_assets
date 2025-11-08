'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { sparePartService } from '@/lib/services/sparePartService'

export default function SparePartDetailPage({ params }) {
  const router = useRouter()
  const [sparePart, setSparePart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const id = params?.id
    if (!id) return
    const fetch = async () => {
      setLoading(true)
      try {
        const res = await sparePartService.getSparePartById(id)
        setSparePart(res.data)
      } catch (err) {
        console.error('Failed to load spare part:', err)
        setError(err?.message || 'Failed to load spare part')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [params])

  if (loading) {
    return (
      <DashboardLayout title="Spare Part Details">
        <div className="p-6">Loading...</div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout title="Spare Part Details">
        <div className="p-6 text-[#111]">{error}</div>
        <button onClick={() => router.push('/master/spare-parts')} className="mt-4 underline">Back to list</button>
      </DashboardLayout>
    )
  }

  if (!sparePart) {
    return (
      <DashboardLayout title="Spare Part Details">
        <div className="p-6">Spare part not found</div>
        <button onClick={() => router.push('/master/spare-parts')} className="mt-4 underline">Back to list</button>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title={`Spare Part: ${sparePart.partNumber || sparePart.name}`}>
      <div className="space-y-6">
        <div className="bg-white p-6 rounded shadow">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold">{sparePart.name}</h2>
              <p className="text-sm text-[#333]">Part Number: {sparePart.partNumber}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-[#333]">Stock: <span className="font-medium">{sparePart.stockLevel}</span></div>
            </div>
          </div>

          {sparePart.notes && (
            <div className="mt-4 text-sm text-[#111]">
              <strong>Notes:</strong>
              <div className="whitespace-pre-wrap mt-1">{sparePart.notes}</div>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded shadow">
          <h3 className="text-lg font-medium mb-3">Decomposed Items / Linked Components</h3>
          {Array.isArray(sparePart.sourceComponents) && sparePart.sourceComponents.length > 0 ? (
            <table className="w-full text-sm table-auto">
              <thead>
                <tr className="text-left text-xs text-[#333]">
                  <th className="pb-2">Component Name</th>
                  <th className="pb-2">Asset</th>
                  <th className="pb-2">Created At</th>
                </tr>
              </thead>
              <tbody>
                {sparePart.sourceComponents.map((comp) => (
                  <tr key={comp.id} className="border-t">
                    <td className="py-2">{comp.name}</td>
                    <td className="py-2">{comp.asset ? `${comp.asset.name} (${comp.asset.assetTag})` : '—'}</td>
                    <td className="py-2">{new Date(comp.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-[#333]">No decomposed items linked to this spare part.</p>
          )}
        </div>

        <div className="flex space-x-2">
          <button onClick={() => router.push('/master/spare-parts')} className="px-4 py-2 bg-gray-100 rounded">Back</button>
        </div>
      </div>
    </DashboardLayout>
  )
}
