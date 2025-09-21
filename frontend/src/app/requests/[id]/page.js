'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Edit, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Package,
  AlertCircle,
  MessageSquare,
  Activity
} from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/lib/api'

export default function RequestDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchRequest()
    }
  }, [params.id, fetchRequest])

  const fetchRequest = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get(`/requests/${params.id}`)
      
      if (response.data.success) {
        setRequest(response.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch request:', error)
      router.push('/requests')
    } finally {
      setLoading(false)
    }
  }, [params.id, router])

  const handleApproveRequest = async () => {
    if (!confirm('Are you sure you want to approve this request?')) return

    try {
      await api.post(`/requests/${params.id}/approve`)
      fetchRequest()
      alert('Request approved successfully!')
    } catch (error) {
      console.error('Failed to approve request:', error)
      alert('Failed to approve request')
    }
  }

  const handleRejectRequest = async () => {
    const reason = prompt('Please provide a reason for rejection:')
    if (!reason) return

    try {
      await api.post(`/requests/${params.id}/reject`, { rejectedReason: reason })
      fetchRequest()
      alert('Request rejected successfully!')
    } catch (error) {
      console.error('Failed to reject request:', error)
      alert('Failed to reject request')
    }
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return

    try {
      setSubmittingComment(true)
      await api.post(`/requests/${params.id}/comments`, { 
        comment: comment.trim() 
      })
      setComment('')
      fetchRequest()
    } catch (error) {
      console.error('Failed to add comment:', error)
      alert('Failed to add comment')
    } finally {
      setSubmittingComment(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'PENDING': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'APPROVED': 'bg-green-100 text-green-800 border-green-200',
      'REJECTED': 'bg-red-100 text-red-800 border-red-200',
      'ALLOCATED': 'bg-blue-100 text-blue-800 border-blue-200',
      'COMPLETED': 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getPriorityColor = (priority) => {
    const colors = {
      'LOW': 'bg-gray-100 text-gray-800 border-gray-200',
      'MEDIUM': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'HIGH': 'bg-orange-100 text-orange-800 border-orange-200',
      'URGENT': 'bg-red-100 text-red-800 border-red-200'
    }
    return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getStatusIcon = (status) => {
    const icons = {
      'PENDING': Clock,
      'APPROVED': CheckCircle,
      'REJECTED': XCircle,
      'ALLOCATED': Package,
      'COMPLETED': CheckCircle
    }
    return icons[status] || Clock
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-32 bg-gray-200 rounded mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!request) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Request not found</h3>
          <p className="mt-1 text-sm text-gray-500">The request you&apos;re looking for doesn&apos;t exist.</p>
          <div className="mt-6">
            <button
              onClick={() => router.push('/requests')}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Back to Requests
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const StatusIcon = getStatusIcon(request.status)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/requests')}
              className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Request Details</h1>
              <p className="text-gray-600">Request #{request.id}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Action buttons based on status and permissions */}
            {request.status === 'PENDING' && ['ADMIN', 'ASSET_ADMIN', 'MANAGER'].includes(user?.role) && (
              <>
                <button
                  onClick={handleApproveRequest}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </button>
                <button
                  onClick={handleRejectRequest}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </button>
              </>
            )}
            
            {(request.requesterId === user?.id || ['ADMIN', 'ASSET_ADMIN'].includes(user?.role)) && 
             request.status === 'PENDING' && (
              <button
                onClick={() => router.push(`/requests/${request.id}/edit`)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Request Overview */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Request Information</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Title</label>
                    <p className="mt-1 text-lg font-semibold text-gray-900">{request.title}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Description</label>
                    <p className="mt-1 text-gray-900">{request.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Type</label>
                      <p className="mt-1 text-gray-900">{request.type}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Priority</label>
                      <span className={`inline-flex mt-1 px-3 py-1 text-sm font-medium rounded-full border ${getPriorityColor(request.priority)}`}>
                        {request.priority}
                      </span>
                    </div>
                  </div>

                  {request.justification && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Justification</label>
                      <p className="mt-1 text-gray-900">{request.justification}</p>
                    </div>
                  )}

                  {request.estimatedCost && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Estimated Cost</label>
                      <p className="mt-1 text-gray-900">
                        {new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR'
                        }).format(request.estimatedCost)}
                      </p>
                    </div>
                  )}

                  {request.rejectedReason && (
                    <div>
                      <label className="text-sm font-medium text-red-700">Rejection Reason</label>
                      <p className="mt-1 text-red-900 bg-red-50 p-3 rounded-lg border border-red-200">
                        {request.rejectedReason}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Related Asset */}
            {request.asset && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Related Asset</h3>
                </div>
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Package className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-medium text-gray-900">{request.asset.name}</h4>
                      <p className="text-gray-600">{request.asset.description}</p>
                      <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Category:</span>
                          <span className="ml-2 text-gray-900">{request.asset.category?.name || '-'}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Code:</span>
                          <span className="ml-2 text-gray-900">{request.asset.code}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Status:</span>
                          <span className="ml-2 text-gray-900">{request.asset.status}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Location:</span>
                          <span className="ml-2 text-gray-900">{request.asset.location?.name || '-'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Comments/Activity */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Comments & Activity</h3>
              </div>
              <div className="p-6">
                {/* Add Comment Form */}
                <form onSubmit={handleAddComment} className="mb-6">
                  <div className="flex space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Add a comment..."
                        rows={3}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <div className="mt-2 flex justify-end">
                        <button
                          type="submit"
                          disabled={!comment.trim() || submittingComment}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {submittingComment ? 'Adding...' : 'Add Comment'}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>

                {/* Activity Timeline */}
                <div className="space-y-4">
                  {/* System Activities */}
                  <div className="flex space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Activity className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-900">
                          Request created by <span className="font-medium">{request.requester?.firstName} {request.requester?.lastName}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(request.createdAt).toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status Changes */}
                  {request.approvedAt && (
                    <div className="flex space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="bg-green-50 rounded-lg p-3">
                          <p className="text-sm text-gray-900">
                            Request approved by <span className="font-medium">{request.approver?.firstName} {request.approver?.lastName}</span>
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(request.approvedAt).toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {request.rejectedAt && (
                    <div className="flex space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                          <XCircle className="h-4 w-4 text-red-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="bg-red-50 rounded-lg p-3">
                          <p className="text-sm text-gray-900">
                            Request rejected by <span className="font-medium">{request.approver?.firstName} {request.approver?.lastName}</span>
                          </p>
                          {request.rejectedReason && (
                            <p className="text-sm text-red-700 mt-1">Reason: {request.rejectedReason}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(request.rejectedAt).toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Comments would be loaded here from API */}
                  {request.comments && request.comments.map((comment, index) => (
                    <div key={index} className="flex space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                          <MessageSquare className="h-4 w-4 text-gray-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm text-gray-900">{comment.content}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            by {comment.user?.firstName} {comment.user?.lastName} • {new Date(comment.createdAt).toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Status</h3>
              </div>
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <StatusIcon className="h-6 w-6 text-gray-600" />
                  <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(request.status)}`}>
                    {request.status}
                  </span>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span className="text-gray-900">{new Date(request.createdAt).toLocaleDateString('id-ID')}</span>
                  </div>
                  
                  {request.approvedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Approved:</span>
                      <span className="text-gray-900">{new Date(request.approvedAt).toLocaleDateString('id-ID')}</span>
                    </div>
                  )}
                  
                  {request.rejectedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rejected:</span>
                      <span className="text-gray-900">{new Date(request.rejectedAt).toLocaleDateString('id-ID')}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="text-gray-900">{new Date(request.updatedAt).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Requester Info */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Requester</h3>
              </div>
              <div className="p-6">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">
                      {request.requester?.firstName} {request.requester?.lastName}
                    </h4>
                    <p className="text-sm text-gray-600">{request.requester?.email}</p>
                    <p className="text-sm text-gray-600">{request.requester?.department?.name}</p>
                    <p className="text-xs text-gray-500 mt-1">Role: {request.requester?.role}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Approver Info */}
            {request.approver && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    {request.status === 'APPROVED' ? 'Approved By' : 'Rejected By'}
                  </h3>
                </div>
                <div className="p-6">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {request.approver.firstName} {request.approver.lastName}
                      </h4>
                      <p className="text-sm text-gray-600">{request.approver.email}</p>
                      <p className="text-sm text-gray-600">{request.approver.department?.name}</p>
                      <p className="text-xs text-gray-500 mt-1">Role: {request.approver.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
