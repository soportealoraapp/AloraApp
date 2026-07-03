'use client';

/**
 * Offline queue for persisting pending actions when the user is offline.
 * Stores items in localStorage per-user and retries when online.
 */

interface QueueItem {
    id: string;
    type: 'message' | 'like' | 'upload';
    payload: any;
    createdAt: string;
    retries: number;
    status: 'pending' | 'failed';
}

const QUEUE_KEY_PREFIX = 'alora_offline_queue';
const MAX_RETRIES = 5;

let _currentUserId: string | null = null;

function getQueueKey(): string {
    if (!_currentUserId) {
        throw new Error('offline-queue: currentUserId not set. Call setCurrentUserId() first.');
    }
    return `${QUEUE_KEY_PREFIX}_${_currentUserId}`;
}

export function setCurrentUserId(userId: string | null) {
    const previousUserId = _currentUserId;
    _currentUserId = userId;
    if (userId !== previousUserId && previousUserId) {
        clearQueueForUser(previousUserId);
    }
    if (userId && navigator.onLine) {
        processQueue();
    }
}

function getQueue(): QueueItem[] {
    try {
        const raw = localStorage.getItem(getQueueKey());
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveQueue(queue: QueueItem[]) {
    try {
        localStorage.setItem(getQueueKey(), JSON.stringify(queue));
    } catch {}
}

export function addToQueue(type: QueueItem['type'], payload: any) {
    const queue = getQueue();
    if (type === 'message' && payload?.matchId && payload?.text) {
        const duplicate = queue.find(
            item => item.type === 'message'
                && item.status === 'pending'
                && item.payload?.matchId === payload.matchId
                && item.payload?.text === payload.text
        );
        if (duplicate) return queue.length;
    }
    queue.push({
        id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        payload,
        createdAt: new Date().toISOString(),
        retries: 0,
        status: 'pending',
    });
    saveQueue(queue);
    return queue.length;
}

export function removeFromQueue(id: string) {
    const queue = getQueue().filter(item => item.id !== id);
    saveQueue(queue);
}

export function getPendingItems(): QueueItem[] {
    return getQueue().filter(item => item.status !== 'failed');
}

export function getFailedItems(): QueueItem[] {
    return getQueue().filter(item => item.status === 'failed');
}

export function retryFailedItem(id: string): boolean {
    const queue = getQueue();
    const item = queue.find(i => i.id === id);
    if (!item || item.status !== 'failed') return false;
    item.status = 'pending';
    item.retries = 0;
    saveQueue(queue);
    return true;
}

export function incrementRetry(id: string): boolean {
    const queue = getQueue();
    const item = queue.find(i => i.id === id);
    if (!item) return false;

    item.retries++;
    if (item.retries >= MAX_RETRIES) {
        item.status = 'failed';
        saveQueue(queue);
        return false;
    }
    saveQueue(queue);
    return true;
}

export function clearQueue() {
    localStorage.removeItem(getQueueKey());
}

function clearQueueForUser(userId: string) {
    localStorage.removeItem(`${QUEUE_KEY_PREFIX}_${userId}`);
}

export async function processQueue() {
    if (!_currentUserId) return;

    const queue = getQueue();
    if (queue.length === 0) return;

    const online = navigator.onLine;
    if (!online) return;

    for (const item of queue) {
        try {
            const response = await fetch(getEndpointForType(item.type), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item.payload),
            });

            if (response.ok) {
                removeFromQueue(item.id);
            } else {
                incrementRetry(item.id);
            }
        } catch {
            incrementRetry(item.id);
        }
    }
}

function getEndpointForType(type: string): string {
    switch (type) {
        case 'message': return '/api/chat/send';
        case 'like': return '/api/match/like';
        case 'upload': return '/api/chat/upload';
        default: return '/api/unknown';
    }
}

let onlineEventListenerRegistered = false;

export function initOfflineQueue(userId: string) {
    setCurrentUserId(userId);

    if (typeof window !== 'undefined' && !onlineEventListenerRegistered) {
        onlineEventListenerRegistered = true;
        window.addEventListener('online', () => {
            processQueue();
        });
    }
}

export function destroyOfflineQueue() {
    setCurrentUserId(null);
}
