import { Navigate } from 'react-router-dom'

import { useAuthStore } from '@/store/authStore'

function ProtectedRoute({ children, pageKey }) {
  const employee = useAuthStore((state) => state.employee)
  const role = useAuthStore((state) => state.role)
  const permissions = useAuthStore((state) => state.permissions)
  const isAuthChecking = useAuthStore((state) => state.isAuthChecking)

  if (isAuthChecking) return <div className="route-loading" role="status">جاري التحقق من الجلسة...</div>

  if (!employee) {
    return <Navigate to="/login" replace />
  }

  if (pageKey && !["ADMIN", "MANAGER"].includes(role?.name)) {
    const flat = permissions.flatMap((entry) => entry.items || [entry])
    if (!flat.some((entry) => entry.page_key === pageKey && entry.visible !== false)) {
      return <div className="route-loading" role="alert">ليس لديك صلاحية لعرض هذه الصفحة.</div>
    }
  }

  return children
}

export default ProtectedRoute
