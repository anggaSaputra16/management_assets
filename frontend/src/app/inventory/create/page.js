"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '../../../components/layouts/DashboardLayout'
import { useAssetStore, useDepartmentStore, useUserStore, useInventoryStore } from '../../../stores'
import { toast } from '@/hooks/useToast'

export default function CreateInventoryPage() {
  const router = useRouter()
  const { assets, fetchAssets } = useAssetStore()
  const { departments, fetchDepartments } = useDepartmentStore()
  const { users, fetchUsers } = useUserStore()
  const { createInventory } = useInventoryStore()

  const [form, setForm] = useState({
    assetId: '',
    departmentId: '',
    custodianId: '',
    quantity: 1,
    condition: 'GOOD',
    location: '',
    notes: '',
    minStockLevel: 0
  })

  useEffect(() => {
    fetchAssets()
    fetchDepartments()
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((s) => ({ ...s, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await createInventory({
        assetId: form.assetId,
        departmentId: form.departmentId,
        custodianId: form.custodianId || undefined,
        quantity: Number(form.quantity || 1),
        condition: form.condition,
        location: form.location,
        notes: form.notes,
        minStockLevel: Number(form.minStockLevel || 0)
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Asset</label>
            <select name="assetId" value={form.assetId} onChange={handleChange} required className="mt-1 block w-full border rounded-md p-2">
              <option value="">Select asset</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>{a.name} — {a.assetTag}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Department</label>
            <select name="departmentId" value={form.departmentId} onChange={handleChange} required className="mt-1 block w-full border rounded-md p-2">
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Custodian (optional)</label>
            <select name="custodianId" value={form.custodianId} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2">
              <option value="">Select custodian</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Quantity</label>
              <input name="quantity" type="number" min="1" value={form.quantity} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Min Stock Level</label>
              <input name="minStockLevel" type="number" min="0" value={form.minStockLevel} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Condition</label>
            <select name="condition" value={form.condition} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2">
              <option value="GOOD">Good</option>
              <option value="FAIR">Fair</option>
              <option value="POOR">Poor</option>
              <option value="DAMAGED">Damaged</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Location</label>
            <input name="location" value={form.location} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" />
          </div>

          <div className="flex space-x-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Create</button>
            <button type="button" onClick={() => router.push('/inventory')} className="bg-gray-200 px-4 py-2 rounded">Cancel</button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
