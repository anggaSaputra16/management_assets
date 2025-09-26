'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useUserStore } from '@/stores/userStore'
import { useDepartmentStore } from '@/stores/departmentStore'
import { Plus, Edit, Trash2, Eye } from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import DataTable from '@/components/ui/DataTable'
import Modal from '@/components/ui/Modal'

export default function UsersPage() {
  const { user } = useAuthStore()
  const { 
    users, 
    loading, 
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    changePassword
  } = useUserStore()
  
  const { departments, fetchDepartments } = useDepartmentStore()

  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [userToDelete, setUserToDelete] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    phone: '',
    role: '',
    departmentId: '',
    isActive: true
  })

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  })

  const roles = [
    'ADMIN',
    'ASSET_ADMIN', 
    'MANAGER',
    'DEPARTMENT_USER',
    'TECHNICIAN',
    'AUDITOR',
    'TOP_MANAGEMENT'
  ]

  useEffect(() => {
    fetchUsers()
    fetchDepartments()
  }, [fetchUsers, fetchDepartments])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const submitData = {
        ...formData,
        departmentId: formData.departmentId || null
      }
      
      if (editingUser) {
        await updateUser(editingUser.id, submitData)
      } else {
        await createUser(submitData)
      }
      setShowModal(false)
      resetForm()
    } catch (error) {
      console.error('Error saving user:', error)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Passwords do not match')
      return
    }
    
    try {
      await changePassword(selectedUser.id, {
        newPassword: passwordData.newPassword
      })
      setShowPasswordModal(false)
      setPasswordData({ newPassword: '', confirmPassword: '' })
    } catch (error) {
      console.error('Error changing password:', error)
    }
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
      password: '',
      phone: user.phone || '',
      role: user.role,
      departmentId: user.departmentId?.toString() || '',
      isActive: user.isActive
    })
    setShowModal(true)
  }

  const handleDelete = async () => {
    if (userToDelete) {
      try {
        await deleteUser(userToDelete.id)
        setShowDeleteModal(false)
        setUserToDelete(null)
      } catch (error) {
        console.error('Error deleting user:', error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      username: '',
      password: '',
      phone: '',
      role: '',
      departmentId: '',
      isActive: true
    })
    setEditingUser(null)
  }

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'department', label: 'Department' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: 'Actions', isAction: true }
  ]

  const formatCellValue = (item, key) => {
    switch (key) {
      case 'name':
        return `${item.firstName} ${item.lastName}`
      case 'role':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
            {item.role.replace('_', ' ')}
          </span>
        )
      case 'department':
        return item.department?.name || 'N/A'
      case 'status':
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            item.isActive 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {item.isActive ? 'Active' : 'Inactive'}
          </span>
        )
      default:
        return item[key] || 'N/A'
    }
  }

  const renderActions = (item) => (
    <div className="flex space-x-2">
      <button
        onClick={() => handleEdit(item)}
        className="text-blue-600 hover:text-blue-900"
        title="Edit User"
      >
        <Edit className="w-4 h-4" />
      </button>
      <button
        onClick={() => {
          setSelectedUser(item)
          setShowPasswordModal(true)
        }}
        className="text-green-600 hover:text-green-900"
        title="Change Password"
      >
        <Eye className="w-4 h-4" />
      </button>
      <button
        onClick={() => {
          setUserToDelete(item)
          setShowDeleteModal(true)
        }}
        className="text-red-600 hover:text-red-900"
        title="Delete User"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )

  if (!user) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  return (
    <DashboardLayout title="Users">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add User</span>
        </button>
      </div>

      <DataTable
        data={users}
        columns={columns}
        loading={loading}
        formatCellValue={formatCellValue}
        renderActions={renderActions}
      />

      {/* Add/Edit Modal */}
      {showModal && (
        <Modal
          title={editingUser ? 'Edit User' : 'Add New User'}
          onClose={() => {
            setShowModal(false)
            resetForm()
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
                  placeholder="Enter first name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
                  placeholder="Enter last name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
                  placeholder="Enter username"
                />
              </div>

              {!editingUser && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
                    placeholder="Enter password"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Role</option>
                  {roles.map(role => (
                    <option key={role} value={role}>{role.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <select
                  value={formData.departmentId}
                  onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : (editingUser ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && selectedUser && (
        <Modal
          title="Change Password"
          onClose={() => {
            setShowPasswordModal(false)
            setPasswordData({ newPassword: '', confirmPassword: '' })
          }}
        >
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm text-gray-600">
                User: <span className="font-medium">{selectedUser.firstName} {selectedUser.lastName}</span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password *
              </label>
              <input
                type="password"
                required
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
                placeholder="Enter new password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password *
              </label>
              <input
                type="password"
                required
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
                placeholder="Confirm new password"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordModal(false)
                  setPasswordData({ newPassword: '', confirmPassword: '' })
                }}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <Modal
          title="Delete User"
          onClose={() => {
            setShowDeleteModal(false)
            setUserToDelete(null)
          }}
        >
          <p className="mb-4">
            Are you sure you want to delete <strong>{userToDelete?.firstName} {userToDelete?.lastName}</strong>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                setShowDeleteModal(false)
                setUserToDelete(null)
              }}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  )
}