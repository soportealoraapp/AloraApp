'use client';

/**
 * Real mobile resilience for production Android/iOS.
 * Handles: reconnect strategy, background resume, stale WebSocket, memory pressure, battery-aware sync, offline queue.
 */

// ========== RECONNECT STRATEGY ==========

export class ReconnectCoordinator {
    private baseDelayMs = 1000;
    private maxDelayMs = 60000;
    private jitterFactor = 0.2;
    private attempt = 0;
    private timer: ReturnType<typeof setTimeout> | null = null;
    private onReconnect: (() => Promise<void>) | null = null;

    configure(onReconnect: () => Promise<void>) {
        this.onReconnect = onReconnect;
    }

    getNextDelay(): number {
        const exponential = Math.min(
            this.maxDelayMs,
            this.baseDelayMs * Math.pow(2, this.attempt)
        );
        const jitter = exponential * this.jitterFactor * (Math.random() * 2 - 1);
        this.attempt++;
        return Math.round(exponential + jitter);
    }

    reset() {
        this.attempt = 0;
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }

    async attemptReconnect(): Promise<boolean> {
        if (!this.onReconnect) return false;

        const delay = this.getNextDelay();
        return new Promise((resolve) => {
            this.timer = setTimeout(async () => {
                try {
                    await this.onReconnect!();
                    this.reset();
                    resolve(true);
                } catch {
                    resolve(false);
                }
            }, delay);
        });
    }

    getAttempt(): number {
        return this.attempt;
    }

    cleanup() {
        this.reset();
        this.onReconnect = null;
    }
}

// ========== BACKGROUND RESUME SYNC ==========

export class BackgroundSyncManager {
    private listeners: Array<() => void> = [];

    constructor() {
        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') {
                    this.notifyListeners();
                }
            });
        }
        if (typeof window !== 'undefined') {
            window.addEventListener('focus', () => this.notifyListeners());
            // App state for Capacitor
            try {
                const { App } = require('@capacitor/app');
                App.addListener('appStateChange', (state: { isActive: boolean }) => {
                    if (state.isActive) this.notifyListeners();
                });
            } catch {}
        }
    }

    onResume(callback: () => void): () => void {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    private notifyListeners() {
        for (const listener of this.listeners) {
            try { listener(); } catch {}
        }
    }
}

// ========== STALE REALTIME RECONNECT ==========

export class RealtimeHealthMonitor {
    private lastHeartbeat = Date.now();
    private heartbeatInterval = 30000;
    private staleThreshold = 90000;
    private timer: ReturnType<typeof setInterval> | null = null;
    private onStale: (() => void) | null = null;

    configure(onStale: () => void) {
        this.onStale = onStale;
    }

    start() {
        this.lastHeartbeat = Date.now();
        this.timer = setInterval(() => {
            const elapsed = Date.now() - this.lastHeartbeat;
            if (elapsed > this.staleThreshold) {
                this.onStale?.();
            }
        }, this.heartbeatInterval);
    }

    heartbeat() {
        this.lastHeartbeat = Date.now();
    }

    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
}

// ========== MEMORY PRESSURE HANDLING ==========

export class MemoryPressureManager {
    private onLowMemory: (() => void) | null = null;
    private cachedItems = new Map<string, any>();
    private maxCacheItems = 50;

    configure(onLowMemory: () => void) {
        this.onLowMemory = onLowMemory;
    }

    setCacheItem(key: string, value: any) {
        if (this.cachedItems.size >= this.maxCacheItems) {
            // Evict oldest on memory pressure
            const firstKey = this.cachedItems.keys().next().value;
            if (firstKey) this.cachedItems.delete(firstKey);
        }
        this.cachedItems.set(key, value);
    }

    getCacheItem(key: string): any | undefined {
        return this.cachedItems.get(key);
    }

    clearCache() {
        this.cachedItems.clear();
    }

    // Handle low memory signal from browser/Capacitor
    handleMemoryWarning() {
        this.clearCache();
        this.onLowMemory?.();
    }
}

// ========== BATTERY-AWARE SYNC ==========

