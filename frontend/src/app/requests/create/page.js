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
  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [locations, setLocations] = useState([])
  const [categories, setCategories] = useState([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'MAINTENANCE_REQUEST',
    maintenanceType: 'CORRECTIVE',
    priority: 'MEDIUM',
    assetId: '',
    employeeId: '',
    justification: '',
    expectedDeliveryDate: '',
    quantity: 1
  })

  useEffect(() => {
    fetchAssets()
    fetchEmployees()
    fetchDepartments()
    fetchLocations()
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

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/employees')
      if (response.data.success) {
        setEmployees(response.data.data.employees || response.data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error)
    }
  }

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments')
      if (response.data.success) {
        setDepartments(response.data.data.departments || response.data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error)
    }
  }

  const fetchLocations = async () => {
    try {
      const response = await api.get('/locations')
      if (response.data.success) {
        setLocations(response.data.data.locations || response.data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error)
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
        requestType: formData.type,
        title: formData.title.trim(),
        description: formData.description.trim(),
        justification: formData.justification.trim(),
        priority: formData.priority,
        ...(formData.assetId && { assetId: formData.assetId }),
        // Note: maintenanceType is NOT sent with request - it will be specified when creating MaintenanceRecord after approval
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

  // Only 2 request types: Maintenance (includes upgrade) and Decomposition (includes disposal)
  const requestTypes = [
    { value: 'MAINTENANCE_REQUEST', label: 'Maintenance' },
    { value: 'ASSET_BREAKDOWN', label: 'Decomposition' }
  ]

  // Maintenance types - shown only when requestType is MAINTENANCE_REQUEST
  const maintenanceTypes = [
    { value: 'PREVENTIVE', label: 'Preventive' },
    { value: 'CORRECTIVE', label: 'Corrective' },
    { value: 'EMERGENCY', label: 'Emergency' },
    { value: 'SPARE_PART_REPLACEMENT', label: 'Upgrade / Spare Part Replacement' },
    { value: 'SOFTWARE_UPDATE', label: 'Software Update' },
    { value: 'CALIBRATION', label: 'Calibration' }
  ]

  const priorities = [
    { value: 'LOW', label: 'Low', color: 'text-[#333]' },
    { value: 'MEDIUM', label: 'Medium', color: 'text-[#111]' },
    { value: 'HIGH', label: 'High', color: 'text-[#111]' },
    { value: 'URGENT', label: 'Urgent', color: 'text-[#111]' }
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
            <h1 className="text-2xl font-bold text-[#111]">Create New Request</h1>
            <p className="text-[#333]">Submit a new asset request for approval</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <div className="glass-card shadow">
                <div className="px-6 py-4 border-b border-black/10">
                  <h3 className="text-lg font-medium text-[#111]">Basic Information</h3>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-[#111]">
                      Request Title *
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full glass-input rounded-lg px-3 py-2 text-[#111] focus:ring-2 focus:ring-black/20 focus:border-black/30"
                      placeholder="Enter a descriptive title for your request"
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-[#111]">
                      Description *
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      rows={4}
                      className="mt-1 block w-full glass-input rounded-lg px-3 py-2 text-[#111] focus:ring-2 focus:ring-black/20 focus:border-black/30"
                      placeholder="Provide detailed description of your request"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="type" className="block text-sm font-medium text-[#111]">
                        Request Type *
                      </label>
                      <select
                        id="type"
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        required
                        className="mt-1 block w-full glass-input rounded-lg px-3 py-2 text-[#111] focus:ring-2 focus:ring-black/20 focus:border-black/30"
                      >
                        {requestTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="priority" className="block text-sm font-medium text-[#111]">
                        Priority *
                      </label>
                      <select
                        id="priority"
                        name="priority"
                        value={formData.priority}
                        onChange={handleInputChange}
                        required
                        className="mt-1 block w-full glass-input rounded-lg px-3 py-2 text-[#111] focus:ring-2 focus:ring-black/20 focus:border-black/30"
                      >
                        {priorities.map(priority => (
                          <option key={priority.value} value={priority.value}>
                            {priority.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Maintenance Type - Only shown for MAINTENANCE_REQUEST */}
                  {formData.type === 'MAINTENANCE_REQUEST' && (
                    <div>
                      <label htmlFor="maintenanceType" className="block text-sm font-medium text-[#111]">
                        Maintenance Type *
                      </label>
                      <select
                        id="maintenanceType"
                        name="maintenanceType"
                        value={formData.maintenanceType}
                        onChange={handleInputChange}
                        required
                        className="mt-1 block w-full glass-input rounded-lg px-3 py-2 text-[#111] focus:ring-2 focus:ring-black/20 focus:border-black/30"
                      >
                        {maintenanceTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-xs text-[#555]">
                        Note: &quot;Upgrade / Spare Part Replacement&quot; includes hardware and software upgrades
                      </p>
                    </div>
                  )}

                  <div>
                    <label htmlFor="justification" className="block text-sm font-medium text-[#111]">
                      Business Justification *
                    </label>
                    <textarea
                      id="justification"
                      name="justification"
                      value={formData.justification}
                      onChange={handleInputChange}
                      required
                      rows={3}
                      className="mt-1 block w-full glass-input rounded-lg px-3 py-2 text-[#111] focus:ring-2 focus:ring-black/20 focus:border-black/30"
                      placeholder="Explain why this request is necessary for business operations"
                    />
                  </div>
                </div>
              </div>

              {/* Asset & Technical Details */}
              <div className="glass-card shadow">
                <div className="px-6 py-4 border-b border-black/10">
                  <h3 className="text-lg font-medium text-[#111]">Asset & Assignment Details</h3>
                </div>
                <div className="p-6 space-y-4">
                  {/* Asset Selector - shown for both MAINTENANCE_REQUEST and ASSET_BREAKDOWN */}
                  <div>
                    <label htmlFor="assetId" className="block text-sm font-medium text-[#111]">
                      Select Asset {formData.type === 'ASSET_BREAKDOWN' ? '(for Decomposition) *' : ''}
                    </label>
                    <select
                      id="assetId"
                      name="assetId"
                      value={formData.assetId}
                      onChange={handleInputChange}
                      required={formData.type === 'ASSET_BREAKDOWN'}
                      className="mt-1 block w-full glass-input rounded-lg px-3 py-2 text-[#111] focus:ring-2 focus:ring-black/20 focus:border-black/30"
                    >
                      <option value="">Select an asset</option>
                      {assets.map(asset => (
                        <option key={asset.id} value={asset.id}>
                          {asset.name} - {asset.assetTag} ({asset.status})
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-[#555]">
                      {formData.type === 'MAINTENANCE_REQUEST' 
                        ? 'Select the asset that requires maintenance or upgrade'
                        : 'Select the asset to be decomposed into spare parts'}
                    </p>
                  </div>

                  {/* Employee Selector - for asset assignment */}
                  <div>
                    <label htmlFor="employeeId" className="block text-sm font-medium text-[#111]">
                      Assign to Employee (Optional)
                    </label>
                    <select
                      id="employeeId"
                      name="employeeId"
                      value={formData.employeeId}
                      onChange={handleInputChange}
                      className="mt-1 block w-full glass-input rounded-lg px-3 py-2 text-[#111] focus:ring-2 focus:ring-black/20 focus:border-black/30"
                    >
                      <option value="">Select an employee</option>
                      {employees.map(employee => (
                        <option key={employee.id} value={employee.id}>
                          {employee.firstName} {employee.lastName} - {employee.npk} ({employee.position || 'N/A'})
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-[#555]">
                      Assign this request to a specific employee if needed
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="quantity" className="block text-sm font-medium text-[#111]">
                        Quantity
                      </label>
                      <input
                        type="number"
                        id="quantity"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleInputChange}
                        min="1"
                        className="mt-1 block w-full glass-input rounded-lg px-3 py-2 text-[#111] focus:ring-2 focus:ring-black/20 focus:border-black/30"
                      />
                    </div>

                    <div>
                      <label htmlFor="expectedDeliveryDate" className="block text-sm font-medium text-[#111]">
                        Required Date
                      </label>
                      <input
                        type="date"
                        id="expectedDeliveryDate"
                        name="expectedDeliveryDate"
                        value={formData.expectedDeliveryDate}
                        onChange={handleInputChange}
                        min={new Date().toISOString().split('T')[0]}
                        className="mt-1 block w-full glass-input rounded-lg px-3 py-2 text-[#111] focus:ring-2 focus:ring-black/20 focus:border-black/30"
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
                  className="px-6 py-2 border border-black/10 text-[#111] rounded-lg hover:bg-white/60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 glass-button text-white rounded-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Request'}
                </button>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Request Guidelines */}
              <div className="glass-card shadow">
                <div className="px-6 py-4 border-b border-black/10">
                  <h3 className="text-lg font-medium text-[#111]">Request Guidelines</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4 text-sm text-[#333]">
                    <div>
                      <h4 className="font-medium text-[#111] mb-2">Request Types:</h4>
                      <ul className="space-y-1">
                        <li><strong>Maintenance:</strong> Request maintenance, repair, or upgrade for an asset</li>
                        <li><strong>Decomposition:</strong> Request asset breakdown into spare parts or disposal</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-[#111] mb-2">Maintenance Types:</h4>
                      <ul className="space-y-1">
                        <li><span className="text-[#333]">Preventive:</span> Scheduled maintenance</li>
                        <li><span className="text-[#111]">Corrective:</span> Reactive repairs</li>
                        <li><span className="text-[#111]">Upgrade:</span> Hardware/software improvements</li>
                        <li><span className="text-[#111]">Emergency:</span> Urgent repairs</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-[#111] mb-2">Priority Levels:</h4>
                      <ul className="space-y-1">
                        <li><span className="text-[#333]">Low:</span> Standard business need</li>
                        <li><span className="text-[#111]">Medium:</span> Important for operations</li>
                        <li><span className="text-[#111]">High:</span> Critical business impact</li>
                        <li><span className="text-[#111]">Urgent:</span> Immediate action required</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-[#111] mb-2">Tips for Approval:</h4>
                      <ul className="space-y-1">
                        <li>• Provide clear business justification</li>
                        <li>• Select the correct asset and type</li>
                        <li>• Specify technical requirements</li>
                        <li>• Set realistic completion dates</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Requester Info */}
              <div className="glass-card shadow">
                <div className="px-6 py-4 border-b border-black/10">
                  <h3 className="text-lg font-medium text-[#111]">Requester Information</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium text-[#111]">Name:</span>
                      <p className="text-[#111]">{user?.firstName} {user?.lastName}</p>
                    </div>
                    <div>
                      <span className="font-medium text-[#111]">Email:</span>
                      <p className="text-[#111]">{user?.email}</p>
                    </div>
                    <div>
                      <span className="font-medium text-[#111]">Department:</span>
                      <p className="text-[#111]">{user?.department?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-[#111]">Role:</span>
                      <p className="text-[#111]">{user?.role}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Request Preview */}
              <div className="glass-card shadow">
                <div className="px-6 py-4 border-b border-black/10">
                  <h3 className="text-lg font-medium text-[#111]">Request Preview</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium text-[#111]">Type:</span>
                      <p className="text-[#111]">{requestTypes.find(t => t.value === formData.type)?.label}</p>
                    </div>
                    {formData.type === 'MAINTENANCE_REQUEST' && formData.maintenanceType && (
                      <div>
                        <span className="font-medium text-[#111]">Maintenance Type:</span>
                        <p className="text-[#111]">
                          {maintenanceTypes.find(t => t.value === formData.maintenanceType)?.label}
                        </p>
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-[#111]">Priority:</span>
                      <p className={priorities.find(p => p.value === formData.priority)?.color}>
                        {priorities.find(p => p.value === formData.priority)?.label}
                      </p>
                    </div>
                    {formData.assetId && (
                      <div>
                        <span className="font-medium text-[#111]">Asset:</span>
                        <p className="text-[#111]">
                          {assets.find(a => a.id === formData.assetId)?.name || 'Selected'}
                        </p>
                      </div>
                    )}
                    {formData.expectedDeliveryDate && (
                      <div>
                        <span className="font-medium text-[#111]">Required Date:</span>
                        <p className="text-[#111]">
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
