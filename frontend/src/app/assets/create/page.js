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
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    assetTag: '',
    serialNumber: '',
    poNumber: '',
    categoryId: '',
    locationId: '',
    vendorId: '',
    departmentId: '',
    purchasePrice: '',
    currentValue: '',
    purchaseDate: '',
    warrantyExpiry: '',
    specifications: {}
  })

  // Fetch master data on component mount
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [categoriesRes, locationsRes, vendorsRes, departmentsRes] = await Promise.all([
          api.get('/categories'),
          api.get('/locations'),
          api.get('/vendors'),
          api.get('/departments')
        ])

        setCategories(categoriesRes.data?.data?.categories || [])
        setLocations(locationsRes.data?.data?.locations || [])
        setVendors(vendorsRes.data?.data?.vendors || [])
        setDepartments(departmentsRes.data?.data?.departments || [])
      } catch (error) {
        console.error('Failed to fetch master data:', error)
        alert('Failed to load form data. Please refresh the page.')
      }
    }

    fetchMasterData()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        ...formData,
        purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : null,
        currentValue: formData.currentValue ? parseFloat(formData.currentValue) : null,
        purchaseDate: formData.purchaseDate ? new Date(formData.purchaseDate).toISOString() : null,
        warrantyExpiry: formData.warrantyExpiry ? new Date(formData.warrantyExpiry).toISOString() : null,
        // Include specifications in the payload
        specifications: formData.specifications || {}
      }

      console.log('Creating asset with payload:', payload)

      const response = await api.post('/assets', payload)

      if (response.data.success) {
        alert('Asset created successfully!')
        router.push('/assets')
      }
    } catch (error) {
      console.error('Error creating asset:', error)
      const errorMessage = error.response?.data?.message || 'Failed to create asset. Please try again.'
      alert(`Error: ${errorMessage}`)
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
