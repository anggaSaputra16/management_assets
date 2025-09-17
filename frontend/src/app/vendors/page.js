'use client'

import { useEffect } from 'react'
import { 
  Building2,
  Search, 
  Plus, 
  Edit,
  Trash2,
  Phone,
  Mail,
  Globe,
  MapPin,
  Package,
  Download,
  Upload,
  CheckCircle,
  XCircle
} from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { useAuthStore } from '@/stores/authStore'
import { useVendorStore } from '@/stores/vendorStore'
import { useToast } from '@/contexts/ToastContext'

export default function VendorsPage() {
  const { user } = useAuthStore()
  const { showToast } = useToast()
  const {
    vendors,
    loading,
    error,
    searchTerm,
    showModal,
    editingVendor,
    formData,
    fetchVendors,
    createVendor,
    updateVendor,
    deleteVendor,
    setSearchTerm,
    setShowModal,
    setEditingVendor,
    setFormData,
    resetForm,
    handleInputChange,
    getFilteredVendors,
    getVendorStats
  } = useVendorStore()

  // Export/Import functions
  const exportToCSV = () => {
    try {
      const headers = [
        'Name', 'Code', 'Email', 'Phone', 'Contact Person', 
        'Address', 'City', 'State', 'Postal Code', 'Country',
        'Website', 'Tax ID', 'Description', 'Status', 'Created At'
      ]
      
      const csvContent = [
        headers.join(','),
        ...vendors.map(vendor => [
          `"${vendor.name || ''}"`,
          `"${vendor.code || ''}"`,
          `"${vendor.email || ''}"`,
          `"${vendor.phone || ''}"`,
          `"${vendor.contactPerson || ''}"`,
          `"${vendor.address || ''}"`,
          `"${vendor.city || ''}"`,
          `"${vendor.state || ''}"`,
          `"${vendor.postalCode || ''}"`,
          `"${vendor.country || ''}"`,
          `"${vendor.website || ''}"`,
          `"${vendor.taxId || ''}"`,
          `"${vendor.description || ''}"`,
          vendor.isActive ? 'Active' : 'Inactive',
          new Date(vendor.createdAt).toLocaleDateString()
        ].join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `vendors_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
      showToast('Vendors exported successfully', 'success')
    } catch (error) {
      showToast('Failed to export vendors', 'error')
    }
  }

  const handleImportCSV = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const csv = e.target.result
          const lines = csv.split('\n')
          const headers = lines[0].split(',')
          
          // Basic validation
          if (!headers.includes('Name') || !headers.includes('Code')) {
            showToast('Invalid CSV format. Name and Code columns are required.', 'error')
            return
          }
          
          showToast('CSV file loaded. Import functionality can be implemented based on business requirements.', 'info')
        } catch (error) {
          showToast('Error reading CSV file', 'error')
        }
      }
      reader.readAsText(file)
    }
  }

  useEffect(() => {
    fetchVendors()
  }, [fetchVendors])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      if (editingVendor) {
        await updateVendor(editingVendor.id, formData)
        showToast('Vendor updated successfully!', 'success')
      } else {
        await createVendor(formData)
        showToast('Vendor created successfully!', 'success')
      }
      
      setShowModal(false)
    } catch (error) {
      console.error('Failed to save vendor:', error)
      showToast(error.message || 'Failed to save vendor', 'error')
    }
  }

  const handleEdit = (vendor) => {
    setEditingVendor(vendor)
    setFormData({
      name: vendor.name || '',
      code: vendor.code || '',
      type: vendor.type || 'Supplier',
      contactPerson: vendor.contactPerson || '',
      email: vendor.email || '',
      phone: vendor.phone || '',
      website: vendor.website || '',
      address: vendor.address || '',
      city: vendor.city || '',
      state: vendor.state || '',
      postalCode: vendor.postalCode || '',
      country: vendor.country || 'Indonesia',
      description: vendor.description || '',
      taxId: vendor.taxId || '',
      paymentTerms: vendor.paymentTerms || '',
      isActive: vendor.isActive !== false
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this vendor?')) {
      try {
        await deleteVendor(id)
        showToast('Vendor deleted successfully!', 'success')
      } catch (error) {
        console.error('Failed to delete vendor:', error)
        showToast('Failed to delete vendor', 'error')
      }
    }
  }

  const openModal = () => {
    resetForm()
    setShowModal(true)
  }

  const filteredVendors = getFilteredVendors()
  const vendorStats = getVendorStats()

  const vendorTypes = [
    { value: 'SUPPLIER', label: 'Supplier' },
    { value: 'SERVICE_PROVIDER', label: 'Service Provider' },
    { value: 'CONTRACTOR', label: 'Contractor' },
    { value: 'CONSULTANT', label: 'Consultant' },
    { value: 'MAINTENANCE', label: 'Maintenance' }
  ]

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Building2 className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
              <p className="text-gray-600">Manage suppliers and service providers</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <input
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              className="hidden"
              id="csvImport"
            />
            <label
              htmlFor="csvImport"
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </label>
            
            <button
              onClick={exportToCSV}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </button>
            
            <button
              onClick={openModal}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Vendor
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {vendorStats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <stat.icon className={`h-6 w-6 ${stat.textColor}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Vendors List</h3>
            </div>
          </div>
          
          <div className="p-6">
            {/* Search */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search vendors by name, code, type, contact, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>

            {/* Vendors Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vendor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i}>
                        <td colSpan="6" className="px-6 py-4">
                          <div className="animate-pulse flex space-x-4">
                            <div className="h-4 bg-gray-200 rounded w-full"></div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : filteredVendors.length > 0 ? (
                    filteredVendors.map((vendor) => (
                      <tr key={vendor.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{vendor.name}</div>
                            <div className="text-sm text-gray-500">Code: {vendor.code}</div>
                            {vendor.contactPerson && (
                              <div className="text-xs text-gray-400">Contact: {vendor.contactPerson}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                            {vendor.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {vendor.email && (
                              <div className="flex items-center">
                                <Mail className="h-4 w-4 mr-1 text-gray-400" />
                                {vendor.email}
                              </div>
                            )}
                            {vendor.phone && (
                              <div className="flex items-center">
                                <Phone className="h-4 w-4 mr-1 text-gray-400" />
                                {vendor.phone}
                              </div>
                            )}
                            {vendor.website && (
                              <div className="flex items-center">
                                <Globe className="h-4 w-4 mr-1 text-gray-400" />
                                <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                                  Website
                                </a>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {vendor.city && vendor.state && (
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                                {vendor.city}, {vendor.state}
                              </div>
                            )}
                            <div className="text-gray-500">{vendor.country}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            vendor.isActive !== false
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {vendor.isActive !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEdit(vendor)}
                              className="text-purple-600 hover:text-purple-900"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            {['ADMIN', 'ASSET_ADMIN'].includes(user?.role) && (
                              <button
                                onClick={() => handleDelete(vendor.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center">
                        <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No vendors found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Get started by adding a new vendor.
                        </p>
                        <div className="mt-6">
                          <button
                            onClick={() => setShowModal(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Vendor
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-screen overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
                </h3>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vendor Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Enter vendor name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vendor Code *
                    </label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="e.g., VND001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type *
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      {vendorTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Person
                    </label>
                    <input
                      type="text"
                      name="contactPerson"
                      value={formData.contactPerson}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Primary contact person"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="vendor@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="+62 xxx xxxx xxxx"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Website
                    </label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="https://www.vendor.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Street address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="City"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State/Province
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="State"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="12345"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Country"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tax ID
                    </label>
                    <input
                      type="text"
                      name="taxId"
                      value={formData.taxId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Tax identification number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Terms
                    </label>
                    <input
                      type="text"
                      name="paymentTerms"
                      value={formData.paymentTerms}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="e.g., NET 30, COD"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Optional description"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                    Active vendor
                  </label>
                </div>

                <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    {editingVendor ? 'Update Vendor' : 'Create Vendor'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
