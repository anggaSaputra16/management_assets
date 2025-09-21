'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/lib/api'

export default function CreateRequestPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [assets, setAssets] = useState([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'PURCHASE',
    priority: 'MEDIUM',
    assetId: '',
    justification: '',
    estimatedCost: '',
    expectedDeliveryDate: '',
    specifications: '',
    quantity: 1
  })

  useEffect(() => {
    fetchAssets()
    fetchCategories()
  }, [])

  const fetchAssets = async () => {
    try {
      const response = await api.get('/assets')
      if (response.data.success) {
        setAssets(response.data.data.assets || response.data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch assets:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories')
      if (response.data.success) {
        setCategories(response.data.data.categories || response.data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value ? parseFloat(value) : '') : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.title.trim()) {
      alert('Please enter a title')
      return
    }
    
    if (!formData.description.trim()) {
      alert('Please enter a description')
      return
    }

    if (!formData.justification.trim()) {
      alert('Please provide justification for this request')
      return
    }

    try {
      setLoading(true)
      
      // Prepare request data
      const requestData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: formData.type,
        priority: formData.priority,
        justification: formData.justification.trim(),
        ...(formData.assetId && { assetId: parseInt(formData.assetId) }),
        ...(formData.estimatedCost && { estimatedCost: parseFloat(formData.estimatedCost) }),
        ...(formData.expectedDeliveryDate && { expectedDeliveryDate: formData.expectedDeliveryDate }),
        ...(formData.specifications && { specifications: formData.specifications.trim() }),
        ...(formData.quantity && { quantity: parseInt(formData.quantity) })
      }

      const response = await api.post('/requests', requestData)
      
      if (response.data.success) {
        alert('Request created successfully!')
        router.push('/requests')
      }
    } catch (error) {
      console.error('Failed to create request:', error)
      alert(error.response?.data?.message || 'Failed to create request')
    } finally {
      setLoading(false)
    }
  }

  const requestTypes = [
    { value: 'PURCHASE', label: 'Purchase Request' },
    { value: 'ASSIGNMENT', label: 'Asset Assignment' },
    { value: 'RETURN', label: 'Asset Return' },
    { value: 'REPAIR', label: 'Repair Request' },
    { value: 'REPLACEMENT', label: 'Replacement Request' }
  ]

  const priorities = [
    { value: 'LOW', label: 'Low', color: 'text-gray-600' },
    { value: 'MEDIUM', label: 'Medium', color: 'text-yellow-600' },
    { value: 'HIGH', label: 'High', color: 'text-orange-600' },
    { value: 'URGENT', label: 'Urgent', color: 'text-red-600' }
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/requests')}
            className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Request</h1>
            <p className="text-gray-600">Submit a new asset request for approval</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Request Title *
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter a descriptive title for your request"
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description *
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      rows={4}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Provide detailed description of your request"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                        Request Type *
                      </label>
                      <select
                        id="type"
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {requestTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                        Priority *
                      </label>
                      <select
                        id="priority"
                        name="priority"
                        value={formData.priority}
                        onChange={handleInputChange}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {priorities.map(priority => (
                          <option key={priority.value} value={priority.value}>
                            {priority.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="justification" className="block text-sm font-medium text-gray-700">
                      Business Justification *
                    </label>
                    <textarea
                      id="justification"
                      name="justification"
                      value={formData.justification}
                      onChange={handleInputChange}
                      required
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Explain why this request is necessary for business operations"
                    />
                  </div>
                </div>
              </div>

              {/* Asset & Technical Details */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Asset & Technical Details</h3>
                </div>
                <div className="p-6 space-y-4">
                  {(formData.type === 'ASSIGNMENT' || formData.type === 'RETURN' || formData.type === 'REPAIR' || formData.type === 'REPLACEMENT') && (
                    <div>
                      <label htmlFor="assetId" className="block text-sm font-medium text-gray-700">
                        Select Asset
                      </label>
                      <select
                        id="assetId"
                        name="assetId"
                        value={formData.assetId}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select an asset</option>
                        {assets.map(asset => (
                          <option key={asset.id} value={asset.id}>
                            {asset.name} - {asset.code} ({asset.status})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {formData.type === 'PURCHASE' && (
                    <div>
                      <label htmlFor="specifications" className="block text-sm font-medium text-gray-700">
                        Technical Specifications
                      </label>
                      <textarea
                        id="specifications"
                        name="specifications"
                        value={formData.specifications}
                        onChange={handleInputChange}
                        rows={4}
                        className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="List technical specifications, requirements, and features needed"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {formData.type === 'PURCHASE' && (
                      <div>
                        <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                          Quantity
                        </label>
                        <input
                          type="number"
                          id="quantity"
                          name="quantity"
                          value={formData.quantity}
                          onChange={handleInputChange}
                          min="1"
                          className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    )}

                    <div>
                      <label htmlFor="estimatedCost" className="block text-sm font-medium text-gray-700">
                        Estimated Cost (IDR)
                      </label>
                      <input
                        type="number"
                        id="estimatedCost"
                        name="estimatedCost"
                        value={formData.estimatedCost}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label htmlFor="expectedDeliveryDate" className="block text-sm font-medium text-gray-700">
                        Expected Delivery Date
                      </label>
                      <input
                        type="date"
                        id="expectedDeliveryDate"
                        name="expectedDeliveryDate"
                        value={formData.expectedDeliveryDate}
                        onChange={handleInputChange}
                        min={new Date().toISOString().split('T')[0]}
                        className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => router.push('/requests')}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Request'}
                </button>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Request Guidelines */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Request Guidelines</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4 text-sm text-gray-600">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Request Types:</h4>
                      <ul className="space-y-1">
                        <li><strong>Purchase:</strong> New asset acquisition</li>
                        <li><strong>Assignment:</strong> Assign existing asset</li>
                        <li><strong>Return:</strong> Return assigned asset</li>
                        <li><strong>Repair:</strong> Asset maintenance/repair</li>
                        <li><strong>Replacement:</strong> Replace damaged asset</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Priority Levels:</h4>
                      <ul className="space-y-1">
                        <li><span className="text-gray-600">Low:</span> Standard business need</li>
                        <li><span className="text-yellow-600">Medium:</span> Important for operations</li>
                        <li><span className="text-orange-600">High:</span> Critical business impact</li>
                        <li><span className="text-red-600">Urgent:</span> Immediate action required</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Tips for Approval:</h4>
                      <ul className="space-y-1">
                        <li>• Provide clear business justification</li>
                        <li>• Include accurate cost estimates</li>
                        <li>• Specify technical requirements</li>
                        <li>• Set realistic delivery expectations</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Requester Info */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Requester Information</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Name:</span>
                      <p className="text-gray-900">{user?.firstName} {user?.lastName}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Email:</span>
                      <p className="text-gray-900">{user?.email}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Department:</span>
                      <p className="text-gray-900">{user?.department?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Role:</span>
                      <p className="text-gray-900">{user?.role}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Request Preview */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Request Preview</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Type:</span>
                      <p className="text-gray-900">{requestTypes.find(t => t.value === formData.type)?.label}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Priority:</span>
                      <p className={priorities.find(p => p.value === formData.priority)?.color}>
                        {priorities.find(p => p.value === formData.priority)?.label}
                      </p>
                    </div>
                    {formData.estimatedCost && (
                      <div>
                        <span className="font-medium text-gray-700">Est. Cost:</span>
                        <p className="text-gray-900">
                          {new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR'
                          }).format(formData.estimatedCost)}
                        </p>
                      </div>
                    )}
                    {formData.expectedDeliveryDate && (
                      <div>
                        <span className="font-medium text-gray-700">Expected Date:</span>
                        <p className="text-gray-900">
                          {new Date(formData.expectedDeliveryDate).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
