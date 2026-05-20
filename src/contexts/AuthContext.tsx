import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '../types'
import { authApi } from '../services/http/auth'
import { getToken, clearToken } from '../lib/apiClient'
import { ApiError } from '../lib/apiClient'

interface AuthContextType {
    user: User | null
    loading: boolean
    logout: () => Promise<void>
    login: (email: string, password: string) => Promise<User>
}

export const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    logout: async () => {},
    login: async () => {
        throw new Error('AuthProvider not mounted')
    },
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const init = async () => {
            if (!getToken()) {
                setLoading(false)
                return
            }
            try {
                const me = await authApi.me()
                setUser(me)
            } catch {
                clearToken()
            } finally {
                setLoading(false)
            }
        }
        init()
    }, [])

    const login = async (email: string, password: string) => {
        try {
            const loggedInUser = await authApi.login(email, password)
            setUser(loggedInUser)
            return loggedInUser
        } catch (e) {
            if (e instanceof ApiError && e.status === 403) {
                throw new Error('ACCOUNT_DISABLED')
            }
            throw new Error('INVALID_CREDENTIALS')
        }
    }

    const logout = async () => {
        authApi.logout()
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, loading, logout, login }}>
            {children}
        </AuthContext.Provider>
    )
}
