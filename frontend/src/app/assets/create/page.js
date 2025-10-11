'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Package, ArrowLeft } from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import AssetSpecifications from '@/components/AssetSpecifications'
import { api } from '@/lib/api'

export default function CreateAssetPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [locations, setLocations] = useState([])
  const [vendors, setVendors] = useState([])
  const [departments, setDepartments] = useState([])
  const [companies, setCompanies] = useState([])
  const [users, setUsers] = useState([])
  const [softwareAssets, setSoftwareAssets] = useState([])
  
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
    assignedToId: '',
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
        const [categoriesRes, locationsRes, vendorsRes, departmentsRes, usersRes, softwareRes] = await Promise.all([
          api.get('/categories'),
          api.get('/locations'),
          api.get('/vendors'),
          api.get('/departments'),
          api.get('/users'),
          api.get('/software-assets')
        ])

        setCategories(categoriesRes.data?.data?.categories || [])
        setLocations(locationsRes.data?.data?.locations || [])
        setVendors(vendorsRes.data?.data?.vendors || [])
        setDepartments(departmentsRes.data?.data?.departments || [])
        setUsers(usersRes.data?.data?.users || [])
        setSoftwareAssets(softwareRes.data?.data?.softwareAssets || [])
      } catch (error) {
        console.error('Failed to fetch master data:', error)
        alert('Failed to load form data. Please refresh the page.')
      }
    }

    fetchMasterData()
  }, [])

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

  // Handle software selection
  const handleSoftwareChange = (e) => {
    const value = e.target.value
    if (value && !formData.requiredSoftwareIds.includes(value)) {
      setFormData(prev => ({
        ...prev,
        requiredSoftwareIds: [...prev.requiredSoftwareIds, value]
      }))
    }
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
      attachments.forEach((file, index) => {
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
        alert('Asset created successfully!')
        router.push('/assets')
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
            className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create New Asset</h1>
              <p className="text-gray-600">Add a new asset to the system</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Asset Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asset Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-500"
                  placeholder="Enter asset name"
                  required
                />
              </div>

              {/* Asset Tag */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asset Tag *
                </label>
                <input
                  type="text"
                  name="assetTag"
                  value={formData.assetTag}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-500"
                  placeholder="Enter asset tag (e.g., AST-001)"
                  required
                />
              </div>

              {/* Serial Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Serial Number
                </label>
                <input
                  type="text"
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-500"
                  placeholder="Enter serial number"
                />
              </div>

              {/* PO Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PO Number
                </label>
                <input
                  type="text"
                  name="poNumber"
                  value={formData.poNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-500"
                  placeholder="Enter purchase order number"
                />
              </div>

              {/* Model */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Model
                </label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-500"
                  placeholder="Enter asset model"
                />
              </div>

              {/* Brand */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand
                </label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-500"
                  placeholder="Enter asset brand"
                />
              </div> 

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  required
                >
                  <option value="" className="text-gray-500">Select Category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id} className="text-gray-900">
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <select
                  name="locationId"
                  value={formData.locationId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  required
                >
                  <option value="" className="text-gray-500">Select Location</option>
                  {locations.map(location => (
                    <option key={location.id} value={location.id} className="text-gray-900">
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vendor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vendor
                </label>
                <select
                  name="vendorId"
                  value={formData.vendorId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                >
                  <option value="" className="text-gray-500">Select Vendor</option>
                  {vendors.map(vendor => (
                    <option key={vendor.id} value={vendor.id} className="text-gray-900">
                      {vendor.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <select
                  name="departmentId"
                  value={formData.departmentId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                >
                  <option value="" className="text-gray-500">Select Department</option>
                  {departments.map(department => (
                    <option key={department.id} value={department.id} className="text-gray-900">
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assigned To User */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign to User
                </label>
                <select
                  name="assignedToId"
                  value={formData.assignedToId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                >
                  <option value="" className="text-gray-500">Select User (Optional)</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id} className="text-gray-900">
                      {user.firstName} {user.lastName} - {user.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Asset Condition */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condition
                </label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                >
                  <option value="" className="text-gray-500">Select Condition</option>
                  <option value="EXCELLENT">Excellent</option>
                  <option value="GOOD">Good</option>
                  <option value="FAIR">Fair</option>
                  <option value="POOR">Poor</option>
                  <option value="DAMAGED">Damaged</option>
                </select>
              </div>

              {/* Asset Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="IN_USE">In Use</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="RETIRED">Retired</option>
                </select>
              </div>

              {/* Purchase Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purchase Price (IDR) *
                </label>
                <input
                  type="number"
                  name="purchasePrice"
                  value={formData.purchasePrice}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-500"
                  placeholder="Enter purchase price"
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Current Value */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Value (IDR) *
                </label>
                <input
                  type="number"
                  name="currentValue"
                  value={formData.currentValue}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-500"
                  placeholder="Enter current value"
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Purchase Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purchase Date *
                </label>
                <input
                  type="date"
                  name="purchaseDate"
                  value={formData.purchaseDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  required
                />
              </div>

              {/* Warranty Expiry */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Warranty Expiry
                </label>
                <input
                  type="date"
                  name="warrantyExpiry"
                  value={formData.warrantyExpiry}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                />
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-500 resize-vertical"
                  placeholder="Additional notes about the asset..."
                />
              </div>
            </div>

            {/* File Upload Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Asset Attachments</h3>
              
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Images or Documents
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Upload asset images, manuals, warranty documents, or invoices. Max 5 files, 10MB each.
                </p>
                
                {/* File Preview */}
                {attachments.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Files:</h4>
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
                                <span className="text-xs text-gray-500">
                                  {file.name.split('.').pop()?.toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-900">{file.name}</p>
                              <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
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
              <h3 className="text-lg font-medium text-gray-900">Required Software</h3>
              
              {/* Software Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Required Software
                </label>
                <select
                  value=""
                  onChange={handleSoftwareChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                >
                  <option value="">Choose software to add...</option>
                  {softwareAssets.filter(software => 
                    !formData.requiredSoftwareIds.includes(software.id)
                  ).map(software => (
                    <option key={software.id} value={software.id} className="text-gray-900">
                      {software.name} {software.version ? `v${software.version}` : ''}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  Select software that should be installed on this asset. Only applicable for devices that support software installation.
                </p>
              </div>

              {/* Selected Software List */}
              {formData.requiredSoftwareIds.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Software:</h4>
                  <div className="space-y-2">
                    {formData.requiredSoftwareIds.map(softwareId => {
                      const software = softwareAssets.find(s => s.id === softwareId)
                      return software ? (
                        <div key={softwareId} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div>
                            <h5 className="text-sm font-medium text-gray-900">{software.name}</h5>
                            <p className="text-xs text-gray-500">
                              {software.version ? `Version ${software.version}` : 'No version specified'} • 
                              {software.publisher ? ` ${software.publisher}` : ''}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeSoftware(softwareId)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      ) : null
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-500 resize-vertical"
                placeholder="Enter asset description, specifications, or other relevant details..."
              />
            </div>

            {/* Asset Specifications */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Asset'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}
