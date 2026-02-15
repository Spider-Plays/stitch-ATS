import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    getDocs,
    limit
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ActivityLog } from '../../types';

const COLLECTION_NAME = 'activity_logs';

export const activityLogService = {
    logActivity: async (data: Omit<ActivityLog, 'id' | 'timestamp'>): Promise<void> => {
        try {
            await addDoc(collection(db, COLLECTION_NAME), {
                ...data,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error logging activity:', error);
            // We don't want to block the main flow if logging fails
        }
    },

    getByEntity: async (entityId: string, limitCount = 50): Promise<ActivityLog[]> => {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('entityId', '==', entityId),
            orderBy('timestamp', 'desc'),
            limit(limitCount)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as ActivityLog));
    },

    getAll: async (limitCount = 100): Promise<ActivityLog[]> => {
        const q = query(
            collection(db, COLLECTION_NAME),
            orderBy('timestamp', 'desc'),
            limit(limitCount)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as ActivityLog));
    }
};
