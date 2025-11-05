'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import useSoftwareAssetsStore from '@/stores/softwareAssetsStore'
import { useVendorStore } from '@/stores/vendorStore'
import { useCompanyStore } from '@/stores/companyStore'
import { assetSoftwareService } from '@/lib/services/assetSoftwareService'
import { Plus, Edit, Trash2, Monitor } from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import DataTable from '@/components/ui/DataTable'
import Modal from '@/components/ui/Modal'
import { softwareAssetsService } from '@/lib/services/softwareAssetsService'

export default function MasterSoftwareAssetsPage() {
  const {
    softwareAssets,
    loading,
    fetchSoftwareAssets,
    createSoftwareAsset,
    updateSoftwareAsset,
    deleteSoftwareAsset
  } = useSoftwareAssetsStore()

  const { vendors, fetchVendors } = useVendorStore()
  const { companies, fetchCompanies } = useCompanyStore()
  const { user } = useAuthStore()

  const [showModal, setShowModal] = useState(false)
  const [showMultiModal, setShowMultiModal] = useState(false)
  const [multiInput, setMultiInput] = useState('')
  const [multiLoading, setMultiLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingSoftwareAsset, setEditingSoftwareAsset] = useState(null)
  const [softwareAssetToDelete, setSoftwareAssetToDelete] = useState(null)
  const [showInstallModal, setShowInstallModal] = useState(false)
  const [installations, setInstallations] = useState([])
  const [selectedSoftwareForInst, setSelectedSoftwareForInst] = useState(null)
  const [formData, setFormData] = useState({
    companyId: '',
    name: '',
    version: '',
    publisher: '',
    description: '',
    softwareType: 'APPLICATION',
    category: '',
    systemRequirements: {},
    installationPath: '',
    isActive: true,
    license_type: 'PERPETUAL',
    license_key: '',
    status: 'ACTIVE',
    vendor_id: '',
    purchase_date: '',
    expiry_date: '',
    cost: '',
    max_installations: '',
    current_installations: ''
  })

  useEffect(() => {
    fetchSoftwareAssets()
    fetchVendors()

    // Only fetch the full companies list for privileged roles.
    // Regular users should not call the companies endpoint (it's protected on the backend)
    // and will instead have their company pre-filled from the authenticated user.
    if (user && (user.role === 'ADMIN' || user.role === 'ASSET_ADMIN' || user.role === 'TOP_MANAGEMENT')) {
      console.log('Fetching companies for role:', user.role)
      fetchCompanies().then(() => {
        console.log('Companies fetched successfully')
      }).catch(err => {
        console.error('Error fetching companies:', err)
      })
    } else if (user) {
      console.log('Prefilling company for role:', user.role, 'companyId:', user.companyId)
      // Prefill companyId for non-privileged users so the form sends the correct company
      setFormData((f) => ({ ...f, companyId: user.companyId || '' }))
    }
  }, [fetchSoftwareAssets, fetchVendors, fetchCompanies, user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // Validate required fields based on license type
      if (formData.license_type === 'SUBSCRIPTION' && !formData.expiry_date) {
        alert('Expiry date is required for subscription licenses')
        return
      }

      // Remove company_id from data since it's handled by backend auth
      const softwareAssetData = {
        name: formData.name,
        version: formData.version,
        publisher: formData.publisher,
        description: formData.description,
        softwareType: formData.softwareType,
        category: formData.category,
        systemRequirements: formData.systemRequirements || {},
        installationPath: formData.installationPath,
        license_type: formData.license_type,
        licenseId: formData.licenseId || '',
        vendor_id: formData.vendor_id || '',
        license_key: formData.license_key || '',
        purchase_date: formData.purchase_date || null,
        expiry_date: formData.expiry_date || null,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        max_installations: formData.max_installations ? parseInt(formData.max_installations) : null,
        current_installations: formData.current_installations ? parseInt(formData.current_installations) : 0,
        status: formData.status,
        isActive: formData.status === 'ACTIVE',
        company_id: formData.companyId || user?.companyId || null // snake_case for backend
      }

      if (editingSoftwareAsset) {
        await updateSoftwareAsset(editingSoftwareAsset.id, softwareAssetData)
      } else {
        await createSoftwareAsset(softwareAssetData)
      }
      await fetchSoftwareAssets()
      window.alert('Software asset berhasil disimpan!')
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
      companyId: softwareAsset.companyId || user?.companyId || '',
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
        await fetchSoftwareAssets()
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
      publisher: '',
      description: '',
      softwareType: 'APPLICATION',
      category: '',
      systemRequirements: {},
      installationPath: '',
      isActive: true,
      license_type: 'PERPETUAL',
      license_key: '',
      status: 'ACTIVE',
      vendor_id: '',
      purchase_date: '',
      expiry_date: '',
      cost: '',
      max_installations: '',
      current_installations: ''
    })
    setEditingSoftwareAsset(null)
  }

  // FIX: Software Assets table - only show Name, License Type, Status, Installation Action
  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'license_type', label: 'License Type' },
    { key: 'status', label: 'Status' },
    { key: 'installations', label: 'Installation Action', isAction: true }
  ]

  const formatCellValue = (item, key) => {
    switch (key) {
      case 'vendor':
        return item.vendor?.name || 'N/A'
      case 'company':
        return item.company?.name || 'N/A'
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
      case 'installations':
        const totalLicenses = item.licenses?.reduce((sum, license) => sum + (license.totalSeats || 0), 0) || 0
        // backend may return either `installations` array or `_count.installations` for performance
        const activeInstallations = (Array.isArray(item.installations)
          ? (item.installations.filter(inst => inst.status === 'INSTALLED').length || 0)
          : (item._count?.installations || 0))
        return (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-900">{activeInstallations}/{totalLicenses}</span>
            <button
              onClick={async () => {
                try {
                  setSelectedSoftwareForInst(item)
                  const result = await assetSoftwareService.getSoftwareInstallations(item.id)
                  setInstallations(result.data || [])
                  setShowInstallModal(true)
                } catch (error) {
                  // Log full error for debugging (includes response object when available)
                  console.error('Failed to fetch installations:', error)
                  // If the service provided a message, show it; otherwise fallback to generic message
                  const message = error?.message || (error?.response?.data?.message) || 'Failed to load installations'
                  // Show more informative alert to the user for immediate debugging in dev
                  alert(message)
                }
              }}
              className={`p-1 rounded ${activeInstallations > 0 ? 'text-blue-600 hover:text-blue-900' : 'text-gray-400 hover:text-gray-600'}`}
              title="View installations"
            >
              <Monitor className="w-4 h-4" />
            </button>
          </div>
        )
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
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowMultiModal(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Multi Add</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Software Asset</span>
          </button>
        </div>
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
            {/* Debug info - remove after testing */}
            {process.env.NODE_ENV === 'development' && (
              <div className="text-xs text-gray-500 p-2 bg-gray-100 rounded">
                Debug: User role: {user?.role} | Companies count: {companies?.length || 0} | FormData.companyId: {formData.companyId || 'empty'}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company *
                </label>
                {(user?.role === 'ADMIN' || user?.role === 'ASSET_ADMIN' || user?.role === 'TOP_MANAGEMENT') ? (
                  <select
                    value={formData.companyId}
                    onChange={e => setFormData({ ...formData, companyId: e.target.value })}
                    className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
                    required
                  >
                    <option value="">Select Company</option>
                    {companies.map(company => (
                      <option key={company.id} value={company.id}>{company.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={user?.company?.name || ''}
                    className="w-full p-2 border rounded bg-gray-100 text-gray-500"
                    disabled
                  />
                )}
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
                  Software Type *
                </label>
                <select
                  value={formData.softwareType}
                  onChange={(e) => setFormData({ ...formData, softwareType: e.target.value })}
                  className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="APPLICATION">Application</option>
                  <option value="OPERATING_SYSTEM">Operating System</option>
                  <option value="UTILITY">Utility</option>
                  <option value="DRIVER">Driver</option>
                  <option value="SECURITY">Security</option>
                  <option value="DEVELOPMENT_TOOL">Development Tool</option>
                  <option value="OFFICE_SUITE">Office Suite</option>
                  <option value="DATABASE">Database</option>
                  <option value="MIDDLEWARE">Middleware</option>
                  <option value="PLUGIN">Plugin</option>
                </select>
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
                  <option value="PERPETUAL">Perpetual</option>
                  <option value="SUBSCRIPTION">Subscription</option>
                  <option value="OPEN_SOURCE">Open Source</option>
                  <option value="TRIAL">Trial</option>
                  <option value="EDUCATIONAL">Educational</option>
                  <option value="ENTERPRISE">Enterprise</option>
                  <option value="OEM">OEM</option>
                  <option value="VOLUME">Volume</option>
                  <option value="SINGLE_USER">Single User</option>
                  <option value="MULTI_USER">Multi User</option>
                  <option value="SITE_LICENSE">Site License</option>
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

      {/* Multi Add Modal */}
      {showMultiModal && (
        <Modal
          title="Multi Add Software Assets"
          onClose={() => {
            setShowMultiModal(false)
            setMultiInput('')
          }}
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Paste a JSON array of software assets or newline-separated JSON objects. Each object should include at least <code>name</code> and <code>softwareType</code>. Company will be set to your current company unless overridden and allowed.</p>
            <textarea
              value={multiInput}
              onChange={(e) => setMultiInput(e.target.value)}
              placeholder='[{"name":"App A","softwareType":"APPLICATION"},{"name":"App B","softwareType":"APPLICATION"}]'
              className="w-full p-2 border rounded h-48"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowMultiModal(false)
                  setMultiInput('')
                }}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    setMultiLoading(true)
                    let parsed
                    try {
                      parsed = JSON.parse(multiInput)
                    } catch {
                      // try newline separated
                      const lines = multiInput.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
                      parsed = lines.map(l => JSON.parse(l))
                    }

                    if (!Array.isArray(parsed)) {
                      window.alert('Input must be a JSON array or newline-separated JSON objects')
                      setMultiLoading(false)
                      return
                    }

                    await softwareAssetsService.batchCreate(parsed)
                    await fetchSoftwareAssets()
                    window.alert('Batch create successful')
                    setShowMultiModal(false)
                    setMultiInput('')
                  } catch (error) {
                    console.error('Batch create failed:', error)
                    window.alert('Batch create failed: ' + (error?.message || 'Unknown error'))
                  } finally {
                    setMultiLoading(false)
                  }
                }}
                disabled={multiLoading}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
              >
                {multiLoading ? 'Importing...' : 'Import'}
              </button>
            </div>
          </div>
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

      {/* Installations Modal */}
      {showInstallModal && (
        <Modal title={`Installations - ${selectedSoftwareForInst?.name || ''}`} onClose={() => { setShowInstallModal(false); setInstallations([]); setSelectedSoftwareForInst(null); }}>
          <div className="space-y-3">
            {installations.length === 0 ? (
              <p className="text-sm text-gray-600">No installations found for this software.</p>
            ) : (
              <div className="space-y-2">
                {installations.map(inst => (
                  <div key={inst.id} className="p-3 border rounded-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{inst.asset?.name || 'Unknown asset'}</p>
                        <p className="text-xs text-gray-500">Tag: {inst.asset?.assetTag || '-'}</p>
                        <p className="text-xs text-gray-500">Location: {inst.asset?.location?.name || 'N/A'} • Dept: {inst.asset?.department?.name || 'N/A'}</p>
                      </div>
                      <div className="text-right text-sm text-gray-600">
                        <div>Installed: {new Date(inst.installationDate).toLocaleString()}</div>
                        <div>License: {inst.license ? inst.license.licenseKey || inst.license.id : 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </DashboardLayout>
  )
}