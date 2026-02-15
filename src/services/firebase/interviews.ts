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
import { Interview } from '../../types';

const COLLECTION_NAME = 'interviews';

export const interviewService = {
    getAll: async (): Promise<Interview[]> => {
        const q = query(collection(db, COLLECTION_NAME), orderBy('scheduledAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Interview));
    },

    getById: async (id: string): Promise<Interview | undefined> => {
        const docRef = doc(db, COLLECTION_NAME, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Interview;
        }
        return undefined;
    },

    getByApplicationId: async (applicationId: string): Promise<Interview[]> => {
        // Not used anymore in new design but keeping for reference if needed
        return [];
    },

    getByRequirementId: async (requirementId: string): Promise<Interview[]> => {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('requirementId', '==', requirementId),
            orderBy('scheduledAt', 'asc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Interview));
    },

    getByCandidateId: async (candidateId: string): Promise<Interview[]> => {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('candidateId', '==', candidateId),
            orderBy('scheduledAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Interview));
    },

    create: async (data: Omit<Interview, 'id'>): Promise<Interview> => {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...data,
            createdAt: new Date().toISOString()
        });
        return { id: docRef.id, ...data } as Interview;
    },

    updateStatus: async (id: string, status: Interview['status']): Promise<void> => {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, { status });
    },

    update: async (id: string, data: Partial<Interview>): Promise<void> => {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, data);
    }
};
