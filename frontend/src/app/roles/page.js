'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import useRoleStore from '@/stores/roleStore';
import { useAuthStore } from '@/stores/authStore';
import { Shield, Plus, Edit, Trash2, X, Check } from 'lucide-react';

export default function RolesPage() {
  const router = useRouter();
  const { user, isHydrated } = useAuthStore();
  const { roles, loading, error, pagination, fetchRoles, createRole, updateRole, deleteRole, fetchPermissions, clearError } = useRoleStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    permissions: [],
    isActive: true
  });

  useEffect(() => {
    if (isHydrated && !user) {
      router.push('/login');
    }
  }, [isHydrated, user, router]);

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    if (user) {
      loadRoles();
      loadPermissions();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadRoles();
    }
  }, [searchTerm, statusFilter, pagination.page]);

  const loadRoles = async () => {
    try {
      await fetchRoles({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        isActive: statusFilter,
        includeSystem: 'true'
      });
    } catch (error) {
      console.error('Failed to load roles:', error);
    }
  };

  const loadPermissions = async () => {
    try {
      const perms = await fetchPermissions();
      setAvailablePermissions(perms);
    } catch (error) {
      console.error('Failed to load permissions:', error);
    }
  };

  const handleOpenModal = (roleToEdit = null) => {
    if (roleToEdit) {
      if (roleToEdit.isSystemRole) {
        alert('System roles cannot be edited');
        return;
      }
      setEditingRole(roleToEdit);
      setFormData({
        name: roleToEdit.name,
        code: roleToEdit.code,
        description: roleToEdit.description || '',
        permissions: roleToEdit.permissions || [],
        isActive: roleToEdit.isActive
      });
    } else {
      setEditingRole(null);
      setFormData({
        name: '',
        code: '',
        description: '',
        permissions: [],
        isActive: true
      });
    }
    setShowModal(true);
    clearError();
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRole(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      permissions: [],
      isActive: true
    });
    clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRole) {
        await updateRole(editingRole.id, formData);
      } else {
        await createRole(formData);
      }
      handleCloseModal();
      loadRoles();
    } catch (error) {
      console.error('Error saving role:', error);
    }
  };

  const handleDelete = async (id, roleName, isSystemRole) => {
    if (isSystemRole) {
      alert('System roles cannot be deleted');
      return;
    }
    if (window.confirm(`Are you sure you want to delete role "${roleName}"?`)) {
      try {
        await deleteRole(id);
        loadRoles();
      } catch (error) {
        console.error('Error deleting role:', error);
        alert(error.response?.data?.error || 'Failed to delete role');
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

  const handlePermissionToggle = (permCode) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permCode)
        ? prev.permissions.filter(p => p !== permCode)
        : [...prev.permissions, permCode]
    }));
  };

  const groupPermissionsByCategory = () => {
    const grouped = {};
    availablePermissions.forEach(perm => {
      if (!grouped[perm.category]) {
        grouped[perm.category] = [];
      }
      grouped[perm.category].push(perm);
    });
    return grouped;
  };

  if (!isHydrated || !user) {
    return null;
  }

  if (user.role !== 'ADMIN') {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-white/60 border border-black/10 rounded-lg p-4">
            <p className="text-[#111]">Access Denied. Only admins can manage roles.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-pink-600" />
            <div>
              <h1 className="text-3xl font-bold text-[#111]">Roles & Permissions</h1>
              <p className="text-[#333]">Define user roles and access control</p>
            </div>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center space-x-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Add Role</span>
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-white/60 border border-black/10 rounded-lg flex justify-between items-center">
            <p className="text-[#111]">{error}</p>
            <button onClick={clearError} className="text-[#111] hover:scale-110 transition-transform">
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="glass-card shadow mb-6 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#111] mb-2">Search</label>
              <input
                type="text"
                placeholder="Search by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#111] mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Roles Table */}
        <div className="glass-card shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
              <p className="mt-2 text-[#333]">Loading roles...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-black/10">
                  <thead className="bg-white/60">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#333] uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#333] uppercase tracking-wider">
                        Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#333] uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#333] uppercase tracking-wider">
                        Permissions
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
                    {roles.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 text-center text-[#333]">
                          No roles found
                        </td>
                      </tr>
                    ) : (
                      roles.map((role) => (
                        <tr key={role.id} className="hover:bg-white/60">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-[#111]">{role.name}</div>
                              {role.description && (
                                <div className="text-sm text-[#333]">{role.description}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-mono bg-gray-100 text-[#111] rounded">
                              {role.code}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {role.isSystemRole ? (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-white/60 text-[#111]">
                                System
                              </span>
                            ) : (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-white/60 text-[#111]">
                                Custom
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-[#333]">
                              {role.permissions?.length || 0} permissions
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              role.isActive 
                                ? 'bg-white/60 text-[#111]' 
                                : 'bg-white/60 text-[#111]'
                            }`}>
                              {role.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleOpenModal(role)}
                                disabled={role.isSystemRole}
                                className={`text-[#111] hover:text-[#111] ${role.isSystemRole ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title={role.isSystemRole ? 'System roles cannot be edited' : 'Edit role'}
                              >
                                <Edit className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleDelete(role.id, role.name, role.isSystemRole)}
                                disabled={role.isSystemRole}
                                className={`text-[#111] hover:scale-110 transition-transform ${role.isSystemRole ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title={role.isSystemRole ? 'System roles cannot be deleted' : 'Delete role'}
                              >
                                <Trash2 className="h-5 w-5" />
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
              {pagination.pages > 1 && (
                <div className="bg-white px-4 py-3 border-t border-black/10 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-[#111]">
                      Showing page <span className="font-medium">{pagination.page}</span> of{' '}
                      <span className="font-medium">{pagination.pages}</span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => fetchRoles({ ...pagination, page: pagination.page - 1 })}
                        disabled={pagination.page === 1}
                        className="px-3 py-1 border border-black/10 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/60"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => fetchRoles({ ...pagination, page: pagination.page + 1 })}
                        disabled={pagination.page === pagination.pages}
                        className="px-3 py-1 border border-black/10 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/60"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="glass-card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-[#111]">
                    {editingRole ? 'Edit Role' : 'Add New Role'}
                  </h2>
                  <button onClick={handleCloseModal} className="text-[#333] hover:text-[#111]">
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#111] mb-2">
                          Role Name <span className="text-[#111]">*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          placeholder="e.g., Asset Manager"
                          className="w-full px-4 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#111] mb-2">
                          Role Code <span className="text-[#111]">*</span>
                        </label>
                        <input
                          type="text"
                          name="code"
                          value={formData.code}
                          onChange={handleInputChange}
                          required
                          placeholder="e.g., ASSET_MGR"
                          className="w-full px-4 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent uppercase"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#111] mb-2">Description</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows="3"
                        placeholder="Describe the role and its responsibilities..."
                        className="w-full px-4 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#111] mb-2">Permissions</label>
                      <div className="border border-black/10 rounded-lg p-4 max-h-60 overflow-y-auto">
                        {Object.entries(groupPermissionsByCategory()).map(([category, perms]) => (
                          <div key={category} className="mb-4 last:mb-0">
                            <h4 className="font-medium text-[#111] mb-2">{category}</h4>
                            <div className="space-y-2">
                              {perms.map(perm => (
                                <label key={perm.code} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={formData.permissions.includes(perm.code)}
                                    onChange={() => handlePermissionToggle(perm.code)}
                                    className="rounded border-black/10 text-pink-600 focus:ring-pink-500"
                                  />
                                  <span className="text-sm text-[#111]">{perm.name}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                        className="rounded border-black/10 text-pink-600 focus:ring-pink-500"
                      />
                      <label className="ml-2 text-sm text-[#111]">Active</label>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
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
                      className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : editingRole ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
