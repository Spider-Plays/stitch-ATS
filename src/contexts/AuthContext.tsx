import React, { createContext, useContext, useEffect, useState } from 'react'

import { User } from '../types'

import { authApi } from '../services/http/auth'

import { getToken, clearToken } from '../lib/apiClient'

import { ApiError } from '../lib/apiClient'

import { PageKey } from '@/permissions'



interface AuthContextType {

    user: User | null

    allowedPages: PageKey[]

    loading: boolean

    logout: () => Promise<void>

    login: (email: string, password: string) => Promise<{ user: User; allowedPages: PageKey[] }>

    refreshUser: () => Promise<void>

    setAllowedPages: (pages: PageKey[]) => void

}



export const AuthContext = createContext<AuthContextType>({

    user: null,

    allowedPages: [],

    loading: true,

    logout: async () => {},

    login: async () => {

        throw new Error('AuthProvider not mounted')

    },

    refreshUser: async () => {},

    setAllowedPages: () => {},

})



export const useAuth = () => useContext(AuthContext)



export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

    const [user, setUser] = useState<User | null>(null)

    const [allowedPages, setAllowedPages] = useState<PageKey[]>([])

    const [loading, setLoading] = useState(true)



    useEffect(() => {

        const init = async () => {

            if (!getToken()) {

                setLoading(false)

                return

            }

            try {

                const session = await authApi.me()

                setUser(session.user)

                setAllowedPages(session.allowedPages)

            } catch {

                clearToken()

                setUser(null)

                setAllowedPages([])

            } finally {

                setLoading(false)

            }

        }

        init()



        const onSessionExpired = () => {

            clearToken()

            setUser(null)

            setAllowedPages([])

        }

        window.addEventListener('auth:session-expired', onSessionExpired)

        return () => window.removeEventListener('auth:session-expired', onSessionExpired)

    }, [])



    const login = async (email: string, password: string) => {

        try {

            const session = await authApi.login(email, password)

            setUser(session.user)

            setAllowedPages(session.allowedPages)

            return session

        } catch (e) {

            if (e instanceof ApiError) {

                if (e.status === 403) throw new Error('ACCOUNT_DISABLED')

                if (e.status >= 500) {

                    throw new Error(e.message || 'SERVER_UNAVAILABLE')

                }

                throw new Error(e.message || 'INVALID_CREDENTIALS')

            }

            if (e instanceof TypeError || (e instanceof Error && e.message === 'Failed to fetch')) {

                throw new Error(

                    'Cannot reach API. Run npm run dev from the project root (client + server on port 4000).'

                )

            }

            throw new Error('INVALID_CREDENTIALS')

        }

    }



    const logout = async () => {

        authApi.logout()

        setUser(null)

        setAllowedPages([])

    }



    const refreshUser = async () => {

        if (!getToken()) return

        const session = await authApi.me()

        setUser(session.user)

        setAllowedPages(session.allowedPages)

    }



    return (

        <AuthContext.Provider

            value={{

                user,

                allowedPages,

                loading,

                logout,

                login,

                refreshUser,

                setAllowedPages,

            }}

        >

            {children}

        </AuthContext.Provider>

    )

}

