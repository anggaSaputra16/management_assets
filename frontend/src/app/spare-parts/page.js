'use client'

import React, { useEffect, useState } from 'react'
import { 
  Package, 
  ShoppingCart, 
  RefreshCw, 
  Plus, 
  Search, 
  AlertTriangle,
  TrendingUp,
  Settings,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  BarChart3,
  Wrench,
  XCircle
} from 'lucide-react'
import { useSparePartsStore } from '@/stores/sparePartsStore'

// Tabs for different spare parts workflows
const TABS = [
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'procurement', label: 'Procurement', icon: ShoppingCart },
  { id: 'usage', label: 'Usage Tracking', icon: RefreshCw },
  { id: 'replacement', label: 'Replacements', icon: Settings },
  { id: 'registration', label: 'New Parts Registration', icon: Plus },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 }
]

export default function SparePartsPage() {
  const [activeTab, setActiveTab] = useState('inventory')
  const {
    spareParts,
    loading,
    error,
    searchTerm,
    categoryFilter,
    partTypeFilter,
    statusFilter,
    lowStockOnly,
    vendorFilter,
    showInventoryModal,
    inventoryFormData,
    inventoryStats,
    lowStockAlerts,
    fetchSpareParts,
    fetchInventoryStats,
    fetchLowStockAlerts,
    setSearchTerm,
    setCategoryFilter,
    setPartTypeFilter,
    setStatusFilter,
    setLowStockOnly,
    setShowInventoryModal,
    setInventoryFormData,
    createSparePart,
    clearError
  } = useSparePartsStore()

  useEffect(() => {
    fetchSpareParts()
    fetchInventoryStats()
    fetchLowStockAlerts()
  }, [searchTerm, categoryFilter, partTypeFilter, statusFilter, lowStockOnly, vendorFilter, fetchSpareParts, fetchInventoryStats, fetchLowStockAlerts])

  const handleCreateSparePart = async (e) => {
    e.preventDefault()
    await createSparePart(inventoryFormData)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-600 bg-green-50'
      case 'DISCONTINUED': return 'text-yellow-600 bg-yellow-50'
      case 'OUT_OF_STOCK': return 'text-red-600 bg-red-50'
      case 'OBSOLETE': return 'text-gray-600 bg-gray-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStockStatusColor = (part) => {
    if (part.stockLevel === 0) return 'text-red-600'
    if (part.stockLevel <= part.reorderPoint) return 'text-yellow-600'
    return 'text-green-600'
  }

  const renderInventoryTab = () => (
    <div className="space-y-6">
      {/* Quick Stats */}
      {inventoryStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Parts</p>
                <p className="text-2xl font-bold text-gray-900">{inventoryStats.inventory.totalParts}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600">{inventoryStats.inventory.lowStockParts}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{inventoryStats.inventory.outOfStockParts}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Stock Items</p>
                <p className="text-2xl font-bold text-green-600">{inventoryStats.inventory.totalStockItems.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>
      )}

      {/* Low Stock Alerts */}
      {lowStockAlerts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <h3 className="text-sm font-medium text-yellow-800">Low Stock Alerts</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStockAlerts.slice(0, 6).map((part) => (
              <div key={part.id} className="bg-white p-3 rounded border">
                <p className="font-medium text-sm text-gray-900">{part.name}</p>
                <p className="text-xs text-gray-600">{part.partNumber}</p>
                <p className="text-xs text-yellow-600 mt-1">
                  Stock: {part.stockLevel} (Reorder at: {part.reorderPoint})
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search spare parts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              <option value="Hardware">Hardware</option>
              <option value="Software">Software</option>
              <option value="Accessory">Accessory</option>
              <option value="Consumable">Consumable</option>
            </select>
          </div>
          
          <div>
            <select
              value={partTypeFilter}
              onChange={(e) => setPartTypeFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="COMPONENT">Component</option>
              <option value="ACCESSORY">Accessory</option>
              <option value="CONSUMABLE">Consumable</option>
              <option value="TOOL">Tool</option>
              <option value="SOFTWARE">Software</option>
            </select>
          </div>
          
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="DISCONTINUED">Discontinued</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
              <option value="OBSOLETE">Obsolete</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(e) => setLowStockOnly(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Low Stock Only</span>
            </label>
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() => setShowInventoryModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Spare Part</span>
          </button>
          
          <div className="flex space-x-2">
            <button className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-200 flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
            <button className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-200 flex items-center space-x-2">
              <Upload className="h-4 w-4" />
              <span>Import</span>
            </button>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Part Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor
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
              {spareParts.map((part) => (
                <tr key={part.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{part.name}</div>
                      <div className="text-sm text-gray-500">{part.partNumber}</div>
                      {part.brand && (
                        <div className="text-xs text-gray-400">{part.brand} {part.model}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{part.category}</div>
                    <div className="text-xs text-gray-500">{part.partType}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${getStockStatusColor(part)}`}>
                      {part.stockLevel} in stock
                    </div>
                    <div className="text-xs text-gray-500">
                      Min: {part.minStockLevel} | Reorder: {part.reorderPoint}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      ${part.unitPrice.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {part.vendor?.name || 'No vendor'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(part.status)}`}>
                      {part.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  const renderProcurementTab = () => (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Procurement Management</h3>
        <p className="text-gray-600 mb-4">
          Manage part orders, track deliveries, and update inventory levels.
        </p>
        
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center space-x-2">
          <ShoppingCart className="h-4 w-4" />
          <span>New Procurement Order</span>
        </button>
      </div>

      {/* Procurement orders table would go here */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-500">
        Procurement orders will be displayed here
      </div>
    </div>
  )

  const renderUsageTab = () => (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Usage Tracking</h3>
        <p className="text-gray-600 mb-4">
          Track how parts are used in maintenance, repairs, and upgrades.
        </p>
        
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center space-x-2">
          <RefreshCw className="h-4 w-4" />
          <span>Record Usage</span>
        </button>
      </div>

      {/* Usage records table would go here */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-500">
        Usage records will be displayed here
      </div>
    </div>
  )

  const renderReplacementTab = () => (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Part Replacements</h3>
        <p className="text-gray-600 mb-4">
          Manage component replacements and upgrades with proper tracking.
        </p>
        
        <button className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-700 flex items-center space-x-2">
          <Wrench className="h-4 w-4" />
          <span>Plan Replacement</span>
        </button>
      </div>

      {/* Replacement records table would go here */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-500">
        Replacement records will be displayed here
      </div>
    </div>
  )

  const renderRegistrationTab = () => (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">New Parts Registration</h3>
        <p className="text-gray-600 mb-4">
          Convert spare parts into tracked assets with detailed information.
        </p>
        
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Register as Asset</span>
        </button>
      </div>

      {/* Registration records table would go here */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-500">
        Registration records will be displayed here
      </div>
    </div>
  )

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Parts by Category</h3>
          <div className="space-y-3">
            {inventoryStats?.distribution.byCategory.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{item.category}</span>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{item._count} parts</div>
                  <div className="text-xs text-gray-500">{item._sum.stockLevel} items</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Parts by Type</h3>
          <div className="space-y-3">
            {inventoryStats?.distribution.byType.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{item.partType}</span>
                <span className="text-sm font-medium text-gray-900">{item._count} parts</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Recent Usages (30 days)</span>
              <span className="text-sm font-medium text-gray-900">
                {inventoryStats?.activity.recentUsages || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pending Procurements</span>
              <span className="text-sm font-medium text-gray-900">
                {inventoryStats?.activity.pendingProcurements || 0}
              </span>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Inventory Health</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Stock Coverage</span>
              <span className="text-sm font-medium text-green-600">Good</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Reorder Alerts</span>
              <span className="text-sm font-medium text-yellow-600">
                {lowStockAlerts.length} items
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Spare Parts Management</h1>
          <p className="text-gray-600">Manage inventory, track usage, and handle replacements</p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <XCircle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
            <button
              onClick={clearError}
              className="text-red-600 hover:text-red-800"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div>
          {activeTab === 'inventory' && renderInventoryTab()}
          {activeTab === 'procurement' && renderProcurementTab()}
          {activeTab === 'usage' && renderUsageTab()}
          {activeTab === 'replacement' && renderReplacementTab()}
          {activeTab === 'registration' && renderRegistrationTab()}
          {activeTab === 'analytics' && renderAnalyticsTab()}
        </div>
      )}

      {/* Create Spare Part Modal */}
      {showInventoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Add New Spare Part</h2>
              <button
                onClick={() => setShowInventoryModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateSparePart} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Part Number *
                  </label>
                  <input
                    type="text"
                    value={inventoryFormData.partNumber || ''}
                    onChange={(e) => setInventoryFormData({ partNumber: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={inventoryFormData.name || ''}
                    onChange={(e) => setInventoryFormData({ name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={inventoryFormData.category || 'Hardware'}
                    onChange={(e) => setInventoryFormData({ category: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="Hardware">Hardware</option>
                    <option value="Software">Software</option>
                    <option value="Accessory">Accessory</option>
                    <option value="Consumable">Consumable</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Part Type *
                  </label>
                  <select
                    value={inventoryFormData.partType || 'COMPONENT'}
                    onChange={(e) => setInventoryFormData({ partType: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="COMPONENT">Component</option>
                    <option value="ACCESSORY">Accessory</option>
                    <option value="CONSUMABLE">Consumable</option>
                    <option value="TOOL">Tool</option>
                    <option value="SOFTWARE">Software</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={inventoryFormData.unitPrice || ''}
                    onChange={(e) => setInventoryFormData({ unitPrice: parseFloat(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Initial Stock Level
                  </label>
                  <input
                    type="number"
                    value={inventoryFormData.stockLevel || 0}
                    onChange={(e) => setInventoryFormData({ stockLevel: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Stock Level
                  </label>
                  <input
                    type="number"
                    value={inventoryFormData.minStockLevel || 10}
                    onChange={(e) => setInventoryFormData({ minStockLevel: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reorder Point
                  </label>
                  <input
                    type="number"
                    value={inventoryFormData.reorderPoint || 15}
                    onChange={(e) => setInventoryFormData({ reorderPoint: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={inventoryFormData.description || ''}
                  onChange={(e) => setInventoryFormData({ description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInventoryModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Spare Part'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
