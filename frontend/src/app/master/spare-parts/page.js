'use client'

import { useState, useEffect } from 'react'
import { useSparePartsStore } from '@/stores/sparePartsStore'
import { useCategoryStore } from '@/stores/categoryStore'
import { useVendorStore } from '@/stores/vendorStore'
import { Plus, Edit, Trash2, Package } from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import DataTable from '@/components/ui/DataTable'
import Modal from '@/components/ui/Modal'

export default function SparePartsPage() {
  const {
    spareParts,
    loading,
    fetchSpareParts,
    createSparePart,
    updateSparePart,
    deleteSparePart,
    updateStock
  } = useSparePartsStore()

  const { categories, fetchCategories } = useCategoryStore()
  const { vendors, fetchVendors } = useVendorStore()

  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showStockModal, setShowStockModal] = useState(false)
  const [editingSparePart, setEditingSparePart] = useState(null)
  const [sparePartToDelete, setSparePartToDelete] = useState(null)
  const [selectedSparePart, setSelectedSparePart] = useState(null)
  const [stockData, setStockData] = useState({ quantity: '', type: 'IN', notes: '' })
  const [formData, setFormData] = useState({
    part_number: '',
    name: '',
    description: '',
    category_id: '',
    vendor_id: '',
    unit_price: '',
    current_stock: '',
    minimum_stock: '',
    maximum_stock: '',
    location: '',
    specifications: ''
  })

  useEffect(() => {
    fetchSpareParts()
    fetchCategories()
    fetchVendors()
  }, [fetchSpareParts, fetchCategories, fetchVendors])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const sparePartData = {
        ...formData,
        unit_price: formData.unit_price ? parseFloat(formData.unit_price) : null,
        current_stock: formData.current_stock ? parseInt(formData.current_stock) : 0,
        minimum_stock: formData.minimum_stock ? parseInt(formData.minimum_stock) : null,
        maximum_stock: formData.maximum_stock ? parseInt(formData.maximum_stock) : null
      }

      if (editingSparePart) {
        await updateSparePart(editingSparePart.id, sparePartData)
      } else {
        await createSparePart(sparePartData)
      }
      setShowModal(false)
      resetForm()
    } catch (error) {
      console.error('Error saving spare part:', error)
    }
  }

  const handleEdit = (sparePart) => {
    setEditingSparePart(sparePart)
    setFormData({
      part_number: sparePart.part_number,
      name: sparePart.name,
      description: sparePart.description || '',
      category_id: sparePart.category_id || '',
      vendor_id: sparePart.vendor_id || '',
      unit_price: sparePart.unit_price?.toString() || '',
      current_stock: sparePart.current_stock?.toString() || '',
      minimum_stock: sparePart.minimum_stock?.toString() || '',
      maximum_stock: sparePart.maximum_stock?.toString() || '',
      location: sparePart.location || '',
      specifications: sparePart.specifications || ''
    })
    setShowModal(true)
  }

  const handleDelete = async () => {
    if (sparePartToDelete) {
      try {
        await deleteSparePart(sparePartToDelete.id)
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
        quantity: parseInt(stockData.quantity),
        type: stockData.type,
        notes: stockData.notes
      })
      setShowStockModal(false)
      setStockData({ quantity: '', type: 'IN', notes: '' })
    } catch (error) {
      console.error('Error updating stock:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      part_number: '',
      name: '',
      description: '',
      category_id: '',
      vendor_id: '',
      unit_price: '',
      current_stock: '',
      minimum_stock: '',
      maximum_stock: '',
      location: '',
      specifications: ''
    })
    setEditingSparePart(null)
  }

  const columns = [
    { key: 'part_number', label: 'Part Number' },
    { key: 'name', label: 'Name' },
    { key: 'category', label: 'Category' },
    { key: 'vendor', label: 'Vendor' },
    { key: 'current_stock', label: 'Current Stock' },
    { key: 'stock_status', label: 'Stock Status' },
    { key: 'unit_price', label: 'Unit Price' },
    { key: 'actions', label: 'Actions', isAction: true }
  ]

  const getStockStatus = (sparePart) => {
    const { current_stock, minimum_stock } = sparePart
    if (!minimum_stock) return { status: 'Unknown', color: 'bg-gray-100 text-gray-800' }
    if (current_stock <= minimum_stock) return { status: 'Low Stock', color: 'bg-red-100 text-red-800' }
    if (current_stock <= minimum_stock * 1.2) return { status: 'Warning', color: 'bg-yellow-100 text-yellow-800' }
    return { status: 'In Stock', color: 'bg-green-100 text-green-800' }
  }

  const formatCellValue = (item, key) => {
    switch (key) {
      case 'category':
        return item.category?.name || 'N/A'
      case 'vendor':
        return item.vendor?.name || 'N/A'
      case 'stock_status':
        const stockInfo = getStockStatus(item)
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${stockInfo.color}`}>
            {stockInfo.status}
          </span>
        )
      case 'unit_price':
        return item.unit_price ? `$${item.unit_price.toFixed(2)}` : 'N/A'
      case 'current_stock':
        return `${item.current_stock}${item.minimum_stock ? ` / ${item.minimum_stock}` : ''}`
      default:
        return item[key] || 'N/A'
    }
  }

  const renderActions = (item) => (
    <div className="flex space-x-2">
      <button
        onClick={() => {
          setSelectedSparePart(item)
          setShowStockModal(true)
        }}
        className="text-green-600 hover:text-green-900"
        title="Update Stock"
      >
        <Package className="w-4 h-4" />
      </button>
      <button
        onClick={() => handleEdit(item)}
        className="text-blue-600 hover:text-blue-900"
        title="Edit"
      >
        <Edit className="w-4 h-4" />
      </button>
      <button
        onClick={() => {
          setSparePartToDelete(item)
          setShowDeleteModal(true)
        }}
        className="text-red-600 hover:text-red-900"
        title="Delete"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )

  return (
    <DashboardLayout title="Spare Parts">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Spare Parts</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center space-x-2"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Part Number *
                </label>
                <input
                  type="text"
                  value={formData.part_number}
                  onChange={(e) => setFormData({ ...formData, part_number: e.target.value })}
                  className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vendor
                </label>
                <select
                  value={formData.vendor_id}
                  onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
                  className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Vendor</option>
                  {vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.unit_price}
                  onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                  className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Stock
                </label>
                <input
                  type="number"
                  value={formData.current_stock}
                  onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
                  className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Stock
                </label>
                <input
                  type="number"
                  value={formData.minimum_stock}
                  onChange={(e) => setFormData({ ...formData, minimum_stock: e.target.value })}
                  className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Stock
                </label>
                <input
                  type="number"
                  value={formData.maximum_stock}
                  onChange={(e) => setFormData({ ...formData, maximum_stock: e.target.value })}
                  className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2 border rounded focus:outline-none focus:border-blue-500 h-20"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Specifications
              </label>
              <textarea
                value={formData.specifications}
                onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                className="w-full p-2 border rounded focus:outline-none focus:border-blue-500 h-24"
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
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
            setStockData({ quantity: '', type: 'IN', notes: '' })
          }}
        >
          <form onSubmit={handleStockUpdate} className="space-y-4">
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm text-gray-600">
                Current Stock: <span className="font-medium">{selectedSparePart.current_stock}</span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transaction Type *
              </label>
              <select
                value={stockData.type}
                onChange={(e) => setStockData({ ...stockData, type: e.target.value })}
                className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
                required
              >
                <option value="IN">Stock In (+)</option>
                <option value="OUT">Stock Out (-)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity *
              </label>
              <input
                type="number"
                value={stockData.quantity}
                onChange={(e) => setStockData({ ...stockData, quantity: e.target.value })}
                className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
                min="1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={stockData.notes}
                onChange={(e) => setStockData({ ...stockData, notes: e.target.value })}
                className="w-full p-2 border rounded focus:outline-none focus:border-blue-500 h-20"
                rows={2}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowStockModal(false)
                  setStockData({ quantity: '', type: 'IN', notes: '' })
                }}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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
            Are you sure you want to delete <strong>{sparePartToDelete?.name}</strong> (#{sparePartToDelete?.part_number})?
            This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                setShowDeleteModal(false)
                setSparePartToDelete(null)
              }}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  )
}