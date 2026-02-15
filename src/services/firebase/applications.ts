import {
    collection,
    addDoc,
    updateDoc,
    doc,
    getDocs,
    query,
    where,
    orderBy
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

// Since there isn't an Application type in types/index.ts yet, I'll define a local interface 
// or I should arguably add it to types/index.ts. 
// For now, I'll assume the structure matches what was requested.

export interface Application {
    id: string;
    candidateId: string;
    requirementId: string;
    stage: string;
    sourcedBy: string;
    createdAt: string;
}

const COLLECTION_NAME = 'applications';

export const applicationService = {
    create: async (data: Omit<Application, 'id'>): Promise<Application> => {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...data,
            createdAt: new Date().toISOString()
        });
        return { id: docRef.id, ...data } as Application;
    },

    getByCandidateId: async (candidateId: string): Promise<Application[]> => {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('candidateId', '==', candidateId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
    },

    getByRequirementId: async (requirementId: string): Promise<Application[]> => {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('requirementId', '==', requirementId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
    },

    updateStage: async (id: string, stage: string): Promise<void> => {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, { stage });
    }
};
