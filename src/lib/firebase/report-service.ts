import {
    collection,
    addDoc,
    updateDoc,
    doc,
    query,
    where,
    getDocs,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import { Report } from './types';

export const reportService = {
    // Create report
    async createReport(
        reporterId: string,
        reportedId: string,
        reason: string,
        description?: string
    ): Promise<string> {
        const reportData = {
            reporterId,
            reportedId,
            reason,
            description,
            status: 'pending' as const,
            createdAt: serverTimestamp(),
        };

        const reportRef = await addDoc(collection(db, 'reports'), reportData);
        return reportRef.id;
    },

    // Get user's reports
    async getUserReports(userId: string): Promise<Report[]> {
        const reportsQuery = query(
            collection(db, 'reports'),
            where('reporterId', '==', userId)
        );

        const snapshot = await getDocs(reportsQuery);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: (doc.data().createdAt as Timestamp).toDate(),
            reviewedAt: doc.data().reviewedAt ? (doc.data().reviewedAt as Timestamp).toDate() : undefined,
        })) as Report[];
    },

    // Get reports against a user
    async getReportsAgainstUser(userId: string): Promise<Report[]> {
        const reportsQuery = query(
            collection(db, 'reports'),
            where('reportedId', '==', userId)
        );

        const snapshot = await getDocs(reportsQuery);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: (doc.data().createdAt as Timestamp).toDate(),
            reviewedAt: doc.data().reviewedAt ? (doc.data().reviewedAt as Timestamp).toDate() : undefined,
        })) as Report[];
    },

    // Review report (admin function)
    async reviewReport(reportId: string, reviewedBy: string, status: 'reviewed' | 'resolved'): Promise<void> {
        const reportRef = doc(db, 'reports', reportId);
        await updateDoc(reportRef, {
            status,
            reviewedAt: serverTimestamp(),
            reviewedBy,
        });
    },
};
