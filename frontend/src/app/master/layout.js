import AuthGuard from '@/components/AuthGuard'

export default function MasterLayout({ children }) {
  return (
    <AuthGuard>
      <div className="w-full max-w-full ">
        {children}
      </div>
    </AuthGuard>
  )
}