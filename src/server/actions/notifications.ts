'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getNotifications(userId: string) {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        return notifications;
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }
}

export async function markNotificationAsRead(notificationId: string) {
    try {
        await prisma.notification.update({
            where: { id: notificationId },
            data: { readAt: new Date() }
        });
        revalidatePath('/app');
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

export async function createNotification(userId: string, type: string, title: string, body: string) {
    try {
        await prisma.notification.create({
            data: {
                userId,
                type,
                title,
                body
            }
        });
    } catch (error) {
        console.error('Error creating notification', error);
    }
}
