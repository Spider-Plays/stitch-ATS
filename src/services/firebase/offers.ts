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
import { Offer } from '../../types';

const COLLECTION_NAME = 'offers';

export const offerService = {
    getAll: async (): Promise<Offer[]> => {
        const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Offer));
    },

    getById: async (id: string): Promise<Offer | undefined> => {
        const docRef = doc(db, COLLECTION_NAME, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Offer;
        }
        return undefined;
    },

    getByCandidateId: async (candidateId: string): Promise<Offer[]> => {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('candidateId', '==', candidateId),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Offer));
    },

    create: async (data: Omit<Offer, 'id' | 'createdAt'>): Promise<Offer> => {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...data,
            createdAt: new Date().toISOString(),
            status: 'DRAFT',
            history: [{
                id: crypto.randomUUID(),
                date: new Date().toISOString(),
                action: 'CREATED',
                description: 'Offer draft created',
                userId: data.createdBy
            }]
        });
        return { id: docRef.id, ...data, createdAt: new Date().toISOString() } as unknown as Offer; // Type assertion to avoid complex Omit issues
    },

    update: async (id: string, data: Partial<Offer>, userId: string): Promise<void> => {
        const docRef = doc(db, COLLECTION_NAME, id);

        // If status changing, add to history
        let historyUpdate = {};
        if (data.status) {
            const docSnap = await getDoc(docRef);
            const currentOffer = docSnap.data() as Offer;
            const newHistoryItem = {
                id: crypto.randomUUID(),
                date: new Date().toISOString(),
                action: 'STATUS_CHANGE',
                description: `Status changed from ${currentOffer.status} to ${data.status}`,
                userId: userId
            };
            historyUpdate = {
                history: [...(currentOffer.history || []), newHistoryItem]
            };
        }

        await updateDoc(docRef, { ...data, ...historyUpdate });
    },

    updateStatus: async (id: string, status: Offer['status']): Promise<void> => {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, { status });
    }
};
