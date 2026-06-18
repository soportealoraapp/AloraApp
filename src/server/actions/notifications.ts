'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

async function getAuthenticatedUserId(): Promise<string | null> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        return user?.id || null;
    } catch {
        return null;
    }
}

export async function getNotifications(userId: string) {
    const currentUserId = await getAuthenticatedUserId();
    if (!currentUserId || currentUserId !== userId) {
        return [];
    }

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
    const currentUserId = await getAuthenticatedUserId();
    if (!currentUserId) return;

    try {
        // Verify the notification belongs to the current user
        const notification = await prisma.notification.findUnique({
            where: { id: notificationId },
            select: { userId: true }
        });

        if (!notification || notification.userId !== currentUserId) {
            return;
        }

        await prisma.notification.update({
            where: { id: notificationId },
            data: { readAt: new Date() }
        });
        revalidatePath('/notifications');
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
