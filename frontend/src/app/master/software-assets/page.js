'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import useSoftwareAssetsStore from '@/stores/softwareAssetsStore'
import { useVendorStore } from '@/stores/vendorStore'
import { Plus, Edit, Trash2 } from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import DataTable from '@/components/ui/DataTable'
import Modal from '@/components/ui/Modal'

export default function MasterSoftwareAssetsPage() {
  const {
    softwareAssets,
    loading,
    error,
    fetchSoftwareAssets,
    createSoftwareAsset,
    updateSoftwareAsset,
    deleteSoftwareAsset
  } = useSoftwareAssetsStore()

  const { vendors, fetchVendors } = useVendorStore()

  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingSoftwareAsset, setEditingSoftwareAsset] = useState(null)
  const [softwareAssetToDelete, setSoftwareAssetToDelete] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    version: '',
    license_type: 'SINGLE_USER',
    license_key: '',
    vendor_id: '',
    purchase_date: '',
    expiry_date: '',
    cost: '',
    max_installations: '',
    current_installations: '',
    description: '',
    status: 'ACTIVE'
  })

  useEffect(() => {
    fetchSoftwareAssets()
    fetchVendors()
  }, [fetchSoftwareAssets, fetchVendors])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const softwareAssetData = {
        ...formData,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        max_installations: formData.max_installations ? parseInt(formData.max_installations) : null,
        current_installations: formData.current_installations ? parseInt(formData.current_installations) : 0,
        purchase_date: formData.purchase_date || null,
        expiry_date: formData.expiry_date || null
      }

      if (editingSoftwareAsset) {
        await updateSoftwareAsset(editingSoftwareAsset.id, softwareAssetData)
      } else {
        await createSoftwareAsset(softwareAssetData)
      }
      setShowModal(false)
      resetForm()
    } catch (error) {
      console.error('Error saving software asset:', error)
    }
  }

  const handleEdit = (softwareAsset) => {
    setEditingSoftwareAsset(softwareAsset)
    setFormData({
      name: softwareAsset.name,
      version: softwareAsset.version || '',
      license_type: softwareAsset.license_type || 'SINGLE_USER',
      license_key: softwareAsset.license_key || '',
      vendor_id: softwareAsset.vendor_id || '',
      purchase_date: softwareAsset.purchase_date ? softwareAsset.purchase_date.split('T')[0] : '',
      expiry_date: softwareAsset.expiry_date ? softwareAsset.expiry_date.split('T')[0] : '',
      cost: softwareAsset.cost?.toString() || '',
      max_installations: softwareAsset.max_installations?.toString() || '',
      current_installations: softwareAsset.current_installations?.toString() || '',
      description: softwareAsset.description || '',
      status: softwareAsset.status || 'ACTIVE'
    })
    setShowModal(true)
  }

  const handleDelete = async () => {
    if (softwareAssetToDelete) {
      try {
        await deleteSoftwareAsset(softwareAssetToDelete.id)
        setShowDeleteModal(false)
        setSoftwareAssetToDelete(null)
      } catch (error) {
        console.error('Error deleting software asset:', error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      version: '',
      license_type: 'SINGLE_USER',
      license_key: '',
      vendor_id: '',
      purchase_date: '',
      expiry_date: '',
      cost: '',
      max_installations: '',
      current_installations: '',
      description: '',
      status: 'ACTIVE'
    })
    setEditingSoftwareAsset(null)
  }

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'version', label: 'Version' },
    { key: 'license_type', label: 'License Type' },
    { key: 'vendor', label: 'Vendor' },
    { key: 'status', label: 'Status' },
    { key: 'max_installations', label: 'Max Installations' },
    { key: 'current_installations', label: 'Current Installations' },
    { key: 'actions', label: 'Actions', isAction: true }
  ]

  const formatCellValue = (item, key) => {
    switch (key) {
      case 'vendor':
        return item.vendor?.name || 'N/A'
      case 'status':
        const statusColors = {
          ACTIVE: 'bg-green-100 text-green-800',
          INACTIVE: 'bg-gray-100 text-gray-800',
          EXPIRED: 'bg-red-100 text-red-800'
        }
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[item[key]] || 'bg-gray-100 text-gray-800'}`}>
            {item[key]}
          </span>
        )
      case 'license_type':
        return item[key]?.replace(/_/g, ' ') || 'N/A'
      default:
        return item[key] || 'N/A'
    }
  }

  const renderActions = (item) => (
    <div className="flex space-x-2">
      <button
        onClick={() => handleEdit(item)}
        className="text-blue-600 hover:text-blue-900"
      >
        <Edit className="w-4 h-4" />
      </button>
      <button
        onClick={() => {
          setSoftwareAssetToDelete(item)
          setShowDeleteModal(true)
        }}
        className="text-red-600 hover:text-red-900"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )

  return (
    <DashboardLayout title="Software Assets">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Software Assets</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Software Asset</span>
        </button>
      </div>

      <DataTable
        data={softwareAssets}
        columns={columns}
        loading={loading}
        formatCellValue={formatCellValue}
        renderActions={renderActions}
      />

      {/* Add/Edit Modal */}
      {showModal && (
        <Modal
          title={editingSoftwareAsset ? 'Edit Software Asset' : 'Add New Software Asset'}
          onClose={() => {
            setShowModal(false)
            resetForm()
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  Version
                </label>
                <input
                  type="text"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  License Type *
                </label>
                <select
                  value={formData.license_type}
                  onChange={(e) => setFormData({ ...formData, license_type: e.target.value })}
                  className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="SINGLE_USER">Single User</option>
                  <option value="MULTI_USER">Multi User</option>
                  <option value="SITE_LICENSE">Site License</option>
                  <option value="ENTERPRISE">Enterprise</option>
                  <option value="SUBSCRIPTION">Subscription</option>
                  <option value="PERPETUAL">Perpetual</option>
                  <option value="OPEN_SOURCE">Open Source</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="EXPIRED">Expired</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  License Key
                </label>
                <input
                  type="text"
                  value={formData.license_key}
                  onChange={(e) => setFormData({ ...formData, license_key: e.target.value })}
                  className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
                />
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
                  Purchase Date
                </label>
                <input
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                  className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Installations
                </label>
                <input
                  type="number"
                  value={formData.max_installations}
                  onChange={(e) => setFormData({ ...formData, max_installations: e.target.value })}
                  className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Installations
                </label>
                <input
                  type="number"
                  value={formData.current_installations}
                  onChange={(e) => setFormData({ ...formData, current_installations: e.target.value })}
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
                {loading ? 'Saving...' : editingSoftwareAsset ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <Modal
          title="Delete Software Asset"
          onClose={() => {
            setShowDeleteModal(false)
            setSoftwareAssetToDelete(null)
          }}
        >
          <p className="mb-4">
            Are you sure you want to delete <strong>{softwareAssetToDelete?.name}</strong>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                setShowDeleteModal(false)
                setSoftwareAssetToDelete(null)
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