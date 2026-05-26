'use server';

import { prisma } from '@/lib/prisma';
import { cache } from '@/server/cache/redis';

// ========== TRACING ==========

export interface TraceSpan {
    name: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    metadata?: Record<string, any>;
    children: TraceSpan[];
}

export class Tracer {
    private spans: TraceSpan[] = [];
    private currentSpan: TraceSpan | null = null;
    private requestId: string;

    constructor(requestId?: string) {
        this.requestId = requestId || `trace_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }

    startSpan(name: string, metadata?: Record<string, any>): TraceSpan {
        const span: TraceSpan = {
            name,
            startTime: Date.now(),
            children: [],
            metadata,
        };
        this.spans.push(span);
        this.currentSpan = span;
        return span;
    }

    endSpan(span?: TraceSpan): void {
        const s = span || this.currentSpan;
        if (s) {
            s.endTime = Date.now();
            s.duration = s.endTime - s.startTime;
        }
    }

    addMetadata(key: string, value: any): void {
        if (this.currentSpan) {
            this.currentSpan.metadata = { ...this.currentSpan.metadata, [key]: value };
        }
    }

    getReport(): { requestId: string; totalDuration: number; spans: TraceSpan[] } {
        const totalDuration = this.spans.length > 0
            ? Math.max(...this.spans.filter(s => s.endTime).map(s => s.endTime!)) - Math.min(...this.spans.map(s => s.startTime))
            : 0;
        return {
            requestId: this.requestId,
            totalDuration,
            spans: this.spans,
        };
    }
}

// ========== HEALTH MONITOR ==========

export interface HealthStatus {
    status: 'healthy' | 'degraded' | 'critical';
    components: {
        database: { status: 'up' | 'down'; latency: number };
        cache: { status: 'up' | 'down'; hitRate: number };
        queue: { status: 'healthy' | 'degraded' | 'stuck'; pending: number; failed: number };
        websocket: { status: 'healthy' | 'degraded' | 'down'; activeConnections: number };
        ai: { status: 'healthy' | 'degraded'; latency: number; errorRate: number };
        push: { status: 'healthy' | 'degraded'; deliveryRate: number };
    };
    lastChecked: Date;
}

export class HealthMonitor {
    async check(): Promise<HealthStatus> {
        const start = Date.now();
        let dbStatus: 'up' | 'down' = 'up';
        let dbLatency = 0;

        try {
            const dbStart = Date.now();
            await prisma.$queryRaw`SELECT 1`;
            dbLatency = Date.now() - dbStart;
        } catch {
            dbStatus = 'down';
        }

        const cacheStats = cache.getStats?.() || { size: 0, maxSize: 0 };
        const queuePending = await prisma.job.count({ where: { status: 'pending' } }).catch(() => -1);
        const queueFailed = await prisma.job.count({ where: { status: 'failed' } }).catch(() => -1);

        let queueStatus: 'healthy' | 'degraded' | 'stuck' = 'healthy';
        if (queueFailed > 10) queueStatus = 'degraded';
        if (queueFailed > 50) queueStatus = 'stuck';
        if (queuePending === -1) queueStatus = 'stuck';

        // Determine overall status
        const componentsDown = [dbStatus].filter(s => s === 'down').length;
        const overallStatus: HealthStatus['status'] =
            componentsDown > 0 ? 'critical' :
            queueStatus === 'stuck' ? 'critical' :
            queueStatus === 'degraded' ? 'degraded' :
            'healthy';

        return {
            status: overallStatus,
            components: {
                database: { status: dbStatus, latency: dbLatency },
                cache: { status: 'up', hitRate: cacheStats.size / Math.max(1, cacheStats.maxSize) },
                queue: { status: queueStatus, pending: Math.max(0, queuePending), failed: Math.max(0, queueFailed) },
                websocket: { status: 'healthy', activeConnections: 0 },
                ai: { status: 'healthy', latency: 0, errorRate: 0 },
                push: { status: 'healthy', deliveryRate: 1 },
            },
            lastChecked: new Date(),
        };
    }
}

export const healthMonitor = new HealthMonitor();

// ========== INCIDENT MANAGER ==========

export type IncidentType =
    | 'reconnect_spike'
    | 'notification_failure'
    | 'queue_deadlock'
    | 'realtime_outage'
    | 'ai_timeout'
    | 'db_degradation';

export class IncidentManager {
    async report(type: IncidentType, source: string, message: string, details?: Record<string, any>): Promise<void> {
        const severity = this.calculateSeverity(type, details);

        await prisma.incident.create({
            data: {
                type,
                severity,
                source,
                message,
                details: details as any,
            },
        });

        // Auto-actions based on severity
        if (severity === 'critical') {
            await this.executeAutoActions(type, details);
        }
    }

    private calculateSeverity(type: IncidentType, details?: Record<string, any>): string {
        switch (type) {
            case 'reconnect_spike':
                return (details?.count || 0) > 100 ? 'critical' : (details?.count || 0) > 50 ? 'warning' : 'info';
            case 'notification_failure':
                return (details?.failureRate || 0) > 0.3 ? 'critical' : (details?.failureRate || 0) > 0.1 ? 'warning' : 'info';
            case 'queue_deadlock':
                return 'critical';
            case 'realtime_outage':
                return (details?.duration || 0) > 300 ? 'critical' : (details?.duration || 0) > 60 ? 'warning' : 'info';
            case 'ai_timeout':
                return (details?.timeoutCount || 0) > 20 ? 'critical' : (details?.timeoutCount || 0) > 5 ? 'warning' : 'info';
            case 'db_degradation':
                return (details?.latency || 0) > 5000 ? 'critical' : (details?.latency || 0) > 1000 ? 'warning' : 'info';
            default:
                return 'info';
        }
    }

    private async executeAutoActions(type: IncidentType, details?: Record<string, any>): Promise<void> {
        switch (type) {
            case 'queue_deadlock':
                // Attempt to recover stuck jobs
                await prisma.job.updateMany({
                    where: { status: 'processing', startedAt: { lt: new Date(Date.now() - 300000) } },
                    data: { status: 'pending', error: 'Auto-recovered from deadlock', retries: { increment: 1 } },
                });
                break;
            case 'ai_timeout':
                // Disable non-critical AI processing
                await prisma.job.updateMany({
                    where: { type: 'ai_coaching', status: 'pending' },
                    data: { priority: 5 }, // Lower priority
                });
                break;
            case 'db_degradation':
                // Pause expensive jobs
                await prisma.job.updateMany({
                    where: {
                        type: { in: ['process_analytics', 'generate_nudges'] },
                        status: 'pending',
                    },
                    data: { priority: 5 },
                });
                break;
        }
    }

    async getActiveIncidents(limit: number = 20): Promise<{
        id: string; type: string; severity: string; message: string; createdAt: Date;
    }[]> {
        const incidents = await prisma.incident.findMany({
            where: { resolvedAt: null },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
        return incidents.map(i => ({
            id: i.id,
            type: i.type,
            severity: i.severity,
            message: i.message,
            createdAt: i.createdAt,
        }));
    }

    async resolveIncident(id: string): Promise<void> {
        await prisma.incident.update({
            where: { id },
            data: { resolvedAt: new Date(), autoResolved: true },
        });
    }

    async autoResolveOldIncidents(): Promise<number> {
        const result = await prisma.incident.updateMany({
            where: {
                severity: 'info',
                createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
                resolvedAt: null,
            },
            data: { resolvedAt: new Date(), autoResolved: true },
        });
        return result.count;
    }
}

export const incidentManager = new IncidentManager();

// ========== METRICS COLLECTOR ==========

export class MetricsCollector {
    private counters = new Map<string, number>();
    private latencies = new Map<string, number[]>();
    private hourlyBuckets = new Map<string, Map<string, number>>();

    increment(counter: string, value: number = 1): void {
        this.counters.set(counter, (this.counters.get(counter) || 0) + value);

        const hour = new Date().toISOString().slice(0, 13);
        if (!this.hourlyBuckets.has(hour)) {
            this.hourlyBuckets.set(hour, new Map());
        }
        const bucket = this.hourlyBuckets.get(hour)!;
        bucket.set(counter, (bucket.get(counter) || 0) + value);
    }

    recordLatency(operation: string, durationMs: number): void {
        if (!this.latencies.has(operation)) {
            this.latencies.set(operation, []);
        }
        const arr = this.latencies.get(operation)!;
        arr.push(durationMs);
        if (arr.length > 1000) arr.shift(); // Keep last 1000
    }

    getCounter(name: string): number {
        return this.counters.get(name) || 0;
    }

    getAverageLatency(operation: string): number {
        const arr = this.latencies.get(operation);
        if (!arr || arr.length === 0) return 0;
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    }

    getP95Latency(operation: string): number {
        const arr = this.latencies.get(operation);
        if (!arr || arr.length === 0) return 0;
        const sorted = [...arr].sort((a, b) => a - b);
        return sorted[Math.floor(sorted.length * 0.95)];
    }

    getReport(): Record<string, any> {
        const latencies: Record<string, { avg: number; p95: number; count: number }> = {};
        for (const [op, vals] of this.latencies) {
            latencies[op] = {
                avg: Math.round(this.getAverageLatency(op)),
                p95: Math.round(this.getP95Latency(op)),
                count: vals.length,
            };
        }

        return {
            counters: Object.fromEntries(this.counters),
            latencies,
            cache: cache.getStats(),
        };
    }
}

export const metrics = new MetricsCollector();

// ========== MONITORED OPERATIONS ==========

export async function monitoredQuery<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>,
): Promise<T> {
    const start = Date.now();
    try {
        const result = await fn();
        const duration = Date.now() - start;
        metrics.recordLatency(operation, duration);

        // Alert on slow queries
        if (duration > 1000) {
            await incidentManager.report('db_degradation', 'query', `Slow query: ${operation}`, {
                ...metadata,
                duration,
            });
        }

        return result;
    } catch (error: any) {
        metrics.increment(`error:${operation}`);
        throw error;
    }
}
