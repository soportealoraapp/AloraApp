import { logger } from './logger';

export function trackPerformance<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    return fn().finally(() => {
        const duration = Date.now() - start;
        logger.performance(operation, duration);
    });
}

export function createPerformanceMiddleware() {
    return async function perfMiddleware(request: Request, handler: () => Promise<Response>): Promise<Response> {
        const start = Date.now();
        const url = new URL(request.url);
        try {
            const response = await handler();
            const duration = Date.now() - start;
            logger.apiRoute(url.pathname, duration, response.status);
            return response;
        } catch (error) {
            const duration = Date.now() - start;
            logger.error(`API error ${url.pathname}`, {
                route: url.pathname,
                duration,
                metadata: { error: String(error) },
            });
            throw error;
        }
    };
}

export function logDBQuery(model: string, duration: number) {
    if (duration > 500) {
        logger.warn(`Slow DB query on ${model}`, { duration, metadata: { model, duration } });
    }
}