export type BatteryStatus = 'charging' | 'high' | 'medium' | 'low' | 'unknown';

export class BatteryAwareSync {
    private level = 1.0;
    private charging = true;

    constructor() {
        if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
            (navigator as any).getBattery().then((battery: any) => {
                this.level = battery.level;
                this.charging = battery.charging;
                battery.addEventListener('levelchange', () => { this.level = battery.level; });
                battery.addEventListener('chargingchange', () => { this.charging = battery.charging; });
            }).catch(() => {});
        }
    }

    getStatus(): BatteryStatus {
        if (this.charging) return 'charging';
        if (this.level > 0.5) return 'high';
        if (this.level > 0.2) return 'medium';
        if (this.level <= 0.2) return 'low';
        return 'unknown';
    }

    shouldSync(): boolean {
        const status = this.getStatus();
        return status === 'charging' || status === 'high';
    }

    shouldDeferSync(): boolean {
        return this.getStatus() === 'low';
    }
}

// ========== OFFLINE IMAGE UPLOAD RETRY ==========

export class OfflineUploadQueue {
    private queue: Array<{
        id: string;
        file: File;
        endpoint: string;
        retries: number;
        maxRetries: number;
    }> = [];
    private processing = false;

    async enqueue(file: File, endpoint: string): Promise<string> {
        const id = `upload_${Date.now()}`;
        this.queue.push({ id, file, endpoint, retries: 0, maxRetries: 3 });

        if (!this.processing) {
            this.processing = true;
            this.processQueue().finally(() => { this.processing = false; });
        }

        return id;
    }

    private async processQueue(): Promise<void> {
        while (this.queue.length > 0) {
            const item = this.queue[0];

            if (typeof navigator !== 'undefined' && !navigator.onLine) {
                // Wait for connectivity
                await new Promise<void>((resolve) => {
                    const handler = () => { resolve(); window.removeEventListener('online', handler); };
                    window.addEventListener('online', handler);
                });
            }

            try {
                const formData = new FormData();
                formData.append('file', item.file);

                const response = await fetch(item.endpoint, {
                    method: 'POST',
                    body: formData,
                });

                if (response.ok) {
                    this.queue.shift();
                } else {
                    throw new Error(`Upload failed: ${response.status}`);
                }
            } catch (error) {
                item.retries++;
                if (item.retries >= item.maxRetries) {
                    this.queue.shift(); // Drop after max retries
                } else {
                    // Move to back of queue
                    this.queue.shift();
                    this.queue.push(item);
                    await new Promise(r => setTimeout(r, item.retries * 5000));
                }
            }
        }
    }
}

// ========== OPTIMISTIC MESSAGE REPLAY ==========

export class OptimisticReplayQueue {
    private pendingActions: Array<{
        id: string;
        action: string;
        payload: any;
        timestamp: number;
    }> = [];

    add(action: string, payload: any): string {
        const id = `optimistic_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        this.pendingActions.push({ id, action, payload, timestamp: Date.now() });
        this.persist();
        return id;
    }

    remove(id: string) {
        this.pendingActions = this.pendingActions.filter(a => a.id !== id);
        this.persist();
    }

    getAll() {
        return [...this.pendingActions];
    }

    hasPending(): boolean {
        return this.pendingActions.length > 0;
    }

    private persist() {
        try {
            localStorage.setItem('optimistic_queue', JSON.stringify(this.pendingActions));
        } catch {}
    }

    restore() {
        try {
            const saved = localStorage.getItem('optimistic_queue');
            if (saved) {
                this.pendingActions = JSON.parse(saved);
            }
        } catch {}
    }

    clear() {
        this.pendingActions = [];
        localStorage.removeItem('optimistic_queue');
    }
}

// ========== EXPORTS ==========

export const reconnectCoordinator = new ReconnectCoordinator();
export const backgroundSync = new BackgroundSyncManager();
export const realtimeHealth = new RealtimeHealthMonitor();
export const memoryPressure = new MemoryPressureManager();
export const batterySync = new BatteryAwareSync();
export const offlineUploads = new OfflineUploadQueue();
export const optimisticReplay = new OptimisticReplayQueue();
