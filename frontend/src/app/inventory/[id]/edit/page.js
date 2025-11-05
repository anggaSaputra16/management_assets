"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '../../../../components/layouts/DashboardLayout'
import { useInventoryStore, useDepartmentStore, useUserStore } from '../../../../stores'
import { toast } from '@/hooks/useToast'

export default function EditInventoryPage({ params }) {
  const { id } = params
  const router = useRouter()
  const { inventories, fetchInventories, updateInventory } = useInventoryStore()
  const { fetchDepartments } = useDepartmentStore()
  const { users, fetchUsers } = useUserStore()

  const [form, setForm] = useState({ custodianId: '', quantity: 0, availableQty: 0, condition: 'GOOD', status: 'AVAILABLE', location: '', notes: '', minStockLevel: 0 })

  useEffect(() => {
    if (!inventories || inventories.length === 0) fetchInventories()
    fetchDepartments()
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const inv = inventories.find((i) => i.id === id)
    if (inv) {
      setForm({
        custodianId: inv.custodian?.id || '',
        quantity: inv.quantity || 0,
        availableQty: inv.availableQty || 0,
        condition: inv.condition || 'GOOD',
        status: inv.status || 'AVAILABLE',
        location: inv.location || '',
        notes: inv.notes || '',
        minStockLevel: inv.minStockLevel || 0
      })
    }
  }, [inventories, id])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((s) => ({ ...s, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await updateInventory(id, {
        custodianId: form.custodianId || undefined,
        quantity: Number(form.quantity),
        availableQty: Number(form.availableQty),
        condition: form.condition,
        status: form.status,
        location: form.location,
        notes: form.notes,
        minStockLevel: Number(form.minStockLevel || 0)
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Custodian</label>
            <select name="custodianId" value={form.custodianId} onChange={handleChange} className="mt-1 block w-full border rounded p-2">
              <option value="">None</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Quantity</label>
              <input name="quantity" type="number" min="0" value={form.quantity} onChange={handleChange} className="mt-1 block w-full border rounded p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Available Qty</label>
              <input name="availableQty" type="number" min="0" value={form.availableQty} onChange={handleChange} className="mt-1 block w-full border rounded p-2" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Status</label>
            <select name="status" value={form.status} onChange={handleChange} className="mt-1 block w-full border rounded p-2">
              <option value="AVAILABLE">AVAILABLE</option>
              <option value="LOANED">LOANED</option>
              <option value="MAINTENANCE">MAINTENANCE</option>
              <option value="RETIRED">RETIRED</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Condition</label>
            <select name="condition" value={form.condition} onChange={handleChange} className="mt-1 block w-full border rounded p-2">
              <option value="GOOD">GOOD</option>
              <option value="FAIR">FAIR</option>
              <option value="POOR">POOR</option>
              <option value="DAMAGED">DAMAGED</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Location</label>
            <input name="location" value={form.location} onChange={handleChange} className="mt-1 block w-full border rounded p-2" />
          </div>

          <div>
            <label className="block text-sm font-medium">Notes</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} className="mt-1 block w-full border rounded p-2" />
          </div>

          <div className="flex space-x-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
            <button type="button" onClick={() => router.push(`/inventory/${id}`)} className="bg-gray-200 px-4 py-2 rounded">Cancel</button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
