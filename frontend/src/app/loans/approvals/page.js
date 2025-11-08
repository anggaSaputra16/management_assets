'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { useInventoryStore } from '@/stores'
import { toast } from '@/hooks/useToast'

export default function ApprovalLoansPage() {
  const { loans, loansLoading, fetchLoans, approveLoan } = useInventoryStore()
  const [filterTerm, setFilterTerm] = useState('')

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
          <h2 className="text-xl font-bold text-[#111] mb-4">Pending Approvals</h2>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#111]">Pending Approvals</h3>
            <div className="w-1/3">
              <input
                type="text"
                placeholder="Search approvals..."
                value={filterTerm}
                onChange={(e) => setFilterTerm(e.target.value)}
                className="glass-input w-full px-3 py-2 border rounded text-[#111]"
              />
            </div>
          </div>

          {loansLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#111]"></div>
            </div>
          ) : (
            <div className="glass-table overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-white/60">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#111] uppercase">Loan#</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#111] uppercase">Inventory</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#111] uppercase">Borrower</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#111] uppercase">Expected Return</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#111] uppercase">Quantity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#111] uppercase">Requested At</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#111] uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-black/10">
                  {(
                    (filterTerm ? loans.filter((l) => {
                      const ft = filterTerm.toLowerCase()
                      return (
                        (l.loanNumber || '').toLowerCase().includes(ft) ||
                        (l.inventory?.inventoryTag || '').toLowerCase().includes(ft) ||
                        (l.inventory?.asset?.name || '').toLowerCase().includes(ft) ||
                        (l.borrowerEmployee?.firstName || '').toLowerCase().includes(ft) ||
                        (l.borrowerEmployee?.lastName || '').toLowerCase().includes(ft) ||
                        (l.requestedBy?.firstName || '').toLowerCase().includes(ft) ||
                        (l.requestedBy?.lastName || '').toLowerCase().includes(ft) ||
                        (l.requestedBy?.email || '').toLowerCase().includes(ft)
                      )
                    }) : loans)
                  ).map((l) => (
                    <tr key={l.id} className="hover:bg-white/80 transition-colors">
                      <td className="px-4 py-3 text-sm text-[#111]">{l.loanNumber}</td>
                      <td className="px-4 py-3 text-sm text-[#111]">{l.inventory?.inventoryTag} — {l.inventory?.asset?.name}</td>
                      <td className="px-4 py-3 text-sm text-[#111]">{l.borrowerEmployee ? `${l.borrowerEmployee.firstName} ${l.borrowerEmployee.lastName}` : 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-[#111]">{l.expectedReturnDate ? new Date(l.expectedReturnDate).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-3 text-sm text-[#111]">{l.quantity}</td>
                      <td className="px-4 py-3 text-sm text-[#111]">{new Date(l.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm">
                        {l.approvedBy ? (
                          <span className="text-sm text-[#333]">Approved by {l.approvedBy.firstName} {l.approvedBy.lastName}</span>
                        ) : (
                          <button onClick={() => handleApprove(l.id)} className="glass-button text-[#111] px-3 py-1 rounded hover:opacity-90 transition-opacity">Approve</button>
                        )}
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
