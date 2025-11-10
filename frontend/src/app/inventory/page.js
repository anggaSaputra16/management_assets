'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Package, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Archive,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useCompanyStore, useDepartmentStore, useEnumStore } from '../../stores'
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
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');
  const [generated, setGenerated] = useState(false)

  const { companies, fetchCompanies } = useCompanyStore()
  const { departments: departmentOptions, fetchDepartmentsByCompany, fetchDepartments } = useDepartmentStore()
  const {
    assetStatuses,
    assetConditions,
    initializeEnums
  } = useEnumStore()

  // initial: load companies only. Do NOT auto-load inventory data until user generates
  useEffect(() => {
    fetchCompanies()
    initializeEnums()
  }, [fetchCompanies, initializeEnums]);

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

  // Generate button: load inventories for chosen company+department
  const handleGenerate = async () => {
    if (!selectedCompany || !selectedDepartment) {
      alert('Please select a Company and Department before generating inventory data.')
      return
    }

    // fetch department scoped inventories and stats
    setGenerated(true)
    // set filters and fetch inventories (fetchInventories expects (page, limit))
    setInventoryFilters({ departmentId: selectedDepartment })
    await fetchInventories(1)
    await fetchStats()
  }

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
        return 'bg-white/60 text-[#111]';
      case 'LOANED':
        return 'bg-white/60 text-[#111]';
      case 'MAINTENANCE':
        return 'bg-white/60 text-[#111]';
      case 'RETIRED':
        return 'bg-gray-100 text-[#111]';
      default:
        return 'bg-gray-100 text-[#111]';
    }
  };

  const getConditionColor = (condition) => {
    switch (condition) {
      case 'GOOD':
        return 'bg-white/60 text-[#111]';
      case 'FAIR':
        return 'bg-white/60 text-[#111]';
      case 'POOR':
        return 'bg-white/60 text-[#111]';
      case 'DAMAGED':
        return 'bg-white/60 text-[#111]';
      default:
        return 'bg-gray-100 text-[#111]';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="glass-card">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-[#111]">Inventory Management</h1>
              <p className="text-[#333]">Manage inventory items and track loans</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push('/inventory/loans')}
                className="glass-button px-4 py-2 rounded-lg text-[#111] flex items-center space-x-2 hover:scale-105 transition-transform"
              >
                <Archive className="h-4 w-4" />
                <span>Manage Loans</span>
              </button>
              <button
                onClick={() => router.push('/inventory/create')}
                className="glass-button px-4 py-2 rounded-lg text-[#111] flex items-center space-x-2 hover:scale-105 transition-transform"
              >
                <Plus className="h-4 w-4" />
                <span>Add Inventory</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#333]">Total Inventory</p>
                  <p className="text-2xl font-bold text-[#111]">{stats.totalInventory}</p>
                </div>
                <Package className="h-8 w-8 text-[#111]" />
              </div>
            </div>

            <div className="glass-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#333]">Available</p>
                  <p className="text-2xl font-bold text-[#111]">{stats.availableInventory}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-[#111]" />
              </div>
            </div>

            <div className="glass-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#333]">Loaned</p>
                  <p className="text-2xl font-bold text-[#111]">{stats.loanedInventory}</p>
                </div>
                <Archive className="h-8 w-8 text-[#111]" />
              </div>
            </div>

            <div className="glass-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#333]">Active Loans</p>
                  <p className="text-2xl font-bold text-[#111]">{stats.activeLoans}</p>
                </div>
                <Clock className="h-8 w-8 text-[#111]" />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="glass-card">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

              <select
                value={selectedCompany}
                onChange={(e) => {
                  const companyId = e.target.value
                  setSelectedCompany(companyId)
                  if (fetchDepartmentsByCompany && typeof fetchDepartmentsByCompany === 'function') {
                    fetchDepartmentsByCompany(companyId)
                  } else if (fetchDepartments && typeof fetchDepartments === 'function') {
                    fetchDepartments()
                  }
                }}
                className="glass-input px-3 py-2 rounded-lg text-[#111]"
              >
                <option value="">Select Company</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="glass-input px-3 py-2 rounded-lg text-[#111]"
              >
                <option value="">Select Department</option>
                {departmentOptions.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>

            <div className="flex items-center justify-start">
              <button onClick={handleGenerate} className="glass-button px-4 py-2 rounded-lg text-[#111] hover:scale-105 transition-transform">Generate</button>
            </div>

              <div className="relative flex items-center justify-start">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#333] h-4 w-4" />
              <input
                type="text"
                placeholder="Search inventory..."
                value={searchTerm}
                onChange={handleSearch}
                className="glass-input pl-10 pr-4 py-2 w-full rounded-lg text-[#111]"
              />
            </div>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="glass-input px-3 py-2 rounded-lg text-[#111]"
            >
              <option value="">All Status</option>
              {assetStatuses.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>

            <select
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
              className="glass-input px-3 py-2 rounded-lg text-[#111]"
            >
              <option value="">All Conditions</option>
              {assetConditions.map(condition => (
                <option key={condition.value} value={condition.value}>
                  {condition.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error Message */}
        {inventoryError && (
          <div className="glass-card border-2 border-black/10">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-[#111] mr-2" />
              <p className="text-[#111]">{inventoryError}</p>
              <button
                onClick={clearInventoryError}
                className="ml-auto text-[#111] hover:scale-110 transition-transform"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Inventory Table */}
        <div className="glass-card overflow-hidden">
          {inventoryLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#111]"></div>
            </div>
          ) : (
            <>
              <div className="glass-table overflow-x-auto rounded-xl">
                <table className="min-w-full">
                  <thead className="bg-white/60">
                    <tr>
                      <th className="px-6 py-3 text-left text-[#111] font-semibold uppercase tracking-wider">
                        Inventory Tag
                      </th>
                      <th className="px-6 py-3 text-left text-[#111] font-semibold uppercase tracking-wider">
                        Asset Info
                      </th>
                      <th className="px-6 py-3 text-left text-[#111] font-semibold uppercase tracking-wider">
                        Department & Location
                      </th>
                      <th className="px-6 py-3 text-left text-[#111] font-semibold uppercase tracking-wider">
                        Custodian
                      </th>
                      <th className="px-6 py-3 text-left text-[#111] font-semibold uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-[#111] font-semibold uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-[#111] font-semibold uppercase tracking-wider">
                        Loans
                      </th>
                      <th className="px-6 py-3 text-left text-[#111] font-semibold uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-black/10">
                    {generated && inventories.length > 0 ? inventories.map((inventory) => (
                      <tr key={inventory.id} className="hover:bg-white/40">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-[#111]">
                            {inventory.inventoryTag}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-[#111]">
                              {inventory.asset?.name}
                            </div>
                            <div className="text-xs text-[#333]">
                              Tag: {inventory.asset?.assetTag}
                            </div>
                            {inventory.asset?.serialNumber && (
                              <div className="text-xs text-[#333]">
                                S/N: {inventory.asset.serialNumber}
                              </div>
                            )}
                            <div className="text-xs text-[#333]">
                              {inventory.asset?.category?.name}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-[#111]">
                              📁 {inventory.department?.name}
                            </div>
                            <div className="text-xs text-[#333]">
                              Code: {inventory.department?.code}
                            </div>
                            {inventory.asset?.location && (
                              <div className="text-xs text-[#333] mt-1">
                                📍 {inventory.asset.location.name}
                                {inventory.asset.location.building && (
                                  <span className="ml-1">
                                    - {inventory.asset.location.building}
                                    {inventory.asset.location.floor && ` Floor ${inventory.asset.location.floor}`}
                                    {inventory.asset.location.room && ` Room ${inventory.asset.location.room}`}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {inventory.custodian ? (
                            <div>
                              <div className="text-sm text-[#111]">
                                {inventory.custodian.firstName} {inventory.custodian.lastName}
                              </div>
                              {inventory.custodian.username && (
                                <div className="text-xs text-[#333]">
                                  @{inventory.custodian.username}
                                </div>
                              )}
                              {inventory.custodian.role && (
                                <div className="text-xs text-[#333]">
                                  {inventory.custodian.role}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-[#333]">No custodian</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-[#111]">
                            {inventory.availableQty} / {inventory.quantity}
                          </div>
                          <div className="text-xs text-[#333]">
                            Available / Total
                          </div>
                          {inventory.condition && (
                            <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full mt-1 ${getConditionColor(inventory.condition)}`}>
                              {inventory.condition}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(inventory.status)}`}>
                            {inventory.status}
                          </span>
                          {inventory.asset?.status && (
                            <div className="text-xs text-[#333] mt-1">
                              Asset: {inventory.asset.status}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="text-sm font-medium text-[#111]">
                            {(inventory.loans ? inventory.loans.filter(l => l.status === 'ACTIVE').length : 0) || 0}
                          </div>
                          <div className="text-xs text-[#333]">
                            Active Loans
                          </div>
                          {inventory.loans && inventory.loans.some(l => l.status === 'ACTIVE') && (() => {
                            const activeLoan = inventory.loans.find(l => l.status === 'ACTIVE')
                            return (
                              <div className="text-left mt-2">
                                <div className="text-xs text-[#111]">
                                  <strong>Borrower:</strong> {activeLoan?.borrowerEmployee ? `${activeLoan.borrowerEmployee.firstName} ${activeLoan.borrowerEmployee.lastName}` : '—'}
                                </div>
                                <div className="text-xs text-[#111]">
                                  <strong>Responsible:</strong> {activeLoan?.responsibleEmployee ? `${activeLoan.responsibleEmployee.firstName} ${activeLoan.responsibleEmployee.lastName}` : '—'}
                                </div>
                                <div className="text-xs text-[#111]">
                                  <strong>Expected Return:</strong> {activeLoan?.expectedReturnDate ? new Date(activeLoan.expectedReturnDate).toLocaleDateString() : '—'}
                                </div>
                              </div>
                            )
                          })()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => router.push(`/inventory/${inventory.id}/edit`)}
                              className="text-[#111] hover:scale-110 transition-transform"
                              title="Edit"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(inventory.id)}
                              className="text-[#111] hover:scale-110 transition-transform"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="8" className="px-6 py-12 text-center">
                          <div className="text-[#111]">
                            <Package className="mx-auto h-12 w-12 text-[#333]" />
                            <p className="mt-2 text-sm font-medium">No inventory items found</p>
                            <p className="text-sm">Get started by creating your first inventory item.</p>
                            <button
                              onClick={() => router.push('/inventory/create')}
                              className="glass-button mt-4 px-4 py-2 rounded-lg hover:scale-105 transition-transform"
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
              {/* Pagination */}
              {inventoryPagination.pages > 1 && (
                <div className="px-6 py-3 flex items-center justify-between border-t border-black/10">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => handlePageChange(inventoryPagination.current - 1)}
                      disabled={!inventoryPagination.hasPrev}
                      className="glass-button px-4 py-2 rounded-lg text-[#111] disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(inventoryPagination.current + 1)}
                      disabled={!inventoryPagination.hasNext}
                      className="glass-button ml-3 px-4 py-2 rounded-lg text-[#111] disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-[#111]">
                        Showing page {inventoryPagination.current} of {inventoryPagination.pages}
                        ({inventoryPagination.total} total items)
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => handlePageChange(inventoryPagination.current - 1)}
                          disabled={!inventoryPagination.hasPrev}
                          className="glass-button px-2 py-2 rounded-l-md text-[#111] disabled:opacity-50"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => handlePageChange(inventoryPagination.current + 1)}
                          disabled={!inventoryPagination.hasNext}
                          className="glass-button px-2 py-2 rounded-r-md text-[#111] disabled:opacity-50"
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