import {
    collection,
    addDoc,
    updateDoc,
    doc,
    getDocs,
    getDoc,
    query,
    where,
    orderBy
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Candidate } from '../../types';
import { activityLogService } from './activityLogs';
import { auth } from '../../lib/firebase'; // Assuming auth is available here or pass user context

const COLLECTION_NAME = 'candidates';

export const candidateService = {
    getAll: async (): Promise<Candidate[]> => {
        const q = query(collection(db, COLLECTION_NAME), orderBy('appliedDate', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Candidate));
    },

    getByRequirementId: async (requirementId: string): Promise<Candidate[]> => {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('requirementId', '==', requirementId),
            orderBy('appliedDate', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Candidate));
    },

    getById: async (id: string): Promise<Candidate | undefined> => {
        const docRef = doc(db, COLLECTION_NAME, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Candidate;
        }
        return undefined;
    },

    create: async (data: Omit<Candidate, 'id'>): Promise<Candidate> => {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...data,
            appliedDate: new Date().toISOString(),
            createdAt: new Date().toISOString()
        });

        // Log activity
        const user = auth.currentUser;
        if (user) {
            await activityLogService.logActivity({
                entityType: 'CANDIDATE',
                entityId: docRef.id,
                action: 'CREATED',
                performedBy: user.uid,
                details: { name: data.name, role: data.role }
            });
        }

        return { id: docRef.id, ...data } as Candidate;
    },

    updateStatus: async (id: string, status: Candidate['status']): Promise<void> => {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
            status
        });

        // Log activity
        const user = auth.currentUser;
        if (user) {
            await activityLogService.logActivity({
                entityType: 'CANDIDATE',
                entityId: id,
                action: 'STATUS_CHANGED',
                performedBy: user.uid,
                details: { newStatus: status }
            });
        }
    },

    update: async (id: string, data: Partial<Candidate>): Promise<void> => {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, data);

        // Log activity
        const user = auth.currentUser;
        if (user) {
            await activityLogService.logActivity({
                entityType: 'CANDIDATE',
                entityId: id,
                action: 'UPDATED',
                performedBy: user.uid,
                details: Object.keys(data)
            });
        }
    }
};
