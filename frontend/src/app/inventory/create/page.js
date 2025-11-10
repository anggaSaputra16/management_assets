"use client"

import { useRouter } from 'next/navigation'
import DashboardLayout from '../../../components/layouts/DashboardLayout'
import InventoryForm from '@/components/InventoryForm'
import { useInventoryStore } from '../../../stores'
import { toast } from '@/hooks/useToast'

export default function CreateInventoryPage() {
  const router = useRouter()
  const { createInventory } = useInventoryStore()

  const handleCreate = async (data) => {
    try {
      await createInventory({
        assetId: data.assetId,
        departmentId: data.departmentId,
        custodianId: data.custodianId || undefined,
        quantity: Number(data.quantity || 1),
        condition: data.condition,
        location: data.location,
        notes: data.notes,
        minStockLevel: Number(data.minStockLevel || 0)
      })
      toast.success('Inventory created successfully')
      router.push('/inventory')
    } catch (err) {
      console.error(err)
      toast.error('Failed to create inventory')
    }
  }

  return (
    <DashboardLayout>
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold mb-4">Create Inventory</h2>
        <InventoryForm onSubmit={handleCreate} submitLabel="Create" showAssetSelector={true} />
      </div>
    </DashboardLayout>
  )
}
