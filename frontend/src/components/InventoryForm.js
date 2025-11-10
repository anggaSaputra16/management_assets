"use client"

import { useEffect, useState } from 'react'
import Select from 'react-select'
import { useDepartmentStore, useUserStore, useLocationStore } from '../stores'
import { inventoryService } from '../lib/services/inventoryService'

export default function InventoryForm({ initialData = {}, onSubmit, submitLabel = 'Save', showAssetSelector = false }) {
  const { departments, fetchDepartments } = useDepartmentStore()
  const { users, fetchUsers } = useUserStore()
  const { locations, fetchLocations } = useLocationStore()

  const [form, setForm] = useState({
    assetId: initialData.assetId || '',
    departmentId: initialData.departmentId || '',
    custodianId: initialData.custodianId || '',
    quantity: initialData.quantity || 1,
    condition: initialData.condition || 'GOOD',
    location: initialData.location || '',
    notes: initialData.notes || '',
    minStockLevel: initialData.minStockLevel || 0,
    availableAssets: []
  })

  const [loadingAssets, setLoadingAssets] = useState(false)

  useEffect(() => {
    fetchDepartments()
    fetchUsers()
    fetchLocations()
  }, [fetchDepartments, fetchUsers, fetchLocations])

  useEffect(() => {
    const loadAvailable = async () => {
      if (!showAssetSelector) return
      if (!form.departmentId) {
        setForm(f => ({ ...f, availableAssets: [] }))
        return
      }
      try {
        setLoadingAssets(true)
        const assets = await inventoryService.getAvailableAssets(form.departmentId)
        setForm(f => ({ ...f, availableAssets: assets }))
      } catch (err) {
        console.error('Failed to load available assets', err)
      } finally {
        setLoadingAssets(false)
      }
    }
    loadAvailable()
  }, [form.departmentId, showAssetSelector])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((s) => ({ ...s, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {showAssetSelector && (
        <div>
          <label className="block text-sm font-medium">Asset</label>
          <Select
            name="assetId"
            value={form.assetId ? { value: form.assetId, label: form.availableAssets.find(a => a.id === form.assetId)?.label || form.assetId } : null}
            onChange={(sel) => setForm(prev => ({ ...prev, assetId: sel ? sel.value : '' }))}
            options={(form.availableAssets || []).map(a => ({ value: a.id, label: `${a.name} — ${a.assetTag} ${a.category ? `(${a.category.name})` : ''}`, isDisabled: a.isAlreadyAllocated }))}
            isSearchable
            isClearable
            isLoading={loadingAssets}
            placeholder={!form.departmentId ? 'Select department first' : 'Search and select asset...'}
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium">Department</label>
        <Select
          name="departmentId"
          value={form.departmentId ? { value: form.departmentId, label: departments.find(d => d.id === form.departmentId)?.name || form.departmentId } : null}
          onChange={(sel) => setForm(prev => ({ ...prev, departmentId: sel ? sel.value : '', assetId: '' }))}
          options={departments.map(d => ({ value: d.id, label: `${d.name} (${d.code || 'N/A'})` }))}
          isSearchable
          isClearable
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Custodian</label>
        <Select
          name="custodianId"
          value={form.custodianId ? { value: form.custodianId, label: users.find(u => u.id === form.custodianId) ? `${users.find(u=>u.id===form.custodianId).firstName} ${users.find(u=>u.id===form.custodianId).lastName}` : form.custodianId } : null}
          onChange={(sel) => setForm(prev => ({ ...prev, custodianId: sel ? sel.value : '' }))}
          options={[{ value: '', label: 'No custodian' }, ...users.map(u => ({ value: u.id, label: `${u.firstName} ${u.lastName}` }))]}
          isClearable
          isSearchable
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Quantity</label>
          <input name="quantity" type="number" min="1" value={form.quantity} onChange={handleChange} className="mt-1 block w-full border rounded p-2" />
        </div>

        <div>
          <label className="block text-sm font-medium">Min Stock Level</label>
          <input name="minStockLevel" type="number" min="0" value={form.minStockLevel} onChange={handleChange} className="mt-1 block w-full border rounded p-2" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Condition</label>
        <select name="condition" value={form.condition} onChange={handleChange} className="mt-1 block w-full border rounded p-2">
          <option value="GOOD">Good</option>
          <option value="FAIR">Fair</option>
          <option value="POOR">Poor</option>
          <option value="DAMAGED">Damaged</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">Location</label>
        <Select
          name="location"
          value={form.location ? { value: form.location, label: form.location } : null}
          onChange={(sel) => setForm(prev => ({ ...prev, location: sel ? sel.value : '' }))}
          options={(locations || []).map(l => ({ value: l.name, label: l.name }))}
          isSearchable
          isClearable
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Notes</label>
        <textarea name="notes" value={form.notes} onChange={handleChange} className="mt-1 block w-full border rounded p-2" />
      </div>

      <div className="flex space-x-2">
        <button type="submit" className="glass-button px-4 py-2 rounded text-[#111] font-medium hover:scale-105 transition-transform">{submitLabel}</button>
        <button type="button" onClick={() => window.history.back()} className="glass-button px-4 py-2 rounded text-[#111] font-medium hover:scale-105 transition-transform">Cancel</button>
      </div>
    </form>
  )
}
