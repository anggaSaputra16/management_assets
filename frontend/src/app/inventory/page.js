'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Package, 
  Plus, 
  Search, 
  Eye, 
  Edit3, 
  Trash2, 
  Archive,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { useInventoryStore } from '../../stores';

export default function InventoryPage() {
  const router = useRouter();
  const {
    inventories,
    inventoryLoading,
    inventoryError,
    inventoryPagination,
    stats,
    fetchInventories,
    fetchStats,
    setInventoryFilters,
    deleteInventory,
    clearInventoryError
  } = useInventoryStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');

  useEffect(() => {
    fetchInventories();
    fetchStats();
  }, [fetchInventories, fetchStats]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setInventoryFilters({
        search: searchTerm,
        departmentId: selectedDepartment,
        status: selectedStatus,
        condition: selectedCondition
      });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedDepartment, selectedStatus, selectedCondition, setInventoryFilters]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handlePageChange = (page) => {
    fetchInventories(page);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this inventory item?')) {
      try {
        await deleteInventory(id);
      } catch (error) {
        console.error('Error deleting inventory:', error);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-100 text-green-800';
      case 'LOANED':
        return 'bg-blue-100 text-blue-800';
      case 'MAINTENANCE':
        return 'bg-yellow-100 text-yellow-800';
      case 'RETIRED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getConditionColor = (condition) => {
    switch (condition) {
      case 'GOOD':
        return 'bg-green-100 text-green-800';
      case 'FAIR':
        return 'bg-yellow-100 text-yellow-800';
      case 'POOR':
        return 'bg-orange-100 text-orange-800';
      case 'DAMAGED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="glass-card p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400"></div>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Inventory Management</h1>
              <p className="text-gray-600">Manage inventory items and track loans</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push('/inventory/loans')}
                className="glass-button px-4 py-2 rounded-lg text-gray-700 flex items-center space-x-2 hover:scale-105 transition-transform relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400/10 to-amber-400/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Archive className="h-4 w-4 relative z-10" />
                <span className="relative z-10">Manage Loans</span>
              </button>
              <button
                onClick={() => router.push('/inventory/create')}
                className="glass-button px-4 py-2 rounded-lg text-gray-700 flex items-center space-x-2 hover:scale-105 transition-transform relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-green-400/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Plus className="h-4 w-4 relative z-10" />
                <span className="relative z-10">Add Inventory</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass-card p-6 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-400"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 to-indigo-400/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Inventory</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{stats.totalInventory}</p>
                </div>
                <Package className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            <div className="glass-card p-6 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-400"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-green-400/5 to-emerald-400/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-sm font-medium text-gray-600">Available</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{stats.availableInventory}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </div>

            <div className="glass-card p-6 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-violet-400"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400/5 to-violet-400/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-sm font-medium text-gray-600">Loaned</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">{stats.loanedInventory}</p>
                </div>
                <Archive className="h-8 w-8 text-purple-500" />
              </div>
            </div>

            <div className="glass-card p-6 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-red-400"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400/5 to-red-400/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Loans</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">{stats.activeLoans}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="glass-card p-6 rounded-lg shadow-sm border border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search inventory..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Departments</option>
              {/* TODO: Add department options */}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="AVAILABLE">Available</option>
              <option value="LOANED">Loaned</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="RETIRED">Retired</option>
            </select>

            <select
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Conditions</option>
              <option value="GOOD">Good</option>
              <option value="FAIR">Fair</option>
              <option value="POOR">Poor</option>
              <option value="DAMAGED">Damaged</option>
            </select>
          </div>
        </div>

        {/* Error Message */}
        {inventoryError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-red-700">{inventoryError}</p>
              <button
                onClick={clearInventoryError}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Inventory Table */}
        <div className="glass-card rounded-lg shadow-sm border border-white/20 overflow-hidden">
          {inventoryLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Inventory
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Asset
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Condition
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {inventories.length > 0 ? inventories.map((inventory) => (
                      <tr key={inventory.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {inventory.inventoryTag}
                            </div>
                            {inventory.location && (
                              <div className="text-sm text-gray-500">{inventory.location}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {inventory.asset.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {inventory.asset.assetTag}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {inventory.department.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {inventory.availableQty} / {inventory.quantity}
                          </div>
                          <div className="text-xs text-gray-500">
                            Available / Total
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(inventory.status)}`}>
                            {inventory.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getConditionColor(inventory.condition)}`}>
                            {inventory.condition}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => router.push(`/inventory/${inventory.id}`)}
                              className="text-blue-600 hover:text-blue-900"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => router.push(`/inventory/${inventory.id}/edit`)}
                              className="text-yellow-600 hover:text-yellow-900"
                              title="Edit"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(inventory.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="7" className="px-6 py-12 text-center">
                          <div className="text-gray-500">
                            <Package className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-2 text-sm font-medium">No inventory items found</p>
                            <p className="text-sm">Get started by creating your first inventory item.</p>
                            <button
                              onClick={() => router.push('/inventory/create')}
                              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                            >
                              Add Inventory
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {inventoryPagination.pages > 1 && (
                <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => handlePageChange(inventoryPagination.current - 1)}
                      disabled={!inventoryPagination.hasPrev}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(inventoryPagination.current + 1)}
                      disabled={!inventoryPagination.hasNext}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing page {inventoryPagination.current} of {inventoryPagination.pages}
                        ({inventoryPagination.total} total items)
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => handlePageChange(inventoryPagination.current - 1)}
                          disabled={!inventoryPagination.hasPrev}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => handlePageChange(inventoryPagination.current + 1)}
                          disabled={!inventoryPagination.hasNext}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}