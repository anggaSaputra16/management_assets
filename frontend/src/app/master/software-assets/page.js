 'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import useSoftwareAssetsStore from '@/stores/softwareAssetsStore'
import { useVendorStore } from '@/stores/vendorStore'
import { useCompanyStore } from '@/stores/companyStore'
import { useEnumStore } from '@/stores'
import { assetSoftwareService } from '@/lib/services/assetSoftwareService'
import { Plus, Edit, Trash2, Monitor, Info } from 'lucide-react'
import Image from 'next/image'
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
  const {
    softwareTypes,
    licenseTypes,
    initializeEnums
  } = useEnumStore()

  // software asset statuses are not provided by enumStore by default; use local list
  const SOFTWARE_STATUSES = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
    { value: 'EXPIRED', label: 'Expired' }
  ]

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
  const [expandedRows, setExpandedRows] = useState([])
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [detailsData, setDetailsData] = useState(null)
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
    status: 'ACTIVE'
  })
  const [licenses, setLicenses] = useState([
    {
      license_type: 'PERPETUAL',
      license_key: '',
      max_installations: '',
      current_installations: '',
      purchase_date: '',
      expiry_date: '',
      vendor_id: ''
    }
  ])
  const [attachmentsFiles, setAttachmentsFiles] = useState([])
  const [originalLicenseIds, setOriginalLicenseIds] = useState([])

  useEffect(() => {
    fetchSoftwareAssets()
    fetchVendors()
    initializeEnums()

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
  }, [fetchSoftwareAssets, fetchVendors, fetchCompanies, initializeEnums, user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // Validate required fields based on license type inside licenses list
      const invalidLicense = (licenses || []).find(l => (l.license_type === 'SUBSCRIPTION') && !l.expiry_date)
      if (invalidLicense) {
        alert('Every subscription license must have an expiry date')
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
        status: formData.status,
        isActive: formData.status === 'ACTIVE',
        company_id: formData.companyId || user?.companyId || null // snake_case for backend
      }

      // If creating: include first license inline (backend supports creating a single license in POST)
      const firstLicense = licenses && licenses.length > 0 ? licenses[0] : null
      if (firstLicense) {
        // Attach first license summary to initial create payload so backend can create first license atomically
        softwareAssetData.license_type = firstLicense.license_type || 'PERPETUAL'
        softwareAssetData.license_key = firstLicense.license_key || ''
        softwareAssetData.purchase_date = firstLicense.purchase_date || null
        softwareAssetData.expiry_date = firstLicense.expiry_date || null
        softwareAssetData.max_installations = firstLicense.max_installations ? parseInt(firstLicense.max_installations) : undefined
        softwareAssetData.current_installations = firstLicense.current_installations ? parseInt(firstLicense.current_installations) : undefined
        softwareAssetData.vendor_id = firstLicense.vendor_id || null
      }

      let createdOrUpdated = null
      if (editingSoftwareAsset) {
        // Update asset core fields
        createdOrUpdated = await updateSoftwareAsset(editingSoftwareAsset.id, softwareAssetData)

        // Sync licenses: update existing, create new, delete removed
        const currentIds = licenses.filter(l => l.id).map(l => l.id)
        // Delete licenses removed by user
        for (const origId of originalLicenseIds) {
          if (!currentIds.includes(origId)) {
            try { await softwareAssetsService.deleteLicense(editingSoftwareAsset.id, origId) } catch (err) { console.warn('Failed to delete license', origId, err) }
          }
        }

        // Update or create licenses
        for (const l of licenses) {
              const payload = {
                license_type: l.license_type,
                license_key: l.license_key,
                max_installations: l.max_installations ? parseInt(l.max_installations) : undefined,
                current_installations: l.current_installations ? parseInt(l.current_installations) : undefined,
                purchase_date: l.purchase_date || null,
                expiry_date: l.expiry_date || null,
                vendor_id: l.vendor_id || null,
                status: l.status || 'ACTIVE'
              }
          if (l.id) {
            try { await softwareAssetsService.updateLicense(editingSoftwareAsset.id, l.id, payload) } catch (err) { console.warn('Update license failed', err) }
          } else {
            try { await softwareAssetsService.createLicenses(editingSoftwareAsset.id, payload) } catch (err) { console.warn('Create license failed', err) }
          }
        }

        // Upload attachments if any
        if (attachmentsFiles && attachmentsFiles.length > 0) {
          try { await softwareAssetsService.uploadAttachments(editingSoftwareAsset.id, attachmentsFiles) } catch (err) { console.warn('Upload attachments failed', err) }
        }
      } else {
        // Create new software asset (includes first license if provided)
        createdOrUpdated = await createSoftwareAsset(softwareAssetData)

        // Create additional licenses if more than one
        if (licenses && licenses.length > 1) {
          const extra = licenses.slice(1).map(l => ({
            license_type: l.license_type,
            license_key: l.license_key,
            max_installations: l.max_installations ? parseInt(l.max_installations) : undefined,
            current_installations: l.current_installations ? parseInt(l.current_installations) : undefined,
            purchase_date: l.purchase_date || null,
            expiry_date: l.expiry_date || null,
            vendor_id: l.vendor_id || null,
            status: l.status || 'ACTIVE'
          }))
          try {
            await softwareAssetsService.createLicenses(createdOrUpdated.id, extra)
          } catch (err) { console.warn('Create extra licenses failed', err) }
        }

        // Upload attachments if any
        if (attachmentsFiles && attachmentsFiles.length > 0) {
          try { await softwareAssetsService.uploadAttachments(createdOrUpdated.id, attachmentsFiles) } catch (err) { console.warn('Upload attachments failed', err) }
        }

        // Refresh list
        await fetchSoftwareAssets()
        window.alert('Software asset berhasil disimpan!')
        setShowModal(false)
        resetForm()
      }

      // common post-update tasks
      await fetchSoftwareAssets()
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
      description: softwareAsset.description || '',
      status: softwareAsset.status || 'ACTIVE'
    })
    // populate licenses UI
    const existingLicenses = (softwareAsset.licenses || []).map(l => ({
      id: l.id,
      license_type: l.licenseType || l.license_type || 'PERPETUAL',
      license_key: l.licenseKey || l.license_key || '',
      max_installations: l.totalSeats?.toString() || (l.max_installations?.toString() || ''),
      current_installations: (l.usedSeats || l.current_installations || 0).toString(),
      purchase_date: l.purchaseDate ? (new Date(l.purchaseDate)).toISOString().split('T')[0] : '',
      expiry_date: l.expiryDate ? (new Date(l.expiryDate)).toISOString().split('T')[0] : '',
      vendor_id: l.vendorId || ''
    }))
    setLicenses(existingLicenses.length > 0 ? existingLicenses : [{ license_type: 'PERPETUAL', license_key: '' }])
    setOriginalLicenseIds((softwareAsset.licenses || []).map(l => l.id))
    setShowModal(true)
  }

  const handleAddLicense = () => setLicenses(prev => ([...prev, { license_type: 'PERPETUAL', license_key: '', max_installations: '', current_installations: '', purchase_date: '', expiry_date: '', vendor_id: '' }]))
  
  const handleRemoveLicense = (index) => setLicenses(prev => prev.filter((_, i) => i !== index))

  const handleAttachmentsChange = (e) => {
    const files = Array.from(e.target.files || [])
    setAttachmentsFiles(files)
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
      status: 'ACTIVE'
    })
    setLicenses([{ license_type: 'PERPETUAL', license_key: '', max_installations: '', current_installations: '', purchase_date: '', expiry_date: '', vendor_id: '' }])
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
        // Status can be on the software asset itself or on the latest license
        const assetStatus = item.status || (item.licenses && item.licenses.length > 0 ? (item.licenses[0].status || item.licenses[0].licenseStatus) : null)
        const statusColors = {
          ACTIVE: 'bg-white/60 text-[#111]',
          INACTIVE: 'bg-gray-100 text-[#111]',
          EXPIRED: 'bg-white/60 text-[#111]'
        }
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[assetStatus] || 'bg-gray-100 text-[#111]'}`}>
            {assetStatus || 'N/A'}
          </span>
        )
      case 'license_type':
        // License type may be stored on the software asset or inside licenses array
        const assetLicenseType = item.license_type || item.licenseType
        if (assetLicenseType) return assetLicenseType.replace(/_/g, ' ')
        const firstLicense = (item.licenses && item.licenses.length > 0) ? (item.licenses[0].licenseType || item.licenses[0].license_type) : null
        return firstLicense ? (firstLicense.replace(/_/g, ' ')) : 'N/A'
      case 'installations':
        // Compute totals from licenses and installations when available
        const totalLicenses = item.licenses?.reduce((sum, license) => sum + (license.totalSeats || 0), 0) || 0
        const activeInstallations = Array.isArray(item.installations) ? item.installations.length : (item._count?.installations || 0)
        const available = Math.max(0, totalLicenses - activeInstallations)

        // Show a short list of installed devices (from included sample) and the available count
  const deviceNames = (item.installations || []).map(inst => inst.asset?.name || inst.asset?.assetTag).filter(Boolean)
  const devicePreview = deviceNames.length > 0 ? (deviceNames.slice(0, 2).join(', ') + (deviceNames.length > 2 ? ', …' : '')) : '—'
  const isExpanded = expandedRows.includes(item.id)

        return (
          <div className="flex items-center space-x-4">
            <div className="text-sm text-[#111]">
              <div>Installed: <span className="font-medium">{activeInstallations}</span></div>
              <div className="text-xs text-[#333]">
                <button onClick={() => {
                  if (isExpanded) setExpandedRows(prev => prev.filter(id => id !== item.id))
                  else setExpandedRows(prev => ([...prev, item.id]))
                }} className="underline text-xs text-[#333]">
                  {devicePreview}
                </button>
              </div>
              {isExpanded && (
                <div className="mt-2 text-xs text-[#111] bg-gray-50 p-2 rounded">
                  {deviceNames.length === 0 ? (
                    <div className="text-[#333]">No installed devices in sample.</div>
                  ) : (
                    <ul className="list-disc pl-4">
                      {deviceNames.map((d, i) => <li key={i}>{d}</li>)}
                    </ul>
                  )}
                  <div className="mt-1 text-right">
                    <button onClick={async () => {
                      try {
                        setSelectedSoftwareForInst(item)
                        const result = await assetSoftwareService.getSoftwareInstallations(item.id)
                        setInstallations(result.data || [])
                        setShowInstallModal(true)
                      } catch (error) {
                        console.error('Failed to fetch installations:', error)
                        alert(error?.message || 'Failed to load installations')
                      }
                    }} className="text-xs text-[#111] underline">View full details</button>
                  </div>
                </div>
              )}
            </div>
            <div className="text-sm">
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-[#111]">Available: {available}</span>
            </div>
            <button
              onClick={async () => {
                try {
                  setSelectedSoftwareForInst(item)
                  const result = await assetSoftwareService.getSoftwareInstallations(item.id)
                  setInstallations(result.data || [])
                  setShowInstallModal(true)
                } catch (error) {
                  console.error('Failed to fetch installations:', error)
                  const message = error?.message || (error?.response?.data?.message) || 'Failed to load installations'
                  alert(message)
                }
              }}
              className={`p-1 rounded ${activeInstallations > 0 ? 'text-[#111] hover:scale-110 transition-transform' : 'text-[#333] hover:text-[#333]'}`}
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
        onClick={async () => {
          try {
            const data = await softwareAssetsService.getById(item.id)
            setDetailsData(data)
            setShowDetailsModal(true)
          } catch (err) {
            console.error('Failed to fetch software details', err)
            alert(err?.message || 'Failed to load details')
          }
        }}
        className="text-[#333] hover:text-[#111]"
        title="Details"
      >
        <Info className="w-4 h-4" />
      </button>
      <button
        onClick={() => handleEdit(item)}
        className="text-[#111] hover:scale-110 transition-transform"
      >
        <Edit className="w-4 h-4" />
      </button>
      <button
        onClick={() => {
          setSoftwareAssetToDelete(item)
          setShowDeleteModal(true)
        }}
        className="text-[#111] hover:scale-110 transition-transform"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )

  // Small helper to preview attachments with fallback when image fails to load
  function AttachmentPreview({ url, fileName, isImage }) {
    const [failed, setFailed] = useState(false)

    useEffect(() => {
      setFailed(false)
    }, [url])

    if (failed) {
      return (
        <div className="w-36 h-24 bg-gray-100 flex items-center justify-center rounded text-sm text-[#333]">
          <div className="text-2xl">📄</div>
        </div>
      )
    }

    if (isImage) {
      // Prefer Next.js Image for internal URLs to leverage optimization
      if (typeof url === 'string' && url.startsWith('/')) {
        return (
          <Image src={url} alt={fileName} width={360} height={240} className="object-contain rounded" onError={() => setFailed(true)} />
        )
      }
      // For external URLs (rare), fall back to plain img
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={fileName} className="max-w-xs max-h-48 object-contain rounded" onError={() => setFailed(true)} />
      )
    }

    return (
      <div className="w-36 h-24 bg-gray-50 rounded flex items-center justify-center text-[#333]">📄</div>
    )
  }
  

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
            className="glass-button text-white px-4 py-2 rounded hover:scale-105 transition-transform flex items-center space-x-2"
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
              <div className="text-xs text-[#333] p-2 bg-gray-100 rounded">
                Debug: User role: {user?.role} | Companies count: {companies?.length || 0} | FormData.companyId: {formData.companyId || 'empty'}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#111] mb-1">
                  Company *
                </label>
                {(user?.role === 'ADMIN' || user?.role === 'ASSET_ADMIN' || user?.role === 'TOP_MANAGEMENT') ? (
                  <select
                    value={formData.companyId}
                    onChange={e => setFormData({ ...formData, companyId: e.target.value })}
                    className="w-full p-2 border rounded focus:outline-none focus:border-black/30"
                    required
                  >
                    <option value="">Select Company</option>
                    {(companies || []).map(company => (
                      <option key={company.id} value={company.id}>{company.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={user?.company?.name || ''}
                    className="w-full p-2 border rounded bg-gray-100 text-[#333]"
                    disabled
                  />
                )}
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
                  Software Type *
                </label>
                <select
                  value={formData.softwareType}
                  onChange={(e) => setFormData({ ...formData, softwareType: e.target.value })}
                  className="w-full p-2 border rounded focus:outline-none focus:border-black/30"
                  required
                >
                  <option value="">Select Software Type</option>
                  {(softwareTypes || []).map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#111] mb-1">
                  Version
                </label>
                <input
                  type="text"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  className="w-full p-2 border rounded focus:outline-none focus:border-black/30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#111] mb-1">
                  Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full p-2 border rounded focus:outline-none focus:border-black/30"
                  required
                >
                  <option value="">Select Status</option>
                  {(SOFTWARE_STATUSES || []).map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111] mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2 border rounded focus:outline-none focus:border-black/30 h-24"
                rows={3}
              />
            </div>

            {/* Licenses section - allow multiple licenses */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Licenses</h3>
                <div>
                  <button type="button" onClick={handleAddLicense} className="px-2 py-1 glass-button text-white rounded text-xs">Add License</button>
                </div>
              </div>
              <div className="space-y-3 mt-3">
                {licenses.map((lic, idx) => (
                  <div key={lic.id || idx} className="p-3 border rounded-md">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs">License Type</label>
                        <select value={lic.license_type} onChange={(e) => setLicenses(prev => { const copy = [...prev]; copy[idx].license_type = e.target.value; return copy })} className="w-full p-2 border rounded">
                          {(licenseTypes || []).map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs">License Key</label>
                        <input type="text" value={lic.license_key} onChange={(e) => setLicenses(prev => { const copy = [...prev]; copy[idx].license_key = e.target.value; return copy })} className="w-full p-2 border rounded" />
                      </div>
                      <div className="flex items-end justify-end">
                        <button type="button" onClick={() => handleRemoveLicense(idx)} className="text-[#111] text-sm">Remove</button>
                      </div>
                      <div>
                        <label className="text-xs">Total Seats</label>
                        <input type="number" value={lic.max_installations} onChange={(e) => setLicenses(prev => { const copy = [...prev]; copy[idx].max_installations = e.target.value; return copy })} className="w-full p-2 border rounded" />
                      </div>
                      <div>
                        <label className="text-xs">Used Seats</label>
                        <input type="number" value={lic.current_installations} onChange={(e) => setLicenses(prev => { const copy = [...prev]; copy[idx].current_installations = e.target.value; return copy })} className="w-full p-2 border rounded" />
                      </div>
                      <div>
                        <label className="text-xs">Vendor</label>
                        <select value={lic.vendor_id} onChange={(e) => setLicenses(prev => { const copy = [...prev]; copy[idx].vendor_id = e.target.value; return copy })} className="w-full p-2 border rounded">
                          <option value="">Select Vendor</option>
                          {(vendors || []).map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs">Purchase Date</label>
                        <input type="date" value={lic.purchase_date} onChange={(e) => setLicenses(prev => { const copy = [...prev]; copy[idx].purchase_date = e.target.value; return copy })} className="w-full p-2 border rounded" />
                      </div>
                      <div>
                        <label className="text-xs">Expiry Date</label>
                        <input type="date" value={lic.expiry_date} onChange={(e) => setLicenses(prev => { const copy = [...prev]; copy[idx].expiry_date = e.target.value; return copy })} className="w-full p-2 border rounded" />
                      </div>
                      {/* cost removed as per UX request */}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Attachments upload */}
            <div className="pt-4">
              <label className="block text-sm font-medium text-[#111] mb-1">Attachments</label>
              <input type="file" multiple onChange={handleAttachmentsChange} className="w-full" />
              {attachmentsFiles.length > 0 && (
                <div className="mt-2 text-sm text-[#333]">{attachmentsFiles.length} file(s) selected</div>
              )}
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
            <p className="text-sm text-[#333]">Paste a JSON array of software assets or newline-separated JSON objects. Each object should include at least <code>name</code> and <code>softwareType</code>. Company will be set to your current company unless overridden and allowed.</p>
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
                className="px-4 py-2 text-[#333] bg-gray-100 rounded hover:bg-gray-200"
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

      {/* Installations Modal */}
      {showInstallModal && (
        <Modal title={`Installations - ${selectedSoftwareForInst?.name || ''}`} onClose={() => { setShowInstallModal(false); setInstallations([]); setSelectedSoftwareForInst(null); }}>
          <div className="space-y-3">
            {installations.length === 0 ? (
              <p className="text-sm text-[#333]">No installations found for this software.</p>
            ) : (
              <div className="space-y-2">
                {installations.map(inst => (
                  <div key={inst.id} className="p-3 border rounded-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{inst.asset?.name || 'Unknown asset'}</p>
                        <p className="text-xs text-[#333]">Tag: {inst.asset?.assetTag || '-'}</p>
                        <p className="text-xs text-[#333]">Location: {inst.asset?.location?.name || 'N/A'} • Dept: {inst.asset?.department?.name || 'N/A'}</p>
                      </div>
                      <div className="text-right text-sm text-[#333]">
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

      {/* Details Modal */}
      {showDetailsModal && (
        <Modal title={detailsData?.name || 'Software Details'} onClose={() => { setShowDetailsModal(false); setDetailsData(null) }}>
          {!detailsData ? (
            <div className="p-4">Loading...</div>
          ) : (
            <div className="space-y-3 p-4 bg-white rounded-lg shadow-md text-black">
              {/* Aggregated license/install counts */}
              {(() => {
                const licenses = detailsData.licenses || []
                const totalSeats = licenses.reduce((s, l) => s + (parseInt(l.totalSeats || l.max_installations || 0) || 0), 0)
                const usedSeats = licenses.reduce((s, l) => s + (parseInt(l.usedSeats || l.current_installations || 0) || 0), 0)
                const availableSeats = licenses.reduce((s, l) => s + (parseInt(l.availableSeats || ( (l.totalSeats || l.max_installations || 0) - (l.usedSeats || l.current_installations || 0) )) || 0), 0)
                  return (
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="p-3 bg-gray-50 rounded border border-black/10 text-center">
                      <div className="text-xs text-[#333]">Total Seats</div>
                      <div className="text-lg font-semibold text-black">{totalSeats}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded border border-black/10 text-center">
                      <div className="text-xs text-[#333]">Installed</div>
                      <div className="text-lg font-semibold text-black">{usedSeats}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded border border-black/10 text-center">
                      <div className="text-xs text-[#333]">Available</div>
                      <div className={`text-lg font-semibold ${availableSeats > 0 ? 'text-[#111]' : 'text-[#111]'}`}>{availableSeats}</div>
                    </div>
                  </div>
                )
              })()}
              <div>
                <h3 className="text-sm font-medium">Publisher</h3>
                <div className="text-sm text-[#111]">{detailsData.publisher || '-'}</div>
              </div>

              <div>
                <h3 className="text-sm font-medium">Version</h3>
                <div className="text-sm text-[#111]">{detailsData.version || '-'}</div>
              </div>

              <div>
                <h3 className="text-sm font-medium">Description</h3>
                <div className="text-sm text-[#111]">{detailsData.description || '-'}</div>
              </div>

              <div>
                <h3 className="text-sm font-medium">Licenses</h3>
                {detailsData.licenses && detailsData.licenses.length > 0 ? (
                  <ul className="list-disc pl-4 text-sm text-[#111]">
                    {detailsData.licenses.map(l => (
                      <li key={l.id}>
                        {l.licenseKey || l.license_key || 'Key: N/A'} — Type: {l.licenseType || l.license_type} — Seats: {l.totalSeats || l.max_installations || '-'} — Status: {l.status}
                        {l.expiryDate ? (` — Expiry: ${new Date(l.expiryDate).toLocaleDateString()}`) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-[#333]">No licenses recorded.</div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium">Recent Installations (sample)</h3>
                {detailsData.installations && detailsData.installations.length > 0 ? (
                  <ul className="list-disc pl-4 text-sm text-[#111]">
                    {detailsData.installations.map(inst => (
                      <li key={inst.id}>{inst.asset?.name || inst.asset?.assetTag} — Installed: {new Date(inst.installationDate).toLocaleString()}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-[#333]">No recent installations.</div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium">Attachments</h3>
                {(() => {
                  // Compose base URL for files: API base without trailing /api
                  const API_BASE = (typeof window !== 'undefined' && (window.__NEXT_DATA__ === undefined)) ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api') : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api')
                  const base = API_BASE.replace(/\/api\/?$/, '')

                  // Prefer dirAttachments JSON if set (server stores JSON array of relative paths)
                  let paths = []
                  if (detailsData.dirAttachments) {
                    try { paths = JSON.parse(detailsData.dirAttachments) } catch { if (detailsData.dirAttachments) paths = [detailsData.dirAttachments] }
                  }

                  // Fallback to attachments records
                  if ((!paths || paths.length === 0) && detailsData.attachments && detailsData.attachments.length > 0) {
                    paths = detailsData.attachments.map(a => (`uploads/${a.fileName}`))
                  }

                  if (!paths || paths.length === 0) {
                    return <div className="text-sm text-[#333]">No attachments.</div>
                  }

                  return (
                    <div className="space-y-3">
                      {paths.map((p, idx) => {
                        // Prefer relative URL for uploads so Next.js image host config is not required
                        let url
                        if (p.startsWith('http')) url = p
                        else if (p.startsWith('uploads/')) url = '/' + p.replace(/^\/+/, '')
                        else url = `${base}/${p.replace(/^\/+/, '')}`

                        const fileName = p.split('/').pop()
                        const isImage = /\.(jpe?g|png|gif|webp)$/i.test(p) || (detailsData.attachments && detailsData.attachments[idx] && (detailsData.attachments[idx].mimeType || '').startsWith('image/'))

                        return (
                          <div key={idx} className="border rounded p-2">
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-[#111] truncate max-w-lg">{fileName}</div>
                              <div className="space-x-2">
                                <a href={url} target="_blank" rel="noreferrer" className="text-[#111] underline text-xs">View</a>
                                <a href={url} download className="text-[#333] text-xs">Download</a>
                              </div>
                            </div>
                            <div className="mt-2">
                              <AttachmentPreview url={url} fileName={fileName} isImage={isImage} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}
              </div>
            </div>
          )}
        </Modal>
      )}
    </DashboardLayout>
  )
}