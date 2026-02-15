import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    User as FirebaseUser,
    onAuthStateChanged,
    signOut as firebaseSignOut,
    GoogleAuthProvider,
    signInWithPopup
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    logout: () => Promise<void>;
    loginWithGoogle: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    logout: async () => { },
    loginWithGoogle: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
            console.log('[Auth] Auth state changed:', firebaseUser ? 'User logged in' : 'User logged out', firebaseUser?.uid);

            if (firebaseUser) {
                // Determine Auth Provider
                const providerId = firebaseUser.providerData[0]?.providerId || 'unknown';
                console.log('[Auth] Provider ID detected:', providerId);

                // 1. IMMEDIATE: Optimistically set user with default role to UNBLOCK UI
                const initialUser: User = {
                    uid: firebaseUser.uid,
                    name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                    email: firebaseUser.email || '',
                    role: 'CANDIDATE', // Fallback role as requested
                    permissions: [],
                    themePreference: 'system',
                    createdAt: new Date().toISOString(),
                    avatar: firebaseUser.photoURL || '',
                    authProvider: providerId,
                    status: 'ACTIVE'
                };

                if (firebaseUser.email === 'karthikvc06@gmail.com') {
                    initialUser.role = 'ADMIN';
                }

                setUser(initialUser);
                setLoading(false); // <--- CRITICAL: Stop spinner immediately

                // 2. BACKGROUND: Sync with Firestore (Does not block UI)
                try {
                    // Try to get existing user from Firestore
                    let appUser = await api.users.get(firebaseUser.uid);

                    if (!appUser) {
                        // Create if missing (ensure idempotent)
                        const isSuperAdmin = firebaseUser.email === 'karthikvc06@gmail.com';
                        const realRole: UserRole = isSuperAdmin ? 'ADMIN' : 'CANDIDATE';
                        initialUser.role = realRole;
                        // Confirm authProvider is set
                        initialUser.authProvider = providerId;
                        initialUser.status = 'ACTIVE';

                        console.log(`[Auth] Creating new user for ${firebaseUser.email} via ${providerId}`);
                        await api.users.create(initialUser);
                        appUser = initialUser;
                    } else {
                        // If user exists, we might want to update avatar if changed? 
                        // For now, respect Firestore as truth.
                    }

                    // Security: Force Admin Role Update
                    if (firebaseUser.email === 'karthikvc06@gmail.com') {
                        appUser.role = 'ADMIN'; // Force local state

                        // Try to persist, but don't fail flow if it errors
                        if (appUser.role !== 'ADMIN') {
                            api.users.updateRole(appUser.uid, 'ADMIN').catch(e => console.warn('Role persist failed', e));
                        }
                    }

                    // Update state with REAL data from Firestore
                    setUser(appUser);
                } catch (error) {
                    console.error("Background user sync warning:", error);
                    // If sync failed but we are super admin, ensure we stay ADMIN
                    if (firebaseUser.email === 'karthikvc06@gmail.com') {
                        setUser({ ...initialUser, role: 'ADMIN' });
                    }
                }
            } else {
                setUser(null);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const logout = async () => {
        await firebaseSignOut(auth);
    };

    const loginWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
    };

    return (
        <AuthContext.Provider value={{ user, loading, logout, loginWithGoogle }}>
            {children}
        </AuthContext.Provider>
    );
};
