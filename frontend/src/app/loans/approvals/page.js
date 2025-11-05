'use client'

import { useEffect } from 'react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { useInventoryStore } from '@/stores'
import { toast } from '@/hooks/useToast'

export default function ApprovalLoansPage() {
  const { loans, loansLoading, fetchLoans, approveLoan } = useInventoryStore()

  useEffect(() => {
    fetchLoans({ status: 'PENDING_APPROVAL' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleApprove = async (id) => {
    const confirm = window.confirm('Approve this loan?')
    if (!confirm) return
    try {
      await approveLoan(id, { approved: true })
      toast.success('Loan approved')
      fetchLoans({ status: 'PENDING_APPROVAL' })
    } catch (err) {
      console.error(err)
      toast.error('Failed to approve')
    }
  }

  return (
    <DashboardLayout title="Loan Approvals">
      <div className="space-y-6">
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold">Pending Approvals</h2>
          {loansLoading ? (
            <div>Loading...</div>
          ) : (
            <div className="overflow-x-auto mt-4">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th>Loan#</th>
                    <th>Inventory</th>
                    <th>Borrower</th>
                    <th>Quantity</th>
                    <th>Requested At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loans.map((l) => (
                    <tr key={l.id} className="hover:bg-gray-50">
                      <td className="px-2 py-1">{l.loanNumber}</td>
                      <td className="px-2 py-1">{l.inventory?.inventoryTag} — {l.inventory?.asset?.name}</td>
                      <td className="px-2 py-1">{l.borrower?.firstName} {l.borrower?.lastName}</td>
                      <td className="px-2 py-1">{l.quantity}</td>
                      <td className="px-2 py-1">{new Date(l.createdAt).toLocaleString()}</td>
                      <td className="px-2 py-1">
                        <button onClick={() => handleApprove(l.id)} className="text-sm text-green-600">Approve</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
