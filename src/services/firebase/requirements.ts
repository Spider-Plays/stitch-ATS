import {
    collection,
    addDoc,
    updateDoc,
    doc,
    getDocs,
    getDoc,
    query,
    where,
    orderBy,
    Timestamp,
    runTransaction
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Requirement, RequirementStatus, RequirementVersion, User } from '../../types';
import { activityLogService } from './activityLogs';

const COLLECTION_NAME = 'requirements';

export const requirementService = {
    getAll: async (): Promise<Requirement[]> => {
        const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Requirement));
    },

    getPending: async (): Promise<Requirement[]> => {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('status', '==', 'PENDING_APPROVAL'),
            orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Requirement));
    },

    getById: async (id: string): Promise<Requirement | undefined> => {
        const docRef = doc(db, COLLECTION_NAME, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Requirement;
        }
        return undefined;
    },

    create: async (data: Omit<Requirement, 'id' | 'createdAt' | 'filled' | 'updatedAt'>): Promise<Requirement> => {
        const timestamp = new Date().toISOString();
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...data,
            filled: 0,
            status: 'PENDING_APPROVAL', // Force initial status
            createdAt: timestamp,
            updatedAt: timestamp,
            recruiters: [],
            approval: { decision: 'PENDING' },
            approvalHistory: [{
                action: 'REQUESTED',
                by: data.createdBy || 'unknown',
                at: timestamp,
                role: data.createdByRole || 'unknown'
            }],
            currentVersion: 1,
            versions: []
        });

        // Log creation
        await activityLogService.logActivity({
            entityType: 'REQUIREMENT',
            entityId: docRef.id,
            action: 'CREATED',
            performedBy: data.createdBy || 'system',
            performerRole: data.createdByRole,
            details: { title: data.title }
        });

        return { id: docRef.id, ...data, filled: 0, createdAt: timestamp } as Requirement;
    },

    update: async (id: string, data: Partial<Requirement>, user?: { uid: string, role: string }): Promise<void> => {
        const docRef = doc(db, COLLECTION_NAME, id);

        await runTransaction(db, async (transaction) => {
            const docSnap = await transaction.get(docRef);
            if (!docSnap.exists()) throw new Error("Document does not exist!");

            const currentData = docSnap.data() as Requirement;
            const newVersion = (currentData.currentVersion || 0) + 1;
            const timestamp = new Date().toISOString();

            // Create version snapshot
            const versionSnapshot: RequirementVersion = {
                version: currentData.currentVersion || 1,
                changedBy: user?.uid || 'system',
                changedAt: timestamp,
                changes: data
            };

            transaction.update(docRef, {
                ...data,
                updatedAt: timestamp,
                currentVersion: newVersion,
                versions: [...(currentData.versions || []), versionSnapshot]
            });
        });

        if (user) {
            await activityLogService.logActivity({
                entityType: 'REQUIREMENT',
                entityId: id,
                action: 'UPDATED',
                performedBy: user.uid,
                performerRole: user.role,
                details: Object.keys(data)
            });
        }
    },

    updateStatus: async (id: string, status: RequirementStatus): Promise<void> => {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
            status,
            updatedAt: new Date().toISOString()
        });
    },

    approve: async (id: string, user: { uid: string, role: string }): Promise<void> => {
        const docRef = doc(db, COLLECTION_NAME, id);
        const timestamp = new Date().toISOString();

        await runTransaction(db, async (transaction) => {
            const docSnap = await transaction.get(docRef);
            if (!docSnap.exists()) throw new Error("Document does not exist!");
            const currentData = docSnap.data() as Requirement;

            const approvalEntry = {
                action: 'APPROVED',
                by: user.uid,
                at: timestamp,
                role: user.role
            };

            transaction.update(docRef, {
                status: 'LIVE',
                updatedAt: timestamp,
                approval: {
                    decision: 'APPROVED',
                    decidedBy: user.uid,
                    decidedAt: timestamp
                },
                approvalHistory: [...(currentData.approvalHistory || []), approvalEntry]
            });
        });

        await activityLogService.logActivity({
            entityType: 'REQUIREMENT',
            entityId: id,
            action: 'APPROVED',
            performedBy: user.uid,
            performerRole: user.role
        });
    },

    reject: async (id: string, user: { uid: string, role: string }): Promise<void> => {
        const docRef = doc(db, COLLECTION_NAME, id);
        const timestamp = new Date().toISOString();

        await runTransaction(db, async (transaction) => {
            const docSnap = await transaction.get(docRef);
            if (!docSnap.exists()) throw new Error("Document does not exist!");
            const currentData = docSnap.data() as Requirement;

            const rejectionEntry = {
                action: 'REJECTED',
                by: user.uid,
                at: timestamp,
                role: user.role
            };

            transaction.update(docRef, {
                status: 'REJECTED',
                updatedAt: timestamp,
                approval: {
                    decision: 'REJECTED',
                    decidedBy: user.uid,
                    decidedAt: timestamp
                },
                approvalHistory: [...(currentData.approvalHistory || []), rejectionEntry]
            });
        });

        await activityLogService.logActivity({
            entityType: 'REQUIREMENT',
            entityId: id,
            action: 'REJECTED',
            performedBy: user.uid,
            performerRole: user.role
        });
    },

    assignRecruiter: async (id: string, recruiterId: string, currentRecruiters: string[], assignedBy?: string): Promise<void> => {
        const docRef = doc(db, COLLECTION_NAME, id);
        if (!currentRecruiters.includes(recruiterId)) {
            await updateDoc(docRef, {
                recruiters: [...currentRecruiters, recruiterId],
                updatedAt: new Date().toISOString()
            });

            await activityLogService.logActivity({
                entityType: 'REQUIREMENT',
                entityId: id,
                action: 'RECRUITER_ASSIGNED',
                performedBy: assignedBy || 'system',
                details: { recruiterId }
            });
        }
    }
};
