'use client';

/**
 * Offline queue for persisting pending actions when the user is offline.
 * Stores items in localStorage and retries when online.
 */

interface QueueItem {
    id: string;
    type: 'message' | 'like' | 'upload';
    payload: any;
    createdAt: string;
    retries: number;
    status: 'pending' | 'failed';
}

const QUEUE_KEY = 'alora_offline_queue';
const MAX_RETRIES = 5;

function getQueue(): QueueItem[] {
    try {
        const raw = localStorage.getItem(QUEUE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveQueue(queue: QueueItem[]) {
    try {
        localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    } catch {}
}

export function addToQueue(type: QueueItem['type'], payload: any) {
    const queue = getQueue();
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
    localStorage.removeItem(QUEUE_KEY);
}

export async function processQueue() {
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

// Auto-process queue when coming online or on app start
if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
        processQueue();
    });
    // Process any pending items immediately if already online
    if (navigator.onLine) {
        processQueue();
    }
}
