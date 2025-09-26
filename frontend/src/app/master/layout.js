import AuthGuard from '@/components/AuthGuard'

export default function MasterLayout({ children }) {
  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-6">
        {children}
      </div>
    </AuthGuard>
  )
}