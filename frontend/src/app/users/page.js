'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useUserStore, useLocationStore, useDepartmentStore, useAuthStore } from '@/stores';

export default function UsersPage() {
  const router = useRouter();
  const { user, isHydrated } = useAuthStore();
  const { users, loading, error, pagination, fetchUsers, createUser, updateUser, deleteUser, clearError } = useUserStore();
  const { locations, fetchLocations } = useLocationStore();
  const { departments, fetchDepartments } = useDepartmentStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'DEPARTMENT_USER',
    departmentId: '',
    locationId: '',
    isActive: true
  });

  useEffect(() => {
    if (isHydrated && !user) {
      router.push('/login');
    }
  }, [isHydrated, user, router]);

  useEffect(() => {
    if (user) {
      loadUsers();
      fetchLocations();
      fetchDepartments();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadUsers();
    }
  }, [searchTerm, roleFilter, departmentFilter, statusFilter, pagination.page]);

  const loadUsers = async () => {
    try {
      await fetchUsers({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        role: roleFilter,
        department: departmentFilter,
        status: statusFilter
      });
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleOpenModal = (userToEdit = null) => {
    if (userToEdit) {
      setEditingUser(userToEdit);
      setFormData({
        email: userToEdit.email,
        username: userToEdit.username,
        password: '', // Don't show password
        firstName: userToEdit.firstName,
        lastName: userToEdit.lastName,
        phone: userToEdit.phone || '',
        role: userToEdit.role,
        departmentId: userToEdit.department?.id || '',
        locationId: userToEdit.location?.id || '',
        isActive: userToEdit.isActive
      });
    } else {
      setEditingUser(null);
      setFormData({
        email: '',
        username: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        role: 'DEPARTMENT_USER',
        departmentId: '',
        locationId: '',
        isActive: true
      });
    }
    setShowModal(true);
    clearError();
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
      
      // Remove password if empty and editing
      if (editingUser && !submitData.password) {
        delete submitData.password;
      }

      // Convert empty strings to null
      if (!submitData.departmentId) submitData.departmentId = null;
      if (!submitData.locationId) submitData.locationId = null;

      if (editingUser) {
        await updateUser(editingUser.id, submitData);
      } else {
        await createUser(submitData);
      }
      handleCloseModal();
      loadUsers();
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const handleDelete = async (id, userName) => {
    if (window.confirm(`Are you sure you want to delete user "${userName}"?`)) {
      try {
        await deleteUser(id);
        loadUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        alert(error.response?.data?.error || 'Failed to delete user');
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (!isHydrated || !user) {
    return null;
  }

  const roles = [
    'ADMIN',
    'ASSET_ADMIN',
    'MANAGER',
    'DEPARTMENT_USER',
    'TECHNICIAN',
    'AUDITOR',
    'TOP_MANAGEMENT'
  ];

  const getRoleBadgeColor = (role) => {
    const colors = {
      ADMIN: 'bg-white/60 text-[#111]',
      ASSET_ADMIN: 'bg-white/60 text-[#111]',
      MANAGER: 'bg-white/60 text-[#111]',
      DEPARTMENT_USER: 'bg-gray-100 text-[#111]',
      TECHNICIAN: 'bg-white/60 text-[#111]',
      AUDITOR: 'bg-pink-100 text-pink-800',
      TOP_MANAGEMENT: 'bg-white/60 text-[#111]'
    };
    return colors[role] || 'bg-gray-100 text-[#111]';
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#111]">Users Management</h1>
            <p className="text-[#333] mt-1">Manage users and their roles</p>
          </div>
          {(user.role === 'ADMIN' || user.role === 'ASSET_ADMIN') && (
            <button
              onClick={() => handleOpenModal()}
              className="glass-button hover:scale-105 transition-transform text-white px-6 py-2 rounded-lg flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New User
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#111] mb-2">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search users..."
                className="w-full px-4 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#111] mb-2">Role</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-4 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-transparent"
              >
                <option value="">All Roles</option>
                {roles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#111] mb-2">Department</label>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full px-4 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-transparent"
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#111] mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="glass-card shadow overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black/10"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-black/10">
                  <thead className="bg-white/60">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#333] uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#333] uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#333] uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#333] uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#333] uppercase tracking-wider">
                        Location
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
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-4 text-center text-[#333]">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      users.map((usr) => (
                        <tr key={usr.id} className="hover:bg-white/60">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full glass-button flex items-center justify-center text-white font-semibold">
                                  {usr.firstName[0]}{usr.lastName[0]}
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-[#111]">
                                  {usr.firstName} {usr.lastName}
                                </div>
                                <div className="text-sm text-[#333]">@{usr.username}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[#333]">
                            {usr.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(usr.role)}`}>
                              {usr.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[#333]">
                            {usr.department?.name || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[#333]">
                            <div>
                              <div>{usr.location?.name || '-'}</div>
                              {usr.location?.building && (
                                <div className="text-xs text-[#333]">{usr.location.building} {usr.location.city ? `- ${usr.location.city}` : ''}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              usr.isActive 
                                ? 'bg-white/60 text-[#111]' 
                                : 'bg-white/60 text-[#111]'
                            }`}>
                              {usr.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleOpenModal(usr)}
                              className="text-[#111] hover:scale-110 transition-transform mr-4"
                            >
                              Edit
                            </button>
                            {(user.role === 'ADMIN' || user.role === 'ASSET_ADMIN') && usr.id !== user.id && (
                              <button
                                onClick={() => handleDelete(usr.id, `${usr.firstName} ${usr.lastName}`)}
                                className="text-[#111] hover:scale-110 transition-transform"
                              >
                                Delete
                              </button>
                            )}
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
                      onClick={() => fetchUsers({ ...{ searchTerm, roleFilter, departmentFilter, statusFilter }, page: pagination.page - 1 })}
                      disabled={pagination.page === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-black/10 text-sm font-medium rounded-md text-[#111] bg-white hover:bg-white/40 disabled:bg-gray-100"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => fetchUsers({ ...{ searchTerm, roleFilter, departmentFilter, statusFilter }, page: pagination.page + 1 })}
                      disabled={pagination.page === pagination.totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-black/10 text-sm font-medium rounded-md text-[#111] bg-white hover:bg-white/40 disabled:bg-gray-100"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-[#111]">
                        Showing page <span className="font-medium">{pagination.page}</span> of{' '}
                        <span className="font-medium">{pagination.totalPages}</span> ({pagination.total} total users)
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-[#111]">
                  {editingUser ? 'Edit User' : 'Add New User'}
                </h3>
                <button onClick={handleCloseModal} className="text-[#333] hover:text-[#333]">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {error && (
                <div className="mb-4 bg-white/60 border border-black/10 text-[#111] px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-[#111] mb-2">
                      First Name <span className="text-[#111]">*</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#111] mb-2">
                      Last Name <span className="text-[#111]">*</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#111] mb-2">
                      Username <span className="text-[#111]">*</span>
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#111] mb-2">
                      Email <span className="text-[#111]">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#111] mb-2">
                      Password {!editingUser && <span className="text-[#111]">*</span>}
                      {editingUser && <span className="text-[#333] text-xs">(leave empty to keep current)</span>}
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required={!editingUser}
                      className="w-full px-4 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#111] mb-2">Phone</label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#111] mb-2">
                      Role <span className="text-[#111]">*</span>
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-transparent"
                    >
                      {roles.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#111] mb-2">Department</label>
                    <select
                      name="departmentId"
                      value={formData.departmentId}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-transparent"
                    >
                      <option value="">No Department</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-[#111] mb-2">Location Assignment</label>
                    <select
                      name="locationId"
                      value={formData.locationId}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-transparent"
                    >
                      <option value="">No Location Assigned</option>
                      {locations.map(location => (
                        <option key={location.id} value={location.id}>
                          {location.name} {location.building ? `- ${location.building}` : ''} {location.city ? `(${location.city})` : ''}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-sm text-[#333]">Select the location where this user is assigned to work (e.g., Head Office, Branch)</p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                        className="mr-2 h-4 w-4 text-[#111] focus:ring-black/20 border-black/10 rounded"
                      />
                      <span className="text-sm font-medium text-[#111]">Active</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
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
                    className="px-4 py-2 glass-button text-white rounded-lg hover:scale-105 transition-transform disabled:bg-blue-400"
                  >
                    {loading ? 'Saving...' : editingUser ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
