import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { useAuthStore } from '@/store/authStore'
import { loginService } from './loginService'
import { appConfig } from '@/app/config'

export function useLogin() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)

  return useMutation({
    mutationFn: loginService.login,
    onSuccess: (data) => {
      if (data.pendingDeviceApproval) return
      localStorage.setItem(appConfig.tokenKey, data.auth.access_token)
      localStorage.setItem(appConfig.refreshTokenKey, data.auth.refresh_token)
      const session = { employee:data.employee, role:data.role, permissions:data.permissions || [], notifications:data.notifications || [], shift:data.shift ?? null }
      localStorage.setItem('auth_session', JSON.stringify(session))
      setAuth(session)
      navigate('/admin', { replace:true })
    },
  })
}
