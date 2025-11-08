'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Package, ArrowLeft } from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import AssetSpecifications from '@/components/AssetSpecifications'
import { api } from '@/lib/api'
import useEnumStore from '@/stores/enumStore'

export default function CreateAssetPage() {
  const router = useRouter()
  const enumStore = useEnumStore()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [locations, setLocations] = useState([])
  const [vendors, setVendors] = useState([])
  const [departments, setDepartments] = useState([])
  const [companies, setCompanies] = useState([])
  const [employees, setEmployees] = useState([])
  const [softwareAssets, setSoftwareAssets] = useState([])
  const [softwareSearch, setSoftwareSearch] = useState('')
  const [installSummary, setInstallSummary] = useState(null)
  const [showInstallSummary, setShowInstallSummary] = useState(false)
  
  // File upload states
  const [attachments, setAttachments] = useState([])
  const [attachmentPreviews, setAttachmentPreviews] = useState([])
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    assetTag: '',
    serialNumber: '',
    poNumber: '',
    model: '',
    brand: '',
    categoryId: '',
    locationId: '',
    vendorId: '',
    departmentId: '',
    companyId: '',
  assignedEmployeeId: '',
    purchasePrice: '',
    currentValue: '',
    purchaseDate: '',
    warrantyExpiry: '',
    condition: '',
    status: 'AVAILABLE',
    notes: '',
    requiredSoftwareIds: [],
    specifications: {}
  })

  // Fetch master data on component mount
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        // Initialize enums
        await enumStore.initializeEnums()
        
        // Fetch other master data
        const [categoriesRes, locationsRes, vendorsRes, departmentsRes, employeesRes, softwareRes, companiesRes] = await Promise.all([
          api.get('/categories'),
          api.get('/locations'),
          api.get('/vendors'),
          api.get('/departments'),
          api.get('/employees'),
          api.get('/software-assets'),
          api.get('/companies')
        ])

        setCategories(categoriesRes.data?.data?.categories || [])
        setLocations(locationsRes.data?.data?.locations || [])
        setVendors(vendorsRes.data?.data?.vendors || [])
  setDepartments(departmentsRes.data?.data?.departments || [])
  setEmployees(employeesRes.data?.data?.employees || employeesRes.data?.data || [])
        // backend returns an array in data for software-assets; support both shapes
        setSoftwareAssets(softwareRes.data?.data?.softwareAssets || softwareRes.data?.data || [])
        setCompanies(companiesRes.data?.data?.companies || [])
      } catch (error) {
        console.error('Failed to fetch master data:', error)
        alert('Failed to load form data. Please refresh the page.')
      }
    }

    fetchMasterData()
  }, [enumStore])

  // Handle file upload
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    setAttachments(files)
    
    // Create preview for images
    const previews = files.map(file => {
      if (file.type.startsWith('image/')) {
        return URL.createObjectURL(file)
      }
      return null
    })
    setAttachmentPreviews(previews)
  }

  // Handle software selection (add one software at a time)
  const handleSoftwareChange = (value) => {
    if (!value) return
    if (value && !formData.requiredSoftwareIds.includes(value)) {
      setFormData(prev => ({
        ...prev,
        requiredSoftwareIds: [...prev.requiredSoftwareIds, value]
      }))
    }
    // reset search so dropdown closes
    setSoftwareSearch('')
  }

  // Remove software from selection
  const removeSoftware = (softwareId) => {
    setFormData(prev => ({
      ...prev,
      requiredSoftwareIds: prev.requiredSoftwareIds.filter(id => id !== softwareId)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Create FormData for file upload
      const formDataToSend = new FormData()
      
      // Add form fields
      Object.keys(formData).forEach(key => {
        if (key === 'requiredSoftwareIds') {
          formDataToSend.append(key, JSON.stringify(formData[key]))
        } else if (key === 'specifications') {
          formDataToSend.append(key, JSON.stringify(formData[key] || {}))
        } else if (formData[key] !== '' && formData[key] !== null) {
          formDataToSend.append(key, formData[key])
        }
      })
      
      // Add attachment files
      attachments.forEach(file => {
        formDataToSend.append('attachments', file)
      })
      
      // Add attachment descriptions
      const attachmentDescriptions = attachments.map(file => file.name)
      formDataToSend.append('attachmentDescriptions', JSON.stringify(attachmentDescriptions))

      console.log('Creating asset with files:', attachments.length)

      const response = await api.post('/assets', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data.success) {
        // After creation, fetch actual installations for this asset to show summary
        const createdAsset = response.data.data
        let installations = []
        try {
          const instRes = await api.get(`/asset-software/asset/${createdAsset.id}`)
          installations = instRes.data?.data || []
        } catch (err) {
          console.warn('Failed to fetch installations for asset:', err)
        }

        const installedIds = installations.map(i => i.softwareAsset?.id || i.softwareAssetId).filter(Boolean)
        const required = Array.isArray(formData.requiredSoftwareIds) ? formData.requiredSoftwareIds : []
        const installed = required.filter(id => installedIds.includes(id))
        const failed = required.filter(id => !installedIds.includes(id))

        setInstallSummary({ installed, failed, installations })
        setShowInstallSummary(true)
      }
    } catch (error) {
      console.error('Failed to create asset:', error)
      alert(error.response?.data?.message || 'Failed to create asset')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-[#333] hover:text-[#111] rounded-lg hover:bg-white/40"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/60 rounded-lg">
              <Package className="h-6 w-6 text-[#111]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#111]">Create New Asset</h1>
              <p className="text-[#333]">Add a new asset to the system</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="glass-card shadow">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Asset Name */}
              <div>
                <label className="block text-sm font-medium text-[#111] mb-2">
                  Asset Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black/30 text-[#111] bg-white placeholder-[#666]"
                  placeholder="Enter asset name"
                  required
                />
              </div>

              {/* Asset Tag */}
              <div>
                <label className="block text-sm font-medium text-[#111] mb-2">
                  Asset Tag *
                </label>
                <input
                  type="text"
                  name="assetTag"
                  value={formData.assetTag}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black/30 text-[#111] bg-white placeholder-[#666]"
                  placeholder="Enter asset tag (e.g., AST-001)"
                  required
                />
              </div>

              {/* Serial Number */}
              <div>
                <label className="block text-sm font-medium text-[#111] mb-2">
                  Serial Number
                </label>
                <input
                  type="text"
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black/30 text-[#111] bg-white placeholder-[#666]"
                  placeholder="Enter serial number"
                />
              </div>

              {/* PO Number */}
              <div>
                <label className="block text-sm font-medium text-[#111] mb-2">
                  PO Number
                </label>
                <input
                  type="text"
                  name="poNumber"
                  value={formData.poNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black/30 text-[#111] bg-white placeholder-[#666]"
                  placeholder="Enter purchase order number"
                />
              </div>

              {/* Model */}
              <div>
                <label className="block text-sm font-medium text-[#111] mb-2">
                  Model
                </label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black/30 text-[#111] bg-white placeholder-[#666]"
                  placeholder="Enter asset model"
                />
              </div>

              {/* Brand */}
              <div>
                <label className="block text-sm font-medium text-[#111] mb-2">
                  Brand
                </label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black/30 text-[#111] bg-white placeholder-[#666]"
                  placeholder="Enter asset brand"
                />
              </div> 

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-[#111] mb-2">
                  Category *
                </label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black/30 text-[#111] bg-white"
                  required
                >
                  <option value="" className="text-[#333]">Select Category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id} className="text-[#111]">
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Company */}
              <div>
                <label className="block text-sm font-medium text-[#111] mb-2">
                  Company *
                </label>
                <select
                  name="companyId"
                  value={formData.companyId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black/30 text-[#111] bg-white"
                  required
                >
                  <option value="" className="text-[#333]">Select Company</option>
                  {companies.map(company => (
                    <option key={company.id} value={company.id} className="text-[#111]">
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-[#111] mb-2">
                  Location *
                </label>
                <select
                  name="locationId"
                  value={formData.locationId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black/30 text-[#111] bg-white"
                  required
                >
                  <option value="" className="text-[#333]">Select Location</option>
                  {locations.map(location => (
                    <option key={location.id} value={location.id} className="text-[#111]">
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vendor */}
              <div>
                <label className="block text-sm font-medium text-[#111] mb-2">
                  Vendor
                </label>
                <select
                  name="vendorId"
                  value={formData.vendorId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black/30 text-[#111] bg-white"
                >
                  <option value="" className="text-[#333]">Select Vendor</option>
                  {vendors.map(vendor => (
                    <option key={vendor.id} value={vendor.id} className="text-[#111]">
                      {vendor.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-[#111] mb-2">
                  Department
                </label>
                <select
                  name="departmentId"
                  value={formData.departmentId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black/30 text-[#111] bg-white"
                >
                  <option value="" className="text-[#333]">Select Department</option>
                  {departments.map(department => (
                    <option key={department.id} value={department.id} className="text-[#111]">
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assigned To Employee */}
              <div>
                <label className="block text-sm font-medium text-[#111] mb-2">
                  Assign to Employee (Optional)
                </label>
                <select
                  name="assignedEmployeeId"
                  value={formData.assignedEmployeeId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black/30 text-[#111] bg-white"
                >
                  <option value="" className="text-[#333]">Select Employee (Optional)</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id} className="text-[#111]">
                      {emp.firstName} {emp.lastName} {emp.npk ? ` - ${emp.npk}` : ''} {emp.position ? `(${emp.position})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Asset Condition */}
              <div>
                <label className="block text-sm font-medium text-[#111] mb-2">
                  Condition
                </label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black/30 text-[#111] bg-white"
                >
                  <option value="" className="text-[#333]">Select Condition</option>
                  {enumStore.assetConditions.map(condition => (
                    <option key={condition.value} value={condition.value} className="text-[#111]">
                      {condition.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Asset Status */}
              <div>
                <label className="block text-sm font-medium text-[#111] mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black/30 text-[#111] bg-white"
                >
                  {enumStore.assetStatuses.map(status => (
                    <option key={status.value} value={status.value} className="text-[#111]">
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Purchase Price */}
              <div>
                <label className="block text-sm font-medium text-[#111] mb-2">
                  Purchase Price (IDR) *
                </label>
                <input
                  type="number"
                  name="purchasePrice"
                  value={formData.purchasePrice}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black/30 text-[#111] bg-white placeholder-[#666]"
                  placeholder="Enter purchase price"
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Current Value */}
              <div>
                <label className="block text-sm font-medium text-[#111] mb-2">
                  Current Value (IDR) *
                </label>
                <input
                  type="number"
                  name="currentValue"
                  value={formData.currentValue}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black/30 text-[#111] bg-white placeholder-[#666]"
                  placeholder="Enter current value"
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Purchase Date */}
              <div>
                <label className="block text-sm font-medium text-[#111] mb-2">
                  Purchase Date *
                </label>
                <input
                  type="date"
                  name="purchaseDate"
                  value={formData.purchaseDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black/30 text-[#111] bg-white"
                  required
                />
              </div>

              {/* Warranty Expiry */}
              <div>
                <label className="block text-sm font-medium text-[#111] mb-2">
                  Warranty Expiry
                </label>
                <input
                  type="date"
                  name="warrantyExpiry"
                  value={formData.warrantyExpiry}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black/30 text-[#111] bg-white"
                />
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#111] mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black/30 text-[#111] bg-white placeholder-[#666] resize-vertical"
                  placeholder="Additional notes about the asset..."
                />
              </div>
            </div>

            {/* File Upload Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-[#111]">Asset Attachments</h3>
              
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-[#111] mb-2">
                  Upload Images or Documents
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black/30 text-[#111] bg-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white/60 file:text-[#111] hover:file:bg-white/60"
                />
                <p className="mt-1 text-sm text-[#333]">
                  Upload asset images, manuals, warranty documents, or invoices. Max 5 files, 10MB each.
                </p>
                
                {/* File Preview */}
                {attachments.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-[#111] mb-2">Selected Files:</h4>
                    <div className="space-y-2">
                      {attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            {attachmentPreviews[index] ? (
                              <img 
                                src={attachmentPreviews[index]} 
                                alt="Preview" 
                                className="w-12 h-12 object-cover rounded"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                                <span className="text-xs text-[#333]">
                                  {file.name.split('.').pop()?.toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium text-[#111]">{file.name}</p>
                              <p className="text-xs text-[#333]">{(file.size / 1024).toFixed(1)} KB</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Required Software Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-[#111]">Required Software</h3>
                <a
                  href="/master/software-assets"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-[#111] hover:underline"
                >
                  Add / Manage Software
                </a>
              </div>
              
              {/* Software Selection (searchable multi-add) */}
              <div>
                <label className="block text-sm font-medium text-[#111] mb-2">
                  Select Required Software
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search software..."
                    value={softwareSearch}
                    onChange={(e) => setSoftwareSearch(e.target.value)}
                    className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black/30 text-[#111] bg-white"
                  />
                  {softwareSearch && (
                    <div className="absolute z-40 mt-1 w-full bg-white border border-black/10 rounded-lg shadow max-h-60 overflow-auto">
                      {softwareAssets
                        .filter(sa => !formData.requiredSoftwareIds.includes(sa.id))
                        .filter(sa => sa.name.toLowerCase().includes(softwareSearch.toLowerCase()) || (sa.publisher || '').toLowerCase().includes(softwareSearch.toLowerCase()))
                        .slice(0, 50)
                        .map(sa => {
                          // compute available seats
                          const totalSeats = (sa.licenses || []).reduce((s, l) => s + (l.totalSeats || 0), 0)
                          const activeInst = (sa._count && sa._count.installations) || 0
                          const available = (sa.max_installations || null) !== null
                            ? (sa.max_installations - (sa.current_installations || 0))
                            : (totalSeats - activeInst)
                          return (
                            <button
                              key={sa.id}
                              type="button"
                              onClick={() => { handleSoftwareChange(sa.id); setSoftwareSearch('') }}
                              className="w-full text-left p-2 hover:bg-white/40 flex items-center justify-between"
                            >
                              <div>
                                <div className="text-sm font-medium text-[#111]">{sa.name} {sa.version ? `v${sa.version}` : ''}</div>
                                <div className="text-xs text-[#333]">{sa.publisher || ''}</div>
                              </div>
                              <div className="text-xs">
                                {available <= 0 ? (
                                  <span className="text-[#111] font-medium">No licenses</span>
                                ) : (
                                  <span className="text-[#111]">{available} available</span>
                                )}
                              </div>
                            </button>
                          )
                        })}
                      {softwareAssets.filter(sa => !formData.requiredSoftwareIds.includes(sa.id)).filter(sa => sa.name.toLowerCase().includes(softwareSearch.toLowerCase()) || (sa.publisher || '').toLowerCase().includes(softwareSearch.toLowerCase())).length === 0 && (
                        <div className="p-3 text-sm text-[#333]">No matching software</div>
                      )}
                    </div>
                  )}
                </div>
                <p className="mt-1 text-sm text-[#333]">Search and add software that should be installed on this asset. Supports multiple selections.</p>
              </div>

              {/* Selected Software List with per-item availability warning */}
              {formData.requiredSoftwareIds.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-[#111] mb-2">Selected Software:</h4>
                  <div className="space-y-2">
                    {formData.requiredSoftwareIds.map(softwareId => {
                      const software = softwareAssets.find(s => s.id === softwareId)
                      if (!software) return null
                      const totalSeats = (software.licenses || []).reduce((s, l) => s + (l.totalSeats || 0), 0)
                      const activeInst = (software._count && software._count.installations) || 0
                      const available = (software.max_installations || null) !== null
                        ? (software.max_installations - (software.current_installations || 0))
                        : (totalSeats - activeInst)

                      return (
                        <div key={softwareId} className="flex items-center justify-between p-3 bg-white/60 rounded-lg">
                          <div>
                            <h5 className="text-sm font-medium text-[#111]">{software.name}</h5>
                            <p className="text-xs text-[#333]">{software.version ? `Version ${software.version}` : 'No version specified'}{software.publisher ? ` • ${software.publisher}` : ''}</p>
                            {available <= 0 && (
                              <p className="text-xs text-[#111] mt-1">Warning: No available licenses for this software. Installation will be skipped automatically.</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-3">
                            <button type="button" onClick={() => removeSoftware(softwareId)} className="text-[#111] hover:scale-110 transition-transform text-sm font-medium">Remove</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[#111] mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black/30 text-[#111] bg-white placeholder-[#666] resize-vertical"
                placeholder="Enter asset description, specifications, or other relevant details..."
              />
            </div>

            {/* Asset Specifications */}
            <div>
              <label className="block text-sm font-medium text-[#111] mb-2">
                Specifications
              </label>
              <AssetSpecifications
                asset={{ specifications: formData.specifications }}
                onUpdate={(updates) => setFormData(prev => ({ ...prev, specifications: updates.specifications }))}
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 text-[#111] bg-gray-100 rounded-lg hover:bg-gray-200"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 glass-button text-white rounded-lg hover:scale-105 transition-transform disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Asset'}
              </button>
            </div>
          </form>
        </div>
      </div>
      {/* Install summary modal */}
      {showInstallSummary && installSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-40" onClick={() => setShowInstallSummary(false)} />
          <div className="glass-card shadow-lg z-60 w-full max-w-2xl p-6">
            <h3 className="text-lg font-bold mb-4">Software Installation Summary</h3>
            <div className="space-y-4 max-h-72 overflow-auto">
              <div>
                <h4 className="font-medium">Installed</h4>
                {installSummary.installed && installSummary.installed.length > 0 ? (
                  <ul className="list-disc list-inside text-sm text-[#111]">
                    {installSummary.installed.map(id => {
                      const s = softwareAssets.find(x => x.id === id)
                      return <li key={id}>{s ? `${s.name} ${s.version ? `v${s.version}` : ''}` : id}</li>
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-[#333]">No software was installed.</p>
                )}
              </div>

              <div>
                <h4 className="font-medium">Failed / Skipped (no available licenses)</h4>
                {installSummary.failed && installSummary.failed.length > 0 ? (
                  <ul className="list-disc list-inside text-sm text-[#111]">
                    {installSummary.failed.map(id => {
                      const s = softwareAssets.find(x => x.id === id)
                      return <li key={id}>{s ? `${s.name} ${s.version ? `v${s.version}` : ''}` : id}</li>
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-[#333]">No failures.</p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button type="button" onClick={() => setShowInstallSummary(false)} className="px-4 py-2 bg-gray-100 rounded">Close</button>
              <button type="button" onClick={() => router.push('/assets')} className="px-4 py-2 glass-button text-white rounded">Go to Assets</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
