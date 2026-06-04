import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './useAuth'

export function useLogout() {
  const { logout, user } = useAuth()
  const navigate = useNavigate()

  return useCallback(async () => {
    const role = user?.role
    await logout()
    if (role === 'CANDIDATE') {
      navigate('/portal/login', { replace: true })
    } else {
      navigate('/login', { replace: true })
    }
  }, [logout, navigate, user?.role])
}
