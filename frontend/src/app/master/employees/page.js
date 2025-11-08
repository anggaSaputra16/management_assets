'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useEmployeeStore } from '@/stores/employeeStore';
import { useDepartmentStore } from '@/stores/departmentStore';
import { useLocationStore } from '@/stores/locationStore';
import { employeeService } from '@/lib/services/employeeService';
import { userService } from '@/lib/services/userService';
import { Plus, Edit, Trash2, Search, X, Users, UserCheck, Briefcase, UserPlus } from 'lucide-react'

export default function EmployeesPage() {
  const {
    employees,
    loading,
    error,
    pagination,
    filters,
    stats,
    setEmployees,
    setLoading,
    setError,
    setPagination,
    setFilters,
    setStats,
    addEmployee,
    updateEmployee,
    removeEmployee,
  } = useEmployeeStore();

  const { departments, fetchDepartments } = useDepartmentStore();
  const { locations, fetchLocations } = useLocationStore();

  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    npk: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    hireDate: '',
    terminationDate: '',
    address: '',
    position: '',
    departmentId: '',
    locationId: '',
    userId: '',
    isActive: true,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [currentCompany, setCurrentCompany] = useState(null);

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
    fetchLocations();
    fetchStats();
    fetchUsers();
    fetchCurrentCompany();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.page]);

  const fetchCurrentCompany = () => {
    if (typeof window !== 'undefined') {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const parsed = JSON.parse(authStorage);
        const user = parsed.state?.user;
        if (user?.company) {
          setCurrentCompany(user.company);
        }
      }
    }
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search,
        departmentId: filters.departmentId || undefined,
        locationId: filters.locationId || undefined,
        isActive: filters.isActive !== null ? filters.isActive : undefined,
      };

      const data = await employeeService.getAllEmployees(params);
      setEmployees(data.employees || []);
      setPagination({
        page: data.pagination?.page || 1,
        limit: data.pagination?.limit || 10,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 0,
      });
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch employees');
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await employeeService.getEmployeeStats();
      setStats(data.stats || {
        total: 0,
        active: 0,
        withAssets: 0,
        withAppAccess: 0,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await userService.getAllUsers({ limit: 1000 });
      // userService returns response.data which may contain { success, data: { users } }
      // or an older shape { users, pagination }. Handle both.
      const usersList = data?.data?.users || data?.users || data?.data || [];
      // Normalize user display fields if needed
      setUsers(Array.isArray(usersList) ? usersList : []);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters({ search: searchTerm });
    setPagination({ ...pagination, page: 1 });
  };

  const handleFilterChange = (filterName, value) => {
    setFilters({ [filterName]: value });
    setPagination({ ...pagination, page: 1 });
  };

  const handleOpenModal = (employee = null) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        npk: employee.npk || '',
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        email: employee.email || '',
        phone: employee.phone || '',
        dateOfBirth: employee.dateOfBirth?.split('T')[0] || '',
        hireDate: employee.hireDate?.split('T')[0] || '',
        terminationDate: employee.terminationDate?.split('T')[0] || '',
        address: employee.address || '',
        position: employee.position || '',
        departmentId: employee.departmentId || '',
        locationId: employee.locationId || '',
        userId: employee.userId || '',
        isActive: employee.isActive !== false,
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        npk: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        hireDate: '',
        terminationDate: '',
        address: '',
        position: '',
        departmentId: '',
        locationId: '',
        userId: '',
        isActive: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEmployee(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Prepare data - remove empty strings
      const submitData = { ...formData };
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === '') {
          submitData[key] = null;
        }
      });

      if (editingEmployee) {
        const data = await employeeService.updateEmployee(editingEmployee.id, submitData);
        updateEmployee(editingEmployee.id, data.employee);
      } else {
        const data = await employeeService.createEmployee(submitData);
        addEmployee(data.employee);
      }

      handleCloseModal();
      fetchEmployees();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save employee');
      console.error('Error saving employee:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!deleteConfirm || deleteConfirm !== id) {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
      return;
    }

    try {
      setLoading(true);
      await employeeService.deleteEmployee(id);
      removeEmployee(id);
      setDeleteConfirm(null);
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete employee');
      console.error('Error deleting employee:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[#111]">Employee Management</h1>
          <p className="text-[#333]">
            Manage employees and asset assignments
            {currentCompany && (
              <span className="ml-2 text-sm text-[#111] font-medium">
                • {currentCompany.name}
              </span>
            )}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-card shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-white/60 rounded-md p-3">
                <Users className="h-6 w-6 text-[#111]" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-[#333]">Total Employees</p>
                <p className="text-2xl font-semibold text-[#111]">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="glass-card shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-white/60 rounded-md p-3">
                <UserCheck className="h-6 w-6 text-[#111]" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-[#333]">Active</p>
                <p className="text-2xl font-semibold text-[#111]">{stats.active}</p>
              </div>
            </div>
          </div>

          <div className="glass-card shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-white/60 rounded-md p-3">
                <Briefcase className="h-6 w-6 text-[#111]" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-[#333]">With Assets</p>
                <p className="text-2xl font-semibold text-[#111]">{stats.withAssets}</p>
              </div>
            </div>
          </div>

          <div className="glass-card shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-white/60 rounded-md p-3">
                <UserPlus className="h-6 w-6 text-[#111]" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-[#333]">With App Access</p>
                <p className="text-2xl font-semibold text-[#111]">{stats.withAppAccess}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="glass-card shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <form onSubmit={handleSearch} className="md:col-span-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by NPK, name, email, or position..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-transparent"
                />
                <Search className="absolute left-3 top-3 text-[#333]" />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setFilters({ search: '' });
                    }}
                    className="absolute right-3 top-3 text-[#333] hover:text-[#333]"
                  >
                    <X />
                  </button>
                )}
              </div>
            </form>

            <select
              value={filters.departmentId}
              onChange={(e) => handleFilterChange('departmentId', e.target.value)}
              className="px-4 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-transparent"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>

            <select
              value={filters.locationId}
              onChange={(e) => handleFilterChange('locationId', e.target.value)}
              className="px-4 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-transparent"
            >
              <option value="">All Locations</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <div className="flex gap-2">
              <button
                onClick={() => handleFilterChange('isActive', null)}
                className={`px-4 py-2 rounded-lg ${
                  filters.isActive === null
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-[#111] hover:bg-gray-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => handleFilterChange('isActive', true)}
                className={`px-4 py-2 rounded-lg ${
                  filters.isActive === true
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-[#111] hover:bg-gray-300'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => handleFilterChange('isActive', false)}
                className={`px-4 py-2 rounded-lg ${
                  filters.isActive === false
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 text-[#111] hover:bg-gray-300'
                }`}
              >
                Inactive
              </button>
            </div>

            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 glass-button text-white px-4 py-2 rounded-lg hover:scale-105 transition-transform"
            >
              <Plus /> Add Employee
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-white/60 border border-black/10 text-[#111] px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="glass-card shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-black/10">
              <thead className="bg-white/60">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#333] uppercase tracking-wider">
                    NPK
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#333] uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#333] uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#333] uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#333] uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#333] uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#333] uppercase tracking-wider">
                    Assets
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#333] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#333] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-black/10">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-4 text-center text-[#333]">
                      Loading...
                    </td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-4 text-center text-[#333]">
                      No employees found
                    </td>
                  </tr>
                ) : (
                  employees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-white/60">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#111]">
                        {employee.npk}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-[#111]">
                          {employee.firstName} {employee.lastName}
                        </div>
                        <div className="text-sm text-[#333]">{employee.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#111]">
                        {employee.company?.name || currentCompany?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#111]">
                        {employee.position}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#333]">
                        {employee.department?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#333]">
                        {employee.location?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#333]">
                        {employee._count?.assignedAssets || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            employee.isActive
                              ? 'bg-white/60 text-[#111]'
                              : 'bg-white/60 text-[#111]'
                          }`}
                        >
                          {employee.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenModal(employee)}
                            className="text-[#111] hover:scale-110 transition-transform"
                          >
                            <Edit />
                          </button>
                          <button
                            onClick={() => handleDelete(employee.id)}
                            className={`${
                              deleteConfirm === employee.id
                                ? 'text-[#111] hover:scale-110 transition-transform'
                                : 'text-[#333] hover:scale-110 transition-transform'
                            }`}
                            title={deleteConfirm === employee.id ? 'Click again to confirm' : 'Delete'}
                          >
                            <Trash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-black/10 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-black/10 text-sm font-medium rounded-md text-[#111] bg-white hover:bg-white/40 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page === pagination.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-black/10 text-sm font-medium rounded-md text-[#111] bg-white hover:bg-white/40 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-[#111]">
                    Showing{' '}
                    <span className="font-medium">
                      {(pagination.page - 1) * pagination.limit + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>{' '}
                    of <span className="font-medium">{pagination.total}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                      disabled={pagination.page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-black/10 bg-white text-sm font-medium text-[#333] hover:bg-white/40 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    {[...Array(pagination.totalPages)].map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setPagination({ ...pagination, page: i + 1 })}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pagination.page === i + 1
                            ? 'z-10 bg-white/60 border-black/10 text-[#111]'
                            : 'bg-white border-black/10 text-[#333] hover:bg-white/40'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                      disabled={pagination.page === pagination.totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-black/10 bg-white text-sm font-medium text-[#333] hover:bg-white/40 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="glass-card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Company Info - Read Only */}
                {currentCompany && (
                  <div className="bg-white/60 border border-black/10 rounded-lg p-4 mb-4">
                    <div className="flex items-center">
                      <Briefcase className="h-5 w-5 text-[#111] mr-2" />
                      <div>
                        <p className="text-sm font-medium text-[#111]">Company</p>
                        <p className="text-base font-semibold text-[#111]">{currentCompany.name}</p>
                        {currentCompany.code && (
                          <p className="text-xs text-[#333]">Code: {currentCompany.code}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#111] mb-1">
                      NPK <span className="text-[#111]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.npk}
                      onChange={(e) => setFormData({ ...formData, npk: e.target.value })}
                      className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#111] mb-1">
                      Position <span className="text-[#111]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#111] mb-1">
                      First Name <span className="text-[#111]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#111] mb-1">
                      Last Name <span className="text-[#111]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#111] mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#111] mb-1">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#111] mb-1">
                      Department <span className="text-[#111]">*</span>
                    </label>
                    <select
                      required
                      value={formData.departmentId}
                      onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                      className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-transparent"
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#111] mb-1">Location</label>
                    <select
                      value={formData.locationId}
                      onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                      className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-transparent"
                    >
                      <option value="">Select Location</option>
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#111] mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#111] mb-1">
                      Hire Date
                    </label>
                    <input
                      type="date"
                      value={formData.hireDate}
                      onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                      className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#111] mb-1">
                      Termination Date
                    </label>
                    <input
                      type="date"
                      value={formData.terminationDate}
                      onChange={(e) =>
                        setFormData({ ...formData, terminationDate: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#111] mb-1">
                      Link to User (Optional)
                    </label>
                    <select
                      value={formData.userId}
                      onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                      className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-transparent"
                    >
                      <option value="">No app access</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || user.email} - {user.email}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#111] mb-1">Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 text-[#111] focus:ring-black/20 border-black/10 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-[#111]">
                    Active
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 border border-black/10 rounded-lg text-[#111] hover:bg-white/60"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 glass-button text-white rounded-lg hover:scale-105 transition-transform disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : editingEmployee ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
