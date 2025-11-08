"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '../../../../components/layouts/DashboardLayout'
import InventoryForm from '@/components/InventoryForm'
import { useInventoryStore } from '../../../../stores'
import { toast } from '@/hooks/useToast'

export default function EditInventoryPage({ params }) {
  const { id } = params
  const router = useRouter()
  const { inventories, fetchInventories, updateInventory } = useInventoryStore()

  useEffect(() => {
    if (!inventories || inventories.length === 0) fetchInventories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const inv = inventories ? inventories.find((i) => i.id === id) : null

  const handleUpdate = async (data) => {
    try {
      await updateInventory(id, {
        custodianId: data.custodianId || undefined,
        quantity: Number(data.quantity || 0),
        availableQty: Number(data.availableQty || 0),
        condition: data.condition,
        status: data.status,
        location: data.location,
        notes: data.notes,
        minStockLevel: Number(data.minStockLevel || 0)
      })
      toast.success('Inventory updated')
      router.push(`/inventory/${id}`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to update inventory')
    }
  }

  return (
    <DashboardLayout>
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold mb-4">Edit Inventory</h2>
        <InventoryForm
          initialData={inv}
          onSubmit={handleUpdate}
          submitLabel="Save"
        />
      </div>
    </DashboardLayout>
  )
}
