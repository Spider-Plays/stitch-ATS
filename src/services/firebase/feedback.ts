import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Feedback } from '../../types';

const COLLECTION_NAME = 'feedback';

export const feedbackService = {
    getByInterviewId: async (interviewId: string): Promise<Feedback[]> => {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('interviewId', '==', interviewId),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Feedback));
    },

    getByCandidateId: async (candidateId: string): Promise<Feedback[]> => {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('candidateId', '==', candidateId),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Feedback));
    },

    create: async (data: Omit<Feedback, 'id'>): Promise<Feedback> => {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...data,
            createdAt: new Date().toISOString()
        });
        return { id: docRef.id, ...data } as Feedback;
    }
};
