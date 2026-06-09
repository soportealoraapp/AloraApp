/**
 * Alora
 * © 2026 Alora Team. All rights reserved.
 *
 * Soporte: soporte.alora.app@gmail.com
 *
 * Desarrollado por:
 * - Alejandro Pérez Vázquez (CEO y fundador)
 * - Caleb Zacarías García
 * - Juan Carlos Moreno López
 * - Erik Barrera Barrera
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
    level: LogLevel;
    message: string;
    requestId?: string;
    userId?: string;
    route?: string;
    duration?: number;
    metadata?: Record<string, any>;
    timestamp: string;
}

class Logger {
    private requestIdCounter = 0;

    generateRequestId(): string {
        return `req_${++this.requestIdCounter}_${Date.now().toString(36)}`;
    }

    private log(level: LogLevel, message: string, meta?: Partial<LogEntry>) {
        const entry: LogEntry = {
            level,
            message,
            timestamp: new Date().toISOString(),
            ...meta,
        };

        const prefix = `[${entry.timestamp}] [${level.toUpperCase()}]`;
        const suffix = meta?.requestId ? ` (${meta.requestId})` : '';

        switch (level) {
            case 'error':
                console.error(`${prefix}${suffix}`, message, meta?.metadata || '');
                break;
            case 'warn':
                console.warn(`${prefix}${suffix}`, message, meta?.metadata || '');
                break;
            case 'debug':
                console.debug(`${prefix}${suffix}`, message, meta?.metadata || '');
                break;
            default:
                console.log(`${prefix}${suffix}`, message, meta?.metadata || '');
        }

        // In production, could send to external logging service
        if (level === 'error') {
            this.captureError(entry);
        }
    }

    private async captureError(entry: LogEntry) {
        // Placeholder for Sentry/Error tracking integration
        // Example: await Sentry.captureException(new Error(entry.message), { extra: entry });
        try {
            // Store critical errors in audit log for observability
            const { prisma } = await import('@/lib/prisma');
            await prisma.auditLog.create({
                data: {
                    userId: entry.userId || undefined,
                    action: `error:${entry.route || 'unknown'}`,
                    details: { message: entry.message, metadata: entry.metadata, level: entry.level },
                }
            }).catch(() => {});
        } catch {
            // Silently fail
        }
    }

    info(message: string, meta?: Partial<LogEntry>) { this.log('info', message, meta); }
    warn(message: string, meta?: Partial<LogEntry>) { this.log('warn', message, meta); }
    error(message: string, meta?: Partial<LogEntry>) { this.log('error', message, meta); }
    debug(message: string, meta?: Partial<LogEntry>) { this.log('debug', message, meta); }

    apiRoute(route: string, duration: number, status: number, userId?: string) {
        const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
        this.log(level, `API ${route} → ${status} (${duration}ms)`, {
            route,
            duration,
            userId,
            metadata: { status },
        });
    }

    performance(operation: string, duration: number, meta?: Record<string, any>) {
        if (duration > 1000) {
            this.warn(`Slow operation: ${operation}`, { duration, metadata: { ...meta, duration } });
        } else {
            this.debug(`Perf: ${operation}`, { duration, metadata: { ...meta, duration } });
        }
    }
}

export const logger = new Logger();
