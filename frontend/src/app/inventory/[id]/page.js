"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '../../../components/layouts/DashboardLayout'
import { useInventoryStore } from '../../../stores'

export default function InventoryDetailPage({ params }) {
  const { id } = params
  const router = useRouter()
  const { inventories, fetchInventories } = useInventoryStore()

  useEffect(() => {
    if (!inventories || inventories.length === 0) fetchInventories()
  }, [])

  const inventory = inventories.find((i) => i.id === id)

  if (!inventory) {
    return (
      <DashboardLayout>
        <div className="glass-card p-6">
          <p>Inventory not found.</p>
          <button onClick={() => router.push('/inventory')} className="mt-3 bg-gray-200 px-3 py-1 rounded">Back</button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold">{inventory.inventoryTag}</h2>
        <p className="text-sm text-gray-600">Asset: {inventory.asset?.name} ({inventory.asset?.assetTag})</p>
        <p className="mt-2">Location: {inventory.location}</p>
        <p>Department: {inventory.department?.name}</p>
        <p>Quantity: {inventory.availableQty} / {inventory.quantity}</p>
        <p>Status: {inventory.status}</p>
        <p>Condition: {inventory.condition}</p>
        <div className="mt-4">
          <button onClick={() => router.push(`/inventory/${id}/edit`)} className="bg-yellow-500 text-white px-3 py-1 rounded mr-2">Edit</button>
          <button onClick={() => router.push('/inventory')} className="bg-gray-200 px-3 py-1 rounded">Back to list</button>
        </div>
      </div>
    </DashboardLayout>
  )
}
