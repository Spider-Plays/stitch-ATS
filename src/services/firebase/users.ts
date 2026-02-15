import {
    collection,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    getDocs,
    query,
    where,
    orderBy
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { User, UserRole } from '../../types';

const COLLECTION_NAME = 'users';

export const userService = {
    getById: async (uid: string): Promise<User | undefined> => {
        const docRef = doc(db, COLLECTION_NAME, uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data() as User;
        }
        return undefined;
    },

    create: async (user: User): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, user.uid);
            await setDoc(docRef, user);
            console.log(`[UserService] Created user ${user.uid}`);
        } catch (error) {
            console.error(`[UserService] Failed to create user ${user.uid}:`, error);
            throw error;
        }
    },

    update: async (uid: string, data: Partial<User>): Promise<void> => {
        const docRef = doc(db, COLLECTION_NAME, uid);
        await updateDoc(docRef, {
            ...data,
            updatedAt: new Date().toISOString()
        });
    },

    list: async (): Promise<User[]> => {
        const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => doc.data() as User);
    },

    // Admin Functionality
    updateRole: async (uid: string, role: UserRole): Promise<void> => {
        const docRef = doc(db, COLLECTION_NAME, uid);
        await updateDoc(docRef, {
            role,
            updatedAt: new Date().toISOString()
        });
    },

    toggleStatus: async (uid: string, status: 'ACTIVE' | 'DISABLED'): Promise<void> => {
        const docRef = doc(db, COLLECTION_NAME, uid);
        await updateDoc(docRef, {
            status, // We might need to add this field to User type if not present
            updatedAt: new Date().toISOString()
        });
    }
};
