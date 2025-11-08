'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSparePartsStore } from '@/stores/sparePartsStore'
import { useVendorStore } from '@/stores/vendorStore'
import useEnumStore from '@/stores/enumStore'
import { Plus, Edit, Trash2, Package } from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import DataTable from '@/components/ui/DataTable'
import Modal from '@/components/ui/Modal'

export default function SparePartsPage() {
  const {
    spareParts,
    loading,
    error,
    fetchSpareParts,
    createSparePart,
    updateSparePart,
    deleteSparePart,
    updateStock
  } = useSparePartsStore()

  const { vendors, fetchVendors } = useVendorStore()
  const { sparePartCategories, sparePartTypes } = useEnumStore()
  const router = useRouter()

  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showStockModal, setShowStockModal] = useState(false)
  const [editingSparePart, setEditingSparePart] = useState(null)
  const [sparePartToDelete, setSparePartToDelete] = useState(null)
  const [selectedSparePart, setSelectedSparePart] = useState(null)
  const [stockData, setStockData] = useState({ stockLevel: '', notes: '' })
  const initialFormState = {
    partNumber: '',
    name: '',
    description: '',
    category: '',
    partType: '',
    stockLevel: '',
    minStockLevel: '',
    maxStockLevel: '',
    reorderPoint: '',
    storageLocation: '',
    specifications: [],
    vendorId: '',
    notes: ''
  }

  const [formData, setFormData] = useState(initialFormState)

  const resetForm = () => {
    setEditingSparePart(null)
    setFormData(initialFormState)
  }

  useEffect(() => {
    fetchSpareParts()
    fetchVendors()
  }, [fetchSpareParts, fetchVendors])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const specifications = formData.specifications.reduce((acc, spec) => {
        if (spec.key && spec.key.trim()) {
          acc[spec.key.trim()] = spec.value || ''
        }
        return acc
      }, {})

      const sparePartData = {
        ...formData,
        stockLevel: formData.stockLevel ? parseInt(formData.stockLevel) : 0,
        minStockLevel: formData.minStockLevel ? parseInt(formData.minStockLevel) : null,
        maxStockLevel: formData.maxStockLevel ? parseInt(formData.maxStockLevel) : null,
        reorderPoint: formData.reorderPoint ? parseInt(formData.reorderPoint) : null,
        specifications: Object.keys(specifications).length > 0 ? specifications : null
      }

      // Remove empty partNumber if auto-generate is selected
      if (sparePartData.partNumber === 'auto-generate') {
        sparePartData.partNumber = ''
      }

      if (editingSparePart) {
        await updateSparePart(editingSparePart.id, sparePartData)
      } else {
        await createSparePart(sparePartData)
      }
      // Refresh the table data from server to ensure consistency
      await fetchSpareParts()
      setShowModal(false)
      resetForm()
    } catch (error) {
      console.error('Error saving spare part:', error)
    }
  }

  const handleEdit = (sparePart) => {
    setEditingSparePart(sparePart)
    // Convert specifications object to array of {key, value} pairs
    let specificationsArray = []
    if (sparePart.specifications && typeof sparePart.specifications === 'object') {
      specificationsArray = Object.entries(sparePart.specifications).map(([key, value]) => ({
        key,
        value: String(value)
      }))
    }
    setFormData({
      partNumber: sparePart.partNumber || '',
      name: sparePart.name,
      description: sparePart.description || '',
      category: sparePart.category || '',
      partType: sparePart.partType || '',
      stockLevel: sparePart.stockLevel?.toString() || '',
      minStockLevel: sparePart.minStockLevel?.toString() || '',
      maxStockLevel: sparePart.maxStockLevel?.toString() || '',
      reorderPoint: sparePart.reorderPoint?.toString() || '',
      storageLocation: sparePart.storageLocation || '',
      specifications: specificationsArray,
      vendorId: sparePart.vendorId || '',
      notes: sparePart.notes || ''
    })
    setShowModal(true)
  }

  const handleDelete = async () => {
    if (sparePartToDelete) {
      try {
        await deleteSparePart(sparePartToDelete.id)
        await fetchSpareParts()
        setShowDeleteModal(false)
        setSparePartToDelete(null)
      } catch (error) {
        console.error('Error deleting spare part:', error)
      }
    }
  }

  const handleStockUpdate = async (e) => {
    e.preventDefault()
    try {
      await updateStock(selectedSparePart.id, {
        stockLevel: parseInt(stockData.stockLevel),
        notes: stockData.notes
      })
      // Refresh the table data from server to ensure consistency
      await fetchSpareParts()
      setShowStockModal(false)
      setStockData({ stockLevel: '', notes: '' })
    } catch (error) {
      console.error('Error updating stock:', error)
    }
  }

  const addSpecification = () => {
    setFormData({
      ...formData,
      specifications: [...formData.specifications, { key: '', value: '' }]
    })
  }

  const updateSpecification = (index, field, value) => {
    const updatedSpecs = formData.specifications.map((spec, i) =>
      i === index ? { ...spec, [field]: value } : spec
    )
    setFormData({ ...formData, specifications: updatedSpecs })
  }

  const removeSpecification = (index) => {
    setFormData({
      ...formData,
      specifications: formData.specifications.filter((_, i) => i !== index)
    })
  }

  const columns = [
    { key: 'partNumber', label: 'Part Number' },
    { key: 'name', label: 'Name' },
    { key: 'category', label: 'Category' },
    { key: 'partType', label: 'Type' },
    { key: 'vendor', label: 'Vendor' },
    { key: 'stockLevel', label: 'Current Stock' },
    { key: 'stock_status', label: 'Stock Status' },
    { key: 'actions', label: 'Actions', isAction: true }
  ]

  const getStockStatus = (sparePart) => {
    const { stockLevel, minStockLevel } = sparePart
    if (!minStockLevel) return { status: 'Unknown', color: 'bg-gray-100 text-[#111]' }
    if (stockLevel <= minStockLevel) return { status: 'Low Stock', color: 'bg-white/60 text-[#111]' }
    if (stockLevel <= minStockLevel * 1.2) return { status: 'Warning', color: 'bg-white/60 text-[#111]' }
    return { status: 'In Stock', color: 'bg-white/60 text-[#111]' }
  }

  const formatCellValue = (item, key) => {
    switch (key) {
      case 'category':
        return item.category || 'N/A'
      case 'partType':
        return item.partType || 'N/A'
      case 'vendor':
        return item.vendor?.name || 'N/A'
      case 'stock_status':
        const stockInfo = getStockStatus(item)
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${stockInfo.color}`}>
            {stockInfo.status}
          </span>
        )
      case 'stockLevel':
        return `${item.stockLevel}${item.minStockLevel ? ` / ${item.minStockLevel}` : ''}`
      default:
        return item[key] || 'N/A'
    }
  }

  const renderActions = (item) => (
    <div className="flex space-x-2">
      <button
        onClick={() => router.push(`/master/spare-parts/${item.id}`)}
        className="text-[#111] hover:text-[#111]"
        title="View"
      >
        View
      </button>
      <button
        onClick={() => {
          setSelectedSparePart(item)
          setShowStockModal(true)
        }}
        className="text-[#111] hover:scale-110 transition-transform"
        title="Update Stock"
      >
        <Package className="w-4 h-4" />
      </button>
      <button
        onClick={() => handleEdit(item)}
        className="text-[#111] hover:scale-110 transition-transform"
        title="Edit"
      >
        <Edit className="w-4 h-4" />
      </button>
      <button
        onClick={() => {
          setSparePartToDelete(item)
          setShowDeleteModal(true)
        }}
        className="text-[#111] hover:scale-110 transition-transform"
        title="Delete"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )

  return (
    <DashboardLayout title="Spare Parts">
      {/** Show a visible error banner if store reports an error */}
      {loading === false && typeof error !== 'undefined' && error && (
        <div className="mb-4 p-3 bg-white/60 border border-black/10 text-[#111] rounded">
          <strong>Error:</strong> {String(error)}
        </div>
      )}
      {/* Debug panel: show raw spareParts payload for troubleshooting */}
      <details className="mb-4">
        <summary className="cursor-pointer text-sm text-[#333]">Debug: Show raw spareParts payload</summary>
        <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-auto max-h-48">
{JSON.stringify(spareParts, null, 2)}
</pre>
      </details>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Spare Parts</h1>
        <button
          onClick={() => setShowModal(true)}
          className="glass-button text-white px-4 py-2 rounded hover:scale-105 transition-transform flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Spare Part</span>
        </button>
      </div>

      <DataTable
        data={spareParts}
        columns={columns}
        loading={loading}
        formatCellValue={formatCellValue}
        renderActions={renderActions}
      />

      {/* Add/Edit Modal */}
      {showModal && (
        <Modal
          title={editingSparePart ? 'Edit Spare Part' : 'Add New Spare Part'}
          onClose={() => {
            setShowModal(false)
            resetForm()
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#111] mb-1">
                  Part Number
                </label>
                <select
                  value={formData.partNumber}
                  onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
                  className="w-full p-2 border rounded focus:outline-none focus:border-black/30"
                >
                  <option value="">Auto-generate</option>
                  {editingSparePart && editingSparePart.partNumber && (
                    <option value={editingSparePart.partNumber}>
                      {editingSparePart.partNumber} (current)
                    </option>
                  )}
                  {spareParts && spareParts
                    .filter(sp => !editingSparePart || sp.id !== editingSparePart.id)
                    .map((sparePart) => (
                      <option key={sparePart.id} value={sparePart.partNumber}>
                        {sparePart.partNumber}
                      </option>
                    ))}
                </select>
                <p className="text-xs text-[#333] mt-1">
                  Leave empty to auto-generate a unique part number
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#111] mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border rounded focus:outline-none focus:border-black/30"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#111] mb-1">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full p-2 border rounded focus:outline-none focus:border-black/30"
                  required
                >
                  <option value="">Select Category</option>
                  {sparePartCategories && sparePartCategories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#111] mb-1">
                  Part Type *
                </label>
                <select
                  value={formData.partType}
                  onChange={(e) => setFormData({ ...formData, partType: e.target.value })}
                  className="w-full p-2 border rounded focus:outline-none focus:border-black/30"
                  required
                >
                  <option value="">Select Type</option>
                  {sparePartTypes && sparePartTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#111] mb-1">
                  Vendor
                </label>
                <select
                  value={formData.vendorId}
                  onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
                  className="w-full p-2 border rounded focus:outline-none focus:border-black/30"
                >
                  <option value="">Select Vendor</option>
                  {vendors && vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Unit Price removed per product request - pricing is not needed in this module */}

              <div>
                <label className="block text-sm font-medium text-[#111] mb-1">
                  Stock Level
                </label>
                <input
                  type="number"
                  value={formData.stockLevel}
                  onChange={(e) => setFormData({ ...formData, stockLevel: e.target.value })}
                  className="w-full p-2 border rounded focus:outline-none focus:border-black/30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#111] mb-1">
                  Min Stock Level
                </label>
                <input
                  type="number"
                  value={formData.minStockLevel}
                  onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })}
                  className="w-full p-2 border rounded focus:outline-none focus:border-black/30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#111] mb-1">
                  Max Stock Level
                </label>
                <input
                  type="number"
                  value={formData.maxStockLevel}
                  onChange={(e) => setFormData({ ...formData, maxStockLevel: e.target.value })}
                  className="w-full p-2 border rounded focus:outline-none focus:border-black/30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#111] mb-1">
                  Reorder Point
                </label>
                <input
                  type="number"
                  value={formData.reorderPoint}
                  onChange={(e) => setFormData({ ...formData, reorderPoint: e.target.value })}
                  className="w-full p-2 border rounded focus:outline-none focus:border-black/30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#111] mb-1">
                  Storage Location
                </label>
                <input
                  type="text"
                  value={formData.storageLocation}
                  onChange={(e) => setFormData({ ...formData, storageLocation: e.target.value })}
                  className="w-full p-2 border rounded focus:outline-none focus:border-black/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111] mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2 border rounded focus:outline-none focus:border-black/30 h-20"
                rows={2}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-[#111]">
                  Specifications
                </label>
                <button
                  type="button"
                  onClick={addSpecification}
                  className="text-[#111] hover:scale-110 transition-transform text-sm flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Spec</span>
                </button>
              </div>
              <div className="space-y-2">
                {formData.specifications.map((spec, index) => (
                  <div key={index} className="flex space-x-2 items-center">
                    <input
                      type="text"
                      placeholder="Key (e.g., Voltage)"
                      value={spec.key}
                      onChange={(e) => updateSpecification(index, 'key', e.target.value)}
                      className="flex-1 p-2 border rounded focus:outline-none focus:border-black/30 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Value (e.g., 12V)"
                      value={spec.value}
                      onChange={(e) => updateSpecification(index, 'value', e.target.value)}
                      className="flex-1 p-2 border rounded focus:outline-none focus:border-black/30 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeSpecification(index)}
                      className="text-[#111] hover:scale-110 transition-transform p-1"
                      title="Remove specification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {formData.specifications.length === 0 && (
                  <p className="text-sm text-[#333] italic">
                    No specifications added. Click &quot;Add Spec&quot; to add technical details.
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111] mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full p-2 border rounded focus:outline-none focus:border-black/30 h-20"
                rows={2}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
                className="px-4 py-2 text-[#333] bg-gray-100 rounded hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 glass-button text-white rounded hover:scale-105 transition-transform disabled:opacity-50"
              >
                {loading ? 'Saving...' : editingSparePart ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Stock Update Modal */}
      {showStockModal && selectedSparePart && (
        <Modal
          title={`Update Stock - ${selectedSparePart.name}`}
          onClose={() => {
            setShowStockModal(false)
            setStockData({ stockLevel: '', notes: '' })
          }}
        >
          <form onSubmit={handleStockUpdate} className="space-y-4">
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm text-[#333]">
                Current Stock: <span className="font-medium">{selectedSparePart.stockLevel}</span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111] mb-1">
                New Stock Level *
              </label>
              <input
                type="number"
                value={stockData.stockLevel}
                onChange={(e) => setStockData({ ...stockData, stockLevel: e.target.value })}
                className="w-full p-2 border rounded focus:outline-none focus:border-black/30"
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111] mb-1">
                Notes
              </label>
              <textarea
                value={stockData.notes}
                onChange={(e) => setStockData({ ...stockData, notes: e.target.value })}
                className="w-full p-2 border rounded focus:outline-none focus:border-black/30 h-20"
                rows={2}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowStockModal(false)
                  setStockData({ stockLevel: '', notes: '' })
                }}
                className="px-4 py-2 text-[#333] bg-gray-100 rounded hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 glass-button text-white rounded hover:scale-105 transition-transform"
              >
                Update Stock
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <Modal
          title="Delete Spare Part"
          onClose={() => {
            setShowDeleteModal(false)
            setSparePartToDelete(null)
          }}
        >
          <p className="mb-4">
            Are you sure you want to delete <strong>{sparePartToDelete?.name}</strong> (#{sparePartToDelete?.partNumber})?
            This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                setShowDeleteModal(false)
                setSparePartToDelete(null)
              }}
              className="px-4 py-2 text-[#333] bg-gray-100 rounded hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 glass-button text-white rounded hover:scale-105 transition-transform"
            >
              Delete
            </button>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  )
}